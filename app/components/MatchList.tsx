'use client';

import { Match, MatchResult } from '@/app/lib/types';
import { useState } from 'react';

interface MatchListProps {
  matches: Match[];
  currentUserId?: string;
  onUpdateMatch: (matchId: string, result: MatchResult, gameLink?: string) => Promise<void>;
  onChallenge?: (matchId: string, opponentId: string, userColor: 'white' | 'black') => void;
}

export function MatchList({ matches, currentUserId, onUpdateMatch, onChallenge }: MatchListProps) {
  return (
    <div className="space-y-3">
      {matches.map(match => {
        const userIsWhite = currentUserId && match.white.toLowerCase() === currentUserId.toLowerCase();
        const userIsBlack = currentUserId && match.black.toLowerCase() === currentUserId.toLowerCase();
        const isUserMatch = userIsWhite || userIsBlack;
        const opponentId = userIsWhite ? match.black : userIsBlack ? match.white : undefined;
        const userColor = userIsWhite ? 'white' : 'black';

        return (
          <MatchItem
            key={`${match.id}-${match.gameLink ?? ''}`}
            match={match}
            whiteName={match.white}
            blackName={match.black}
            onUpdate={onUpdateMatch}
            canChallenge={!!isUserMatch && !match.result && !!onChallenge}
            onChallenge={opponentId ? () => onChallenge?.(match.id, opponentId, userColor) : undefined}
          />
        );
      })}
    </div>
  );
}

function MatchItem({ match, whiteName, blackName, onUpdate, canChallenge, onChallenge }: {
  match: Match,
  whiteName: string,
  blackName: string,
  onUpdate: (id: string, result: MatchResult, gameLink?: string) => Promise<void>,
  canChallenge?: boolean,
  onChallenge?: () => void,
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [linkInput, setLinkInput] = useState(match.gameLink || '');

  const handleResultUpdate = async (result: MatchResult) => {
    // If clicking the active result, clear it (toggle off)
    const newResult = match.result === result ? null : result;
    
    setIsUpdating(true);
    await onUpdate(match.id, newResult, match.gameLink);
    setIsUpdating(false);
  };

  const handleLinkSave = async () => {
    setIsUpdating(true);
    await onUpdate(match.id, match.result, linkInput);
    setIsEditingLink(false);
    setIsUpdating(false);
  };

  const handleCancelLink = () => {
    setLinkInput(match.gameLink || '');
    setIsEditingLink(false);
  }

  return (
    <div className="flex flex-col bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Match Row */}
      <div className="flex items-center justify-between p-3 sm:p-4">
        <div className="flex-1 text-right font-medium truncate sm:text-base text-sm">{whiteName}</div>
        
        <div className="px-2 sm:px-4 flex flex-col items-center gap-2 min-w-[120px]">
          <div className="flex gap-1">
            <ResultButton 
              active={match.result === '1-0'} 
              onClick={() => handleResultUpdate('1-0')}
              disabled={isUpdating}
            >
              1-0
            </ResultButton>
            <ResultButton 
              active={match.result === '0.5-0.5'} 
              onClick={() => handleResultUpdate('0.5-0.5')}
              disabled={isUpdating}
            >
              ½-½
            </ResultButton>
            <ResultButton 
              active={match.result === '0-1'} 
              onClick={() => handleResultUpdate('0-1')}
              disabled={isUpdating}
            >
              0-1
            </ResultButton>
          </div>
        </div>

        <div className="flex-1 text-left font-medium truncate sm:text-base text-sm">{blackName}</div>
      </div>

      {/* Footer: Game Link */}
      <div className="px-4 pb-3 pt-0 flex justify-center text-xs">
        {isEditingLink ? (
          <div className="flex gap-2 w-full max-w-sm items-center">
            <input
              type="text"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              placeholder="Paste Lichess game URL..."
              className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              autoFocus
            />
            <button 
              onClick={handleLinkSave}
              disabled={isUpdating}
              className="text-green-600 hover:text-green-700 dark:text-green-500 font-medium"
            >
              Save
            </button>
            <button 
              onClick={handleCancelLink}
              className="text-zinc-400 hover:text-zinc-500"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-2 items-center text-zinc-400">
            {canChallenge && onChallenge && (
              <button
                onClick={onChallenge}
                className="text-orange-500 hover:text-orange-600 dark:hover:text-orange-400"
                title="Challenge opponent"
              >
                ⚔️
              </button>
            )}
            {match.gameLink ? (
              <a
                href={match.gameLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline flex items-center gap-1"
              >
                View Game ↗
              </a>
            ) : (
              <span className="italic text-zinc-300 dark:text-zinc-700">No game link</span>
            )}
            <button
              onClick={() => setIsEditingLink(true)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              title="Edit Game Link"
            >
              📝
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultButton({ children, active, onClick, disabled }: { children: React.ReactNode, active: boolean, onClick: () => void, disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-2 py-1 text-xs font-bold rounded border
        ${active 
          ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white' 
          : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 dark:hover:bg-zinc-700'}
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors
      `}
    >
      {children}
    </button>
  );
}
