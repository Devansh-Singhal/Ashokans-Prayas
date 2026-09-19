import { useRouter, useSegments } from 'expo-router';
import { Home, Search, Camera, Settings } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';

const TABS = [
  { name: 'index', label: 'Home', icon: Home },
  { name: 'search', label: 'Search', icon: Search },
  { name: 'camera', label: 'Camera', icon: Camera },
  { name: 'settings', label: 'Settings', icon: Settings },
];

export function TabBar() {
  const router = useRouter();
  const segments = useSegments();

  // Get the current tab by checking the last segment
  const currentTab = segments[segments.length - 1] || 'index';

  const handleTabPress = (tabName: string) => {
    if (tabName === 'index') {
      router.push('/');
    } else {
      router.push(`/${tabName}` as any);
    }
  };

  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isFocused = currentTab === tab.name;
        const IconComponent = tab.icon;

        return (
          <Pressable
            key={tab.name}
            onPress={() => handleTabPress(tab.name)}
            style={styles.tabItem}
          >
            <View
              style={[
                styles.iconContainer,
                isFocused && styles.iconContainerActive,
              ]}
            >
              <IconComponent
                size={24}
                color={isFocused ? COLORS.white : COLORS.lightGray}
              />
            </View>
            <Text
              style={[
                styles.label,
                isFocused && styles.labelActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 80,
    backgroundColor: COLORS.navDark,
    borderTopWidth: 1,
    borderTopColor: COLORS.contentDark,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.contentDark,
  },
  iconContainerActive: {
    backgroundColor: COLORS.orange,
  },
  label: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginTop: 4,
    fontWeight: '500',
  },
  labelActive: {
    color: COLORS.orange,
    fontWeight: '600',
  },
});
