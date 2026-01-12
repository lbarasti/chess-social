# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chess social is a chess tournament manager for multi-round round-robin tournaments with up to 20 players. It provides live standings, match management with result tracking, and Lichess integration.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19, TypeScript)
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Fly.io

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Lint code
npm run lint
```

## Architecture

### Data Flow

1. **Server-Side Data Fetching**: The main page (`app/page.tsx`) is a client component that fetches data from the API route on mount
2. **API Layer**: `/api/matches` route handles both GET (fetch all data) and PUT (update match) requests
3. **Database Layer**: `app/lib/db.ts` provides server-only Supabase client and data access functions
4. **Optimistic UI**: Match updates are applied immediately in the UI, with server sync and revert on failure

### Key Files

- **`app/lib/types.ts`**: Core TypeScript types (`Player`, `Match`, `MatchResult`, `Database`)
- **`app/lib/logic.ts`**: Business logic for calculating tournament standings from match results
- **`app/lib/db.ts`**: Supabase client and data access layer (server-only)
  - `getDb()`: Fetches all players and matches, maps snake_case DB fields to camelCase
  - `updateMatch()`: Updates match result and/or game link
- **`app/api/matches/route.ts`**: API endpoints for GET (all data) and PUT (update match)
- **`app/components/Standings.tsx`**: Displays tournament standings table with player links and challenge shortcuts
- **`app/components/MatchList.tsx`**: Interactive match cards with result buttons and game link editing

### Database Schema

Tables:
- `tournaments` (id, name, creator_id, created_at)
- `players` (id) - stores Lichess usernames
- `matches` (id, tournament_id, white, black, result, game_link) - cascades on tournament delete

- Match results use string format: `'1-0'`, `'0-1'`, `'0.5-0.5'`, or `null`
- Database uses snake_case (e.g., `game_link`), mapped to camelCase in the app
- Lichess profile URLs are computed from usernames using `getLichessProfileUrl()` in `app/lib/lichess.ts`
- Initial schema and seed data in `schema.sql`

### Configuration

- **Environment Variables**: `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` required in `.env.local`
- **TypeScript**: Path alias `@/*` maps to project root
- **ESLint**: Uses Next.js recommended configs for core-web-vitals and TypeScript

## Important Patterns

- The Supabase client in `db.ts` is server-only (check for `typeof window === 'undefined'`)
- All database field mapping between snake_case and camelCase happens in `getDb()` and `updateMatch()`
- Client components use the `/api/matches` route; never import `db.ts` directly in client code
- Optimistic updates in `page.tsx` provide instant feedback while syncing with the server
