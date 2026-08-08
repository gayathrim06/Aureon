from rest_framework import serializers
from bugs.models import Bug

class BugSerializer(serializers.ModelSerializer):
    reporter_name = serializers.CharField(source='reporter.full_name', read_only=True, default=None)
    assignee_name = serializers.CharField(source='assignee.full_name', read_only=True, default=None)
    project_key = serializers.CharField(source='project.key', read_only=True)

    class Meta:
        model = Bug
        fields = '__all__'
