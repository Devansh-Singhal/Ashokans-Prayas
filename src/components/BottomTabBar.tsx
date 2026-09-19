import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BarChart3, Camera, Map, Newspaper, User } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

export type TabKey = 'feed' | 'map' | 'report' | 'ward' | 'profile';

const TABS: { key: TabKey; label: string; icon: typeof Newspaper }[] = [
  { key: 'feed', label: 'Feed', icon: Newspaper },
  { key: 'map', label: 'Map', icon: Map },
  { key: 'report', label: 'Report', icon: Camera },
  { key: 'ward', label: 'Ward', icon: BarChart3 },
  { key: 'profile', label: 'Profile', icon: User },
];

// Geometry from the Figma frame (bar-relative px).
const BAR_H = 80;
const OVERHANG = 20; // circle sticks out above the bar
const PAD = 12; // horizontal padding inside the bar (5 tabs need tighter gutters than 4)
const CIRCLE = 58;
const NOTCH_HALF = 45; // notch is 90 wide, 45 deep

const BAR_COLOR = '#0B1B2F';
const ACCENT = '#FF7A00';
const ICON_ACTIVE = '#0B1B2F';
const ICON_IDLE = '#FFFFFF';

function Icon({ Cmp, color }: { Cmp: typeof Newspaper; color: string }) {
  return <Cmp size={22} color={color} />;
}

// Bar outline (top radius 5, bottom radius 30) with a real notch cut out at cx.
function barPath(w: number, cx: number) {
  const l = cx - NOTCH_HALF;
  const r = cx + NOTCH_HALF;
  return [
    'M0 5C0 2.239 2.239 0 5 0',
    `H${l}`,
    `C${l + 6.84} 0 ${l + 8.715} 6.875 ${l + 10.999} 15.251`,
    `C${l + 14.559} 28.303 ${l + 19.112} 45 ${cx} 45`,
    `C${cx + 26.034} 45 ${cx + 30.68} 28.114 ${cx + 34.279} 15.03`,
    `C${cx + 36.556} 6.754 ${cx + 38.414} 0 ${r} 0`,
    `H${w - 5}C${w - 2.239} 0 ${w} 2.239 ${w} 5`,
    `V50C${w} 66.569 ${w - 13.431} 80 ${w - 30} 80`,
    'H30C13.431 80 0 66.569 0 50Z',
  ].join('');
}

type Props = {
  active: TabKey;
  onChange: (key: TabKey) => void;
};

export default function BottomTabBar({ active, onChange }: Props) {
  const [width, setWidth] = useState(0);
  const slot = (width - PAD * 2) / TABS.length;
  const activeIndex = TABS.findIndex((t) => t.key === active);
  const rawNotchX = PAD + slot * (activeIndex + 0.5);
  // Clamp so the notch never runs past the bar's rounded corners on the end tabs.
  const notchX = Math.min(Math.max(rawNotchX, NOTCH_HALF + 10), width - NOTCH_HALF - 10);

  return (
    <View style={styles.root} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Svg width={width} height={BAR_H} style={styles.bar}>
          <Path d={barPath(width, notchX)} fill={BAR_COLOR} />
        </Svg>
      )}
      {TABS.map(({ key, label, icon }) => {
        const isActive = key === active;
        return (
          <Pressable
            key={key}
            style={styles.tab}
            onPress={() => onChange(key)}
            accessibilityLabel={label}
            accessibilityState={{ selected: isActive }}
          >
            <View style={isActive ? styles.circle : styles.idle}>
              <Icon Cmp={icon} color={isActive ? ICON_ACTIVE : ICON_IDLE} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    height: BAR_H + OVERHANG,
    flexDirection: 'row',
    paddingHorizontal: PAD,
  },
  bar: {
    position: 'absolute',
    top: OVERHANG,
    left: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idle: {
    marginTop: OVERHANG + 21,
  },
});
