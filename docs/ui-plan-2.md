# CivicFeed UI Refinement - implementation specification

## Problem and outcome

The current Expo client works, but its visual language reads as a demo assembled from generic UI patterns: dark “stage demo” chrome, excessive pills, mixed color semantics, decorative sparkle/AI language, dense micro-labels, large rounded cards, and no shared design system. The goal is a credible, calm civic product that feels as intentional as a top consumer app while remaining recognizably about reporting, verifying, and tracking public defects.

The implementation should redesign the client information architecture and interaction model, not merely recolor existing styles. It must preserve the civic domain, typed API contracts, authentication/persona behavior, points and anti-collusion rules, GPS/geofence checks, report submission, map data, scorecard calculations, and verification outcomes. Copy, navigation labels, progressive disclosure, component composition, and visual treatment may change.

## Research basis and constraints

- Expo SDK `~57.0.24`, React Native `0.86.3`, Expo Router `~57.0.22`, React `19.2.3`; follow the exact v57 docs and existing package versions before adding anything.
- Google Material guidance: role-based color, type hierarchy, 4/8dp spacing rhythm, 48dp touch targets, structured accessibility, and motion that communicates state rather than decoration.
- Apple HIG: clarity, deference to content, depth used sparingly, platform typography/Dynamic Type, 44pt minimum targets, progressive disclosure, and native-feeling navigation.
- Spotify principles: relevant, human, unified; content-first surfaces, consistent tokens, and accessibility from the beginning.
- Duolingo lessons: clear next action, immediate understandable feedback, low friction, and purposeful reward loops-not random gamification.
- Expo v57 `expo-glass-effect`: `GlassView` is iOS 26+ only and falls back to `View`; do not make glass a core visual dependency. If used, use it only as an optional iOS enhancement and never behind critical content.
- Prefer the existing free/open-source stack (`lucide-react-native`, `react-native-svg`, `expo-image`, `expo-image-picker`, `expo-location`, `react-native-reanimated`, `expo-symbols`). Do not add a paid UI kit or a second icon system. Any new package must be free, actively maintained, Expo SDK 57-compatible, and justified in the implementation PR.

## Design direction

### Product character

“Civic utility with human warmth”: quiet, editorial, trustworthy, local, and action-oriented. The UI should let a resident answer three questions immediately:

1. What is happening near me?
2. What can I do next?
3. What changed because of community action?

Avoid visual references that make the app look AI-generated: purple gradients, sparkle icons, “AI-powered” badges, all-caps novelty microcopy, floating glass everywhere, excessive shadows, nested cards, perfect pill containers, emoji decoration, fake live indicators, and arbitrary neon status colors.

### Token layer (create a single source of truth)

Create `src/theme/tokens.ts` (or the repository’s chosen equivalent) exporting typed tokens and helpers. No screen should introduce one-off hex values after migration.

- **Color roles, not component colors**
  - `background`: warm near-white/light neutral, e.g. `#F7F7F5`
  - `surface`: `#FFFFFF`
  - `surfaceSubtle`: a slightly tinted neutral for grouped controls
  - `ink`: deep charcoal, not absolute black
  - `inkMuted`, `inkFaint`
  - `accent`: one civic blue/teal used for primary actions and selected navigation
  - `success`, `warning`, `danger`, `info`: reserved for semantic state only
  - `border`, `divider`, `scrim`
  - define light and dark-ready role names even if the first release remains light
- **Spacing**: 4, 8, 12, 16, 20, 24, 32, 40; use 8 as the primary rhythm and 4 for compact internals.
- **Shape**: default radius 10/12; large surfaces 16; circles only for avatars/icon containers. Do not use 20–32 radius on every element. Pills are reserved for compact filters/statuses that truly need a capsule.
- **Elevation**: one subtle surface shadow token and one modal shadow; prefer border + spacing over card shadows.
- **Typography**: use platform/system font through React Native defaults; define display, title, body, label, caption roles with weight/size/line-height. Body must remain legible at accessibility font scales; do not use 10–11px for essential content.
- **Motion**: short ease-out press feedback, 180–260ms expand/collapse, 250–400ms screen/content transitions; support reduced motion and never animate core meaning only through color.
- **Targets**: all controls at least 44x44pt (prefer 48 on Android); icon-only controls require accessible labels and visible pressed/focus states.

### Component primitives

Build or refactor shared primitives before screen work:

- `Screen`/`ScreenHeader` for safe area, title, subtitle, scroll insets, and consistent background.
- `Surface` with `variant="plain|raised|tinted"`; no arbitrary card recipes.
- `Button` with `primary|secondary|tertiary|destructive`, loading/disabled/pressed states, and full-width/compact sizes.
- `IconButton` with accessibility label and target-size enforcement.
- `SegmentedControl`/`FilterBar` for short mutually exclusive choices; selected state uses fill/underline, not a giant pill.
- `StatusLabel` for semantic states, with text always present; use a small dot only as reinforcement.
- `Metric`/`ProgressBar` with accessible value text.
- `EmptyState`, `ErrorState`, `LoadingState` with actionable recovery.
- `BottomSheet` or a clearly structured drawer for map detail and contextual actions.
- image wrapper with consistent aspect ratios, placeholder, loading, failure, and `expo-image` caching.

## Information architecture and screen specifications

### App shell (`src/app/index.tsx`, `src/app/_layout.tsx`)

- Replace the current tall dark demo bar + five equal tabs with a calm shell: compact top context/header, content viewport, and a native-feeling bottom tab bar.
- Primary destinations: **Home**, **Map**, **Report**, **Scorecard**, **Profile**. Keep labels explicit; icon-only navigation is not sufficient.
- Make Report a normal primary destination with a visually emphasized action, not a floating circular novelty button that obscures the tab rhythm.
- Move demo persona switching behind a clearly labeled “Demo mode” control in Profile or a development/demo-only entry point. It must remain available for the walkthrough, but never look like production content.
- Keep `AuthProvider`, `ParentConsentModal`, and tab state behavior. Ensure modals sit above the shell and respect safe-area insets.
- Status bar should use the light surface theme and platform-appropriate icon contrast; remove the current dark status strip.
- Add tab accessibility roles, selected state, labels, and testIDs.

### Home/feed (`src/screens/FeedScreen.tsx`, `CivicPostCard`, `CivicOnboardingCard`)

- Rename visible “Feed” concepts to “Nearby issues” or “Home” where appropriate. Lead with a concise header such as “Around Ward 14” and a small location/context line.
- Replace horizontal pill overload with a compact filter control: default “All issues” plus a filter button/sheet for categories. Preserve category filtering.
- Make the first viewport useful: one short explanatory sentence or dismissible onboarding row, then the first issue. Do not let onboarding dominate the feed.
- Redesign `CivicPostCard` as a content-first issue row/card:
  - photo first or strong thumbnail, category + status on one metadata line, human-readable location/time, concise issue title, and one primary next action;
  - put severity, GPS distance, points, and methodology behind secondary metadata or a disclosure row;
  - retain endorse, verify, share, before/after, weather pause, and anti-cheat flows;
  - replace “I Hit This Too!” with plain-language copy such as “I’m seeing this too” while retaining the escalation/points explanation;
  - reward feedback should be a small, non-blocking confirmation/toast, not a floating badge.
- Replace “How CivicFeed Works” with a three-step compact explainer that uses numbered rows and plain copy. Collapse/dismiss state remains.
- Replace `Sparkles` empty-state icon and “Spotless!” novelty copy with a neutral civic completion state, e.g. “No open issues in this filter” plus “Try another category” action.
- Loading and errors must have clear retry behavior; do not silently leave a blank screen.

### Map (`src/screens/MapScreen.tsx`, `InteractiveMap.tsx`)

- Treat the map as the spatial overview and the selected issue as a bottom sheet/drawer, not a stack of competing cards.
- Keep filter counts and selection, but use a compact segmented/filter control with clear selected state.
- Add an accessible list alternative (“View as list”) so map-only information is not inaccessible.
- Drawer hierarchy: issue title/category, status, photo, location/distance, one primary action, then secondary details. Remove redundant badge nesting.
- Use stable marker colors derived from semantic status/category roles; do not use a rainbow of unrelated colors.
- Ensure drawer actions have 44–48pt targets, do not clip above the tab bar, and work with dynamic type.

### Report (`src/screens/ReportScreen.tsx`)

- Make this a focused four-step flow: **Photo → Location → Review → Published**. Show progress as text/steps, not decorative progress pills.
- Primary capture action first; gallery is secondary. Demo samples move behind a “Try a sample” disclosure and are clearly marked as demo-only.
- Remove “DeepSeek 4.1 Vision Multi-Modal Ready”, sparkle icon, and other AI-forward copy. Say what the user needs to know: “Photo selected. We’ll classify the issue before publishing.”
- Make location a readable trust block: “Location attached” / “Location unavailable” with permission recovery. Never expose raw coordinates as the primary user-facing label.
- Review card must show image, inferred category, location, and the points consequence before submission.
- Submit button must be disabled until a photo is present, show progress during upload/classification, prevent duplicate submissions, and surface retryable errors inline.
- Success state should explain what happens next: “Report published to Ward 14” + points earned + “View in Nearby issues”.
- Preserve permissions and API behavior; improve the current silent location fallback and error copy without swallowing errors.

### Scorecard (`src/screens/ScorecardScreen.tsx`)

- Lead with a single understandable outcome: “Ward 14 cleanliness score” plus score, grade, and a one-sentence interpretation.
- De-emphasize the formula into an expandable “How this is calculated” disclosure. Keep exact math available for trust.
- Replace the dense colored grid and multiple ornamental cards with a vertical evidence narrative:
  1. score and trend/context,
  2. verified fixed/open counts,
  3. SLA performance,
  4. category resolution bars,
  5. citizen action CTA.
- Progress bars require visible percentages and accessible values; semantic color is supplementary.
- Retain exact scorecard API values and formulas; do not fabricate trend data if unavailable.

### Profile (`src/screens/ProfileScreen.tsx`)

- Use a compact identity header, then a clear points summary and civic-hours progress.
- Make credential/proof information a disclosure or secondary “Your civic record” section; avoid a large promotional blue card.
- Add settings/help/demo-mode entry points only if they have behavior behind them; no dead controls.
- Preserve current persona/user data and verified identity semantics.

### Modals and shared status (`AntiCheatModal`, `ParentConsentModal`, `StatusBadge`, `GeofencePill`, `SeverityMeter`, `BeforeAfterView`)

- Standardize modal presentation, title hierarchy, close behavior, scrim, safe area, and focus/accessibility announcements.
- Status labels use sentence case and concise user language: Reported, Fix uploaded, Verified, Paused by weather. Keep technical detail in supporting text.
- Geofence status should state the actionable result first (“You’re within 50 m” / “Move within 50 m to verify”), with distance secondary.
- Severity must pair level with plain-language label and not rely on color alone.
- Before/after control becomes an accessible two-option switch with “Reported” and “Repair photo”; overlay labels are short and not all-caps.
- Remove generic `Sparkles`/AI visual treatment and arbitrary green/amber/blue one-off styles throughout.

## Implementation sequence

1. Inventory current styles and create tokens/theme + primitive components; add no screen-specific redesign yet.
2. Refactor shell/navigation and move PersonaBar into a discoverable demo-only surface.
3. Refactor shared status/action/media primitives and modal styling.
4. Implement Home/feed information architecture and issue card.
5. Implement Report’s staged flow and robust loading/error/success states.
6. Implement Map drawer/list alternative and filters.
7. Implement Scorecard and Profile hierarchy.
8. Remove obsolete style constants, unused icons/imports, “AI slop” copy, and duplicated card/pill recipes.
9. Add or update targeted tests for component behavior and preserve existing API/e2e tests.
10. Validate on narrow and large phone widths, iOS/Android/web, light mode, large text, reduced motion, screen reader labels, offline/error states, and keyboard where applicable.

## Acceptance criteria

- No purple gradients, sparkle/AI badges, generic “pulse/live” copy, emoji decoration, or indiscriminate pill-shaped controls remain in production-facing UI.
- A single token system owns color, type, spacing, radius, elevation, and motion; no new raw style constants in screens.
- Every primary flow can be completed without understanding the demo/persona implementation.
- Existing report, endorse, verify, geofence, anti-cheat, parent-consent, map selection, scorecard, and profile data behavior remains functional.
- All interactive elements meet 44–48pt targets, have accessible labels/roles, and preserve meaning without color.
- Loading, empty, permission-denied, API-error, upload-error, and success states are explicit and recoverable.
- Dynamic type does not clip text or hide actions; content order matches visual order.
- `npm run lint` passes; existing standalone and backend tests pass; targeted UI tests cover the refactored interaction states.
- Manual review should show a calm, content-first civic utility rather than a generic AI dashboard or a collection of cards.

## Research references

- [Expo SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/)
- [Expo UI v57](https://docs.expo.dev/versions/v57.0.0/sdk/ui/)
- [Expo GlassEffect v57](https://docs.expo.dev/versions/v57.0.0/sdk/glass-effect/)
- [Material Design foundations](https://m3.material.io/foundations)
- [Material Design typography](https://m3.material.io/styles/typography)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Apple typography guidance](https://developer.apple.com/design/human-interface-guidelines/typography)
- [Spotify accessibility guidance](https://developer.spotify.com/documentation/accessibility)
- [Spotify design principles](https://principles.design/examples/spotify-design-principles)
- [Apple Developer: Behind the Design - Duolingo](https://developer.apple.com/news/?id=jhkvppla)
