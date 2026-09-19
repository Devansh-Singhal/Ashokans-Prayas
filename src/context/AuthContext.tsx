import React, { createContext, useContext, useState, useEffect } from 'react';
import { DemoPersona, User } from '../types';
import { api } from '../services/api';

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: 'user-rahul-id',
    name: 'Rahul (Citizen Reporter)',
    role: 'Local Resident',
    handle: 'Auditor_42B9',
    phone: '+919811122233',
    isUnder18: false,
    points: 350,
    avatarColor: '#2563EB',
    description: 'Reported Pothole on 80ft Road & Garbage Dump.',
  },
  {
    id: 'user-anjali-id',
    name: 'Anjali (Stranger Auditor)',
    role: 'NSS College Volunteer',
    handle: 'Auditor_84F1',
    phone: '+919822233344',
    isUnder18: false,
    points: 600,
    avatarColor: '#0D9488',
    description: 'Independent student auditor. Earns 100% full credit (150 pts).',
  },
  {
    id: 'user-rohan-id',
    name: 'Rohan (Colluding Roommate)',
    role: "Rahul's Roommate",
    handle: 'Auditor_77C3',
    phone: '+919833344455',
    isUnder18: true,
    parentPhone: '+919899988877',
    points: 120,
    avatarColor: '#E11D48',
    description: 'Frequently pairs with Rahul. Triggers live Reciprocity Decay!',
  },
];

interface AuthContextType {
  currentPersona: DemoPersona;
  currentUser: User;
  switchPersona: (personaId: string) => void;
  updatePoints: (delta: number) => void;
  isParentConsentModalVisible: boolean;
  setParentConsentModalVisible: (visible: boolean) => void;
  simulateParentApproval: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPersona, setCurrentPersona] = useState<DemoPersona>(DEMO_PERSONAS[0]);
  const [isParentConsentModalVisible, setParentConsentModalVisible] = useState(false);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [currentUser, setCurrentUser] = useState<User>({
    id: currentPersona.id,
    public_handle: currentPersona.handle,
    phone_number: currentPersona.phone,
    is_under_18: currentPersona.isUnder18,
    parent_phone_number: currentPersona.parentPhone,
    consent_status: 'ACTIVE',
    points_balance: currentPersona.points,
    verified_hours: 14.5,
  });

  const switchPersona = (personaId: string) => {
    const found = DEMO_PERSONAS.find((p) => p.id === personaId);
    if (found) {
      setCurrentPersona(found);
      setCurrentUser({
        id: found.id,
        public_handle: found.handle,
        phone_number: found.phone,
        is_under_18: found.isUnder18,
        parent_phone_number: found.parentPhone,
        consent_status: found.isUnder18 ? 'PENDING_PARENT_CONSENT' : 'ACTIVE',
        points_balance: balances[personaId] ?? found.points,
        verified_hours: found.id === 'user-anjali-id' ? 24.0 : 8.0,
      });
      if (found.isUnder18) {
        setParentConsentModalVisible(true);
      }
    }
  };

  const updatePoints = (delta: number) => {
    setBalances((prev) => ({ ...prev, [currentPersona.id]: (prev[currentPersona.id] ?? currentUser.points_balance) + delta }));
    setCurrentUser((prev) => ({
      ...prev,
      points_balance: prev.points_balance + delta,
    }));
  };

  const simulateParentApproval = async () => {
    // Use the real API when a consent token exists; otherwise fall back to a local flip (demo mode).
    if (currentUser.consent_token) {
      try {
        await api.verifyParentConsent(currentUser.consent_token || '');
        setCurrentUser((prev) => ({
          ...prev,
          consent_status: 'ACTIVE',
        }));
        setParentConsentModalVisible(false);
        return;
      } catch {
        // fall through to local flip
      }
    }
    setCurrentUser((prev) => ({
      ...prev,
      consent_status: 'ACTIVE',
    }));
    setParentConsentModalVisible(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentPersona,
        currentUser,
        switchPersona,
        updatePoints,
        isParentConsentModalVisible,
        setParentConsentModalVisible,
        simulateParentApproval,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
