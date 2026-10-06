from django.urls import path
from .views import RegisterView, LoginView, DemoLoginView, CurrentUserView, WorkersListView, StaffCreateView, BlacklistStaffView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('demo-login/', DemoLoginView.as_view(), name='demo-login'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('workers/', WorkersListView.as_view(), name='workers-list'),
    path('staff/', StaffCreateView.as_view(), name='staff-create'),
    path('staff/<int:pk>/blacklist/', BlacklistStaffView.as_view(), name='staff-blacklist'),
]
