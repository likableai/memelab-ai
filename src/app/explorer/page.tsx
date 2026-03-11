'use client';

import React, { useRef, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { searchTokens } from '@/lib/api';
import Link from 'next/link';
import {
  Search,
  ChevronRight,
  AlertCircle,
  ImageIcon,
  TrendingUp,
  Users,
  BarChart2,
  Loader2,
} from 'lucide-react';

interface TokenInfo {
  mint: string; // contract address on BNB Chain
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  marketCap?: number;
  organicScore?: number;
  holderCount?: number;
  description?: string;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

export default function ExplorerPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const data = await searchTokens(q);
      setResults(data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message ?? e?.message ?? 'Search failed.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div
        style={{
          maxWidth: '860px',
          margin: '0 auto',
          width: '100%',
          padding: 'clamp(2rem, 5vw, 4rem) clamp(1rem, 4vw, 2rem)',
        }}
      >
        {/* Page header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
              marginBottom: '0.75rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            BSC / BNB Chain
          </p>
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              marginBottom: '0.75rem',
            }}
          >
            Token Explorer
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '480px' }}>
            Search any BNB Chain token by name, symbol, or address. Explore on-chain data and create memes instantly.
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} style={{ marginBottom: '2rem', position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0 1.25rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              transition: 'border-color 200ms ease',
            }}
            onFocusCapture={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
            onBlurCapture={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <Search style={{ width: 18, height: 18, color: 'var(--text-secondary)', flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, symbol, or contract address..."
              style={{
                flex: 1,
                padding: '0.875rem 0',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '0.9375rem',
                color: 'var(--text)',
              }}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              style={{
                padding: '0.4rem 1.1rem',
                background: 'var(--accent-primary)',
                color: '#020617',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: loading || !query.trim() ? 0.5 : 1,
                transition: 'opacity 150ms ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                flexShrink: 0,
              }}
            >
              {loading ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : null}
              Search
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem 1.125rem',
              marginBottom: '1.5rem',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '10px',
              color: '#fca5a5',
              fontSize: '0.875rem',
            }}
          >
            <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Empty / loading state */}
        {!searched && !loading && (
          <div
            style={{
              textAlign: 'center',
              padding: '4rem 0',
              color: 'var(--text-secondary)',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '16px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <Search style={{ width: 22, height: 22, color: 'var(--text-secondary)' }} />
            </div>
            <p style={{ fontSize: '0.9375rem', fontWeight: 500, marginBottom: '0.375rem' }}>Search BNB Chain tokens</p>
            <p style={{ fontSize: '0.8125rem', opacity: 0.6 }}>Enter a name, ticker, or contract address above</p>
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
            <Loader2 style={{ width: 28, height: 28, color: 'var(--accent-primary)' }} className="animate-spin" />
          </div>
        )}

        {/* Results grid */}
        {!loading && results.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {results.map((token) => (
              <div
                key={token.mint}
                style={{
                  padding: '1.125rem 1.25rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  transition: 'border-color 200ms ease, transform 200ms ease',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-medium)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                {/* Token identity row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.875rem' }}>
                  {token.logoURI ? (
                    <img
                      src={token.logoURI}
                      alt={token.symbol}
                      style={{ width: 42, height: 42, borderRadius: '10px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: '10px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: 'var(--accent-primary)',
                        flexShrink: 0,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {token.symbol[0]}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {token.name}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          padding: '2px 6px',
                          borderRadius: '5px',
                          background: 'rgba(0,229,160,0.1)',
                          color: 'var(--accent-primary)',
                          border: '1px solid rgba(0,229,160,0.2)',
                          flexShrink: 0,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {token.symbol}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-mono)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {token.mint}
                    </p>
                  </div>
                </div>

                {/* Stats row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.625rem 0.75rem',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    marginBottom: '0.875rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <TrendingUp style={{ width: 12, height: 12, color: 'var(--text-secondary)' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Score</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                      {token.organicScore?.toFixed(1) ?? '—'}
                    </span>
                  </div>
                  <div style={{ width: 1, height: 14, background: 'var(--border)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Users style={{ width: 12, height: 12, color: 'var(--text-secondary)' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Holders</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                      {token.holderCount ? fmt(token.holderCount) : '—'}
                    </span>
                  </div>
                  {token.marketCap ? (
                    <>
                      <div style={{ width: 1, height: 14, background: 'var(--border)' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <BarChart2 style={{ width: 12, height: 12, color: 'var(--text-secondary)' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>MCap</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                          ${fmt(token.marketCap)}
                        </span>
                      </div>
                    </>
                  ) : null}
                </div>

                {/* Description */}
                {token.description && (
                  <p
                    style={{
                      fontSize: '0.8125rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      marginBottom: '0.875rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical' as const,
                      overflow: 'hidden',
                    }}
                  >
                    {token.description}
                  </p>
                )}

                {/* CTA */}
                <Link
                  href={`/meme-studio?token=${encodeURIComponent(token.symbol)}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--accent-primary)',
                    textDecoration: 'none',
                    padding: '0.4rem 0.75rem',
                    background: 'rgba(0,229,160,0.08)',
                    border: '1px solid rgba(0,229,160,0.18)',
                    borderRadius: '7px',
                    transition: 'background 150ms ease',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(0,229,160,0.15)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(0,229,160,0.08)')}
                >
                  <ImageIcon style={{ width: 13, height: 13 }} />
                  Create meme
                  <ChevronRight style={{ width: 13, height: 13 }} />
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {!loading && searched && results.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '0.9375rem', fontWeight: 500 }}>No tokens found for &ldquo;{query}&rdquo;</p>
            <p style={{ fontSize: '0.8125rem', opacity: 0.6, marginTop: '0.375rem' }}>Try a different name, symbol, or contract address</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
