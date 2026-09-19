import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Award, FileText } from 'lucide-react-native';
import { CAPS_LABEL, NUMERIC, TYPOGRAPHY } from '../constants/typography';

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

      {/* Points Card */}
      <View style={styles.statCard}>
        <View style={styles.statRow}>
          <View>
            <Text style={styles.statLabel}>Total Points Balance</Text>
            <Text style={styles.statValue}>{currentUser.points_balance} pts</Text>
          </View>
          <Award size={32} color="#F59E0B" />
        </View>
      </View>

      {/* Academic Credential Note */}
      <View style={styles.certCard}>
        <FileText size={20} color="#2563EB" />
        <View style={{ flex: 1 }}>
          <Text style={styles.certTitle}>Open-Data Infrastructure Credential</Text>
          <Text style={styles.certText}>
            Points are verified civic contributions synced from the server ward ledger. Exportable service summary coming soon.
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
    ...TYPOGRAPHY.h3,
    color: '#FFFFFF',
  },
  handle: {
    ...TYPOGRAPHY.h4,
    ...NUMERIC,
    color: '#0F172A',
  },
  role: {
    ...TYPOGRAPHY.bodySm,
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
    ...TYPOGRAPHY.micro,
    ...CAPS_LABEL,
    color: '#15803D',
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
    ...TYPOGRAPHY.bodySm,
    color: '#64748B',
  },
  statValue: {
    ...TYPOGRAPHY.stat,
    ...NUMERIC,
    color: '#0F172A',
    marginTop: 2,
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
    ...TYPOGRAPHY.bodyStrong,
    color: '#1E40AF',
    marginBottom: 2,
  },
  certText: {
    ...TYPOGRAPHY.caption,
    color: '#1D4ED8',
  },
});
