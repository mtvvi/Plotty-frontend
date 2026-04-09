# Plotty Design System

## Overview
Redesigned UI for Plotty - a fanfiction platform with AI beta-reader features.
Maintains warm, cozy identity while achieving a more modern, premium, and cohesive look.

## Color Palette

### Primary Colors
- **Background**: Linear gradient `rgb(228, 221, 210)` to `rgb(217, 210, 196)`
- **Primary Text**: `#23211e` (warm dark)
- **Secondary Text**: `#6d665d` (muted brown-gray)
- **Tertiary Text**: `#9a9088` (light gray-brown)
- **Primary Action**: `#bc5f3d` (terracotta orange)
- **Primary Action Hover**: `#a64f31` (darker terracotta)

### Surface Colors
- **White Overlay**: `rgba(255,255,255,0.90)` with backdrop-blur
- **Card Background**: `rgba(255,255,255,0.85)` with backdrop-blur
- **Cover Placeholder**: Linear gradient from `#f0e8db` to `#e8dcc8`

### Borders & Shadows
- **Light Border**: `rgba(41,38,34,0.08)`
- **Medium Border**: `rgba(41,38,34,0.10)`
- **Strong Border**: `rgba(41,38,34,0.12)`
- **Card Shadow**: `0px 12px 32px rgba(46,35,23,0.10)`
- **Button Shadow**: `0px 8px 20px rgba(188,95,61,0.20)`

## Typography

### Fonts
- **Display/Headings**: Literata (serif) - 600, 700 weights
- **Body/UI**: Manrope (sans-serif) - 400, 500, 600, 700, 800 weights

### Type Scale
- **Display Large**: 48-56px, tracking -2.2px
- **Display Medium**: 32-40px, tracking -1.8px
- **Heading 1**: 22-32px, tracking -0.4px to -1px
- **Body Large**: 15-18px
- **Body**: 14px
- **Body Small**: 13px
- **Caption**: 11-12px
- **Label**: 10.5-11px, uppercase with tracking 0.2-0.8px

## Spacing System

### Base Unit: 4px
- **4px** (1): Micro spacing
- **8px** (2): Small gaps between related items
- **12px** (3): Medium gaps
- **16px** (4): Standard spacing
- **20px** (5): Large spacing
- **24px** (6): Section spacing
- **32px** (8): Major section breaks
- **40px** (10): Page-level spacing
- **48px** (12): Large page sections
- **64px** (16): Extra large spacing

## Components

### Buttons

#### Primary Button
- Background: `#bc5f3d`
- Text: White
- Padding: `px-5 py-3` (20px/12px)
- Border radius: `xl` (12px)
- Font: Manrope Bold 14-15px
- Shadow: `0px 8px 20px rgba(188,95,61,0.20)`
- Hover: Darker bg + stronger shadow

#### Secondary Button
- Background: White with border
- Text: `#23211e`
- Border: `rgba(41,38,34,0.10)`
- Same sizing as primary
- Hover: Light gray background

### Cards

#### Story Card (Desktop)
- Background: `rgba(255,255,255,0.85)` with backdrop-blur
- Border: `rgba(41,38,34,0.08)`
- Border radius: `2xl` (16px)
- Padding: `20px`
- Hover: Stronger shadow + border

#### Story Card (Mobile)
- Smaller padding: `16px`
- Tighter layout
- Active state: scale(0.98)

### Tags/Chips
- Border radius: `lg` (8px) to `xl` (12px)
- Padding: `px-3 py-1.5` to `px-3.5 py-2`
- Font: Manrope Medium/Semibold 12-13px
- Active: `#bc5f3d` background with white text
- Inactive: White with border

### Form Inputs
- Background: White
- Border: `rgba(41,38,34,0.10)`
- Border radius: `xl` (12px)
- Padding: `px-4 py-3`
- Focus: `#bc5f3d` border + ring

### Social Metrics
- Icon size: 14-20px (responsive)
- Font: Manrope Semibold 12-14px
- Color: `#6d665d`
- Hover: `#bc5f3d`
- Gap: 1.5-2 between icon and number

## Layout

### Container Widths
- **Catalog**: 1440px max
- **Story Detail**: 1280px max
- **Settings**: 960px max

### Responsive Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Grid
- **Desktop**: 2 columns for story grid
- **Mobile**: 1 column, full width

## Interactions

### Hover States
- Cards: Increase shadow, strengthen border
- Buttons: Darken background, increase shadow
- Social metrics: Change color to `#bc5f3d`

### Active/Pressed States
- Mobile elements: `scale(0.98)`
- Buttons: Slightly darker

### Transitions
- Duration: 200-300ms
- Easing: Default ease or ease-out

## Mobile-Specific

### Bottom Navigation
- Height: 56px + safe-area
- Background: `rgba(255,255,255,0.98)` with backdrop-blur
- Border-top: `rgba(41,38,34,0.08)`
- Icon size: 20px
- Active state: Colored background

### Filter Drawer
- Appears from bottom
- Max height: 85vh
- Rounded top corners: `3xl` (24px)
- Backdrop: Black/40 with blur

## Accessibility

### Touch Targets
- Minimum: 44x44px for mobile interactive elements
- Comfortable spacing between tappable elements

### Contrast
- Text on white: Passes WCAG AA
- White text on `#bc5f3d`: Passes WCAG AA
- Interactive elements have clear hover/focus states

## Notes

### Design Philosophy
- **Warm minimalism**: Cozy but not cluttered
- **Editorial feel**: Suitable for reading platform
- **Premium quality**: Refined spacing, shadows, and interactions
- **Author-focused**: Professional tools, creative atmosphere
- **NOT generic**: Maintains Plotty personality
