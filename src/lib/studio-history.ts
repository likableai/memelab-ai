/**
 * Per-wallet studio history (Meme Studio, Video Studio, Image Studio).
 * Stored in localStorage: key = memelab-{studio}-history-{walletAddress}.
 * When wallet is disconnected we use "anonymous".
 */

const MAX_ITEMS = 50;
const PREFIX = 'memelab';

export interface StudioHistoryItem {
  id: string;
  url: string;
  format?: string;
  prompt?: string;
  createdAt: number;
}

export function getStorageKey(studio: string, walletAddress: string | null): string {
  const wallet = (walletAddress ?? '').trim().toLowerCase() || 'anonymous';
  return `${PREFIX}-${studio}-history-${wallet}`;
}

export function loadHistory(studio: string, walletAddress: string | null): StudioHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = getStorageKey(studio, walletAddress);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is StudioHistoryItem =>
        x != null &&
        typeof x === 'object' &&
        typeof (x as StudioHistoryItem).id === 'string' &&
        typeof (x as StudioHistoryItem).url === 'string' &&
        typeof (x as StudioHistoryItem).createdAt === 'number'
    );
  } catch {
    return [];
  }
}

export function saveHistory(
  studio: string,
  walletAddress: string | null,
  items: StudioHistoryItem[]
): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getStorageKey(studio, walletAddress);
    const toStore = items.slice(0, MAX_ITEMS);
    localStorage.setItem(key, JSON.stringify(toStore));
  } catch {
    // ignore
  }
}

export function addHistoryItem(
  studio: string,
  walletAddress: string | null,
  item: Omit<StudioHistoryItem, 'id' | 'createdAt'>
): StudioHistoryItem {
  const list = loadHistory(studio, walletAddress);
  const newItem: StudioHistoryItem = {
    ...item,
    id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
  };
  const next = [newItem, ...list].slice(0, MAX_ITEMS);
  saveHistory(studio, walletAddress, next);
  return newItem;
}

export function clearHistoryForWallet(studio: string, walletAddress: string | null): void {
  saveHistory(studio, walletAddress, []);
}
