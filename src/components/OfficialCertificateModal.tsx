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
  Share2,
  ShieldCheck,
  X,
  QrCode,
  Building2,
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
              <Award size={18} color={COLORS.navy} />
              <Text style={styles.topBadgeText}>Official Civic Credential</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Close certificate"
            >
              <X size={20} color={COLORS.navy} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.certFrame}>
            {/* Certificate sheet — light minimalist surface */}
            <View style={styles.sheet}>
              {/* Authority header */}
              <View style={styles.crestHeader}>
                <Building2 size={28} color={COLORS.navy} />
                <Text style={styles.govTitle}>Government of Punjab</Text>
                <Text style={styles.deptSubtitle}>
                  Municipal Corporation Ludhiana (MCL) • Punjab Civic Audit Authority
                </Text>
                <View style={styles.mistDivider} />
              </View>

              {/* Certificate title */}
              <Text style={styles.certHeading}>Certificate of Civic Contribution</Text>
              <Text style={styles.certSubheading}>
                And Social Impact Verification
              </Text>

              <Text style={styles.presentationText}>This is to officially certify that</Text>

              {/* Recipient — largest, semibold */}
              <View style={styles.recipientBlock}>
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

              {/* Key impact stats — plain columns with dividers */}
              <View style={styles.metricsRow}>
                <View style={styles.metricCol}>
                  <Text style={styles.metricVal}>{verifiedTasksCount}</Text>
                  <Text style={styles.metricLbl}>Verified Tasks</Text>
                </View>
                <View style={[styles.metricCol, styles.metricColDivided]}>
                  <Text style={styles.metricVal}>{citizensCount.toLocaleString()}+</Text>
                  <Text style={styles.metricLbl}>Citizens Safeguarded</Text>
                </View>
                <View style={[styles.metricCol, styles.metricColDivided]}>
                  <Text style={styles.metricVal} numberOfLines={1}>
                    {certificate.summary.points_earned ? `${certificate.summary.points_earned}` : 'A'}
                  </Text>
                  <Text style={styles.metricLbl}>
                    {certificate.summary.points_earned ? 'Impact Points' : 'Impact Grade'}
                  </Text>
                </View>
              </View>

              {/* Domain task rows — thin dividers, fixed-width counts */}
              <View style={styles.tableSection}>
                <Text style={styles.tableTitle}>Accumulated Task Domains</Text>
                {certificate.domains.map((dom, i) => (
                  <View key={i} style={styles.tableRow}>
                    <View style={styles.domInfo}>
                      <Text style={styles.domTitle} numberOfLines={2}>{dom.title}</Text>
                      <Text style={styles.domJurisdiction} numberOfLines={1}>{dom.jurisdiction}</Text>
                      <Text style={styles.domMetric} numberOfLines={2}>{dom.impact_metric}</Text>
                      <Text style={styles.statusText}>Verified</Text>
                    </View>
                    <View style={styles.countCol}>
                      <Text style={styles.countText}>{dom.task_count}</Text>
                      <Text style={styles.countUnit}>tasks</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Verification & signatories */}
              <View style={styles.verificationSection}>
                <View style={styles.qrSide}>
                  <View style={styles.qrBox}>
                    <QrCode size={48} color={COLORS.navy} />
                  </View>
                  <Text style={styles.certIdText} numberOfLines={1}>{serialId}</Text>
                  <Text style={styles.hashText} numberOfLines={2}>Hash: {certificate.verification_hash}</Text>
                </View>

                <View style={styles.signSide}>
                  <View style={styles.sealRow}>
                    <ShieldCheck size={16} color={COLORS.verified} />
                    <Text style={styles.sealText}>MCL Punjab Seal</Text>
                  </View>
                  <Text style={styles.signTitle}>Digitally Endorsed by</Text>
                  <Text style={styles.signPerson}>Commissioner, MCL</Text>
                  <Text style={styles.signRole}>Municipal Corporation Ludhiana & Punjab Civic Audit Authority</Text>
                </View>
              </View>

              {/* Date note */}
              <Text style={styles.footerNote}>
                Issued on {new Date(certificate.issued_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })} • Verifiable on civicfeed.org/verify
              </Text>
            </View>
          </ScrollView>

          {/* Bottom actions — single orange primary */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShare}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Share Credential"
            >
              <Share2 size={18} color={COLORS.onOrange} />
              <Text style={styles.shareBtnText}>Share Credential</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.copyBtn}
              onPress={handleShareLink}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Share Verify Link"
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
    backgroundColor: 'rgba(11, 27, 47, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    width: '100%',
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: COLORS.mist,
    overflow: 'hidden',
    shadowColor: '#0B1B2F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.mist,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexShrink: 1,
  },
  topBadgeText: {
    ...TYPOGRAPHY.micro,
    ...CAPS_LABEL,
    color: COLORS.text,
    flexShrink: 1,
  },
  closeBtn: {
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.mist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    maxHeight: 560,
  },
  certFrame: {
    padding: 16,
    backgroundColor: COLORS.background,
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.mist,
    shadowColor: '#0B1B2F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  crestHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  govTitle: {
    ...TYPOGRAPHY.subtitle,
    ...CAPS_LABEL,
    color: COLORS.text,
    marginTop: 8,
    textAlign: 'center',
  },
  deptSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  mistDivider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.mist,
    marginTop: 12,
  },
  certHeading: {
    ...TYPOGRAPHY.title,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 8,
  },
  certSubheading: {
    ...TYPOGRAPHY.micro,
    ...CAPS_LABEL,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  presentationText: {
    ...TYPOGRAPHY.bodySm,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  recipientBlock: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.mist,
  },
  recipientName: {
    ...TYPOGRAPHY.h2,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  recipientHandle: {
    ...TYPOGRAPHY.bodySm,
    ...NUMERIC,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  institutionName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  certBody: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.text,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  highlightText: {
    fontWeight: '700',
    color: COLORS.text,
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.mist,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  metricColDivided: {
    borderLeftWidth: 1,
    borderLeftColor: COLORS.mist,
  },
  metricVal: {
    ...TYPOGRAPHY.h2,
    ...NUMERIC,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  metricLbl: {
    ...TYPOGRAPHY.micro,
    ...CAPS_LABEL,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 4,
  },
  tableSection: {
    marginBottom: 16,
  },
  tableTitle: {
    ...TYPOGRAPHY.micro,
    ...CAPS_LABEL,
    color: COLORS.muted,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.mist,
  },
  domInfo: {
    flex: 1,
    flexShrink: 1,
    paddingRight: 8,
  },
  domTitle: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.text,
  },
  domJurisdiction: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  domMetric: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusText: {
    ...TYPOGRAPHY.micro,
    ...CAPS_LABEL,
    color: COLORS.verified,
    marginTop: 4,
  },
  countCol: {
    width: 64,
    alignItems: 'flex-end',
    paddingTop: 2,
  },
  countText: {
    ...TYPOGRAPHY.bodyStrong,
    ...NUMERIC,
    color: COLORS.text,
    textAlign: 'right',
  },
  countUnit: {
    ...TYPOGRAPHY.micro,
    ...CAPS_LABEL,
    color: COLORS.muted,
    textAlign: 'right',
    marginTop: 2,
  },
  verificationSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.mist,
  },
  qrSide: {
    alignItems: 'flex-start',
    flexShrink: 1,
    maxWidth: 160,
  },
  qrBox: {
    backgroundColor: COLORS.surface,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.mist,
    marginBottom: 8,
  },
  certIdText: {
    ...TYPOGRAPHY.captionStrong,
    ...NUMERIC,
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  hashText: {
    ...TYPOGRAPHY.caption,
    ...NUMERIC,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  signSide: {
    alignItems: 'flex-end',
    flex: 1,
    flexShrink: 1,
  },
  sealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sealText: {
    ...TYPOGRAPHY.micro,
    ...CAPS_LABEL,
    color: COLORS.verified,
  },
  signTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  signPerson: {
    ...TYPOGRAPHY.bodySmStrong,
    color: COLORS.text,
    textAlign: 'right',
    marginTop: 2,
  },
  signRole: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
  footerNote: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  actionRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.mist,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.orange,
    paddingVertical: 14,
    minHeight: 44,
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
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.mist,
    paddingVertical: 14,
    minHeight: 44,
    borderRadius: 14,
  },
  copyBtnText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.navy,
  },
});
