'use client';

import Link from 'next/link';
import { LichessAuth } from './LichessAuth';
import { APP_NAME } from '../lib/constants';

export function Header() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg hover:text-zinc-600 dark:hover:text-zinc-300">
          {APP_NAME}
        </Link>
        <LichessAuth />
      </div>
    </header>
  );
}
