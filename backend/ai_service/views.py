from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status as http_status
from django.core.cache import cache
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta

from .service import AIService
from .nl_search import parse_natural_language_query
from reports.models import WasteReport
from reports.serializers import WasteReportSerializer
from hotspots.models import Hotspot
from core.forecast import forecast_hotspots
from core.geo import haversine_distance

VALID_STATUS = {
    'REPORTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS',
    'RESOLVED', 'CITIZEN_VERIFIED', 'REOPENED',
}
VALID_PRIORITY = {'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'}
INSIGHTS_CACHE_KEY = 'swachdrishti:ai_insights'
INSIGHTS_CACHE_TTL = 60 * 15


def _optimize(qs):
    if not hasattr(qs, 'select_related'):
        return qs
    return qs.select_related(
        'category', 'citizen', 'citizen_verification__citizen'
    ).annotate(duplicates_count=Count('duplicates', distinct=True))


def _serialize(qs):
    return WasteReportSerializer(_optimize(qs), many=True).data


class AIClassifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        image = request.FILES.get('image')
        description = (
            request.data.get('description')
            or request.data.get('text')
            or request.data.get('title')
            or ''
        )
        filename = getattr(image, 'name', '') or request.data.get('filename', '')

        image_bytes = image.read() if image else None
        mime_type = getattr(image, 'content_type', 'image/jpeg') or 'image/jpeg'

        result = AIService.classify_from_image(
            description=description,
            filename=filename,
            image_bytes=image_bytes,
            mime_type=mime_type,
        )

        translation = AIService.translate_description(description) if description else {}
        translated = (translation or {}).get('translated_text', '')

        category = result.get('category', 'Mixed waste')
        severity = (result.get('severity') or 'MEDIUM').upper()
        if translated and not description.strip():
            description = translated

        return Response({
            'category': category,
            'suggested_category_name': category,
            'severity': severity,
            'suggested_severity': severity,
            'summary': result.get('summary', ''),
            'suggested_title': result.get('suggested_title', ''),
            'suggested_description': result.get('suggested_description', ''),
            'confidence': result.get('confidence', 0.9),
            'source': result.get('source', 'heuristic_engine'),
            'hazard_flags': result.get('hazard_flags', []),
            'estimated_volume': result.get('estimated_volume', '1-2 bags'),
            'ai_suggested': bool(result.get('ai_suggested')),
            'translated_text': translated,
            'detected_language': (translation or {}).get('detected_language', 'unknown'),
        })


class NLAdminSearchView(APIView):
    permission_classes = [AllowAny]

    def _run(self, query):
        filters = AIService.structured_search(query)
        source = 'gemini'
        explanation = 'Gemini parsed the query into validated filters.'

        if filters:
            qs = self._apply_whitelisted(filters)
        else:
            source = 'regex'
            parsed = parse_natural_language_query(query)
            qs = WasteReport.objects.filter(id__in=parsed.get('report_ids', []))
            explanation = parsed.get('explanation', '')
            filters = self._regex_to_filters(parsed.get('structured_filters', {}))

        rows = list(_optimize(qs).order_by('-priority_score', '-created_at')[:30])
        payload = WasteReportSerializer(rows, many=True).data
        return {
            'query': query,
            'results': payload,
            'reports': payload,
            'report_ids': [r['id'] for r in payload],
            'matched_count': len(payload),
            'structured_filters': {k: str(v) for k, v in filters.items()},
            'explanation': explanation,
            'source': source,
        }

    @staticmethod
    def _apply_whitelisted(f: dict):
        qs = WasteReport.objects.all()

        if f.get('priority_level') in VALID_PRIORITY:
            qs = qs.filter(priority_level=f['priority_level'])

        statuses = [s for s in (f.get('status_in') or []) if s in VALID_STATUS]
        if statuses:
            qs = qs.filter(status__in=statuses)

        if f.get('category_icontains'):
            qs = qs.filter(category__name__icontains=str(f['category_icontains'])[:60])
        if f.get('zone'):
            qs = qs.filter(zone__icontains=str(f['zone'])[:60])
        if f.get('address_icontains'):
            qs = qs.filter(address__icontains=str(f['address_icontains'])[:80])

        if f.get('min_age_hours'):
            try:
                cutoff = timezone.now() - timedelta(hours=float(f['min_age_hours']))
                qs = qs.filter(created_at__lte=cutoff)
            except (TypeError, ValueError):
                pass

        try:
            lat, lng, radius = float(f['lat']), float(f['lng']), float(f['radius_meters'] or 2000)
        except (KeyError, TypeError, ValueError):
            return qs

        deg = radius / 111_000.0
        qs = qs.filter(
            latitude__gte=lat - deg, latitude__lte=lat + deg,
            longitude__gte=lng - deg * 1.4, longitude__lte=lng + deg * 1.4,
        )
        matched_ids = [
            r.id for r in qs
            if haversine_distance(lat, lng, r.latitude, r.longitude) <= radius
        ]
        return WasteReport.objects.filter(id__in=matched_ids)

    @staticmethod
    def _regex_to_filters(raw: dict) -> dict:
        out = {}
        for key, value in (raw or {}).items():
            out[key.replace('__in', '').replace('__icontains', '')] = value
        return out

    def get(self, request):
        query = request.query_params.get('q') or request.query_params.get('query', '')
        return Response(self._run(query))

    def post(self, request):
        query = request.data.get('query') or request.data.get('q', '')
        return Response(self._run(query))


class AIInsightsView(APIView):
    permission_classes = [AllowAny]

    @staticmethod
    def _aggregate() -> dict:
        total = WasteReport.objects.count()
        active = WasteReport.objects.filter(
            status__in=['REPORTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED']
        ).count()

        from django.db.models import Count
        top_cat = (
            WasteReport.objects.values('category__name')
            .annotate(n=Count('id')).order_by('-n').first()
        )
        top_zone = (
            WasteReport.objects.values('zone')
            .annotate(n=Count('id')).order_by('-n').first()
        )

        this_week = WasteReport.objects.filter(created_at__gte=timezone.now() - timedelta(days=7)).count()
        last_week = WasteReport.objects.filter(
            created_at__gte=timezone.now() - timedelta(days=14),
            created_at__lt=timezone.now() - timedelta(days=7),
        ).count()

        resolved_qs = WasteReport.objects.filter(resolved_at__isnull=False)
        secs = n = 0
        for created, done in resolved_qs.values_list('created_at', 'resolved_at')[:500]:
            if created and done:
                secs += (done - created).total_seconds()
                n += 1
        avg_hours = round(secs / n / 3600, 1) if n else 0

        overdue = WasteReport.objects.filter(
            status__in=['REPORTED', 'ASSIGNED', 'IN_PROGRESS'],
            created_at__lte=timezone.now() - timedelta(hours=6),
        ).count()

        return {
            'total_reports': total,
            'active_reports': active,
            'active_hotspots_count': Hotspot.objects.filter(status='ACTIVE').count(),
            'top_category': (top_cat or {}).get('category__name', 'Mixed waste'),
            'top_category_pct': round(top_cat['n'] / total * 100) if top_cat and total else 0,
            'top_zone': (top_zone or {}).get('zone', 'Zone 1 - Central'),
            'top_pickup_zone': (top_zone or {}).get('zone', 'Zone 1 - Central'),
            'reports_this_week': this_week,
            'reports_last_week': last_week,
            'week_over_week_pct': (
                round((this_week - last_week) / last_week * 100) if last_week else 0
            ),
            'avg_resolution_hours': avg_hours,
            'overdue_reports': overdue,
        }

    def get(self, request):
        cached = cache.get(INSIGHTS_CACHE_KEY)
        if cached:
            cached['cached'] = True
            return Response(cached)

        stats = self._aggregate()
        written = AIService.write_insights(stats)

        payload = {
            'summary': written['summary'],
            'actions': written.get('actions', []),
            'insights': [
                {
                    'id': idx + 1,
                    'type': 'generated_action',
                    'title': a.get('title', ''),
                    'description': a.get('detail', ''),
                    'priority': a.get('priority', 'MEDIUM'),
                    'action_label': 'Review',
                }
                for idx, a in enumerate(written.get('actions', []))
            ],
            'results': [],
            'stats': stats,
            'source': written.get('source', 'heuristic_engine'),
            'cached': False,
            'generated_at': timezone.now().isoformat(),
        }
        payload['results'] = payload['insights']
        cache.set(INSIGHTS_CACHE_KEY, payload, INSIGHTS_CACHE_TTL)
        return Response(payload)


class CleanupVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        before = request.FILES.get('before_image')
        after = request.FILES.get('after_image')
        notes = request.data.get('notes', '')
        report_id = request.data.get('report_id')

        before_bytes = before.read() if before else None

        if before_bytes is None and report_id:
            try:
                rep = WasteReport.objects.get(pk=report_id)
            except (WasteReport.DoesNotExist, ValueError, TypeError):
                return Response({'error': 'Report not found'}, status=http_status.HTTP_404_NOT_FOUND)
            if rep.image:
                try:
                    before_bytes = rep.image.read()
                except Exception:
                    before_bytes = None
            if before_bytes is None:
                before_bytes = AIService.fetch_image_bytes(rep.image_url)

        after_bytes = after.read() if after else None
        if after_bytes is None:
            after_bytes = AIService.fetch_image_bytes(request.data.get('after_image_url', ''))
        result = AIService.compare_cleanup(before_bytes, after_bytes, notes)
        result['ai_suggested'] = result.get('source') == 'gemini_vision'
        return Response(result)


class HotspotForecastView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            radius = float(request.query_params.get('radius_meters', 250.0))
        except (TypeError, ValueError):
            radius = 250.0
        try:
            horizon = int(request.query_params.get('horizon_hours', 48))
        except (TypeError, ValueError):
            horizon = 48

        forecasts = forecast_hotspots(radius_meters=radius, horizon_hours=horizon)
        return Response({
            'forecasts': forecasts,
            'likely_count': sum(1 for f in forecasts if f['likely_to_overflow']),
            'horizon_hours': horizon,
            'generated_at': timezone.now().isoformat(),
            'method': 'day-of-week seasonality x open-report density x unresolved age',
        })
