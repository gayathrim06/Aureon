from django.db.models.signals import post_save
from django.dispatch import receiver
from tasks.models import Task
from bugs.models import Bug
from sprints.models import Sprint
from notifications.services import NotificationService

@receiver(post_save, sender=Task)
def task_notification_handler(sender, instance, created, **kwargs):
    if created and instance.assigned_to:
        NotificationService.send_notification(
            recipient=instance.assigned_to,
            title=f"New Task Assigned: {instance.task_id}",
            message=f"You have been assigned task '{instance.title}' by {instance.assigned_by.full_name if instance.assigned_by else 'Project Manager'}.",
            notification_type='TASK_ASSIGNED',
            priority='HIGH'
        )

@receiver(post_save, sender=Bug)
def bug_notification_handler(sender, instance, created, **kwargs):
    if created and instance.assignee:
        NotificationService.send_notification(
            recipient=instance.assignee,
            title=f"Bug Assigned: {instance.bug_id}",
            message=f"Defect '{instance.title}' (Severity: {instance.severity}) has been assigned to you.",
            notification_type='BUG_ASSIGNED',
            priority='HIGH'
        )

@receiver(post_save, sender=Sprint)
def sprint_notification_handler(sender, instance, created, **kwargs):
    if instance.status == 'ACTIVE' and instance.project and instance.project.lead:
        NotificationService.send_notification(
            recipient=instance.project.lead,
            title=f"Sprint Started: {instance.name}",
            message=f"Sprint '{instance.name}' is now ACTIVE for project {instance.project.name}.",
            notification_type='SPRINT_STARTED',
            priority='MEDIUM'
        )
