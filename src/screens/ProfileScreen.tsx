import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Award, FileText, CheckCircle2 } from 'lucide-react-native';

export const ProfileScreen: React.FC = () => {
  const { currentUser, currentPersona } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.profileHero}>
        <View style={[styles.avatarBig, { backgroundColor: currentPersona.avatarColor }]}>
          <Text style={styles.avatarBigLetter}>{currentPersona.name.charAt(0)}</Text>
        </View>
        <Text style={styles.handle}>{currentUser.public_handle}</Text>
        <Text style={styles.role}>{currentPersona.role} • {currentPersona.name}</Text>
        <View
          style={[
            styles.verifiedTag,
            currentUser.consent_status !== 'ACTIVE' && { backgroundColor: '#FEF3C7' },
          ]}
        >
          <ShieldCheck
            size={14}
            color={currentUser.consent_status === 'ACTIVE' ? '#16A34A' : '#D97706'}
          />
          <Text
            style={[
              styles.verifiedText,
              currentUser.consent_status !== 'ACTIVE' && { color: '#92400E' },
            ]}
          >
            {currentUser.consent_status === 'ACTIVE'
              ? 'Civic Identity Verified'
              : 'Verification Pending — parent consent required'}
          </Text>
        </View>
      </View>

      {/* Points & NSS Hours Card */}
      <View style={styles.statCard}>
        <View style={styles.statRow}>
          <View>
            <Text style={styles.statLabel}>Total Points Balance</Text>
            <Text style={styles.statValue}>{currentUser.points_balance} pts</Text>
          </View>
          <Award size={32} color="#F59E0B" />
        </View>

        <View style={styles.progressDivider} />

        <View style={styles.hoursRow}>
          <Text style={styles.hoursTitle}>NSS Civic Audit Hours (device estimate)</Text>
          <Text style={styles.hoursValue}>
            {currentUser.verified_hours || 12} / 40 hrs
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min(100, ((currentUser.verified_hours || 12) / 40) * 100)}%` },
            ]}
          />
        </View>
      </View>

      {/* Academic Credential Note */}
      <View style={styles.certCard}>
        <FileText size={20} color="#2563EB" />
        <View style={{ flex: 1 }}>
          <Text style={styles.certTitle}>Open-Data Infrastructure Credential</Text>
          <Text style={styles.certText}>
            Points translate into verified civic service hours co-signed with partner youth clubs. Points and hours sync from the server ward ledger. Exportable service summary coming soon.
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
    paddingBottom: 130,
  },
  profileHero: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarBig: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarBigLetter: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  handle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  role: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 8,
  },
  verifiedText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '700',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  progressDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  hoursTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  hoursValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  certCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 16,
    borderRadius: 16,
  },
  certTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: 2,
  },
  certText: {
    fontSize: 11,
    color: '#1D4ED8',
    lineHeight: 16,
  },
});
