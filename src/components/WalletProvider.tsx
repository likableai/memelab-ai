'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { BrowserProvider } from 'ethers';

const BSC_MAINNET_CHAIN_ID = 56;
const BSC_TESTNET_CHAIN_ID = 97;

interface EvmWalletContextValue {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  provider: BrowserProvider | null;
  signer: import('ethers').Signer | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  error: string | null;
  ensureBscNetwork: () => Promise<boolean>;
}

const EvmWalletContext = createContext<EvmWalletContextValue | undefined>(undefined);

function getBscChainId(): number {
  const env = process.env.NEXT_PUBLIC_BSC_CHAIN_ID;
  if (env === '97') return BSC_TESTNET_CHAIN_ID;
  return BSC_MAINNET_CHAIN_ID;
}

function getRpcUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BSC_RPC_URL?.trim() ||
    'https://bsc-dataseed1.binance.org'
  );
}

const BSC_CHAIN_PARAMS = {
  mainnet: {
    chainId: `0x${BSC_MAINNET_CHAIN_ID.toString(16)}`,
    chainName: 'BNB Smart Chain',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://bsc-dataseed1.binance.org'],
    blockExplorerUrls: ['https://bscscan.com'],
  },
  testnet: {
    chainId: `0x${BSC_TESTNET_CHAIN_ID.toString(16)}`,
    chainName: 'BNB Smart Chain Testnet',
    nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
    blockExplorerUrls: ['https://testnet.bscscan.com'],
  },
};

export const useEvmWallet = (): EvmWalletContextValue => {
  const ctx = useContext(EvmWalletContext);
  if (!ctx) {
    throw new Error('useEvmWallet must be used within EvmWalletProvider');
  }
  return ctx;
};

interface EvmWalletProviderProps {
  children: ReactNode;
}

export const EvmWalletProvider: React.FC<EvmWalletProviderProps> = ({
  children,
}) => {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<import('ethers').Signer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const targetChainId = getBscChainId();

  const ensureBscNetwork = useCallback(async (): Promise<boolean> => {
    const ethereum = (typeof window !== 'undefined' && (window as unknown as { ethereum?: { request: (args: unknown) => Promise<unknown> } }).ethereum) ?? null;
    if (!ethereum) {
      setError('MetaMask not installed');
      return false;
    }
    try {
      const currentChainIdHex = await ethereum.request({ method: 'eth_chainId' }) as string;
      const currentChainId = parseInt(currentChainIdHex, 16);
      if (currentChainId === targetChainId) return true;
      const params = targetChainId === BSC_TESTNET_CHAIN_ID
        ? BSC_CHAIN_PARAMS.testnet
        : BSC_CHAIN_PARAMS.mainnet;
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: params.chainId }],
      }).catch(async (err: { code?: number }) => {
        if (err?.code === 4902) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [params],
          });
        } else {
          throw err;
        }
      });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to switch network';
      setError(msg);
      return false;
    }
  }, [targetChainId]);

  const connect = useCallback(async () => {
    setError(null);
    const ethereum = (typeof window !== 'undefined' && (window as unknown as { ethereum?: { request: (args: unknown) => Promise<unknown> } }).ethereum) ?? null;
    if (!ethereum) {
      setError('MetaMask not installed. Please install MetaMask.');
      return;
    }
    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      if (!accounts?.length) {
        setError('No accounts found');
        return;
      }
      const ok = await ensureBscNetwork();
      if (!ok) return;

      const rpcUrl = getRpcUrl();
      const prov = new BrowserProvider(ethereum);
      const chainIdRes = await prov.getNetwork();
      const signerInstance = await prov.getSigner();

      setAddress(accounts[0]);
      setChainId(Number(chainIdRes.chainId));
      setProvider(prov);
      setSigner(signerInstance);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to connect wallet';
      if (msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('denied')) {
        setError(null);
      } else {
        setError(msg);
      }
    }
  }, [ensureBscNetwork]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
    setError(null);
  }, []);

  useEffect(() => {
    const ethereum = (typeof window !== 'undefined' && (window as unknown as { ethereum?: { on: (event: string, cb: (...args: unknown[]) => void) => void } }).ethereum) ?? null;
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const list = Array.isArray(accounts) ? accounts : [];
      if (list.length === 0) {
        disconnect();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    ethereum.on?.('accountsChanged', handleAccountsChanged);
    ethereum.on?.('chainChanged', handleChainChanged);

    return () => {
      const e = ethereum as { removeAllListeners?: (event: string) => void };
      e.removeAllListeners?.('accountsChanged');
      e.removeAllListeners?.('chainChanged');
    };
  }, [disconnect]);

  useEffect(() => {
    const checkExisting = async () => {
      const ethereum = (typeof window !== 'undefined' && (window as unknown as { ethereum?: { request: (args: unknown) => Promise<unknown> } }).ethereum) ?? null;
      if (!ethereum) return;
      try {
        const accounts = await ethereum.request({ method: 'eth_accounts' }) as string[];
        if (accounts?.length) {
          const prov = new BrowserProvider(ethereum);
          const chain = await prov.getNetwork();
          const signerInstance = await prov.getSigner();
          setAddress(accounts[0]);
          setChainId(Number(chain.chainId));
          setProvider(prov);
          setSigner(signerInstance);
        }
      } catch {
        // Ignore
      }
    };
    checkExisting();
  }, []);

  const value: EvmWalletContextValue = {
    address,
    isConnected: !!address,
    chainId,
    provider,
    signer,
    connect,
    disconnect,
    error,
    ensureBscNetwork,
  };

  return (
    <EvmWalletContext.Provider value={value}>
      {children}
    </EvmWalletContext.Provider>
  );
};
