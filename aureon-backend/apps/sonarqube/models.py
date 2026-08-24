from django.db import models
from common.models import BaseModel
from projects.models import Project

class QualityGate(BaseModel):
    """tbl_quality_gate Model."""
    name = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, default='PASSED')
    rules_count = models.IntegerField(default=10)

    class Meta:
        db_table = 'tbl_quality_gate'


class CodeAnalysis(BaseModel):
    """
    tbl_code_analysis Model.
    SonarQube scan results: coverage, maintainability, reliability, security, technical debt, smells, duplications.
    """
    RATING_CHOICES = (('A', 'A'), ('B', 'B'), ('C', 'C'), ('D', 'D'), ('F', 'F'))

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='code_analyses')
    quality_gate = models.ForeignKey(QualityGate, on_delete=models.SET_NULL, null=True, blank=True)
    gate_status = models.CharField(max_length=20, default='PASSED', db_index=True)
    
    coverage_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=90.00)
    maintainability_rating = models.CharField(max_length=2, choices=RATING_CHOICES, default='A')
    reliability_rating = models.CharField(max_length=2, choices=RATING_CHOICES, default='A')
    security_rating = models.CharField(max_length=2, choices=RATING_CHOICES, default='A')
    
    technical_debt_minutes = models.IntegerField(default=0)
    code_smells_count = models.IntegerField(default=0)
    bugs_count = models.IntegerField(default=0)
    vulnerabilities_count = models.IntegerField(default=0)
    duplications_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    analysis_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tbl_code_analysis'
        ordering = ['-analysis_date']

    def __str__(self):
        return f"{self.project.key} Sonar Analysis ({self.gate_status})"
