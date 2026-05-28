## Mobile UX Expectations

The app should feel:

- fast
- responsive
- low friction
- readable
- mobile-native

Optimize for:

- thumb reachability
- quick scanning
- minimal typing
- predictable interactions
- large touch targets

Prefer:

- compact layouts
- clear hierarchy
- minimal cognitive load
- obvious actions
- fast interaction flows

Avoid:

- dense unreadable UI
- hidden actions
- excessive confirmation flows
- tiny touch targets
- deep navigation chains

## Data Display Rules

Workout and progress UI should emphasize:

- progression visibility
- compact readability
- fast scanning
- clear hierarchy

Prefer:

- concise workout summaries
- readable numeric formatting
- visible progress indicators
- lightweight presentation

Examples:

```txt id="1ubq2j"
60 × 8, 8, 7
+2 reps
+2.5 kg
```

Show:

- previous workout performance
- progress changes
- meaningful comparisons

Avoid:

- verbose labels
- oversized cards
- unnecessary explanatory text
- cluttered metric presentation

## Interaction Rules

Use `Pressable` for touch interactions.

Touch targets should generally be:

```txt id="zjz8t2"
p-3 or larger
```

Prefer:

- large tappable areas
- obvious interaction affordances
- simple flows
- predictable gestures

Avoid:

- nested touchables
- tiny hit areas
- overloaded gestures
- interaction ambiguity

Interactions should remain:

- immediate
- discoverable
- mobile-friendly

## Output Expectations for UI Code

Generated UI code should:

- be complete and working
- follow existing project patterns
- use semantic theme tokens
- use shared primitives
- work correctly on mobile screens
- support dark mode

Prefer:

- compact spacing
- reusable primitives
- predictable layout structure
- mobile-safe scrolling behavior

Use realistic workout or steps examples when sample data is required.

Avoid:

- web-centric layouts
- desktop assumptions
- placeholder-heavy mockups
- unnecessary visual complexity
