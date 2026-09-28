import uuid
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from models import User, Role, Project, ProjectMember, Team, TeamMember, Sprint, Task

def _parse_uuid(val):
    if not val:
        return None
    if isinstance(val, uuid.UUID):
        return val
    try:
        return uuid.UUID(str(val))
    except Exception:
        return None

def require_role(allowed_roles):
    """
    RBAC Middleware decorator enforcing server-side authorization.
    Verifies JWT token validity and user role permissions.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
                user_id = get_jwt_identity()
                u_uuid = _parse_uuid(user_id)
                user = User.query.get(u_uuid or user_id)

                if not user or user.account_status != 'ACTIVE':
                    return jsonify({'success': False, 'message': 'User account inactive or unauthenticated.'}), 401

                if user.role_name not in allowed_roles and 'ROLE_ADMIN' not in [user.role_name]:
                    return jsonify({'success': False, 'message': f"Access denied. Required role: {', '.join(allowed_roles)}"}), 403

                # Attach user object to request context
                request.current_user = user
                return fn(*args, **kwargs)
            except Exception as e:
                return jsonify({'success': False, 'message': f"Authentication failed: {str(e)}"}), 401
        return wrapper
    return decorator


class UserScope:
    def __init__(self, user):
        self.user = user
        self.role_name = user.role_name if user else 'ROLE_DEV'
        self.is_admin = (self.role_name == 'ROLE_ADMIN')
        self.is_pm = (self.role_name == 'ROLE_PM')
        self.is_lead = (self.role_name == 'ROLE_LEAD')
        self.is_dev = (self.role_name in ('ROLE_DEV', 'ROLE_QA'))

        self.project_ids = []
        self.team_ids = []
        self.sprint_ids = []
        self.user_ids = []

        self._resolve_scope()

    def _resolve_scope(self):
        if not self.user or self.is_admin:
            # Admin has unrestricted system-wide visibility
            return

        u_id = self.user.id

        if self.is_pm:
            # PM sees ONLY their own assigned projects
            pm_projects = Project.query.filter(
                (Project.manager_id == u_id) |
                (Project.id.in_(
                    db_session_query_pm_ids(u_id)
                )),
                Project.is_active == True,
                Project.is_deleted == False
            ).all()

            self.project_ids = [p.id for p in pm_projects]

            # PM sees ONLY teams attached to their projects (strictly user requirement 3)
            pm_teams = Team.query.filter(
                Team.project_id.in_(self.project_ids),
                Team.is_deleted == False
            ).all() if self.project_ids else []

            self.team_ids = [t.id for t in pm_teams]

            # Sprints within PM's projects
            pm_sprints = Sprint.query.filter(
                Sprint.project_id.in_(self.project_ids)
            ).all() if self.project_ids else []
            self.sprint_ids = [s.id for s in pm_sprints]

            # Users: Only team members of PM's attached teams
            if self.team_ids:
                memberships = TeamMember.query.filter(TeamMember.team_id.in_(self.team_ids)).all()
                self.user_ids = list(set([m.user_id for m in memberships]))
                for t in pm_teams:
                    if t.team_leader_id:
                        self.user_ids.append(t.team_leader_id)

        elif self.is_lead:
            # Team Lead sees ONLY their led/assigned team
            lead_teams = Team.query.filter(
                (Team.team_leader_id == u_id) | (Team.lead_id == u_id),
                Team.is_deleted == False
            ).all()

            if not lead_teams:
                # Fallback to team where TL is a member
                tm_records = TeamMember.query.filter_by(user_id=u_id).all()
                lead_teams = [Team.query.get(tm.team_id) for tm in tm_records if Team.query.get(tm.team_id)]

            self.team_ids = [t.id for t in lead_teams if t]

            # Projects: TL's led team's projects or where project.lead_id == u_id
            lead_proj_ids = set()
            for t in lead_teams:
                if t and t.project_id:
                    lead_proj_ids.add(t.project_id)
            for p in Project.query.filter_by(lead_id=u_id, is_active=True).all():
                lead_proj_ids.add(p.id)
            self.project_ids = list(lead_proj_ids)

            # Sprints belonging to TL's team or project
            sprints_query = Sprint.query.filter(
                (Sprint.team_id.in_(self.team_ids)) |
                (Sprint.project_id.in_(self.project_ids))
            ).all() if (self.team_ids or self.project_ids) else []
            self.sprint_ids = [s.id for s in sprints_query]

            # Developers: only members of TL's team
            if self.team_ids:
                memberships = TeamMember.query.filter(TeamMember.team_id.in_(self.team_ids)).all()
                self.user_ids = list(set([m.user_id for m in memberships]))

        elif self.is_dev:
            # Developer: Most restricted visibility
            dev_tasks = Task.query.filter_by(assigned_to_id=u_id).all()
            self.sprint_ids = list(set([t.sprint_id for t in dev_tasks if t.sprint_id]))
            self.project_ids = list(set([t.project_id for t in dev_tasks if t.project_id]))
            
            # Developer team membership
            my_tm = TeamMember.query.filter_by(user_id=u_id).all()
            self.team_ids = [tm.team_id for tm in my_tm]

            # Strictly user requirement 4: Developer only sees self
            self.user_ids = [u_id]

    def can_access_project(self, project_or_id):
        if self.is_admin:
            return True
        if not project_or_id:
            return False
        p_id = getattr(project_or_id, 'id', project_or_id)
        p_uuid = _parse_uuid(p_id)
        return (p_uuid in self.project_ids) or (p_id in self.project_ids)

    def can_access_team(self, team_or_id):
        if self.is_admin:
            return True
        if not team_or_id:
            return False
        t_id = getattr(team_or_id, 'id', team_or_id)
        t_uuid = _parse_uuid(t_id)
        return (t_uuid in self.team_ids) or (t_id in self.team_ids)

    def can_access_sprint(self, sprint_or_id):
        if self.is_admin:
            return True
        if not sprint_or_id:
            return False
        if isinstance(sprint_or_id, (str, uuid.UUID)):
            sprint = Sprint.query.get(_parse_uuid(sprint_or_id) or sprint_or_id)
        else:
            sprint = sprint_or_id
        if not sprint:
            return False
        if self.is_pm:
            return sprint.project_id in self.project_ids
        if self.is_lead:
            return (sprint.team_id in self.team_ids) or (sprint.project_id in self.project_ids)
        if self.is_dev:
            return sprint.id in self.sprint_ids
        return False

    def can_access_task(self, task):
        if self.is_admin:
            return True
        if not task:
            return False
        if self.is_dev:
            return str(task.assigned_to_id) == str(self.user.id)
        if self.is_lead:
            return (task.team_id in self.team_ids) or (task.sprint_id in self.sprint_ids) or (task.project_id in self.project_ids)
        if self.is_pm:
            return task.project_id in self.project_ids
        return False


def db_session_query_pm_ids(user_id):
    members = ProjectMember.query.filter_by(user_id=user_id, is_active=True).all()
    return [m.project_id for m in members]


def get_user_scope(user):
    """Convenience factory returning a UserScope instance."""
    return UserScope(user)
