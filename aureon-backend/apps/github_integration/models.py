from django.db import models
from common.models import BaseModel
from django.conf import settings
from repositories.models import Repository

class GithubCommit(BaseModel):
    """tbl_commit Model."""
    repository = models.ForeignKey(Repository, on_delete=models.CASCADE, related_name='commits')
    commit_hash = models.CharField(max_length=40, unique=True, db_index=True)
    message = models.TextField()
    author_name = models.CharField(max_length=150)
    author_email = models.CharField(max_length=150, db_index=True)
    branch = models.CharField(max_length=100, default='main')
    additions = models.IntegerField(default=0)
    deletions = models.IntegerField(default=0)
    committed_at = models.DateTimeField()

    class Meta:
        db_table = 'tbl_commit'
        ordering = ['-committed_at']


class GithubPullRequest(BaseModel):
    """tbl_pull_request Model."""
    STATUS_CHOICES = (
        ('OPEN', 'Open'),
        ('REVIEW', 'In Review'),
        ('MERGED', 'Merged'),
        ('CLOSED', 'Closed'),
    )

    repository = models.ForeignKey(Repository, on_delete=models.CASCADE, related_name='pull_requests')
    pr_number = models.IntegerField()
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=150)
    branch = models.CharField(max_length=100)
    base_branch = models.CharField(max_length=100, default='main')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN', db_index=True)
    additions = models.IntegerField(default=0)
    deletions = models.IntegerField(default=0)
    ci_status = models.CharField(max_length=30, default='PASSING')

    class Meta:
        db_table = 'tbl_pull_request'
        ordering = ['-created_at']


class GithubBranch(BaseModel):
    """tbl_branch Model."""
    repository = models.ForeignKey(Repository, on_delete=models.CASCADE, related_name='branches')
    name = models.CharField(max_length=100)
    latest_commit_hash = models.CharField(max_length=40, blank=True, null=True)

    class Meta:
        db_table = 'tbl_branch'
        unique_together = ('repository', 'name')


class RepositoryMember(BaseModel):
    """tbl_repository_member Junction Table."""
    repository = models.ForeignKey(Repository, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='repository_memberships')
    role_in_repo = models.CharField(max_length=50, default='Contributor')

    class Meta:
        db_table = 'tbl_repository_member'
        unique_together = ('repository', 'user')
