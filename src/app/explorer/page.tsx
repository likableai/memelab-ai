'use client';

import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import TokenSearch from '@/components/TokenSearch';

export default function ExplorerPage() {
  return (
    <AppLayout>
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: 'var(--space-12) var(--space-6)',
        }}
      >
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <p
            style={{
              fontSize: 'var(--font-xs)',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
              marginBottom: 'var(--space-3)',
            }}
          >
            Solana / Jupiter
          </p>
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              marginBottom: 'var(--space-2)',
              lineHeight: 1.15,
            }}
          >
            Token Explorer
          </h1>
          <p
            style={{
              fontSize: 'var(--font-sm)',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}
          >
            Search any token by name, symbol, or mint address. Explore market data and create memes instantly.
          </p>
        </div>
        <main>
          <TokenSearch />
        </main>
      </div>
    </AppLayout>
  );
}
