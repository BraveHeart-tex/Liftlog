---
name: LiftLog
description: A calm, high-performance native interface for frictionless workout logging.
colors:
  ignition-orange: '#FF4D00'
  forged-carbon: '#1A1917'
  chalk-canvas: '#F2EDE8'
  steel-plate: '#252422'
  chalk-white: '#F0ECE8'
  clean-white: '#FFFFFF'
  lifted-graphite: '#2E2C2A'
  warm-ink: '#1A1512'
  paper-white: '#FAFAF8'
  rack-gray: '#3D3B38'
  chalk-stone: '#EDE8E2'
  steel-dust: '#C5BFB8'
  dark-steel: '#3A3330'
  muted-ash: '#8A8580'
  muted-clay: '#6B6460'
  chalk-edge: '#DDD8D2'
  rep-green: '#34C76A'
  rep-green-deep: '#1F9E4A'
  timer-amber: '#F5A623'
  timer-ochre: '#B06A00'
  failure-red: '#E8294A'
  failure-crimson: '#C41535'
  rest-blue: '#4DB8FF'
  rest-blue-deep: '#0070C0'
  steady-stone: '#7A7570'
  steady-ash: '#8E8A85'
  drop-orange: '#FF7B2E'
  drop-ember: '#C93A00'
typography:
  display:
    fontFamily: 'Inter, system-ui, sans-serif'
    fontSize: '28px'
    fontWeight: 700
  headline:
    fontFamily: 'Inter, system-ui, sans-serif'
    fontSize: '24px'
    fontWeight: 600
  title:
    fontFamily: 'Inter, system-ui, sans-serif'
    fontSize: '19px'
    fontWeight: 500
  body:
    fontFamily: 'Inter, system-ui, sans-serif'
    fontSize: '15px'
    fontWeight: 400
  body-medium:
    fontFamily: 'Inter, system-ui, sans-serif'
    fontSize: '15px'
    fontWeight: 500
  label:
    fontFamily: 'Inter, system-ui, sans-serif'
    fontSize: '13px'
    fontWeight: 400
  caption:
    fontFamily: 'Inter, system-ui, sans-serif'
    fontSize: '12px'
    fontWeight: 500
  overline:
    fontFamily: 'Inter, system-ui, sans-serif'
    fontSize: '12px'
    fontWeight: 500
    letterSpacing: '0.05em'
rounded:
  sm: '8px'
  md: '12px'
  lg: '16px'
  xl: '20px'
  pill: '9999px'
spacing:
  '1': '4px'
  '2': '8px'
  '3': '12px'
  '4': '16px'
  '5': '20px'
  '6': '24px'
  '8': '32px'
  '10': '40px'
components:
  button-primary:
    backgroundColor: '{colors.ignition-orange}'
    textColor: '{colors.clean-white}'
    typography: '{typography.body-medium}'
    rounded: '{rounded.lg}'
    padding: '12px 16px'
    height: '48px'
  button-secondary:
    backgroundColor: '{colors.steel-plate}'
    textColor: '{colors.chalk-white}'
    typography: '{typography.body-medium}'
    rounded: '{rounded.lg}'
    padding: '12px 16px'
    height: '48px'
  input:
    backgroundColor: '{colors.steel-plate}'
    textColor: '{colors.chalk-white}'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: '12px 16px'
    height: '48px'
  card:
    backgroundColor: '{colors.steel-plate}'
    textColor: '{colors.chalk-white}'
    rounded: '{rounded.md}'
    padding: '16px'
  chip-selected:
    backgroundColor: '{colors.ignition-orange}'
    textColor: '{colors.clean-white}'
    typography: '{typography.label}'
    rounded: '{rounded.pill}'
    padding: '12px 16px'
    height: '44px'
  chip-unselected:
    backgroundColor: '{colors.forged-carbon}'
    textColor: '{colors.muted-ash}'
    typography: '{typography.label}'
    rounded: '{rounded.pill}'
    padding: '12px 16px'
    height: '44px'
---

# Design System: LiftLog

## Overview

**Creative North Star: "The Focused Training Floor"**

LiftLog is a calm, distraction-free environment for serious training. Its visual system behaves like premium gym equipment: dependable, responsive, and purpose-built. Warm industrial neutrals create a quiet field while Ignition Orange marks decisive action, active state, and progress.

Polish reinforces momentum, confidence, and fast decision-making rather than entertainment. The interface stays tactile and athletic without becoming loud; it is restrained enough to disappear during a set and precise enough to earn trust under repeated use.

**Key Characteristics:**

- Focused, tactile, athletic, calm, and confident.
- Structurally flat, with depth carried by tone, contrast, spacing, and borders.
- Compact enough for fast operation, but never cramped or fragile.
- Responsive motion and feedback that confirm action without delaying it.
- Native-aware behavior shared coherently across iOS and Android.

## Colors

The palette pairs warm, material neutrals with a single high-energy orange signal and restrained semantic colors for workout feedback.

### Primary

- **Ignition Orange:** The sole brand accent and primary action signal. Use it for decisive actions, selected controls, focus, active navigation, and high-value progress cues.

### Secondary

- **Rep Green / Rep Green Deep:** Successful completion and upward progress in dark and light appearances.
- **Timer Amber / Timer Ochre:** Caution and time-sensitive states in dark and light appearances.
- **Failure Red / Failure Crimson:** Destructive actions, validation failures, and downward or failed states.
- **Rest Blue / Rest Blue Deep:** Informational and rest-timer states.
- **Steady Stone / Steady Ash:** Unchanged progress and neutral comparisons.
- **Drop Orange / Drop Ember:** Downward progress where a warmer signal is more useful than a destructive red.

### Neutral

- **Forged Carbon / Chalk Canvas:** The dark and light screen grounds.
- **Chalk White / Warm Ink:** The primary text colors for dark and light appearances.
- **Steel Plate / Clean White:** The standard card and input surfaces.
- **Lifted Graphite / Paper White:** Popovers and temporarily raised surfaces.
- **Rack Gray / Chalk Stone:** Secondary fills, muted controls, and grouped regions.
- **Steel Dust / Dark Steel:** Secondary foreground colors with stronger presence than muted text.
- **Muted Ash / Muted Clay:** Supporting labels, metadata, and inactive navigation.
- **Rack Gray / Chalk Edge:** Dark and light separators and subtle component borders.

### Named Rules

**The Orange Is Action Rule.** Ignition Orange must communicate action, selection, focus, or meaningful progress; it is not ambient decoration.

**The Tonal Structure Rule.** Separate hierarchy with warm surface steps and subtle borders before reaching for shadow.

## Typography

**Display Font:** Inter (with the native system sans-serif fallback)  
**Body Font:** Inter (with the native system sans-serif fallback)  
**Label Font:** Inter (with the native system sans-serif fallback)

**Character:** Inter keeps the interface compact, legible, and neutral under repeated active use. Weight changes establish hierarchy; the system avoids decorative display typography.

### Hierarchy

- **Display** (700, 28px): Top-level screen titles and the strongest ordinary hierarchy.
- **Headline** (600, 24px): Major section and empty-state headings.
- **Title** (500, 19px): Sheet titles, card headings, and local task context.
- **Body** (400, 15px): Instructions, values, descriptions, and standard content.
- **Body Medium** (500, 15px): Buttons, selected controls, and emphasized operational text.
- **Label** (400, 13px): Metadata, supporting labels, and dense list information.
- **Caption** (500, 12px): Compact status, hints, and tertiary information.
- **Overline** (500, 12px, 0.05em tracking): Rare uppercase section markers.

Large timer and step values are specialized instrument readouts, not additions to the general type hierarchy.

### Named Rules

**The Instrument Readout Rule.** Oversized numerals belong only to live measurements such as elapsed time, countdowns, or step totals.

**The Weight Before Size Rule.** Prefer an established weight or role before inventing a new text size.

## Layout

LiftLog uses a four-point spacing rhythm with 16px screen gutters. The most common internal gaps are 8px, 12px, and 16px; top-level screens generally open with 24px vertical breathing room. Dense workout rows stay compact, while primary actions retain at least 44px on iOS and 48px on Android wherever the implementation can preserve both platform targets.

Screens, fixed footers, sheets, and the bottom navigation honor safe-area and keyboard insets. The compact layout is portrait-first, while supported tablet widths must gain breathing room or an appropriate platform navigation treatment rather than stretching phone composition unchanged.

The bottom navigation has three destinations and a 66px visual bar before safe-area padding. Android receives additional bottom clearance, while all platforms keep active targets centered and thumb-reachable.

**The Training-Reach Rule.** Primary workout actions live where they are easy to reach one-handed and never depend on precision tapping.

**The Four-Point Rhythm Rule.** New spacing should resolve to the existing four-point cadence unless a native inset or measured control requires otherwise.

## Elevation & Depth

LiftLog is structurally flat. Tonal surfaces, contrast, spacing, and quiet borders carry hierarchy. Shadows are sparse and reserved for genuinely elevated elements such as snackbars, dialogs, bottom sheets, floating actions, and switch thumbs; ordinary cards and controls remain flat at rest.

### Shadow Vocabulary

- **Transient Float:** A restrained large shadow used by snackbars while they sit above the active screen.
- **Control Lift:** A small, tight shadow under the switch thumb to separate it from its track.

### Named Rules

**The Flat Until Floating Rule.** If an element does not physically or behaviorally float above the current task, it does not receive a shadow.

## Shapes

Corners are controlled, ergonomic, and functional. Small details use 8px corners, standard fields and containers use 12px, action-heavy cards and buttons use 16px, and sheets use 20px top corners. The radius increases with surface scale without turning the interface soft or playful.

Pills are reserved for compact selections, filters, statuses, segmented choices, timer triggers, and active navigation. Large surfaces use restrained radii and never become oversized capsules.

**The Functional Curve Rule.** Curvature must support grip, grouping, state, or safe touch geometry; it is not decoration.

## Components

The component system is firm, tactile, and purpose-built. Controls communicate reliability and precision while staying comfortable during active training.

### Buttons

- **Shape:** Controlled 16px corners with a one-pixel border.
- **Primary:** Ignition Orange with Chalk White text; 48px standard height, with 44px compact and 56px large options.
- **Secondary:** Steel Plate or Clean White surface with a subtle theme border and primary text.
- **Ghost:** Transparent surface for low-emphasis actions.
- **Destructive:** Tinted failure surface and border with semantic red text.
- **State:** Presses reduce opacity and scale toward 0.97 after a short touch delay; disabled and loading states block duplicate action and visibly reduce emphasis.

### Chips

- **Style:** Compact 44px controls, usually pill-shaped, with 16px horizontal padding.
- **State:** Selected chips fill with Ignition Orange and switch to white text; unselected chips use a quiet tonal surface, border, and muted label.
- **Use:** Filters, compact choices, and selection—not general navigation or large actions.

### Cards / Containers

- **Corner Style:** Standard cards use 12px corners; interactive workout cards commonly use 16px.
- **Background:** Steel Plate in dark appearance and Clean White in light appearance.
- **Shadow Strategy:** Flat at rest; hierarchy comes from surface contrast and border.
- **Border:** A subtle one-pixel theme border.
- **Internal Padding:** Usually 16px, reduced to 12px for dense workout controls.

### Inputs / Fields

- **Style:** Tonal field surface, subtle border, 12px corners, and 48px standard height.
- **Focus:** The border shifts to Ignition Orange without adding glow or layout movement.
- **Error / Disabled:** Errors use the failure border and caption; disabled fields reduce opacity and move text to the muted role.
- **Density:** A 44px compact option supports search and dense flows.

### Navigation

The three-item bottom navigation uses icon-and-label destinations on a flat card-colored surface. The active item turns Ignition Orange and receives a compact translucent orange pill behind the icon; inactive items use muted text. The indicator moves with a short, controlled spring and the bar expands for platform safe-area requirements.

### Segmented Controls

A tonal 12px track contains equal-width, minimum-44px targets. A quiet secondary indicator slides in 180ms; active labels use primary text while inactive labels stay muted.

### Bottom Sheets

Sheets use a Steel Plate or Clean White surface, 20px top corners, a short tonal drag handle, a strong dimmed backdrop, and safe-area-aware footers. Swipe dismissal remains available unless the task has a specific data-loss guard.

### Feedback

Snackbars float above navigation with a restrained shadow, border, and slim Ignition Orange status rail. Set-entry fields animate between neutral, valid, committed, and error tones; a successful save may use one brief spring pulse. Haptics reinforce selected high-value actions without becoming constant noise.

## Do's and Don'ts

### Do:

- **Do** keep the common workout action immediate, thumb-reachable, and visually obvious.
- **Do** use Ignition Orange only for action, selection, focus, or meaningful progress.
- **Do** establish hierarchy through warm tonal surfaces, spacing, and subtle borders.
- **Do** use short motion to confirm state changes while preserving a responsive feel.
- **Do** adapt navigation, insets, touch targets, and system behavior to iOS and Android conventions.
- **Do** keep advanced features visually subordinate until the user needs them.

### Don't:

- **Don't** use glossy fitness-marketing treatments, excessive gradients, glassmorphism, or neon palettes.
- **Don't** add gamified, achievement-heavy, or entertainment-first decoration.
- **Don't** turn every content group into an oversized card or every control into a pill.
- **Don't** add shadows to ordinary resting surfaces.
- **Don't** introduce generic corporate-wellness styling or lifestyle-brand imagery.
- **Don't** let animation delay input, obscure state, or compete with the workout.
