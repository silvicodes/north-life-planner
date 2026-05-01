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
- Study planning:
  - Academic tasks
  - Study-focused task entries
- Daily organization:
  - Tasks
  - Habits
  - Agenda items
  - Priorities
- Goals:
  - Custom goals
  - Progress percentage
  - Target notes
- Quick-add modal for fast data entry
- Empty states designed for first-time users
- English and Spanish language switcher
- Light and dark mode
- Fully responsive layout for mobile, tablet, and desktop
- Local-first data persistence with `localStorage`
- Fast Vite build with a small frontend footprint

## Tech Stack

- React
- TypeScript
- Vite
- CSS
- Lucide React icons
- Browser `localStorage` for persistence

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

North is currently local-first.

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

- Add edit and delete actions for all items
- Add recurring habits and streak history
- Add budget categories and monthly limits
- Add calendar views by day, week, and month
- Add charts for finance and progress tracking
- Add data export and import
- Add Supabase authentication and cloud sync
- Convert the app into an installable PWA

## Credits

Created by **silvicodes** · **ReadyCreation**
