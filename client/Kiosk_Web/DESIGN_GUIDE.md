# Golden Munch Kiosk - Design Guide

## Overview

The Golden Munch Kiosk app features a modern, beautiful design inspired by contemporary food ordering systems. The design emphasizes visual appeal, smooth animations, and an intuitive user experience perfect for self-service kiosks.

## Design Philosophy

### Core Principles
1. **Visual Hierarchy** - Clear distinction between primary and secondary actions
2. **Smooth Animations** - Polished transitions and entrance effects
3. **Modern Aesthetics** - Gradients, glassmorphism, and depth
4. **Touch-Friendly** - Large, easy-to-tap buttons and controls
5. **Delightful Interactions** - Micro-animations and hover effects

## Color Palette

### Primary Colors
- **Golden Orange**: `#F9A03F` - Primary brand color
- **Deep Amber**: `#D97706` - Secondary brand color
- **Chocolate Brown**: `#4B2E2E` - Text and accents
- **Cream White**: `#FFF8F0` - Background
- **Caramel Beige**: `#E6C89C` - Secondary background

### Gradients
- **Primary Gradient**: `from-golden-orange to-deep-amber`
- **Mesh Background**: Multi-layered radial gradients
- **Card Gradients**: `from-white to-golden-orange/5`

## Typography

### Font Weights
- **Black (900)**: Hero headings
- **Bold (700)**: Headings, important text
- **Semibold (600)**: Subheadings, labels
- **Regular (400)**: Body text

### Sizes
- **Hero**: 6xl (3.75rem)
- **Page Title**: 5xl (3rem)
- **Section Title**: 3xl (1.875rem)
- **Card Title**: 2xl (1.5rem)
- **Body**: base (1rem)

## Components

### Cards

#### Modern Card (.card-modern)
```css
- White background
- 20px border radius
- Subtle shadow
- 4px top border (appears on hover)
- Shimmer animation on hover
- Smooth scale and shadow transitions
```

#### Glass Card (.card-glass)
```css
- Semi-transparent white background
- 20px backdrop blur
- Border with white overlay
- Soft shadow
```

#### Golden Card (.card-golden)
```css
- Gradient background
- Golden border
- Hover: Lift and scale effect
- Enhanced shadow on hover
```

### Buttons

#### Primary Button
```jsx
className="bg-gradient-to-r from-golden-orange to-deep-amber
           text-white font-bold shadow-xl-golden
           hover:scale-105 transition-transform"
```

#### Secondary Button
```jsx
className="border-2 border-golden-orange text-chocolate-brown
           hover:bg-golden-orange/10 font-bold"
```

### Animations

#### Available Animations
- `animate-float` - Gentle floating motion
- `animate-bounce-slow` - Slow bounce effect
- `animate-pulse-slow` - Slow pulsing
- `animate-shimmer` - Shimmer effect
- `animate-slide-up` - Slide in from bottom
- `animate-slide-right` - Slide in from left
- `animate-scale-in` - Scale up entrance
- `animate-glow` - Glowing effect

#### Staggered Animations
Use inline styles with `animationDelay`:
```jsx
style={{ animationDelay: `${index * 0.1}s` }}
```

## Layout Patterns

### Page Structure
```
1. Hero Header (gradient background, large heading)
2. Content Container (max-w-7xl, padding)
3. Main Content (grid/flex layouts)
4. Navigation (centered, card wrapper)
5. Spacer (h-20 for bottom padding)
```

### Grid Systems
- **Categories**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- **Menu Items**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- **Stats Cards**: `grid-cols-1 md:grid-cols-3`

## Page-Specific Designs

### Menu/Home Page
- Sticky glassmorphism header
- Search bar with icon
- Category pills with gradients
- Staggered card entrance
- Floating mobile cart button

### Cart/Checkout Page
- Gradient header with emojis
- 2-column layout (cart items + checkout)
- Sticky order summary
- Enhanced success modal
- Prominent verification code display

### Categories Page
- Hero header with pattern overlay
- Quick stats cards
- Category cards with shine effect
- Navigation card wrapper

### Specials Page
- Animated star header
- Flash sale banner
- Discount badges
- Progress bars for limited items
- Additional offers section

## Glassmorphism

### Usage
Apply to headers, overlays, and floating elements:
```css
background: rgba(255, 248, 240, 0.8);
backdrop-filter: blur(10px);
-webkit-backdrop-filter: blur(10px);
border: 1px solid rgba(249, 160, 63, 0.2);
```

### Best Practices
- Use on top of colored/gradient backgrounds
- Maintain readability with sufficient opacity
- Add subtle borders for definition

## Shadows

### Shadow Hierarchy
- **Elevated**: `shadow-xl-golden` - Important floating elements
- **Medium**: `shadow-lg` - Cards, buttons
- **Subtle**: `shadow` - Default cards
- **Inner**: `shadow-inner-glow` - Inset glows

## Responsive Design

### Breakpoints
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px

### Mobile Optimizations
- Floating action buttons
- Single column layouts
- Larger touch targets
- Simplified navigation

## Accessibility

### Features
- Sufficient color contrast
- Focus visible states
- Reduced motion support
- High contrast mode support
- Touch-friendly sizes (min 60px)

### Implementation
```css
@media (prefers-reduced-motion: reduce) {
  .animate-* { animation: none; }
}

@media (prefers-contrast: high) {
  .card-modern { border-width: 3px; }
}
```

## Loading States

### Spinner
```jsx
<Spinner size="lg" color="warning" />
```

### Loading Page
- Centered layout
- Spinner with pulsing ring
- Descriptive text
- Mesh gradient background

## Error States

### Error Page
```jsx
- Large emoji (⚠️)
- Clear error message
- Retry button
- Modern card wrapper
```

## Badges and Chips

### Popular Badge
```jsx
<Chip color="warning" variant="shadow" className="font-bold animate-pulse-slow">
  🔥 Popular
</Chip>
```

### In Cart Badge
```jsx
<Chip color="success" variant="shadow" className="font-bold animate-bounce-slow">
  {quantity} in cart
</Chip>
```

## Best Practices

### Do's ✅
- Use gradients for CTAs and important elements
- Apply staggered animations to lists
- Maintain consistent spacing (Tailwind scale)
- Use emojis for visual interest
- Add hover states to interactive elements
- Implement smooth transitions

### Don'ts ❌
- Don't overuse animations
- Don't sacrifice readability for aesthetics
- Don't use too many different fonts
- Don't make text too small for touch
- Don't use low-contrast color combinations

## Performance

### Optimizations
- CSS animations (GPU accelerated)
- Minimal JavaScript animations
- Optimized image loading
- Reduced motion preferences respected

### Animation Guidelines
- Duration: 200-400ms for micro-interactions
- Duration: 2-6s for ambient animations
- Use `cubic-bezier(0.4, 0, 0.2, 1)` for smooth easing

## Future Enhancements

### Potential Additions
1. Dark mode support
2. Custom theme picker
3. More animation variations
4. Advanced glassmorphism effects
5. Parallax scrolling
6. Confetti animations for success states
7. Skeleton loaders
8. Progressive image loading

## Design Tools Used

### Inspiration Sources
- Modern food delivery apps (Uber Eats, DoorDash)
- Contemporary e-commerce sites
- Material Design 3 guidelines
- Apple's HIG for iOS

### Design Patterns
- Neumorphism influences
- Glassmorphism
- Gradient mesh backgrounds
- Card-based layouts
- Floating action buttons

## Maintenance

### Adding New Pages
1. Start with mesh gradient background
2. Add hero header with gradient
3. Use consistent card styles
4. Implement staggered animations
5. Add navigation section
6. Include spacer at bottom

### Updating Components
- Maintain existing animation delays
- Keep gradient consistency
- Use established shadow system
- Follow spacing conventions

---

**Version**: 1.0.0
**Last Updated**: 2025-11-16
**Author**: Golden Munch Design Team
