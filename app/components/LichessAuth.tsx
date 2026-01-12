'use client';

import { useAuth } from './AuthContext';
import { getLichessProfileUrl } from '../lib/lichess';

export function LichessAuth() {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <div className="text-sm text-zinc-500">
        Loading...
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <a
          href={getLichessProfileUrl(user.username)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium hover:underline hover:text-blue-500"
        >
          {user.username}
        </a>
        <button
          onClick={logout}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-zinc-900 text-white rounded hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      Login with Lichess
    </button>
  );
}
