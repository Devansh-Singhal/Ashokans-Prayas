import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  severity: number; // 1 to 5
}

export const SeverityMeter: React.FC<Props> = ({ severity }) => {
  const clamped = Math.max(1, Math.min(5, severity));

  const getColor = (lvl: number) => {
    switch (lvl) {
      case 1:
        return '#10B981'; // Green
      case 2:
        return '#3B82F6'; // Blue
      case 3:
        return '#F59E0B'; // Amber
      case 4:
        return '#F97316'; // Orange
      case 5:
        return '#EF4444'; // Red (Critical)
      default:
        return '#64748B';
    }
  };

  const getLabel = (lvl: number) => {
    switch (lvl) {
      case 1:
        return 'Minor';
      case 2:
        return 'Low Hazard';
      case 3:
        return 'Moderate';
      case 4:
        return 'High Danger';
      case 5:
        return 'Critical Emergency';
      default:
        return 'Standard';
    }
  };

  const activeColor = getColor(clamped);

  return (
    <View style={styles.container}>
      <View style={styles.barsRow}>
        {[1, 2, 3, 4, 5].map((idx) => {
          const isActive = idx <= clamped;
          return (
            <View
              key={idx}
              style={[
                styles.bar,
                {
                  backgroundColor: isActive ? activeColor : '#E2E8F0',
                  height: 6 + idx * 2, // Ascending visual height
                },
              ]}
            />
          );
        })}
      </View>
      <Text style={[styles.label, { color: activeColor }]}>
        Lvl {clamped} • {getLabel(clamped)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 18,
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
