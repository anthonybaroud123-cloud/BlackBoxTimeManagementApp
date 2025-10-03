# Time Tracking App Design Guidelines

## Design Approach
**Selected Approach:** Design System (Material Design 3) with productivity-focused customization
**Justification:** This is a utility-focused, information-dense productivity tool where efficiency and learnability are paramount. The app requires standard UI patterns for forms, data tables, and dashboards.

## Core Design Elements

### A. Color Palette
**Primary Colors:**
- Light mode: 220 85% 25% (deep professional blue)
- Dark mode: 220 50% 85% (soft blue-white)

**Background Colors:**
- Light mode: 0 0% 98% (near white)
- Dark mode: 220 15% 8% (dark blue-gray)

**Accent Colors:**
- Success: 142 70% 45% (professional green for completed tasks)
- Warning: 35 90% 55% (amber for cost warnings)
- Error: 0 70% 50% (red for alerts)

### B. Typography
**Primary Font:** Inter (Google Fonts)
- Headers: 600 weight
- Body text: 400 weight
- UI labels: 500 weight
- Data/numbers: 400-500 weight (tabular nums)

**Font Scale:**
- Display: text-3xl (30px)
- Headings: text-xl to text-2xl
- Body: text-base (16px)
- Small text/labels: text-sm (14px)

### C. Layout System
**Spacing Units:** Consistent use of Tailwind units 2, 4, 6, and 8
- Component padding: p-4, p-6
- Section margins: m-6, m-8
- Element spacing: gap-4, space-y-4
- Card spacing: p-6

### D. Component Library

**Navigation:**
- Sidebar navigation with collapsible sections
- Top navigation bar with user profile and notifications
- Breadcrumb navigation for project hierarchy

**Data Display:**
- Clean data tables with sortable columns
- Time tracking cards with prominent start/stop buttons
- Project cards with progress indicators
- Dashboard widgets with clear metrics

**Forms:**
- Inline editing for time entries
- Modal dialogs for project creation
- Dropdown selectors for project scopes
- Permission toggles for admin settings

**Interactive Elements:**
- Prominent time tracking buttons (play/pause/stop)
- Quick action buttons for common tasks
- Filter and search controls
- Export/reporting buttons

**Feedback Systems:**
- Toast notifications for actions
- Progress indicators for time tracking
- Warning badges for cost thresholds
- Status indicators for project phases

### E. Key Interface Patterns

**Dashboard Layout:**
- Grid-based layout with responsive cards
- Left sidebar for navigation and filters
- Main content area with data tables and charts
- Quick action toolbar at top

**Time Tracking Interface:**
- Prominent timer display with large, accessible buttons
- Project and scope selection dropdowns
- Recent entries list for quick reference
- Daily/weekly time summaries

**Project Management:**
- Tabbed interface for project details, team, and analytics
- Permission-based content visibility
- Inline editing for rates and settings
- Team member management with role indicators

**Analytics Views:**
- Clean charts and graphs for time distribution
- Cost vs revenue comparisons (admin only)
- Scope breakdown visualizations
- Exportable reports

### F. Accessibility & Responsiveness

**Dark Mode:**
- Consistent implementation across all components
- Proper contrast ratios maintained
- Form inputs and text fields adapt to dark theme

**Responsive Design:**
- Mobile-first approach
- Collapsible sidebar on smaller screens
- Touch-friendly button sizes
- Readable typography on all devices

**Key Design Principles:**
1. **Clarity:** Information hierarchy clearly distinguishes between time data, project details, and administrative functions
2. **Efficiency:** Quick access to frequently used actions (start timer, switch projects)
3. **Permission-Aware:** UI adapts based on user role, hiding sensitive cost/revenue data from regular users
4. **Data-Focused:** Clean presentation of time tracking data, analytics, and project metrics

This design system prioritizes functionality and usability while maintaining a professional, modern aesthetic appropriate for a business productivity tool.