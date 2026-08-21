from rest_framework import serializers
from projects.models import Project, Milestone

class MilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = '__all__'


class ProjectSerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source='manager.full_name', read_only=True, default=None)
    lead_name = serializers.CharField(source='lead.full_name', read_only=True, default=None)
    milestones = MilestoneSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = '__all__'
