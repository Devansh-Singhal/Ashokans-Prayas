import { Tabs } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TabBar } from '@/components/TabBar';
import { COLORS } from '@/constants/colors';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.navDark,
            borderTopColor: COLORS.contentDark,
            borderTopWidth: 1,
            height: 80,
            paddingBottom: 8,
          },
          sceneStyle: {
            backgroundColor: COLORS.background,
          },
        }}
        tabBar={() => <TabBar />}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
          }}
        />
        <Tabs.Screen
          name="camera"
          options={{
            title: 'Camera',
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}
