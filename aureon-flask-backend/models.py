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
        seen_user_ids = set()
        member_users = []
        for m in members_query:
            u = User.query.get(m.user_id)
            if u and u.id not in seen_user_ids:
                seen_user_ids.add(u.id)
                member_users.append({
                    'id': str(u.id),
                    'name': u.display_name,
                    'email': u.email,
                    'role': u.role_name,
                    'designation': u.designation
                })

        # Also dynamically include members from any squads/teams assigned to this project
        teams_query = Team.query.filter_by(project_id=self.id).all()
        for t in teams_query:
            for tm in TeamMember.query.filter_by(team_id=t.id).all():
                if tm.user and tm.user.id not in seen_user_ids:
                    seen_user_ids.add(tm.user.id)
                    member_users.append({
                        'id': str(tm.user.id),
                        'name': tm.user.display_name,
                        'email': tm.user.email,
                        'role': tm.user.role_name,
                        'designation': tm.user.designation
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
    role_in_project = db.Column(db.String(100), default='MEMBER', nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_deleted = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

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
        t_members = TeamMember.query.filter_by(team_id=self.id).all()
        member_names = [m.user.full_name for m in t_members if m.user]
        member_details = [
            {
                'id': str(m.user.id),
                'name': m.user.full_name,
                'email': m.user.email,
                'role': m.user.role_name,
                'designation': m.user.designation
            } for m in t_members if m.user
        ]

        leader_name = self.leader.full_name if self.leader else None
        proj_name = self.project.name if self.project else None

        return {
            'id': str(self.id),
            'name': self.display_name,
            'team_name': self.display_name,
            'team_code': self.team_code or '',
            'description': self.description or '',
            'availability_status': self.availability_status or 'AVAILABLE',
            'status': self.status or 'ACTIVE',
            'project_id': str(self.project_id) if self.project_id else None,
            'project_name': proj_name,
            'projectCount': 1 if self.project_id else 0,
            'team_leader_id': str(self.team_leader_id or self.lead_id) if (self.team_leader_id or self.lead_id) else None,
            'lead': leader_name,
            'leader_name': leader_name,
            'department': self.description or 'Engineering',
            'capacity': '100%',
            'members': member_names,
            'member_details': member_details
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
    status = db.Column(db.String(30), default='PLANNED')  # PLANNED, ACTIVE, COMPLETED, CANCELLED
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    project_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_project.id'), nullable=True)
    team_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_team.id'), nullable=True)
    created_by_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_user.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completion_date = db.Column(db.Date, nullable=True)
    completion_notes = db.Column(db.Text, nullable=True)
    carry_forward_tasks_count = db.Column(db.Integer, default=0)

    project = db.relationship('Project', foreign_keys=[project_id])
    team = db.relationship('Team', foreign_keys=[team_id])
    creator = db.relationship('User', foreign_keys=[created_by_id])

    def to_dict(self):
        proj = self.project or (Project.query.get(self.project_id) if self.project_id else None)
        tm = self.team or (Team.query.get(self.team_id) if self.team_id else None)
        creator_user = self.creator or (User.query.get(self.created_by_id) if self.created_by_id else None)

        sprint_tasks = Task.query.filter_by(sprint_id=self.id).all() if self.id else []
        total_tasks = len(sprint_tasks)
        completed_tasks = len([t for t in sprint_tasks if t.status in ('COMPLETED', 'DONE')])
        in_progress_tasks = len([t for t in sprint_tasks if t.status == 'IN_PROGRESS'])
        to_do_tasks = len([t for t in sprint_tasks if t.status == 'TODO'])
        review_tasks = len([t for t in sprint_tasks if t.status in ('REVIEW', 'CODE_REVIEW', 'IN_REVIEW')])
        testing_tasks = len([t for t in sprint_tasks if t.status == 'TESTING'])
        blocked_tasks = len([t for t in sprint_tasks if t.status == 'BLOCKED'])
        overdue_tasks = len([t for t in sprint_tasks if t.is_overdue])

        completion_pct = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0.0

        # Developer task distribution
        dev_dist = {}
        for t in sprint_tasks:
            dev_name = t.assignee_display_name
            if dev_name not in dev_dist:
                dev_dist[dev_name] = {'developer': dev_name, 'total': 0, 'completed': 0, 'in_progress': 0, 'overdue': 0}
            dev_dist[dev_name]['total'] += 1
            if t.status in ('COMPLETED', 'DONE'):
                dev_dist[dev_name]['completed'] += 1
            elif t.status == 'IN_PROGRESS':
                dev_dist[dev_name]['in_progress'] += 1
            if t.is_overdue:
                dev_dist[dev_name]['overdue'] += 1

        return {
            'id': str(self.id),
            'sprint_id': str(self.id),
            'name': self.name,
            'sprint_name': self.name,
            'goal': self.goal or '',
            'sprint_goal': self.goal or '',
            'status': self.status or 'PLANNED',
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'startDate': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'endDate': self.end_date.isoformat() if self.end_date else None,
            'project_id': str(self.project_id) if self.project_id else None,
            'projectId': str(self.project_id) if self.project_id else None,
            'project_name': proj.display_name if proj else 'Verona Organic',
            'projectName': proj.display_name if proj else 'Verona Organic',
            'project': proj.display_name if proj else 'Verona Organic',
            'team_id': str(self.team_id) if self.team_id else None,
            'teamId': str(self.team_id) if self.team_id else None,
            'team_name': tm.display_name if tm else 'Development Team',
            'team': tm.display_name if tm else 'Development Team',
            'created_by': creator_user.display_name if creator_user else 'Team Lead',
            'created_by_id': str(self.created_by_id) if self.created_by_id else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completion_date': self.completion_date.isoformat() if self.completion_date else None,
            'completion_notes': self.completion_notes or '',
            'carry_forward_tasks_count': self.carry_forward_tasks_count or 0,
            # Dynamic calculations
            'total_tasks': total_tasks,
            'totalTasks': total_tasks,
            'completed_tasks': completed_tasks,
            'completedTasks': completed_tasks,
            'in_progress_tasks': in_progress_tasks,
            'to_do_tasks': to_do_tasks,
            'review_tasks': review_tasks,
            'testing_tasks': testing_tasks,
            'blocked_tasks': blocked_tasks,
            'overdue_tasks': overdue_tasks,
            'overdueTasks': overdue_tasks,
            'completion_percentage': completion_pct,
            'completionPercentage': completion_pct,
            'progress': completion_pct,
            'developer_distribution': list(dev_dist.values())
        }

class Task(db.Model):
    __tablename__ = 'tbl_task'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = db.Column(db.String(150), nullable=True)
    description = db.Column(db.Text)
    ticket_type = db.Column(db.String(50), default='Task')  # Feature, User Story, Task, Bug, Improvement
    parent_task_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_task.id'), nullable=True)
    priority = db.Column(db.String(30), default='MEDIUM')   # LOW, MEDIUM, HIGH, CRITICAL
    status = db.Column(db.String(30), default='TODO')       # TODO, IN_PROGRESS, CODE_REVIEW, TESTING, DONE, BLOCKED
    start_date = db.Column(db.Date, nullable=True)
    due_date = db.Column(db.Date)
    original_due_date = db.Column(db.Date, nullable=True)
    due_date_changed_at = db.Column(db.DateTime, nullable=True)
    due_date_changed_by_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_user.id'), nullable=True)
    due_date_change_reason = db.Column(db.Text, nullable=True)
    estimated_hours = db.Column(db.Float, default=0.0)
    actual_hours = db.Column(db.Float, default=0.0)
    progress = db.Column(db.Integer, default=0)              # 0 to 100%
    assigned_to_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_user.id'), nullable=True)
    assigned_by_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_user.id'), nullable=True)
    created_by_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_user.id'), nullable=True)
    project_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_project.id'), nullable=True)
    team_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_team.id'), nullable=True)
    sprint_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_sprint.id'), nullable=True)
    delay_reason = db.Column(db.String(100), nullable=True)
    delay_remark = db.Column(db.Text, nullable=True)
    delay_remark_added_at = db.Column(db.DateTime, nullable=True)
    delay_remark_by_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_user.id'), nullable=True)
    team_leader_review = db.Column(db.Text, nullable=True)
    team_leader_reviewed_at = db.Column(db.DateTime, nullable=True)
    team_leader_reviewed_by_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_user.id'), nullable=True)
    escalation_level = db.Column(db.Integer, default=0)     # 0=None, 1=Lead Notified, 2=PM Escalated, 3=Project Risk Alert
    escalation_reason = db.Column(db.Text, nullable=True)
    escalated_at = db.Column(db.DateTime, nullable=True)
    overdue_notified_lead = db.Column(db.Boolean, default=False)
    overdue_notified_pm = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assigned_user = db.relationship('User', foreign_keys=[assigned_to_id])
    due_date_changer = db.relationship('User', foreign_keys=[due_date_changed_by_id])
    tl_reviewer = db.relationship('User', foreign_keys=[team_leader_reviewed_by_id])

    @property
    def display_title(self):
        return self.title or 'Untitled Task'

    @property
    def display_status(self):
        return self.status or 'TODO'

    @property
    def assignee_display_name(self):
        u = self.assigned_user or (User.query.get(self.assigned_to_id) if self.assigned_to_id else None)
        return u.display_name if u else 'Unassigned'

    @property
    def is_overdue(self):
        if self.status in ('COMPLETED', 'DONE'):
            return False
        if not self.due_date:
            return False
        from datetime import date
        return date.today() > self.due_date

    @property
    def days_overdue(self):
        if not self.is_overdue or not self.due_date:
            return 0
        from datetime import date
        delta = date.today() - self.due_date
        return max(0, delta.days)

    def to_dict(self):
        proj = Project.query.get(self.project_id) if self.project_id else None
        spr = Sprint.query.get(self.sprint_id) if self.sprint_id else None
        tm = Team.query.get(self.team_id) if self.team_id else (spr.team if spr else None)
        u = self.assigned_user or (User.query.get(self.assigned_to_id) if self.assigned_to_id else None)
        due_changer = self.due_date_changer or (User.query.get(self.due_date_changed_by_id) if self.due_date_changed_by_id else None)
        reviewer = self.tl_reviewer or (User.query.get(self.team_leader_reviewed_by_id) if self.team_leader_reviewed_by_id else None)

        att_query = TaskAttachment.query.filter_by(task_id=self.id, is_deleted=False).all() if self.id else []
        attachments_data = [a.to_dict() for a in att_query]

        comments_query = TaskComment.query.filter_by(task_id=self.id).order_by(TaskComment.created_at.asc()).all() if self.id else []
        comments_data = [c.to_dict() for c in comments_query]

        commits_query = Commit.query.filter((Commit.task_id == self.id) | (Commit.commit_message.ilike(f"%{self.title[:20]}%"))).all() if self.id and self.title else []
        commits_data = [c.to_dict() for c in commits_query]

        return {
            'id': str(self.id),
            'realId': str(self.id),
            'title': self.display_title,
            'description': self.description or '',
            'ticket_type': self.ticket_type or 'Task',
            'parent_task_id': str(self.parent_task_id) if self.parent_task_id else None,
            'priority': self.priority or 'MEDIUM',
            'status': self.display_status,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'dueDate': self.due_date.isoformat() if self.due_date else None,
            'original_due_date': self.original_due_date.isoformat() if self.original_due_date else (self.due_date.isoformat() if self.due_date else None),
            'due_date_changed_at': self.due_date_changed_at.isoformat() if self.due_date_changed_at else None,
            'due_date_changed_by': due_changer.display_name if due_changer else None,
            'due_date_change_reason': self.due_date_change_reason or '',
            'estimated_hours': self.estimated_hours or 0.0,
            'actual_hours': self.actual_hours or 0.0,
            'progress': self.progress if self.progress is not None else (100 if self.display_status in ('DONE', 'COMPLETED') else 0),
            'assigned_to_id': str(self.assigned_to_id) if self.assigned_to_id else None,
            'assignee_name': u.display_name if u else 'Unassigned',
            'assignee': u.display_name if u else 'Unassigned',
            'project_id': str(self.project_id) if self.project_id else (str(spr.project_id) if spr and spr.project_id else None),
            'project_name': proj.display_name if proj else (spr.project_name if spr else 'Verona Organic'),
            'project': proj.display_name if proj else (spr.project_name if spr else 'Verona Organic'),
            'team_id': str(self.team_id) if self.team_id else (str(spr.team_id) if spr and spr.team_id else None),
            'assigned_team': tm.name if tm else 'Development Team',
            'sprint_id': str(self.sprint_id) if self.sprint_id else None,
            'sprint_name': spr.name if spr else ('Product Backlog' if not self.sprint_id else 'ui design'),
            # Overdue & Delay Fields
            'is_overdue': self.is_overdue,
            'days_overdue': self.days_overdue,
            'delay_reason': self.delay_reason or '',
            'delay_remark': self.delay_remark or '',
            'delay_remark_added_at': self.delay_remark_added_at.isoformat() if self.delay_remark_added_at else None,
            'team_leader_review': self.team_leader_review or '',
            'team_leader_reviewed_at': self.team_leader_reviewed_at.isoformat() if self.team_leader_reviewed_at else None,
            'team_leader_reviewer': reviewer.display_name if reviewer else None,
            'escalation_level': self.escalation_level or 0,
            'escalation_reason': self.escalation_reason or '',
            'escalated_at': self.escalated_at.isoformat() if self.escalated_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'attachments': attachments_data,
            'comments': comments_data,
            'commits': commits_data
        }

class TaskAttachment(db.Model):
    __tablename__ = 'tbl_task_attachment'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file = db.Column(db.String(255), nullable=True)
    filename = db.Column(db.String(255), nullable=False)
    task_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_task.id'), nullable=False)
    created_by_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_user.id'), nullable=True)
    updated_by_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_user.id'), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    is_deleted = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.filename,
            'filename': self.filename,
            'file': self.file or '',
            'task_id': str(self.task_id),
            'created_at': self.created_at.isoformat() if self.created_at else None
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

class TaskComment(db.Model):
    __tablename__ = 'tbl_task_comment'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_task.id'), nullable=False)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_user.id'), nullable=True)
    comment = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id])

    def to_dict(self):
        u = self.user or (User.query.get(self.user_id) if self.user_id else None)
        return {
            'id': str(self.id),
            'task_id': str(self.task_id),
            'user_id': str(self.user_id) if self.user_id else None,
            'author': u.display_name if u else 'Developer',
            'author_name': u.display_name if u else 'Developer',
            'text': self.comment,
            'comment': self.comment,
            'time': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else 'Just now',
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class TaskStatusHistory(db.Model):
    __tablename__ = 'tbl_task_history'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_task.id'), nullable=False)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_user.id'), nullable=True)
    actor_id = db.Column(UUID(as_uuid=True), nullable=True)
    created_by_id = db.Column(UUID(as_uuid=True), nullable=True)
    updated_by_id = db.Column(UUID(as_uuid=True), nullable=True)
    action = db.Column(db.String(100), nullable=True, default='STATUS_CHANGE')
    action_type = db.Column(db.String(50), nullable=True, default='STATUS_CHANGE')
    old_value = db.Column(db.String(255), nullable=True)
    new_value = db.Column(db.String(255), nullable=True)
    details = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    is_deleted = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id])

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not getattr(self, 'action', None):
            self.action = getattr(self, 'action_type', None) or 'STATUS_CHANGE'
        if not getattr(self, 'action_type', None):
            self.action_type = getattr(self, 'action', None) or 'STATUS_CHANGE'
        if not getattr(self, 'created_at', None):
            self.created_at = datetime.utcnow()
        if not getattr(self, 'updated_at', None):
            self.updated_at = datetime.utcnow()
        if getattr(self, 'is_active', None) is None:
            self.is_active = True
        if getattr(self, 'is_deleted', None) is None:
            self.is_deleted = False

    def to_dict(self):
        u = self.user or (User.query.get(self.user_id) if self.user_id else None)
        return {
            'id': str(self.id),
            'task_id': str(self.task_id),
            'user_id': str(self.user_id) if self.user_id else None,
            'user_name': u.display_name if u else 'System',
            'action_type': self.action_type or self.action or '',
            'old_value': self.old_value or '',
            'new_value': self.new_value or '',
            'details': self.details or '',
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

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
class ProjectHealthHistory(db.Model):
    __tablename__ = 'tbl_project_health_history'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_project.id'), nullable=False, index=True)
    overall_score = db.Column(db.Integer, nullable=True)
    health_status = db.Column(db.String(30), nullable=True)  # HEALTHY, WARNING, AT_RISK, NO_DATA
    sprint_task_score = db.Column(db.Float, nullable=True)
    github_score = db.Column(db.Float, nullable=True)
    code_quality_score = db.Column(db.Float, nullable=True)
    engineering_risk_score = db.Column(db.Float, nullable=True)
    metrics_breakdown = db.Column(db.Text, nullable=True)  # JSON string
    calculated_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            'id': str(self.id),
            'project_id': str(self.project_id),
            'overall_score': self.overall_score,
            'health_status': self.health_status,
            'sprint_task_score': self.sprint_task_score,
            'github_score': self.github_score,
            'code_quality_score': self.code_quality_score,
            'engineering_risk_score': self.engineering_risk_score,
            'metrics_breakdown': self.metrics_breakdown,
            'calculated_at': self.calculated_at.isoformat() if self.calculated_at else None,
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
    task_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_task.id'), nullable=True)
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
            'task_id': str(self.task_id) if self.task_id else None,
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


# ==========================================
# GITHUB REST API INTEGRATION MODELS
# ==========================================

class GitHubRepository(db.Model):
    __tablename__ = 'tbl_github_repository'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_project.id'), nullable=True)
    github_repository_id = db.Column(db.BigInteger, nullable=True)
    owner = db.Column(db.String(150), nullable=False)
    repository_name = db.Column(db.String(150), nullable=False)
    repository_url = db.Column(db.String(255), nullable=False)
    default_branch = db.Column(db.String(100), default='main')
    description = db.Column(db.Text, nullable=True)
    visibility = db.Column(db.String(50), default='public')
    language = db.Column(db.String(100), nullable=True)
    stars = db.Column(db.Integer, default=0)
    forks = db.Column(db.Integer, default=0)
    open_issues = db.Column(db.Integer, default=0)
    last_synced_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Normalized Relationships
    commits = db.relationship('GitHubCommit', backref='repository', cascade='all, delete-orphan', lazy=True, order_by='desc(GitHubCommit.commit_date)')
    pull_requests = db.relationship('GitHubPullRequest', backref='repository', cascade='all, delete-orphan', lazy=True, order_by='desc(GitHubPullRequest.created_at)')
    contributors = db.relationship('GitHubContributor', backref='repository', cascade='all, delete-orphan', lazy=True, order_by='desc(GitHubContributor.contributions)')

    @property
    def full_name(self):
        return f"{self.owner}/{self.repository_name}" if self.owner else self.repository_name

    def to_dict(self):
        return {
            'id': str(self.id),
            'project_id': str(self.project_id) if self.project_id else None,
            'github_repository_id': self.github_repository_id,
            'owner': self.owner,
            'repository_name': self.repository_name,
            'name': self.repository_name,
            'full_name': self.full_name,
            'repository_url': self.repository_url,
            'url': self.repository_url,
            'default_branch': self.default_branch or 'main',
            'description': self.description or '',
            'visibility': self.visibility or 'public',
            'language': self.language or 'Other',
            'stars': self.stars or 0,
            'forks': self.forks or 0,
            'open_issues': self.open_issues or 0,
            'last_synced_at': self.last_synced_at.isoformat() if self.last_synced_at else None,
            'is_active': bool(self.is_active),
            'commits_count': len(self.commits) if self.commits else 0,
            'pull_requests_count': len(self.pull_requests) if self.pull_requests else 0,
            'contributors_count': len(self.contributors) if self.contributors else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class GitHubCommit(db.Model):
    __tablename__ = 'tbl_github_commit'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repository_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_github_repository.id'), nullable=False)
    github_commit_id = db.Column(db.String(100), nullable=True)
    commit_sha = db.Column(db.String(100), nullable=False, index=True)
    author_name = db.Column(db.String(150), nullable=True)
    author_email = db.Column(db.String(255), nullable=True)
    commit_message = db.Column(db.Text, nullable=True)
    commit_date = db.Column(db.DateTime, nullable=True)
    commit_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'repository_id': str(self.repository_id) if self.repository_id else None,
            'github_commit_id': self.github_commit_id or self.commit_sha,
            'commit_sha': self.commit_sha,
            'short_sha': self.commit_sha[:7] if self.commit_sha else '',
            'author_name': self.author_name or 'Unknown Author',
            'author_email': self.author_email or '',
            'commit_message': self.commit_message or '',
            'commit_date': self.commit_date.isoformat() if self.commit_date else '',
            'commit_url': self.commit_url or (f"https://github.com/{self.repository.full_name}/commit/{self.commit_sha}" if self.repository else f"https://github.com/{self.commit_sha}"),
            'created_at': self.created_at.isoformat() if self.created_at else ''
        }

class GitHubPullRequest(db.Model):
    __tablename__ = 'tbl_github_pull_request'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repository_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_github_repository.id'), nullable=False)
    github_pr_id = db.Column(db.BigInteger, nullable=True)
    pr_number = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(255), nullable=False)
    author = db.Column(db.String(150), nullable=True)
    state = db.Column(db.String(50), default='open')
    source_branch = db.Column(db.String(100), nullable=True)
    target_branch = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, nullable=True)
    updated_at = db.Column(db.DateTime, nullable=True)
    merged_at = db.Column(db.DateTime, nullable=True)
    closed_at = db.Column(db.DateTime, nullable=True)
    review_status = db.Column(db.String(50), default='PENDING')

    def to_dict(self):
        return {
            'id': str(self.id),
            'repository_id': str(self.repository_id) if self.repository_id else None,
            'github_pr_id': self.github_pr_id,
            'pr_number': self.pr_number,
            'title': self.title or '',
            'author': self.author or 'Contributor',
            'state': self.state or 'open',
            'source_branch': self.source_branch or 'feature',
            'target_branch': self.target_branch or 'main',
            'created_at': self.created_at.isoformat() if self.created_at else '',
            'updated_at': self.updated_at.isoformat() if self.updated_at else '',
            'merged_at': self.merged_at.isoformat() if self.merged_at else None,
            'closed_at': self.closed_at.isoformat() if self.closed_at else None,
            'review_status': self.review_status or 'PENDING'
        }

class GitHubContributor(db.Model):
    __tablename__ = 'tbl_github_contributor'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repository_id = db.Column(UUID(as_uuid=True), db.ForeignKey('tbl_github_repository.id'), nullable=False)
    github_user_id = db.Column(db.String(50), nullable=True)
    username = db.Column(db.String(150), nullable=False)
    display_name = db.Column(db.String(150), nullable=True)
    contributions = db.Column(db.Integer, default=0)
    profile_url = db.Column(db.String(255), nullable=True)
    avatar_url = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            'id': str(self.id),
            'repository_id': str(self.repository_id) if self.repository_id else None,
            'github_user_id': self.github_user_id or '',
            'username': self.username,
            'display_name': self.display_name or self.username,
            'contributions': self.contributions or 0,
            'profile_url': self.profile_url or f"https://github.com/{self.username}",
            'avatar_url': self.avatar_url or ''
        }


