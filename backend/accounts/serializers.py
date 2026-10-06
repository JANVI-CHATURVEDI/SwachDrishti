from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'zone', 'impact_points', 'badges', 'created_at',
            'is_blacklisted'
        ]
        read_only_fields = ['id', 'created_at', 'impact_points', 'badges', 'is_blacklisted']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role', 'phone', 'zone']
        extra_kwargs = {'role': {'required': False}}

    def create(self, validated_data):
        validated_data.pop('role', None)
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=User.ROLE_CITIZEN,
            phone=validated_data.get('phone', ''),
            zone=validated_data.get('zone', 'Zone 1 - Central'),
            badges=['Waste Watcher'],
        )

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        user = authenticate(username=username, password=password)
        if not user:
            try:
                user_obj = User.objects.get(email=username)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                user = None
        if not user:
            raise serializers.ValidationError("Invalid credentials. Please verify your username/email and password.")
        if getattr(user, 'is_blacklisted', False):
            raise serializers.ValidationError("This account has been blacklisted. Contact your administrator.")
        data['user'] = user
        return data

class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'phone', 'zone']

class StaffCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=[User.ROLE_WORKER, User.ROLE_SUPERVISOR])

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role', 'phone', 'zone']

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data['role'],
            phone=validated_data.get('phone', ''),
            zone=validated_data.get('zone', 'Zone 1 - Central'),
            badges=[],
        )
