from rest_framework import serializers
from teams.models import Team
from users.serializers import UserSerializer

class TeamSerializer(serializers.ModelSerializer):
    lead_name = serializers.CharField(source='lead.full_name', read_only=True, default=None)
    members_list = UserSerializer(source='members', many=True, read_only=True)

    class Meta:
        model = Team
        fields = '__all__'
