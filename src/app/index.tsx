import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { StatusBar, StyleSheet, TouchableOpacity, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CurvedBottomNav, NavTab } from '@/components/CurvedBottomNav';
import { ParentConsentModal } from '@/components/ParentConsentModal';
import { PersonaBar } from '@/components/PersonaBar';
import { AuthProvider } from '@/context/AuthContext';
import { FeedScreen } from '@/screens/FeedScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { ReportScreen } from '@/screens/ReportScreen';
import { ScorecardScreen } from '@/screens/ScorecardScreen';
import { TasksScreen } from '@/screens/TasksScreen';

export default function CivicFeedApp() {
  const [activeTab, setActiveTab] = useState<NavTab>('feed');
  const [isReporting, setIsReporting] = useState<boolean>(false);

  return (
    <AuthProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

        {/* Sticky Stage Demo Persona Switcher Bar */}
        <PersonaBar />

        {/* Active Screen Viewport */}
        <View style={styles.screenContainer}>
          {isReporting ? (
            <ReportScreen
              onClose={() => setIsReporting(false)}
              onSuccess={() => setIsReporting(false)}
            />
          ) : (
            <>
              {activeTab === 'feed' && <FeedScreen />}
              {activeTab === 'scorecard' && <ScorecardScreen />}
              {activeTab === 'tasks' && <TasksScreen />}
              {activeTab === 'profile' && <ProfileScreen />}
            </>
          )}
        </View>

        {/* Quick Report Floating Action Button (visible when not reporting) */}
        {!isReporting && (
          <TouchableOpacity
            style={styles.floatingReportBtn}
            onPress={() => setIsReporting(true)}
            activeOpacity={0.85}
          >
            <Plus size={26} color="#FFFFFF" strokeWidth={2.8} />
          </TouchableOpacity>
        )}

        {/* Under-18 Parent Consent Simulator Modal */}
        <ParentConsentModal />

        {/* Custom Curved Scoop Bottom Navigation Bar matching reference images */}
        <CurvedBottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setIsReporting(false);
          }}
        />
      </SafeAreaView>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  floatingReportBtn: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 108 : 96,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 20,
    borderWidth: 2,
    borderColor: '#334155',
  },
});
