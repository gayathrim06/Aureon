import uuid
import hashlib
import base64
from datetime import datetime
from extensions import db
from sqlalchemy.dialects.postgresql import UUID
from werkzeug.security import generate_password_hash, check_password_hash

class Role(db.Model):
    __tablename__ = 'tbl_role'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    level = db.Column(db.Integer, default=5)
    is_active = db.Column(db.Boolean, default=True)
    is_deleted = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': str(self.id),
            'code': self.code,
            'name': self.name,
            'description': self.description,
            'level': self.level
        }

class User(db.Model):
    __tablename__ = 'tbl_user'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = db.Column(db.String(255), unique=True, nullable=False)
    username = db.Column(db.String(150), nullable=True)
    password = db.Column(db.String(128), nullable=False)
    full_name = db.Column(db.String(255), nullable=True)
    phone = db.Column(db.String(30), nullable=True)
    employee_id = db.Column(db.String(50), nullable=True)
    department = db.Column(db.String(100), nullable=True)
    designation = db.Column(db.String(100), nullable=True)
    gender = db.Column(db.String(20), nullable=True)
    must_change_password = db.Column(db.Boolean, default=False, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_staff = db.Column(db.Boolean, default=False, nullable=False)
    is_superuser = db.Column(db.Boolean, default=False, nullable=False)
    date_joined = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    failed_login_attempts = db.Column(db.Integer, default=0, nullable=False)
    account_status = db.Column(db.String(20), default='ACTIVE', nullable=False)
    email_verified = db.Column(db.Boolean, default=False, nullable=False)
    first_login = db.Column(db.Boolean, default=False, nullable=False)
    date_of_birth = db.Column(db.Date, nullable=True)
    pet_name = db.Column(db.String(150), nullable=True)
    school_friend_name = db.Column(db.String(150), nullable=True)
    role_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_role.id'), nullable=True)
    
    role = db.relationship('Role', backref='users')

    @property
    def display_name(self):
        return self.full_name or self.username or self.email

    @property
    def role_name(self):
        if self.role:
            return self.role.code
        return 'ROLE_DEV'

    def set_password(self, password_str):
        self.password = generate_password_hash(password_str, method='pbkdf2:sha256')

    def check_password(self, password_str):
        if not self.password:
            return False
        if self.password.startswith('pbkdf2_sha256$'):
            try:
                parts = self.password.split('$')
                if len(parts) == 4:
                    iterations = int(parts[1])
                    salt = parts[2].encode('utf-8')
                    expected_hash = parts[3]
                    key = hashlib.pbkdf2_hmac('sha256', password_str.encode('utf-8'), salt, iterations)
                    computed_hash = base64.b64encode(key).decode('ascii')
                    return computed_hash == expected_hash
            except Exception:
                pass
        return check_password_hash(self.password, password_str)

    def to_dict(self):
        return {
            'id': str(self.id),
            'email': self.email,
            'username': self.username or (self.email.split('@')[0] if self.email else ''),
            'full_name': self.full_name or self.username or self.email,
            'name': self.full_name or self.username or self.email,
            'role': self.role_name,
            'role_name': self.role_name,
            'role_code': self.role_name,
            'phone': self.phone or '',
            'employee_id': self.employee_id or '',
            'department': self.department or 'Engineering',
            'designation': self.designation or 'Software Engineer',
            'gender': self.gender or 'PREFER_NOT_TO_SAY',
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else '2000-01-01',
            'pet_name': self.pet_name or '',
            'school_friend_name': self.school_friend_name or '',
            'best_friend_name': self.school_friend_name or '',
            'status': self.account_status or ('ACTIVE' if self.is_active else 'INACTIVE'),
            'failed_logins': self.failed_login_attempts or 0,
            'mfaEnabled': False
        }

class Project(db.Model):
    __tablename__ = 'tbl_project'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), nullable=True)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(30), default='IN_PROGRESS')
    priority = db.Column(db.String(30), default='HIGH')
    start_date = db.Column(db.Date, nullable=True)
    target_deadline = db.Column(db.Date, nullable=True)
    manager_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_user.id'), nullable=True)
    lead_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_user.id'), nullable=True)
    health_score = db.Column(db.Integer, default=90)
    is_active = db.Column(db.Boolean, default=True)
    is_deleted = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def display_name(self):
        return self.name or 'Untitled Project'

    def to_dict(self):
        lead_user = User.query.get(self.lead_id) if self.lead_id else None
        manager_user = User.query.get(self.manager_id) if self.manager_id else None

        members_query = ProjectMember.query.filter_by(project_id=self.id).all()
        member_users = []
        for m in members_query:
            u = User.query.get(m.user_id)
            if u:
                member_users.append({
                    'id': str(u.id),
                    'name': u.display_name,
                    'email': u.email,
                    'role': u.role_name,
                    'designation': u.designation
                })

        return {
            'id': str(self.id),
            'name': self.display_name,
            'project_name': self.display_name,
            'description': self.description or '',
            'status': self.status or 'IN_PROGRESS',
            'priority': self.priority or 'HIGH',
            'health_score': self.health_score if self.health_score is not None else 90,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'target_deadline': self.target_deadline.isoformat() if self.target_deadline else None,
            'project_manager_id': str(self.manager_id) if self.manager_id else None,
            'manager_id': str(self.manager_id) if self.manager_id else None,
            'manager_name': manager_user.display_name if manager_user else 'Project Manager',
            'lead_id': str(self.lead_id) if self.lead_id else None,
            'team_lead_id': str(self.lead_id) if self.lead_id else None,
            'lead_name': lead_user.display_name if lead_user else 'Unassigned Lead',
            'team_members': member_users
        }

class ProjectMember(db.Model):
    __tablename__ = 'tbl_project_member'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_project.id'), nullable=False)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_user.id'), nullable=False)

class Team(db.Model):
    __tablename__ = 'tbl_team'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), nullable=True)
    team_code = db.Column(db.String(50), nullable=True)
    description = db.Column(db.Text, nullable=True)
    availability_status = db.Column(db.String(30), default='AVAILABLE')
    status = db.Column(db.String(30), default='ACTIVE')
    is_active = db.Column(db.Boolean, default=True)
    is_deleted = db.Column(db.Boolean, default=False)
    project_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_project.id'), nullable=True)
    team_leader_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_user.id'), nullable=True)
    lead_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_user.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    leader = db.relationship('User', foreign_keys=[team_leader_id])
    project = db.relationship('Project', foreign_keys=[project_id])

    @property
    def display_name(self):
        return self.name or 'Team'

    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.display_name,
            'team_name': self.display_name,
            'team_code': self.team_code or '',
            'description': self.description or '',
            'availability_status': self.availability_status or 'AVAILABLE',
            'status': self.status or 'ACTIVE',
            'project_id': str(self.project_id) if self.project_id else None,
            'team_leader_id': str(self.team_leader_id or self.lead_id) if (self.team_leader_id or self.lead_id) else None,
            'leader_name': self.leader.full_name if self.leader else None
        }

class TeamMember(db.Model):
    __tablename__ = 'tbl_team_member'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_team.id'), nullable=False)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id])

class Sprint(db.Model):
    __tablename__ = 'tbl_sprint'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), nullable=False)
    goal = db.Column(db.Text)
    status = db.Column(db.String(30), default='PLANNED')
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    project_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_project.id'), nullable=True)
    team_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_team.id'), nullable=True)
    created_by_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_user.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'goal': self.goal or '',
            'status': self.status or 'PLANNED',
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'project_id': str(self.project_id) if self.project_id else None,
            'team_id': str(self.team_id) if self.team_id else None
        }

class Task(db.Model):
    __tablename__ = 'tbl_task'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = db.Column(db.String(150), nullable=True)
    description = db.Column(db.Text)
    priority = db.Column(db.String(30), default='MEDIUM')
    status = db.Column(db.String(30), default='TODO')
    due_date = db.Column(db.Date)
    estimated_hours = db.Column(db.Float, default=0.0)
    actual_hours = db.Column(db.Float, default=0.0)
    assigned_to_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_user.id'), nullable=True)
    assigned_by_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_user.id'), nullable=True)
    created_by_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_user.id'), nullable=True)
    project_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_project.id'), nullable=True)
    team_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_team.id'), nullable=True)
    sprint_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_sprint.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    assigned_user = db.relationship('User', foreign_keys=[assigned_to_id])

    @property
    def display_title(self):
        return self.title or 'Untitled Task'

    @property
    def display_status(self):
        return self.status or 'TODO'

    def to_dict(self):
        return {
            'id': str(self.id),
            'title': self.display_title,
            'description': self.description or '',
            'priority': self.priority or 'MEDIUM',
            'status': self.display_status,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'estimated_hours': self.estimated_hours or 0.0,
            'actual_hours': self.actual_hours or 0.0,
            'assigned_to_id': str(self.assigned_to_id) if self.assigned_to_id else None,
            'assignee_name': self.assigned_user.full_name if self.assigned_user else None,
            'project_id': str(self.project_id) if self.project_id else None,
            'team_id': str(self.team_id) if self.team_id else None,
            'sprint_id': str(self.sprint_id) if self.sprint_id else None
        }

class Notification(db.Model):
    __tablename__ = 'tbl_notification'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipient_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_user.id'), nullable=True)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text)
    notification_type = db.Column(db.String(50), default='INFO')
    read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'recipient_id': str(self.recipient_id) if self.recipient_id else None,
            'title': self.title,
            'message': self.message or '',
            'notification_type': self.notification_type,
            'read': self.read,
            'created_at': self.created_at.isoformat() if self.created_at else ''
        }

class TaskStatusHistory(db.Model):
    __tablename__ = 'tbl_task_history'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_task.id'), nullable=False)

class Risk(db.Model):
    __tablename__ = 'tbl_risk'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_project.id'), nullable=True)
    title = db.Column(db.String(150), nullable=True)
    description = db.Column(db.Text, nullable=True)
    severity = db.Column(db.String(30), default='MEDIUM')
    status = db.Column(db.String(30), default='OPEN')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'project_id': str(self.project_id) if self.project_id else None,
            'title': self.title or 'Risk Alert',
            'description': self.description or '',
            'severity': self.severity or 'MEDIUM',
            'status': self.status or 'OPEN',
            'created_at': self.created_at.isoformat() if self.created_at else ''
        }

class AuditLog(db.Model):
    __tablename__ = 'tbl_audit_log'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    action = db.Column(db.String(100), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_deleted = db.Column(db.Boolean, default=False, nullable=False)
    status = db.Column(db.String(50), default='SUCCESS', nullable=False)
    browser = db.Column(db.String(100), default='Chrome', nullable=False)
    operating_system = db.Column(db.String(100), default='Windows', nullable=False)
    details = db.Column(db.Text)
    user_email = db.Column(db.String(120))
    role_name = db.Column(db.String(50))

    def to_dict(self):
        return {
            'id': str(self.id),
            'action': self.action or 'SYSTEM_EVENT',
            'timestamp': self.timestamp.isoformat() if self.timestamp else '',
            'details': self.details or '',
            'user_email': self.user_email or 'system',
            'role_name': self.role_name or 'ROLE_ADMIN'
        }

class Commit(db.Model):
    __tablename__ = 'tbl_commit'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repository_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_repository.id'), nullable=True)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_user.id'), nullable=True)
    commit_hash = db.Column(db.String(100), nullable=True)
    author_name = db.Column(db.String(100), nullable=True)
    commit_message = db.Column(db.Text, nullable=True)
    commit_date = db.Column(db.DateTime, default=datetime.utcnow)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    files_changed = db.Column(db.Integer, default=1)
    additions = db.Column(db.Integer, default=0)
    deletions = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': str(self.id),
            'repository_id': str(self.repository_id) if self.repository_id else None,
            'user_id': str(self.user_id) if self.user_id else None,
            'commit_hash': self.commit_hash or '',
            'author_name': self.author_name or 'Developer',
            'commit_message': self.commit_message or '',
            'commit_date': self.commit_date.isoformat() if self.commit_date else '',
            'files_changed': self.files_changed or 1,
            'additions': self.additions or 0,
            'deletions': self.deletions or 0
        }

class Repository(db.Model):
    __tablename__ = 'tbl_repository'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_project.id'), nullable=True)
    repository_name = db.Column(db.String(100), nullable=True)
    name = db.Column(db.String(100), nullable=True)
    repository_url = db.Column(db.String(255), nullable=True)
    url = db.Column(db.String(255), nullable=True)
    provider = db.Column(db.String(50), default='GitHub')
    default_branch = db.Column(db.String(50), default='main')
    status = db.Column(db.String(30), default='CONNECTED')
    connection_status = db.Column(db.String(30), default='CONNECTED')
    last_synced = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def display_name(self):
        return self.repository_name or self.name or 'Repo'

    def to_dict(self):
        return {
            'id': str(self.id),
            'project_id': str(self.project_id) if self.project_id else None,
            'repository_name': self.display_name,
            'name': self.display_name,
            'repository_url': self.repository_url or self.url or '',
            'url': self.repository_url or self.url or '',
            'provider': self.provider or 'GitHub',
            'default_branch': self.default_branch or 'main',
            'status': self.status or self.connection_status or 'CONNECTED',
            'last_synced': self.last_synced.isoformat() if self.last_synced else None
        }

class CodeQualityReport(db.Model):
    __tablename__ = 'code_quality_reports'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repository_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_repository.id'), nullable=True)
    project_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_project.id'), nullable=True)
    analysis_date = db.Column(db.DateTime, default=datetime.utcnow)
    total_files = db.Column(db.Integer, default=1)
    total_lines = db.Column(db.Integer, default=100)
    complexity_score = db.Column(db.Float, default=2.5)
    maintainability_score = db.Column(db.Float, default=85.0)
    pylint_errors = db.Column(db.Integer, default=0)
    pylint_warnings = db.Column(db.Integer, default=0)
    quality_score = db.Column(db.Float, default=90.0)
    risk_level = db.Column(db.String(30), default='LOW')

    def to_dict(self):
        return {
            'id': str(self.id),
            'repository_id': str(self.repository_id) if self.repository_id else None,
            'project_id': str(self.project_id) if self.project_id else None,
            'analysis_date': self.analysis_date.isoformat() if self.analysis_date else '',
            'total_files': self.total_files or 1,
            'total_lines': self.total_lines or 0,
            'complexity_score': self.complexity_score or 0.0,
            'maintainability_score': self.maintainability_score or 100.0,
            'pylint_errors': self.pylint_errors or 0,
            'pylint_warnings': self.pylint_warnings or 0,
            'quality_score': self.quality_score or 90.0,
            'risk_level': self.risk_level or 'LOW'
        }

class Report(db.Model):
    __tablename__ = 'tbl_report'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_project.id'), nullable=True)
    report_type = db.Column(db.String(50), default='PROJECT_HEALTH')
    title = db.Column(db.String(150), nullable=True)
    content_json = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'project_id': str(self.project_id) if self.project_id else None,
            'report_type': self.report_type or 'PROJECT_HEALTH',
            'title': self.title or 'Engineering Report',
            'content_json': self.content_json or '{}',
            'created_at': self.created_at.isoformat() if self.created_at else ''
        }

class CodeAnalysis(db.Model):
    __tablename__ = 'tbl_code_analysis'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repository_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_repository.id'), nullable=True)
    tool_name = db.Column(db.String(50), default='PYLINT_RADON')
    status = db.Column(db.String(30), default='PASSED')
    quality_score = db.Column(db.Float, default=9.5)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'repository_id': str(self.repository_id) if self.repository_id else None,
            'tool_name': self.tool_name or 'PYLINT_RADON',
            'status': self.status or 'PASSED',
            'quality_score': self.quality_score or 9.5,
            'created_at': self.created_at.isoformat() if self.created_at else ''
        }

class CodeAnalysisIssue(db.Model):
    __tablename__ = 'tbl_bug'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_code_analysis.id'), nullable=True)
    issue_type = db.Column(db.String(50), default='WARNING')
    description = db.Column(db.Text, nullable=True)
    file_path = db.Column(db.String(255), nullable=True)
    line_number = db.Column(db.Integer, default=1)
    severity = db.Column(db.String(30), default='MEDIUM')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'analysis_id': str(self.analysis_id) if self.analysis_id else None,
            'issue_type': self.issue_type or 'WARNING',
            'description': self.description or '',
            'file_path': self.file_path or '',
            'line_number': self.line_number or 1,
            'severity': self.severity or 'MEDIUM',
            'created_at': self.created_at.isoformat() if self.created_at else ''
        }

class CodeMetrics(db.Model):
    __tablename__ = 'tbl_dashboard'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    metric_name = db.Column(db.String(100), nullable=True)
    metric_value = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'metric_name': self.metric_name or '',
            'metric_value': self.metric_value or 0.0,
            'created_at': self.created_at.isoformat() if self.created_at else ''
        }

