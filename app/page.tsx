'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tournament } from '@/app/lib/types';
import { useAuth } from '@/app/components/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const res = await fetch('/api/tournaments');
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setTournaments(json);
      } catch (error) {
        console.error('Failed to fetch tournaments', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-zinc-500">Loading tournaments...</div>;
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-3xl mx-auto space-y-8 pb-20 font-(family-name:--font-geist-sans)">
      <section className="space-y-6">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-2xl font-bold">Tournaments</h2>
          {user && (
            <Link
              href="/tournaments/new"
              className="px-4 py-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              + New Tournament
            </Link>
          )}
        </div>
        {tournaments.length === 0 ? (
          <p className="text-zinc-500 text-center py-8">No tournaments yet.</p>
        ) : (
          <div className="space-y-3">
            {tournaments.map(tournament => (
              <Link
                key={tournament.id}
                href={`/tournaments/${tournament.id}`}
                className="block bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
              >
                <h3 className="font-semibold text-lg">{tournament.name}</h3>
                <p className="text-sm text-zinc-500">
                  Created {new Date(tournament.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="text-center text-zinc-500 pt-8 pb-8 border-t border-zinc-200 dark:border-zinc-800 text-sm">
        <p>Good luck!</p>
      </footer>
    </div>
  );
}
