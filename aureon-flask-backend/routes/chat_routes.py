import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import ChatMessage, User, Project, Team, TeamMember, ProjectMember, Task, Sprint
from services.rbac_service import get_auth_user, get_user_scope
from services.ai_copilot_service import generate_copilot_reply

chat_bp = Blueprint('chat', __name__, url_prefix='/api/v1/chat')

def _parse_uuid(val):
    if not val:
        return None
    if isinstance(val, uuid.UUID):
        return val
    try:
        return uuid.UUID(str(val))
    except Exception:
        return None

def _get_dm_channel_id(user_a_id, user_b_id):
    """Generates a deterministic channel_id for a 1-on-1 direct message between two users."""
    sorted_ids = sorted([str(user_a_id), str(user_b_id)])
    return f"dm-{sorted_ids[0]}-{sorted_ids[1]}"


@chat_bp.route('/channels', methods=['GET'])
@chat_bp.route('/channels/', methods=['GET'])
@jwt_required(optional=True)
def list_channels():
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'message': '401 Unauthorized: Authentication required.'}), 401

    # 1. AI Copilot Channel
    ai_channel = {
        'id': 'ai-copilot',
        'name': 'Aureon AI Copilot',
        'type': 'AI_COPILOT',
        'description': 'Intelligent engineering copilot for sprint velocity, workload, code quality, and blockers',
        'icon': 'Bot',
        'badge': 'AI ASSISTANT',
        'unread_count': 0,
        'is_online': True
    }

    # 2. General Engineering Channel
    general_channel = {
        'id': 'general',
        'name': 'General Engineering',
        'type': 'GENERAL',
        'description': 'Company-wide engineering discussions, daily standups, and team chatter',
        'icon': 'Hash',
        'badge': 'ALL HANDS',
        'unread_count': 0
    }

    # 3. Project Channels
    project_channels = []
    try:
        all_projects = Project.query.filter(Project.is_deleted == False).order_by(Project.name.asc()).all()
        u_id = user.id
        for p in all_projects:
            is_assigned_to_user = False
            if p.lead_id and p.lead_id == u_id:
                is_assigned_to_user = True
            elif p.manager_id and p.manager_id == u_id:
                is_assigned_to_user = True

            project_channels.append({
                'id': str(p.id),
                'name': f"{p.name} Squad",
                'type': 'PROJECT',
                'project_id': str(p.id),
                'description': p.description or f'Sprint and delivery collaboration for {p.name}',
                'status': p.status or 'ACTIVE',
                'priority': p.priority or 'HIGH',
                'health_score': p.health_score or 90,
                'is_lead_project': is_assigned_to_user,
                'icon': 'FolderKanban',
                'unread_count': 0
            })
    except Exception as e:
        print(f"[CHAT] Error fetching project channels: {e}")

    # 4. Direct Message Contacts (Team Members: PMs, Developers, QA)
    direct_contacts = []
    try:
        active_users = User.query.filter(
            User.is_active == True,
            User.account_status == 'ACTIVE',
            User.id != user.id
        ).all()

        for u in active_users:
            dm_id = _get_dm_channel_id(user.id, u.id)
            # Active tasks count
            active_tasks = Task.query.filter(
                Task.assigned_to_id == u.id,
                ~Task.status.in_(['COMPLETED', 'DONE', 'CLOSED', 'CANCELLED'])
            ).all()

            direct_contacts.append({
                'id': str(u.id),
                'dm_channel_id': dm_id,
                'name': u.display_name,
                'email': u.email,
                'role': u.role_name,
                'department': u.department or 'Engineering',
                'designation': u.designation or 'Software Engineer',
                'active_tasks_count': len(active_tasks),
                'is_online': True,
                'type': 'DIRECT',
                'unread_count': 0
            })
    except Exception as e:
        print(f"[CHAT] Error fetching direct contacts: {e}")

    return jsonify({
        'success': True,
        'ai_channel': ai_channel,
        'general_channel': general_channel,
        'project_channels': project_channels,
        'direct_contacts': direct_contacts,
        'channels': [ai_channel, general_channel] + project_channels
    }), 200


@chat_bp.route('/messages', methods=['GET'])
@chat_bp.route('/messages/', methods=['GET'])
@jwt_required(optional=True)
def get_messages():
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'message': '401 Unauthorized: Authentication required.'}), 401

    channel_id = request.args.get('channel_id', 'general').strip()
    limit = min(int(request.args.get('limit', 100)), 200)
    since_str = request.args.get('since', None)

    # Scoped query
    if channel_id == 'ai-copilot':
        # Private AI messages for this user
        query = ChatMessage.query.filter(
            ChatMessage.channel_id == 'ai-copilot',
            (ChatMessage.sender_id == user.id) | (ChatMessage.recipient_id == user.id),
            ChatMessage.is_deleted == False
        )
    elif channel_id.startswith('dm-'):
        # Direct Message between 2 users
        query = ChatMessage.query.filter(
            ChatMessage.channel_id == channel_id,
            ChatMessage.is_deleted == False
        )
    else:
        # Channel messages (general or project UUID)
        query = ChatMessage.query.filter(
            ChatMessage.channel_id == channel_id,
            ChatMessage.is_deleted == False
        )

    if since_str:
        try:
            since_dt = datetime.fromisoformat(since_str.replace('Z', '+00:00'))
            query = query.filter(ChatMessage.created_at > since_dt)
        except Exception:
            pass

    messages = query.order_by(ChatMessage.created_at.asc()).limit(limit).all()

    # If ai-copilot is completely empty for this user, seed a friendly welcome message!
    if channel_id == 'ai-copilot' and len(messages) == 0:
        welcome_text = generate_copilot_reply("hello", user)
        welcome_msg = ChatMessage(
            channel_id='ai-copilot',
            channel_type='AI_COPILOT',
            sender_id=None,
            sender_name='Aureon AI Copilot',
            sender_role='AI_COPILOT',
            recipient_id=user.id,
            message=welcome_text,
            message_type='TEXT',
            is_ai_response=True,
            created_at=datetime.utcnow()
        )
        db.session.add(welcome_msg)
        db.session.commit()
        messages = [welcome_msg]

    # If general is completely empty, seed 2 default greeting messages
    if channel_id == 'general' and len(messages) == 0:
        _seed_general_defaults()
        messages = ChatMessage.query.filter(
            ChatMessage.channel_id == 'general',
            ChatMessage.is_deleted == False
        ).order_by(ChatMessage.created_at.asc()).all()

    return jsonify({
        'success': True,
        'channel_id': channel_id,
        'count': len(messages),
        'messages': [m.to_dict() for m in messages]
    }), 200


@chat_bp.route('/messages', methods=['POST'])
@chat_bp.route('/messages/', methods=['POST'])
@jwt_required(optional=True)
def send_message():
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'message': '401 Unauthorized: Authentication required.'}), 401

    data = request.get_json(silent=True) or {}
    message_text = (data.get('message') or '').strip()
    channel_id = (data.get('channel_id') or 'general').strip()
    message_type = (data.get('message_type') or 'TEXT').strip().upper()
    code_language = data.get('code_language')
    recipient_id = _parse_uuid(data.get('recipient_id'))

    if not message_text:
        return jsonify({'success': False, 'message': 'Message text is required.'}), 400

    # Determine channel type & project linkage
    proj_uuid = _parse_uuid(channel_id)
    project_id = None
    channel_type = 'GENERAL'

    if channel_id == 'ai-copilot':
        channel_type = 'AI_COPILOT'
    elif channel_id.startswith('dm-'):
        channel_type = 'DIRECT'
    elif proj_uuid:
        proj = Project.query.get(proj_uuid)
        if proj:
            project_id = proj.id
            channel_type = 'PROJECT'

    # Save user message
    chat_msg = ChatMessage(
        channel_id=channel_id,
        channel_type=channel_type,
        project_id=project_id,
        sender_id=user.id,
        recipient_id=recipient_id,
        sender_name=user.display_name,
        sender_role=user.role_name,
        message=message_text,
        message_type=message_type if message_type in ['TEXT', 'CODE', 'ALERT'] else 'TEXT',
        code_language=code_language[:50] if code_language else None,
        is_ai_response=False,
        created_at=datetime.utcnow()
    )

    db.session.add(chat_msg)
    db.session.commit()

    # Trigger AI Copilot Response if in ai-copilot or if mentioned
    ai_response_dict = None
    if channel_id == 'ai-copilot' or '@copilot' in message_text.lower() or '@ai' in message_text.lower():
        ai_reply_text = generate_copilot_reply(message_text, user)
        ai_msg = ChatMessage(
            channel_id=channel_id,
            channel_type=channel_type,
            project_id=project_id,
            sender_id=None,
            sender_name='Aureon AI Copilot',
            sender_role='AI_COPILOT',
            recipient_id=user.id,
            message=ai_reply_text,
            message_type='TEXT',
            is_ai_response=True,
            created_at=datetime.utcnow()
        )
        db.session.add(ai_msg)
        db.session.commit()
        ai_response_dict = ai_msg.to_dict()

    return jsonify({
        'success': True,
        'message': chat_msg.to_dict(),
        'ai_response': ai_response_dict
    }), 201


@chat_bp.route('/ai-prompt', methods=['POST'])
@chat_bp.route('/ai-prompt/', methods=['POST'])
@jwt_required(optional=True)
def trigger_ai_prompt():
    """Directly triggers predefined Team Lead quick prompts (standup, velocity, workload, blockers, quality)."""
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'message': '401 Unauthorized: Authentication required.'}), 401

    data = request.get_json(silent=True) or {}
    prompt_type = (data.get('prompt_type') or 'standup').lower().strip()

    prompt_map = {
        'standup': 'Generate daily standup summary for my squad',
        'velocity': 'Check sprint burndown and velocity progress',
        'workload': 'Who is available and what is developer workload?',
        'blockers': 'Scan for critical blockers, delays, and overdue deliverables',
        'quality': 'Review code quality, Radon complexity, and PR review status',
        'my_tasks': 'Summarize my assigned sprint tasks and upcoming priorities',
        'pre_pr': 'Review pre-PR checklist and code quality guidelines'
    }

    user_query = prompt_map.get(prompt_type, 'Generate daily standup summary for my squad')

    # Record user message in ai-copilot channel
    user_msg = ChatMessage(
        channel_id='ai-copilot',
        channel_type='AI_COPILOT',
        sender_id=user.id,
        sender_name=user.display_name,
        sender_role=user.role_name,
        recipient_id=user.id,
        message=user_query,
        message_type='TEXT',
        is_ai_response=False,
        created_at=datetime.utcnow()
    )
    db.session.add(user_msg)

    # Generate AI Copilot reply
    ai_reply_text = generate_copilot_reply(user_query, user)
    ai_msg = ChatMessage(
        channel_id='ai-copilot',
        channel_type='AI_COPILOT',
        sender_id=None,
        sender_name='Aureon AI Copilot',
        sender_role='AI_COPILOT',
        recipient_id=user.id,
        message=ai_reply_text,
        message_type='TEXT',
        is_ai_response=True,
        created_at=datetime.utcnow()
    )
    db.session.add(ai_msg)
    db.session.commit()

    return jsonify({
        'success': True,
        'prompt_type': prompt_type,
        'user_message': user_msg.to_dict(),
        'ai_response': ai_msg.to_dict()
    }), 200


@chat_bp.route('/messages/<string:message_id>', methods=['DELETE'])
@chat_bp.route('/messages/<string:message_id>/', methods=['DELETE'])
@jwt_required(optional=True)
def delete_message(message_id):
    user = get_auth_user()
    if not user:
        return jsonify({'success': False, 'message': '401 Unauthorized: Authentication required.'}), 401

    msg_uuid = _parse_uuid(message_id)
    if not msg_uuid:
        return jsonify({'success': False, 'message': 'Invalid message ID.'}), 400

    msg = ChatMessage.query.get(msg_uuid)
    if not msg or msg.is_deleted:
        return jsonify({'success': False, 'message': 'Message not found.'}), 404

    scope = get_user_scope(user)
    is_owner = str(msg.sender_id) == str(user.id)
    is_admin = scope.is_admin or (user.role and user.role.code in ['ROLE_ADMIN', 'ROLE_LEAD'])

    if not is_owner and not is_admin:
        return jsonify({'success': False, 'message': '403 Forbidden: You can only delete your own messages.'}), 403

    msg.is_deleted = True
    msg.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Message deleted successfully.'
    }), 200


def _seed_general_defaults():
    """Seeds baseline messages in general channel if empty."""
    pm_user = User.query.filter_by(email='gopika@aureon.com').first()
    dev_user = User.query.filter_by(email='rinta@aureon.com').first()

    if pm_user:
        m1 = ChatMessage(
            channel_id='general',
            channel_type='GENERAL',
            sender_id=pm_user.id,
            sender_name=pm_user.display_name,
            sender_role='ROLE_PM',
            message="Good morning team! Sprint 4 deliverables are on schedule. Please ensure all pull requests are linked to their corresponding task ticket.",
            message_type='TEXT',
            created_at=datetime.utcnow()
        )
        db.session.add(m1)

    if dev_user:
        m2 = ChatMessage(
            channel_id='general',
            channel_type='GENERAL',
            sender_id=dev_user.id,
            sender_name=dev_user.display_name,
            sender_role='ROLE_DEV',
            message="Working on the API endpoint optimization today. Pylint and Radon metrics are passing the PostgreSQL quality gate.",
            message_type='TEXT',
            created_at=datetime.utcnow()
        )
        db.session.add(m2)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
