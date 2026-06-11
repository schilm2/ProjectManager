# Iteration 01 - Glassmorphism Foundation

## What Was Changed

### 1. Complete `global.css` Redesign (1500 lines rewritten)

**Design System Tokens:**
- Background: rich dark gradient `#0a0814` to `#12082a` with atmospheric radial light sources (subtle violet top-left, cyan bottom-right)
- Glass tokens: `--glass-bg`, `--glass-bg-hover`, `--glass-bg-active`, `--glass-border`, `--glass-border-hover`, `--glass-shadow`, `--glass-blur`, `--glass-blur-heavy`
- Accent palette: violet `#8b5cf6` with hover/muted/glow variants, cyan `#06b6d4` with similar variants
- All text tokens adapted for dark theme (white at varying opacities: 92%, 50%, 30%)
- Semantic colors updated: danger `#f43f5e`, success `#10b981`, warning `#f59e0b`
- Larger radius values for glass panels: `--radius-lg: 20px`, `--radius-xl: 28px`
- Custom transition tokens for consistent motion: `--ease-out`, `--ease-spring`

**Body/Background:**
- Deep indigo base with two radial gradient light sources creating atmospheric depth
- Fixed background attachment so content scrolls over the gradient

**Sidebar - Frosted Glass Panel:**
- `backdrop-filter: blur(32px)` with transparent dark background
- Subtle gradient overlay (violet top to cyan bottom, very low opacity)
- Navigation items: glass hover states, active state with violet glow + box-shadow
- Brand title: gradient text (violet to cyan) using `-webkit-background-clip: text`

**Kanban Board - Full Glass Treatment:**
- Columns: glass background with blur, subtle borders, hover box-shadow
- Column headers: gradient accent lines (violet for Open, cyan for In Progress, green for Done) with glow shadows
- Cards: secondary glass layer (lighter blur), hover lifts with depth shadow
- Priority badges: glowing colored pills with subtle box-shadows
- Card actions: hidden by default, fade in on hover (progressive disclosure)
- Drag-over state: violet-tinted with dashed violet outline

**Dialogs:**
- Dark glass modal (`rgba(20, 12, 48, 0.85)` with heavy blur)
- Entrance animation: scale + fade with spring easing
- Focus rings: violet glow on inputs
- Select dropdowns styled for dark theme

**All Other Views Themed:**
- Notes page: glass panels, violet active states
- Split pages (Projects/Contacts): glass detail panels
- Settings: glass cards, glowing status dots, violet selected model outline
- Progress bars: updated to violet/cyan/green
- Priority dots: subtle glow effect

**Quality of Life:**
- Custom scrollbar styling (thin, subtle)
- Custom text selection color (violet)
- Consistent hover/focus transitions throughout

### 2. CircleAccent Component Update
- Changed SVG stroke from red `#D30800` to violet `#8b5cf6` to match new palette

### 3. Font Loading
- Added JetBrains Mono to Google Fonts import for code blocks

## Files Modified
- `src/styles/global.css` - Complete rewrite
- `src/components/ui/CircleAccent.tsx` - Stroke color update
- `index.html` - Font import update

## Design Philosophy
The app now looks like a command center at night - deep atmospheric background with floating glass panels. Depth is created through:
1. Multiple blur levels (8px cards, 20px panels, 32px sidebar)
2. Opacity-based layering (3% base, 6% hover, 8% active)
3. Accent glows on interactive elements (not decorative, tied to state)
4. Progressive disclosure (card actions hidden until hover)
