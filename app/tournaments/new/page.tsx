'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PlayerInput {
  name: string;
  lichessUsername: string;
}

interface LichessPlayer {
  id: string;
  name: string;
}

export default function NewTournamentPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [rounds, setRounds] = useState(2);
  const [players, setPlayers] = useState<PlayerInput[]>([
    { name: '', lichessUsername: '' },
    { name: '', lichessUsername: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPlayer = () => {
    setPlayers([...players, { name: '', lichessUsername: '' }]);
  };

  const removePlayer = (index: number) => {
    if (players.length <= 2) return;
    setPlayers(players.filter((_, i) => i !== index));
  };

  const updatePlayer = (index: number, field: keyof PlayerInput, value: string) => {
    setPlayers(players.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const selectLichessPlayer = (index: number, lichessPlayer: LichessPlayer) => {
    setPlayers(players.map((p, i) =>
      i === index ? { name: lichessPlayer.name, lichessUsername: lichessPlayer.id } : p
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Tournament name is required');
      return;
    }

    const validPlayers = players.filter(p => p.name.trim() && p.lichessUsername.trim());
    if (validPlayers.length < 2) {
      setError('At least 2 players with name and Lichess username are required');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          type: 'round-robin',
          rounds,
          players: validPlayers.map(p => ({
            name: p.name.trim(),
            lichessUsername: p.lichessUsername.trim(),
          })),
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
            placeholder="e.g. XMAS Molesto 2025"
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
            max={10}
            value={rounds}
            onChange={e => setRounds(parseInt(e.target.value) || 1)}
            className="w-24 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
          <p className="text-sm text-zinc-500">
            Each player plays every other player this many times (alternating colors).
          </p>
        </div>

        <div className="space-y-4">
          <label className="block font-medium">Players</label>
          <div className="space-y-3">
            {players.map((player, index) => (
              <PlayerInputRow
                key={index}
                player={player}
                onUpdate={(field, value) => updatePlayer(index, field, value)}
                onSelectLichess={(p) => selectLichessPlayer(index, p)}
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

function PlayerInputRow({
  player,
  onUpdate,
  onSelectLichess,
  onRemove,
  canRemove,
}: {
  player: PlayerInput;
  onUpdate: (field: keyof PlayerInput, value: string) => void;
  onSelectLichess: (player: LichessPlayer) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [suggestions, setSuggestions] = useState<LichessPlayer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

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

  const handleLichessInputChange = (value: string) => {
    onUpdate('lichessUsername', value);

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
      <div className="flex-1 space-y-2 sm:space-y-0 sm:flex sm:gap-2 relative">
        <div className="relative w-full sm:flex-1">
          <input
            type="text"
            value={player.lichessUsername}
            onChange={e => handleLichessInputChange(e.target.value)}
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
                    onClick={() => { onSelectLichess(p); setShowSuggestions(false); setSuggestions([]); }}
                    className="w-full px-4 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 flex justify-between items-center"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-sm text-zinc-500">@{p.id}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <div className="w-full sm:flex-1">
          <input
            type="text"
            value={player.name}
            onChange={e => onUpdate('name', e.target.value)}
            placeholder="Display name"
            className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
        </div>
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
