from rest_framework.routers import DefaultRouter
from github_integration.views import (
    GithubCommitViewSet, GithubPullRequestViewSet,
    GithubBranchViewSet, RepositoryMemberViewSet
)

router = DefaultRouter()
router.register(r'github/commits', GithubCommitViewSet, basename='github-commit')
router.register(r'github/prs', GithubPullRequestViewSet, basename='github-pr')
router.register(r'github/branches', GithubBranchViewSet, basename='github-branch')
router.register(r'github/members', RepositoryMemberViewSet, basename='github-member')

urlpatterns = router.urls
