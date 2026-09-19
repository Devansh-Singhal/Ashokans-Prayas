import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CivicPostCard } from '../components/CivicPostCard';
import { CivicOnboardingCard } from '../components/CivicOnboardingCard';
import { AntiCheatModal } from '../components/AntiCheatModal';
import { Ticket, TicketCategory, VerificationResult } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getCurrentGPS } from '../services/location';
import { CAPS_LABEL, NUMERIC, TYPOGRAPHY } from '../constants/typography';
import { Sparkles } from 'lucide-react-native';

export const FeedScreen: React.FC = () => {
  const { currentUser, updatePoints, logContribution } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState({ latitude: 30.8893, longitude: 75.8490 });
  const [usingFallback, setUsingFallback] = useState(true);

  // Anti-cheat modal state
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const wardId = 'WARD_LUDHIANA_14';

  const fetchFeed = async () => {
    try {
      setLoadError(null);
      const data = await api.getWardFeed(wardId);
      setTickets(data.tickets);
    } catch (err: any) {
      console.error('Failed to load feed:', err);
      setLoadError(err?.message || 'Failed to load feed');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const gps = await getCurrentGPS();
        setUserCoords(gps);
        setUsingFallback(false);
      } catch {
        // Keep demo fallback coords
      }
    })();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchFeed();
  };

  const handleVerifyPress = async (ticket: Ticket) => {
    if (ticket.status !== 'PROVISIONAL_FIX') {
      Alert.alert('Not ready', 'Ticket is not awaiting audit yet.');
      return;
    }
    try {
      // Execute live audit verification
      const sampleAuditPhoto = 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80';
      const result = await api.verifyTicket(
        ticket.id,
        sampleAuditPhoto,
        currentUser.id,
        userCoords.latitude,
        userCoords.longitude
      );

      setVerificationResult(result);
      setIsModalVisible(true);
      updatePoints(result.credited_points);
      logContribution({
        id: ticket.id,
        kind: 'VERIFICATION',
        category: ticket.category,
        at: new Date().toISOString(),
      });

      // Refresh feed to update ticket to RESOLVED
      fetchFeed();
    } catch (err: any) {
      const msg: string = err?.message || 'Verification failed';
      if (msg.includes('Too early')) {
        Alert.alert('Fix evidence needed', msg);
      } else {
        Alert.alert('Verification failed', msg);
      }
    }
  };

  const categories = [
    { id: 'ALL', label: 'All Issues' },
    { id: 'POTHOLE', label: 'Potholes' },
    { id: 'GARBAGE_ACCUMULATION', label: 'Garbage' },
    { id: 'STREETLIGHT', label: 'Streetlights' },
    { id: 'OPEN_DRAIN', label: 'Drains' },
  ];

  const filteredTickets = tickets.filter((t) => {
    if (activeCategory === 'ALL') return true;
    return t.category === activeCategory;
  });

  return (
    <View style={styles.container}>
      {usingFallback && (
        <View style={styles.fallbackBanner}>
          <Text style={styles.fallbackText}>Demo location — enable GPS for live audit</Text>
        </View>
      )}
      {/* Category Filter Pills */}
      <View style={styles.filterBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const isActive = item.id === activeCategory;
            return (
              <TouchableOpacity
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveCategory(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${item.label}`}
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Social Post Feed with Embedded Onboarding Header */}
      {isLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#0B1B2F" />
          <Text style={styles.loadingText}>Loading Ward 14 social feed</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={<CivicOnboardingCard />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <CivicPostCard
              ticket={item}
              currentUserId={currentUser.id}
              userCoords={userCoords}
              onVerifyPress={handleVerifyPress}
            />
          )}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Sparkles size={40} color="#94A3B8" />
              <Text style={styles.emptyTitle}>Ward 14 is spotless</Text>
              <Text style={styles.emptySubtitle}>
                {loadError ? `Could not load feed: ${loadError}` : 'No open issues reported in this category.'}
              </Text>
              {loadError && (
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={fetchFeed}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading feed"
                >
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Anti-Cheat Reciprocity Decay Modal */}
      <AntiCheatModal
        visible={isModalVisible}
        result={verificationResult}
        onClose={() => setIsModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  filterBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E6EAF0',
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E6EAF0',
    minHeight: 44,
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: '#0B1B2F',
  },
  filterText: {
    ...TYPOGRAPHY.bodySmStrong,
    color: '#3D4E65',
  },
  filterTextActive: {
    ...TYPOGRAPHY.bodySmStrong,
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 130, // Safe mobile inset to prevent buttons clipping behind bottom tab bar
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: '#3D4E65',
    marginTop: 12,
  },
  emptyState: {
    paddingTop: 60,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    ...TYPOGRAPHY.title,
    color: '#0B1B2F',
    marginTop: 12,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    color: '#3D4E65',
    textAlign: 'center',
    marginTop: 4,
  },
  fallbackBanner: {
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  fallbackText: {
    ...TYPOGRAPHY.captionStrong,
    ...CAPS_LABEL,
    color: '#92400E',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 12,
    backgroundColor: '#FF7A00',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryText: {
    ...TYPOGRAPHY.bodySmStrong,
    ...NUMERIC,
    color: '#0B1B2F',
  },
});
