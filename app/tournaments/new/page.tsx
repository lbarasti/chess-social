'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/components/AuthContext';
import { ChessVariant, TimeControl } from '@/app/lib/types';

// Time control options
const CLOCK_MINUTES = [1, 2, 3, 5, 10, 15, 30, 45, 60, 90, 120, 180] as const;
const CLOCK_INCREMENTS = [0, 1, 2, 3, 5, 10, 15, 20, 30, 45, 60] as const;
const CORRESPONDENCE_DAYS = [1, 2, 3, 5, 7, 10, 14] as const;

// Chess variants with display labels
const VARIANTS: { value: ChessVariant; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'chess960', label: 'Chess960' },
  { value: 'crazyhouse', label: 'Crazyhouse' },
  { value: 'antichess', label: 'Antichess' },
  { value: 'atomic', label: 'Atomic' },
  { value: 'horde', label: 'Horde' },
  { value: 'kingOfTheHill', label: 'King of the Hill' },
  { value: 'racingKings', label: 'Racing Kings' },
  { value: 'threeCheck', label: 'Three-check' },
];

export default function NewTournamentPage() {
  const router = useRouter();
  const { user, loading: authLoading, login, getAccessToken } = useAuth();
  const [name, setName] = useState('');
  const [rounds, setRounds] = useState(2);
  const [players, setPlayers] = useState<string[]>(['', '']);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Challenge settings
  const [variant, setVariant] = useState<ChessVariant>('standard');
  const [timeControl, setTimeControl] = useState<TimeControl>({ type: 'clock', limit: 300, increment: 3 });

  const MAX_PLAYERS = 20;

  const addPlayer = () => {
    if (players.length >= MAX_PLAYERS) return;
    setPlayers([...players, '']);
  };

  const removePlayer = (index: number) => {
    if (players.length <= 2) return;
    setPlayers(players.filter((_, i) => i !== index));
  };

  const updatePlayer = (index: number, value: string) => {
    setPlayers(players.map((p, i) => (i === index ? value : p)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Tournament name is required');
      return;
    }

    const validPlayers = players.filter(p => p.trim());
    if (validPlayers.length < 2) {
      setError('At least 2 players are required');
      return;
    }

    if (validPlayers.length > MAX_PLAYERS) {
      setError(`Maximum ${MAX_PLAYERS} players allowed`);
      return;
    }

    setSubmitting(true);

    try {
      const token = await getAccessToken();
      if (!token) {
        setError('You must be logged in to create a tournament');
        setSubmitting(false);
        return;
      }

      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          type: 'round-robin',
          rounds,
          players: validPlayers.map(p => ({ lichessUsername: p.trim() })),
          challengeSettings: {
            timeControl,
            rated: false,
            variant,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create tournament');
      }

      const tournament = await res.json();
      router.push(`/tournaments/${tournament.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tournament');
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-zinc-500">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen p-4 sm:p-8 max-w-2xl mx-auto pb-20 font-(family-name:--font-geist-sans)">
        <header className="space-y-4 pt-8 mb-8">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
            &larr; All Tournaments
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">New Tournament</h1>
        </header>
        <div className="text-center py-12 space-y-4">
          <p className="text-zinc-600 dark:text-zinc-400">You must be logged in to create a tournament.</p>
          <button
            onClick={login}
            className="px-6 py-3 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Login with Lichess
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-2xl mx-auto pb-20 font-[family-name:var(--font-geist-sans)]">
      <header className="space-y-4 pt-8 mb-8">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          &larr; All Tournaments
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">New Tournament</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="name" className="block font-medium">
            Tournament Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Winter tournament"
            className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="type" className="block font-medium">
            Tournament Type
          </label>
          <select
            id="type"
            disabled
            className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-500"
          >
            <option value="round-robin">Round Robin</option>
          </select>
          <p className="text-sm text-zinc-500">Only round-robin is supported currently.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="rounds" className="block font-medium">
            Number of Rounds
          </label>
          <input
            id="rounds"
            type="number"
            min={1}
            max={4}
            value={rounds}
            onChange={e => setRounds(parseInt(e.target.value) || 1)}
            className="w-24 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
          <p className="text-sm text-zinc-500">
            Each player plays every other player this many times (alternating colors).
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="variant" className="block font-medium">
            Variant
          </label>
          <select
            id="variant"
            value={variant}
            onChange={e => setVariant(e.target.value as ChessVariant)}
            className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            {VARIANTS.map(v => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <label className="block font-medium">Time Control</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTimeControl({ type: 'clock', limit: 300, increment: 3 })}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                timeControl.type === 'clock'
                  ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white'
                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
              }`}
            >
              Real-time
            </button>
            <button
              type="button"
              onClick={() => setTimeControl({ type: 'correspondence', days: 3 })}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                timeControl.type === 'correspondence'
                  ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white'
                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
              }`}
            >
              Correspondence
            </button>
          </div>

          {timeControl.type === 'clock' ? (
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <label htmlFor="timeLimit" className="block text-sm text-zinc-500 mb-1">
                  Minutes
                </label>
                <select
                  id="timeLimit"
                  value={timeControl.limit / 60}
                  onChange={e => setTimeControl({
                    type: 'clock',
                    limit: parseInt(e.target.value) * 60,
                    increment: timeControl.increment,
                  })}
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-400"
                >
                  {CLOCK_MINUTES.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label htmlFor="timeIncrement" className="block text-sm text-zinc-500 mb-1">
                  Increment (seconds)
                </label>
                <select
                  id="timeIncrement"
                  value={timeControl.increment}
                  onChange={e => setTimeControl({
                    type: 'clock',
                    limit: timeControl.limit,
                    increment: parseInt(e.target.value),
                  })}
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-400"
                >
                  {CLOCK_INCREMENTS.map(i => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : timeControl.type === 'correspondence' ? (
            <div>
              <label htmlFor="days" className="block text-sm text-zinc-500 mb-1">
                Days per move
              </label>
              <select
                id="days"
                value={timeControl.days}
                onChange={e => setTimeControl({
                  type: 'correspondence',
                  days: parseInt(e.target.value) as 1 | 2 | 3 | 5 | 7 | 10 | 14,
                })}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-400"
              >
                {CORRESPONDENCE_DAYS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <label className="block font-medium">Players (Lichess usernames)</label>
          <div className="space-y-3">
            {players.map((username, index) => (
              <PlayerInputRow
                key={index}
                username={username}
                onUpdate={(value) => updatePlayer(index, value)}
                onRemove={() => removePlayer(index)}
                canRemove={players.length > 2}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={addPlayer}
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            + Add Player
          </button>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-6 py-3 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating...' : 'Create Tournament'}
          </button>
        </div>
      </form>
    </div>
  );
}

interface LichessSuggestion {
  id: string;
  name: string;
}

function PlayerInputRow({
  username,
  onUpdate,
  onRemove,
  canRemove,
}: {
  username: string;
  onUpdate: (value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [suggestions, setSuggestions] = useState<LichessSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSuggestions = async (term: string) => {
    if (term.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/lichess/autocomplete?term=${encodeURIComponent(term)}`);
      const data = await res.json();
      setSuggestions(data.result || []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    onUpdate(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="flex gap-2 items-start">
      <div className="flex-1 relative">
        <input
          type="text"
          value={username}
          onChange={e => handleInputChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Lichess username"
          className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
        {showSuggestions && (suggestions.length > 0 || loading) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-2 text-zinc-500 text-sm">Searching...</div>
            ) : (
              suggestions.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { onUpdate(p.id); setShowSuggestions(false); setSuggestions([]); }}
                  className="w-full px-4 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {p.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        className="px-3 py-2 text-zinc-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Remove player"
      >
        &times;
      </button>
    </div>
  );
}
