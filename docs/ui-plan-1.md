# CivicFeed UI Refinement: From AI Slop to Professional Grade

Strip every generic AI fingerprint from the app and replace it with an intentional, crafted design system that could ship at a company like Linear, Vercel, or Stripe. This document is the complete spec - another model follows it line by line with zero ambiguity.

---

## Why This Needs to Happen

The current UI has **every classic AI-generated tell**:

| Tell | Where it shows up | Count |
|---|---|---|
| Purple accent (`#6558F5`, `#8D7BFF`) | `UI.violet`, Eyebrow, AccentButton, tab bar, filter pills, gradient avatars, accordion icons | **~30 usages** |
| `fontWeight: '900'` / `'800'` on everything | Every screen title, labels, badge text, stat values | **~45 usages** |
| `borderRadius: 9999` / `20` / `24` pill capsules | Filter chips, persona pills, tab bar, Surface, cards | **~20 usages** |
| Shimmer / wave text animation | FeedScreen hero title, CivicOnboardingCard title | **2 components** |
| Multi-hue gradient blobs | GradientAvatar `[violet, cyan, coral]` on every screen | **~6 usages** |
| Sparkles icon | FeedScreen empty state, ReportScreen AI tag | **2 usages** |
| `letterSpacing: 1.4` uppercase eyebrow in purple | Eyebrow component used on every screen | **5 usages** |
| Dark HUD block in light UI | ScorecardScreen score hero, MapScreen filter/drawer | **2 screens** |
| Gradient CTA buttons | AccentButton `[#6558F5, #8D7BFF]` | **1 component** |
| Floating protruding circle FAB | index.tsx report button with violet background | **1 usage** |

---

## Design Philosophy: "Civic Clarity"

Inspired by **Linear** (precision), **Stripe** (hierarchy), **Apple Health** (data density), and **Duolingo** (playful-but-never-cheap gamification).

**Three rules every decision below follows:**

1. **Every element earns its space.** If it doesn't inform or enable action, cut it.
2. **Depth through contrast, not decoration.** Use weight, size, and whitespace - not gradients, glows, or shimmer.
3. **Personality through restraint.** One custom font, one accent color, tight spacing. The brand lives in what you *don't* do.

---

## Phase 0: Design Foundation - New Design Token System

### 0A. Install Custom Typography

**Font:** `DM Sans` (Google Fonts) - geometric, warm, high x-height, excellent mobile legibility. Not Inter (too common/AI-coded). Not system font (no identity).

**Steps:**
1. Run `npx expo install @expo-google-fonts/dm-sans expo-splash-screen`
2. Download static weight files: `DMSans-Regular.ttf`, `DMSans-Medium.ttf`, `DMSans-SemiBold.ttf`, `DMSans-Bold.ttf`
3. Place them in `assets/fonts/`
4. Add to `app.json` plugins:
```json
["expo-font", { "fonts": ["./assets/fonts/DMSans-Regular.ttf", "./assets/fonts/DMSans-Medium.ttf", "./assets/fonts/DMSans-SemiBold.ttf", "./assets/fonts/DMSans-Bold.ttf"] }]
```
5. In `_layout.tsx`, load fonts using `useFonts` hook with `expo-splash-screen` to prevent FOUT (flash of unstyled text):
```tsx
import { useFonts, DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({ DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold });
  useEffect(() => { if (loaded) SplashScreen.hideAsync(); }, [loaded]);
  if (!loaded) return null;
  // ... rest of layout
}
```

### 0B. New Color Palette

Replace the entire `UI` object in `CivicUi.tsx`. The new palette is warm, civic, and has zero purple.

```typescript
export const UI = {
  // Neutrals (warm-toned, not blue-gray)
  ink:       '#1A1D26',   // Primary text - near-black with warm undertone
  secondary: '#4A4F5C',   // Secondary text
  muted:     '#7C818D',   // Tertiary/caption text  
  subtle:    '#A8ACB5',   // Disabled/placeholder text
  
  // Surfaces
  canvas:    '#F5F5F0',   // App background - warm off-white (NOT blue-tinted #F4F6FB)
  card:      '#FFFFFF',   // Card/elevated surfaces
  sunken:    '#EDEDEA',   // Inset/recessed areas (input backgrounds, dividers)
  line:      '#E0E0DB',   // Borders - warm gray
  
  // Brand
  brand:     '#1B6B4A',   // Primary action - deep forest green (civic, trustworthy, NOT violet)
  brandSoft: '#E8F3ED',   // Light brand tint for backgrounds
  brandHover:'#155A3E',   // Pressed state
  
  // Semantic
  positive:  '#2D8B57',   // Success/resolved  
  warning:   '#C97A2E',   // Amber/pending - muted, not neon #F59E0B
  danger:    '#C14B3E',   // Error/critical - muted, not neon #EF4444
  info:      '#3574A5',   // Informational blue - muted, not electric
  
  // Functional
  endorseActive: '#CC5E28',  // Endorsement flame when activated (warm orange)
  endorseIdle:   '#7C818D',  // Endorsement flame when idle
};
```

> [!IMPORTANT]
> **Every hardcoded hex in the codebase must be replaced** with a reference to this `UI` object. No file should contain a raw color literal after this refactor. This is the single biggest change and must be audited file-by-file.

### 0C. Spacing Scale (8pt Grid)

Create a new `spacing.ts` file in `src/shared/`:

```typescript
export const space = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
} as const;
```

Every `padding`, `margin`, `gap` value in the entire codebase must be replaced with a value from this scale. No more arbitrary `14`, `18`, `22`, `10` values.

### 0D. Typography Scale

Create `typography.ts` in `src/shared/`:

```typescript
const fontFamily = {
  regular:  'DMSans_400Regular',
  medium:   'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold:     'DMSans_700Bold',
} as const;

export const type = {
  // Display - big numbers, hero stats
  display: {
    fontFamily: fontFamily.bold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  // Title - screen titles
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  // Heading - section headings, card titles
  heading: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    lineHeight: 22,
  },
  // Subheading - emphasized body text
  subheading: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  // Body - standard text
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  // Caption - small metadata, labels
  caption: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  // Micro - badge text, tab labels
  micro: {
    fontFamily: fontFamily.semibold,
    fontSize: 11,
    lineHeight: 14,
  },
  // Eyebrow - section overlines (REPLACES the shimmer/purple eyebrow)
  eyebrow: {
    fontFamily: fontFamily.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
} as const;
```

> [!IMPORTANT]
> **No `fontWeight: '900'` anywhere.** The heaviest weight is `'700'` (Bold via `DMSans_700Bold`). No `fontWeight: '800'` either. The hierarchy is: `Regular (400)` → `Medium (500)` → `SemiBold (600)` → `Bold (700)`. That's it.

### 0E. Border Radius Scale

Create `radii.ts` in `src/shared/`:

```typescript
export const radii = {
  sm:   6,    // badges, tags, small chips
  md:   10,   // buttons, inputs, cards
  lg:   14,   // larger cards, modals
  xl:   18,   // bottom sheets
  full: 9999, // ONLY for circular avatars and status dots
} as const;
```

> [!CAUTION]
> **`borderRadius: 20`, `24`, `28` are BANNED.** Cards use `radii.md` (10) or `radii.lg` (14). Only circular avatars and tiny status indicator dots use `full`. The excessively rounded pill aesthetic is the single most visible AI tell.

### 0F. Shadow / Elevation System

Create `elevation.ts` in `src/shared/`:

```typescript
import { Platform } from 'react-native';

export const elevation = {
  none: {},
  sm: Platform.select({
    ios: {
      shadowColor: '#1A1D26',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
    },
    android: { elevation: 1 },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#1A1D26',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    android: { elevation: 2 },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#1A1D26',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
    },
    android: { elevation: 4 },
  }),
  modal: Platform.select({
    ios: {
      shadowColor: '#1A1D26',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
    android: { elevation: 8 },
  }),
} as const;
```

> [!NOTE]
> Shadow color uses `UI.ink` (`#1A1D26`), NOT pure `#000`. This produces warmer, more natural shadows. Shadow opacity is deliberately low - shadows should be felt, not seen.

### 0G. Animation Constants

Create `motion.ts` in `src/shared/`:

```typescript
export const motion = {
  // Subtle press feedback - snappy, no bounce
  press: {
    damping: 20,
    stiffness: 200,
    mass: 1,
  },
  // Gentle enter - for list items, cards appearing
  enter: {
    damping: 18,
    stiffness: 150,
    mass: 1,
  },
  // Timing durations
  duration: {
    fast:   150,
    normal: 250,
    slow:   400,
  },
  // Press scale value
  pressScale: 0.97,  // NOT 0.95 (too dramatic)
} as const;
```

---

## Phase 1: Kill AI Slop Components

### 1A. DELETE `ShimmerWaveText`

**File:** `src/components/ui/base/shimmer-wave-text/`

**Action:** Delete the entire directory. This is the #1 most obvious AI tell - a continuously animating gradient shimmer on normal text. No serious app does this.

**Replace with:** Plain `<Text>` using `type.title` or `type.heading` styles.

**Affected files:**
- `FeedScreen.tsx` - hero title "Ward 14 community" → plain `<Text style={type.title}>`
- `CivicOnboardingCard.tsx` - "How CivicFeed Works" → plain `<Text style={type.heading}>`

### 1B. REPLACE `GradientAvatar` with Initial Avatar

**File:** `src/components/ui/base/gradient-avatar/`

**Action:** Replace the multi-hue gradient blob with a simple, professional initial-based avatar.

**New component** `InitialAvatar.tsx` in `src/components/ui/`:

```tsx
import { View, Text, StyleSheet } from 'react-native';
import { UI } from '../CivicUi';
import { type } from '../../shared/typography';

interface Props {
  name: string;        // Extracts first letter
  size?: number;       // Default 40
  variant?: 'brand' | 'neutral' | 'warm';
}

const VARIANTS = {
  brand:   { bg: UI.brandSoft, text: UI.brand },
  neutral: { bg: UI.sunken,    text: UI.secondary },
  warm:    { bg: '#F5EDE4',    text: '#8B6E4E' },
};

export function InitialAvatar({ name, size = 40, variant = 'brand' }: Props) {
  const v = VARIANTS[variant];
  const fontSize = size * 0.4;
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, backgroundColor: v.bg }]}>
      <Text style={[{ fontSize, color: v.text, fontFamily: 'DMSans_600SemiBold' }]}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

**Search-and-replace** every `<GradientAvatar>` usage:
- `FeedScreen.tsx` hero → `<InitialAvatar name="W" size={40} variant="brand" />`
- `ProfileScreen.tsx` → `<InitialAvatar name={currentPersona.name} size={64} variant="brand" />`
- `ReportScreen.tsx` header → **Remove entirely**. Screen titles don't need avatars.
- `CivicPostCard.tsx` → `<InitialAvatar name="A" size={36} variant="neutral" />`
- `CivicOnboardingCard.tsx` → **Remove entirely**. Replace with the category icon.

### 1C. STRIP the `Eyebrow` Component

**File:** `CivicUi.tsx`

**Current:** Purple (`#6558F5`), `fontWeight: '800'`, `letterSpacing: 1.4`. Screams AI.

**Replace with:**

```tsx
export function Eyebrow({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return (
    <Text style={[{
      color: UI.muted,               // Gray, NOT brand color
      fontSize: 11,
      fontFamily: 'DMSans_600SemiBold',
      letterSpacing: 0.8,            // Reduced from 1.4
      textTransform: 'uppercase',
    }, style]}>
      {children}
    </Text>
  );
}
```

### 1D. STRIP the `AccentButton` Gradient

**Current:** `gradientColors={[UI.violet, '#8D7BFF']}` - purple gradient pill.

**Replace with:** Flat solid-color button using `UI.brand`:

```tsx
export function AccentButton({ children, onPress, width }: { children: string; onPress?: () => void; width?: number }) {
  return (
    <TouchableOpacity
      style={{
        backgroundColor: UI.brand,
        height: 48,
        borderRadius: radii.md,
        justifyContent: 'center',
        alignItems: 'center',
        width,
      }}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={{ color: '#FFFFFF', fontFamily: 'DMSans_600SemiBold', fontSize: 14 }}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}
```

### 1E. REMOVE `AnimatedThemeToggle` from Profile

**File:** `ProfileScreen.tsx`

The theme toggle does nothing (`onToggle={() => undefined}`). It's decorative AI fluff. Remove it entirely. The `profileToolbar` row can just show the "CIVIC IDENTITY" eyebrow text left-aligned.

### 1F. REMOVE `Sparkles` Icon Everywhere

**Files:** `FeedScreen.tsx`, `ReportScreen.tsx`

Replace with contextually appropriate Lucide icons:
- Feed empty state: `<Inbox size={32} color={UI.subtle} />` (from `lucide-react-native`)
- Report AI tag: Remove the "DeepSeek 4.1 Vision Multi-Modal Ready" tag entirely. This is marketing copy, not UI.

---

## Phase 2: Redesign the Tab Bar (index.tsx)

The current floating pill tab bar with protruding violet circle FAB is the most visible AI pattern.

### New Tab Bar Design

Inspired by Linear and Apple's standard tab approach - clean, docked, no floating gimmicks.

```tsx
// Bottom navigation - docked, not floating
const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    height: 56,                        // Standard 56pt
    backgroundColor: UI.card,
    borderTopWidth: 1,
    borderTopColor: UI.line,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 0 : 0,  // SafeArea handles this
    // NO borderRadius, NO marginHorizontal, NO floating effect
    // NO shadow (the border-top IS the separator)
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: space.sm,
  },
  navLabel: {
    ...type.micro,
    color: UI.subtle,
    marginTop: 2,
  },
  navLabelActive: {
    color: UI.brand,                   // Green, not violet
  },
});
```

**Report button:** NOT a protruding circle. It's a normal tab item with a `Plus` icon, same as all other tabs. Active state uses `UI.brand` color. Alternatively, if you want the Report tab to be visually distinct, give it a small filled circle background:

```tsx
// Report tab (slightly emphasized, but not protruding)
reportNavItem: {
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
},
reportIconContainer: {
  width: 40,
  height: 40,
  borderRadius: radii.md,              // 10, not fully round
  backgroundColor: UI.brand,
  justifyContent: 'center',
  alignItems: 'center',
},
```

**Tab icons:** Active = `UI.brand` (`#1B6B4A`). Inactive = `UI.subtle` (`#A8ACB5`).

---

## Phase 3: Screen-by-Screen Redesign

### 3A. FeedScreen

**Current problems:**
- Hero section with gradient avatar, shimmer text, "LIVE CIVIC PULSE" purple eyebrow, live-dot pill, hero stats - all feel like a marketing landing page, not an app screen
- Filter pills with `borderRadius: 20` and violet active state

**New design:**

1. **Remove the hero section entirely.** Feed screens in pro apps (Twitter/X, Instagram, LinkedIn) go straight to content. Replace with a minimal header:
```tsx
// Simple header
<View style={{ paddingHorizontal: space.base, paddingTop: space.md, paddingBottom: space.sm }}>
  <Text style={type.title}>Ward 14 Feed</Text>
  <Text style={[type.caption, { color: UI.muted, marginTop: space.xs }]}>
    {tickets.length} active reports
  </Text>
</View>
```

2. **Filter chips - redesign:**
```tsx
filterPill: {
  paddingHorizontal: space.md,
  paddingVertical: space.sm,
  borderRadius: radii.sm,             // 6, NOT 20
  backgroundColor: UI.card,
  borderWidth: 1,
  borderColor: UI.line,
},
filterPillActive: {
  backgroundColor: UI.ink,            // Dark, NOT violet
  borderColor: UI.ink,
},
filterText: {
  ...type.caption,
  color: UI.secondary,
},
filterTextActive: {
  color: '#FFFFFF',
},
```

3. **Remove the "LIVE" pill with green dot.** This is cosmetic, not functional.

4. **Hero stats** - If you want to keep them, move them into a thin inline bar below the filter pills, not a large block:
```tsx
<View style={{ flexDirection: 'row', paddingHorizontal: space.base, gap: space.lg, paddingVertical: space.sm }}>
  <Text style={[type.caption, { color: UI.muted }]}>{tickets.length} active</Text>
  <Text style={[type.caption, { color: UI.muted }]}>86% verified</Text>
  <Text style={[type.caption, { color: UI.muted }]}>48h avg response</Text>
</View>
```

### 3B. MapScreen

**Current problems:**
- Dark `#1E293B` filter bar and drawer inside a light-themed app - jarring
- `borderRadius: 9999` pill chips
- Inconsistent color mode (header is light, map controls are dark, drawer is dark)

**New design:**

1. **Unify to light mode.** Remove all `#0F172A`, `#1E293B`, `#334155` from MapScreen. Everything is on `UI.canvas` or `UI.card`.

2. **Filter chips - same style as FeedScreen** (reuse component). `borderRadius: radii.sm`, active state = `UI.ink` background.

3. **Bottom drawer:**
```tsx
drawerCard: {
  backgroundColor: UI.card,
  borderTopLeftRadius: radii.xl,       // 18
  borderTopRightRadius: radii.xl,
  borderTopWidth: 1,
  borderTopColor: UI.line,
  paddingHorizontal: space.lg,
  paddingTop: space.md,
  paddingBottom: Platform.OS === 'ios' ? space['3xl'] : space.xl,
  ...elevation.lg,
},
```

4. **Drawer handle:** `width: 32, height: 4, borderRadius: 2, backgroundColor: UI.line`

5. **Endorse button:**
```tsx
endorseButton: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: UI.endorseActive,   // #CC5E28
  paddingVertical: space.md,
  borderRadius: radii.md,              // 10
  minHeight: 48,
  gap: space.sm,
},
```

### 3C. ReportScreen

**Current problems:**
- Gradient avatar in header (removed per Phase 1)
- "DeepSeek 4.1 Vision Multi-Modal Ready" floating badge on photos - cringeworthy AI marketing
- "Analyzing with DeepSeek 4.1 Vision..." loading text

**New design:**

1. **Header - clean and simple:**
```tsx
<View style={{ paddingHorizontal: space.base, marginBottom: space.base }}>
  <Eyebrow>New report</Eyebrow>
  <Text style={[type.title, { marginTop: space.xs }]}>Report a hazard</Text>
  <Text style={[type.body, { color: UI.muted, marginTop: space.xs }]}>
    Capture a photo of the issue. It will be automatically classified.
  </Text>
</View>
```

2. **Remove the AI tag overlay on preview image entirely.** No "DeepSeek 4.1 Vision Multi-Modal Ready" badge. Users don't care what model classifies their photo.

3. **Loading state:** Change from "Analyzing with DeepSeek 4.1 Vision..." to simply "Submitting report..."

4. **Camera/Gallery buttons:**
```tsx
primaryCaptureBtn: {
  flex: 1,
  backgroundColor: UI.ink,
  borderRadius: radii.md,
  paddingVertical: space.lg,
  alignItems: 'center',
  minHeight: 104,                      // Slightly shorter than 120
},
```

5. **Submit button:**
```tsx
submitBtn: {
  backgroundColor: UI.brand,          // Green, not #0F172A
  borderRadius: radii.md,
  paddingVertical: space.base,
  alignItems: 'center',
  minHeight: 48,
},
```

### 3D. ScorecardScreen

**Current problems:**
- Dark `#0F172A` hero block in a light app - the most dramatic mismatch
- Glowing green terminal math equation (`#34D399` on `#0F172A`)
- Excessive `fontWeight: '900'` on the 44px score number
- Card-in-card-in-card nesting

**New design:**

1. **Score hero - light mode, clean:**
```tsx
scoreHero: {
  backgroundColor: UI.card,           // White, NOT dark
  borderRadius: radii.lg,
  padding: space.lg,
  borderWidth: 1,
  borderColor: UI.line,
  ...elevation.sm,
  marginBottom: space.base,
},
scoreNumber: {
  ...type.display,
  fontSize: 40,                        // Large but uses display weight (700), not 900
  color: UI.ink,
},
```

2. **Remove the "formula card" sub-card.** Move the formula explanation into a collapsible accordion or footnote - it shouldn't be prominent.

3. **Grade badge:**
```tsx
gradeBadge: {
  paddingHorizontal: space.md,
  paddingVertical: space.sm,
  borderRadius: radii.sm,             // 6, not 14
  borderWidth: 1,
},
```

4. **Category progress bars - keep but normalize colors** to `UI.brand` for all bars (single brand color, differentiated by the category icon/label, not the bar color). Or use muted semantic tones from the new palette.

### 3E. ProfileScreen

**Current problems:**
- GradientAvatar with violet/cyan palette
- "CIVIC IDENTITY" in purple with `letterSpacing: 1.2`
- Non-functional `AnimatedThemeToggle`
- `borderRadius: 20` on cards

**New design:**

1. **Replace gradient avatar** with `InitialAvatar` - `variant="brand"`, `size={64}`.
2. **Remove AnimatedThemeToggle.**
3. **Card styling:**
```tsx
profileHero: {
  alignItems: 'center',
  backgroundColor: UI.card,
  padding: space.xl,
  borderRadius: radii.lg,             // 14, not 20
  borderWidth: 1,
  borderColor: UI.line,
  marginBottom: space.base,
},
```

4. **"Civic Identity Verified" tag** - keep but restyle:
```tsx
verifiedTag: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: space.xs,
  backgroundColor: UI.brandSoft,
  paddingHorizontal: space.sm,
  paddingVertical: space.xs,
  borderRadius: radii.sm,
  marginTop: space.sm,
},
verifiedText: {
  color: UI.brand,
  ...type.micro,
},
```

5. **Progress bar fill** - use `UI.brand` instead of raw `#2563EB`.

---

## Phase 4: Component Refinement

### 4A. CivicPostCard

**Changes:**
- Replace `GradientAvatar` with `InitialAvatar`
- Card `borderRadius: 20` → `radii.lg` (14)
- `categoryBadge` `borderRadius: 8` → `radii.sm` (6)
- Remove `Sparkles` icon from the card entirely
- Endorse button: replace `backgroundColor: '#F8FAFC'` with `UI.sunken`, border color with `UI.line`
- `verifyButton` active: `backgroundColor: UI.brand` (not `#059669`)
- Modal `borderRadius: 20` → `radii.lg` (14)
- All `fontWeight: '800'` → `fontFamily: 'DMSans_700Bold'` with `fontWeight: undefined` (let the font file handle it)
- Replace inline color hex values with `UI.*` references

### 4B. CivicOnboardingCard

**Changes:**
- Remove `ShimmerWaveText` - use plain `<Text style={type.heading}>How CivicFeed Works</Text>`
- Remove `GradientAvatar` - use the Lucide `Info` icon or nothing
- Card `borderRadius: 18` → `radii.lg` (14)
- Points pills - tone down: `backgroundColor: UI.sunken` with `UI.secondary` text. Remove bright pastel gamification colors.
- Steps should feel informational, not gamified

### 4C. StatusBadge

Restyle to use the new semantic colors:
```tsx
const STATUS_STYLES = {
  REPORTED:        { bg: '#FDF0E7', text: UI.warning, label: 'Open' },
  PROVISIONAL_FIX: { bg: UI.brandSoft, text: UI.brand, label: 'Fix uploaded' },
  RESOLVED:        { bg: UI.brandSoft, text: UI.positive, label: 'Verified' },
};
```

Badge styling: `borderRadius: radii.sm`, `paddingHorizontal: space.sm`, `paddingVertical: 3`.

### 4D. GeofencePill

Replace pill shape with a flat status bar:
```tsx
borderRadius: radii.sm,  // 6, not round pill
```

### 4E. SeverityMeter

Keep functional but normalize colors to the new palette (`UI.positive`, `UI.warning`, `UI.danger`).

### 4F. PersonaBar

This is a demo-only component but should still look clean:
- `personaPill` `borderRadius: 20` → `radii.md` (10)
- Replace `UI.ink` (`#101326`) dark bar with a subtler `#2A2D38`
- Reduce `liveDot` from green pulsing circle to a simple subtle indicator

### 4G. Surface Component

```tsx
surface: {
  backgroundColor: UI.card,
  borderRadius: radii.lg,      // 14, not 24
  borderWidth: 1,
  borderColor: UI.line,
  ...elevation.sm,
},
```

### 4H. InteractiveMap

Replace all inline dark-mode colors (`#1E293B`, `#334155`, `#0F172A`) with `UI.*` light-mode equivalents. The map's visual area can remain dark (it's a map), but all overlaid UI should use the standard light palette.

### 4I. AntiCheatModal

- Modal `borderRadius: 20` → `radii.lg` (14)
- Replace all inline hex colors with `UI.*` tokens
- Confirm button: `backgroundColor: UI.brand` instead of `#0F172A`

### 4J. ParentConsentModal

Same treatment as AntiCheatModal - `radii.lg`, `UI.*` tokens, `UI.brand` button.

---

## Phase 5: Micro-Interaction Cleanup

### 5A. Press Feedback

Every `TouchableOpacity` that has `activeOpacity={0.7}` or `0.8` should be upgraded to use Reanimated spring scale:

```tsx
// Reusable hook or wrapper
const pressScale = useSharedValue(1);
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: pressScale.value }],
}));

// On press in/out:
pressScale.value = withSpring(motion.pressScale, motion.press); // 0.97
pressScale.value = withSpring(1, motion.press);
```

This replaces opacity dimming (which feels cheap) with a subtle physical scale (which feels premium). Apply to: all buttons, cards, tab items.

### 5B. List Item Stagger

When the feed loads, stagger card entries using `FadeIn.delay(index * 50).duration(motion.duration.normal)` from Reanimated. Keep it subtle - 250ms duration, 50ms stagger. No `SlideInDown` or dramatic slides.

### 5C. Tab Switch

Animate the active tab indicator (not a pill - just a 2px wide dot below the icon) with `withTiming(newPosition, { duration: motion.duration.fast })`.

---

## Phase 6: File Manifest - Complete Change List

### New Files to Create

| File | Purpose |
|---|---|
| `src/shared/spacing.ts` | 8pt grid spacing scale |
| `src/shared/typography.ts` | DM Sans type scale |
| `src/shared/radii.ts` | Border radius tokens |
| `src/shared/elevation.ts` | Shadow/elevation system |
| `src/shared/motion.ts` | Animation config constants |
| `src/components/ui/InitialAvatar.tsx` | Replace GradientAvatar |

### Files to Delete

| File | Reason |
|---|---|
| `src/components/ui/base/shimmer-wave-text/` (entire dir) | AI slop shimmer text |
| `src/components/ui/base/gradient-avatar/` (entire dir) | AI slop gradient blobs |
| `src/components/ui/micro-interactions/animated-theme-toggle/` (entire dir) | Non-functional decoration |

### Files to Modify

| File | Key Changes |
|---|---|
| `src/components/CivicUi.tsx` | New `UI` color palette, strip Eyebrow of purple + heavy weight, AccentButton flat |
| `src/app/_layout.tsx` | Add `useFonts` loader for DM Sans |
| `src/app/index.tsx` | Redesign tab bar - docked, not floating; green not violet; no protruding circle FAB |
| `src/screens/FeedScreen.tsx` | Remove hero section, remove ShimmerWaveText, remove GradientAvatar, restyle filter pills |
| `src/screens/MapScreen.tsx` | Unify to light mode, remove all dark-mode drawer/filter colors, restyle chips |
| `src/screens/ReportScreen.tsx` | Remove AI tag overlay, remove GradientAvatar, clean up submit flow |
| `src/screens/ScorecardScreen.tsx` | Score hero → light mode, remove terminal math, normalize all colors |
| `src/screens/ProfileScreen.tsx` | Replace GradientAvatar, remove AnimatedThemeToggle, tighten card radii |
| `src/components/CivicPostCard.tsx` | Replace GradientAvatar, normalize all colors/radii/weights |
| `src/components/CivicOnboardingCard.tsx` | Remove ShimmerWaveText, remove GradientAvatar, tone down gamification pills |
| `src/components/StatusBadge.tsx` | New semantic color mapping |
| `src/components/GeofencePill.tsx` | Reduce border radius |
| `src/components/SeverityMeter.tsx` | Use new palette colors |
| `src/components/PersonaBar.tsx` | Reduce pill radii, normalize colors |
| `src/components/InteractiveMap.tsx` | Replace dark inline colors with UI tokens |
| `src/components/AntiCheatModal.tsx` | Replace inline colors, radii, button styles |
| `src/components/ParentConsentModal.tsx` | Replace inline colors, radii, button styles |
| `src/components/BeforeAfterView.tsx` | Normalize colors to UI tokens |
| `src/components/ui/base/button/` | Remove gradient support, use flat solid colors |
| `src/components/ui/molecules/accordion/` | Replace iconColor `#6558F5` with `UI.secondary` |
| `app.json` | Add `expo-font` plugin with DM Sans font paths |
| `package.json` | Add `@expo-google-fonts/dm-sans` dependency |

---

## Verification Plan

### Automated
1. `npx tsc --noEmit` - TypeScript compiles with no errors
2. `npx expo lint` - No ESLint errors
3. `grep -r "6558F5\|8D7BFF\|#6558F5\|violet\|fontWeight.*900\|fontWeight.*800\|borderRadius.*20\|borderRadius.*24\|borderRadius.*9999\|ShimmerWaveText\|GradientAvatar\|Sparkles" src/` → **Zero results** (confirms all AI slop is purged)

### Manual
1. Run `npx expo start` and verify on a physical device via Expo Go
2. Walk through all 5 screens and confirm:
   - No purple anywhere
   - No shimmer/pulse animations on text
   - No gradient blobs
   - No excessively rounded pills
   - Tab bar is docked and flat
   - All text uses DM Sans
   - Cards feel sturdy with `radii.lg` (14px) corners
   - Spacing feels consistent (8pt grid)
   - Shadows are subtle and warm
3. Test all interactive flows: endorse, verify, report, persona switch
4. Verify PersonaBar modal, AntiCheatModal, and ParentConsentModal all render correctly with new styles
