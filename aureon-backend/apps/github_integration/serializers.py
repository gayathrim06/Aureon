from rest_framework import serializers
from github_integration.models import GithubCommit, GithubPullRequest, GithubBranch, RepositoryMember

class GithubCommitSerializer(serializers.ModelSerializer):
    class Meta:
        model = GithubCommit
        fields = '__all__'

class GithubPullRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = GithubPullRequest
        fields = '__all__'

class GithubBranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = GithubBranch
        fields = '__all__'

class RepositoryMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = RepositoryMember
        fields = '__all__'
