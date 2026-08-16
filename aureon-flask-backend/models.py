from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db

# ━━━ 1. ROLES & PERMISSIONS ━━━
class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False) # ROLE_ADMIN, ROLE_PM, ROLE_LEAD, ROLE_DEV
    description = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'description': self.description}

class Permission(db.Model):
    __tablename__ = 'permissions'
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.String(255), nullable=True)

class RolePermission(db.Model):
    __tablename__ = 'role_permissions'
    id = db.Column(db.Integer, primary_key=True)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id', ondelete='CASCADE'), nullable=False)
    permission_id = db.Column(db.Integer, db.ForeignKey('permissions.id', ondelete='CASCADE'), nullable=False)


# ━━━ 2. USER MODEL ━━━
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    role_name = db.Column(db.String(50), nullable=False, default='ROLE_DEV')
    designation = db.Column(db.String(100), nullable=True)
    department = db.Column(db.String(100), nullable=True)
    status = db.Column(db.String(20), nullable=False, default='ACTIVE') # ACTIVE, INACTIVE, LOCKED
    failed_logins = db.Column(db.Integer, default=0)
    lockout_until = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': f"usr_{self.id}",
            'user_id': self.id,
            'name': self.full_name,
            'full_name': self.full_name,
            'email': self.email,
            'role': self.role_name,
            'title': self.designation or 'Team Member',
            'department': self.department or 'Engineering',
            'status': self.status,
            'failedLogins': self.failed_logins,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'lastActive': 'Just now' if self.last_login else 'Offline'
        }


# ━━━ 3. PROJECTS & MEMBERS ━━━
class Project(db.Model):
    __tablename__ = 'projects'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    code = db.Column(db.String(30), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(30), nullable=False, default='IN_PROGRESS') # ACTIVE, IN_PROGRESS, COMPLETED, ARCHIVED
    priority = db.Column(db.String(20), nullable=False, default='HIGH') # LOW, MEDIUM, HIGH, CRITICAL
    health_score = db.Column(db.Integer, default=90) # 0-100 deterministic
    start_date = db.Column(db.Date, nullable=True)
    due_date = db.Column(db.Date, nullable=True)
    manager_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    manager = db.relationship('User', foreign_keys=[manager_id])

    def to_dict(self):
        return {
            'id': f"prj_{self.id}",
            'project_id': self.id,
            'name': self.name,
            'code': self.code,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'health_score': self.health_score,
            'healthScore': self.health_score,
            'start_date': str(self.start_date) if self.start_date else None,
            'due_date': str(self.due_date) if self.due_date else None,
            'manager_id': self.manager_id,
            'manager_name': self.manager.full_name if self.manager else 'Unassigned',
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class ProjectMember(db.Model):
    __tablename__ = 'project_members'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    role_in_project = db.Column(db.String(50), default='CONTRIBUTOR')
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User')


# ━━━ 4. TEAMS & MEMBERS ━━━
class Team(db.Model):
    __tablename__ = 'teams'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    lead_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    department = db.Column(db.String(100), default='Core Engineering')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    lead = db.relationship('User', foreign_keys=[lead_id])

    def to_dict(self):
        return {
            'id': f"team_{self.id}",
            'team_id': self.id,
            'name': self.name,
            'project_id': self.project_id,
            'lead_id': self.lead_id,
            'lead_name': self.lead.full_name if self.lead else 'Unassigned',
            'department': self.department
        }

class TeamMember(db.Model):
    __tablename__ = 'team_members'
    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User')


# ━━━ 5. TASKS & STATUS HISTORY ━━━
class Task(db.Model):
    __tablename__ = 'tasks'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id', ondelete='SET NULL'), nullable=True)
    assigned_to_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    priority = db.Column(db.String(20), nullable=False, default='MEDIUM') # LOW, MEDIUM, HIGH, CRITICAL
    status = db.Column(db.String(30), nullable=False, default='IN_PROGRESS') # PENDING, IN_PROGRESS, COMPLETED, BLOCKED, CANCELLED
    estimated_hours = db.Column(db.Float, default=8.0)
    actual_hours = db.Column(db.Float, default=0.0)
    start_date = db.Column(db.Date, nullable=True)
    due_date = db.Column(db.Date, nullable=True)
    completion_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assigned_to = db.relationship('User', foreign_keys=[assigned_to_id])
    created_by = db.relationship('User', foreign_keys=[created_by_id])
    project = db.relationship('Project', foreign_keys=[project_id])

    def to_dict(self):
        return {
            'id': f"tsk_{self.id}",
            'task_id': self.id,
            'title': self.title,
            'description': self.description,
            'project_id': self.project_id,
            'project_name': self.project.name if self.project else 'Core Platform',
            'team_id': self.team_id,
            'assigned_to_id': self.assigned_to_id,
            'assignee_name': self.assigned_to.full_name if self.assigned_to else 'Unassigned',
            'created_by_id': self.created_by_id,
            'priority': self.priority,
            'status': self.status,
            'estimated_hours': self.estimated_hours,
            'actual_hours': self.actual_hours,
            'start_date': str(self.start_date) if self.start_date else None,
            'due_date': str(self.due_date) if self.due_date else None,
            'completion_date': str(self.completion_date) if self.completion_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class TaskStatusHistory(db.Model):
    __tablename__ = 'task_status_history'
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False)
    changed_by_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    old_status = db.Column(db.String(30), nullable=False)
    new_status = db.Column(db.String(30), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)


# ━━━ 6. REPOSITORIES & COMMITS ━━━
class Repository(db.Model):
    __tablename__ = 'repositories'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    url = db.Column(db.String(255), nullable=False)
    owner = db.Column(db.String(100), nullable=False, default='aureon-org')
    default_branch = db.Column(db.String(50), default='main')
    connection_status = db.Column(db.String(30), default='CONNECTED')
    last_synced_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': f"repo_{self.id}",
            'repository_id': self.id,
            'project_id': self.project_id,
            'name': self.name,
            'url': self.url,
            'owner': self.owner,
            'default_branch': self.default_branch,
            'status': self.connection_status,
            'last_synced_at': self.last_synced_at.isoformat() if self.last_synced_at else None
        }

class RepositoryBranch(db.Model):
    __tablename__ = 'repository_branches'
    id = db.Column(db.Integer, primary_key=True)
    repository_id = db.Column(db.Integer, db.ForeignKey('repositories.id', ondelete='CASCADE'), nullable=False)
    branch_name = db.Column(db.String(100), nullable=False)
    is_default = db.Column(db.Boolean, default=False)
    last_commit_hash = db.Column(db.String(100), nullable=True)

class Commit(db.Model):
    __tablename__ = 'commits'
    id = db.Column(db.Integer, primary_key=True)
    repository_id = db.Column(db.Integer, db.ForeignKey('repositories.id', ondelete='CASCADE'), nullable=False)
    commit_hash = db.Column(db.String(100), nullable=False)
    author_name = db.Column(db.String(100), nullable=False)
    author_email = db.Column(db.String(120), nullable=False)
    message = db.Column(db.Text, nullable=False)
    branch = db.Column(db.String(100), default='main')
    lines_added = db.Column(db.Integer, default=0)
    lines_removed = db.Column(db.Integer, default=0)
    files_changed = db.Column(db.Integer, default=1)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.commit_hash[:7],
            'hash': self.commit_hash,
            'author': self.author_name,
            'message': self.message,
            'branch': self.branch,
            'additions': self.lines_added,
            'deletions': self.lines_removed,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }


# ━━━ 7. STATIC CODE ANALYSIS & METRICS ━━━
class CodeAnalysis(db.Model):
    __tablename__ = 'code_analysis'
    id = db.Column(db.Integer, primary_key=True)
    repository_id = db.Column(db.Integer, db.ForeignKey('repositories.id', ondelete='CASCADE'), nullable=False)
    commit_hash = db.Column(db.String(100), nullable=True)
    tool_name = db.Column(db.String(50), nullable=False) # PYLINT, RADON
    status = db.Column(db.String(30), default='PASSED') # PASSED, WARNING, FAILED
    quality_score = db.Column(db.Float, default=8.5) # 0.0 to 10.0 or 0 to 100
    executed_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': f"ana_{self.id}",
            'repository_id': self.repository_id,
            'tool': self.tool_name,
            'status': self.status,
            'score': self.quality_score,
            'executed_at': self.executed_at.isoformat() if self.executed_at else None
        }

class CodeAnalysisIssue(db.Model):
    __tablename__ = 'code_analysis_issues'
    id = db.Column(db.Integer, primary_key=True)
    analysis_id = db.Column(db.Integer, db.ForeignKey('code_analysis.id', ondelete='CASCADE'), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    line_number = db.Column(db.Integer, default=1)
    issue_type = db.Column(db.String(50), nullable=False) # ERROR, WARNING, CONVENTION, REFACTOR
    category = db.Column(db.String(50), default='CODE_STYLE')
    message_id = db.Column(db.String(30), nullable=True)
    description = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(20), default='MEDIUM')

class CodeMetrics(db.Model):
    __tablename__ = 'code_metrics'
    id = db.Column(db.Integer, primary_key=True)
    analysis_id = db.Column(db.Integer, db.ForeignKey('code_analysis.id', ondelete='CASCADE'), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    cyclomatic_complexity = db.Column(db.Integer, default=5)
    complexity_rank = db.Column(db.String(5), default='A') # A, B, C, D, E, F
    loc = db.Column(db.Integer, default=120)
    logical_loc = db.Column(db.Integer, default=85)
    comment_loc = db.Column(db.Integer, default=25)
    maintainability_index = db.Column(db.Float, default=78.5)


# ━━━ 8. RULE ENGINE & RISKS ━━━
class RiskRule(db.Model):
    __tablename__ = 'risk_rules'
    id = db.Column(db.Integer, primary_key=True)
    rule_code = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    threshold_value = db.Column(db.Float, default=0.0)
    metric_type = db.Column(db.String(50), nullable=False)
    severity = db.Column(db.String(20), default='HIGH')
    is_enabled = db.Column(db.Boolean, default=True)

class Risk(db.Model):
    __tablename__ = 'risks'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    risk_type = db.Column(db.String(50), nullable=False) # TASK_DELAY, HIGH_COMPLEXITY, CODE_QUALITY, CODE_WARNING, PROJECT_PROGRESS
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(20), nullable=False, default='HIGH') # LOW, MEDIUM, HIGH, CRITICAL
    status = db.Column(db.String(30), nullable=False, default='OPEN') # OPEN, ACKNOWLEDGED, RESOLVED, IGNORED
    related_task_id = db.Column(db.Integer, db.ForeignKey('tasks.id', ondelete='SET NULL'), nullable=True)
    related_repo_id = db.Column(db.Integer, db.ForeignKey('repositories.id', ondelete='SET NULL'), nullable=True)
    related_analysis_id = db.Column(db.Integer, db.ForeignKey('code_analysis.id', ondelete='SET NULL'), nullable=True)
    detected_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)
    resolved_by_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    def to_dict(self):
        return {
            'id': f"rsk_{self.id}",
            'risk_id': self.id,
            'project_id': self.project_id,
            'type': self.risk_type,
            'title': self.title,
            'description': self.description,
            'severity': self.severity,
            'status': self.status,
            'detected_at': self.detected_at.isoformat() if self.detected_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None
        }


# ━━━ 9. REPORTS, NOTIFICATIONS & AUDIT LOGS ━━━
class Report(db.Model):
    __tablename__ = 'reports'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=True)
    report_type = db.Column(db.String(50), nullable=False) # PROJECT_PROGRESS, TASK, TEAM, CODE_QUALITY, REPO_ACTIVITY, RISK, HEALTH
    title = db.Column(db.String(200), nullable=False)
    content_json = db.Column(db.Text, nullable=False)
    generated_by_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': f"rpt_{self.id}",
            'type': self.report_type,
            'title': self.title,
            'project_id': self.project_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(30), default='INFO')
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    user_email = db.Column(db.String(120), nullable=True)
    role_name = db.Column(db.String(50), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    entity = db.Column(db.String(100), nullable=True)
    entity_id = db.Column(db.String(50), nullable=True)
    details = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': f"log_{self.id}",
            'user_email': self.user_email or 'System',
            'role_name': self.role_name or 'SYSTEM',
            'action': self.action,
            'entity': self.entity,
            'details': self.details,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
