import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TicketStatus } from '../types';

interface Props {
  status: TicketStatus;
}

export const StatusBadge: React.FC<Props> = ({ status }) => {
  const getMeta = () => {
    switch (status) {
      case 'REPORTED':
        return {
          bg: '#FEF2F2',
          border: '#FECACA',
          text: '#DC2626',
          dot: '#EF4444',
          label: 'Reported',
        };
      case 'PROVISIONAL_FIX':
        return {
          bg: '#FFFBEB',
          border: '#FDE68A',
          text: '#D97706',
          dot: '#F59E0B',
          label: 'Fix Uploaded (Audit Needed)',
        };
      case 'RESOLVED':
        return {
          bg: '#F0FDF4',
          border: '#BBF7D0',
          text: '#16A34A',
          dot: '#10B981',
          label: 'Verified & Closed',
        };
      case 'WEATHER_OCCLUDED':
        return {
          bg: '#EFF6FF',
          border: '#BFDBFE',
          text: '#2563EB',
          dot: '#3B82F6',
          label: 'Submerged (Pause Mode)',
        };
      default:
        return {
          bg: '#F8FAFC',
          border: '#E2E8F0',
          text: '#64748B',
          dot: '#94A3B8',
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
      <View style={[styles.dot, { backgroundColor: meta.dot }]} />
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
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
