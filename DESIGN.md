You are a senior frontend engineer and product designer. Generate a production-ready **React (Next.js-compatible) UI** using **Tailwind CSS + shadcn/ui (Radix)** for an internal **B2B HR Operations Admin** (employee management).
Goal: a cohesive, design-system-driven UI with consistent tone & manner across pages, subtle glassmorphism accents, and polished interactions.

Tech constraints:

- React + TypeScript components
- Tailwind CSS utility classes
- Use shadcn/ui components wherever applicable (Button, Input, Select, Tabs, Table, Dialog, Sheet/Drawer, DropdownMenu, Tooltip, Toast/Sonner, Skeleton, Badge)
- Accessible by default: keyboard nav, focus rings, ARIA labels, proper semantics
- No external design libraries beyond shadcn/ui/Radix; keep code clean and modular

Global design system (must be reflected in code):

- Design tokens via Tailwind classes / CSS variables mindset:
  - Neutral palette + **one accent color**
  - 8pt spacing system
  - Radius 12–16px
  - 3 shadow levels (subtle)
  - Typography scale: 32/24/18/16/14 with comfortable line-height
  - Z-index layering rules for header/sidebar/overlays
- Component variants & states:
  - sizes (sm/md/lg), tones (primary/secondary/ghost), states (default/hover/focus/disabled/loading/error)

Glassmorphism (accent-only, readability first):

- Apply subtle frosted-glass surfaces ONLY to overlays and floating UI:
  - header widgets, dropdown panels, dialogs, drawers/sheets
- Dense content areas (tables/long forms) must remain on solid backgrounds.
- Frosted glass spec: semi-transparent surface + gentle blur + thin border + soft shadow + strong contrast.

App shell layout (consistent across all pages):

- Collapsible left sidebar navigation:
  - Employees, Attendance, Roles & Access, Org Chart, Approvals, Audit Log, Settings
- Top header with:
  - global search (name/email/employee ID)
  - notifications bell
  - help icon
  - user menu dropdown
- Main content area:
  - breadcrumb + page title
  - primary CTA + secondary actions aligned right
  - consistent page padding and grid (12-col responsive)

Pages to implement (minimum 3, unified patterns):

1. Employees page:

- Filter bar (department, status, role, work type, location, hire date range) + search + “Saved Views” dropdown + reset
- Dense table:
  - sticky header, sortable columns, pagination, row selection
  - bulk actions bar appears when rows selected (Change dept, Assign manager, Update role, Deactivate, Send invite)
  - columns: Employee (avatar+name), Employee ID, Department, Team, Role, Manager, Work Type, Status, Last Active, Updated
- Row click opens right-side details drawer (Sheet):
  - Profile summary, org info, role/access controls, recent activity log, quick actions

2. Attendance page:

- KPI cards row (On-time rate, Late count, Absences, Overtime hours)
- Filter bar (date range, department, manager, status, work type)
- Dense table + exception handling drawer/modal (Approve, Request info, Edit record)

3. Roles & Access page:

- Role list (left) + permission matrix/details (right)
- Audit-friendly change log
- Confirmation dialogs for risky changes

Interactions & states (must be implemented):

- Hover: subtle row highlight and slight elevation on cards
- Motion: 150–250ms transitions, ease-out; no bouncy animations
- Loading: skeletons for table and cards
- Empty states: clear message + CTA
- Validation: inline form validation states
- Feedback: toasts for success/error; confirmation dialogs for destructive actions
- Accessibility: visible focus rings, keyboard navigation, ARIA labels

Deliverable:

- Provide a single cohesive code output:
  - A main layout component (AppShell) + 3 page components
  - Shared UI components for FilterBar, DataTable, BulkActionsBar, DetailsDrawer, KPIStatCard, EmptyState
  - Mock data + local state interactions (no backend required)
  - Clean file/module structure in the code (commented sections are fine)
- Ensure consistent tone & manner across all pages via shared components and styles.
