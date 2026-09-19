import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { X, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react-native';
import { StepSpotIcon, StepEscalateIcon, StepAuditIcon } from './CivicIcons';

export const CivicOnboardingCard: React.FC = () => {
  // TODO: persist dismiss via AsyncStorage
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isDismissed) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <View style={styles.shieldIconBox}>
            <ShieldCheck size={18} color="#38BDF8" />
          </View>
          <View>
            <Text style={styles.title}>How CivicFeed Works</Text>
            <Text style={styles.subtitle}>Ward 14 Citizen Verification Network</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsCollapsed(!isCollapsed)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isCollapsed ? (
              <ChevronDown size={18} color="#94A3B8" />
            ) : (
              <ChevronUp size={18} color="#94A3B8" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsDismissed(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {!isCollapsed && (
        <View style={styles.stepsContainer}>
          {/* Step 1 */}
          <View style={styles.stepRow}>
            <View style={[styles.iconWrapper, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
              <StepSpotIcon size={20} color="#0284C7" />
            </View>
            <View style={styles.stepContent}>
              <View style={styles.stepHeadingRow}>
                <Text style={styles.stepNumber}>1. SPOT</Text>
                <View style={styles.pointsPill}>
                  <Text style={styles.pointsPillText}>+50 pts</Text>
                </View>
              </View>
              <Text style={styles.stepDesc}>
                Photograph road hazards with GPS to notify the Municipal Corporation.
              </Text>
            </View>
          </View>

          {/* Step 2 */}
          <View style={styles.stepRow}>
            <View style={[styles.iconWrapper, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
              <StepEscalateIcon size={20} color="#D97706" />
            </View>
            <View style={styles.stepContent}>
              <View style={styles.stepHeadingRow}>
                <Text style={styles.stepNumber}>2. ESCALATE</Text>
                <View style={styles.pointsPill}>
                  <Text style={styles.pointsPillText}>+25 pts</Text>
                </View>
              </View>
              <Text style={styles.stepDesc}>
                Tap &quot;I Hit This Too!&quot; on existing defects to force a 48h emergency repair SLA.
              </Text>
            </View>
          </View>

          {/* Step 3 */}
          <View style={styles.stepRow}>
            <View style={[styles.iconWrapper, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
              <StepAuditIcon size={20} color="#16A34A" />
            </View>
            <View style={styles.stepContent}>
              <View style={styles.stepHeadingRow}>
                <Text style={styles.stepNumber}>3. AUDIT</Text>
                <View style={[styles.pointsPill, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={[styles.pointsPillText, { color: '#15803D' }]}>+150 pts</Text>
                </View>
              </View>
              <Text style={styles.stepDesc}>
                When contractors upload a fix, walk within 50m to inspect and close the ticket.
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  shieldIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepsContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContent: {
    flex: 1,
  },
  stepHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  pointsPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  pointsPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  stepDesc: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
});
