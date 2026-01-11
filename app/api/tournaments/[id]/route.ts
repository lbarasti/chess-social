import { NextResponse } from 'next/server';
import { getTournament, deleteTournament } from '@/app/lib/db';

const LICHESS_HOST = 'https://lichess.org';

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tournament = await getTournament(id);

  if (!tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }

  return NextResponse.json(tournament);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const result = await deleteTournament(id, lichessUser.id);

  if (!result.success) {
    const status = result.error === 'Not authorized to delete this tournament' ? 403 :
                   result.error === 'Tournament not found' ? 404 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ success: true });
}
