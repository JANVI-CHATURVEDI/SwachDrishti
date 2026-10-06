from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CITIZEN = 'CITIZEN'
    ROLE_WORKER = 'WORKER'
    ROLE_SUPERVISOR = 'SUPERVISOR'
    ROLE_ADMIN = 'ADMIN'
    
    ROLE_CHOICES = [
        (ROLE_CITIZEN, 'Citizen'),
        (ROLE_WORKER, 'Sanitation Worker'),
        (ROLE_SUPERVISOR, 'Supervisor'),
        (ROLE_ADMIN, 'Administrator'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_CITIZEN)
    phone = models.CharField(max_length=20, blank=True, default='')
    zone = models.CharField(max_length=100, blank=True, default='Zone 1 - Central')
    is_blacklisted = models.BooleanField(default=False)
    impact_points = models.IntegerField(default=50)
    badges = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_citizen(self):
        return self.role == self.ROLE_CITIZEN
        
    def is_worker(self):
        return self.role == self.ROLE_WORKER

    def is_supervisor(self):
        return self.role == self.ROLE_SUPERVISOR

    def is_administrator(self):
        return self.role == self.ROLE_ADMIN or self.is_superuser
        
    def add_badge_if_missing(self, badge_name):
        if not self.badges:
            self.badges = []
        if badge_name not in self.badges:
            self.badges.append(badge_name)
            self.save(update_fields=['badges'])

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
