import { usePathname, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/colors';

import BottomTabBar, { TabKey } from './BottomTabBar';

const PATH_TO_KEY: Record<string, TabKey> = {
  '/': 'feed',
  '/map': 'map',
  '/report': 'report',
  '/scorecard': 'ward',
  '/profile': 'profile',
};

const KEY_TO_PATH = {
  feed: '/',
  map: '/map',
  report: '/report',
  ward: '/scorecard',
  profile: '/profile',
} as const;

export function TabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const active = PATH_TO_KEY[pathname] ?? 'feed';

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {insets.bottom > 0 && (
        <View style={[styles.insetFill, { height: insets.bottom }]} />
      )}
      <BottomTabBar
        active={active}
        // navigate (not push) so tapping tabs never stacks history
        onChange={(key) => router.navigate(KEY_TO_PATH[key])}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    // Transparent so the carved-out scoop in the navy bar stays open
    // (a solid fill here would paint over the notch and kill the curve).
    backgroundColor: 'transparent',
  },
  // Navy strip only behind the safe-area inset so no white gap shows
  // below the bar. The bar itself keeps its compact shape/height.
  insetFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.navDark,
  },
});
