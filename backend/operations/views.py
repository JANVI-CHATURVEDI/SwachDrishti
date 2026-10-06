from rest_framework import viewsets, generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils import timezone
from django.db.models import Count, Q
from datetime import timedelta

from .models import TaskAssignment
from .serializers import TaskAssignmentSerializer
from accounts.models import User
from reports.models import WasteReport
from incidents.models import Incident
from pickups.models import PickupRequest

class TaskAssignmentViewSet(viewsets.ModelViewSet):
    queryset = TaskAssignment.objects.select_related(
        'worker', 'supervisor', 'report', 'incident', 'pickup'
    ).all()
    serializer_class = TaskAssignmentSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = TaskAssignment.objects.select_related(
            'worker', 'supervisor', 'incident', 'pickup',
            'report', 'report__category', 'report__citizen',
            'report__citizen_verification',
        ).prefetch_related('report__duplicates').all()
        worker_id = self.request.query_params.get('worker_id')
        status_param = self.request.query_params.get('status')
        priority_param = self.request.query_params.get('priority')
        
        if self.request.user.is_authenticated and self.request.user.role == 'WORKER' and not worker_id:
            qs = qs.filter(worker=self.request.user)
        elif worker_id:
            qs = qs.filter(worker_id=worker_id)
            
        if status_param:
            qs = qs.filter(status=status_param.upper())
        if priority_param:
            qs = qs.filter(priority_level=priority_param.upper())
            
        return qs

class AssignTaskView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        worker_id = request.data.get('worker_id')
        report_id = request.data.get('report_id')
        incident_id = request.data.get('incident_id')
        pickup_id = request.data.get('pickup_id')
        notes = request.data.get('notes', '')

        try:
            worker = User.objects.get(id=worker_id)
        except User.DoesNotExist:
            return Response({'error': 'Worker not found'}, status=status.HTTP_404_NOT_FOUND)

        if getattr(worker, 'is_blacklisted', False):
            return Response({'error': f'{worker.username} is blacklisted and cannot be assigned tasks.'}, status=status.HTTP_400_BAD_REQUEST)

        supervisor = request.user if request.user.is_authenticated else None
        priority_level = 'HIGH'

        if report_id:
            try:
                rep = WasteReport.objects.get(id=report_id)
                rep.status = 'ASSIGNED'
                rep.save(update_fields=['status'])
                priority_level = rep.priority_level
            except WasteReport.DoesNotExist:
                return Response({'error': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)

        if incident_id:
            try:
                inc = Incident.objects.get(id=incident_id)
                inc.status = 'ASSIGNED'
                inc.save(update_fields=['status'])
                priority_level = inc.priority_level
            except Incident.DoesNotExist:
                return Response({'error': 'Incident not found'}, status=status.HTTP_404_NOT_FOUND)

        if pickup_id:
            try:
                pick = PickupRequest.objects.get(id=pickup_id)
                pick.status = 'ASSIGNED'
                pick.assigned_worker = worker
                pick.save(update_fields=['status', 'assigned_worker'])
            except PickupRequest.DoesNotExist:
                return Response({'error': 'Pickup request not found'}, status=status.HTTP_404_NOT_FOUND)

        assignment = TaskAssignment.objects.create(
            worker=worker,
            supervisor=supervisor,
            report_id=report_id,
            incident_id=incident_id,
            pickup_id=pickup_id,
            status='ASSIGNED',
            priority_level=priority_level,
            notes=notes
        )

        try:
            from core.notifications import notify_task_assigned
            if report_id:
                try:
                    label = WasteReport.objects.get(id=report_id).title
                except WasteReport.DoesNotExist:
                    label = f'Report #{report_id}'
            elif pickup_id:
                label = f'Pickup #{pickup_id}'
            elif incident_id:
                label = f'Incident #{incident_id}'
            else:
                label = f'Task #{assignment.pk}'
            notify_task_assigned(worker, label)
        except Exception:
            pass

        return Response({
            'message': f"Task successfully assigned to worker {worker.get_full_name() or worker.username}.",
            'assignment': TaskAssignmentSerializer(assignment).data
        }, status=status.HTTP_201_CREATED)

class TransitionTaskStatusView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk):
        try:
            task = TaskAssignment.objects.get(pk=pk)
        except TaskAssignment.DoesNotExist:
            return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status', 'IN_PROGRESS').upper()
        task.status = new_status
        now = timezone.now()

        if new_status == 'IN_PROGRESS' and not task.started_at:
            task.started_at = now
            if task.report:
                task.report.status = 'IN_PROGRESS'
                task.report.save(update_fields=['status'])
            if task.incident:
                task.incident.status = 'IN_PROGRESS'
                task.incident.save(update_fields=['status'])
            if task.pickup:
                task.pickup.status = 'IN_PROGRESS'
                task.pickup.save(update_fields=['status'])

        elif new_status == 'COMPLETED':
            task.completed_at = now
            notes = request.data.get('notes', '')
            if notes:
                task.notes = notes

            after_image = request.FILES.get('after_image')
            after_image_url = request.data.get('after_image_url', '')

            if task.report:
                task.report.status = 'RESOLVED'
                task.report.resolved_at = now
                if after_image:
                    task.report.after_image = after_image
                elif after_image_url:
                    task.report.after_image_url = after_image_url

                from ai_service.service import AIService
                before_bytes = None
                if task.report.image:
                    try:
                        before_bytes = task.report.image.read()
                    except Exception:
                        pass
                if not before_bytes:
                    before_bytes = AIService.fetch_image_bytes(task.report.image_url)
                after_bytes = None
                if after_image:
                    try:
                        after_bytes = after_image.read()
                        after_image.seek(0)
                    except Exception:
                        pass
                if not after_bytes:
                    after_bytes = AIService.fetch_image_bytes(after_image_url or task.report.after_image_url)

                verification_res = AIService.compare_cleanup(before_bytes, after_bytes, notes=notes)
                if verification_res.get('source') == 'gemini_vision' and not verification_res.get('verified'):
                    return Response({
                        'detail': 'AI verification failed (score %s/100). Retake the completion photo showing a cleaned site. AI saw: %s' % (
                            verification_res.get('cleanup_score'), verification_res.get('observation') or verification_res.get('verdict')),
                        'verdict': verification_res.get('verdict'),
                        'observation': verification_res.get('observation'),
                        'cleanup_score': verification_res.get('cleanup_score'),
                    }, status=status.HTTP_400_BAD_REQUEST)
                task.report.cleanup_score = verification_res.get('cleanup_score', 85 if after_image or after_image_url else 0)
                task.report.cleanup_verified = verification_res.get('verified', bool(after_image or after_image_url))
                task.report.cleanup_verdict = verification_res.get('verdict', 'Cleanup verified by worker evidence')
                task.report.cleanup_observation = (verification_res.get('observation') or '')[:500]
                task.report.save()

                from incidents.models import Evidence
                Evidence.objects.create(
                    report=task.report,
                    worker=task.worker,
                    before_image_url=task.report.image_url or (task.report.image.url if task.report.image else ''),
                    after_image=after_image,
                    after_image_url=after_image_url or (task.report.after_image.url if task.report.after_image else ''),
                    notes=notes or 'Completed by field sanitation team'
                )

            if task.incident:
                task.incident.status = 'RESOLVED'
                task.incident.resolved_at = now
                task.incident.save(update_fields=['status', 'resolved_at'])
            if task.pickup:
                task.pickup.status = 'COLLECTED'
                task.pickup.completed_at = now
                task.pickup.save(update_fields=['status', 'completed_at'])

        task.save()

        if new_status == 'COMPLETED' and task.worker:
            try:
                from core.badges import WORKER_COMPLETION_POINTS, award_worker_badges
                task.worker.impact_points += WORKER_COMPLETION_POINTS
                task.worker.save(update_fields=['impact_points'])
                award_worker_badges(task.worker)
            except Exception:
                pass

        if new_status == 'COMPLETED' and task.report:
            try:
                from core.notifications import notify_verification_required
                notify_verification_required(task.report)
            except Exception:
                pass

        return Response({
            'message': f'Task status updated to {new_status}.',
            'task': TaskAssignmentSerializer(task).data
        })

class SupervisorTeamSummaryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        workers = list(User.objects.filter(role='WORKER'))
        team_stats = []

        now = timezone.now()
        overdue_threshold = now - timedelta(hours=6)

        stats_by_worker = {
            row['worker_id']: row
            for row in TaskAssignment.objects.filter(
                worker_id__in=[w.id for w in workers]
            ).values('worker_id').annotate(
                total_tasks=Count('id'),
                active_count=Count('id', filter=Q(status__in=['ASSIGNED', 'IN_PROGRESS'])),
                completed_count=Count('id', filter=Q(status='COMPLETED')),
                overdue_count=Count('id', filter=Q(
                    status__in=['ASSIGNED', 'IN_PROGRESS'],
                    assigned_at__lte=overdue_threshold,
                )),
            )
        }

        for w in workers:
            s = stats_by_worker.get(w.id, {})
            active_count = s.get('active_count', 0)
            completed_count = s.get('completed_count', 0)
            overdue_count = s.get('overdue_count', 0)

            team_stats.append({
                'id': w.id,
                'name': w.get_full_name() or w.username,
                'username': w.username,
                'zone': w.zone or 'Central Ward',
                'ward': w.zone or 'Central Ward',
                'phone': w.phone,
                'is_blacklisted': w.is_blacklisted,
                'total_tasks': s.get('total_tasks', 0),
                'active_tasks': active_count,
                'active_tasks_count': active_count,
                'completed_today': completed_count,
                'overdue_tasks': overdue_count,
                'status': 'Busy' if active_count >= 3 else ('Available' if active_count == 0 else 'On Route')
            })

        task_totals = TaskAssignment.objects.aggregate(
            in_progress_tasks=Count('id', filter=Q(status='IN_PROGRESS')),
            completed_today=Count('id', filter=Q(status='COMPLETED', completed_at__date=now.date())),
        )
        report_totals = WasteReport.objects.aggregate(
            pending_incidents=Count('id', filter=Q(status__in=['REPORTED', 'VERIFIED'])),
            overdue_incidents=Count('id', filter=Q(
                status__in=['REPORTED', 'ASSIGNED', 'IN_PROGRESS'],
                created_at__lte=overdue_threshold,
            )),
        )

        pending_incidents = report_totals['pending_incidents']
        overdue_incidents = report_totals['overdue_incidents']
        in_progress_tasks = task_totals['in_progress_tasks']
        completed_today = task_totals['completed_today']

        summary_data = {
            'total_workers': len(workers),
            'in_progress_tasks': in_progress_tasks,
            'pending_incidents': pending_incidents,
            'overdue_incidents': overdue_incidents,
            'completed_today': completed_today,
        }

        return Response({
            'total_workers': len(workers),
            'in_progress_tasks': in_progress_tasks,
            'workers_status': team_stats,
            'team': team_stats,
            'summary': summary_data,
        })
