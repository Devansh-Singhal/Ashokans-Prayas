import React from 'react';
import Svg, { Path, Circle, Rect, G, Line } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  fill?: string;
}

// 1. Minimalist Impact Flame Icon (Transparent background, geometric vector)
export const ImpactFlameIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#EA580C',
  fill = 'none',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
    <Path
      d="M12 2C8.5 6 6 9.5 6 13.5C6 17.09 8.91 20 12.5 20C16.09 20 19 17.09 19 13.5C19 9.5 15.5 5 12 2Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={fill === 'none' ? 'none' : fill}
    />
    <Path
      d="M12 12C10.5 13.5 10 15 10 16.5C10 17.88 11.12 19 12.5 19C13.88 19 15 17.88 15 16.5C15 15 13.5 13.5 12 12Z"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={fill !== 'none' ? color : 'none'}
    />
  </Svg>
);

// 2. Minimalist Monsoon Weather Occlusion Icon (Rain cloud + pause indicator)
export const MonsoonPauseIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#38BDF8',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17.5 14C19.43 14 21 12.43 21 10.5C21 8.65 19.57 7.13 17.75 7.01C17.2 4.14 14.7 2 11.67 2C9.25 2 7.14 3.39 6.2 5.45C4.38 5.75 3 7.33 3 9.25C3 11.32 4.68 13 6.75 13H17.5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line x1="8" y1="16" x2="8" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="12" y1="16" x2="12" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="16" y1="16" x2="16" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

// 3. Minimalist Road Pothole Defect Icon
export const PotholeDefectIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#EF4444',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2 12H7L9 16L12 10L15 17L17 12H22"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7 19C10 21 14 21 17 19"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Svg>
);

// 4. Minimalist Waste Accumulation Icon
export const WasteAccumulationIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#F59E0B',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6H21M19 6V20C19 21.1 18.1 22 17 22H7C5.9 22 5 21.1 5 20V6M8 6V4C8 2.9 8.9 2 10 2H14C15.1 2 16 2.9 16 4V6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line x1="10" y1="11" x2="10" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="14" y1="11" x2="14" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

// 5. Minimalist Streetlight Defect Icon
export const StreetlightDefectIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#EAB308',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 22V6C9 4 10 2 13 2H17C18.5 2 19 3 19 4.5V6H14"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M11 6H20L19 10H12L11 6Z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line x1="13" y1="13" x2="11" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Line x1="16" y1="13" x2="16" y2="17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Line x1="19" y1="13" x2="21" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

// 6. Minimalist Open Drain Hazard Icon
export const OpenDrainHazardIcon: React.FC<IconProps> = ({
  size = 18,
  color = '#0284C7',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x="3"
      y="4"
      width="18"
      height="16"
      rx="2"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Line x1="8" y1="4" x2="8" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="12" y1="4" x2="12" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="16" y1="4" x2="16" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

// 7. Minimalist Status Pulse Dot (No emojis)
export const StatusPulseDot: React.FC<{
  status: 'REPORTED' | 'PROVISIONAL_FIX' | 'RESOLVED' | 'WEATHER_OCCLUDED';
  size?: number;
}> = ({ status, size = 10 }) => {
  const getColor = () => {
    switch (status) {
      case 'REPORTED':
        return '#EF4444'; // Crimson
      case 'PROVISIONAL_FIX':
        return '#F59E0B'; // Amber
      case 'RESOLVED':
        return '#10B981'; // Emerald
      case 'WEATHER_OCCLUDED':
        return '#38BDF8'; // Sky Blue
      default:
        return '#94A3B8';
    }
  };

  const color = getColor();
  return (
    <Svg width={size + 6} height={size + 6} viewBox="0 0 16 16" fill="none">
      <Circle cx="8" cy="8" r="7" stroke={color} strokeWidth="1.5" opacity="0.35" />
      <Circle cx="8" cy="8" r="4.5" fill={color} />
    </Svg>
  );
};

// 8. Onboarding Step Icons (Minimalist vector glyphs)
export const StepSpotIcon: React.FC<IconProps> = ({ size = 24, color = '#38BDF8' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 19C23 20.1 22.1 21 21 21H3C1.9 21 1 20.1 1 19V8C1 6.9 1.9 6 3 6H7L9 3H15L17 6H21C22.1 6 23 6.9 23 8V19Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="2" />
  </Svg>
);

export const StepEscalateIcon: React.FC<IconProps> = ({ size = 24, color = '#F59E0B' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

export const StepAuditIcon: React.FC<IconProps> = ({ size = 24, color = '#10B981' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22S2 18 2 11V5L12 2L22 5V11C22 18 12 22 12 22Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 12L11 14L15 9"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
