# XMAS Molesto Chess

A chess tournament tracker for the XMAS Molesto double round-robin tournament (4 players).

## Features

- **Live Standings**: Automatically calculated rankings with points, wins, draws, and losses.
- **Match Management**: Interactive match list to set results (`1-0`, `½-½`, `0-1`) and attach Lichess game URLs.
- **Player Integration**: Direct links to Lichess profiles and "Challenge" shortcuts (`⚔️`) to start games immediately.
- **Optimistic UI**: Instant feedback on updates with server synchronization.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Fly.io

## Setup

### Prerequisites
- Node.js 18+
- A Supabase project

### Installation

1. **Clone & Install**
   ```bash
   git clone <repo-url>
   cd xmas-molesto
   npm install
   ```

2. **Environment Variables**
   Create `.env.local`:
   ```env
   SUPABASE_URL=your_project_url
   SUPABASE_SERVICE_KEY=your_service_role_key
   ```

3. **Database**
   Run the contents of `schema.sql` in your Supabase SQL Editor to create tables, policies, and seed initial data.

4. **Run**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`.

## Deployment

Deploy to Fly.io:

```bash
fly launch # Initial setup
fly secrets set SUPABASE_URL=... SUPABASE_SERVICE_KEY=...
fly deploy
```
