import { BarChart3, Map, Newspaper, PlusCircle, User } from 'lucide-react-native';
import { useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ParentConsentModal } from '@/components/ParentConsentModal';
import { PersonaBar } from '@/components/PersonaBar';
import { AuthProvider } from '@/context/AuthContext';
import { FeedScreen } from '@/screens/FeedScreen';
import { MapScreen } from '@/screens/MapScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { ReportScreen } from '@/screens/ReportScreen';
import { ScorecardScreen } from '@/screens/ScorecardScreen';

type Tab = 'feed' | 'map' | 'report' | 'scorecard' | 'profile';

export default function CivicFeedApp() {
  const [activeTab, setActiveTab] = useState<Tab>('feed');

  return (
    <AuthProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

        {/* Sticky Stage Demo Switcher Bar */}
        <PersonaBar />

        {/* Active Screen Viewport */}
        <View style={styles.screenContainer}>
          {activeTab === 'feed' && <FeedScreen />}
          {activeTab === 'map' && <MapScreen />}
          {activeTab === 'report' && <ReportScreen />}
          {activeTab === 'scorecard' && <ScorecardScreen />}
          {activeTab === 'profile' && <ProfileScreen />}
        </View>

        {/* Under-18 Parent Consent Simulator Modal */}
        <ParentConsentModal />

        {/* Bottom Navigation Tab Bar */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('feed')}
            activeOpacity={0.7}
          >
            <Newspaper size={20} color={activeTab === 'feed' ? '#0F172A' : '#94A3B8'} />
            <Text style={[styles.navLabel, activeTab === 'feed' && styles.navLabelActive]}>Feed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('map')}
            activeOpacity={0.7}
          >
            <Map size={20} color={activeTab === 'map' ? '#0F172A' : '#94A3B8'} />
            <Text style={[styles.navLabel, activeTab === 'map' && styles.navLabelActive]}>Map</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reportNavButton}
            onPress={() => setActiveTab('report')}
            activeOpacity={0.8}
          >
            <PlusCircle size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('scorecard')}
            activeOpacity={0.7}
          >
            <BarChart3 size={20} color={activeTab === 'scorecard' ? '#0F172A' : '#94A3B8'} />
            <Text style={[styles.navLabel, activeTab === 'scorecard' && styles.navLabelActive]}>
              Scorecard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('profile')}
            activeOpacity={0.7}
          >
            <User size={20} color={activeTab === 'profile' ? '#0F172A' : '#94A3B8'} />
            <Text style={[styles.navLabel, activeTab === 'profile' && styles.navLabelActive]}>
              Profile
            </Text>
          </TouchableOpacity>
        </View>
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
  bottomNav: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 3,
  },
  navLabelActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  reportNavButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
});
