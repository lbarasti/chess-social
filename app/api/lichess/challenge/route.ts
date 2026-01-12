import { NextResponse } from 'next/server';
import { LICHESS_HOST } from '@/app/lib/lichess';
import { ChallengeSettings } from '@/app/lib/types';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const body = await request.json();
    const { opponent, color, settings } = body as {
      opponent: string;
      color?: 'white' | 'black';
      settings: ChallengeSettings;
    };

    if (!opponent) {
      return NextResponse.json({ error: 'Opponent username required' }, { status: 400 });
    }

    // Build form data for Lichess API
    const params = new URLSearchParams();

    // Time control
    if (settings?.timeControl) {
      if (settings.timeControl.type === 'clock') {
        params.set('clock.limit', String(settings.timeControl.limit));
        params.set('clock.increment', String(settings.timeControl.increment));
      } else if (settings.timeControl.type === 'correspondence') {
        params.set('days', String(settings.timeControl.days));
      }
      // unlimited: no time params needed
    }

    // Color (from match pairing)
    if (color) {
      params.set('color', color);
    }

    // Other settings
    params.set('rated', String(settings?.rated ?? false));
    if (settings?.variant) {
      params.set('variant', settings.variant);
    }
    if (settings?.rules && settings.rules.length > 0) {
      params.set('rules', settings.rules.join(','));
    }

    const res = await fetch(`${LICHESS_HOST}/api/challenge/${encodeURIComponent(opponent)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token}`,
      },
      body: params,
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to create challenge' },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Challenge API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
