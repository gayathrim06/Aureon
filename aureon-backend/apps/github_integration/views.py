from rest_framework import viewsets, permissions
from github_integration.models import GithubCommit, GithubPullRequest, GithubBranch, RepositoryMember
from github_integration.serializers import (
    GithubCommitSerializer, GithubPullRequestSerializer,
    GithubBranchSerializer, RepositoryMemberSerializer
)

class GithubCommitViewSet(viewsets.ModelViewSet):
    queryset = GithubCommit.objects.all()
    serializer_class = GithubCommitSerializer
    permission_classes = [permissions.IsAuthenticated]

class GithubPullRequestViewSet(viewsets.ModelViewSet):
    queryset = GithubPullRequest.objects.all()
    serializer_class = GithubPullRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

class GithubBranchViewSet(viewsets.ModelViewSet):
    queryset = GithubBranch.objects.all()
    serializer_class = GithubBranchSerializer
    permission_classes = [permissions.IsAuthenticated]

class RepositoryMemberViewSet(viewsets.ModelViewSet):
    queryset = RepositoryMember.objects.all()
    serializer_class = RepositoryMemberSerializer
    permission_classes = [permissions.IsAuthenticated]
