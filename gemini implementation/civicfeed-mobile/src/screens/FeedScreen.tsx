import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { CivicPostCard } from '../components/CivicPostCard';
import { AntiCheatModal } from '../components/AntiCheatModal';
import { Ticket, TicketCategory, VerificationResult } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Filter } from 'lucide-react-native';

export const FeedScreen: React.FC = () => {
  const { currentUser, updatePoints } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  // Anti-cheat modal state
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const wardId = 'WARD_DELHI_14';
  const userCoords = { latitude: 28.6289, longitude: 77.2065 }; // Delhi Ward 14 center

  const fetchFeed = async () => {
    try {
      const data = await api.getWardFeed(wardId);
      setTickets(data.tickets);
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchFeed();
  };

  const handleEndorse = async (ticketId: string) => {
    await api.endorseTicket(ticketId, currentUser.id);
    updatePoints(25);
  };

  const handleVerifyPress = async (ticket: Ticket) => {
    try {
      // Execute live audit verification
      const sampleAuditPhoto = 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80';
      const result = await api.verifyTicket(ticket.id, sampleAuditPhoto, currentUser.id);
      
      setVerificationResult(result);
      setIsModalVisible(true);
      updatePoints(result.credited_points);

      // Refresh feed to update ticket to RESOLVED
      fetchFeed();
    } catch (err: any) {
      alert(err.message || 'Verification failed');
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
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Social Post Feed */}
      {isLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#0F172A" />
          <Text style={styles.loadingText}>Loading Ward 14 Social Feed...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CivicPostCard
              ticket={item}
              currentUserId={currentUser.id}
              userCoords={userCoords}
              onEndorse={handleEndorse}
              onVerifyPress={handleVerifyPress}
            />
          )}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Sparkles size={40} color="#94A3B8" />
              <Text style={styles.emptyTitle}>Ward 14 is Spotless!</Text>
              <Text style={styles.emptySubtitle}>No open issues reported in this category.</Text>
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
    backgroundColor: '#F8FAFC',
  },
  filterBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterPillActive: {
    backgroundColor: '#0F172A',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
});
