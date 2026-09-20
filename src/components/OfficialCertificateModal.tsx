import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Platform,
} from 'react-native';
import {
  Award,
  Download,
  Share2,
  ShieldCheck,
  X,
  QrCode,
  Building2,
  ExternalLink,
} from 'lucide-react-native';
import { CertificateData } from '../types';
import { COLORS } from '../constants/colors';
import { CAPS_LABEL, NUMERIC, TYPOGRAPHY } from '../constants/typography';

interface Props {
  visible: boolean;
  certificate: CertificateData | null;
  onClose: () => void;
}

export const OfficialCertificateModal: React.FC<Props> = ({ visible, certificate, onClose }) => {
  if (!certificate) return null;

  const serialId = certificate.certificate_id?.replace('PRAYAS-DEL-', 'PRAYAS-PB-LDH-') || certificate.certificate_id;
  const verifiedTasksCount = certificate.summary.total_verified_tasks ?? certificate.summary.total_tasks_completed;
  const citizensCount = certificate.summary.citizens_safeguarded ?? verifiedTasksCount * 850;

  const handleShare = async () => {
    try {
      await Share.share({
        title: `CivicFeed Official Certificate - ${certificate.recipient.name}`,
        message: `Delighted to share my official Certificate of Civic Impact from Municipal Corporation Ludhiana (MCL) and Government of Punjab! I have completed ${verifiedTasksCount} verified civic remediation tasks safeguarding ${citizensCount.toLocaleString()}+ citizens. Verify here: ${certificate.verification_url}`,
      });
    } catch (err) {
      console.log('Share error', err);
    }
  };

  const handleShareLink = async () => {
    try {
      await Share.share({
        title: 'CivicFeed Certificate Verification',
        message: certificate.verification_url,
      });
    } catch (err) {
      console.log('Share error', err);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View style={styles.badgeRow}>
              <Award size={18} color="#D97706" />
              <Text style={styles.topBadgeText}>OFFICIAL CIVIC CREDENTIAL</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.certFrame}>
            {/* Inner Certificate Parchment */}
            <View style={styles.parchment}>
              {/* Gold Top Crest */}
              <View style={styles.crestHeader}>
                <Building2 size={28} color="#92400E" />
                <Text style={styles.govTitle}>GOVERNMENT OF PUNJAB</Text>
                <Text style={styles.deptSubtitle}>
                  MUNICIPAL CORPORATION LUDHIANA (MCL) • PUNJAB CIVIC AUDIT AUTHORITY
                </Text>
                <View style={styles.goldDivider} />
              </View>

              {/* Certificate Main Title */}
              <Text style={styles.certHeading}>CERTIFICATE OF CIVIC CONTRIBUTION</Text>
              <Text style={styles.certSubheading}>
                AND SOCIAL IMPACT VERIFICATION
              </Text>

              <Text style={styles.presentationText}>This is to officially certify that</Text>

              {/* Recipient Name */}
              <View style={styles.recipientBox}>
                <Text style={styles.recipientName}>{certificate.recipient.name}</Text>
                <Text style={styles.recipientHandle}>@{certificate.recipient.public_handle}</Text>
                <Text style={styles.institutionName}>{certificate.recipient.institution}</Text>
              </View>

              <Text style={styles.certBody}>
                has demonstrated exceptional civic responsibility and completed{' '}
                <Text style={styles.highlightText}>{verifiedTasksCount} verified civic infrastructure tasks</Text>{' '}
                under the municipal crowd-audit mandate, directly safeguarding over{' '}
                <Text style={styles.highlightText}>{citizensCount.toLocaleString()} citizens</Text> across Municipal Corporation Ludhiana.
              </Text>

              {/* Key Impact Stats Metric */}
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricVal}>{verifiedTasksCount}</Text>
                  <Text style={styles.metricLbl}>Verified Tasks</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricVal}>{citizensCount.toLocaleString()}+</Text>
                  <Text style={styles.metricLbl}>Citizens Safeguarded</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricVal}>{certificate.summary.points_earned ? `${certificate.summary.points_earned} pts` : 'Grade A'}</Text>
                  <Text style={styles.metricLbl}>Impact Score</Text>
                </View>
              </View>

              {/* AI Grouped Domain Task Table */}
              <View style={styles.tableContainer}>
                <Text style={styles.tableTitle}>AI-ACCUMULATED TASK DOMAINS</Text>
                {certificate.domains.map((dom, i) => (
                  <View key={i} style={styles.tableRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.domTitle}>{dom.title}</Text>
                      <Text style={styles.domJurisdiction}>{dom.jurisdiction}</Text>
                      <Text style={styles.domMetric}>• {dom.impact_metric}</Text>
                    </View>
                    <View style={styles.taskCountPill}>
                      <Text style={styles.taskCountText}>{dom.task_count} tasks</Text>
                      <Text style={styles.statusPillText}>Verified</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Verification & Signatories */}
              <View style={styles.verificationSection}>
                <View style={styles.qrSide}>
                  <View style={styles.qrPlaceholder}>
                    <QrCode size={48} color="#0F172A" />
                  </View>
                  <Text style={styles.certIdText}>{serialId}</Text>
                  <Text style={styles.hashText}>Hash: {certificate.verification_hash}</Text>
                </View>

                <View style={styles.signSide}>
                  <View style={styles.sealBadge}>
                    <ShieldCheck size={20} color="#15803D" />
                    <Text style={styles.sealText}>MCL PUNJAB SEAL</Text>
                  </View>
                  <Text style={styles.signTitle}>Digitally Endorsed by</Text>
                  <Text style={styles.signPerson}>Commissioner, MCL</Text>
                  <Text style={styles.signRole}>Municipal Corporation Ludhiana & Punjab Civic Audit Authority</Text>
                </View>
              </View>

              {/* Date & Tamper-proof Note */}
              <Text style={styles.footerNote}>
                Issued on {new Date(certificate.issued_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })} • Verifiable on civicfeed.org/verify
              </Text>
            </View>
          </ScrollView>

          {/* Bottom Actions Bar */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Share2 size={18} color={COLORS.onOrange} />
              <Text style={styles.shareBtnText}>Share Credential</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.copyBtn}
              onPress={handleShareLink}
              activeOpacity={0.8}
            >
              <Share2 size={18} color={COLORS.navy} />
              <Text style={styles.copyBtnText}>Share Verify Link</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: COLORS.navy,
    borderRadius: 24,
    width: '100%',
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: COLORS.navyDeep,
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.navyDeep,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.contentDark,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBadgeText: {
    ...TYPOGRAPHY.micro,
    ...CAPS_LABEL,
    color: COLORS.amber,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: COLORS.contentDark,
  },
  scrollArea: {
    maxHeight: 560,
  },
  certFrame: {
    padding: 16,
  },
  parchment: {
    backgroundColor: '#FFFDF7',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#D97706',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  crestHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  govTitle: {
    color: '#78350F',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 6,
  },
  deptSubtitle: {
    color: '#92400E',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
    textAlign: 'center',
  },
  goldDivider: {
    width: 140,
    height: 2,
    backgroundColor: '#D97706',
    marginTop: 10,
    borderRadius: 2,
  },
  certHeading: {
    ...TYPOGRAPHY.h2,
    color: '#1E293B',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  certSubheading: {
    ...TYPOGRAPHY.micro,
    ...CAPS_LABEL,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 14,
  },
  presentationText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 6,
  },
  recipientBox: {
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 14,
  },
  recipientName: {
    ...TYPOGRAPHY.h1,
    color: '#78350F',
    textAlign: 'center',
  },
  recipientHandle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    marginTop: 2,
  },
  institutionName: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  certBody: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 14,
  },
  highlightText: {
    fontWeight: '800',
    color: '#0F172A',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricVal: {
    ...TYPOGRAPHY.stat,
    ...NUMERIC,
    color: '#0F172A',
  },
  metricLbl: {
    ...TYPOGRAPHY.micro,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  tableContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  tableTitle: {
    ...TYPOGRAPHY.micro,
    ...CAPS_LABEL,
    color: '#64748B',
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  domTitle: {
    ...TYPOGRAPHY.bodyStrong,
    color: '#0F172A',
  },
  domJurisdiction: {
    fontSize: 10,
    color: '#2563EB',
    fontWeight: '600',
  },
  domMetric: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  taskCountPill: {
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  taskCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#16A34A',
  },
  verificationSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  qrSide: {
    alignItems: 'flex-start',
  },
  qrPlaceholder: {
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 4,
  },
  certIdText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  hashText: {
    fontSize: 8,
    color: '#64748B',
  },
  signSide: {
    alignItems: 'flex-end',
    flex: 1,
    marginLeft: 12,
  },
  sealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  sealText: {
    color: '#15803D',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  signTitle: {
    fontSize: 9,
    color: '#64748B',
  },
  signPerson: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'right',
  },
  signRole: {
    fontSize: 8,
    color: '#64748B',
    textAlign: 'right',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 14,
  },
  actionRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: COLORS.navyDeep,
    borderTopWidth: 1,
    borderTopColor: COLORS.contentDark,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.orange,
    paddingVertical: 14,
    borderRadius: 14,
  },
  shareBtnText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.onOrange,
  },
  copyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    borderRadius: 14,
  },
  copyBtnText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.navy,
  },
});
