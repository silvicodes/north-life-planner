# North

North is a lightweight, responsive personal organization app designed to help people manage their daily life in one calm place.

It combines personal finance, study planning, habits, tasks, events, and goals into a clean dashboard that starts empty for every user. Each person can add their own information, and the data is saved locally in their browser.

## Features

- Personal dashboard with quick daily overview
- Personal finance tracking:
  - Income
  - Expenses
  - Current balance
  - Recent movements
  - Budget categories with monthly limits
  - Lightweight finance charts
- Study planning:
  - Academic tasks
  - Study-focused task entries
- Daily organization:
  - Tasks
  - Recurring habits
  - Habit completion history and streak tracking
  - Agenda items
  - Priorities
- Goals:
  - Custom goals
  - Progress percentage
  - Target notes
  - Progress tracking chart
- Calendar views by day, week, and month
- Data export and import with JSON files
- Edit and delete actions for user-created items
- Quick-add modal for fast data entry
- Empty states designed for first-time users
- English and Spanish language switcher
- Light and dark mode
- Fully responsive layout for mobile, tablet, and desktop
- Local-first data persistence with optional Supabase cloud sync
- Fast Vite build with a small frontend footprint

## Tech Stack

- React
- TypeScript
- Vite
- CSS
- Lucide React icons
- Browser `localStorage` for local persistence
- Supabase Auth and database sync when configured

## Getting Started

### Prerequisites

Make sure you have Node.js and npm installed.

This project was built with:

```bash
node --version
npm --version
```

## Installation

Clone the repository:

```bash
git clone https://github.com/your-username/your-repository-name.git
cd your-repository-name
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL shown in your terminal, usually:

```bash
http://localhost:5173/
```

## Available Scripts

Run the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project Structure

```txt
north-app/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── src/
    ├── App.tsx
    ├── main.tsx
    └── styles.css
```

## Data Storage

North is local-first by default and can sync to Supabase when configured.

User data is stored in the browser using `localStorage`, under the key:

```txt
north-data
```

Theme and language preferences are also stored locally:

```txt
north-theme
north-lang
```

This means each person who opens the app has their own separate data on their own browser.

## Supabase Setup

Create a `.env` file using `.env.example`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Create this table in Supabase:

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

Without these environment variables, North stays fully usable in local mode.

## Responsive Design

North is designed to work across:

- Mobile phones
- Tablets
- Desktop screens

The layout uses:

- Sidebar navigation on larger screens
- Bottom navigation on mobile
- Compact cards and panels
- Responsive grids
- Touch-friendly buttons

## Accessibility Notes

The app includes:

- Semantic buttons
- Accessible labels for icon buttons
- Clear focusable controls
- Readable contrast in light and dark modes
- Form labels for quick-add inputs

## Future Improvements

Possible next steps:

- Convert the app into an installable PWA

## Credits

Created by **silvicodes** · **ReadyCreation**
