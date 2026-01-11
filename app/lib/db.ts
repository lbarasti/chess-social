import { createClient } from '@supabase/supabase-js';
import { Player, Match, Tournament, TournamentWithMatches } from './types';

// Server-only environment variables (no NEXT_PUBLIC_ prefix)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

// Create client only on the server
export const supabase = (typeof window === 'undefined' && supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function getPlayers(): Promise<Player[]> {
  if (!supabase) {
    console.error('Supabase credentials missing on server');
    return [];
  }

  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching players:', error);
    return [];
  }

  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    lichessUrl: p.lichess_url,
  }));
}

export async function getTournaments(): Promise<Tournament[]> {
  if (!supabase) {
    console.error('Supabase credentials missing on server');
    return [];
  }

  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tournaments:', error);
    return [];
  }

  return (data || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    createdAt: t.created_at,
  }));
}

export async function getTournament(id: string): Promise<TournamentWithMatches | null> {
  if (!supabase) {
    console.error('Supabase credentials missing on server');
    return null;
  }

  // Fetch tournament
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single();

  if (tournamentError || !tournament) {
    console.error('Error fetching tournament:', tournamentError);
    return null;
  }

  // Fetch matches for this tournament
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', id)
    .order('id', { ascending: true });

  if (matchesError) console.error('Error fetching matches:', matchesError);

  // Get unique player IDs from matches
  const playerIds = new Set<string>();
  (matches || []).forEach((m: any) => {
    playerIds.add(m.white);
    playerIds.add(m.black);
  });

  // Fetch only the players in this tournament
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('*')
    .in('id', Array.from(playerIds));

  if (playersError) console.error('Error fetching players:', playersError);

  // Map DB snake_case to app camelCase
  const mappedPlayers = (players || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    lichessUrl: p.lichess_url || p.lichessUrl,
  }));

  const mappedMatches = (matches || []).map((m: any) => ({
    id: m.id,
    tournamentId: m.tournament_id,
    white: m.white,
    black: m.black,
    result: m.result,
    gameLink: m.game_link || m.gameLink,
  }));

  return {
    id: tournament.id,
    name: tournament.name,
    createdAt: tournament.created_at,
    players: mappedPlayers as Player[],
    matches: mappedMatches as Match[],
  };
}

export type CreateTournamentInput = {
  name: string;
  players: { name: string; lichessUsername: string }[];
  rounds: number;
};

export async function createTournament(input: CreateTournamentInput): Promise<Tournament | null> {
  if (!supabase) {
    console.error('Supabase credentials missing on server');
    return null;
  }

  const { name, players, rounds } = input;

  // 1. Create tournament
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .insert({ name })
    .select()
    .single();

  if (tournamentError || !tournament) {
    console.error('Error creating tournament:', tournamentError);
    return null;
  }

  // 2. Upsert players (create if not exists, based on lichess username as ID)
  const playerRecords = players.map(p => ({
    id: p.lichessUsername.toLowerCase(),
    name: p.name,
    lichess_url: `https://lichess.org/@/${p.lichessUsername}`,
  }));

  const { error: playersError } = await supabase
    .from('players')
    .upsert(playerRecords, { onConflict: 'id' });

  if (playersError) {
    console.error('Error upserting players:', playersError);
    // Continue anyway - players might already exist
  }

  // 3. Generate round-robin matches
  const playerIds = playerRecords.map(p => p.id);
  const matches = generateRoundRobinMatches(tournament.id, playerIds, rounds);

  const { error: matchesError } = await supabase.from('matches').insert(matches);

  if (matchesError) {
    console.error('Error creating matches:', matchesError);
    return null;
  }

  return {
    id: tournament.id,
    name: tournament.name,
    createdAt: tournament.created_at,
  };
}

function generateRoundRobinMatches(
  tournamentId: string,
  playerIds: string[],
  rounds: number
): { id: string; tournament_id: string; white: string; black: string }[] {
  const matches: { id: string; tournament_id: string; white: string; black: string }[] = [];

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        // Alternate colors based on round
        const white = round % 2 === 0 ? playerIds[i] : playerIds[j];
        const black = round % 2 === 0 ? playerIds[j] : playerIds[i];
        matches.push({
          id: crypto.randomUUID(),
          tournament_id: tournamentId,
          white,
          black,
        });
      }
    }
  }

  return matches;
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
    id: data.id,
    tournamentId: data.tournament_id,
    white: data.white,
    black: data.black,
    result: data.result,
    gameLink: data.game_link,
  } as Match;
}
