from extensions import db
from models import ProjectHealthHistory, Notification, User, ProjectMember, Role
from datetime import datetime
from typing import Optional, Dict, List, Set

class HealthAlertService:
    """Service to handle health snapshot retrieval and alert notifications.

    Alerts are sent as in‑app ``Notification`` records to users with roles
    ADMIN, PM, or TL when any of the following conditions occur:
    * Overall health status downgrades (e.g., HEALTHY → WARNING or lower).
    * Overall score drops by 10 or more points.
    * A new **CRITICAL** or **HIGH** risk appears that was not present in the
      previous snapshot.
    """

    ALERT_ROLES = {"ADMIN", "PM", "TL"}

    @staticmethod
    def _last_snapshot(project_id: str) -> Optional[Dict]:
        """Return the most recent ``ProjectHealthHistory`` for the project as a dict.
        """
        last = (
            ProjectHealthHistory.query.filter_by(project_id=project_id)
            .order_by(ProjectHealthHistory.calculated_at.desc())
            .first()
        )
        return last.to_dict() if last else None

    @staticmethod
    def _project_members(project_id: str) -> List[User]:
        """Return users associated with the project who have a role in ``ALERT_ROLES``.
        """
        # Join ProjectMember -> User -> Role
        members = (
            User.query
            .join(ProjectMember, ProjectMember.user_id == User.id)
            .join(Role, Role.id == User.role_id)
            .filter(ProjectMember.project_id == project_id)
            .filter(Role.code.in_([f"ROLE_{r}" for r in HealthAlertService.ALERT_ROLES]))
            .all()
        )
        return members

    @staticmethod
    def maybe_send_alert(project_id: str, old_snapshot: Optional[Dict], new_snapshot: Dict) -> None:
        """Create ``Notification`` entries when alert conditions are met.
        ``old_snapshot`` may be ``None`` for the first calculation.
        """
        if not old_snapshot:
            # No prior snapshot, nothing to compare – no alert.
            return

        alerts: List[str] = []
        # Status downgrade detection (using defined order).
        status_order = ["HEALTHY", "WARNING", "AT_RISK", "CRITICAL", "NO_DATA"]
        old_status = old_snapshot.get("overall_status")
        new_status = new_snapshot.get("overall_status")
        if old_status and new_status and status_order.index(new_status) > status_order.index(old_status):
            alerts.append(f"Project health status downgraded from {old_status} to {new_status}.")

        # Large score drop detection.
        old_score = old_snapshot.get("overall_score") or 0
        new_score = new_snapshot.get("overall_score") or 0
        if old_score - new_score >= 10:
            alerts.append(f"Overall health score decreased by {old_score - new_score} points.")

        # New critical or high risk detection.
        def _risk_keys(snapshot: Dict) -> Set[str]:
            return {
                f"{r.get('id')}_{r.get('severity')}"
                for r in snapshot.get("risks", [])
                if r.get("severity") in {"CRITICAL", "HIGH"}
            }

        old_risk_keys = _risk_keys(old_snapshot)
        new_risk_keys = _risk_keys(new_snapshot)
        newly_added = new_risk_keys - old_risk_keys
        if newly_added:
            alerts.append("New high or critical risk(s) identified.")

        if not alerts:
            return

        # Create notifications for eligible members.
        members = HealthAlertService._project_members(project_id)
        for user in members:
            notif = Notification(
                recipient_id=user.id,
                title="Project Health Alert",
                message="\n".join(alerts),
                notification_type="HEALTH_ALERT",
                created_at=datetime.utcnow(),
                read=False,
            )
            db.session.add(notif)
        db.session.commit()
