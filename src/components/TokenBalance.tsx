'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useEvmWallet } from './WalletProvider';
import Link from 'next/link';
import { getTokenBalance } from '@/lib/api';
import { Wallet, LayoutDashboard, LogOut } from 'lucide-react';

interface TokenBalanceData {
  currentBalance: number;
  depositedAmount: number;
  consumedAmount: number;
  lastUpdated: string;
  balanceUsd?: number;
  minDepositUsd?: number;
  canAccess?: boolean;
}

export const TokenBalance: React.FC = () => {
  const { isConnected, address, disconnect } = useEvmWallet();
  const [balance, setBalance] = useState<TokenBalanceData | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!isConnected || !address) return;
    try {
      const data = await getTokenBalance(address);
      setBalance(data);
    } catch (error: any) {
      if (error?.code !== 'ERR_NETWORK' && error?.message !== 'Network Error') {
        console.error('Failed to fetch balance:', error);
      }
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (isConnected && address) {
      fetchBalance();
      const interval = setInterval(fetchBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected, address, fetchBalance]);

  if (!isConnected || !address || !balance) {
    return null;
  }

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    disconnect();
  };

  return (
    <div
      className="card flex items-center gap-3 flex-wrap"
      style={{
        fontFamily: "'Times New Roman', Times, serif",
        padding: 'var(--space-1-5) var(--space-2-5)'
      }}
    >
      <span
        className="flex items-center gap-1.5 text-xs"
        style={{ color: 'var(--text)' }}
        aria-label="Wallet"
      >
        <Wallet className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text)' }} />
        Wallet
      </span>
      <Link
        href="/dashboard"
        className="flex items-center gap-1 text-xs transition-colors"
        style={{ color: 'var(--text-opacity-60)' }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-opacity-60)'}
      >
        <LayoutDashboard className="w-3 h-3" />
        Dashboard
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center gap-1 text-xs transition-colors bg-transparent border-none p-0 cursor-pointer"
        style={{
          fontFamily: "'Times New Roman', Times, serif",
          color: 'var(--text-opacity-60)',
          fontSize: 'inherit'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--text)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-opacity-60)';
        }}
        aria-label="Log out"
      >
        <LogOut className="w-3 h-3" />
        Logout
      </button>
    </div>
  );
};
