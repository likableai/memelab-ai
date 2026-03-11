'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useEvmWallet } from '@/components/WalletProvider';
import { toast } from 'sonner';
import { AppLayout } from '@/components/AppLayout';
import { UsageSummary } from '@/components/UsageSummary';
import { UsageHistory } from '@/components/UsageHistory';
import { TopUpForm } from '@/components/TopUpForm';
import { getTokenBalance, getTokenPrice, scanDeposits } from '@/lib/api';
import { WalletButton } from '@/components/WalletButton';
import { RefreshCw, Search, Loader2 } from 'lucide-react';

const AUTO_DETECT_KEY = 'autoDetectDeposits';
const SCAN_INTERVAL_MS = 45_000;

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
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isScanningRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!isConnected || !address) return;
    setLoading(true);
    try {
      const [bal, price] = await Promise.all([
        getTokenBalance(address),
        getTokenPrice(),
      ]);
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

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTO_DETECT_KEY);
      setAutoDetect(raw === 'true');
    } catch {
      setAutoDetect(false);
    }
  }, []);

  const runScan = useCallback(async () => {
    if (!address || isScanningRef.current) return;
    isScanningRef.current = true;
    setScanning(true);
    try {
      const res = await scanDeposits(address);
      if (res.credited.length > 0) {
        const total = res.credited.reduce((s, c) => s + c.amount, 0);
        toast.success(`${total.toFixed(2)} LIKA credited.`);
        setRefreshTrigger((n) => n + 1);
      }
    } catch (e: any) {
      if (e?.code !== 'ERR_NETWORK' && e?.message !== 'Network Error') {
        toast.error(e?.response?.data?.error ?? 'Failed to scan deposits.');
      }
    } finally {
      isScanningRef.current = false;
      setScanning(false);
    }
  }, [address]);

  useEffect(() => {
    if (!autoDetect || !address) {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      return;
    }
    runScan();
    const tick = () => runScan();
    scanIntervalRef.current = setInterval(tick, SCAN_INTERVAL_MS);
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
  }, [autoDetect, address, runScan]);

  const handleAutoDetectChange = useCallback((on: boolean) => {
    setAutoDetect(on);
    try {
      localStorage.setItem(AUTO_DETECT_KEY, String(on));
    } catch {
      /* ignore */
    }
  }, []);

  const handleTopUpSuccess = useCallback(() => {
    setRefreshTrigger((n) => n + 1);
  }, []);

  if (!isConnected || !address) {
    return (
      <AppLayout>
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-12) var(--space-6)',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              marginBottom: 'var(--space-3)',
            }}
          >
            Dashboard
          </h1>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', maxWidth: '400px', lineHeight: 1.6 }}>
            Connect your wallet to view your $LIKA balance, usage history, and top up.
          </p>
          <WalletButton />
        </div>
      </AppLayout>
    );
  }

  const usdValue = balance ? (balance.balanceUsd ?? balance.currentBalance * tokenPrice) : 0;
  const minUsd = balance?.minDepositUsd ?? 1;
  const canAccess = balance?.canAccess ?? usdValue >= minUsd;

  return (
    <AppLayout>
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: 'var(--space-12) var(--space-6)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-8)',
          }}
        >
          <div>
            <p
              style={{
                fontSize: 'var(--font-xs)',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--accent-primary)',
                marginBottom: 'var(--space-2)',
              }}
            >
              Account
            </p>
            <h1
              style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
              }}
            >
              Dashboard
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <WalletButton />
            <button
              onClick={() => setRefreshTrigger((n) => n + 1)}
              disabled={loading}
              aria-label="Refresh data"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-4)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: 'var(--font-sm)',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                transition: 'all 150ms ease',
              }}
            >
              <RefreshCw className={loading ? 'animate-spin' : ''} style={{ width: '16px', height: '16px' }} />
              Refresh
            </button>
          </div>
        </div>

        {/* Balance Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-8)',
          }}
        >
          {/* Balance */}
          <div
            style={{
              padding: 'var(--space-6)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-secondary)',
            }}
          >
            <p style={{ fontSize: 'var(--font-xs)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
              Balance
            </p>
            {loading && !balance ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>Loading…</p>
            ) : balance ? (
              <>
                <p style={{ fontSize: 'var(--font-3xl)', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {balance.currentBalance.toFixed(2)}
                  <span style={{ fontSize: 'var(--font-sm)', fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 'var(--space-2)' }}>LIKA</span>
                </p>
                <p style={{ fontSize: 'var(--font-sm)', color: canAccess ? 'var(--text-secondary)' : 'var(--accent-primary)', marginTop: 'var(--space-2)' }}>
                  {canAccess ? `≈ $${usdValue.toFixed(2)}` : `Min $${minUsd} required to use chat/voice`}
                </p>
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)', opacity: 0.7 }}>
                  Deposited: {balance.depositedAmount.toFixed(2)} LIKA
                </p>
              </>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>—</p>
            )}
          </div>

          {/* Usage */}
          {balance && (
            <UsageSummary
              consumedAmount={balance.consumedAmount}
              tokenPrice={tokenPrice}
            />
          )}
        </div>

        {/* Usage History */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <UsageHistory walletAddress={address} limit={50} />
        </div>

        {/* Top-up + Auto-detect */}
        <div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 'var(--space-4)',
              padding: 'var(--space-4)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                cursor: 'pointer',
                fontSize: 'var(--font-sm)',
                color: 'var(--text)',
                fontWeight: 500,
              }}
            >
              <input
                type="checkbox"
                checked={autoDetect}
                onChange={(e) => handleAutoDetectChange(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: 'var(--accent-primary)',
                  cursor: 'pointer',
                }}
                aria-label="Auto-detect deposits"
              />
              Auto-detect deposits
            </label>
            <button
              type="button"
              onClick={() => runScan()}
              disabled={scanning}
              aria-label="Scan for deposits"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-4)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: 'var(--font-sm)',
                fontWeight: 500,
                cursor: scanning ? 'not-allowed' : 'pointer',
                opacity: scanning ? 0.5 : 1,
              }}
            >
              {scanning ? (
                <Loader2 className="animate-spin" style={{ width: '16px', height: '16px' }} />
              ) : (
                <Search style={{ width: '16px', height: '16px' }} />
              )}
              Scan deposits
            </button>
          </div>
          <TopUpForm
            walletAddress={address}
            onSuccess={handleTopUpSuccess}
          />
        </div>
      </div>
    </AppLayout>
  );
}
