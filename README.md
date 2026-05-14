# North Planner

North Planner is a responsive personal productivity and finance planning app designed to bring everyday organisation into one focused workspace.

The app combines personal finance, shared expenses, project management, study planning, habits, goals and calendar workflows in a calm, mobile-friendly interface. It was built as a product-focused frontend project with attention to usability, data structure, responsive behaviour and real-world planning flows.

**Live demo:** https://northplanner.netlify.app
**Repository:** https://github.com/silvicodes/north-life-planner

## Overview

North Planner is designed for people who want a practical way to manage personal life and freelance-style work without jumping between separate tools.

The product starts with a private account screen and lets each signed-in user build their own workspace. Supabase authentication and cloud sync are required so each account only reads and writes its own data.

Core areas include:

- Finance tracking with expenses, income, budgets and shared spending
- Project management with a Kanban-style workflow
- Calendar planning across day, week and month views
- Study tasks, habits, daily tasks and personal goals
- Global workspace search
- Recurring tasks and events
- Tags for organizing tasks, events, goals and finance movements
- Customizable Home dashboard widgets
- Browser reminders for same-day timed events while the app is open
- English and Spanish language support
- Multi-currency settings for EUR, GBP and USD
- Light and dark theme support
- Import and export tools for user-owned data
- Installable PWA foundation with manifest, app icon and service worker

## Key Features

### Finance Management

- Monthly expense tracking
- Income and expense movements
- Individual and shared expense types
- Shared expense split calculations
- Settlement summary showing who owes or is owed money
- Budget categories with monthly limits
- Finance charts for income, expenses and spending by category
- Movement filters by month, category and type
- Multi-currency formatting for EUR, GBP and USD

### Project Management

- Project workspace for freelance, client or personal initiatives
- Kanban-style task board with workflow stages
- Task statuses for to do, in progress, blocked and done
- Client, payment and progress tracking
- Project-specific tasks and summaries
- Mobile-friendly project layout for checking work on the go

### Daily Planning

- Daily task management
- Calendar events
- Day, week and month calendar views
- Recurring events in calendar day, week and month views
- Timed event reminders while the app is open
- Recurring habits
- Recurring tasks for daily, weekly and monthly routines
- Habit completion history
- Goal tracking with progress values
- Tags for searching and organizing personal items
- Study planning and academic task support

### Dashboard and Search

- Redesigned Home dashboard with task, habit, project and monthly balance snapshots
- Preview widgets for agenda, finance, active projects and goals
- Customizable Home widgets from Settings
- Global search dropdown across tasks, events, movements, projects, goals and habits
- Direct navigation from search results into the right section or edit flow

### User Experience

- Responsive layout for mobile, tablet and desktop
- Sidebar navigation on desktop
- Bottom navigation on mobile
- Contextual forms for important flows
- Custom month picker for consistent iOS rendering
- Empty states tailored to each section
- Toast feedback after saving actions
- Accessible labels for icon buttons and form controls
- Account-based workspace with Supabase authentication and cloud sync
- Account settings with profile summary and password reset action
- Password recovery flow that requires a new password before entering the dashboard
- PWA metadata for app-like installation on supported devices

## Tech Stack

- **React 19** for the user interface
- **TypeScript** for typed application state and safer data handling
- **Vite** for local development and production builds
- **Supabase** for authentication and cloud sync
- **Lucide React** for icons
- **CSS** for custom responsive layout, themes and component styling
- **localStorage** for interface preferences such as language, theme and currency

## Product Decisions

### Account-required workspace

North Planner requires a signed-in Supabase user before opening the workspace. This prevents the dashboard from loading without a profile and keeps each user's planner data tied to their account.

If Supabase environment variables are missing in local development, the app shows a configuration notice instead of opening the dashboard.

### Mobile UX as a first-class requirement

The app is designed to be useful on an actual phone, not only in desktop responsive mode. Several interactions were adjusted specifically for mobile Safari, including navigation spacing and the finance month selector.

### Contextual creation flows

Instead of relying only on a generic quick-add modal, the app uses more specific flows for finances, projects, budgets, events and goals. This keeps the interface faster for simple actions while still supporting richer data when needed.

### Personalized daily dashboard

The Home dashboard is designed as an operational overview rather than a landing page. It surfaces today's work, agenda, finance summary, active projects and goal progress, and users can choose which widgets appear.

### Structured personal data

The application models each planning area as structured data: movements, budgets, projects, tasks, events, habits, goals and study items. Tasks and events support recurrence, several entities support tags, and the normalized data shape keeps cloud sync, import and export predictable.

## Project Structure

```txt
north-app/
├── index.html
├── package.json
├── public/
│   ├── manifest.webmanifest
│   ├── sw.js
│   └── icons/
│       └── icon.svg
├── vite.config.ts
├── scripts/
│   └── supabase-e2e.mjs
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── styles.css
    ├── types.ts
    ├── components/
    │   ├── Onboarding.tsx
    │   ├── QuickAdd.tsx
    │   └── common.tsx
    ├── i18n/
    │   └── copy.ts
    └── lib/
        ├── date.ts
        ├── storage.ts
        └── supabase.ts
```

## Getting Started

### Prerequisites

Use a recent version of Node.js and pnpm. The repository declares `pnpm@11.1.1` in `package.json`.

```bash
node --version
corepack pnpm --version
```

### Installation

Clone the repository:

```bash
git clone https://github.com/silvicodes/north-life-planner.git
cd north-life-planner
```

Install dependencies:

```bash
corepack pnpm install
```

Start the development server:

```bash
corepack pnpm dev
```

Open the local URL printed in the terminal.

## Available Scripts

```bash
corepack pnpm dev
```

Starts the Vite development server.

```bash
corepack pnpm build
```

Runs the TypeScript build and creates a production-ready Vite build.

```bash
corepack pnpm preview
```

Serves the production build locally for final verification.

```bash
corepack pnpm test:supabase:e2e
```

Runs the Supabase end-to-end sync validation script when test credentials are configured.

## Data Persistence

North Planner stores workspace data in Supabase per authenticated user. The browser only keeps interface preferences.

Local storage keys include:

```txt
north-theme
north-lang
north-currency
north-home-widgets
north-reminders-enabled
```

Workspace records are stored in the `north_user_data` table and protected with Row Level Security.

## Supabase Setup

The app requires Supabase for secure account-based authentication and cloud sync. Create a `.env` file based on `.env.example`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
```

Create the user data table:

```sql
create table public.north_user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.north_user_data enable row level security;

create policy "Users can read own North data"
on public.north_user_data
for select
using (auth.uid() = user_id);

create policy "Users can insert own North data"
on public.north_user_data
for insert
with check (auth.uid() = user_id);

create policy "Users can update own North data"
on public.north_user_data
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

Security notes:

- Email/password authentication is handled by Supabase Auth. The app never stores raw passwords.
- Row Level Security must stay enabled on `north_user_data`.
- The policies above isolate each profile by `auth.uid()`, so users can only access rows where `user_id` matches their authenticated account.
- When Supabase is configured, workspace data is not persisted as a shared local workspace in `localStorage`; users must sign in to load their own cloud profile.

## Supabase E2E Validation

To test cloud sync locally, add test credentials to `.env`:

```bash
SUPABASE_E2E_EMAIL=your-test-user@example.com
SUPABASE_E2E_PASSWORD=your-test-password
```

Then run:

```bash
corepack pnpm test:supabase:e2e
```

The script signs in or creates a test account, writes sample workspace data, simulates a reload, signs out, signs back in, validates cloud recovery and restores previous data.

## Accessibility and Responsiveness

The interface includes:

- Semantic buttons and labelled form controls
- Touch-friendly controls for mobile use
- Responsive grid layouts
- Mobile bottom navigation
- Desktop sidebar navigation
- Light and dark themes
- Clear empty states for first-time users
- Custom controls where native mobile rendering would reduce consistency

## Future Improvements

Potential next steps:

- Deeper PWA offline support for authenticated cloud data
- Richer analytics for finance, habit and project trends
- Recurring finance movements
- External calendar integrations such as Google Calendar
- CSV import mapping for bank exports
- Project file attachments and richer document references
- Drag-and-drop improvements for project boards
- More currencies and locale-specific preferences
- Automated component and interaction tests

## Credits

Designed and built by **silvicodes**.
