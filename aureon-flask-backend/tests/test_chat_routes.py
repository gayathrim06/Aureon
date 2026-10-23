import json
import pytest
from models import User, ChatMessage

def test_chat_unauthenticated(client):
    res = client.get('/api/v1/chat/channels')
    assert res.status_code == 401

def test_chat_list_channels(client):
    headers = {
        'X-User-Email': 'sainu@aureon.com',
        'X-User-Role': 'ROLE_DEV'
    }
    res = client.get('/api/v1/chat/channels', headers=headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert len(data['channels']) >= 1
    channel_ids = [c['id'] for c in data['channels']]
    assert 'general' in channel_ids
    assert 'ai-copilot' in channel_ids
    assert 'direct_contacts' in data
    assert len(data['direct_contacts']) > 0

def test_chat_get_messages_seeded(client):
    headers = {
        'X-User-Email': 'sainu@aureon.com',
        'X-User-Role': 'ROLE_DEV'
    }
    res = client.get('/api/v1/chat/messages?channel_id=general', headers=headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert data['channel_id'] == 'general'
    assert len(data['messages']) >= 1

def test_chat_send_and_delete_message(client):
    headers = {
        'X-User-Email': 'ram.kumar@aureon.com',
        'X-User-Role': 'ROLE_DEV',
        'Content-Type': 'application/json'
    }

    # 1. Send normal message
    payload = {
        'channel_id': 'general',
        'message': 'Testing chat messaging flow in Aureon.',
        'message_type': 'TEXT'
    }
    res = client.post('/api/v1/chat/messages', headers=headers, data=json.dumps(payload))
    assert res.status_code == 201
    created = res.get_json()
    assert created['success'] is True
    msg_id = created['message']['id']
    assert created['message']['message'] == 'Testing chat messaging flow in Aureon.'

    # 2. Send code snippet
    code_payload = {
        'channel_id': 'general',
        'message': 'function testSnippet() { return true; }',
        'message_type': 'CODE',
        'code_language': 'javascript'
    }
    code_res = client.post('/api/v1/chat/messages', headers=headers, data=json.dumps(code_payload))
    assert code_res.status_code == 201
    code_created = code_res.get_json()
    assert code_created['message']['message_type'] == 'CODE'
    assert code_created['message']['code_language'] == 'javascript'

    # 3. Delete own message
    del_res = client.delete(f'/api/v1/chat/messages/{msg_id}', headers=headers)
    assert del_res.status_code == 200
    assert del_res.get_json()['success'] is True

def test_team_lead_ai_copilot_prompt(client):
    """Verifies that Team Lead can invoke AI Copilot one-click analysis triggers."""
    headers = {
        'X-User-Email': 'krish@aureon.com',
        'X-User-Role': 'ROLE_LEAD',
        'Content-Type': 'application/json'
    }

    for p_type in ['standup', 'velocity', 'workload', 'blockers', 'quality']:
        res = client.post('/api/v1/chat/ai-prompt', headers=headers, data=json.dumps({'prompt_type': p_type}))
        assert res.status_code == 200
        data = res.get_json()
        assert data['success'] is True
        assert data['prompt_type'] == p_type
        assert 'user_message' in data
        assert 'ai_response' in data
        assert data['ai_response']['is_ai_response'] is True
        assert len(data['ai_response']['message']) > 30

def test_team_lead_ai_copilot_chat(client):
    """Verifies conversational querying with the AI Copilot."""
    headers = {
        'X-User-Email': 'krish@aureon.com',
        'X-User-Role': 'ROLE_LEAD',
        'Content-Type': 'application/json'
    }

    res = client.post('/api/v1/chat/messages', headers=headers, data=json.dumps({
        'channel_id': 'ai-copilot',
        'message': 'Who is available in my squad right now?'
    }))
    assert res.status_code == 201
    data = res.get_json()
    assert data['success'] is True
    assert data['ai_response'] is not None
    assert data['ai_response']['sender_role'] == 'AI_COPILOT'
    assert 'Engineers' in data['ai_response']['message'] or 'Available' in data['ai_response']['message'] or 'Workload' in data['ai_response']['message']
