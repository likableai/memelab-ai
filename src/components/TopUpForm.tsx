'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Contract, parseUnits } from 'ethers';
import { useEvmWallet } from './WalletProvider';
import { toast } from 'sonner';
import { getTokenConfig, recordDepositPay, recordDeposit } from '@/lib/api';
import type { TokenConfig } from '@/lib/api';
import { Copy, Loader2, ChevronDown, ChevronUp, Wallet } from 'lucide-react';

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
];

const DEFAULT_DECIMALS = 18;

function truncateAddress(addr: string, head = 8, tail = 6): string {
  if (addr.length <= head + tail) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

/** Poll until BSC transaction is confirmed or timeout. */
async function waitForBscConfirmation(
  provider: { getTransactionReceipt: (hash: string) => Promise<{ status?: number | null } | null> },
  txHash: string,
  timeoutMs: number
): Promise<void> {
  const start = Date.now();
  const interval = 1500;
  while (Date.now() - start < timeoutMs) {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (receipt && receipt.status === 1) return;
    await new Promise((r) => setTimeout(r, interval));
  }
}

interface TopUpFormProps {
  walletAddress: string;
  onSuccess?: () => void;
}

export const TopUpForm: React.FC<TopUpFormProps> = ({
  walletAddress,
  onSuccess,
}) => {
  const { address, signer, provider } = useEvmWallet();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<TokenConfig | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [txHash, setTxHash] = useState('');
  const [showReceiveElsewhere, setShowReceiveElsewhere] = useState(false);
  const [receiveTxHash, setReceiveTxHash] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');

  const fetchConfig = useCallback(async () => {
    try {
      const c = await getTokenConfig();
      setConfig(c);
      return c;
    } catch {
      setMessage({ type: 'error', text: 'Could not load token config.' });
      return null;
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const treasuryAddress = config?.treasuryWallet ?? config?.treasuryAta ?? '';
  const copyTreasuryAddress = useCallback(() => {
    if (!treasuryAddress) return;
    navigator.clipboard.writeText(treasuryAddress).then(
      () => toast.success('Treasury address copied'),
      () => toast.error('Failed to copy')
    );
  }, [treasuryAddress]);

  /** Send BEP-20 token to treasury via connected wallet. */
  const handlePayWithWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = amount.trim() ? parseFloat(amount) : NaN;
    if (isNaN(amt) || amt <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount.' });
      return;
    }
    if (!address || !signer) {
      setMessage({ type: 'error', text: 'Connect your wallet first.' });
      toast.error('Connect your wallet first.');
      return;
    }
    if (!config?.tokenMint || !config?.treasuryWallet) {
      setMessage({ type: 'error', text: 'Config not ready. Please wait or refresh.' });
      return;
    }
    const decimals = config.tokenDecimals ?? DEFAULT_DECIMALS;
    let amountRaw: bigint;
    try {
      amountRaw = parseUnits(amt.toString(), decimals);
    } catch {
      setMessage({ type: 'error', text: 'Amount too small.' });
      return;
    }
    if (amountRaw <= BigInt(0)) {
      setMessage({ type: 'error', text: 'Amount too small.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const tokenContract = new Contract(config.tokenMint, ERC20_ABI, signer);
      const tx = await tokenContract.transfer(config.treasuryWallet, amountRaw);
      const sig = tx.hash;
      setTxHash(sig);
      setMessage({ type: 'success', text: 'Transaction sent. Waiting for confirmation…' });

      const rpcProvider = signer.provider;
      if (rpcProvider) {
        await waitForBscConfirmation(rpcProvider, sig, 45000);
      }
      setMessage({ type: 'success', text: 'Transaction sent. Verifying…' });
      try {
        await recordDepositPay({
          walletAddress: address,
          txHash: sig,
        });
        setMessage({ type: 'success', text: 'Deposit verified. Your balance has been updated.' });
        toast.success('Balance credited.');
        setAmount('');
        setTxHash('');
        onSuccess?.();
      } catch (verifyErr: unknown) {
        const data = (verifyErr as { response?: { data?: { error?: string; details?: string } } })?.response?.data;
        if (data?.error === 'Transaction has already been processed') {
          setMessage({ type: 'success', text: 'Deposit verified. Your balance has been updated.' });
          toast.success('Balance credited.');
          setAmount('');
          setTxHash('');
          onSuccess?.();
        } else {
          setMessage({
            type: 'error',
            text: data?.details ?? data?.error ?? "Transaction sent. If it doesn't credit, paste the hash below to verify.",
          });
          toast.info("Transaction sent. Paste the hash below if balance didn't update.");
        }
      }
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? 'Transaction failed';
      setMessage({ type: 'error', text: msg });
      if ((err as Error)?.message?.toLowerCase().includes('reject')) {
        toast.error('You rejected the transaction.');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTxHash = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = txHash.trim();
    if (!trimmed) {
      setMessage({ type: 'error', text: 'Transaction hash is required.' });
      return;
    }
    if (!address) {
      setMessage({ type: 'error', text: 'Connect your wallet first.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await recordDepositPay({
        walletAddress: address,
        txHash: trimmed,
      });
      setMessage({ type: 'success', text: 'Deposit verified. Your balance has been updated.' });
      toast.success('Balance credited.');
      setTxHash('');
      onSuccess?.();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: string; details?: string } } })?.response?.data;
      const errorMsg =
        data?.error === 'Transaction verification failed'
          ? data?.details ?? data?.error ?? 'Transaction verification failed.'
          : data?.error === 'Transaction has already been processed'
            ? 'This transaction has already been processed.'
            : data?.error ?? (err as Error)?.message ?? 'Failed to verify deposit.';
      setMessage({ type: 'error', text: errorMsg });
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePasteTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = receiveTxHash.trim();
    if (!trimmed) {
      setMessage({ type: 'error', text: 'Transaction hash is required.' });
      return;
    }
    const amt = receiveAmount.trim() ? parseFloat(receiveAmount) : NaN;
    if (isNaN(amt) || amt < 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await recordDeposit({
        walletAddress,
        amount: amt,
        txHash: trimmed,
      });
      setMessage({ type: 'success', text: 'Balance credited successfully.' });
      toast.success(`${amt.toFixed(2)} credited.`);
      setReceiveTxHash('');
      setReceiveAmount('');
      onSuccess?.();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: string; details?: string } } })?.response?.data;
      const errorMsg =
        data?.error === 'Transaction verification failed'
          ? data?.details ?? data?.error ?? 'Transaction verification failed.'
          : data?.error === 'Transaction has already been processed'
            ? 'This transaction has already been processed.'
            : data?.error ?? (err as Error)?.message ?? 'Failed to record deposit.';
      setMessage({ type: 'error', text: errorMsg });
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const openBuyToken = () => {
    if (!config?.tokenMint) return;
    const bscScan = `https://bscscan.com/token/${config.tokenMint}`;
    window.open(bscScan, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="card"
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      <h3
        className="text-sm font-medium mb-2"
        style={{
          fontFamily: "'Times New Roman', Times, serif",
          color: 'var(--text-opacity-90)',
        }}
      >
        Top up
      </h3>

      {!config && (
        <p className="text-sm mb-4" style={{ color: 'var(--text-opacity-60)' }}>
          Loading…
        </p>
      )}

      {config && (
        <>
          <form onSubmit={handlePayWithWallet} className="space-y-4 mb-4">
            <div>
              <label
                className="block text-xs mb-1"
                style={{
                  fontFamily: "'Times New Roman', Times, serif",
                  color: 'var(--text-opacity-70)',
                }}
              >
                Amount <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="input w-full"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              />
            </div>
            {message && (
              <p
                className="text-sm"
                style={{
                  fontFamily: "'Times New Roman', Times, serif",
                  color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
                }}
              >
                {message.text}
              </p>
            )}
            <button
              type="submit"
              disabled={!amount.trim() || loading}
              className="w-full btn-primary flex items-center justify-center gap-2"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wallet className="w-4 h-4" />
              )}
              Pay with wallet
            </button>
          </form>

          <div className="mb-4 pt-3 border-t" style={{ borderColor: 'var(--border-opacity-10)' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono truncate flex-1" style={{ color: 'var(--text-opacity-70)' }}>
                {truncateAddress(treasuryAddress)}
              </span>
              <button
                type="button"
                onClick={copyTreasuryAddress}
                className="flex items-center gap-1.5 text-xs btn-secondary"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
                aria-label="Copy treasury address"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </div>
          </div>

          <form onSubmit={handleVerifyTxHash} className="space-y-4">
            <div>
              <label
                className="block text-xs mb-1"
                style={{
                  fontFamily: "'Times New Roman', Times, serif",
                  color: 'var(--text-opacity-70)',
                }}
              >
                Transaction hash <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="Tx hash"
                className="input w-full"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              />
            </div>
            {message && (
              <p
                className="text-sm"
                style={{
                  fontFamily: "'Times New Roman', Times, serif",
                  color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
                }}
              >
                {message.text}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || !txHash.trim()}
              className="w-full btn-primary flex items-center justify-center gap-2"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              {loading ? 'Verifying…' : 'Verify and credit'}
            </button>
          </form>

          <p className="text-xs mt-3" style={{ color: 'var(--text-opacity-60)' }}>
            View token on{' '}
            <button
              type="button"
              onClick={openBuyToken}
              className="underline focus:outline-none"
              style={{ color: 'var(--accent-primary)' }}
            >
              BSCScan
            </button>
          </p>

          <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--border-opacity-10)' }}>
            <button
              type="button"
              onClick={() => setShowReceiveElsewhere((v) => !v)}
              className="flex items-center gap-2 text-xs w-full justify-between"
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                color: 'var(--text-opacity-60)',
                backgroundColor: 'transparent',
              }}
            >
              <span>Received tokens elsewhere</span>
              {showReceiveElsewhere ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showReceiveElsewhere && (
              <form onSubmit={handlePasteTxSubmit} className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-opacity-70)' }}>
                    Transaction hash <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={receiveTxHash}
                    onChange={(e) => setReceiveTxHash(e.target.value)}
                    placeholder="Tx hash"
                    className="input w-full"
                    style={{ fontFamily: "'Times New Roman', Times, serif" }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-opacity-70)' }}>
                    Amount <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={receiveAmount}
                    onChange={(e) => setReceiveAmount(e.target.value)}
                    placeholder="Amount"
                    className="input w-full"
                    style={{ fontFamily: "'Times New Roman', Times, serif" }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-secondary text-sm"
                  style={{ fontFamily: "'Times New Roman', Times, serif" }}
                >
                  {loading ? 'Submitting…' : 'Submit'}
                </button>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
};
