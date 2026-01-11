import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get('term');

  if (!term || term.length < 2) {
    return NextResponse.json({ result: [] });
  }

  try {
    const response = await fetch(
      `https://lichess.org/api/player/autocomplete?term=${encodeURIComponent(term)}&object=1`
    );

    if (!response.ok) {
      return NextResponse.json({ result: [] });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Lichess autocomplete error:', error);
    return NextResponse.json({ result: [] });
  }
}
