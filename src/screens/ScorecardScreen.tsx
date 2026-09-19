import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { WardScorecard } from '../types';
import { api } from '../services/api';
import { Award, Clock, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react-native';

export const ScorecardScreen: React.FC = () => {
  const [scorecard, setScorecard] = useState<WardScorecard | null>(null);

  useEffect(() => {
    api.getWardScorecard('WARD_DELHI_14').then(setScorecard).catch(console.error);
  }, []);

  if (!scorecard) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Ward 14 Accountability Scorecard</Text>
      <Text style={styles.subHeader}>Public Resolution Latency & Compliance Index</Text>

      {/* Main Cleanliness Score Card */}
      <View style={styles.scoreHero}>
        <Text style={styles.scoreLabel}>Ward Cleanliness Index</Text>
        <Text style={styles.scoreNumber}>{scorecard.cleanliness_score}%</Text>
        <View style={styles.trendRow}>
          <TrendingUp size={14} color="#10B981" />
          <Text style={styles.trendText}>Status: Independent Civilian Audit Active</Text>
        </View>
      </View>

      {/* Metrics Grid */}
      <View style={styles.grid}>
        <View style={styles.gridCard}>
          <AlertTriangle size={20} color="#EF4444" />
          <Text style={styles.gridNumber}>{scorecard.total_tickets}</Text>
          <Text style={styles.gridLabel}>Total Mapped</Text>
        </View>

        <View style={styles.gridCard}>
          <CheckCircle2 size={20} color="#10B981" />
          <Text style={styles.gridNumber}>{scorecard.resolved_count}</Text>
          <Text style={styles.gridLabel}>Verified Fixed</Text>
        </View>

        <View style={styles.gridCard}>
          <Clock size={20} color="#3B82F6" />
          <Text style={styles.gridNumber}>{scorecard.avg_resolution_days}d</Text>
          <Text style={styles.gridLabel}>Avg Fix Time</Text>
        </View>
      </View>

      {/* Media & Press Note */}
      <View style={styles.noteCard}>
        <Award size={18} color="#D97706" />
        <View style={{ flex: 1 }}>
          <Text style={styles.noteTitle}>Independent Latency Instrument</Text>
          <Text style={styles.noteText}>
            These verified metrics are compiled weekly for local beat journalists and Resident Welfare Associations (RWAs) to monitor municipal resolution speed.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  subHeader: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 20,
  },
  scoreHero: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreNumber: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '900',
    marginVertical: 4,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gridNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 4,
  },
  gridLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  noteCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 16,
    borderRadius: 16,
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 2,
  },
  noteText: {
    fontSize: 11,
    color: '#B45309',
    lineHeight: 16,
  },
});
