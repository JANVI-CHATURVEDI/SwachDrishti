import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';

const PRIORITY_COLORS = {
  CRITICAL: '#F43F5E',
  HIGH: '#F59E0B',
  MEDIUM: '#3B82F6',
  LOW: '#64748B',
  RESOLVED: '#059669',
  PICKUP: '#8B5CF6',
};

/** slightly darker shade of a hex colour, for the gradient pin body */
function shade(hex, amount = 0.78) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  const r = Math.round(((n >> 16) & 255) * amount);
  const g = Math.round(((n >> 8) & 255) * amount);
  const b = Math.round((n & 255) * amount);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Circular gradient pin with a white ring + soft drop shadow.
 * Critical pins get a pulsing halo.
 */
const createCustomIcon = (color, label = '', { pulse = false, small = false } = {}) => {
  const hasLabel = label !== '' && label !== null && label !== undefined;
  const html = `
    <div class="sd-pin ${small ? 'sd-pin--sm' : ''}" style="color:${color}">
      ${pulse ? '<span class="sd-pin__halo"></span>' : ''}
      <span class="sd-pin__dot" style="background:linear-gradient(155deg, ${color} 0%, ${shade(color, 0.72)} 100%);">
        ${hasLabel ? String(label) : '<span style="width:7px;height:7px;background:#fff;border-radius:50%;display:block"></span>'}
      </span>
    </div>`;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html,
    iconSize: small ? [22, 22] : [30, 30],
    iconAnchor: small ? [11, 11] : [15, 15],
    popupAnchor: [0, small ? -14 : -18],
  });
};

const getMarkerColor = (item) => {
  if (item.status === 'RESOLVED' || item.status === 'CITIZEN_VERIFIED' || item.status === 'COLLECTED') {
    return PRIORITY_COLORS.RESOLVED;
  }
  const priority = (item.priority_level || '').toUpperCase();
  if (priority === 'CRITICAL') return PRIORITY_COLORS.CRITICAL;
  if (priority === 'HIGH') return PRIORITY_COLORS.HIGH;
  if (priority === 'LOW') return PRIORITY_COLORS.LOW;
  return PRIORITY_COLORS.MEDIUM;
};

function LocationPickerEvents({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function MapFocus({ focusRequest }) {
  const map = useMap();
  useEffect(() => {
    if (focusRequest && Number.isFinite(focusRequest.lat) && Number.isFinite(focusRequest.lng)) {
      map.flyTo([focusRequest.lat, focusRequest.lng], Math.max(map.getZoom(), 15), { duration: 0.8 });
    }
  }, [focusRequest, map]);
  return null;
}

const LEGEND = [
  { key: 'critical', label: 'Critical', color: PRIORITY_COLORS.CRITICAL },
  { key: 'high', label: 'High', color: PRIORITY_COLORS.HIGH },
  { key: 'medium', label: 'Medium', color: PRIORITY_COLORS.MEDIUM },
  { key: 'low', label: 'Low', color: PRIORITY_COLORS.LOW },
  { key: 'resolved', label: 'Resolved', color: PRIORITY_COLORS.RESOLVED },
  { key: 'pickup', label: 'Pickup', color: PRIORITY_COLORS.PICKUP },
  { key: 'hotspot', label: 'Hotspot', color: '#E11D48', dashed: true },
];

export default function MapView({
  center = [28.6280, 77.2180],
  zoom = 13,
  items = [],
  hotspots = [],
  pickups = [],
  routePolyline = null,
  selectedLocation = null,
  onLocationSelect = null,
  height = '500px',
  showHotspots = true,
  onItemClick = null,
  focusRequest = null,
  showLegend = true,
}) {
  return (
    <div
      style={{ height, width: '100%' }}
      className="relative overflow-hidden rounded-3xl border border-black/[0.06] bg-paper-2 shadow-soft"
    >
      <MapContainer
        center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : center}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        {onLocationSelect && <LocationPickerEvents onLocationSelect={onLocationSelect} />}
        {focusRequest && <MapFocus focusRequest={focusRequest} />}

        {selectedLocation && (
          <Marker
            position={[selectedLocation.lat, selectedLocation.lng]}
            icon={createCustomIcon(PRIORITY_COLORS.RESOLVED, '', { pulse: true })}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const pos = marker.getLatLng();
                if (onLocationSelect) onLocationSelect(pos.lat, pos.lng);
              },
            }}
          >
            <Popup autoPan autoPanPaddingTopLeft={[16, 88]} autoPanPaddingBottomRight={[16, 16]}>
              <div className="min-w-[210px] p-3.5">
                <div className="text-xs font-bold text-ink-900">Selected incident location</div>
                <div className="mono mt-1 text-xs text-slate-500">
                  {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
                </div>
                <div className="mt-2 text-xs text-slate-500">Drag the pin to fine-tune the spot.</div>
              </div>
            </Popup>
          </Marker>
        )}

        {showHotspots &&
          hotspots.map((h) => {
            const active = h.status === 'ACTIVE';
            const color = active ? '#E11D48' : PRIORITY_COLORS.RESOLVED;
            const radius = h.radius_meters || 150;
            return (
              <React.Fragment key={`hotspot-${h.id}`}>
                {/* soft "gradient" fill: two stacked discs */}
                <Circle
                  center={[h.latitude, h.longitude]}
                  radius={radius}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: 0.1,
                    weight: 2,
                    dashArray: '6, 7',
                    opacity: 0.9,
                  }}
                />
                <Circle
                  center={[h.latitude, h.longitude]}
                  radius={radius * 0.55}
                  pathOptions={{
                    color: 'transparent',
                    fillColor: color,
                    fillOpacity: 0.16,
                    weight: 0,
                  }}
                />
                <Marker
                  position={[h.latitude, h.longitude]}
                  icon={createCustomIcon(color, '', { pulse: active, small: true })}
                >
                  <Popup autoPan autoPanPaddingTopLeft={[16, 88]} autoPanPaddingBottomRight={[16, 16]}>
                    <div className="min-w-[230px]">
                      <div className="flex items-center gap-2 border-b border-black/[0.06] bg-gradient-to-r from-rose-50 to-white px-3.5 py-2.5">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                        <span className="text-xs font-bold uppercase tracking-[0.1em] text-rose-600">
                          Recurring hotspot
                        </span>
                      </div>
                      <div className="space-y-2 p-3.5">
                        <div className="text-sm font-bold text-ink-900">{h.name}</div>
                        <div className="text-xs text-slate-600">
                          <strong className="mono text-ink-900">{h.report_count}</strong> reports registered
                          · Trend <span className="mono font-semibold text-rose-600">+{h.trend_percentage}%</span>
                        </div>
                        {h.recommendation && (
                          <div className="rounded-xl border border-rose-200/70 bg-rose-50/80 p-2.5 text-xs leading-relaxed text-rose-900">
                            <strong>Operational advice:</strong> {h.recommendation}
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}

        {routePolyline && routePolyline.length > 1 && (
          <>
            <Polyline
              positions={routePolyline}
              pathOptions={{ color: '#ffffff', weight: 7, opacity: 0.75, lineJoin: 'round' }}
            />
            <Polyline
              positions={routePolyline}
              pathOptions={{
                color: '#059669',
                weight: 3.5,
                dashArray: '10, 10',
                opacity: 0.95,
                lineJoin: 'round',
              }}
            />
          </>
        )}

        {items.map((item) => {
          const color = getMarkerColor(item);
          const critical = (item.priority_level || '').toUpperCase() === 'CRITICAL';
          return (
            <Marker
              key={`report-${item.id}`}
              position={[item.latitude, item.longitude]}
              icon={createCustomIcon(color, item.route_order || item.marker_label || '', {
                pulse: critical,
              })}
              eventHandlers={{
                click: () => onItemClick && onItemClick(item),
              }}
            >
              <Popup autoPan autoPanPaddingTopLeft={[16, 88]} autoPanPaddingBottomRight={[16, 16]}>
                <div className="w-[248px] max-w-full">
                  {(item.image_url || item.image) && (
                    <div className="relative h-24 w-full bg-paper-2">
                      <img
                        src={item.image_url || item.image}
                        alt={item.title || 'Report'}
                        loading="lazy"
                        className="h-24 w-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-ink-950/55 to-transparent" />
                    </div>
                  )}
                  <div className="space-y-2.5 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="line-clamp-2 text-sm font-bold leading-snug text-ink-900">
                        {item.title || item.category_details?.name}
                      </span>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="text-xs leading-snug text-slate-600">{item.address}</div>
                    <div className="flex items-center justify-between gap-2 border-t border-black/[0.06] pt-2.5">
                      <PriorityBadge level={item.priority_level} score={item.priority_score} factors={item.priority_factors} />
                      <span className="mono text-xs text-slate-400">#{item.id}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {pickups.map((p) => (
          <Marker
            key={`pickup-${p.id}`}
            position={[p.latitude, p.longitude]}
            icon={createCustomIcon(PRIORITY_COLORS.PICKUP, '', { small: true })}
          >
            <Popup autoPan autoPanPaddingTopLeft={[16, 88]} autoPanPaddingBottomRight={[16, 16]}>
              <div className="min-w-[210px]">
                <div className="flex items-center gap-2 border-b border-black/[0.06] bg-gradient-to-r from-violet-50 to-white px-3.5 py-2.5">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-violet-500" />
                  <span className="text-xs font-bold uppercase tracking-[0.1em] text-violet-700">
                    On-demand pickup
                  </span>
                </div>
                <div className="space-y-1.5 p-3.5">
                  <div className="mono text-xs text-slate-400">#{p.id}</div>
                  <div className="text-sm font-bold text-ink-900">{p.waste_type}</div>
                  <div className="text-xs text-slate-600">{p.estimated_volume}</div>
                  <div className="text-xs text-slate-500">{p.address}</div>
                  <div className="pt-1"><StatusBadge status={p.status} /></div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {showLegend && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-mapctl hidden sm:block">
          <div className="glass flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl px-3 py-2 shadow-soft">
            {LEGEND.map((l) => (
              <span key={l.key} className="flex items-center gap-1.5 text-xs font-semibold text-ink-800">
                <span
                  className="h-2.5 w-2.5 rounded-full ring-1 ring-white"
                  style={
                    l.dashed
                      ? { background: 'transparent', border: `1.5px dashed ${l.color}` }
                      : { background: l.color }
                  }
                />
                {l.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
