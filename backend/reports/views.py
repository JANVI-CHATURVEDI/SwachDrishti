from rest_framework import viewsets, generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta

from .models import WasteCategory, WasteReport, CitizenVerification
from .serializers import WasteCategorySerializer, WasteReportSerializer, CitizenVerificationSerializer
from hotspots.models import Hotspot
from core.geo import haversine_distance
from core.priority import calculate_priority
from accounts.permissions import IsReportOwnerOrStaff
from rest_framework.exceptions import PermissionDenied

class WasteCategoryListView(generics.ListAPIView):
    queryset = WasteCategory.objects.all()
    serializer_class = WasteCategorySerializer
    permission_classes = [AllowAny]
    pagination_class = None

class CheckDuplicateReportView(APIView):
    permission_classes = [AllowAny]

    def _check_duplicates(self, request):
        params = request.query_params if request.method == 'GET' else request.data
        try:
            lat = float(params.get('latitude', 0.0))
            lng = float(params.get('longitude', 0.0))
        except (ValueError, TypeError):
            lat, lng = 0.0, 0.0

        try:
            radius = float(params.get('radius_meters', 75.0))
        except (ValueError, TypeError):
            radius = 75.0

        two_days_ago = timezone.now() - timedelta(days=2)
        candidates = WasteReport.objects.filter(
            created_at__gte=two_days_ago,
            status__in=['REPORTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS']
        )

        matches = []
        for rep in candidates:
            dist = haversine_distance(lat, lng, rep.latitude, rep.longitude)
            if dist <= radius:
                matches.append({
                    'id': rep.id,
                    'title': rep.title or f"{rep.category.name} at {rep.address}",
                    'category': rep.category.name if rep.category else 'Mixed waste',
                    'status': rep.status,
                    'distance_meters': round(dist, 1),
                    'created_at': rep.created_at,
                    'image_url': rep.image_url or (rep.image.url if rep.image else ''),
                })

        return Response({
            'has_duplicate': len(matches) > 0,
            'match_count': len(matches),
            'existing_reports': matches,
            'nearby_incidents': matches,
            'results': matches,
            'message': 'Possible existing incident detected nearby.' if matches else 'No duplicate incidents nearby.'
        })

    def get(self, request):
        return self._check_duplicates(request)

    def post(self, request):
        return self._check_duplicates(request)

class WasteReportViewSet(viewsets.ModelViewSet):
    queryset = WasteReport.objects.all()
    serializer_class = WasteReportSerializer
    permission_classes = [IsReportOwnerOrStaff]

    COMPLETED_STATUSES = ('RESOLVED', 'CITIZEN_VERIFIED')
    CITIZEN_EDITABLE = {'title', 'description', 'address', 'severity', 'category'}
    SUPERVISOR_EDITABLE = {'title', 'description', 'address', 'zone', 'severity', 'category', 'status'}
    SUPERVISOR_STATUS_OPTIONS = {'REPORTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED'}

    def _role(self):
        u = self.request.user
        if not (u and u.is_authenticated):
            return None
        return getattr(u, 'role', None)

    def perform_update(self, serializer):
        instance = self.get_object()
        role = self._role()
        user = self.request.user if (self.request.user and self.request.user.is_authenticated) else None

        if instance.status in self.COMPLETED_STATUSES and role != 'ADMIN':
            raise PermissionDenied('Completed reports are locked. Only an admin can edit them.')

        if role == 'WORKER':
            raise PermissionDenied('Workers update reports via task transitions, not direct edits.')

        if role == 'CITIZEN':
            if not user or instance.citizen_id != user.id:
                raise PermissionDenied('You can only edit your own reports.')
            if instance.status != 'REPORTED':
                raise PermissionDenied('Citizens can only edit reports still in REPORTED state.')
            disallowed = set(self.request.data.keys()) - self.CITIZEN_EDITABLE
            # allow multipart noise keys
            disallowed -= {'image'}
            if disallowed:
                raise PermissionDenied(f'Citizens cannot change: {", ".join(sorted(disallowed))}.')

        if role == 'SUPERVISOR':
            disallowed = set(self.request.data.keys()) - self.SUPERVISOR_EDITABLE
            if disallowed:
                raise PermissionDenied(f'Supervisors cannot change: {", ".join(sorted(disallowed))}.')
            new_status = self.request.data.get('status')
            if new_status and new_status not in self.SUPERVISOR_STATUS_OPTIONS:
                raise PermissionDenied('Supervisors cannot mark reports RESOLVED directly. Complete via worker task with photo evidence.')

        severity_changed = 'severity' in self.request.data and self.request.data.get('severity') != instance.severity
        report = serializer.save()
        if severity_changed:
            try:
                age_hours = (timezone.now() - instance.created_at).total_seconds() / 3600.0 if instance.created_at else 0.0
                score, level, factors = calculate_priority(
                    severity=report.severity,
                    nearby_reports_count=0,
                    age_in_hours=min(age_hours, 72.0),
                    is_recurring_hotspot=False,
                    is_sensitive_context=False,
                )
                report.priority_score = score
                report.priority_level = level
                report.priority_factors = factors
                report.save(update_fields=['priority_score', 'priority_level', 'priority_factors'])
            except Exception:
                pass

    def get_queryset(self):
        qs = WasteReport.objects.select_related(
            'category', 'citizen', 'citizen_verification__citizen'
        ).annotate(
            duplicates_count=Count('duplicates', distinct=True)
        )
        status_param = self.request.query_params.get('status')
        priority_param = self.request.query_params.get('priority')
        category_param = self.request.query_params.get('category')
        zone_param = self.request.query_params.get('zone')
        my_reports = self.request.query_params.get('my_reports')
        
        if status_param:
            qs = qs.filter(status=status_param.upper())
        if priority_param:
            qs = qs.filter(priority_level=priority_param.upper())
        if category_param:
            qs = qs.filter(category__id=category_param)
        if zone_param:
            qs = qs.filter(zone=zone_param)
        if my_reports and self.request.user.is_authenticated:
            qs = qs.filter(citizen=self.request.user)
            
        return qs

    def perform_create(self, serializer):
        citizen = self.request.user if self.request.user.is_authenticated else None
        report = serializer.save(citizen=citizen)
        
        nearby_count = 0
        all_reports = WasteReport.objects.exclude(id=report.id).filter(
            status__in=['REPORTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS']
        )
        for other in all_reports:
            if haversine_distance(report.latitude, report.longitude, other.latitude, other.longitude) <= 150.0:
                nearby_count += 1
                
        is_recurring = False
        hotspots = Hotspot.objects.filter(status='ACTIVE')
        for h in hotspots:
            if haversine_distance(report.latitude, report.longitude, h.latitude, h.longitude) <= h.radius_meters:
                is_recurring = True
                h.report_count += 1
                h.save(update_fields=['report_count'])
                break
                
        is_sensitive = any(kw in (report.address or '').lower() for kw in ['school', 'hospital', 'market', 'station', 'metro', 'plaza'])
        
        report.update_priority(
            nearby_count=nearby_count,
            age_hours=0.0,
            is_recurring=is_recurring,
            is_sensitive=is_sensitive
        )

        if citizen:
            citizen.impact_points += 20
            citizen.add_badge_if_missing('Waste Watcher')
            citizen.save(update_fields=['impact_points'])
            try:
                from core.badges import award_citizen_badges
                award_citizen_badges(citizen)
            except Exception:
                pass

        try:
            from core.notifications import notify_report_submitted
            notify_report_submitted(report)
        except Exception:
            pass

class CitizenVerificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk):
        try:
            report = WasteReport.objects.get(pk=pk)
        except WasteReport.DoesNotExist:
            return Response({'error': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)

        is_resolved = request.data.get('is_resolved', True)
        reopen_reason = request.data.get('reopen_reason', '')
        feedback = request.data.get('feedback', '')
        citizen = request.user if request.user.is_authenticated else report.citizen

        verification, created = CitizenVerification.objects.update_or_create(
            report=report,
            defaults={
                'citizen': citizen,
                'is_resolved': is_resolved,
                'reopen_reason': reopen_reason if not is_resolved else '',
                'feedback': feedback
            }
        )

        if is_resolved:
            report.status = 'CITIZEN_VERIFIED'
            report.verified_at = timezone.now()
            report.save(update_fields=['status', 'verified_at'])
            if citizen:
                citizen.impact_points += 30
                citizen.add_badge_if_missing('Clean Street Contributor')
                citizen.save(update_fields=['impact_points'])
                try:
                    from core.badges import award_citizen_badges
                    award_citizen_badges(citizen)
                except Exception:
                    pass
        else:
            report.status = 'REOPENED'
            report.priority_score += 25.0
            report.priority_level = 'CRITICAL' if report.priority_score >= 65 else 'HIGH'
            report.priority_factors.append(f"Reopened by citizen: {reopen_reason}")
            report.save(update_fields=['status', 'priority_score', 'priority_level', 'priority_factors'])

        try:
            from core.notifications import notify_verification_outcome
            notify_verification_outcome(report, bool(is_resolved))
        except Exception:
            pass

        return Response({
            'message': 'Citizen verification recorded successfully.',
            'report_status': report.status,
            'verification': CitizenVerificationSerializer(verification).data,
            'citizen_verification': CitizenVerificationSerializer(verification).data,
        })
