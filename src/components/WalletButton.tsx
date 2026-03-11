'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useEvmWallet } from './WalletProvider';

export const WalletButton: React.FC = () => {
  const { isConnected, address, connect, disconnect } = useEvmWallet();
  const [mounted, setMounted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showMenu]);

  const getNetworkName = () => {
    const chainId = process.env.NEXT_PUBLIC_BSC_CHAIN_ID;
    if (chainId === '97') return 'BSC Testnet';
    return 'BSC';
  };

  if (!mounted) {
    return (
      <div
        className="wallet-button-wrapper"
        style={{
          width: '100%',
          height: 'var(--button-height-compact)',
        }}
      >
        <div
          className="w-full h-full rounded-xl animate-pulse"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
          }}
        />
      </div>
    );
  }

  const label =
    isConnected && address
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : 'Wallet';

  return (
    <div className="flex flex-col items-stretch gap-1.5 w-auto" ref={menuRef}>
      <div className="wallet-button-wrapper flex items-center relative">
        <button
          type="button"
          data-wallet-button
          className="wallet-adapter-button"
          onClick={() => {
            if (isConnected) {
              setShowMenu((v) => !v);
            } else {
              connect();
            }
          }}
          onContextMenu={(e) => {
            if (!isConnected) return;
            e.preventDefault();
            disconnect();
          }}
          aria-label="Wallet"
          style={{
            background: 'var(--accent-primary)',
            border: 'none',
            color: 'var(--bg)',
            borderRadius: 'var(--radius-full)',
            padding: 'var(--space-1) var(--space-3)',
          fontFamily:
            "var(--font-inter), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            fontSize: 'var(--font-sm)',
            fontWeight: 'var(--font-weight-normal)',
            minHeight: 'var(--button-height-compact)',
            height: 'auto',
            lineHeight: 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all var(--transition-base)',
            textTransform: 'none',
            boxShadow: 'var(--shadow-white-sm)',
            cursor: 'pointer',
          }}
        >
          {label}
        </button>
        {showMenu && isConnected && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 'var(--space-1)',
              background: 'var(--accent-primary)',
              border: '1px solid var(--border-opacity-10)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-2)',
              zIndex: 50,
          fontFamily:
            "var(--font-inter), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              minWidth: 140,
            }}
          >
            <button
              type="button"
              onClick={() => {
                disconnect();
                setShowMenu(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: 'var(--space-1) var(--space-2)',
                background: 'transparent',
                border: 'none',
                color: 'var(--bg)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
      {isConnected && address && getNetworkName() && (
        <div
          className="text-xs text-center flex items-center justify-center rounded-lg"
          style={{
            color: 'var(--text)',
            fontFamily:
              "var(--font-inter), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            padding: 'var(--space-1) var(--space-2)',
            border: '1px solid var(--border-opacity-10)',
            backgroundColor: 'var(--bg-opacity-5)',
          }}
        >
          {getNetworkName()}
        </div>
      )}
    </div>
  );
};
