'use client';

import { Player, Match } from '@/app/lib/types';
import { calculateStandings } from '@/app/lib/logic';
import { getLichessProfileUrl } from '@/app/lib/lichess';
import { Trophy } from 'lucide-react';

interface StandingsProps {
  players: Player[];
  matches: Match[];
  isComplete?: boolean;
}

const podiumStyles: Record<number, { bg: string; icon: string }> = {
  0: { bg: 'bg-amber-50 dark:bg-amber-900/20', icon: 'text-amber-500' },
  1: { bg: 'bg-zinc-100 dark:bg-zinc-700/30', icon: 'text-zinc-400' },
  2: { bg: 'bg-orange-50 dark:bg-orange-900/20', icon: 'text-orange-600' },
};

export function Standings({ players, matches, isComplete }: StandingsProps) {
  const standings = calculateStandings(players, matches);

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 dark:border-zinc-800">
          <tr>
            <th className="px-4 py-3 font-medium">Rank</th>
            <th className="px-4 py-3 font-medium">Player</th>
            <th className="px-4 py-3 font-medium text-right">Pld</th>
            <th className="px-4 py-3 font-medium text-right">W</th>
            <th className="px-4 py-3 font-medium text-right">D</th>
            <th className="px-4 py-3 font-medium text-right">L</th>
            <th className="px-4 py-3 font-medium text-right">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {standings.map((stat, index) => {
            const player = players.find(p => p.id === stat.playerId);
            const podium = isComplete && index < 3 ? podiumStyles[index] : null;

            return (
              <tr
                key={stat.playerId}
                className={podium ? podium.bg : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}
              >
                <td className="px-4 py-3 text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    {podium && <Trophy size={14} className={podium.icon} />}
                    {index + 1}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">
                  <a
                    href={player ? getLichessProfileUrl(player.id) : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline hover:text-blue-500"
                  >
                    {player?.id}
                  </a>
                </td>
                <td className="px-4 py-3 text-right text-zinc-500">{stat.played}</td>
                <td className="px-4 py-3 text-right text-green-600 dark:text-green-500">{stat.won}</td>
                <td className="px-4 py-3 text-right text-zinc-500">{stat.drawn}</td>
                <td className="px-4 py-3 text-right text-red-600 dark:text-red-500">{stat.lost}</td>
                <td className="px-4 py-3 text-right font-bold">{stat.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

