from rest_framework import serializers
from project_health.models import ProjectHealth

class ProjectHealthSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectHealth
        fields = '__all__'
