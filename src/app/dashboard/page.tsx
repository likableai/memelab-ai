'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useEvmWallet } from '@/components/WalletProvider';
import { toast } from 'sonner';
import { AppLayout } from '@/components/AppLayout';
import { UsageHistory } from '@/components/UsageHistory';
import { TopUpForm } from '@/components/TopUpForm';
import { getTokenBalance, getTokenPrice, scanDeposits } from '@/lib/api';
import { WalletButton } from '@/components/WalletButton';
import {
  RefreshCw, Loader2, Search, ImageIcon, Wand2, Bot,
  Copy, Check, TrendingUp, Zap, Activity,
} from 'lucide-react';

const AUTO_DETECT_KEY = 'autoDetectDeposits';
const SCAN_INTERVAL_MS = 45_000;

function truncateAddress(addr: string) {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function generateAvatar(address: string) {
  // deterministic hue from address
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return { hue, initials: address.slice(2, 4).toUpperCase() };
}

const QUICK_LINKS = [
  { href: '/meme-studio', icon: ImageIcon, label: 'Meme Studio', desc: 'Create memes' },
  { href: '/image-studio', icon: Wand2, label: 'Image Studio', desc: 'Generate images' },
  { href: '/companion', icon: Bot, label: 'AI Companion', desc: 'Voice assistant' },
];

export default function DashboardPage() {
  const { isConnected, address } = useEvmWallet();
  const [balance, setBalance] = useState<{
    currentBalance: number;
    depositedAmount: number;
    consumedAmount: number;
    balanceUsd?: number;
    minDepositUsd?: number;
    canAccess?: boolean;
  } | null>(null);
  const [tokenPrice, setTokenPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [autoDetect, setAutoDetect] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'topup'>('overview');
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isScanningRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!isConnected || !address) return;
    setLoading(true);
    try {
      const [bal, price] = await Promise.all([getTokenBalance(address), getTokenPrice()]);
      setBalance(bal);
      setTokenPrice(price.twapPrice ?? 0);
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err?.code !== 'ERR_NETWORK' && err?.message !== 'Network Error') {
        console.error('Dashboard fetch error:', e);
      }
    } finally {
      setLoading(false);
    }
  }, [isConnected, address]);

  useEffect(() => { fetchData(); }, [fetchData, refreshTrigger]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTO_DETECT_KEY);
      setAutoDetect(raw === 'true');
    } catch { setAutoDetect(false); }
  }, []);

  const runScan = useCallback(async () => {
    if (!address || isScanningRef.current) return;
    isScanningRef.current = true;
    setScanning(true);
    try {
      const res = await scanDeposits(address);
      if (res.credited.length > 0) {
        const total = res.credited.reduce((s: number, c: { amount: number }) => s + c.amount, 0);
        toast.success(`${total.toFixed(2)} $CLAW credited.`);
        setRefreshTrigger((n) => n + 1);
      }
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string; response?: { data?: { error?: string } } };
      if (err?.code !== 'ERR_NETWORK' && err?.message !== 'Network Error') {
        toast.error(err?.response?.data?.error ?? 'Failed to scan deposits.');
      }
    } finally {
      isScanningRef.current = false;
      setScanning(false);
    }
  }, [address]);

  useEffect(() => {
    if (!autoDetect || !address) {
      if (scanIntervalRef.current) { clearInterval(scanIntervalRef.current); scanIntervalRef.current = null; }
      return;
    }
    runScan();
    scanIntervalRef.current = setInterval(() => runScan(), SCAN_INTERVAL_MS);
    return () => { if (scanIntervalRef.current) { clearInterval(scanIntervalRef.current); scanIntervalRef.current = null; } };
  }, [autoDetect, address, runScan]);

  const handleTopUpSuccess = useCallback(() => { setRefreshTrigger((n) => n + 1); }, []);

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Not connected ────────────────────────────────────────────────────────
  if (!isConnected || !address) {
    return (
      <AppLayout>
        <div style={{
          minHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-12) var(--space-6)',
          textAlign: 'center',
        }}>
          {/* Ghost avatar */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-medium)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 'var(--space-6)',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 'var(--space-3)' }}>
            Your Profile
          </h1>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-8)', maxWidth: '360px', lineHeight: 1.6 }}>
            Connect your BNB Chain wallet to view your $CLAW balance, usage stats, and activity.
          </p>
          <WalletButton />
        </div>
      </AppLayout>
    );
  }

  const { hue, initials } = generateAvatar(address);
  const usdValue = balance ? (balance.balanceUsd ?? balance.currentBalance * tokenPrice) : 0;
  const minUsd = balance?.minDepositUsd ?? 1;
  const canAccess = balance?.canAccess ?? usdValue >= minUsd;
  const usageRatio = balance && balance.depositedAmount > 0
    ? Math.min(balance.consumedAmount / balance.depositedAmount, 1)
    : 0;

  const tabStyle = (tab: typeof activeTab) => ({
    padding: 'var(--space-2) var(--space-4)',
    fontSize: 'var(--font-sm)',
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    background: activeTab === tab ? 'var(--bg-tertiary)' : 'transparent',
    color: activeTab === tab ? 'var(--text)' : 'var(--text-secondary)',
    transition: 'all 150ms ease',
  } as React.CSSProperties);

  return (
    <AppLayout>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: 'var(--space-10) var(--space-5) var(--space-16)' }}>

        {/* ── Profile Hero ─────────────────────────────────────────────── */}
        <div style={{
          position: 'relative',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          overflow: 'hidden',
          marginBottom: 'var(--space-6)',
        }}>
          {/* Banner strip */}
          <div style={{
            height: 80,
            background: `linear-gradient(135deg, hsl(${hue}, 40%, 8%) 0%, hsl(${(hue + 40) % 360}, 35%, 10%) 100%)`,
            borderBottom: '1px solid var(--border)',
          }} />

          <div style={{ padding: 'var(--space-5)', paddingTop: 0 }}>
            {/* Avatar + actions row */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
              marginTop: '-32px',
              marginBottom: 'var(--space-4)',
            }}>
              {/* Avatar */}
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: `hsl(${hue}, 55%, 20%)`,
                border: '3px solid var(--bg-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.25rem', fontWeight: 700, color: `hsl(${hue}, 80%, 70%)`,
                letterSpacing: '-0.01em',
                flexShrink: 0,
              }}>
                {initials}
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <button
                  onClick={() => setRefreshTrigger((n) => n + 1)}
                  disabled={loading}
                  aria-label="Refresh"
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 34, height: 34,
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  <RefreshCw className={loading ? 'animate-spin' : ''} style={{ width: 14, height: 14 }} />
                </button>
                <WalletButton />
              </div>
            </div>

            {/* Address + copy */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                  {truncateAddress(address)}
                </span>
                <button
                  onClick={copyAddress}
                  aria-label="Copy address"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? 'var(--accent-primary)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: 2 }}
                >
                  {copied ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
                </button>
              </div>
              <div style={{ marginTop: 'var(--space-1)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
                  padding: '2px 8px', borderRadius: '4px',
                  background: canAccess ? 'rgba(0,229,160,0.1)' : 'rgba(245,158,11,0.1)',
                  color: canAccess ? 'var(--accent-primary)' : 'var(--color-warning)',
                  border: `1px solid ${canAccess ? 'rgba(0,229,160,0.2)' : 'rgba(245,158,11,0.2)'}`,
                }}>
                  {canAccess ? 'Access Active' : 'Top Up Required'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  BNB Chain
                </span>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
              {[
                {
                  label: '$CLAW Balance',
                  value: loading && !balance ? '—' : balance ? balance.currentBalance.toFixed(2) : '—',
                  sub: balance ? `≈ $${usdValue.toFixed(4)}` : '',
                  icon: TrendingUp,
                  accent: true,
                },
                {
                  label: 'Total Deposited',
                  value: loading && !balance ? '—' : balance ? balance.depositedAmount.toFixed(2) : '—',
                  sub: '$CLAW',
                  icon: Zap,
                  accent: false,
                },
                {
                  label: 'Total Used',
                  value: loading && !balance ? '—' : balance ? balance.consumedAmount.toFixed(2) : '—',
                  sub: '$CLAW',
                  icon: Activity,
                  accent: false,
                },
              ].map(({ label, value, sub, icon: Icon, accent }) => (
                <div key={label} style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--bg-tertiary)',
                  border: `1px solid ${accent ? 'rgba(0,229,160,0.15)' : 'var(--border)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <Icon style={{ width: 14, height: 14, color: accent ? 'var(--accent-primary)' : 'var(--text-secondary)' }} />
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {label}
                    </span>
                  </div>
                  <p style={{ fontSize: 'var(--font-xl)', fontWeight: 700, letterSpacing: '-0.02em', color: accent ? 'var(--accent-primary)' : 'var(--text)', lineHeight: 1 }}>
                    {value}
                  </p>
                  {sub && <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 4 }}>{sub}</p>}
                </div>
              ))}
            </div>

            {/* Usage bar */}
            {balance && balance.depositedAmount > 0 && (
              <div style={{ marginTop: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Usage</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {(usageRatio * 100).toFixed(1)}%
                  </span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'var(--bg)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${usageRatio * 100}%`,
                    borderRadius: 2,
                    background: usageRatio > 0.8 ? 'var(--color-warning)' : 'var(--accent-primary)',
                    transition: 'width 600ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Quick links ───────────────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-6)',
        }}>
          {QUICK_LINKS.map(({ href, icon: Icon, label, desc }) => (
            <a
              key={href}
              href={href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                textDecoration: 'none',
                transition: 'border-color 200ms ease, background 200ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,229,160,0.25)';
                (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)';
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon style={{ width: 15, height: 15, color: 'var(--accent-primary)' }} />
              </div>
              <div>
                <p style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{label}</p>
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>{desc}</p>
              </div>
            </a>
          ))}
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          marginBottom: 'var(--space-5)',
          padding: 'var(--space-1)',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          width: 'fit-content',
        }}>
          <button style={tabStyle('overview')} onClick={() => setActiveTab('overview')}>Overview</button>
          <button style={tabStyle('history')} onClick={() => setActiveTab('history')}>Activity</button>
          <button style={tabStyle('topup')} onClick={() => setActiveTab('topup')}>Top Up</button>
        </div>

        {/* ── Tab content ──────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Auto-detect row */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 'var(--space-3)',
              padding: 'var(--space-4) var(--space-5)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
            }}>
              <div>
                <p style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                  Auto-detect deposits
                </p>
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                  Automatically scan and credit incoming $CLAW deposits.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <button
                  type="button"
                  onClick={() => runScan()}
                  disabled={scanning}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
                    padding: 'var(--space-2) var(--space-3)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--font-xs)',
                    fontWeight: 500,
                    cursor: scanning ? 'not-allowed' : 'pointer',
                    opacity: scanning ? 0.5 : 1,
                  }}
                >
                  {scanning
                    ? <Loader2 className="animate-spin" style={{ width: 13, height: 13 }} />
                    : <Search style={{ width: 13, height: 13 }} />
                  }
                  {scanning ? 'Scanning…' : 'Scan now'}
                </button>
                {/* Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoDetect}
                  onClick={() => {
                    const next = !autoDetect;
                    setAutoDetect(next);
                    try { localStorage.setItem(AUTO_DETECT_KEY, String(next)); } catch { /* ignore */ }
                  }}
                  style={{
                    width: 40, height: 22, borderRadius: 11,
                    background: autoDetect ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                    border: `1px solid ${autoDetect ? 'var(--accent-primary)' : 'var(--border)'}`,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 200ms ease',
                    flexShrink: 0,
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    top: 2, left: autoDetect ? 20 : 2,
                    width: 16, height: 16, borderRadius: '50%',
                    background: autoDetect ? 'var(--bg)' : 'var(--text-secondary)',
                    transition: 'left 200ms ease',
                  }} />
                </button>
              </div>
            </div>

            {/* Token info card */}
            <div style={{
              padding: 'var(--space-4) var(--space-5)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(0,229,160,0.15)',
              background: 'rgba(0,229,160,0.03)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(0,229,160,0.12)',
                  border: '1px solid rgba(0,229,160,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '12px', color: 'var(--accent-primary)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  C
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: 'var(--text)' }}>$CLAW</p>
                  <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>MemeClaw AI utility token · BNB Chain (BEP-20)</p>
                </div>
                {tokenPrice > 0 && (
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-sm)', color: 'var(--accent-primary)', fontWeight: 600 }}>
                      ${tokenPrice.toFixed(6)}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>TWAP price</p>
                  </div>
                )}
              </div>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                $CLAW powers all AI features on MemeClaw. Hold a minimum balance to access Meme Studio, Image Studio, and the AI Companion. Tokens are consumed per request.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <UsageHistory walletAddress={address} limit={50} />
        )}

        {activeTab === 'topup' && (
          <TopUpForm walletAddress={address} onSuccess={handleTopUpSuccess} />
        )}

      </div>
    </AppLayout>
  );
}
