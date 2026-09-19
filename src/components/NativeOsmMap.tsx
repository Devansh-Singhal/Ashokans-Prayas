import React from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { Ticket } from '../types';

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface Props {
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  onSelectTicket: (ticket: Ticket) => void;
  userCoords: { latitude: number; longitude: number };
  pillLabel: string;
  mapRegion: Region;
  userPopupPlace: string;
  tileStatus: 'loading' | 'ready' | 'error';
  onMapReady: () => void;
}

const pinColorFor = (status: Ticket['status']) =>
  status === 'RESOLVED' ? '#10B981' : status === 'PROVISIONAL_FIX' ? '#F59E0B' : '#EF4444';

// Native-only file: never imported on web (InteractiveMap requires it behind
// a Platform.OS gate), so Metro web never bundles react-native-maps.
export const NativeOsmMap: React.FC<Props> = ({
  tickets,
  selectedTicket,
  onSelectTicket,
  userCoords,
  pillLabel,
  mapRegion,
  userPopupPlace,
  tileStatus,
  onMapReady,
}) => (
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
        onMapReady={onMapReady}
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
