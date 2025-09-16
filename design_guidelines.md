# Design Guidelines for Personal Fitness App

## Design Approach: Reference-Based (Fitness Category)
Drawing inspiration from leading fitness apps like Nike Training Club, Strava, and MyFitnessPal while maintaining a clean, motivational aesthetic focused on user progress and achievement.

## Core Design Elements

### A. Color Palette
**Primary Colors:**
- Light Mode: Deep fitness blue (220 85% 25%) with energetic accent orange (25 90% 55%)
- Dark Mode: Rich navy (220 40% 15%) with vibrant orange accent (25 85% 60%)
- Success green (140 70% 45%) for completed workouts
- Warning amber (45 85% 55%) for missed sessions

### B. Typography
- **Primary Font:** Inter via Google Fonts CDN for excellent mobile readability
- **Accent Font:** Poppins for headings and motivational text
- **Sizes:** Large headings (text-2xl), body (text-base), small labels (text-sm)

### C. Layout System
**Tailwind Spacing:** Consistent use of 2, 4, 6, and 8 units (p-4, m-6, gap-8)
- Mobile-first grid system with generous padding
- Card-based layout for equipment items and workout sessions
- Sticky navigation with clear visual hierarchy

### D. Component Library

**Core Components:**
- **Equipment Cards:** Rounded corners (rounded-lg) with equipment type icons, quantity, and weight display
- **Workout Progress Cards:** Circular progress indicators with completion percentages
- **Restriction Toggles:** Clear on/off switches with descriptive labels
- **Goal Selection:** Tag-style buttons for multiple selection
- **Activity Logging:** Checkmark animations for completed workouts
- **Time Scheduler:** Weekly calendar grid with time slot selection

**Navigation:**
- Bottom tab navigation for mobile (Equipment, Plan, Log, Progress)
- Floating action button for quick workout logging

**Forms:**
- Clean input fields with floating labels
- Multi-step onboarding flow with progress indicators
- Dropdown selectors for equipment types and fitness goals

**Data Displays:**
- Weekly/monthly progress charts using subtle gradients
- Achievement badges with celebration animations
- Workout streak counters with motivational messaging

**Overlays:**
- Modal dialogs for adding new equipment
- Bottom sheets for workout completion details
- Toast notifications for successful actions

### E. Visual Treatments
**Gradients:** Subtle linear gradients from primary blue to deeper navy for hero sections and progress backgrounds. Use sparingly on cards and buttons for depth.

**Background:** Clean white/dark backgrounds with subtle texture overlays in workout areas. Card shadows for depth without overwhelming the interface.

## Images Section
**Workout Illustration Graphics:** Small motivational fitness icons and exercise demonstration thumbnails placed in workout cards and equipment selection areas. No large hero images - focus on clean, data-driven interface optimized for quick fitness tracking and planning.

## Key Design Principles
1. **Motivation-First:** Visual progress indicators and achievement celebrations
2. **Quick Access:** Essential features within one tap from main screen
3. **Clarity:** Clear visual distinction between completed and pending workouts
4. **Consistency:** Unified spacing and component styling across all screens
5. **Performance:** Minimal animations focused on feedback and progress celebration