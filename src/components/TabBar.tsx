import { usePathname, useRouter } from 'expo-router';
import { BarChart3, Camera, Map, Newspaper, User } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/colors';

const TABS = [
  { path: '/', label: 'Feed', icon: Newspaper },
  { path: '/map', label: 'Map', icon: Map },
  { path: '/report', label: 'Report', icon: Camera },
  { path: '/scorecard', label: 'Ward', icon: BarChart3 },
  { path: '/profile', label: 'Profile', icon: User },
] as const;

export function TabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || 8 }]}>
      {TABS.map((tab) => {
        const isFocused = pathname === tab.path;
        const IconComponent = tab.icon;

        return (
          <Pressable
            key={tab.path}
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={tab.label}
            // navigate (not push) so tapping tabs never stacks history
            onPress={() => router.navigate(tab.path)}
            style={styles.tabItem}
          >
            <View style={[styles.iconContainer, isFocused && styles.iconContainerActive]}>
              <IconComponent size={22} color={isFocused ? COLORS.onOrange : COLORS.white} />
            </View>
            <Text numberOfLines={1} style={[styles.label, isFocused && styles.labelActive]}>
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
    backgroundColor: COLORS.navDark,
    borderTopWidth: 1,
    borderTopColor: COLORS.contentDark,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.contentDark,
  },
  iconContainerActive: {
    backgroundColor: COLORS.orange,
  },
  label: {
    fontSize: 11,
    color: COLORS.white,
    marginTop: 4,
    fontWeight: '500',
  },
  labelActive: {
    color: COLORS.amber,
    fontWeight: '700',
  },
});
