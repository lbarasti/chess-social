'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Standings } from '@/app/components/Standings';
import { MatchList } from '@/app/components/MatchList';
import { TournamentWithMatches, MatchResult } from '@/app/lib/types';

export default function TournamentPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<TournamentWithMatches | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
        </p>
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold px-1">Standings</h2>
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <Standings players={data.players} matches={data.matches} />
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold px-1">Matches</h2>
        <MatchList
          players={data.players}
          matches={data.matches}
          onUpdateMatch={handleUpdateMatch}
        />
      </section>

      <footer className="text-center text-zinc-500 pt-8 pb-8 border-t border-zinc-200 dark:border-zinc-800 text-sm">
        <p>Good luck!</p>
      </footer>
    </div>
  );
}
