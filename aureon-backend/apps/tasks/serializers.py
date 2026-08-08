from rest_framework import serializers
from tasks.models import Task, TaskComment, TaskAttachment, TaskHistory
from users.serializers import UserSerializer

class TaskCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)

    class Meta:
        model = TaskComment
        fields = '__all__'


class TaskAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskAttachment
        fields = '__all__'


class TaskHistorySerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.full_name', read_only=True)

    class Meta:
        model = TaskHistory
        fields = '__all__'


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True, default=None)
    assigned_by_name = serializers.CharField(source='assigned_by.full_name', read_only=True, default=None)
    project_key = serializers.CharField(source='project.key', read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    attachments = TaskAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = '__all__'
