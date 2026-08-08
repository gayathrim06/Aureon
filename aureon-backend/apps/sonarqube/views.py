from rest_framework import viewsets, permissions
from sonarqube.models import CodeAnalysis, QualityGate
from sonarqube.serializers import CodeAnalysisSerializer, QualityGateSerializer

class QualityGateViewSet(viewsets.ModelViewSet):
    queryset = QualityGate.objects.all()
    serializer_class = QualityGateSerializer
    permission_classes = [permissions.IsAuthenticated]

class CodeAnalysisViewSet(viewsets.ModelViewSet):
    queryset = CodeAnalysis.objects.all()
    serializer_class = CodeAnalysisSerializer
    permission_classes = [permissions.IsAuthenticated]
