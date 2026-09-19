import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { Ticket } from '../types';
import { MapArea } from './InteractiveMap';

interface Props {
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  onSelectTicket: (ticket: Ticket) => void;
  userCoords: { latitude: number; longitude: number };
  area?: MapArea;
}

const pinColorFor = (status: Ticket['status']) =>
  status === 'RESOLVED' ? '#10B981' : status === 'PROVISIONAL_FIX' ? '#F59E0B' : '#EF4444';

// Native-only file: never imported on the web bundle (MapScreen gates it by
// Platform.OS), so Metro never resolves react-native-maps for web.
export const NativeOsmMap: React.FC<Props> = ({
  tickets,
  selectedTicket,
  onSelectTicket,
  userCoords,
  area,
}) => {
  const fallbackCenter = area?.center ?? userCoords;
  const fallbackZoom = area?.zoom ?? 15;
  const pillLabel = area?.pillLabel ?? 'WARD 14 • CENTRAL DELHI GEOSPATIAL RADAR';
  const userPopupPlace = area?.userPopupPlace ?? 'Ward 14, Delhi';

  const mapRegion = {
    latitude: selectedTicket?.latitude ?? fallbackCenter.latitude,
    longitude: selectedTicket?.longitude ?? fallbackCenter.longitude,
    latitudeDelta: fallbackZoom >= 15 ? 0.02 : 0.06,
    longitudeDelta: fallbackZoom >= 15 ? 0.02 : 0.06,
  };

  const [tileStatus, setTileStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => {
    setTileStatus('loading');
  }, [area?.pillLabel]);
  useEffect(() => {
    if (tileStatus !== 'loading') return;
    const t = setTimeout(() => setTileStatus((s) => (s === 'loading' ? 'error' : s)), 12000);
    return () => clearTimeout(t);
  }, [tileStatus, area?.pillLabel]);

  return (
    <View style={styles.container}>
      <View style={styles.osmPill}>
        <Text style={styles.osmPillText}>{pillLabel}</Text>
      </View>
      {tileStatus === 'error' ? (
        <View style={styles.osmFallback}>
          <Image
            source={{
              uri: `https://staticmap.openstreetmap.de/staticmap.php?center=${mapRegion.latitude},${mapRegion.longitude}&zoom=14&size=800x600&maptype=mapnik`,
            }}
            style={styles.osmFallbackImage}
            resizeMode="cover"
          />
          <View style={styles.osmFallbackBanner}>
            <Text style={styles.osmFallbackText}>Live tiles unavailable — static OSM snapshot</Text>
          </View>
        </View>
      ) : (
        <MapView
          style={styles.nativeMap}
          initialRegion={mapRegion}
          region={
            selectedTicket
              ? { ...mapRegion, latitude: selectedTicket.latitude, longitude: selectedTicket.longitude }
              : undefined
          }
          mapType="none"
          onMapReady={() => setTileStatus('ready')}
        >
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            tileSize={256}
            shouldReplaceMapContent={true}
            flipY={false}
          />
          <Marker
            coordinate={{ latitude: userCoords.latitude, longitude: userCoords.longitude }}
            title="Your Live GPS Location"
            description={userPopupPlace}
            pinColor="#38BDF8"
          />
          {tickets.map((t) => (
            <Marker
              key={t.id}
              coordinate={{ latitude: t.latitude, longitude: t.longitude }}
              title={`${t.category.replace(/_/g, ' ')} • ${t.status}`}
              description={`Severity ${t.severity}/5`}
              pinColor={pinColorFor(t.status)}
              onPress={() => onSelectTicket(t)}
            />
          ))}
        </MapView>
      )}
      <View style={styles.osmCredit}>
        <Text style={styles.osmCreditText}>© OpenStreetMap contributors</Text>
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
  },
  osmFallbackImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  osmFallbackBanner: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
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