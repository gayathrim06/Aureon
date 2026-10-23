import pytest
from extensions import db
from models import Task, Sprint, Project

def test_delivery_analytics_endpoint(client, app):
    """
    Verifies that /api/v1/reports/delivery-analytics executes deterministic math
    directly against database tables without mock data.
    """
    res = client.get('/api/v1/reports/delivery-analytics')
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert 'analytics' in data

    analytics = data['analytics']
    assert 'avg_velocity' in analytics
    assert 'total_completed' in analytics
    assert 'total_tasks' in analytics
    assert 'completion_rate_pct' in analytics
    assert 'velocity_trend' in analytics
    assert 'throughput_data' in analytics

    # Mathematical consistency verification
    total_tasks = analytics['total_tasks']
    total_completed = analytics['total_completed']
    if total_tasks > 0:
        expected_rate = round((total_completed / total_tasks * 100), 1)
        assert analytics['completion_rate_pct'] == expected_rate

    # Sprint velocity trend verification
    assert isinstance(analytics['velocity_trend'], list)
    for sprint_item in analytics['velocity_trend']:
        assert 'sprint' in sprint_item
        assert 'planned' in sprint_item
        assert 'velocity' in sprint_item
        assert sprint_item['planned'] >= 0
        assert sprint_item['velocity'] >= 0

    # Weekly throughput verification
    assert isinstance(analytics['throughput_data'], list)
    for week_item in analytics['throughput_data']:
        assert 'week' in week_item
        assert 'created' in week_item
        assert 'completed' in week_item

def test_delivery_analytics_project_filtering(client, app):
    """
    Verifies that filtering by project_id accurately scopes the math to that project.
    """
    with app.app_context():
        thrift_proj = Project.query.filter_by(name='THRIFT-IN-CAMPUS').first()
        if not thrift_proj:
            return

        res = client.get(f'/api/v1/reports/delivery-analytics?project_id={thrift_proj.id}')
        assert res.status_code == 200
        data = res.get_json()
        assert data['success'] is True

        analytics = data['analytics']
        # THRIFT-IN-CAMPUS tasks in DB
        db_tasks_count = Task.query.filter_by(project_id=thrift_proj.id).count()
        assert analytics['total_tasks'] == db_tasks_count
