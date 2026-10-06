from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from .models import User
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer, StaffCreateSerializer, ProfileUpdateSerializer
from .permissions import IsSupervisor, IsAdminRole

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
            'message': 'User registered successfully.'
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
            'message': 'Login successful.'
        })

class DemoLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        role_req = request.data.get('role', 'admin').lower()
        role_map = {
            'admin': User.ROLE_ADMIN,
            'supervisor': User.ROLE_SUPERVISOR,
            'worker': User.ROLE_WORKER,
            'citizen': User.ROLE_CITIZEN,
        }
        target_role = role_map.get(role_req, User.ROLE_ADMIN)
        
        user = User.objects.filter(role=target_role, is_blacklisted=False).first()
        if not user:
            username = f"demo_{role_req}"
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': f"{role_req}@swachdrishti.gov",
                    'role': target_role,
                    'first_name': role_req.capitalize(),
                    'last_name': 'Official' if role_req != 'citizen' else 'Resident',
                    'zone': 'Zone 1 - Central',
                    'badges': ['Waste Watcher'] if target_role == User.ROLE_CITIZEN else []
                }
            )
            if created:
                user.set_password(f"{role_req}123")
                user.save()

        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
            'message': f'Switched to {user.get_role_display()} demo account successfully.'
        })

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from core.badges import get_user_stats, badge_catalog
        return Response({
            'user': UserSerializer(request.user).data,
            'stats': get_user_stats(request.user),
            'badge_catalog': badge_catalog(),
        })

    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'user': UserSerializer(request.user).data,
            'message': 'Profile updated. Notifications will now reach your new address.'
        })

class WorkersListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    pagination_class = None

    def get_queryset(self):
        u = self.request.user
        is_admin = u.is_authenticated and (u.role == User.ROLE_ADMIN or u.is_superuser)
        if is_admin:
            return User.objects.filter(role__in=[User.ROLE_WORKER, User.ROLE_SUPERVISOR])
        return User.objects.filter(role=User.ROLE_WORKER, is_blacklisted=False)

class BlacklistStaffView(APIView):
    """Blacklist / unblock a worker (supervisor+) or supervisor (admin only).

    Supervisor may blacklist WORKERs only. Admin may blacklist WORKERs and
    SUPERVISORs, never ADMINs (unless superuser) and never themselves.
    Blacklisting deletes auth tokens (forced logout) and hides the account
    from dispatch lists; existing task assignments stay for reassignment.
    """
    permission_classes = [IsSupervisor]

    def post(self, request, pk):
        try:
            target = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'Staff account not found.'}, status=status.HTTP_404_NOT_FOUND)

        me = request.user
        is_admin = me.role == User.ROLE_ADMIN or me.is_superuser
        blacklisted = request.data.get('blacklisted', True)
        blacklisted = blacklisted in (True, 'true', 'True', 1, '1')

        if target.pk == me.pk:
            return Response({'detail': 'You cannot blacklist yourself.'}, status=status.HTTP_400_BAD_REQUEST)
        if target.role not in (User.ROLE_WORKER, User.ROLE_SUPERVISOR):
            return Response({'detail': 'Only worker or supervisor accounts can be blacklisted.'}, status=status.HTTP_400_BAD_REQUEST)
        if target.role == User.ROLE_SUPERVISOR and not is_admin:
            return Response({'detail': 'Only administrators can blacklist a supervisor.'}, status=status.HTTP_403_FORBIDDEN)
        if target.role == User.ROLE_ADMIN and not me.is_superuser:
            return Response({'detail': 'Admin accounts cannot be blacklisted.'}, status=status.HTTP_403_FORBIDDEN)

        target.is_blacklisted = blacklisted
        target.save(update_fields=['is_blacklisted'])
        if blacklisted:
            Token.objects.filter(user=target).delete()
        return Response({
            'user': UserSerializer(target).data,
            'message': f"{target.username} {'blacklisted' if blacklisted else 'unblocked'}.",
        })

class StaffCreateView(APIView):
    permission_classes = [IsSupervisor]

    def post(self, request):
        role = (request.data.get('role') or User.ROLE_WORKER).upper()
        if role not in (User.ROLE_WORKER, User.ROLE_SUPERVISOR):
            return Response(
                {'role': 'Only WORKER or SUPERVISOR accounts can be created here.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if role == User.ROLE_SUPERVISOR and request.user.role != User.ROLE_ADMIN and not request.user.is_superuser:
            return Response(
                {'role': 'Only administrators can create supervisor accounts.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        data['role'] = role
        serializer = StaffCreateSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'user': UserSerializer(user).data,
            'message': f'{user.get_role_display()} account created. Credentials work immediately.',
        }, status=status.HTTP_201_CREATED)
