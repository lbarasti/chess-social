'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Trophy } from 'lucide-react';
import { Tournament } from '@/app/lib/types';
import { useAuth } from '@/app/components/AuthContext';

const PAGE_SIZE = 10;

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
          <h3 className="font-semibold text-lg flex items-center gap-2">
            {tournament.name}
            {tournament.isComplete && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                <Trophy size={12} />
                Complete
              </span>
            )}
          </h3>
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

function LoadMoreButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-50"
    >
      {loading ? 'Loading...' : 'Load more'}
    </button>
  );
}

export default function Home() {
  const { user, loading: authLoading, getAccessToken } = useAuth();
  const [deleting, setDeleting] = useState<string | null>(null);

  // For logged-in users: separate lists
  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
  const [otherTournaments, setOtherTournaments] = useState<Tournament[]>([]);
  const [myHasMore, setMyHasMore] = useState(true);
  const [otherHasMore, setOtherHasMore] = useState(true);
  const [myLoading, setMyLoading] = useState(false);
  const [otherLoading, setOtherLoading] = useState(false);
  const [otherOffset, setOtherOffset] = useState(0);

  // For non-logged-in users: single list
  const [allTournaments, setAllTournaments] = useState<Tournament[]>([]);
  const [allHasMore, setAllHasMore] = useState(true);
  const [allLoading, setAllLoading] = useState(false);

  const [initialLoading, setInitialLoading] = useState(true);

  const fetchTournaments = useCallback(async (
    params: { userId?: string; offset: number }
  ): Promise<Tournament[]> => {
    const searchParams = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(params.offset),
    });
    if (params.userId) searchParams.set('userId', params.userId);

    const res = await fetch(`/api/tournaments?${searchParams}`);
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  }, []);

  const isUserTournament = useCallback((tournament: Tournament, userId: string) => {
    const id = userId.toLowerCase();
    return tournament.creatorId?.toLowerCase() === id ||
      tournament.playerIds?.some(p => p.toLowerCase() === id);
  }, []);

  // Initial load when auth state is known
  useEffect(() => {
    if (authLoading) return;

    const loadInitial = async () => {
      setInitialLoading(true);
      try {
        if (user) {
          const [my, all] = await Promise.all([
            fetchTournaments({ userId: user.id, offset: 0 }),
            fetchTournaments({ offset: 0 }),
          ]);
          setMyTournaments(my);
          const other = all.filter(t => !isUserTournament(t, user.id));
          setOtherTournaments(other);
          setMyHasMore(my.length === PAGE_SIZE);
          setOtherHasMore(all.length === PAGE_SIZE);
        } else {
          const all = await fetchTournaments({ offset: 0 });
          setAllTournaments(all);
          setAllHasMore(all.length === PAGE_SIZE);
        }
      } catch (error) {
        console.error('Failed to fetch tournaments', error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadInitial();
  }, [authLoading, user, fetchTournaments, isUserTournament]);

  const loadMoreMy = async () => {
    if (!user || myLoading) return;
    setMyLoading(true);
    try {
      const more = await fetchTournaments({ userId: user.id, offset: myTournaments.length });
      setMyTournaments([...myTournaments, ...more]);
      setMyHasMore(more.length === PAGE_SIZE);
    } catch (error) {
      console.error('Failed to load more', error);
    } finally {
      setMyLoading(false);
    }
  };

  const loadMoreOther = async () => {
    if (!user || otherLoading) return;
    setOtherLoading(true);
    try {
      const newOffset = otherOffset + PAGE_SIZE;
      const more = await fetchTournaments({ offset: newOffset });
      const filtered = more.filter(t => !isUserTournament(t, user.id));
      setOtherTournaments([...otherTournaments, ...filtered]);
      setOtherOffset(newOffset);
      setOtherHasMore(more.length === PAGE_SIZE);
    } catch (error) {
      console.error('Failed to load more', error);
    } finally {
      setOtherLoading(false);
    }
  };

  const loadMoreAll = async () => {
    if (allLoading) return;
    setAllLoading(true);
    try {
      const more = await fetchTournaments({ offset: allTournaments.length });
      setAllTournaments([...allTournaments, ...more]);
      setAllHasMore(more.length === PAGE_SIZE);
    } catch (error) {
      console.error('Failed to load more', error);
    } finally {
      setAllLoading(false);
    }
  };

  const handleDelete = async (
    e: React.MouseEvent,
    tournamentId: string,
    tournamentName: string,
    listType: 'my' | 'other' | 'all'
  ) => {
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

      if (listType === 'my') {
        setMyTournaments(myTournaments.filter(t => t.id !== tournamentId));
      } else if (listType === 'other') {
        setOtherTournaments(otherTournaments.filter(t => t.id !== tournamentId));
      } else {
        setAllTournaments(allTournaments.filter(t => t.id !== tournamentId));
      }
    } catch (error) {
      console.error('Failed to delete tournament', error);
      alert(error instanceof Error ? error.message : 'Failed to delete tournament');
    } finally {
      setDeleting(null);
    }
  };

  if (authLoading || initialLoading) {
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

        {user ? (
          <div className="space-y-6">
            {/* My tournaments */}
            {myTournaments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-zinc-600 dark:text-zinc-400 px-1">My tournaments</h3>
                {myTournaments.map(tournament => (
                  <TournamentCard
                    key={tournament.id}
                    tournament={tournament}
                    canDelete={user.id === tournament.creatorId}
                    deleting={deleting === tournament.id}
                    onDelete={(e) => handleDelete(e, tournament.id, tournament.name, 'my')}
                  />
                ))}
                {myHasMore && <LoadMoreButton onClick={loadMoreMy} loading={myLoading} />}
              </div>
            )}

            {/* Other tournaments */}
            {otherTournaments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-zinc-600 dark:text-zinc-400 px-1">Other tournaments</h3>
                {otherTournaments.map(tournament => (
                  <TournamentCard
                    key={tournament.id}
                    tournament={tournament}
                    canDelete={user.id === tournament.creatorId}
                    deleting={deleting === tournament.id}
                    onDelete={(e) => handleDelete(e, tournament.id, tournament.name, 'other')}
                  />
                ))}
                {otherHasMore && <LoadMoreButton onClick={loadMoreOther} loading={otherLoading} />}
              </div>
            )}

            {myTournaments.length === 0 && otherTournaments.length === 0 && (
              <p className="text-zinc-500 text-center py-8">No tournaments yet.</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {allTournaments.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">No tournaments yet.</p>
            ) : (
              <>
                {allTournaments.map(tournament => (
                  <TournamentCard
                    key={tournament.id}
                    tournament={tournament}
                    canDelete={false}
                    deleting={false}
                    onDelete={() => {}}
                  />
                ))}
                {allHasMore && <LoadMoreButton onClick={loadMoreAll} loading={allLoading} />}
              </>
            )}
          </div>
        )}
      </section>

      <footer className="text-center text-zinc-500 pt-8 pb-8 border-t border-zinc-200 dark:border-zinc-800 text-sm">
        <p>Good luck!</p>
      </footer>
    </div>
  );
}
