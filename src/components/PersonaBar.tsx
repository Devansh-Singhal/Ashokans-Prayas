import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { useAuth, DEMO_PERSONAS } from '../context/AuthContext';
import { Award, Info, X, ShieldCheck, UserCheck, Smartphone } from 'lucide-react-native';
import { CAPS_LABEL, NUMERIC, TYPOGRAPHY } from '../constants/typography';

export const PersonaBar: React.FC = () => {
  const { currentPersona, switchPersona, currentUser } = useAuth();
  const [showExplainer, setShowExplainer] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.liveTag}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>STAGE DEMO PERSONA</Text>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => setShowExplainer(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Why demo personas"
          >
            <Info size={13} color="#38BDF8" />
          </TouchableOpacity>
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
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : p.avatarColor },
                ]}
              >
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

      {/* Stage Demo Explainer Modal */}
      <Modal
        visible={showExplainer}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExplainer(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleGroup}>
                <Smartphone size={18} color="#38BDF8" />
                <Text style={styles.modalTitle}>Why Demo Personas?</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowExplainer(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Close explainer"
                style={styles.modalIconButton}
              >
                <X size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalIntro}>
              CivicFeed enforces physical GPS geofencing. In production, users log in via mobile OTP.
              For this stage demonstration, switch personas instantly to evaluate different civic roles
              on a single device:
            </Text>

            <View style={styles.personasOverview}>
              {/* Rahul */}
              <View style={styles.personaRow}>
                <View style={[styles.personaIconBox, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
                  <Text style={[styles.personaInit, { color: '#4F46E5' }]}>R</Text>
                </View>
                <View style={styles.personaTextGroup}>
                  <Text style={styles.personaNameLabel}>Rahul (Citizen Reporter)</Text>
                  <Text style={styles.personaDesc}>
                    Photographs new defects for AI classification (+50 escrow pts).
                  </Text>
                </View>
              </View>

              {/* Anjali */}
              <View style={styles.personaRow}>
                <View style={[styles.personaIconBox, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                  <Text style={[styles.personaInit, { color: '#059669' }]}>A</Text>
                </View>
                <View style={styles.personaTextGroup}>
                  <Text style={styles.personaNameLabel}>Anjali (Passerby Auditor)</Text>
                  <Text style={styles.personaDesc}>
                    Positioned within 30m of the provisional fix on 80ft Road. Performs the ground truth audit to close tickets (+150 pts).
                  </Text>
                </View>
              </View>

              {/* Rohan */}
              <View style={styles.personaRow}>
                <View style={[styles.personaIconBox, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                  <Text style={[styles.personaInit, { color: '#D97706' }]}>Ro</Text>
                </View>
                <View style={styles.personaTextGroup}>
                  <Text style={styles.personaNameLabel}>Rohan (Under-18 Minor)</Text>
                  <Text style={styles.personaDesc}>
                    Triggers the automated parent consent token flow and tests anti-collusion reciprocity decay algorithms.
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowExplainer(false)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Close explainer"
            >
              <Text style={styles.modalCloseText}>Understood</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    ...TYPOGRAPHY.micro,
    ...CAPS_LABEL,
    color: '#94A3B8',
  },
  infoButton: {
    padding: 2,
    borderRadius: 4,
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
    ...TYPOGRAPHY.captionStrong,
    ...NUMERIC,
    color: '#F8FAFC',
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
    paddingVertical: 10,
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
    ...TYPOGRAPHY.captionStrong,
    color: '#FFFFFF',
  },
  personaName: {
    ...TYPOGRAPHY.captionStrong,
    color: '#F8FAFC',
  },
  personaNameActive: {
    ...TYPOGRAPHY.captionStrong,
    color: '#FFFFFF',
  },
  personaRole: {
    ...TYPOGRAPHY.microFaint,
    ...CAPS_LABEL,
    color: '#94A3B8',
  },
  personaRoleActive: {
    ...TYPOGRAPHY.microFaint,
    ...CAPS_LABEL,
    color: 'rgba(255,255,255,0.85)',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  modalTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalIconButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    ...TYPOGRAPHY.title,
    color: '#0F172A',
  },
  modalIntro: {
    ...TYPOGRAPHY.bodySm,
    color: '#64748B',
    marginBottom: 16,
  },
  personasOverview: {
    gap: 12,
    marginBottom: 20,
  },
  personaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  personaIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  personaInit: {
    ...TYPOGRAPHY.bodySmStrong,
    ...NUMERIC,
  },
  personaTextGroup: {
    flex: 1,
  },
  personaNameLabel: {
    ...TYPOGRAPHY.bodyStrong,
    color: '#0F172A',
    marginBottom: 2,
  },
  personaDesc: {
    ...TYPOGRAPHY.caption,
    color: '#64748B',
  },
  modalCloseButton: {
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  modalCloseText: {
    ...TYPOGRAPHY.bodyStrong,
    color: '#FFFFFF',
  },
});
