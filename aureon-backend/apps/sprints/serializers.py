from rest_framework import serializers
from sprints.models import Sprint

class SprintSerializer(serializers.ModelSerializer):
    project_key = serializers.CharField(source='project.key', read_only=True)

    class Meta:
        model = Sprint
        fields = '__all__'
