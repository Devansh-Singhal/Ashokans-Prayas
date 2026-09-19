import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { ParentConsentModal } from '@/components/ParentConsentModal';
import { PersonaBar } from '@/components/PersonaBar';
import { TabBar } from '@/components/TabBar';
import { COLORS } from '@/constants/colors';
import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SafeAreaView edges={['top']} style={styles.root}>
          <PersonaBar />
          <Tabs
            screenOptions={{
              headerShown: false,
              sceneStyle: { backgroundColor: COLORS.background },
            }}
            tabBar={() => <TabBar />}
          >
            <Tabs.Screen name="index" options={{ title: 'Feed' }} />
            <Tabs.Screen name="map" options={{ title: 'Map' }} />
            <Tabs.Screen name="report" options={{ title: 'Report' }} />
            <Tabs.Screen name="scorecard" options={{ title: 'Ward' }} />
            <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
          </Tabs>
          <ParentConsentModal />
        </SafeAreaView>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
