import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ShieldCheck, Smartphone, CheckCircle } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

export const ParentConsentModal: React.FC = () => {
  const { isParentConsentModalVisible, setParentConsentModalVisible, simulateParentApproval, currentUser } = useAuth();
  const [isApproving, setIsApproving] = useState(false);

  if (!isParentConsentModalVisible) return null;

  const handleSimulate = async () => {
    setIsApproving(true);
    setTimeout(async () => {
      await simulateParentApproval();
      setIsApproving(false);
    }, 800);
  };

  return (
    <Modal visible={isParentConsentModalVisible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Smartphone size={32} color="#2563EB" />
          </View>

          <Text style={styles.title}>Parental Consent Required</Text>
          <Text style={styles.subtitle}>
            Student {currentUser.public_handle} is under 18. Per child safety compliance, an SMS approval link was dispatched to:
          </Text>

          <View style={styles.phoneBox}>
            <Text style={styles.phoneText}>{currentUser.parent_phone_number || '+91 98999 88877'}</Text>
          </View>

          <Text style={styles.notice}>
            "Your child requested permission to participate in accredited school civic infrastructure auditing with CivicFeed."
          </Text>

          <TouchableOpacity style={styles.approveButton} onPress={handleSimulate} disabled={isApproving}>
            {isApproving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <ShieldCheck size={18} color="#FFFFFF" />
                <Text style={styles.approveButtonText}>Simulate 1-Click Parent Approval</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setParentConsentModalVisible(false)}
          >
            <Text style={styles.cancelButtonText}>Dismiss for Demo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  phoneBox: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  phoneText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  notice: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 16,
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 10,
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 6,
  },
  cancelButtonText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
});
