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
              top: 'calc(100% + 6px)',
              right: 0,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-1)',
              zIndex: 50,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              minWidth: 160,
            }}
          >
            {/* Network badge row */}
            <div
              style={{
                padding: 'var(--space-2) var(--space-3)',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
                borderBottom: '1px solid var(--border)',
                marginBottom: 'var(--space-1)',
              }}
            >
              {getNetworkName()}
            </div>
            <button
              type="button"
              onClick={() => { disconnect(); setShowMenu(false); }}
              style={{
                display: 'block',
                width: '100%',
                padding: 'var(--space-2) var(--space-3)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text)',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 'var(--font-sm)',
                borderRadius: 'var(--radius-sm)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
      {/* Network label intentionally removed — shown in wallet menu only */}
    </div>
  );
};
