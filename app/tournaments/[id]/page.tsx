'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { Standings } from '@/app/components/Standings';
import { MatchList } from '@/app/components/MatchList';
import { TournamentWithMatches, MatchResult } from '@/app/lib/types';
import { useAuth } from '@/app/components/AuthContext';

export default function TournamentPage() {
  const params = useParams();
  const id = params.id as string;
  const { user, getAccessToken } = useAuth();

  const [data, setData] = useState<TournamentWithMatches | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [challengeStatus, setChallengeStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/tournaments/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch tournament', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const { upcomingMatches, completedMatches, isTournamentComplete } = useMemo(() => {
    if (!data) return { upcomingMatches: [], completedMatches: [], isTournamentComplete: false };

    const upcoming = data.matches.filter(m => !m.result);
    const completed = data.matches.filter(m => m.result);
    const isComplete = data.matches.length > 0 && upcoming.length === 0;

    return { upcomingMatches: upcoming, completedMatches: completed, isTournamentComplete: isComplete };
  }, [data]);

  const handleUpdateMatch = async (matchId: string, result: MatchResult, gameLink?: string) => {
    // Optimistic update
    if (data) {
      setData({
        ...data,
        matches: data.matches.map(m =>
          m.id === matchId ? { ...m, result, gameLink } : m
        ),
      });
    }

    try {
      const res = await fetch('/api/matches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: matchId, result, gameLink }),
      });

      if (!res.ok) {
        fetchData(); // Revert on failure
        throw new Error('Failed to update');
      }
    } catch (err) {
      console.error('Failed to update match', err);
      fetchData(); // Revert
    }
  };

  const handleChallenge = async (matchId: string, opponentId: string, userColor: 'white' | 'black') => {
    setChallengeStatus(null);

    const token = await getAccessToken();
    if (!token) {
      setChallengeStatus({ type: 'error', message: 'You must be logged in to challenge' });
      return;
    }

    try {
      const res = await fetch('/api/lichess/challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          opponent: opponentId,
          color: userColor,
          settings: data?.challengeSettings,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setChallengeStatus({ type: 'error', message: result.error || 'Failed to create challenge' });
        return;
      }

      // Open the challenge URL in a new tab and save it as the game link
      if (result.url) {
        window.open(result.url, '_blank');
        setChallengeStatus({ type: 'success', message: `Challenge sent to ${opponentId}!` });

        // Find the match and update its game link
        const match = data?.matches.find(m => m.id === matchId);
        if (match) {
          await handleUpdateMatch(matchId, match.result, result.url);
        }
      }
    } catch (err) {
      console.error('Challenge error:', err);
      setChallengeStatus({ type: 'error', message: 'Failed to create challenge' });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-zinc-500">Loading tournament...</div>;
  }

  if (error || !data) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Tournament not found.</div>;
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-3xl mx-auto space-y-12 pb-20 font-[family-name:var(--font-geist-sans)]">
      <header className="text-center space-y-4 pt-8">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          &larr; All Tournaments
        </Link>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {data.name}
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Double Round Robin • {data.players.length} Players
          {data.creatorId && (
            <> • Created by <a
              href={`https://lichess.org/@/${data.creatorId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              {data.creatorId}
            </a></>
          )}
        </p>
      </header>

      {isTournamentComplete && (
        <div className="flex items-center justify-center gap-2 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-400">
          <Trophy size={20} />
          <span className="font-semibold">Tournament Complete</span>
        </div>
      )}

      <section className="space-y-6">
        <h2 className="text-2xl font-bold px-1">{isTournamentComplete ? 'Final Standings' : 'Standings'}</h2>
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <Standings players={data.players} matches={data.matches} isComplete={isTournamentComplete} />
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold px-1">Matches</h2>
        {challengeStatus && (
          <div
            className={`p-3 rounded-lg text-sm ${
              challengeStatus.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}
          >
            {challengeStatus.message}
          </div>
        )}

        {upcomingMatches.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-zinc-600 dark:text-zinc-400 px-1">Upcoming</h3>
            <MatchList
              matches={upcomingMatches}
              currentUserId={user?.id}
              onUpdateMatch={handleUpdateMatch}
              onChallenge={handleChallenge}
            />
          </div>
        )}

        {completedMatches.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-zinc-600 dark:text-zinc-400 px-1">Completed</h3>
            <MatchList
              matches={completedMatches}
              currentUserId={user?.id}
              onUpdateMatch={handleUpdateMatch}
              onChallenge={handleChallenge}
            />
          </div>
        )}

        {upcomingMatches.length === 0 && completedMatches.length === 0 && (
          <p className="text-zinc-500 text-center py-8">No matches yet.</p>
        )}
      </section>

      <footer className="text-center text-zinc-500 pt-8 pb-8 border-t border-zinc-200 dark:border-zinc-800 text-sm">
        <p>Good luck!</p>
      </footer>
    </div>
  );
}
