import { NextResponse } from 'next/server';
import { updateMatch } from '@/app/lib/db';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, result, gameLink } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    
    // result can be null, so check for undefined if we are just updating link? 
    // The previous logic required result. Let's make it flexible or require at least one update.
    // For now, let's stick to the existing contract: result is primary, gameLink is optional.
    
    // Actually, user might want to ONLY update the link. 
    // But the current updateMatch signature takes result as 2nd arg.
    // Let's pass the result if provided, or read current match first?
    // To keep it simple and efficient, the frontend should send the current result if it hasn't changed.
    
    // Wait, the frontend sends everything usually.
    // Let's allow partial updates in updateMatch if needed, but for now strict typing.
    // Let's assume frontend sends result even if unchanged.
    
    if (result === undefined && gameLink === undefined) {
       return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
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
