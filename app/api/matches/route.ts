import { NextResponse } from 'next/server';
import { updateMatch, isUserInMatchTournament } from '@/app/lib/db';
import { LICHESS_HOST, isValidLichessGameLink } from '@/app/lib/lichess';

async function verifyLichessToken(token: string): Promise<{ id: string; username: string } | null> {
  try {
    const res = await fetch(`${LICHESS_HOST}/api/account`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { id: data.id, username: data.username };
  } catch {
    return null;
  }
}

export async function PUT(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const lichessUser = await verifyLichessToken(token);
    if (!lichessUser) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const body = await request.json();
    const { id, result, gameLink } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    // Verify user is a player in the tournament
    const isAuthorized = await isUserInMatchTournament(id, lichessUser.id);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Not authorized to update this match' }, { status: 403 });
    }

    if (result === undefined && gameLink === undefined) {
       return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    // Validate game link if provided
    if (gameLink !== undefined && !isValidLichessGameLink(gameLink)) {
      return NextResponse.json({ error: 'Invalid Lichess game link' }, { status: 400 });
    }

    const updatedMatch = await updateMatch(id, result, gameLink);
    
    if (!updatedMatch) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedMatch);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
