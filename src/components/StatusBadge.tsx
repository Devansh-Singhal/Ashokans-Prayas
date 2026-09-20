import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TicketStatus } from '../types';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/typography';

interface Props {
  status: TicketStatus;
}

export const StatusBadge: React.FC<Props> = ({ status }) => {
  const getMeta = () => {
    switch (status) {
      case 'REPORTED':
        return {
          bg: '#FDECEA',
          border: COLORS.danger,
          text: COLORS.danger,
          label: 'Reported',
        };
      case 'PROVISIONAL_FIX':
        return {
          bg: '#FEF3C7',
          border: COLORS.amber,
          text: '#92400E',
          label: 'Fix Uploaded (Audit Needed)',
        };
      case 'RESOLVED':
        return {
          bg: '#E6F7EE',
          border: COLORS.verified,
          text: COLORS.verified,
          label: 'Verified Clean',
        };
      case 'WEATHER_OCCLUDED':
        return {
          bg: '#EAF2FA',
          border: COLORS.info,
          text: COLORS.info,
          label: 'Submerged (Pause Mode)',
        };
      default:
        return {
          bg: COLORS.neuSurface,
          border: COLORS.mist,
          text: COLORS.neuMuted,
          label: status,
        };
    }
  };

  const meta = getMeta();

  return (
    <View
      style={[styles.badge, { backgroundColor: meta.bg, borderColor: meta.border }]}
      accessibilityLabel={`Status ${meta.label}`}
      accessible={true}
    >
      <Text style={[styles.label, { color: meta.text }]}>{meta.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    ...TYPOGRAPHY.captionStrong,
    textAlign: 'left',
  },
});
