import { createClient } from '@supabase/supabase-js';
import { Database, Player, Match } from './types';

// Server-only environment variables (no NEXT_PUBLIC_ prefix)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

// Create client only on the server
export const supabase = (typeof window === 'undefined' && supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function getDb(): Promise<Database> {
  if (!supabase) {
    // Return empty state or error if called on client or missing config
    if (typeof window !== 'undefined') {
       console.error('getDb called on client side - this is not allowed in server-only mode');
    } else {
       console.error('Supabase credentials missing on server');
    }
    return { players: [], matches: [] };
  }

  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('*');
    
  if (playersError) console.error('Error fetching players:', playersError);

  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('*')
    .order('id', { ascending: true });

  if (matchesError) console.error('Error fetching matches:', matchesError);

  // Map DB snake_case to app camelCase
  const mappedPlayers = (players || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    lichessUrl: p.lichess_url || p.lichessUrl
  }));

  const mappedMatches = (matches || []).map((m: any) => ({
    id: m.id,
    white: m.white,
    black: m.black,
    result: m.result,
    gameLink: m.game_link || m.gameLink
  }));

  const sortedMatches = mappedMatches.sort((a: any, b: any) => {
    return parseInt(a.id) - parseInt(b.id);
  });

  return {
    players: mappedPlayers as Player[],
    matches: sortedMatches as Match[],
  };
}

export async function updateMatch(
  matchId: string, 
  result: '1-0' | '0-1' | '0.5-0.5' | null, 
  gameLink?: string
): Promise<Match | null> {
  if (!supabase) return null;

  const updates: any = { result };
  if (gameLink !== undefined) {
    updates.game_link = gameLink;
  }

  const { data, error } = await supabase
    .from('matches')
    .update(updates)
    .eq('id', matchId)
    .select()
    .single();

  if (error) {
    console.error('Error updating match:', error);
    return null;
  }

  return {
    ...data,
    gameLink: data.game_link 
  } as Match;
}
