from extensions import db
from models import Project, Task, Risk, CodeAnalysis

class HealthCalculator:
    """
    Deterministic Project Health Score Calculator (0-100).
    Aggregates task completion, delays, code quality, open risks, and repository activity.
    """

    @classmethod
    def calculate_health_score(cls, project_id):
        project = Project.query.get(project_id)
        if not project:
            return 80

        score = 100.0

        # 1. Task Completion & Delay Impact (-0 to -35)
        tasks = Task.query.filter_by(project_id=project_id).all()
        if tasks:
            completed_tasks = [t for t in tasks if t.status == 'COMPLETED']
            completion_ratio = len(completed_tasks) / len(tasks)
            
            # Deduct for incomplete overdue tasks
            overdue_count = len([t for t in tasks if t.status != 'COMPLETED' and t.due_date and str(t.due_date) < str(Project.query.get(project_id).created_at.date())])
            score -= (overdue_count * 8)
            
            # Reward high completion ratio
            score += (completion_ratio * 10)
        
        # 2. Risk Severity Deductions (-0 to -40)
        open_risks = Risk.query.filter_by(project_id=project_id, status='OPEN').all()
        for risk in open_risks:
            if risk.severity == 'CRITICAL':
                score -= 18
            elif risk.severity == 'HIGH':
                score -= 10
            elif risk.severity == 'MEDIUM':
                score -= 5
            elif risk.severity == 'LOW':
                score -= 2

        # 3. Static Code Quality Impact (-0 to -25)
        analyses = CodeAnalysis.query.join(Project, Project.id == project_id).all()
        if analyses:
            avg_score = sum(a.quality_score for a in analyses) / len(analyses)
            if avg_score < 7.0:
                score -= (7.0 - avg_score) * 5

        # Clamp score between 0 and 100
        final_score = int(max(0, min(100, round(score))))
        
        # Update project record
        project.health_score = final_score
        db.session.commit()

        return {
            'score': final_score,
            'status': cls.classify_health(final_score),
            'open_risks_count': len(open_risks),
            'total_tasks': len(tasks)
        }

    @staticmethod
    def classify_health(score):
        if score >= 80:
            return 'Healthy'
        elif score >= 60:
            return 'Moderate'
        elif score >= 40:
            return 'At Risk'
        else:
            return 'Critical'
