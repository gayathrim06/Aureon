def test_get_tasks_list(client):
    res = client.get('/api/v1/tasks/')
    assert res.status_code in [200, 401, 403]

def test_task_model_dictionary(app):
    from models import Task
    with app.app_context():
        task = Task(title='Implement OAuth SSO', status='TODO', priority='HIGH')
        task_dict = task.to_dict()
        assert task_dict['title'] == 'Implement OAuth SSO'
        assert task_dict['status'] == 'TODO'
        assert task_dict['priority'] == 'HIGH'
