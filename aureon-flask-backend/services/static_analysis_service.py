import subprocess
import json
import tempfile
import os
from radon.complexity import cc_visit, cc_rank
from radon.metrics import mi_visit
from extensions import db
from models import CodeAnalysis, CodeAnalysisIssue, CodeMetrics

class StaticAnalysisService:
    """
    Non-AI Static Code Analyzer using Pylint and Radon.
    Analyzes Python files for errors, complexity, and maintainability index.
    """

    @classmethod
    def analyze_source_code(cls, repository_id, file_content, file_name="sample.py"):
        with tempfile.NamedTemporaryFile(suffix=".py", mode="w+", delete=False) as tmp:
            tmp.write(file_content)
            tmp_path = tmp.name

        issues = []
        metrics = []
        overall_score = 10.0

        try:
            # ━━━ 1. RADON COMPLEXITY ANALYSIS ━━━
            blocks = cc_visit(file_content)
            max_complexity = 1
            for b in blocks:
                rank = cc_rank(b.complexity)
                if b.complexity > max_complexity:
                    max_complexity = b.complexity

            mi_score = mi_visit(file_content, multi=True)

            metric_entry = {
                'file_path': file_name,
                'cyclomatic_complexity': max_complexity,
                'complexity_rank': cc_rank(max_complexity),
                'loc': len(file_content.splitlines()),
                'maintainability_index': round(mi_score, 2)
            }
            metrics.append(metric_entry)

            # ━━━ 2. PYLINT ANALYSIS ━━━
            try:
                cmd = ["pylint", tmp_path, "--output-format=json"]
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
                if result.stdout:
                    pylint_data = json.loads(result.stdout)
                    for item in pylint_data:
                        issues.append({
                            'file_path': file_name,
                            'line_number': item.get('line', 1),
                            'issue_type': item.get('type', 'convention').upper(),
                            'message_id': item.get('message-id', 'C000'),
                            'description': item.get('message', 'Pylint finding'),
                            'severity': 'HIGH' if item.get('type') in ['error', 'fatal'] else 'MEDIUM'
                        })
            except Exception:
                pass

            # Calculate overall score
            error_count = len([i for i in issues if i['issue_type'] in ['ERROR', 'FATAL']])
            warning_count = len([i for i in issues if i['issue_type'] == 'WARNING'])
            overall_score = max(0.0, round(10.0 - (error_count * 1.5) - (warning_count * 0.4) - (max_complexity * 0.2), 2))

        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

        # Save analysis to database
        analysis = CodeAnalysis(
            repository_id=repository_id,
            tool_name='PYLINT_RADON',
            status='PASSED' if overall_score >= 7.0 else ('WARNING' if overall_score >= 5.0 else 'FAILED'),
            quality_score=overall_score
        )
        db.session.add(analysis)
        db.session.flush()

        for m in metrics:
            cm = CodeMetrics(
                analysis_id=analysis.id,
                file_path=m['file_path'],
                cyclomatic_complexity=m['cyclomatic_complexity'],
                complexity_rank=m['complexity_rank'],
                loc=m['loc'],
                maintainability_index=m['maintainability_index']
            )
            db.session.add(cm)

        for i in issues:
            cai = CodeAnalysisIssue(
                analysis_id=analysis.id,
                file_path=i['file_path'],
                line_number=i['line_number'],
                issue_type=i['issue_type'],
                message_id=i['message_id'],
                description=i['description'],
                severity=i['severity']
            )
            db.session.add(cai)

        db.session.commit()

        return {
            'analysis_id': analysis.id,
            'tool': 'Pylint + Radon',
            'score': overall_score,
            'metrics': metrics,
            'issues_count': len(issues),
            'issues': issues
        }
