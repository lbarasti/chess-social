export type Player = {
  id: string;
  name: string;
  lichessUrl: string;
};

export type MatchResult = '1-0' | '0-1' | '0.5-0.5' | null;

export type Match = {
  id: string;
  white: string; // player id
  black: string; // player id
  result: MatchResult;
  gameLink?: string; // Optional link to the game
  round?: number;
};

export type Database = {
  players: Player[];
  matches: Match[];
};
