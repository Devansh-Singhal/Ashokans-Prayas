import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { WardScorecard } from '../types';
import { api } from '../services/api';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react-native';
import {
  PotholeDefectIcon,
  WasteAccumulationIcon,
  StreetlightDefectIcon,
  OpenDrainHazardIcon,
} from '../components/CivicIcons';

export const ScorecardScreen: React.FC = () => {
  const [scorecard, setScorecard] = useState<WardScorecard | null>(null);

  useEffect(() => {
    api.getWardScorecard('WARD_DELHI_14').then(setScorecard).catch(console.error);
  }, []);

  if (!scorecard) return null;

  const getGrade = (score: number) => {
    if (score >= 85) return { letter: 'A', title: 'Exemplary', color: '#10B981', bg: '#DCFCE7' };
    if (score >= 70) return { letter: 'B', title: 'Compliant', color: '#059669', bg: '#D1FAE5' };
    if (score >= 50) return { letter: 'C', title: 'Needs Attention', color: '#D97706', bg: '#FEF3C7' };
    if (score >= 30) return { letter: 'D', title: 'Action Required', color: '#EA580C', bg: '#FFEDD5' };
    return { letter: 'F', title: 'Critical Deficit', color: '#DC2626', bg: '#FEE2E2' };
  };

  const grade = getGrade(scorecard.cleanliness_score);
  const pendingCount = Math.max(0, scorecard.total_tickets - scorecard.resolved_count);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Ward 14 Accountability Scorecard</Text>
      <Text style={styles.subHeader}>Central Delhi Municipal Corporation (MCD) Oversight</Text>

      {/* 1. Main Cleanliness Score Hero with Letter Grade */}
      <View style={styles.scoreHero}>
        <View style={styles.scoreHeroTop}>
          <View>
            <Text style={styles.scoreLabel}>WARD CLEANLINESS INDEX</Text>
            <Text style={styles.scoreNumber}>{scorecard.cleanliness_score}%</Text>
          </View>

          <View style={[styles.gradeBadge, { backgroundColor: grade.bg, borderColor: grade.color }]}>
            <Text style={[styles.gradeLetter, { color: grade.color }]}>{grade.letter}</Text>
            <Text style={[styles.gradeTitle, { color: grade.color }]}>{grade.title}</Text>
          </View>
        </View>

        {/* Mathematical Definition Formula */}
        <View style={styles.formulaCard}>
          <View style={styles.formulaHeader}>
            <Info size={14} color="#38BDF8" />
            <Text style={styles.formulaTitle}>How this score is calculated:</Text>
          </View>
          <Text style={styles.formulaText}>
            The exact percentage of citizen-reported road defects that have been physically inspected
            and verified resolved by neighboring citizens.
          </Text>
          <View style={styles.mathBox}>
            <Text style={styles.mathEquation}>
              ({scorecard.resolved_count} Verified Fixed ÷ {scorecard.total_tickets} Total Mapped) × 100% = {scorecard.cleanliness_score}%
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Key Metrics Grid */}
      <View style={styles.grid}>
        <View style={styles.gridCard}>
          <AlertTriangle size={18} color="#EF4444" />
          <Text style={styles.gridNumber}>{scorecard.total_tickets}</Text>
          <Text style={styles.gridLabel}>Total Mapped</Text>
        </View>

        <View style={styles.gridCard}>
          <CheckCircle2 size={18} color="#10B981" />
          <Text style={styles.gridNumber}>{scorecard.resolved_count}</Text>
          <Text style={styles.gridLabel}>Verified Clean</Text>
        </View>

        <View style={styles.gridCard}>
          <ShieldAlert size={18} color="#EA580C" />
          <Text style={styles.gridNumber}>{pendingCount}</Text>
          <Text style={styles.gridLabel}>Open Deficits</Text>
        </View>
      </View>

      {/* 3. Municipal 48-Hour SLA Compliance Benchmark */}
      <View style={styles.slaCard}>
        <View style={styles.slaHeader}>
          <View style={styles.slaTitleGroup}>
            <Clock size={18} color="#0284C7" />
            <Text style={styles.slaTitle}>Delhi MCD 48-Hour SLA Benchmark</Text>
          </View>
          <View style={styles.slaTargetBadge}>
            <Text style={styles.slaTargetText}>MCD Target: 48h (2.0d)</Text>
          </View>
        </View>

        <View style={styles.slaComparisonRow}>
          <View style={styles.slaMetricCol}>
            <Text style={styles.slaMetricLabel}>Current Ward Average</Text>
            <Text style={styles.slaMetricValue}>{scorecard.avg_resolution_days} Days</Text>
          </View>
          <View style={styles.slaDivider} />
          <View style={styles.slaMetricCol}>
            <Text style={styles.slaMetricLabel}>Resolution Status</Text>
            <Text
              style={[
                styles.slaMetricStatus,
                { color: scorecard.avg_resolution_days <= 2.0 ? '#10B981' : '#EA580C' },
              ]}
            >
              {scorecard.avg_resolution_days <= 2.0
                ? 'Compliant with 48h SLA'
                : `+${(scorecard.avg_resolution_days - 2.0).toFixed(1)}d Over SLA Target`}
            </Text>
          </View>
        </View>

        <Text style={styles.slaExplainer}>
          Defects with 5+ endorsements trigger the Municipal Rapid Response SLA. Latency metrics
          are synchronized daily with Resident Welfare Associations (RWAs).
        </Text>
      </View>

      {/* 4. Category Breakdown Progress Bars (Zero emojis, custom SVGs) */}
      <View style={styles.categoryCard}>
        <Text style={styles.categoryCardTitle}>Resolution Rate by Hazard Type</Text>

        {/* Potholes */}
        <View style={styles.catRow}>
          <View style={styles.catLeft}>
            <PotholeDefectIcon size={16} color="#EF4444" />
            <Text style={styles.catName}>Potholes & Asphalt Craters</Text>
          </View>
          <Text style={styles.catPercent}>40% Fixed</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '40%', backgroundColor: '#EF4444' }]} />
        </View>

        {/* Garbage */}
        <View style={styles.catRow}>
          <View style={styles.catLeft}>
            <WasteAccumulationIcon size={16} color="#F59E0B" />
            <Text style={styles.catName}>Garbage & Refuse Vats</Text>
          </View>
          <Text style={styles.catPercent}>60% Fixed</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '60%', backgroundColor: '#F59E0B' }]} />
        </View>

        {/* Streetlights */}
        <View style={styles.catRow}>
          <View style={styles.catLeft}>
            <StreetlightDefectIcon size={16} color="#EAB308" />
            <Text style={styles.catName}>Defunct Streetlamps</Text>
          </View>
          <Text style={styles.catPercent}>25% Fixed</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '25%', backgroundColor: '#EAB308' }]} />
        </View>

        {/* Open Drains */}
        <View style={styles.catRow}>
          <View style={styles.catLeft}>
            <OpenDrainHazardIcon size={16} color="#0284C7" />
            <Text style={styles.catName}>Broken Drainage Slabs</Text>
          </View>
          <Text style={styles.catPercent}>33% Fixed</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '33%', backgroundColor: '#0284C7' }]} />
        </View>
      </View>

      {/* 5. Citizen Action Notice */}
      <View style={styles.actionCallout}>
        <View style={styles.calloutIcon}>
          <CheckCircle2 size={20} color="#059669" />
        </View>
        <View style={styles.calloutTextGroup}>
          <Text style={styles.calloutTitle}>Help improve Ward 14&apos;s score</Text>
          <Text style={styles.calloutBody}>
            1 contractor repair on 80ft Road is currently pending civilian audit. Verify it in the
            feed to release points and raise our index.
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
    padding: 16,
    paddingBottom: 130, // Safe mobile inset to prevent buttons clipping behind bottom tab bar
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
    marginBottom: 16,
  },
  scoreHero: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
  },
  scoreHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreLabel: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  scoreNumber: {
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: '900',
    marginVertical: 2,
  },
  gradeBadge: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  gradeLetter: {
    fontSize: 24,
    fontWeight: '900',
  },
  gradeTitle: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  formulaCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  formulaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  formulaTitle: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  formulaText: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
  },
  mathBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  mathEquation: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
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
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  slaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  slaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  slaTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  slaTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  slaTargetBadge: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  slaTargetText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  slaComparisonRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  slaMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  slaDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
  },
  slaMetricLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  slaMetricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  slaMetricStatus: {
    fontSize: 12,
    fontWeight: '700',
  },
  slaExplainer: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 10,
    lineHeight: 16,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  categoryCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  catPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  actionCallout: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    alignItems: 'center',
  },
  calloutIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calloutTextGroup: {
    flex: 1,
  },
  calloutTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
    marginBottom: 2,
  },
  calloutBody: {
    fontSize: 11,
    color: '#166534',
    lineHeight: 16,
  },
});
