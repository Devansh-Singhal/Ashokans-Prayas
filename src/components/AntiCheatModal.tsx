import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { ShieldAlert, Users, TrendingDown, CheckCircle2 } from 'lucide-react-native';
import { VerificationResult } from '../types';

interface Props {
  visible: boolean;
  result: VerificationResult | null;
  onClose: () => void;
}

export const AntiCheatModal: React.FC<Props> = ({ visible, result, onClose }) => {
  if (!result) return null;

  const pairingNumber = result.pairing_count ?? 1;
  const isCollusion = (result.decay_percentage || 0) > 0;
  const needsEvidence = result.credited_points === 0;

  const title = needsEvidence
    ? 'Audit Recorded — Evidence Needed'
    : isCollusion
      ? 'Anti-Collusion Protection Activated'
      : 'Verified Clean & Credited!';
  const subtitle = needsEvidence
    ? 'Your audit was recorded but no points were credited yet — a provisional fix photo is required before credit.'
    : isCollusion
      ? 'Our game-theoretic Reciprocity Decay engine detected repeated mutual verification with this reporter.'
      : 'You successfully verified an independent citizen report. Full audit credit awarded!';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: isCollusion ? '#FEE2E2' : '#DCFCE7' },
            ]}
          >
            {isCollusion ? (
              <ShieldAlert size={36} color="#DC2626" />
            ) : (
              <CheckCircle2 size={36} color="#16A34A" />
            )}
          </View>

          <Text style={styles.title}>
            {title}
          </Text>

          <Text style={styles.subtitle}>
            {subtitle}
          </Text>

          <View style={styles.pointsBox}>
            <View style={styles.pointRow}>
              <Text style={styles.pointLabel}>Base Audit Reward:</Text>
              <Text style={styles.pointOldValue}>150 pts</Text>
            </View>

            {isCollusion && !needsEvidence && (
              <View style={styles.decayRow}>
                <View style={styles.decayTag}>
                  <TrendingDown size={14} color="#DC2626" />
                  <Text style={styles.decayText}>-{result.decay_percentage}% Decay Applied</Text>
                </View>
              </View>
            )}

            <View style={[styles.pointRow, styles.finalRow]}>
              <Text style={styles.pointLabelFinal}>Final Credited Points:</Text>
              <Text
                style={[
                  styles.pointFinalValue,
                  { color: isCollusion ? '#DC2626' : '#16A34A' },
                ]}
              >
                +{result.credited_points} pts
              </Text>
            </View>
          </View>

          {isCollusion && (
            <View style={styles.telemetryBox}>
              <Users size={16} color="#475569" />
              <Text style={styles.telemetryText}>
                This is pairing #{pairingNumber} (prior pairings: {pairingNumber - 1})
              </Text>
            </View>
          )}

          <Text style={styles.explanation}>
            {isCollusion
              ? 'Formula: 150 × (1 / [1 + prior_pairings]) × evidence_weight. First audit of a pair is pairing #1 (prior 0). This mathematical decay ensures college cartels cannot farm hours or certificates.'
              : 'Ticket marked RESOLVED on the public ward timeline.'}
          </Text>

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>
              {isCollusion ? 'Acknowledge & Continue' : 'Awesome, Return to Feed'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  pointsBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  pointRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  pointLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  pointOldValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  decayRow: {
    marginVertical: 4,
    alignItems: 'flex-start',
  },
  decayTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  decayText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  finalRow: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginBottom: 0,
  },
  pointLabelFinal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  pointFinalValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  telemetryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    width: '100%',
    marginBottom: 12,
  },
  telemetryText: {
    fontSize: 12,
    color: '#334155',
  },
  explanation: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 15,
    marginBottom: 20,
  },
  button: {
    width: '100%',
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
