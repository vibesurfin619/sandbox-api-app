# Brand Guidelines

## Overview

This document outlines the visual identity and design system for the Counterpart Insurance Application Manager. These guidelines ensure consistency across all interfaces and components.

---

## Logo

### Specifications
- **File**: `/public/counterpart_logo.svg`
- **Dimensions**: 194px × 22px (width × height)
- **Format**: SVG (scalable vector graphics)
- **Usage**: Use the logo in the header/navigation area

### Usage Guidelines
- Always maintain aspect ratio when scaling
- Minimum clear space: 16px on all sides
- Use on white or light backgrounds for optimal visibility
- Do not modify, distort, or recolor the logo

### Implementation Example
```tsx
<img
  src="/counterpart_logo.svg"
  alt="Counterpart"
  width={194}
  height={22}
  className="h-auto"
/>
```

---

## Color Palette

### Primary Colors

#### Primary
- **Hex**: `#29525E`
- **Usage**: Primary text, headings, buttons, key UI elements
- **Tailwind**: `text-counterpart-primary`, `bg-counterpart-primary`
- **CSS Variable**: `--foreground`

#### Secondary
- **Hex**: `#B0D3DD`
- **Usage**: Borders, backgrounds, subtle accents
- **Tailwind**: `text-counterpart-secondary`, `bg-counterpart-secondary`
- **Opacity Variants**: Use `/30` or `/50` for subtle backgrounds

### Neutral Colors

#### Black
- **Hex**: `#000000`
- **Tailwind**: `counterpart-black`

#### White
- **Hex**: `#FFFFFF`
- **Usage**: Background, cards, containers
- **Tailwind**: `counterpart-white`
- **CSS Variable**: `--background`

### Semantic Colors

Semantic colors are used to convey status, states, and feedback throughout the application.

#### Green (Success/Positive States)
- **Dark**: `#16382C` - Text on light backgrounds
- **Light**: `#4BAA8F` - Backgrounds, accents
- **Usage**: Success states, completed actions, positive status
- **Tailwind**: 
  - `text-counterpart-green-dark`
  - `bg-counterpart-green-light`
  - Use opacity variants (`/30`, `/50`) for subtle backgrounds

#### Red (Error/Negative States)
- **Dark**: `#5C2932` - Text on light backgrounds
- **Light**: `#FFC1AC` - Backgrounds, accents
- **Usage**: Errors, warnings, declined states
- **Tailwind**: 
  - `text-counterpart-red-dark`
  - `bg-counterpart-red-light`
  - Use opacity variants (`/30`, `/50`) for subtle backgrounds

#### Yellow (Warning/Review States)
- **Dark**: `#58583E` - Text on light backgrounds
- **Light**: `#F5F5AB` - Backgrounds, accents
- **Usage**: Warnings, pending review, caution states
- **Tailwind**: 
  - `text-counterpart-yellow-dark`
  - `bg-counterpart-yellow-light`
  - Use opacity variants (`/30`, `/50`) for subtle backgrounds

#### Orange (Alert/Attention States)
- **Dark**: `#7D2E20` - Text on light backgrounds
- **Light**: `#FA5C40` - Backgrounds, accents
- **Usage**: Alerts, important notices, attention-required states
- **Tailwind**: 
  - `text-counterpart-orange-dark`
  - `bg-counterpart-orange-light`
  - Use opacity variants (`/30`, `/50`) for subtle backgrounds

### Color Usage Examples

#### Status Badges
```tsx
const statusColors: Record<string, string> = {
  draft: 'bg-counterpart-secondary/30 text-counterpart-primary',
  submitted: 'bg-counterpart-secondary/50 text-counterpart-primary',
  quoted: 'bg-counterpart-green-light/30 text-counterpart-green-dark',
  review: 'bg-counterpart-yellow-light/50 text-counterpart-yellow-dark',
  declined: 'bg-counterpart-red-light/50 text-counterpart-red-dark',
  bound: 'bg-counterpart-green-light/50 text-counterpart-green-dark',
};
```

#### Buttons
- **Primary Button**: `bg-counterpart-primary` with white text
- **Hover State**: `hover:opacity-90`
- **Focus State**: `focus:ring-2 focus:ring-offset-2 focus:ring-counterpart-primary`

---

## Typography

### Font Stack
The application uses a system font stack for optimal performance and cross-platform consistency:

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
  'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 
  'Helvetica Neue', sans-serif;
```

### Type Scale

#### Headings
- **H1**: `text-3xl font-bold text-counterpart-primary`
- **H2**: `text-2xl font-semibold text-counterpart-primary`
- **H3**: `text-lg font-semibold text-counterpart-primary`

#### Body Text
- **Default**: Uses root foreground color (`--foreground` / `#29525E`)
- **Secondary Text**: `text-counterpart-primary/70` or `text-counterpart-primary/60`
- **Small Text**: `text-sm` or `text-xs`

#### Text Utilities
- **Text Balance**: Use `.text-balance` utility for balanced text wrapping

---

## Spacing & Layout

### Container
- **Max Width**: `max-w-7xl` (1280px)
- **Horizontal Padding**: 
  - Mobile: `px-4`
  - Tablet: `sm:px-6`
  - Desktop: `lg:px-8`
- **Vertical Padding**: `py-8` for main content, `py-4` for headers

### Component Spacing
- **Card Padding**: `p-6`
- **Button Padding**: `px-4 py-2`
- **Badge Padding**: `px-2.5 py-0.5` or `px-3 py-1`
- **Gap Between Elements**: `gap-2` or `gap-3`

---

## Components

### Cards
- **Background**: White (`bg-white`)
- **Border**: `border border-counterpart-secondary/30`
- **Border Radius**: `rounded-lg`
- **Shadow**: `shadow-md` with `hover:shadow-lg` transition
- **Padding**: `p-6`

### Buttons

#### Primary Button
```tsx
className="inline-flex items-center px-4 py-2 border border-transparent 
  shadow-sm text-sm font-medium rounded-md text-white bg-counterpart-primary 
  hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 
  focus:ring-counterpart-primary"
```

### Badges/Tags
- **Status Badges**: Rounded full (`rounded-full`)
- **Coverage Tags**: `rounded-full` with `bg-counterpart-secondary/30`
- **Text Size**: `text-xs` or `text-sm`
- **Font Weight**: `font-medium`

### Borders
- **Default**: `border-counterpart-secondary/30`
- **Header Border**: `border-b border-counterpart-secondary/30`

---

## Status Color Mapping

Application statuses use specific color combinations:

| Status | Background | Text Color | Usage |
|--------|-----------|------------|-------|
| Draft | `bg-counterpart-secondary/30` | `text-counterpart-primary` | Initial state |
| Submitted | `bg-counterpart-secondary/50` | `text-counterpart-primary` | Submitted for review |
| Quoted | `bg-counterpart-green-light/30` | `text-counterpart-green-dark` | Quote provided |
| Review | `bg-counterpart-yellow-light/50` | `text-counterpart-yellow-dark` | Under review |
| Declined | `bg-counterpart-red-light/50` | `text-counterpart-red-dark` | Application declined |
| Bound | `bg-counterpart-green-light/50` | `text-counterpart-green-dark` | Policy bound |

---

## Accessibility

### Color Contrast
- Ensure sufficient contrast ratios (WCAG AA minimum)
- Primary text (`#29525E`) on white background meets contrast requirements
- Semantic colors should be tested for accessibility

### Focus States
- All interactive elements should have visible focus indicators
- Use `focus:ring-2 focus:ring-offset-2 focus:ring-counterpart-primary` for buttons
- Maintain keyboard navigation support

### Alt Text
- Always provide descriptive alt text for logos and images
- Use semantic HTML elements for proper screen reader support

---

## Implementation Notes

### Tailwind Configuration
Colors are defined in `tailwind.config.ts` under the `counterpart` namespace:

```typescript
counterpart: {
  primary: '#29525E',
  secondary: '#B0D3DD',
  // ... semantic colors
}
```

### CSS Variables
Root-level CSS variables in `globals.css`:
- `--background`: `#ffffff`
- `--foreground`: `#29525E`

### Opacity Usage
Use Tailwind opacity modifiers for subtle backgrounds:
- `/30` - Very subtle (30% opacity)
- `/50` - Moderate (50% opacity)
- `/70` - More visible (70% opacity)

---

## Examples

### Header
```tsx
<header className="bg-white border-b border-counterpart-secondary/30">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
    <img src="/counterpart_logo.svg" alt="Counterpart" width={194} height={22} />
  </div>
</header>
```

### Page Title
```tsx
<h1 className="text-3xl font-bold text-counterpart-primary">
  Insurance Applications
</h1>
<p className="mt-2 text-sm text-gray-600">
  Manage your insurance applications and track their status
</p>
```

### Status Badge
```tsx
<span className="inline-flex items-center px-3 py-1 rounded-full 
  text-xs font-medium bg-counterpart-green-light/50 
  text-counterpart-green-dark">
  Bound
</span>
```

---

## Best Practices

1. **Consistency**: Always use the defined color tokens from Tailwind config
2. **Semantic Meaning**: Use semantic colors appropriately (green for success, red for errors)
3. **Opacity**: Use opacity modifiers for backgrounds to maintain hierarchy
4. **Spacing**: Follow the defined spacing scale for consistent layouts
5. **Typography**: Use the system font stack; avoid custom fonts unless necessary
6. **Accessibility**: Test color combinations for sufficient contrast
7. **Responsive**: Ensure designs work across all breakpoints

---

## Version History

- **v1.0** - Initial brand guidelines document
