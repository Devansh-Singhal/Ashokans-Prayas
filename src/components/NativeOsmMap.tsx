import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ticket } from '../types';
import { MapArea } from './InteractiveMap';
import { MAPTILER_KEY } from '../services/api';

interface Props {
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  onSelectTicket: (ticket: Ticket) => void;
  userCoords: { latitude: number; longitude: number };
  area?: MapArea;
}

// Native-only file: never imported on the web bundle (showMap.native.tsx is
// resolved only for device builds), so WebView never enters a web bundle.
export const NativeOsmMap: React.FC<Props> = ({
  tickets,
  selectedTicket,
  onSelectTicket,
  userCoords,
  area,
}) => {
  const fallbackCenter = area?.center ?? userCoords;
  const fallbackZoom = area?.zoom ?? 15;
  const pillLabel = area?.pillLabel ?? 'WARD 14 • LUDHIANA GEOSPATIAL RADAR';
  const userPopupPlace = area?.userPopupPlace ?? 'Ward 14, Ludhiana';

  const centerLat = selectedTicket?.latitude ?? fallbackCenter.latitude;
  const centerLng = selectedTicket?.longitude ?? fallbackCenter.longitude;
  const ticketsData = JSON.stringify(
    tickets.map((t) => ({
      id: t.id,
      category: t.category,
      status: t.status,
      severity: t.severity,
      lat: t.latitude,
      lng: t.longitude,
      isSelected: selectedTicket?.id === t.id,
    }))
  );

  // Same self-contained Leaflet page the web build uses, served over MapTiler
  // Streets (keyed) with a thresholded OSM fallback inside a WebView so device
  // builds render a real live map without depending on any native map module
  // being present in Expo Go.
  const maptilerUrl = `https://api.maptiler.com/maps/streets-v4/256/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`;
  const leafletHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #0F172A; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; overflow: hidden; }
    .custom-pin { background: transparent; border: none; }
    .ward-pill {
      position: absolute; top: 12px; left: 12px; z-index: 1000;
      background: rgba(15, 23, 42, 0.88); border: 1px solid #334155;
      padding: 6px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700;
      color: #38BDF8; letter-spacing: 0.5px;
    }
    .leaflet-popup-content-wrapper { background: #1E293B; color: #F8FAFC; border-radius: 12px; border: 1px solid #334155; }
    .leaflet-popup-tip { background: #1E293B; border: 1px solid #334155; }
    .leaflet-popup-content { margin: 8px 10px; font-size: 12px; }
    .user-pulse-dot {
      width: 16px; height: 16px; background: #38BDF8; border-radius: 50%;
      border: 2.5px solid #FFFFFF; animation: pulse 2s infinite ease-out;
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
  <div id="map-error" style="display:none;position:absolute;inset:0;align-items:center;justify-content:center;color:#F8FAFC;font-size:13px;font-weight:600;text-align:center;padding:24px;">Map tiles unavailable. Check connection.</div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" onerror="document.getElementById('map-error').style.display='flex'"></script>
  <script>
    if (typeof L === 'undefined') {
      document.getElementById('map-error').style.display = 'flex';
    } else {
    var tickets = ${ticketsData};
    var map = L.map('map', { center: [${centerLat}, ${centerLng}], zoom: ${fallbackZoom}, zoomControl: false });
    var mapAttribution = '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    var primaryTiles = L.tileLayer('${maptilerUrl}', {
      attribution: mapAttribution,
      maxZoom: 19,
      crossOrigin: true,
    });
    var fallbackTiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: mapAttribution,
      maxZoom: 19,
    });
    var tileErrors = 0;
    var tileLoads = 0;
    var fellBack = false;
    primaryTiles.on('tileload', function () { tileLoads += 1; });
    primaryTiles.on('tileerror', function () {
      tileErrors += 1;
      if (!fellBack && tileErrors >= 4 && tileLoads === 0) {
        fellBack = true;
        map.removeLayer(primaryTiles);
        fallbackTiles.addTo(map);
      }
    });
    primaryTiles.addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    function pinColor(status) {
      if (status === 'RESOLVED') return '#10B981';
      if (status === 'PROVISIONAL_FIX') return '#F59E0B';
      if (status === 'WEATHER_OCCLUDED') return '#3B82F6';
      return '#EF4444';
    }
    function svgIcon(status, isSelected) {
      var color = pinColor(status);
      var stroke = isSelected ? '#FFFFFF' : '#0F172A';
      return L.divIcon({
        className: 'custom-pin',
        html: '<svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">'
          + '<path d="M14 36C14 36 26 22 26 14C26 6.82 20.63 1 14 1C7.37 1 2 6.82 2 14C2 22 14 36 14 36Z" fill="' + color + '" stroke="' + stroke + '" stroke-width="2" />'
          + '<circle cx="14" cy="14" r="5" fill="#FFFFFF" />'
          + '<circle cx="14" cy="14" r="2.5" fill="' + color + '" /></svg>',
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        popupAnchor: [0, -36],
      });
    }

    var userIcon = L.divIcon({
      className: 'user-pin',
      html: '<div class="user-pulse-dot"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    L.marker([${userCoords.latitude}, ${userCoords.longitude}], { icon: userIcon })
      .bindPopup('<b style="color:#38BDF8;">Your Live GPS Location</b><br>${userPopupPlace}')
      .addTo(map);

    var markersMap = {};
    tickets.forEach(function (ticket) {
      var marker = L.marker([ticket.lat, ticket.lng], { icon: svgIcon(ticket.status, ticket.isSelected) }).addTo(map);
      marker.on('click', function () {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TICKET_CLICKED', ticketId: ticket.id }));
      });
      markersMap[ticket.id] = { marker: marker, ticket: ticket };
    });

    document.addEventListener('message', function (e) {
      try {
        var data = JSON.parse(e.data);
        if (data && data.type === 'FLY_TO_TICKET') {
          map.flyTo([data.lat, data.lng], 16, { animate: true, duration: 0.8 });
          Object.keys(markersMap).forEach(function (id) {
            var item = markersMap[id];
            item.marker.setIcon(svgIcon(item.ticket.status, id === data.ticketId));
          });
        }
      } catch (err) {}
    });
    window.addEventListener('message', function (e) {
      try {
        var data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data && data.type === 'FLY_TO_TICKET') {
          map.flyTo([data.lat, data.lng], 16, { animate: true, duration: 0.8 });
          Object.keys(markersMap).forEach(function (id) {
            var item = markersMap[id];
            item.marker.setIcon(svgIcon(item.ticket.status, id === data.ticketId));
          });
        }
      } catch (err) {}
    });
    }
    true;
  </script>
</body>
</html>`;

  const [webviewReady, setWebviewReady] = useState(false);

  // Push fly-to updates into the WebView whenever the selected ticket changes.
  const webviewRef = useRef<WebView | null>(null);
  useEffect(() => {
    if (webviewReady && selectedTicket && webviewRef.current) {
      webviewRef.current.postMessage(
        JSON.stringify({
          type: 'FLY_TO_TICKET',
          ticketId: selectedTicket.id,
          lat: selectedTicket.latitude,
          lng: selectedTicket.longitude,
        })
      );
    }
  }, [selectedTicket, webviewReady, ticketsData]);

  return (
    <View style={styles.container}>
      <View style={styles.osmPill}>
        <Text style={styles.osmPillText}>{pillLabel}</Text>
      </View>
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html: leafletHtml, baseUrl: 'https://civicfeed.local' }}
        style={styles.nativeMap}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        onLoadEnd={() => setWebviewReady(true)}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data?.type === 'TICKET_CLICKED' && data.ticketId) {
              const found = tickets.find((t) => t.id === data.ticketId);
              if (found) onSelectTicket(found);
            }
          } catch {
            // ignore malformed bridge messages
          }
        }}
        renderLoading={() => (
          <View style={styles.osmFallback}>
            <Text style={styles.osmFallbackText}>Loading OpenStreetMap…</Text>
          </View>
        )}
      />
      <View style={styles.osmCredit}>
        <Text style={styles.osmCreditText}>© MapTiler © OpenStreetMap contributors</Text>
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
  nativeMap: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  osmFallback: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  osmFallbackText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  osmPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  osmPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  osmCredit: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    zIndex: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  osmCreditText: {
    fontSize: 9,
    color: '#94A3B8',
  },
});