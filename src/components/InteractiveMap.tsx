import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ticket } from '../types';

// Shared area config consumed by both the web Leaflet map and the native
// react-native-maps implementation.
export interface MapArea {
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

// Web-only Leaflet map rendered in a self-contained srcDoc iframe.
// The native map is a separate platform file (NativeOsmMap.tsx), so
// react-native-maps is never resolved into a web bundle.
export function InteractiveMap({
  tickets,
  selectedTicket,
  onSelectTicket,
  userCoords = { latitude: 30.8785, longitude: 75.8462 },
  area,
}: Props) {
  const fallbackCenter = area?.center ?? userCoords;
  const fallbackZoom = area?.zoom ?? 15;
  const pillLabel = area?.pillLabel ?? 'WARD 14 • LUDHIANA GEOSPATIAL RADAR';
  const userPopupPlace = area?.userPopupPlace ?? 'Ward 14, Ludhiana, Punjab';
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
    if (Platform.OS !== ('web' as typeof Platform.OS) || typeof window === 'undefined') return;

    const handleMessage = (event: MessageEvent) => {
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

    .custom-pin {
      background: transparent;
      border: none;
      transition: filter 0.15s ease;
    }
    .custom-pin:hover { filter: brightness(1.15); }

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
    .leaflet-popup-content { margin: 8px 10px; font-size: 12px; line-height: 1.4; }
    .popup-title { font-weight: 700; color: #FFFFFF; font-size: 13px; margin-bottom: 3px; }
    .popup-status { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .status-REPORTED { color: #EF4444; }
    .status-PROVISIONAL_FIX { color: #F59E0B; }
    .status-RESOLVED { color: #10B981; }

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

    const map = L.map('map', {
      center: [centerLat, centerLng],
      zoom: mapZoom,
      zoomControl: false,
    });

    // CARTO dark_matter tiles match the app chrome; the data is OpenStreetMap.
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersMap = {};

    function getPinColor(status) {
      if (status === 'RESOLVED') return '#10B981';
      if (status === 'PROVISIONAL_FIX') return '#F59E0B';
      return '#EF4444';
    }

    function createSvgIcon(status, isSelected) {
      const color = getPinColor(status);
      const strokeColor = isSelected ? '#FFFFFF' : '#0F172A';
      const strokeWidth = isSelected ? '2.5' : '1.5';
      const glowRing = isSelected
        ? '<circle cx="14" cy="14" r="12" stroke="#FFFFFF" stroke-width="1.5" stroke-dasharray="3 2" opacity="0.8" />'
        : '';

      const svgHtml = \`
        <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          \${glowRing}
          <path d="M14 36C14 36 26 22 26 14C26 6.82 20.63 1 14 1C7.37 1 2 6.82 2 14C2 22 14 36 14 36Z"
                fill="\${color}" stroke="\${strokeColor}" stroke-width="\${strokeWidth}" />
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

    const userIcon = L.divIcon({
      className: 'user-pin',
      html: '<div class="user-pulse-dot"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    L.marker([userLat, userLng], { icon: userIcon })
      .bindPopup('<b style="color:#38BDF8;">Your Live GPS Location</b><br>${userPopupPlace}')
      .addTo(map);

    tickets.forEach(ticket => {
      const icon = createSvgIcon(ticket.status, ticket.isSelected);
      const marker = L.marker([ticket.lat, ticket.lng], {
        icon: icon,
        riseOnHover: true,
      }).addTo(map);

      marker.on('click', () => {
        window.parent.postMessage({ type: 'TICKET_CLICKED', ticketId: ticket.id }, '*');
      });

      markersMap[ticket.id] = { marker, ticket };
    });

    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'FLY_TO_TICKET') {
        map.flyTo([e.data.lat, e.data.lng], 16, { animate: true, duration: 0.8 });
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    position: 'relative',
  },
});