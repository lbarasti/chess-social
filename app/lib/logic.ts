import { Match, Player } from './types';

export type PlayerStats = {
  playerId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
};

export function calculateStandings(players: Player[], matches: Match[]): PlayerStats[] {
  const stats: Record<string, PlayerStats> = {};
  
  players.forEach(p => {
    stats[p.id] = { playerId: p.id, played: 0, won: 0, drawn: 0, lost: 0, points: 0 };
  });
  
  matches.forEach(m => {
    if (!m.result) return;
    
    // Handle '1-0', '0-1', '0.5-0.5'
    const parts = m.result.split('-');
    const whiteScore = Number(parts[0]);
    const blackScore = Number(parts[1]);
    
    stats[m.white].played++;
    stats[m.black].played++;
    
    if (whiteScore > blackScore) {
      stats[m.white].won++;
      stats[m.white].points += 1;
      stats[m.black].lost++;
    } else if (blackScore > whiteScore) {
      stats[m.black].won++;
      stats[m.black].points += 1;
      stats[m.white].lost++;
    } else {
      // Draw
      stats[m.white].drawn++;
      stats[m.white].points += 0.5;
      stats[m.black].drawn++;
      stats[m.black].points += 0.5;
    }
  });
  
  return Object.values(stats).sort((a, b) => b.points - a.points);
}

