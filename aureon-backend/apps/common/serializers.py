from rest_framework import serializers

class BaseModelSerializer(serializers.ModelSerializer):
    """Base Serializer mapping BaseModel audit fields."""
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True, default=None)
    updated_by_name = serializers.CharField(source='updated_by.full_name', read_only=True, default=None)

    class Meta:
        abstract = True
