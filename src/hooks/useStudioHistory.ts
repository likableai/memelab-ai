'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  loadHistory,
  addHistoryItem as addItemToStorage,
  clearHistoryForWallet,
  type StudioHistoryItem,
} from '@/lib/studio-history';

export interface UseStudioHistoryOptions {
  studio: string;
  walletAddress: string | null;
}

export function useStudioHistory({ studio, walletAddress }: UseStudioHistoryOptions) {
  const [history, setHistory] = useState<StudioHistoryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Load history when wallet or studio changes
  useEffect(() => {
    const list = loadHistory(studio, walletAddress);
    setHistory(list);
    setSelectedId((prev) => {
      if (list.length === 0) return null;
      const stillExists = list.some((h) => h.id === prev);
      return stillExists ? prev : list[0].id;
    });
  }, [studio, walletAddress]);

  const addItem = useCallback(
    (item: Omit<StudioHistoryItem, 'id' | 'createdAt'>) => {
      const newItem = addItemToStorage(studio, walletAddress, item);
      const list = loadHistory(studio, walletAddress);
      setHistory(list);
      setSelectedId(newItem.id);
      return newItem;
    },
    [studio, walletAddress]
  );

  const selectItem = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const clearHistory = useCallback(() => {
    clearHistoryForWallet(studio, walletAddress);
    setHistory([]);
    setSelectedId(null);
  }, [studio, walletAddress]);

  const selectedItem =
    history.find((h) => h.id === selectedId) ?? history[0] ?? null;

  return { history, selectedItem, selectedId, addItem, selectItem, clearHistory };
}
