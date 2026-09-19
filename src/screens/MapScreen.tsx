import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { MapPin, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react-native';
import { Ticket } from '../types';
import { api } from '../services/api';

export const MapScreen: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    api.getWardFeed('WARD_DELHI_14').then((res) => {
      setTickets(res.tickets);
      if (res.tickets.length > 0) setSelectedTicket(res.tickets[0]);
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Visual Spatial Map Canvas (Stylized Vector Grid) */}
      <View style={styles.mapCanvas}>
        <View style={styles.mapGridOverlay}>
          <Text style={styles.mapHeader}>WARD 14 GEOSPATIAL RADAR</Text>
          <Text style={styles.mapSub}>Central Delhi Corridor (Indiranagar / Sony Signal)</Text>
        </View>

        {/* Mapped Pins */}
        <View style={styles.pinsLayer}>
          {tickets.map((t, idx) => {
            const isSelected = selectedTicket?.id === t.id;
            const pinColor =
              t.status === 'RESOLVED' ? '#10B981' : t.status === 'PROVISIONAL_FIX' ? '#F59E0B' : '#EF4444';
            return (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.mapPinContainer,
                  {
                    top: `${25 + (idx * 11) % 55}%`,
                    left: `${15 + (idx * 23) % 70}%`,
                  },
                ]}
                onPress={() => setSelectedTicket(t)}
              >
                <View style={[styles.pinBubble, { backgroundColor: pinColor }, isSelected && styles.pinSelected]}>
                  <MapPin size={16} color="#FFFFFF" />
                </View>
                {isSelected && (
                  <View style={styles.selectedMarkerLabel}>
                    <Text style={styles.selectedMarkerText}>{t.category}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Selected Ticket Drawer / Callout Card */}
      {selectedTicket && (
        <View style={styles.drawerCard}>
          <View style={styles.drawerTop}>
            <View style={styles.drawerBadge}>
              <Text style={styles.drawerCategory}>{selectedTicket.category.replace('_', ' ')}</Text>
            </View>
            <Text style={styles.drawerStatus}>
              {selectedTicket.status === 'RESOLVED'
                ? '🟢 Cleaned'
                : selectedTicket.status === 'PROVISIONAL_FIX'
                ? '🟡 Fix Uploaded'
                : '🔴 Open'}
            </Text>
          </View>
          <Text style={styles.drawerCoords}>
            GPS: {selectedTicket.latitude.toFixed(4)}, {selectedTicket.longitude.toFixed(4)}
          </Text>
          <Text style={styles.drawerUpvotes}>🔥 {selectedTicket.upvotes} neighbors endorsed this defect</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  mapCanvas: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  mapGridOverlay: {
    padding: 16,
  },
  mapHeader: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  mapSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  pinsLayer: {
    ...StyleSheet.absoluteFill,
  },
  mapPinContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  pinBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  pinSelected: {
    transform: [{ scale: 1.25 }],
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  selectedMarkerLabel: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  selectedMarkerText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  drawerCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  drawerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  drawerBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  drawerCategory: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  drawerStatus: {
    fontSize: 12,
    fontWeight: '700',
  },
  drawerCoords: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  drawerUpvotes: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
  },
});
