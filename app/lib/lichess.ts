export const LICHESS_HOST = 'https://lichess.org';

export function getLichessProfileUrl(username: string): string {
  return `${LICHESS_HOST}/@/${username}`;
}

export function getLichessChallengeUrl(username: string): string {
  return `${LICHESS_HOST}/?user=${username}#friend`;
}

/**
 * Validates that a URL is a valid Lichess game link.
 * Valid formats:
 * - https://lichess.org/GAMEID (8 alphanumeric chars)
 * - https://lichess.org/GAMEID/white
 * - https://lichess.org/GAMEID/black
 * - Empty string (allowed for clearing)
 */
export function isValidLichessGameLink(url: string): boolean {
  if (url === '') return true;

  const pattern = /^https:\/\/lichess\.org\/[a-zA-Z0-9]{8}(\/(?:white|black))?$/;
  return pattern.test(url);
}
