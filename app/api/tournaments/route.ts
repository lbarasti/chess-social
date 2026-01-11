import { NextResponse } from 'next/server';
import { getTournaments, createTournament } from '@/app/lib/db';

export async function GET() {
  const tournaments = await getTournaments();
  return NextResponse.json(tournaments);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, rounds, players } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Tournament name is required' }, { status: 400 });
    }

    if (type !== 'round-robin') {
      return NextResponse.json({ error: 'Only round-robin tournaments are supported' }, { status: 400 });
    }

    if (!rounds || rounds < 1 || rounds > 4) {
      return NextResponse.json({ error: 'Rounds must be between 1 and 4' }, { status: 400 });
    }

    if (!Array.isArray(players) || players.length < 2) {
      return NextResponse.json({ error: 'At least 2 players are required' }, { status: 400 });
    }

    if (players.length > 20) {
      return NextResponse.json({ error: 'Maximum 20 players allowed' }, { status: 400 });
    }

    for (const player of players) {
      if (!player.name || !player.lichessUsername) {
        return NextResponse.json({ error: 'Each player must have a name and Lichess username' }, { status: 400 });
      }
    }

    const tournament = await createTournament({ name, players, rounds });

    if (!tournament) {
      return NextResponse.json({ error: 'Failed to create tournament' }, { status: 500 });
    }

    return NextResponse.json(tournament, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
