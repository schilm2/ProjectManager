# Design Brief: Glassmorphism Project Manager Dashboard

## Overview

Redesign the Project Manager app with a stunning glassmorphism visual identity. The app is a React/TypeScript SPA with the following views: Kanban board, Projects list, Contacts list, Notes list, and Settings. The primary goal is **visual excellence** — a design that could win a frontend design award.

## Current Tech Stack

- React 18 + TypeScript
- Vite
- CSS custom properties (global.css)
- No UI library (hand-crafted components)
- Existing fonts: Manrope (sans), Crimson Pro (serif), JetBrains Mono (mono)

## Style Direction: Dark Glassmorphism

### Visual Identity

- **Background:** Rich dark gradient — deep indigo/midnight purple to near-black (e.g., `#0a0814` → `#12082a`)
- **Glass surfaces:** `backdrop-filter: blur(20px)` frosted panels with subtle white border (`rgba(255,255,255,0.08)`) and inner glow
- **Accent colors:** Electric violet (`#8b5cf6`), cyan (`#06b6d4`), and soft white
- **Depth:** Multiple z-layers using box-shadow, blur, and opacity to create genuine depth
- **Typography:** Manrope for UI text, large numbers/headings with tight tracking
- **Motion:** Subtle entrance animations, hover states with glow effects

### Atmosphere

The app should feel like a **command center at night** — sophisticated, focused, slightly futuristic. Think Linear meets Apple Vision Pro meets a high-end trading terminal.

## What to Design / Implement

### 1. Global Design System (global.css)

Redesign CSS custom properties for glassmorphism:
- Dark background gradient tokens
- Glass surface tokens (blur, border, shadow)
- Electric accent color palette
- Refined spacing and radius tokens (larger radius for glass cards: 16-24px)

### 2. App Layout & Sidebar

- Sidebar becomes a frosted glass panel floating over the background
- Navigation items have glowing active states
- App logo/title with gradient text
- Background shows through the sidebar (backdrop-filter)

### 3. Kanban Board

- Each column is a glass card with blur and subtle border
- Task cards are secondary glass layers (lighter blur, different opacity)
- Column headers with gradient accent lines
- Priority badges as glowing colored pills
- Drag handles are barely-visible until hover

### 4. Projects & Contacts Lists

- Table rows or cards with glass treatment
- Status indicators as glowing dots
- Hover states lift the row with increased glow
- Empty states with atmospheric illustration (CSS-only, abstract shapes)

### 5. Notes List

- Note cards as glass panels in a masonry-like layout
- Category tags as frosted pills
- Card hover reveals a subtle gradient edge glow

### 6. Settings Page

- Section cards as glass panels with clear visual hierarchy
- Toggle switches with violet glow when active
- Input fields with glass background and glowing focus ring

## Key Design Constraints

- Must remain fully functional (all existing features work)
- No external UI libraries — pure CSS + existing React components
- All changes go to `src/styles/global.css` and component `.tsx`/`.css` files
- The Vite dev server runs on port 5173

## Success Criteria

A designer looking at a screenshot of this app should immediately say:
- "This is not a template — someone made deliberate choices"
- "The depth and layering feel real"
- "The glass effect is tasteful, not overdone"
- "I could ship this as a product"
