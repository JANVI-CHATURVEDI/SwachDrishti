import logging
from django.db import models
from django.conf import settings
from core.priority import calculate_priority

logger = logging.getLogger(__name__)

class WasteCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, default='trash-2')
    color = models.CharField(max_length=30, default='#059669')
    description = models.TextField(blank=True, default='')
    disposal_guide = models.TextField(blank=True, default='')

    class Meta:
        verbose_name_plural = 'Waste Categories'
        ordering = ['name']

    def __str__(self):
        return self.name

class WasteReport(models.Model):
    SEVERITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]

    STATUS_CHOICES = [
        ('REPORTED', 'Reported'),
        ('VERIFIED', 'Verified'),
        ('ASSIGNED', 'Assigned'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED', 'Resolved'),
        ('CITIZEN_VERIFIED', 'Citizen Verified'),
        ('REOPENED', 'Reopened'),
    ]

    citizen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='waste_reports'
    )
    category = models.ForeignKey(
        WasteCategory,
        on_delete=models.PROTECT,
        related_name='reports'
    )
    title = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='reports/%Y/%m/', null=True, blank=True)
    image_url = models.URLField(max_length=1000, blank=True, default='')
    latitude = models.FloatField()
    longitude = models.FloatField()
    address = models.CharField(max_length=300, default='Nearby Civic Location')
    zone = models.CharField(max_length=100, default='Zone 1 - Central')
    
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='REPORTED')
    
    priority_score = models.FloatField(default=20.0)
    priority_level = models.CharField(max_length=20, default='MEDIUM')
    priority_factors = models.JSONField(default=list, blank=True)
    
    is_duplicate = models.BooleanField(default=False)
    duplicate_of = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='duplicates')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    after_image = models.ImageField(upload_to='reports/after/%Y/%m/', null=True, blank=True)
    after_image_url = models.URLField(max_length=1000, blank=True, default='')
    cleanup_score = models.IntegerField(default=0)
    cleanup_verified = models.BooleanField(default=False)
    cleanup_verdict = models.CharField(max_length=200, blank=True, default='')
    cleanup_observation = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-priority_score', '-created_at']

    def update_priority(self, nearby_count=0, age_hours=0.0, is_recurring=False, is_sensitive=False):
        score, level, factors = calculate_priority(
            severity=self.severity,
            nearby_reports_count=nearby_count,
            age_in_hours=age_hours,
            is_recurring_hotspot=is_recurring,
            is_sensitive_context=is_sensitive,
        )
        self.priority_score = score
        self.priority_level = level
        self.priority_factors = factors
        self.save(update_fields=['priority_score', 'priority_level', 'priority_factors'])
        return score

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Sync public URLs AFTER the file is stored. Before the first save
        # the FieldFile still carries the raw client filename (no upload_to
        # prefix), so resolving .url early produces a bogus bucket-root URL.
        synced = {}
        if self.image:
            try:
                if self.image_url != self.image.url:
                    synced['image_url'] = self.image.url
            except Exception:
                logger.warning("Could not resolve storage URL for report image")
        if self.after_image:
            try:
                if self.after_image_url != self.after_image.url:
                    synced['after_image_url'] = self.after_image.url
            except Exception:
                logger.warning("Could not resolve storage URL for after image")
        if synced:
            type(self).objects.filter(pk=self.pk).update(**synced)
            self.image_url = synced.get('image_url', self.image_url)
            self.after_image_url = synced.get('after_image_url', self.after_image_url)

    def __str__(self):
        return f"Report #{self.id}: {self.category.name} at {self.address} ({self.status})"

class CitizenVerification(models.Model):
    REOPEN_REASONS = [
        ('WASTE_STILL_PRESENT', 'Waste still present'),
        ('WRONG_LOCATION', 'Wrong location'),
        ('INCOMPLETE_CLEANUP', 'Incomplete cleanup'),
        ('OTHER', 'Other'),
    ]

    report = models.OneToOneField(
        WasteReport,
        on_delete=models.CASCADE,
        related_name='citizen_verification'
    )
    citizen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    is_resolved = models.BooleanField()
    reopen_reason = models.CharField(max_length=50, choices=REOPEN_REASONS, blank=True, default='')
    feedback = models.TextField(blank=True, default='')
    verified_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        status_text = "Confirmed Resolved" if self.is_resolved else f"Reopened ({self.reopen_reason})"
        return f"Verification for #{self.report_id}: {status_text}"
