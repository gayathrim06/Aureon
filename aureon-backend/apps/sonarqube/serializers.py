from rest_framework import serializers
from sonarqube.models import CodeAnalysis, QualityGate

class QualityGateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QualityGate
        fields = '__all__'

class CodeAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodeAnalysis
        fields = '__all__'
