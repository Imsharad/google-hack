Typography                                                                                      
                                                                                                  
  - Kill the system font stack. Ship Inter or SF Pro Display. One typeface, used with discipline  
  - Establish a strict type scale: 12 / 14 / 17 / 22 / 28 / 34 — no more random                   
  16px/18px/20px/24px scattered everywhere                                                        
  - Increase line-heights across the board. Current 24px on 16px body is tight. Go 26-28px. Let   
  text breathe                                                                                    
  - "Plaid x OpenClaw PoC" — remove all engineering jargon from the UI. Users don't care about    
  your stack                                                                                      
                                                                                                  
  Color System

  - Unify to ONE palette. Right now you have 3 competing identities: dark Home (#1e1e1e), light
  Insights (#FAFAFA), blue Chat (#2196F3). Pick one soul
  - Ditch Material Design blue (#2196F3). It screams "default Android." Replace with a signature
  brand color — a warm coral, deep indigo, or rich teal
  - Reduce to 1 accent + 3 semantic colors (success/warning/danger). Currently 8+ accent colors
  fighting each other
  - Soften the blacks. Replace #000, #222 with #1A1A2E or similar warm-dark. Pure black feels cold

  Layout & Spacing

  - Introduce an 8px grid system. Every margin, padding, gap = multiple of 8. Current spacing is
  chaotic (10, 12, 15, 20, 24, 30, 60px — no rhythm)
  - Max content width 480px centered on web for that premium mobile-first feel (like Monzo/Revolut
   web)
  - Card padding: 24px uniform. Current cards have inconsistent 12-16px padding — feels cramped
  - Add 40px+ section spacing between content blocks. Everything is too close together

  Cards & Surfaces

  - Reduce card border-radius from 16px to 20-24px. Rounder = friendlier = more Airbnb
  - Remove all hard borders (1px solid anything). Use only shadow for depth — 2 elevation levels
  max
  - Standardize shadow to one style: 0 2px 16px rgba(0,0,0,0.06). Current mix of 0.06/0.08 opacity
   with varying radii is noisy
  - Add subtle background tints to card types instead of left-border accents (e.g., warning card
  gets a barely-there warm wash rgba(251,140,0,0.04))

  Home Screen

  - Completely redesign. It looks like a debug panel, not a product. Kill the "Test Connection" /
  "Refresh Data" buttons
  - Replace with a single hero number: your balance or net burn this month, large and centered
  - Transaction list needs merchant logos (use Clearbit or initials-in-circle fallback), not raw
  text on dark tiles
  - Each transaction row: logo → name + date → amount, right-aligned. Single line. No colored
  backgrounds per item

  Insights Screen

  - "Ledger's Take" is great conceptually but the left-border treatment feels like a blockquote.
  Make it a full-bleed card with a gradient or illustration
  - SpendingGauge SVG is too small (150x100). Make it a hero element — 240px wide, centered, with
  animated fill on mount
  - Card actions ("View Details", "Cancel Sub") should be full-width bottom buttons, not tiny
  pills. Think Airbnb's "Reserve" button prominence
  - Add empty states with illustration + copy. Current loading spinner + "Analyzing finances..."
  is sterile

  Chat Screen

  - Bubbles feel dated. Drop the colored-bubble paradigm. Go for Airbnb-message-style:
  left-aligned for both, with subtle avatar/icon, and a thin divider between messages
  - Input bar redesign: rounded pill input spanning full width, send icon inside the input on the
  right (not a separate circle button)
  - "Ledger is thinking..." → animated 3-dot pulse, not a spinner + text. The spinner is the most
  un-designed element in the app
  - Inline card rendering in chat needs padding/margin parity with the Insights feed. Currently
  feels jammed in

  Motion & Delight

  - Add entrance animations. Cards should fade-up + scale on first load (staggered 50ms delay
  each). Zero animation currently
  - Gauge should animate from 0 to value on mount — satisfying and informative
  - Pull-to-refresh should have a branded animation (Airbnb uses their logo, you could use a small
   Ledger icon)
  - Tab transitions: cross-fade, not hard cut

  Navigation

  - Bottom tab bar needs a redesign. Add labels below icons. Current icon-only tabs are ambiguous
  - Active tab indicator: filled icon + bold label + subtle dot or underline. Not just a tint
  color change
  - Consider removing the tab bar entirely on Chat and going full-screen immersive with a back
  gesture

  Emotional Design

  - Time-of-day greeting is good — extend it. Morning = warm colors, evening = cooler tones.
  Subtle background gradient shift
  - Celebrate good behavior. If spending is in green zone, show confetti or a subtle checkmark
  animation. Current green badge is forgettable
  - "Roast" cards need personality. Add a small avatar/emoji for Ledger. Give the AI a face
  - Error states and empty states need illustrations, not raw text. Every edge case is a branding
  opportunity

  Consistency Tax

  - Centralize ALL colors into a single tokens.ts file. Current hardcoded hex values across 8+
  files is a maintenance nightmare and guarantees inconsistency
  - Create a <Card> base component with size variants (sm/md/lg) instead of repeating
  shadow/border-radius/padding in every file
  - Create a <Text> component with semantic variants (h1/h2/body/caption/label) replacing the
  current 5-variant ThemedText

  ---
  One-line summary: The bones are solid (card architecture, insight engine, chat). The skin needs
  a unified design language — one palette, one type scale, one spacing grid, one shadow, and a lot
   more whitespace and motion.