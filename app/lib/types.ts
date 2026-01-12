export type Player = {
  id: string; // Lichess username
};

// Lichess challenge configuration types
export type ChessVariant =
  | 'standard'
  | 'chess960'
  | 'crazyhouse'
  | 'antichess'
  | 'atomic'
  | 'horde'
  | 'kingOfTheHill'
  | 'racingKings'
  | 'threeCheck'
  | 'fromPosition';

export type ChallengeColor = 'white' | 'black' | 'random';

export type ChallengeRule = 'noAbort' | 'noRematch' | 'noGiveTime' | 'noClaimWin' | 'noEarlyDraw';

// Time control: either real-time clock, correspondence days, or unlimited
export type TimeControl =
  | { type: 'clock'; limit: number; increment: number } // limit: 0-10800 seconds, increment: 0-60 seconds
  | { type: 'correspondence'; days: 1 | 2 | 3 | 5 | 7 | 10 | 14 }
  | { type: 'unlimited' };

// Challenge settings for a tournament (used when issuing Lichess challenges)
export type ChallengeSettings = {
  timeControl: TimeControl;
  rated: boolean;
  variant: ChessVariant;
  rules?: ChallengeRule[];
};

export type Tournament = {
  id: string;
  name: string;
  creatorId?: string; // Lichess username of the creator
  createdAt: string;
  challengeSettings?: ChallengeSettings; // Optional Lichess challenge configuration
  playerIds?: string[]; // Player IDs (lichess usernames) - only included in list view
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
