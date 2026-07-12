# Dashboard

OpenWolf includes a real-time web dashboard for visibility into your project's AI activity. It's a React SPA served by the daemon.

## Launch

```bash
openwolf dashboard
```

This starts the daemon (if not already running) and opens your browser to `http://localhost:18791`.

## Theme

The dashboard supports **dark and light modes**. Toggle using the sun/moon button in the sidebar header. Your preference is saved in localStorage.

## Panels

The dashboard has 10 panels, accessible from the sidebar.

### Overview

The home screen. Shows:
- **Project name and description**: detected from `package.json`, `Cargo.toml`, README, or `cerebrum.md`
- **Daemon status**: green pulsing indicator when healthy
- **Stat cards**: files tracked, total sessions, estimated tokens saved
- **Recent activity**: last 5 entries from `memory.md`

### Activity Timeline

Chronological log of everything Claude has done. Each action is a card with timestamp, description, affected files, and token estimate.

**Controls:** filter by date range (today / this week / all), search by keyword, toggle between grouped (by session) and flat views.

### Token Intelligence

Two charts and waste alerts:

- **Usage Over Time**: area chart showing input (reads) and output (writes) tokens per session
- **Token Comparison**: horizontal bar chart comparing:
  - **Without OpenWolf** (estimated overhead, uses more tokens)
  - **With OpenWolf** (actual, the savings)
- **Waste Alerts**: flagged patterns like repeated reads, unnecessary full-file reads, memory bloat

### Cron Control Center

Table of all scheduled tasks showing status, schedule (human-readable), last run, and next run. Each row has a **Run Now** button.

Below the table:
- **Dead Letter Queue**: failed tasks with error details and **Retry** buttons
- **Execution History**: last 30 runs with duration and status

### Cerebrum Viewer

Structured view of `cerebrum.md`:

- **Do-Not-Repeat**: prominent red-tinted cards with date badges (most important section)
- **User Preferences**: bullet list
- **Key Learnings**: card per learning
- **Decision Log**: collapsible cards with rationale

Includes a search bar that filters across all sections.

### Memory Browser

Sessions as collapsible cards. Each shows the date, action count, and total tokens. Expand to see the full action table (time, action, files, outcome, tokens).

Most recent session is expanded by default.

### Anatomy Browser

Interactive file tree built from `anatomy.md`. Directories are expandable nodes. Files show their description and a color-coded token badge:
- **Green**: under 200 tokens
- **Amber**: 200-1000 tokens
- **Red**: over 1000 tokens

Search filters by filename or description. Stats bar shows total files, average tokens per file, and the largest file.

### Bug Log

Searchable bug database from `buglog.json`. Each bug expands to show:
- Error message (in red code block)
- Root cause
- Fix (in green code block)
- Tags as badges
- Occurrence count (amber badge if seen more than once)

Quick-filter by clicking common tags.

## Design

- **Dark/light theme** with toggle in the sidebar (preference saved in localStorage)
- **Responsive**: sidebar collapses to bottom tab bar on mobile
- **Live updates**: WebSocket connection pushes `.wolf/` file changes in real time
- **Lazy-loaded panels** with skeleton fallbacks
- **Sidebar footer**: links to [OpenWolf on GitHub](https://github.com/cytostack/openwolf) and shows version
