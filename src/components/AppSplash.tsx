import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { Animated, Image, StyleSheet } from 'react-native';

import { COLORS } from '@/constants/colors';

// Must run at module scope, before the native splash would otherwise auto-hide.
SplashScreen.preventAutoHideAsync().catch(() => {});

const MIN_VISIBLE_MS = 3400;
const FADE_MS = 400;

// expo-router hides the native splash itself, on the animation frame after its
// navigation container reports ready - about one frame after mount, regardless
// of expo-splash-screen's own preventAutoHideAsync/hideAsync calls (it uses a
// separate internal prevent/hide pair). So the native splash can't be held
// open for multiple seconds; this JS overlay is what actually holds the
// screen, reproducing the same background + logo so the native hide is
// invisible underneath it, then cross-fading out on its own timer.
export const AppSplash: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hidden, setHidden] = useState(false);
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().finally(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: FADE_MS,
          useNativeDriver: true,
        }).start(() => setHidden(true));
      });
    }, MIN_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [opacity]);

  return (
    <>
      {children}
      {!hidden && (
        <Animated.View style={[styles.overlay, { opacity }]} pointerEvents="none">
          <Image
            source={require('../../assets/images/splash-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    // Forces this above any sibling that sets its own elevation (e.g. the
    // tab bar's shadow), which would otherwise punch through the overlay on
    // Android regardless of mount order.
    zIndex: 9999,
    elevation: 9999,
  },
  logo: {
    width: 180,
    height: 180,
  },
});
