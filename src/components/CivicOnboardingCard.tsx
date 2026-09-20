import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { X, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react-native';
import { StepSpotIcon, StepEscalateIcon, StepAuditIcon } from './CivicIcons';
import { COLORS } from '../constants/colors';
import { CAPS_LABEL, TYPOGRAPHY } from '../constants/typography';

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
            <ShieldCheck size={18} color={COLORS.navy} />
          </View>
          <View style={styles.titleTextGroup}>
            <Text style={styles.title}>How CivicFeed Works</Text>
            <Text style={styles.subtitle}>Ward 14 Citizen Verification Network • Ludhiana, Punjab</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsCollapsed(!isCollapsed)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={isCollapsed ? 'Expand how CivicFeed works' : 'Collapse how CivicFeed works'}
          >
            {isCollapsed ? (
              <ChevronDown size={18} color={COLORS.inkSoft} />
            ) : (
              <ChevronUp size={18} color={COLORS.inkSoft} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsDismissed(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Dismiss how CivicFeed works"
          >
            <X size={18} color={COLORS.inkSoft} />
          </TouchableOpacity>
        </View>
      </View>

      {!isCollapsed && (
        <View style={styles.stepsContainer}>
          {/* Step 1 */}
          <View style={styles.stepRow}>
            <View style={styles.iconWrapper}>
              <StepSpotIcon size={20} color={COLORS.navy} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepNumber}>1. Spot</Text>
              <Text
                style={styles.pointsText}
                accessible={true}
                accessibilityLabel="Earns 50 escrow points"
              >
                Spot — earns 50 pts
              </Text>
              <Text style={styles.stepDesc}>
                Photograph road hazards with GPS to notify the Ludhiana Municipal Corporation.
              </Text>
            </View>
          </View>

          {/* Step 2 */}
          <View style={styles.stepRow}>
            <View style={styles.iconWrapper}>
              <StepEscalateIcon size={20} color={COLORS.orange} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepNumber}>2. Fix</Text>
              <Text
                style={styles.pointsText}
                accessible={true}
                accessibilityLabel="Repair photo uploaded by municipal crew"
              >
                Fix — crew upload
              </Text>
              <Text style={styles.stepDesc}>
                Municipal crews upload a repair photo, marking the defect ready for audit.
              </Text>
            </View>
          </View>

          {/* Step 3 */}
          <View style={styles.stepRow}>
            <View style={styles.iconWrapper}>
              <StepAuditIcon size={20} color={COLORS.navy} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepNumber}>3. Audit</Text>
              <Text
                style={styles.pointsText}
                accessible={true}
                accessibilityLabel="Earns 150 audit points"
              >
                Audit — earns 150 pts
              </Text>
              <Text style={styles.stepDesc}>
                When contractors upload a fix, walk within 5m to inspect and close the ticket.
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
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.mist,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
    gap: 12,
    flex: 1,
  },
  shieldIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.mist,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleTextGroup: {
    flex: 1,
    alignItems: 'flex-start',
  },
  title: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.ink,
    textAlign: 'left',
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.inkSoft,
    textAlign: 'left',
    marginTop: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.mist,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.mist,
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
    backgroundColor: COLORS.surface,
    borderColor: COLORS.mist,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContent: {
    flex: 1,
    alignItems: 'flex-start',
  },
  stepNumber: {
    ...TYPOGRAPHY.bodySmStrong,
    ...CAPS_LABEL,
    color: COLORS.ink,
    textAlign: 'left',
    marginBottom: 8,
  },
  pointsText: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.inkSoft,
    textAlign: 'left',
    marginBottom: 8,
  },
  stepDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.inkSoft,
    textAlign: 'left',
  },
});
