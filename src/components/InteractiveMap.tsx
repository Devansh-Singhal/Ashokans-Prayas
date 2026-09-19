import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Text, Image } from 'react-native';
import { Ticket } from '../types';

let NativeOsmMapComponent: React.FC<any> | null = null;
if (Platform.OS !== 'web') {
  // require() stays behind this gate: Metro's platform resolver drops it for
  // web bundles, so react-native-maps is never pulled into the web build.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  NativeOsmMapComponent = require('./NativeOsmMap').NativeOsmMap;
}

interface MapArea {
  center: { latitude: number; longitude: number };
  zoom: number;
  pillLabel: string;
  radarTitle: string;
  radarSubtitle: string;
  userPopupPlace: string;
  iframeTitle: string;
}

interface Props {
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  onSelectTicket: (ticket: Ticket) => void;
  userCoords?: { latitude: number; longitude: number };
  area?: MapArea;
}

export const InteractiveMap: React.FC<Props> = ({
  tickets,
  selectedTicket,
  onSelectTicket,
  userCoords = { latitude: 28.6289, longitude: 77.2065 },
  area,
}) => {
  const fallbackCenter = area?.center ?? userCoords;
  const fallbackZoom = area?.zoom ?? 15;
  const pillLabel = area?.pillLabel ?? 'WARD 14 • CENTRAL DELHI GEOSPATIAL RADAR';
  const radarTitle = area?.radarTitle ?? 'WARD 14 GEOSPATIAL RADAR';
  const radarSubtitlePlace = area?.radarSubtitle ?? 'Central Delhi Corridor';
  const userPopupPlace = area?.userPopupPlace ?? 'Ward 14, Delhi';
  const iframeTitle = area?.iframeTitle ?? 'CivicFeed Ward 14 Map';
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Send message to Leaflet iframe when selectedTicket changes
  useEffect(() => {
    if (selectedTicket && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'FLY_TO_TICKET',
          ticketId: selectedTicket.id,
          lat: selectedTicket.latitude,
          lng: selectedTicket.longitude,
        },
        '*'
      );
    }
  }, [selectedTicket]);

  // Listen for pin clicks from inside Leaflet iframe
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleMessage = (event: MessageEvent) => {
      // Production should pin tile/postMessage origins. srcDoc iframes have
      // origin 'null', so accept same-origin or 'null' and require a ticketId.
      if (event.origin !== window.location.origin && event.origin !== 'null') return;
      if (!event.data || typeof event.data !== 'object' || !event.data.ticketId) return;
      if (event.data?.type === 'TICKET_CLICKED') {
        const found = tickets.find((t) => t.id === event.data.ticketId);
        if (found) {
          onSelectTicket(found);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [tickets, onSelectTicket]);

  // Generate self-contained Leaflet HTML with zero-shift anchor geometry
  const generateLeafletHtml = () => {
    const centerLat = selectedTicket?.latitude ?? fallbackCenter.latitude;
    const centerLng = selectedTicket?.longitude ?? fallbackCenter.longitude;

    const ticketsData = JSON.stringify(
      tickets.map((t) => ({
        id: t.id,
        category: t.category,
        status: t.status,
        severity: t.severity,
        upvotes: t.upvotes,
        lat: t.latitude,
        lng: t.longitude,
        isSelected: selectedTicket?.id === t.id,
      }))
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #0F172A; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; overflow: hidden; }
    
    /* Fixed Anchor Marker: NO CSS transform scales that cause anchor drift */
    .custom-pin {
      background: transparent;
      border: none;
      transition: filter 0.15s ease;
    }
    .custom-pin:hover {
      filter: brightness(1.15);
    }
    
    /* Delhi Ward 14 Boundary watermark */
    .ward-pill {
      position: absolute;
      top: 12px;
      left: 12px;
      z-index: 1000;
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(8px);
      border: 1px solid #334155;
      padding: 6px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      color: #38BDF8;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }

    /* Minimalist Leaflet popup style */
    .leaflet-popup-content-wrapper {
      background: #1E293B;
      color: #F8FAFC;
      border-radius: 12px;
      border: 1px solid #334155;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      padding: 4px 6px;
    }
    .leaflet-popup-tip {
      background: #1E293B;
      border: 1px solid #334155;
    }
    .leaflet-popup-content {
      margin: 8px 10px;
      font-size: 12px;
      line-height: 1.4;
    }
    .popup-title {
      font-weight: 700;
      color: #FFFFFF;
      font-size: 13px;
      margin-bottom: 3px;
    }
    .popup-status {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-REPORTED { color: #EF4444; }
    .status-PROVISIONAL_FIX { color: #F59E0B; }
    .status-RESOLVED { color: #10B981; }
    
    /* GPS User location pulsing dot */
    .user-pulse-dot {
      width: 16px;
      height: 16px;
      background: #38BDF8;
      border-radius: 50%;
      border: 2.5px solid #FFFFFF;
      box-shadow: 0 0 10px rgba(56, 189, 248, 0.8);
      animation: pulse 2s infinite ease-out;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.7); }
      70% { box-shadow: 0 0 0 12px rgba(56, 189, 248, 0); }
      100% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
    }
  </style>
</head>
<body>
  <div class="ward-pill">${pillLabel}</div>
  <div id="map"></div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const tickets = ${ticketsData};
    const userLat = ${userCoords.latitude};
    const userLng = ${userCoords.longitude};
    const centerLat = ${centerLat};
    const centerLng = ${centerLng};
    const mapZoom = ${fallbackZoom};

    // Initialize Map with dark tiles
    const map = L.map('map', {
      center: [centerLat, centerLng],
      zoom: mapZoom,
      zoomControl: false,
    });

    // CartoDB dark_matter tiles to match #0F172A chrome
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Zoom controls at bottom right for thumb accessibility
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Marker repository
    const markersMap = {};

    function getPinColor(status) {
      if (status === 'RESOLVED') return '#10B981';
      if (status === 'PROVISIONAL_FIX') return '#F59E0B';
      return '#EF4444';
    }

    function createSvgIcon(status, isSelected) {
      const color = getPinColor(status);
      // Fixed physical geometry: size 28x36, tip at bottom center (14, 36)
      // Zero shift: Anchor is ALWAYS exactly [14, 36].
      // When selected, we draw a crisp white border ring and subtle outer stroke INSIDE the SVG.
      const strokeColor = isSelected ? '#FFFFFF' : '#0F172A';
      const strokeWidth = isSelected ? '2.5' : '1.5';
      const glowRing = isSelected
        ? '<circle cx="14" cy="14" r="12" stroke="#FFFFFF" stroke-width="1.5" stroke-dasharray="3 2" opacity="0.8" />'
        : '';

      const svgHtml = \`
        <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          \${glowRing}
          <path d="M14 36C14 36 26 22 26 14C26 6.82 20.63 1 14 1C7.37 1 2 6.82 2 14C2 22 14 36 14 36Z"
                fill="\${color}"
                stroke="\${strokeColor}"
                stroke-width="\${strokeWidth}" />
          <circle cx="14" cy="14" r="5" fill="#FFFFFF" />
          <circle cx="14" cy="14" r="2.5" fill="\${color}" />
        </svg>
      \`;

      return L.divIcon({
        className: 'custom-pin',
        html: svgHtml,
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        popupAnchor: [0, -36],
      });
    }

    // Add User GPS marker
    const userIcon = L.divIcon({
      className: 'user-pin',
      html: '<div class="user-pulse-dot"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    L.marker([userLat, userLng], { icon: userIcon })
      .bindPopup('<b style="color:#38BDF8;">Your Live GPS Location</b><br>${userPopupPlace}')
      .addTo(map);

    // Plot all Tickets with fixed zero-shift anchors
    tickets.forEach(ticket => {
      const icon = createSvgIcon(ticket.status, ticket.isSelected);
      const marker = L.marker([ticket.lat, ticket.lng], {
        icon: icon,
        riseOnHover: true,
      }).addTo(map);

      marker.on('click', () => {
        // Send message to React Native parent
        window.parent.postMessage({ type: 'TICKET_CLICKED', ticketId: ticket.id }, '*');
      });

      markersMap[ticket.id] = { marker, ticket };
    });

    // Handle incoming messages from React Native parent
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'FLY_TO_TICKET') {
        map.flyTo([e.data.lat, e.data.lng], 16, { animate: true, duration: 0.8 });
        // Update all marker icons to highlight only the selected pin
        Object.keys(markersMap).forEach(id => {
          const item = markersMap[id];
          const isSel = id === e.data.ticketId;
          item.marker.setIcon(createSvgIcon(item.ticket.status, isSel));
        });
      }
    });
  </script>
</body>
</html>`;
  };

  if (Platform.OS === ('web' as typeof Platform.OS)) {
    return (
      <View style={styles.container}>
        {React.createElement('iframe', {
          ref: iframeRef,
          srcDoc: generateLeafletHtml(),
          style: {
            width: '100%',
            height: '100%',
            border: 'none',
          },
          title: iframeTitle,
        })}
      </View>
    );
  }

  // Project tickets onto the radar by lat/lng (index-grid fallback when span is degenerate)
  // Native mobile: real OpenStreetMap tiles via react-native-maps UrlTile.
  // OSM tile usage policy: https://operations.osmfoundation.org/policies/tiles/
  const mapRegion = {
    latitude: selectedTicket?.latitude ?? fallbackCenter.latitude,
    longitude: selectedTicket?.longitude ?? fallbackCenter.longitude,
    latitudeDelta: fallbackZoom >= 15 ? 0.02 : 0.06,
    longitudeDelta: fallbackZoom >= 15 ? 0.02 : 0.06,
  };
  const pinColorFor = (status: Ticket['status']) =>
    status === 'RESOLVED' ? '#10B981' : status === 'PROVISIONAL_FIX' ? '#F59E0B' : '#EF4444';

  // Hooks must run unconditionally (same order on web and native).
  const [tileStatus, setTileStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => {
    setTileStatus('loading');
  }, [area?.pillLabel]);
  useEffect(() => {
    if (tileStatus !== 'loading') return;
    const t = setTimeout(() => setTileStatus((s) => (s === 'loading' ? 'error' : s)), 12000);
    return () => clearTimeout(t);
  }, [tileStatus, area?.pillLabel]);

  if (Platform.OS !== ('web' as typeof Platform.OS)) {
    if (NativeOsmMapComponent == null) {
      return (
        <View style={styles.container}>
          <Text style={styles.radarSub}>Native map unavailable — open on device</Text>
        </View>
      );
    }
    const NativeOsmMap = NativeOsmMapComponent;
    return (
      <NativeOsmMap
        tickets={tickets}
        selectedTicket={selectedTicket}
        onSelectTicket={onSelectTicket}
        userCoords={userCoords}
        pillLabel={pillLabel}
        mapRegion={mapRegion}
        userPopupPlace={userPopupPlace}
        tileStatus={tileStatus}
        onMapReady={() => setTileStatus('ready')}
      />
    );
  }

  // Web-only radar projection helpers below are unreachable on native but kept
  // for reference; the web path returns earlier via the iframe branch.
  const lats = tickets.map((t) => t.latitude);
  const lngs = tickets.map((t) => t.longitude);
  const minLat = lats.length ? Math.min(...lats) : 0;
  const maxLat = lats.length ? Math.max(...lats) : 0;
  const minLng = lngs.length ? Math.min(...lngs) : 0;
  const maxLng = lngs.length ? Math.max(...lngs) : 0;
  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;
  const useProjection = tickets.length >= 2 && latSpan > 0 && lngSpan > 0;
  const projectPin = (t: Ticket, idx: number): { top: `${number}%`; left: `${number}%` } => {
    if (!useProjection) {
      return {
        top: `${20 + ((idx * 13) % 60)}%` as `${number}%`,
        left: `${15 + ((idx * 27) % 70)}%` as `${number}%`,
      };
    }
    const pad = 0.12; // keep pins inside the radar
    const x = (t.longitude - minLng) / lngSpan;
    const y = (maxLat - t.latitude) / latSpan; // north at top
    return {
      top: `${(pad + y * (1 - pad * 2)) * 100}%` as `${number}%`,
      left: `${(pad + x * (1 - pad * 2)) * 100}%` as `${number}%`,
    };
  };
  void projectPin;

  // Native mobile fallback (stylized spatial coordinate radar)
  return (
    <View style={styles.container}>
      <View style={styles.radarHeader}>
        <Text style={styles.radarTitle}>{radarTitle}</Text>
        <Text style={styles.radarSub}>{radarSubtitlePlace} (projected pins) ({tickets.length} hazards mapped)</Text>
      </View>
      <View style={styles.nativeGrid}>
        {tickets.map((t) => {
          const isSelected = selectedTicket?.id === t.id;
          const pinColor = pinColorFor(t.status);
          return (
            <View
              key={t.id}
              style={[
                styles.nativePin,
                isSelected && styles.pinDotSelected,
                { backgroundColor: pinColor },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  radarHeader: {
    padding: 16,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  radarTitle: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  radarSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  nativeGrid: {
    flex: 1,
    position: 'relative',
  },
  nativePin: {
    position: 'absolute',
    padding: 8,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  pinDotSelected: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
});
