import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin, CheckCircle2, AlertTriangle } from 'lucide-react-native';
import { formatDistance } from '../services/location';

interface Props {
  distanceMeters: number;
  maxMeters?: number;
}

export const GeofencePill: React.FC<Props> = ({ distanceMeters, maxMeters = 50 }) => {
  const inRange = distanceMeters <= maxMeters;

  return (
    <View style={[styles.container, inRange ? styles.inRange : styles.outOfRange]}>
      {inRange ? (
        <CheckCircle2 size={13} color="#059669" />
      ) : (
        <AlertTriangle size={13} color="#D97706" />
      )}
      <Text style={[styles.text, inRange ? styles.textInRange : styles.textOutOfRange]}>
        {inRange
          ? `${formatDistance(distanceMeters)} • In audit range (≤${maxMeters}m)`
          : `${formatDistance(distanceMeters)} • Move within ${maxMeters}m to audit`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  inRange: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
  },
  outOfRange: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
  textInRange: {
    color: '#065F46',
  },
  textOutOfRange: {
    color: '#92400E',
  },
});
