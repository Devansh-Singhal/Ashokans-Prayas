import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuth, DEMO_PERSONAS } from '../context/AuthContext';
import { Users2, Award } from 'lucide-react-native';

export const PersonaBar: React.FC = () => {
  const { currentPersona, switchPersona, currentUser } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.liveTag}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>STAGE DEMO PERSONA</Text>
        </View>
        <View style={styles.pointsBadge}>
          <Award size={13} color="#F59E0B" />
          <Text style={styles.pointsText}>{currentUser.points_balance} pts</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {DEMO_PERSONAS.map((p) => {
          const isSelected = p.id === currentPersona.id;
          return (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.personaPill,
                isSelected && { backgroundColor: p.avatarColor, borderColor: p.avatarColor },
              ]}
              onPress={() => switchPersona(p.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.avatar, { backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : p.avatarColor }]}>
                <Text style={styles.avatarLetter}>{p.name.charAt(0)}</Text>
              </View>
              <View>
                <Text style={[styles.personaName, isSelected && styles.personaNameActive]}>
                  {p.name.split(' ')[0]}
                </Text>
                <Text style={[styles.personaRole, isSelected && styles.personaRoleActive]}>
                  {p.role}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  pointsText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '800',
  },
  scroll: {
    gap: 8,
  },
  personaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  personaName: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  personaNameActive: {
    color: '#FFFFFF',
  },
  personaRole: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '600',
  },
  personaRoleActive: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
});
