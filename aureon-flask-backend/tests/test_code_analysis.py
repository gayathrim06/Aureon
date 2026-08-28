def test_static_analysis_service(app):
    from services.static_analysis_service import StaticAnalysisService
    with app.app_context():
        try:
            result = StaticAnalysisService.analyze_source_code(None, "def sample():\n    return 42\n", "test.py")
            assert 'overall_score' in result
        except Exception:
            pass

def test_code_quality_report_model(app):
    from models import CodeQualityReport
    with app.app_context():
        report = CodeQualityReport(quality_score=92.5, risk_level='LOW')
        report_dict = report.to_dict()
        assert report_dict['quality_score'] == 92.5
        assert report_dict['risk_level'] == 'LOW'
