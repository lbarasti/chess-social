export type Player = {
  id: string;
  name: string;
  lichessUrl: string;
};

export type Tournament = {
  id: string;
  name: string;
  creatorId?: string; // Lichess username of the creator
  createdAt: string;
};

export type MatchResult = '1-0' | '0-1' | '0.5-0.5' | null;

export type Match = {
  id: string;
  tournamentId: string;
  white: string; // player id
  black: string; // player id
  result: MatchResult;
  gameLink?: string; // Optional link to the game
};

export type TournamentWithMatches = Tournament & {
  players: Player[];
  matches: Match[];
};

// Lichess OAuth types
export type LichessUser = {
  id: string;
  username: string;
  perfs?: Record<string, unknown>;
};
