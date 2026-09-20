import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CertificateData, Contribution, UserTasksResponse } from '../types';
import { groupContributions, certificateEligibility } from '../utils/contributions';
import { COLORS } from '../constants/colors';
import { OfficialCertificateModal } from '../components/OfficialCertificateModal';
import { ShieldCheck, Award, FileText, CheckCircle2, Download, Eye } from 'lucide-react-native';
import { CAPS_LABEL, NUMERIC, TYPOGRAPHY } from '../constants/typography';

type ProfileTab = 'overview' | 'certificate';

export const ProfileScreen: React.FC = () => {
  const { currentUser, currentPersona, contributions } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [serverReports, setServerReports] = useState<Contribution[]>([]);
  const [serverTasks, setServerTasks] = useState<UserTasksResponse | null>(null);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [certModalVisible, setCertModalVisible] = useState(false);
  const [generatingCert, setGeneratingCert] = useState(false);

  // Seed the certificate with server-truth reports filed by this user, merged
  // with whatever this session has already logged locally.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const feed = await api.getWardFeed('WARD_LUDHIANA_14', 1, 100);
        const mine: Contribution[] = feed.tickets
          .filter((ticket) => ticket.reporter_id === currentUser.id)
          .map((ticket) => ({
            id: ticket.id,
            kind: 'REPORT',
            category: ticket.category,
            at: ticket.created_at,
          }));
        if (!cancelled) setServerReports(mine);
      } catch {
        // Offline/demo fallback — the certificate still works off in-session contributions.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser.id]);

  // Certificate backend as the primary source; the ward-feed seed below is the
  // offline fallback when the backend is unreachable.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setTasksLoading(true);
      setTasksError(null);
      try {
        const data = await api.getUserTasks(currentUser.id);
        if (!cancelled) setServerTasks(data);
      } catch (err: any) {
        if (!cancelled) {
          setServerTasks(null);
          setTasksError(err?.message || 'Certificate service unavailable');
        }
      } finally {
        if (!cancelled) setTasksLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser.id]);

  const handleViewCertificate = async () => {
    setGeneratingCert(true);
    try {
      const cert = await api.generateCertificate(currentUser.id);
      setCertificate(cert);
      setCertModalVisible(true);
    } catch {
      // Offline/demo: leave the modal closed; the fallback groups still render.
    } finally {
      setGeneratingCert(false);
    }
  };

  const allContributions = [...serverReports, ...contributions];
  const groups = groupContributions(allContributions);
  const totalContributions = groups.reduce((sum, g) => sum + g.count, 0);
  const eligibility = certificateEligibility(allContributions, currentUser);
  const backendLive = serverTasks !== null;
  const displayTotal = serverTasks?.total_unique_tasks ?? totalContributions;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.profileHero}>
        <View style={[styles.avatarBig, { backgroundColor: currentPersona.avatarColor }]}>
          <Text style={styles.avatarBigLetter}>{currentPersona.name.charAt(0)}</Text>
        </View>
        <Text style={styles.handle}>{currentUser.public_handle}</Text>
        <Text style={styles.role}>{currentPersona.role} • {currentPersona.name}</Text>
        <View style={styles.verifiedRow}>
          <ShieldCheck
            size={14}
            color={currentUser.consent_status === 'ACTIVE' ? COLORS.verified : '#92400E'}
          />
          <Text
            style={[
              styles.verifiedText,
              currentUser.consent_status !== 'ACTIVE' && styles.verifiedTextPending,
            ]}
          >
            {currentUser.consent_status === 'ACTIVE'
              ? 'Civic Identity Verified'
              : 'Verification Pending — parent consent required'}
          </Text>
        </View>
      </View>

      {/* Overview / Certificate segmented control */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'overview' && styles.segmentActive]}
          onPress={() => setActiveTab('overview')}
          activeOpacity={0.8}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'overview' }}
          accessibilityLabel="Overview"
        >
          <Text style={[styles.segmentText, activeTab === 'overview' && styles.segmentTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'certificate' && styles.segmentActive]}
          onPress={() => setActiveTab('certificate')}
          activeOpacity={0.8}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'certificate' }}
          accessibilityLabel="Certificate"
        >
          <Text style={[styles.segmentText, activeTab === 'certificate' && styles.segmentTextActive]}>
            Certificate
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'overview' ? (
        <>
          {/* Points Card */}
          <View style={styles.statCard}>
            <View style={styles.statRow}>
              <View style={styles.statInfo}>
                <Text style={styles.statLabel}>Total Points Balance</Text>
                <Text style={styles.statValue}>{currentUser.points_balance} pts</Text>
              </View>
              <Award size={32} color={COLORS.amber} />
            </View>
          </View>

          {/* Academic Credential Note */}
          <View style={styles.certCard}>
            <FileText size={20} color={COLORS.amber} />
            <View style={{ flex: 1, flexShrink: 1 }}>
              <Text style={styles.certTitle}>Open-Data Infrastructure Credential</Text>
              <Text style={styles.certText}>
                Points are verified civic contributions synced from the server ward ledger. Exportable service summary coming soon.
              </Text>
            </View>
          </View>
        </>
      ) : (
        <>
          {/* Certificate holder */}
          <View style={styles.statCard}>
            <Text style={styles.certificateHolderLabel}>Certificate Holder</Text>
            <Text style={styles.certificateHolderName}>{currentUser.public_handle}</Text>
            <Text style={styles.certificateHolderMeta}>
              {currentPersona.role} • Ward 14, Ludhiana, Punjab
            </Text>

            <View style={styles.progressDivider} />

            <View style={styles.certificateStatsRow}>
              <View style={styles.certificateStat}>
                <Text style={styles.statValue}>{displayTotal}</Text>
                <Text style={styles.statLabel}>Contributions</Text>
              </View>
              <View style={styles.certificateStat}>
                <Text style={styles.statValue}>{currentUser.points_balance}</Text>
                <Text style={styles.statLabel}>Points</Text>
              </View>
            </View>
            {!backendLive && !tasksLoading && (
              <Text style={styles.offlineNote}>
                Offline — showing contributions from this session{tasksError ? ` (${tasksError})` : ''}.
              </Text>
            )}
          </View>

          {/* Grouped contributions — server domains when live, local fallback otherwise */}
          {tasksLoading ? (
            <View style={styles.statCard}>
              <ActivityIndicator size="small" color={COLORS.navy} />
              <Text style={styles.emptyGroupsText}>Loading verified contributions…</Text>
            </View>
          ) : backendLive ? (
            <View style={styles.statCard}>
              <Text style={styles.groupsTitle}>Civic Contributions by Category</Text>
              {serverTasks!.grouped_domains.length === 0 ? (
                <Text style={styles.emptyGroupsText}>
                  No verified contributions yet. File a report or complete an audit to start building your certificate.
                </Text>
              ) : (
                serverTasks!.grouped_domains.map((d) => (
                  <View key={d.domain_id} style={styles.groupRow}>
                    <View style={styles.groupInfo}>
                      <Text style={styles.groupName} numberOfLines={2}>{d.title}</Text>
                      <Text style={styles.groupJurisdiction} numberOfLines={1}>{d.jurisdiction}</Text>
                      {d.tasks.some((t) => t.is_simulated) && (
                        <Text style={styles.demoNote}>Demo data</Text>
                      )}
                    </View>
                    <View style={styles.groupCountWrap}>
                      <Text style={styles.groupCountText}>{d.task_count}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          ) : (
          <View style={styles.statCard}>
            <Text style={styles.groupsTitle}>Civic Contributions by Category</Text>
            {groups.length === 0 ? (
              <Text style={styles.emptyGroupsText}>
                No verified contributions yet. File a report or complete an audit to start building your certificate.
              </Text>
            ) : (
              groups.map((g) => (
                <View key={g.group} style={styles.groupRow}>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName} numberOfLines={2}>{g.group}</Text>
                  </View>
                  <View style={styles.groupCountWrap}>
                    <Text style={styles.groupCountText}>{g.count}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
          )}

          {/* Eligibility status — plain text row, semantic color */}
          <View style={styles.eligibilityRow}>
            <CheckCircle2 size={18} color={eligibility.eligible ? COLORS.verified : '#92400E'} />
            <Text
              style={[
                styles.eligibilityText,
                eligibility.eligible ? styles.eligibilityTextActive : styles.eligibilityTextPending,
              ]}
            >
              {eligibility.reason}
            </Text>
          </View>

          {/* View Certificate — opens the official modal via the backend */}
          <TouchableOpacity
            style={[styles.downloadButton, styles.viewButton]}
            onPress={handleViewCertificate}
            disabled={generatingCert}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="View Certificate"
            accessibilityState={{ disabled: generatingCert }}
          >
            {generatingCert ? (
              <ActivityIndicator size="small" color={COLORS.onOrange} />
            ) : (
              <Eye size={18} color={COLORS.onOrange} />
            )}
            <Text style={styles.viewButtonText}>
              {generatingCert ? 'Generating…' : 'View Certificate'}
            </Text>
          </TouchableOpacity>

          {/* Legacy offline placeholder */}
          <TouchableOpacity
            style={styles.downloadButton}
            disabled
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityLabel="Download Certificate"
            accessibilityState={{ disabled: true }}
          >
            <Download size={18} color={COLORS.muted} />
            <Text style={styles.downloadButtonText}>Download Certificate</Text>
          </TouchableOpacity>
          <Text style={styles.downloadCaption}>Coming soon</Text>
        </>
      )}
      <OfficialCertificateModal
        visible={certModalVisible}
        certificate={certificate}
        onClose={() => setCertModalVisible(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 130,
  },
  profileHero: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.mist,
    shadowColor: '#0B1B2F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  avatarBig: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarBigLetter: {
    ...TYPOGRAPHY.h3,
    color: COLORS.white,
  },
  handle: {
    ...TYPOGRAPHY.h4,
    ...NUMERIC,
    color: COLORS.text,
  },
  role: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  verifiedText: {
    ...TYPOGRAPHY.micro,
    ...CAPS_LABEL,
    color: COLORS.verified,
  },
  verifiedTextPending: {
    color: '#92400E',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.mist,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    minHeight: 44,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: COLORS.surface,
  },
  segmentText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.textSecondary,
  },
  segmentTextActive: {
    color: COLORS.text,
  },
  statCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.mist,
    marginBottom: 16,
    shadowColor: '#0B1B2F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  statInfo: {
    flex: 1,
    flexShrink: 1,
  },
  statLabel: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.textSecondary,
  },
  statValue: {
    ...TYPOGRAPHY.stat,
    ...NUMERIC,
    color: COLORS.text,
    marginTop: 2,
  },
  progressDivider: {
    height: 1,
    backgroundColor: COLORS.mist,
    marginVertical: 12,
  },
  certCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: COLORS.navy,
    borderWidth: 1,
    borderColor: COLORS.navyDeep,
    padding: 16,
    borderRadius: 14,
  },
  certTitle: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.white,
    marginBottom: 2,
  },
  certText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.mist,
  },
  certificateHolderLabel: {
    ...TYPOGRAPHY.micro,
    ...CAPS_LABEL,
    color: COLORS.muted,
  },
  certificateHolderName: {
    ...TYPOGRAPHY.h2,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 4,
  },
  certificateHolderMeta: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  certificateStatsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  certificateStat: {
    alignItems: 'center',
    flex: 1,
  },
  groupsTitle: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyGroupsText: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.textSecondary,
  },
  groupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.mist,
  },
  groupInfo: {
    flex: 1,
    flexShrink: 1,
    paddingRight: 8,
  },
  groupName: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.text,
  },
  groupJurisdiction: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  demoNote: {
    ...TYPOGRAPHY.micro,
    ...CAPS_LABEL,
    color: COLORS.muted,
    marginTop: 4,
  },
  offlineNote: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  groupCountWrap: {
    width: 64,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  groupCountText: {
    ...TYPOGRAPHY.bodyStrong,
    ...NUMERIC,
    color: COLORS.text,
    textAlign: 'right',
  },
  eligibilityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.mist,
    marginBottom: 12,
    shadowColor: '#0B1B2F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  eligibilityText: {
    ...TYPOGRAPHY.bodySmStrong,
    flex: 1,
    flexShrink: 1,
  },
  eligibilityTextActive: {
    color: COLORS.verified,
  },
  eligibilityTextPending: {
    color: '#92400E',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.mist,
    paddingVertical: 14,
    minHeight: 44,
    borderRadius: 14,
  },
  downloadButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.muted,
  },
  viewButton: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orange,
    marginBottom: 12,
  },
  viewButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.onOrange,
  },
  downloadCaption: {
    ...TYPOGRAPHY.caption,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 6,
  },
});
