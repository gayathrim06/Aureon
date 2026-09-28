from extensions import db
from models import Project, Task, Risk, CodeAnalysis, Sprint, Notification, ProjectHealthHistory, Repository, CodeQualityReport
from services.github_risk_service import GitHubRiskService
from datetime import date, datetime

class HealthCalculator:
    """
    Deterministic, Rule-Based Project Health Score Calculator (0-100).
    Strictly Non-AI. Aggregates:
    - Sprint completion rate & deterministic sprint scores
    - Overdue tasks and critical overdue tasks
    - Carry-forward tasks
    - Task completion ratio
    - Blocked tasks
    - Open project risks and static code quality
    """

    @classmethod
    def calculate_health_score(cls, project_id, explicit_request=False):
        """Calculate overall project health.
        Returns a detailed dict with component scores, overall score, status, risks and timestamp.
        """
        project = Project.query.get(project_id)
        if not project:
            return {'overall_score': None, 'overall_status': 'NO_DATA', 'components': {}, 'risks': [], 'calculated_at': datetime.utcnow().isoformat()}

        # Pillar calculations
        sprint_res = cls._calculate_sprint_task_score(project_id)
        github_res = cls._calculate_github_score(project_id)
        code_quality_res = cls._calculate_code_quality_score(project_id)
        eng_risk_res = cls._calculate_engineering_risk_score(project_id)

        components = {
            'sprint_task': sprint_res,
            'github': github_res,
            'code_quality': code_quality_res,
            'engineering_risk': eng_risk_res,
        }

        # Determine availability and normalize weights
        base_weights = {
            'sprint_task': 30,
            'github': 25,
            'code_quality': 25,
            'engineering_risk': 20,
        }
        available = {k: v['available'] for k, v in components.items()}
        total_weight = sum(w for k, w in base_weights.items() if available.get(k))
        if total_weight == 0:
            overall = {'overall_score': None, 'overall_status': 'NO_DATA', 'components': components, 'risks': [], 'calculated_at': datetime.utcnow().isoformat()}
            cls._persist_snapshot(project_id, overall, explicit_request)
            return overall

        # Normalized weights
        norm_weights = {k: (base_weights[k] / total_weight * 100) if available.get(k) else 0 for k in base_weights}

        # Compute weighted overall score
        overall_score = 0.0
        all_risks = []
        for key, comp in components.items():
            if comp['available']:
                overall_score += comp['score'] * (norm_weights[key] / 100.0)
                all_risks.extend(comp.get('risks', []))
        overall_score = round(overall_score)
        overall_status = cls.classify_health(overall_score) if overall_score is not None else 'NO_DATA'

        result = {
            'overall_score': overall_score,
            'overall_status': overall_status,
            'components': {k: {**v, 'weight': norm_weights[k]} for k, v in components.items()},
            'risks': all_risks,
            'calculated_at': datetime.utcnow().isoformat()
        }

        # Persist snapshot and send alerts
        cls._persist_snapshot(project_id, result, explicit_request)
        return result

    @staticmethod
    def _calculate_sprint_task_score(project_id):
        sprints = Sprint.query.filter_by(project_id=project_id).all()
        tasks = Task.query.filter_by(project_id=project_id).all()

        if not sprints and not tasks:
            return {'score': None, 'available': False, 'risks': []}

        risks = []

        # 1. Deterministic Sprint Scores
        sprint_scores = []
        for s in sprints:
            s_dict = s.to_dict()
            s_score = s_dict.get('sprint_score', 100)
            sprint_scores.append(s_score)
            if s_score < 50:
                risks.append(f"Sprint '{s.name}' has low sprint health score ({s_score}/100)")

        avg_sprint_score = (sum(sprint_scores) / len(sprint_scores)) if sprint_scores else 100.0

        # 2. Project Tasks Metrics
        total_tasks = len(tasks)
        completed_tasks = [t for t in tasks if t.status in ('COMPLETED', 'DONE')]
        overdue_tasks = [t for t in tasks if t.is_overdue]
        blocked_tasks = [t for t in tasks if t.status == 'BLOCKED']

        task_comp_rate = (len(completed_tasks) / total_tasks * 100.0) if total_tasks > 0 else 100.0

        if len(overdue_tasks) > 0:
            risks.append(f"{len(overdue_tasks)} task(s) currently overdue in project")
        if len(blocked_tasks) > 0:
            risks.append(f"{len(blocked_tasks)} task(s) currently blocked in project")

        # 3. Carry-Forward Tasks
        total_carry_forward = sum((s.carry_forward_tasks_count or 0) for s in sprints)
        if total_carry_forward > 0:
            risks.append(f"{total_carry_forward} incomplete task(s) carried forward across sprints")

        # 4. Composite Formula
        if sprints and tasks:
            raw_score = 0.50 * avg_sprint_score + 0.50 * task_comp_rate
        elif sprints:
            raw_score = avg_sprint_score
        else:
            raw_score = task_comp_rate

        overdue_penalty = min(20.0, len(overdue_tasks) * 2.0)
        carry_penalty = min(15.0, total_carry_forward * 2.0)
        blocked_penalty = min(15.0, len(blocked_tasks) * 3.0)

        final_score = max(0, min(100, round(raw_score - overdue_penalty - carry_penalty - blocked_penalty)))

        return {
            'score': final_score,
            'available': True,
            'avg_sprint_score': round(avg_sprint_score, 1),
            'task_completion_rate': round(task_comp_rate, 1),
            'total_sprints': len(sprints),
            'total_tasks': total_tasks,
            'completed_tasks': len(completed_tasks),
            'overdue_tasks': len(overdue_tasks),
            'blocked_tasks': len(blocked_tasks),
            'carry_forward_tasks': total_carry_forward,
            'risks': risks
        }

    @staticmethod
    def _calculate_github_score(project_id):
        repo = Repository.query.filter_by(project_id=project_id).first()
        if not repo:
            return {'score': None, 'available': False, 'risks': []}
        # Gather related data
        commits = []  # Simplified: assume commits are collected elsewhere
        pull_requests = []
        contributors = []
        # Evaluate using existing service
        res = GitHubRiskService.evaluate_repository_risks(repo, commits, pull_requests, contributors)
        return {'score': res.get('health_score'), 'available': True, 'risks': res.get('risks', [])}

    @staticmethod
    def _calculate_code_quality_score(project_id):
        reports = CodeQualityReport.query.filter_by(project_id=project_id).all()
        if not reports:
            return {'score': None, 'available': False}
        avg_quality = sum(r.quality_score for r in reports) / len(reports)
        # Simple scaling: higher quality => higher score (0‑100)
        score = max(0, min(100, avg_quality))
        return {'score': round(score), 'available': True}

    @staticmethod
    def _calculate_engineering_risk_score(project_id):
        risks = Risk.query.filter_by(project_id=project_id, status='OPEN').all()
        if not risks:
            return {'score': None, 'available': False, 'risks': []}
        score = 100.0
        risk_risks = []
        for r in risks:
            if r.severity == 'CRITICAL':
                score -= 15.0
                risk_risks.append(r)
            elif r.severity == 'HIGH':
                score -= 8.0
                risk_risks.append(r)
            elif r.severity == 'MEDIUM':
                score -= 4.0
                risk_risks.append(r)
            elif r.severity == 'LOW':
                score -= 2.0
                risk_risks.append(r)
        return {'score': round(max(0, score)), 'available': True, 'risks': [r.to_dict() for r in risk_risks]}

    @staticmethod
    def _persist_snapshot(project_id, payload, explicit):
        # Throttling logic: always persist on explicit request, otherwise only on significant change or time delta
        from services.health_alert_service import HealthAlertService
        last = HealthAlertService._last_snapshot(project_id)
        should_save = explicit
        if not explicit and last:
            score_changed = abs((last.get('overall_score') or 0) - (payload.get('overall_score') or 0)) >= 3
            time_elapsed = datetime.utcnow() - datetime.fromisoformat(last.get('calculated_at'))
            should_save = score_changed or time_elapsed.total_seconds() >= 900
        if should_save:
            hist = ProjectHealthHistory(
                project_id=project_id,
                overall_score=payload.get('overall_score'),
                health_status=payload.get('overall_status'),
                sprint_task_score=payload['components']['sprint_task'].get('score'),
                github_score=payload['components']['github'].get('score'),
                code_quality_score=payload['components']['code_quality'].get('score'),
                engineering_risk_score=payload['components']['engineering_risk'].get('score'),
                metrics_breakdown=payload.get('components'),
                calculated_at=datetime.utcnow()
            )
            db.session.add(hist)
            db.session.commit()
            # Notify if needed
            HealthAlertService.maybe_send_alert(project_id, last, payload)

    @staticmethod
    def classify_health(score):
        if score >= 80:
            return 'HEALTHY'
        elif score >= 60:
            return 'WARNING'
        elif score >= 40:
            return 'AT_RISK'
        else:
            return 'CRITICAL'
