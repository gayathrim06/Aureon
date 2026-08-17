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
            'role_name': self.role_name,
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
    is_active = db.Column(db.Boolean, default=True)
    is_deleted = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def display_name(self):
        return self.name or 'Untitled Project'

    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.display_name,
            'project_name': self.display_name,
            'description': self.description or '',
            'status': self.status or 'IN_PROGRESS',
            'priority': self.priority or 'HIGH',
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'target_deadline': self.target_deadline.isoformat() if self.target_deadline else None,
            'project_manager_id': str(self.manager_id) if self.manager_id else None,
            'manager_id': str(self.manager_id) if self.manager_id else None
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
    status = db.Column(db.String(30), default='OPEN')

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
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_user.id'), nullable=True)

class Repository(db.Model):
    __tablename__ = 'tbl_repository'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repository_name = db.Column(db.String(100), nullable=False)

class Report(db.Model):
    __tablename__ = 'tbl_report'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

class CodeAnalysis(db.Model):
    __tablename__ = 'tbl_code_analysis'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

class CodeAnalysisIssue(db.Model):
    __tablename__ = 'tbl_bug'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

class CodeMetrics(db.Model):
    __tablename__ = 'tbl_dashboard'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
