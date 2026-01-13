import { createClient } from '@supabase/supabase-js';
import { Player, Match, Tournament, TournamentWithMatches, MatchResult, ChallengeSettings } from './types';
import { isValidLichessGameLink } from './lichess';

// Database row types (snake_case)
type DbTournament = {
  id: string;
  name: string;
  creator_id: string | null;
  created_at: string;
  challenge_settings: ChallengeSettings | null;
  player_ids: string[] | null;
  is_complete: boolean;
};

type DbPlayer = {
  id: string;
};

type DbMatch = {
  id: string;
  tournament_id: string;
  white: string;
  black: string;
  result: MatchResult;
  game_link: string | null;
};

// Server-only environment variables (no NEXT_PUBLIC_ prefix)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

// Create client only on the server
export const supabase = (typeof window === 'undefined' && supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export type GetTournamentsOptions = {
  limit?: number;
  offset?: number;
  userId?: string; // Filter to tournaments where user is creator or player
};

export async function getTournaments(options: GetTournamentsOptions = {}): Promise<Tournament[]> {
  if (!supabase) {
    console.error('Supabase credentials missing on server');
    return [];
  }

  const { limit = 10, offset = 0, userId } = options;

  let query = supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (userId) {
    // Tournaments where user is creator OR in player_ids array
    query = query.or(`creator_id.eq.${userId},player_ids.cs.{${userId}}`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching tournaments:', error);
    return [];
  }

  return (data || []).map((t: DbTournament) => ({
    id: t.id,
    name: t.name,
    creatorId: t.creator_id ?? undefined,
    createdAt: t.created_at,
    challengeSettings: t.challenge_settings ?? undefined,
    playerIds: t.player_ids ?? [],
    isComplete: t.is_complete,
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
  (matches || []).forEach((m: DbMatch) => {
    playerIds.add(m.white);
    playerIds.add(m.black);
  });

  // Fetch only the players in this tournament
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('*')
    .in('id', Array.from(playerIds));

  if (playersError) console.error('Error fetching players:', playersError);

  // Map players
  const mappedPlayers: Player[] = (players || []).map((p: DbPlayer) => ({
    id: p.id,
  }));

  // Validate game links and collect invalid ones for cleanup
  const invalidLinkMatchIds: string[] = [];
  const mappedMatches: Match[] = (matches || []).map((m: DbMatch) => {
    const hasInvalidLink = m.game_link && !isValidLichessGameLink(m.game_link);
    if (hasInvalidLink) {
      invalidLinkMatchIds.push(m.id);
    }
    return {
      id: m.id,
      tournamentId: m.tournament_id,
      white: m.white,
      black: m.black,
      result: m.result,
      gameLink: hasInvalidLink ? undefined : (m.game_link ?? undefined),
    };
  });

  // Reset invalid links in the database (fire and forget)
  if (invalidLinkMatchIds.length > 0 && supabase) {
    supabase
      .from('matches')
      .update({ game_link: null })
      .in('id', invalidLinkMatchIds)
      .then(({ error }) => {
        if (error) console.error('Error resetting invalid game links:', error);
      });
  }

  return {
    id: tournament.id,
    name: tournament.name,
    creatorId: tournament.creator_id ?? undefined,
    createdAt: tournament.created_at,
    challengeSettings: tournament.challenge_settings ?? undefined,
    players: mappedPlayers,
    matches: mappedMatches,
  };
}

export type CreateTournamentInput = {
  name: string;
  players: { lichessUsername: string }[];
  rounds: number;
  creatorId: string;
  challengeSettings?: ChallengeSettings;
};

export async function createTournament(input: CreateTournamentInput): Promise<Tournament | null> {
  if (!supabase) {
    console.error('Supabase credentials missing on server');
    return null;
  }

  const { name, players, rounds, creatorId, challengeSettings } = input;
  const playerIds = players.map(p => p.lichessUsername.toLowerCase());

  // 1. Create tournament with player IDs
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .insert({
      name,
      creator_id: creatorId,
      challenge_settings: challengeSettings ?? null,
      player_ids: playerIds,
    })
    .select()
    .single();

  if (tournamentError || !tournament) {
    console.error('Error creating tournament:', tournamentError);
    return null;
  }

  // 2. Upsert players (create if not exists, based on lichess username as ID)
  const { error: playersError } = await supabase
    .from('players')
    .upsert(playerIds.map(id => ({ id })), { onConflict: 'id' });

  if (playersError) {
    console.error('Error upserting players:', playersError);
    // Continue anyway - players might already exist
  }

  // 3. Generate round-robin matches
  const matches = generateRoundRobinMatches(tournament.id, playerIds, rounds);

  const { error: matchesError } = await supabase.from('matches').insert(matches);

  if (matchesError) {
    console.error('Error creating matches:', matchesError);
    return null;
  }

  return {
    id: tournament.id,
    name: tournament.name,
    creatorId: tournament.creator_id,
    createdAt: tournament.created_at,
    challengeSettings: tournament.challenge_settings ?? undefined,
    playerIds,
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

  const updates: { result: MatchResult; game_link?: string } = { result };
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

  // Update tournament completion status
  const tournamentId = data.tournament_id;
  const { count: incompleteMatches } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId)
    .is('result', null);

  const isComplete = incompleteMatches === 0;
  await supabase
    .from('tournaments')
    .update({ is_complete: isComplete })
    .eq('id', tournamentId);

  return {
    id: data.id,
    tournamentId: data.tournament_id,
    white: data.white,
    black: data.black,
    result: data.result,
    gameLink: data.game_link,
  } as Match;
}

export async function isUserInMatchTournament(matchId: string, userId: string): Promise<boolean> {
  if (!supabase) return false;

  // Get the match to find its tournament
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('tournament_id')
    .eq('id', matchId)
    .single();

  if (matchError || !match) return false;

  // Get the tournament to check player_ids
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('player_ids')
    .eq('id', match.tournament_id)
    .single();

  if (tournamentError || !tournament) return false;

  return tournament.player_ids?.includes(userId) ?? false;
}

export async function deleteTournament(id: string, creatorId: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Database not available' };
  }

  // Verify the tournament exists and belongs to the creator
  const { data: tournament, error: fetchError } = await supabase
    .from('tournaments')
    .select('creator_id')
    .eq('id', id)
    .single();

  if (fetchError || !tournament) {
    return { success: false, error: 'Tournament not found' };
  }

  if (tournament.creator_id !== creatorId) {
    return { success: false, error: 'Not authorized to delete this tournament' };
  }

  // Delete the tournament (matches cascade automatically)
  const { error: tournamentError } = await supabase
    .from('tournaments')
    .delete()
    .eq('id', id);

  if (tournamentError) {
    console.error('Error deleting tournament:', tournamentError);
    return { success: false, error: 'Failed to delete tournament' };
  }

  return { success: true };
}
