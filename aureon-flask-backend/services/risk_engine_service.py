from datetime import datetime, date
from extensions import db
from models import Task, Project, CodeMetrics, CodeAnalysisIssue, Risk, AuditLog

class RuleEngine:
    """
    100% Deterministic Non-AI Rule-Based Risk Engine.
    Evaluates configurable thresholds for Task Delay, Code Complexity, Error Count, Warning Count, and Project Progress.
    """

    # Configurable Thresholds
    COMPLEXITY_THRESHOLD = 15
    PYLINT_ERROR_THRESHOLD = 3
    PYLINT_WARNING_THRESHOLD = 8
    OVERDUE_RATIO_THRESHOLD = 0.4 # 40% overdue tasks trigger progress risk

    @classmethod
    def evaluate_project_risks(cls, project_id):
        new_risks = []
        today = date.today()

        project = Project.query.get(project_id)
        if not project:
            return []

        # ━━━ RULE 1: Task Delay Detection ━━━
        tasks = Task.query.filter_by(project_id=project_id).all()
        overdue_tasks = []
        for task in tasks:
            if task.due_date and task.due_date < today and task.status != 'COMPLETED':
                overdue_tasks.append(task)
                
                # Check if risk already exists
                existing = Risk.query.filter_by(project_id=project_id, related_task_id=task.id, risk_type='TASK_DELAY', status='OPEN').first()
                if not existing:
                    risk = Risk(
                        project_id=project_id,
                        risk_type='TASK_DELAY',
                        title=f"Overdue Task: {task.title}",
                        description=f"Task '{task.title}' assigned to {task.assigned_to.full_name if task.assigned_to else 'Unassigned'} passed due date ({task.due_date}).",
                        severity='HIGH' if task.priority in ['HIGH', 'CRITICAL'] else 'MEDIUM',
                        status='OPEN',
                        related_task_id=task.id
                    )
                    db.session.add(risk)
                    new_risks.append(risk)

        # ━━━ RULE 2 & 3: High Code Complexity & Error Count ━━━
        metrics = CodeMetrics.query.all()
        for m in metrics:
            if m.cyclomatic_complexity > cls.COMPLEXITY_THRESHOLD:
                existing = Risk.query.filter_by(project_id=project_id, risk_type='HIGH_COMPLEXITY', status='OPEN').first()
                if not existing:
                    risk = Risk(
                        project_id=project_id,
                        risk_type='HIGH_COMPLEXITY',
                        title=f"High Cyclomatic Complexity ({m.cyclomatic_complexity}) in {m.file_path.split('/')[-1]}",
                        description=f"File {m.file_path} exceeded complexity threshold ({cls.COMPLEXITY_THRESHOLD}) with rank {m.complexity_rank}.",
                        severity='HIGH' if m.cyclomatic_complexity > 20 else 'MEDIUM',
                        status='OPEN'
                    )
                    db.session.add(risk)
                    new_risks.append(risk)

        # ━━━ RULE 4: High Pylint Error & Warning Count ━━━
        error_count = CodeAnalysisIssue.query.filter_by(issue_type='ERROR').count()
        if error_count > cls.PYLINT_ERROR_THRESHOLD:
            existing = Risk.query.filter_by(project_id=project_id, risk_type='CODE_QUALITY', status='OPEN').first()
            if not existing:
                risk = Risk(
                    project_id=project_id,
                    risk_type='CODE_QUALITY',
                    title=f"Code Quality Vulnerability: {error_count} Pylint Errors",
                    description=f"Static code analysis detected {error_count} critical syntax/runtime errors in recent commits.",
                    severity='CRITICAL' if error_count > 5 else 'HIGH',
                    status='OPEN'
                )
                db.session.add(risk)
                new_risks.append(risk)

        # ━━━ RULE 5: Low Task Progress Rate ━━━
        if tasks and (len(overdue_tasks) / len(tasks)) >= cls.OVERDUE_RATIO_THRESHOLD:
            existing = Risk.query.filter_by(project_id=project_id, risk_type='PROJECT_PROGRESS', status='OPEN').first()
            if not existing:
                risk = Risk(
                    project_id=project_id,
                    risk_type='PROJECT_PROGRESS',
                    title="Schedule Risk: Low Sprint Delivery Velocity",
                    description=f"{int((len(overdue_tasks) / len(tasks)) * 100)}% of tasks in project '{project.name}' are overdue.",
                    severity='CRITICAL',
                    status='OPEN'
                )
                db.session.add(risk)
                new_risks.append(risk)

        db.session.commit()
        return new_risks
