'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { Tournament } from '@/app/lib/types';
import { useAuth } from '@/app/components/AuthContext';

function TournamentCard({
  tournament,
  canDelete,
  deleting,
  onDelete,
}: {
  tournament: Tournament;
  canDelete: boolean;
  deleting: boolean;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/tournaments/${tournament.id}`)}
      className="cursor-pointer bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{tournament.name}</h3>
          <p className="text-sm text-zinc-500">
            Created {new Date(tournament.createdAt).toLocaleDateString()}
            {tournament.creatorId && (
              <> by <a
                href={`https://lichess.org/@/${tournament.creatorId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-700 dark:hover:text-zinc-300"
                onClick={(e) => e.stopPropagation()}
              >
                {tournament.creatorId}
              </a></>
            )}
          </p>
        </div>
        {canDelete && (
          <button
            onClick={onDelete}
            disabled={deleting}
            className="p-2 text-zinc-400 hover:text-red-500 disabled:opacity-50"
            title="Delete tournament"
          >
            {deleting ? (
              <span className="text-sm">...</span>
            ) : (
              <Trash2 size={18} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function TournamentList({
  tournaments,
  title,
  userId,
  deleting,
  onDelete,
}: {
  tournaments: Tournament[];
  title: string;
  userId?: string;
  deleting: string | null;
  onDelete: (e: React.MouseEvent, tournamentId: string, tournamentName: string) => void;
}) {
  if (tournaments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-zinc-600 dark:text-zinc-400 px-1">{title}</h3>
      {tournaments.map(tournament => (
        <TournamentCard
          key={tournament.id}
          tournament={tournament}
          canDelete={userId === tournament.creatorId}
          deleting={deleting === tournament.id}
          onDelete={(e) => onDelete(e, tournament.id, tournament.name)}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const { user, getAccessToken } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

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

  const { myTournaments, otherTournaments } = useMemo(() => {
    if (!user) {
      return { myTournaments: [], otherTournaments: tournaments };
    }

    const userId = user.id.toLowerCase();
    const mine: Tournament[] = [];
    const others: Tournament[] = [];

    for (const t of tournaments) {
      const isCreator = t.creatorId?.toLowerCase() === userId;
      const isPlayer = t.playerIds?.some(id => id.toLowerCase() === userId);
      if (isCreator || isPlayer) {
        mine.push(t);
      } else {
        others.push(t);
      }
    }

    return { myTournaments: mine, otherTournaments: others };
  }, [user, tournaments]);

  const handleDelete = async (e: React.MouseEvent, tournamentId: string, tournamentName: string) => {
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete "${tournamentName}"? This cannot be undone.`)) {
      return;
    }

    setDeleting(tournamentId);
    try {
      const token = await getAccessToken();
      if (!token) {
        alert('You must be logged in to delete a tournament');
        return;
      }

      const res = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete tournament');
      }

      setTournaments(tournaments.filter(t => t.id !== tournamentId));
    } catch (error) {
      console.error('Failed to delete tournament', error);
      alert(error instanceof Error ? error.message : 'Failed to delete tournament');
    } finally {
      setDeleting(null);
    }
  };

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
        ) : user ? (
          <div className="space-y-6">
            <TournamentList
              tournaments={myTournaments}
              title="My tournaments"
              userId={user.id}
              deleting={deleting}
              onDelete={handleDelete}
            />
            <TournamentList
              tournaments={otherTournaments}
              title="Other tournaments"
              userId={user.id}
              deleting={deleting}
              onDelete={handleDelete}
            />
            {myTournaments.length === 0 && otherTournaments.length === 0 && (
              <p className="text-zinc-500 text-center py-8">No tournaments yet.</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {tournaments.map(tournament => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                canDelete={false}
                deleting={false}
                onDelete={() => {}}
              />
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
