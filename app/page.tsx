'use client';

import { useState, useEffect } from 'react';
import { Standings } from '@/app/components/Standings';
import { MatchList } from '@/app/components/MatchList';
import { Database, MatchResult } from '@/app/lib/types';

export default function Home() {
  const [data, setData] = useState<Database | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/matches');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateMatch = async (id: string, result: MatchResult, gameLink?: string) => {
    // Optimistic update
    if (data) {
      setData({
        ...data,
        matches: data.matches.map(m => 
          m.id === id ? { ...m, result, gameLink } : m
        )
      });
    }

    try {
      const res = await fetch('/api/matches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, result, gameLink }),
      });
      
      if (!res.ok) {
        // Revert on failure
        fetchData();
        throw new Error('Failed to update');
      }
      
      // Ideally we would use the returned data, but fetching again or relying on optimistic is fine for now
      // Let's refetch to be sure we're in sync
      // fetchData(); 
    } catch (error) {
      console.error('Failed to update match', error);
      fetchData(); // Revert
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-zinc-500">Loading tournament data...</div>;
  }

  if (!data) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Error loading data. Please refresh.</div>;
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-3xl mx-auto space-y-12 pb-20 font-[family-name:var(--font-geist-sans)]">
      <header className="text-center space-y-4 pt-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          XMAS Molesto Chess
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Double Round Robin • 4 Players
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
