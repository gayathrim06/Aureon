import logging
from github_integration.models import GithubCommit, GithubPullRequest, GithubIssue

logger = logging.getLogger(__name__)

class GitHubService:
    """Service class for GitHub API synchronization and metrics storage."""

    @staticmethod
    def sync_repository_activity(repository):
        """Simulates/Triggers GitHub API sync for commits, PRs, and issues."""
        logger.info(f"Syncing GitHub Repository: {repository.name}")
        return {
            "status": "SYNCED",
            "repository": repository.name,
            "total_commits": GithubCommit.objects.filter(repository=repository).count(),
            "open_prs": GithubPullRequest.objects.filter(repository=repository, status='OPEN').count()
        }
