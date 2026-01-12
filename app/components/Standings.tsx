'use client';

import { Player, Match } from '@/app/lib/types';
import { calculateStandings } from '@/app/lib/logic';
import { getLichessProfileUrl, getLichessChallengeUrl } from '@/app/lib/lichess';

interface StandingsProps {
  players: Player[];
  matches: Match[];
}

export function Standings({ players, matches }: StandingsProps) {
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

            return (
              <tr key={stat.playerId} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                <td className="px-4 py-3 text-zinc-500">{index + 1}</td>
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <a
                      href={player ? getLichessProfileUrl(player.id) : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline hover:text-blue-500"
                    >
                      {player?.id}
                    </a>
                    {player && (
                      <a
                        href={getLichessChallengeUrl(player.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-400 hover:text-orange-500 no-underline"
                        title="Challenge to a game"
                      >
                        ⚔️
                      </a>
                    )}
                  </div>
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

