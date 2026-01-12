export const LICHESS_HOST = 'https://lichess.org';

export function getLichessProfileUrl(username: string): string {
  return `${LICHESS_HOST}/@/${username}`;
}

export function getLichessChallengeUrl(username: string): string {
  return `${LICHESS_HOST}/?user=${username}#friend`;
}
