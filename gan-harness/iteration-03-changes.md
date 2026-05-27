# Iteration 3 Changes

## What Was Built

### 1. Typographic Drama (HIGHEST PRIORITY)
- Page titles now use `clamp(2rem, 1.5rem + 2vw, 3rem)` with weight 800 and tight tracking (-0.03em)
- Added serif italic subtitle accent (`header-accent` class) using Crimson Pro for luxurious feel
- JetBrains Mono used for: kanban stats bar counts, badge counts, project tile labels, progress labels, status pills, settings URL input
- Section labels (list headers) now use small caps treatment: 0.7rem, uppercase, 0.12em tracking
- Empty state text now uses Crimson Pro italic at 1.25rem for atmospheric feel

### 2. Differentiated Views

**Kanban Board:**
- Each column has a unique tint gradient background (violet for Open, cyan for In Progress, green for Done)
- Cards inherit column accent color on left border (overridden by priority if set)
- Columns stretch to fill viewport via `min-height: calc(100vh - 280px)` and `align-items: stretch`
- "Add task" placeholder appears at bottom of each column on hover
- Added glassmorphic stats bar (pill-shaped) showing Open/In Progress/Done counts with colored indicator dots
- Badge counts are now tinted per column color

**Projects List:**
- Status pills with glow effect (active = green glow, archive = amber glow)
- Row hover slides in a violet left-border indicator via CSS transform animation
- Entity items use mono-font status pills for data clarity

**Contacts List:**
- 40px avatar circles with gradient backgrounds (6 color variants based on initial letter)
- Role/nickname subtitle shown below name in smaller type
- Cards display with proper info hierarchy

**Notes List:**
- Note preview text shown below title (2-line clamp)
- Items use flex-start alignment for varied-height appearance
- Larger padding per item for card-like feel

**Settings:**
- Form inputs have dark glass treatment (dark bg, backdrop-filter)
- Violet focus glow enhanced (box-shadow: 0 0 20px on focus)
- Section titles use consistent font treatment

### 3. Signature Glow-Line Heading on ALL Views
- Kanban Board: "BOARD" + "Command Center" subtitle
- Projects: "PROJEKTE" + "Planung und Fortschritt" subtitle
- Contacts: "KONTAKTE" + "Netzwerk und Verbindungen" subtitle
- Notes: "NOTIZEN" + "Gedanken festhalten" subtitle
- Settings: "EINSTELLUNGEN" (already had it)

All use the same `.page-header h2` class with:
- 4px violet-to-cyan gradient left border with glow
- Background wash gradient
- Responsive clamp sizing

### 4. Fill the Kanban Viewport
- Kanban columns now use `display: flex; flex-direction: column` with `flex: 1` on column body
- Grid uses `align-items: stretch` instead of `start`
- `min-height: calc(100vh - 280px)` ensures columns fill the viewport
- "Add task" placeholder at bottom of each column (opacity 0, fades in on column hover)
- Stats bar provides information density in the header area

## Files Modified
- `src/styles/global.css` — primary styling overhaul
- `src/components/kanban/KanbanBoard.tsx` — page header, stats bar, onAdd prop
- `src/components/kanban/KanbanColumn.tsx` — add placeholder, onAdd prop
- `src/components/projects/ProjectsPage.tsx` — page header wrapper
- `src/components/projects/ProjectsList.tsx` — status pills
- `src/components/contacts/ContactsPage.tsx` — page header wrapper
- `src/components/contacts/ContactsList.tsx` — avatar circles
- `src/components/notes/NotesPage.tsx` — page header wrapper
- `src/components/notes/NotesList.tsx` — note preview text
