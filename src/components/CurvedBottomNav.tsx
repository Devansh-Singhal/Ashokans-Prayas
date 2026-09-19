import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Home, PieChart, Clock, Bell } from 'lucide-react-native';

export type NavTab = 'feed' | 'scorecard' | 'tasks' | 'profile';

interface Props {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

interface TabItem {
  key: NavTab;
  label: string;
  icon: typeof Home;
}

const TABS: TabItem[] = [
  { key: 'feed', label: 'Home', icon: Home },
  { key: 'scorecard', label: 'Analytics', icon: PieChart },
  { key: 'tasks', label: 'Activity', icon: Clock },
  { key: 'profile', label: 'Alerts', icon: Bell },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_MARGIN = 16;
const BAR_WIDTH = Math.min(SCREEN_WIDTH - HORIZONTAL_MARGIN * 2, 420);
const BAR_HEIGHT = 70;
const CORNER_RADIUS = 22;
const TAB_COUNT = TABS.length;
const TAB_WIDTH = BAR_WIDTH / TAB_COUNT;

// Notch & Circle dimensions
const CIRCLE_DIAMETER = 52;
const CIRCLE_RADIUS = CIRCLE_DIAMETER / 2;
const NOTCH_WIDTH = 38;
const NOTCH_DEPTH = 32;

function generateNotchPath(wTotal: number, hTotal: number, cx: number): string {
  const rCorner = CORNER_RADIUS;
  const p0X = cx - NOTCH_WIDTH;
  const p3X = cx + NOTCH_WIDTH;

  const c1X = p0X + 14;
  const c1Y = 0;
  const c2X = cx - 20;
  const c2Y = NOTCH_DEPTH;

  const c3X = cx + 20;
  const c3Y = NOTCH_DEPTH;
  const c4X = p3X - 14;
  const c4Y = 0;

  const parts: string[] = [];

  // Top-left start
  parts.push(`M ${rCorner} 0`);

  // Left flat edge
  if (p0X > rCorner) {
    parts.push(`L ${p0X} 0`);
  } else {
    parts.push(`L ${rCorner} 0`);
  }

  // Smooth S-curve down into scoop
  parts.push(`C ${c1X} ${c1Y}, ${c2X} ${c2Y}, ${cx} ${NOTCH_DEPTH}`);

  // Smooth S-curve up out of scoop
  parts.push(`C ${c3X} ${c3Y}, ${c4X} ${c4Y}, ${p3X} 0`);

  // Right flat edge
  if (p3X < wTotal - rCorner) {
    parts.push(`L ${wTotal - rCorner} 0`);
  }

  // Top-right corner
  parts.push(`Q ${wTotal} 0 ${wTotal} ${rCorner}`);

  // Right edge
  parts.push(`L ${wTotal} ${hTotal - rCorner}`);

  // Bottom-right corner
  parts.push(`Q ${wTotal} ${hTotal} ${wTotal - rCorner} ${hTotal}`);

  // Bottom edge
  parts.push(`L ${rCorner} ${hTotal}`);

  // Bottom-left corner
  parts.push(`Q 0 ${hTotal} 0 ${hTotal - rCorner}`);

  // Left edge
  parts.push(`L 0 ${rCorner}`);

  // Top-left corner
  parts.push(`Q 0 0 ${rCorner} 0`);

  parts.push('Z');
  return parts.join(' ');
}

export const CurvedBottomNav: React.FC<Props> = ({ activeTab, onTabChange }) => {
  const activeIndex = TABS.findIndex((t) => t.key === activeTab);
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;

  const animX = useRef(new Animated.Value(safeIndex * TAB_WIDTH)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Spring glide to new tab position
    Animated.parallel([
      Animated.spring(animX, {
        toValue: safeIndex * TAB_WIDTH,
        friction: 7,
        tension: 65,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.88,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [safeIndex]);

  const activeCenterX = (safeIndex + 0.5) * TAB_WIDTH;
  const notchPath = generateNotchPath(BAR_WIDTH, BAR_HEIGHT, activeCenterX);

  const ActiveIcon = TABS[safeIndex].icon;

  return (
    <View style={styles.outerContainer} pointerEvents="box-none">
      <View style={[styles.barWrapper, { width: BAR_WIDTH, height: BAR_HEIGHT }]}>
        {/* SVG Curved Notch Bar Background */}
        <Svg width={BAR_WIDTH} height={BAR_HEIGHT} style={StyleSheet.absoluteFill}>
          <Path d={notchPath} fill="#111215" />
        </Svg>

        {/* Floating Active Coral-Orange Circle Badge */}
        <Animated.View
          style={[
            styles.floatingCircle,
            {
              left: (TAB_WIDTH - CIRCLE_DIAMETER) / 2,
              transform: [{ translateX: animX }, { scale: scaleAnim }],
            },
          ]}
        >
          <ActiveIcon size={24} color="#FFFFFF" strokeWidth={2.2} />
        </Animated.View>

        {/* Interactive Tab Touch Targets */}
        <View style={styles.tabsRow}>
          {TABS.map((tab, idx) => {
            const isActive = idx === safeIndex;
            const TabIcon = tab.icon;

            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabItem}
                onPress={() => onTabChange(tab.key)}
                activeOpacity={0.7}
              >
                {/* Render inactive icon only when tab is not active */}
                {!isActive && (
                  <View style={styles.inactiveIconWrapper}>
                    <TabIcon size={23} color="#94A3B8" strokeWidth={1.8} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barWrapper: {
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  floatingCircle: {
    position: 'absolute',
    top: -14,
    width: CIRCLE_DIAMETER,
    height: CIRCLE_DIAMETER,
    borderRadius: CIRCLE_RADIUS,
    backgroundColor: '#FA6D38',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#FA6D38',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 5,
  },
  tabItem: {
    flex: 1,
    height: BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveIconWrapper: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
});
