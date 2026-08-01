import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StatsBanner } from './components/StatsBanner';
import { BridgeCard } from './components/BridgeCard';
import { HistoryTable, BridgeTx } from './components/HistoryTable';
import { FaucetModal } from './components/FaucetModal';
import { Layers, Github, BookOpen, Cpu } from 'lucide-react';

export default function App() {
  const [ethAccount, setEthAccount] = useState<string | null>(null);
  const [solAccount, setSolAccount] = useState<string | null>(null);
  
  const MOCK_STATS = {
    totalTransactionsCount: 142,
    completedTransactionsCount: 139,
    pendingTransactionsCount: 3,
    totalEthDeposits: 5450,
    totalSolBurned: 3200
  };

  const MOCK_HISTORY: BridgeTx[] = [
    {
      id: 'tx-101',
      direction: 'ETH_TO_SOL',
      sender: '0x5CB02FC0c916283F5133205d827A22a54f7A2D35',
      recipient: '9xQeWvG816bUx9EPjHmaT23yvVM2VJ8U7GkWn3X9vV3',
      amount: '250.00',
      sourceTxHash: '0x3a9b1c7e4d8f2a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b',
      destinationTxHash: '5K9z2y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4',
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
    },
    {
      id: 'tx-102',
      direction: 'SOL_TO_ETH',
      sender: '7Kx4vP8y2z1w0v9u8t7s6r5q4p3o2n1m0l9k8j7h6g5',
      recipient: '0x15fF4bC008AF456CE9a8FFC731CbfaAF41dA0b0c',
      amount: '100.00',
      sourceTxHash: '4R7t9y2x1w0v9u8t7s6r5q4p3o2n1m0l9k8j7h6g5f4e3d2c1b0a',
      destinationTxHash: '0x8B391b4EE082472A8182102170fF72Ee6eAcF6873a9b1c7e4d8f2a5b6c7d8e9f',
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString()
    },
    {
      id: 'tx-103',
      direction: 'ETH_TO_SOL',
      sender: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      recipient: 'Br1dge1111111111111111111111111111111111111',
      amount: '500.00',
      sourceTxHash: '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
      destinationTxHash: '3M8z1y0x9w8v7u6t5s4r3q2p1o0n9m8l7k6j5i4h3g2f1e0d',
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
    },
    {
      id: 'tx-104',
      direction: 'ETH_TO_SOL',
      sender: '0x5CB02FC0c916283F5133205d827A22a54f7A2D35',
      recipient: '9xQeWvG816bUx9EPjHmaT23yvVM2VJ8U7GkWn3X9vV3',
      amount: '50.00',
      sourceTxHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      status: 'PROCESSING',
      createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString()
    }
  ];

  const [history, setHistory] = useState<BridgeTx[]>(MOCK_HISTORY);
  const [stats, setStats] = useState(MOCK_STATS);

  const [relayerStatus, setRelayerStatus] = useState<'online' | 'offline'>('online');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFaucetOpen, setIsFaucetOpen] = useState<boolean>(false);

  // Fetch status and history periodically
  const fetchBridgeData = async () => {
    try {
      const [resStatus, resHistory, resStats] = await Promise.all([
        fetch('/api/status').then(r => r.json()).catch(() => null),
        fetch('/api/history').then(r => r.json()).catch(() => null),
        fetch('/api/stats').then(r => r.json()).catch(() => null)
      ]);

      if (resStatus) {
        setRelayerStatus('online');
      }

      if (resHistory && resHistory.success && resHistory.history?.length > 0) {
        setHistory(resHistory.history);
      }

      if (resStats && resStats.success && resStats.stats?.totalTransactionsCount > 0) {
        setStats(resStats.stats);
      }
    } catch {
      setRelayerStatus('online');
    }
  };

  useEffect(() => {
    fetchBridgeData();
    const interval = setInterval(fetchBridgeData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Connect Ethereum MetaMask Wallet
  const connectEthWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setEthAccount(accounts[0]);
        }
      } catch (error) {
        console.error('MetaMask connection error:', error);
      }
    } else {
      // Mock account fallback for dev testing
      setEthAccount('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
    }
  };

  // Connect Solana Phantom Wallet
  const connectSolWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).solana) {
      try {
        const resp = await (window as any).solana.connect();
        setSolAccount(resp.publicKey.toString());
      } catch (error) {
        console.error('Phantom connection error:', error);
      }
    } else {
      // Mock account fallback for dev testing
      setSolAccount('9xQeWvG816bUx9EPjHmaT23yvVM2VJ8U7GkWn3X9vV3');
    }
  };

  // Handle Bridge Operation
  const handleInitiateBridge = async (
    direction: 'ETH_TO_SOL' | 'SOL_TO_ETH',
    amount: string,
    recipient: string
  ) => {
    setIsLoading(true);

    const randomTxHash = (prefix: string) => 
      prefix + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    try {
      if (direction === 'ETH_TO_SOL') {
        const depositId = (stats.totalTransactionsCount + 1).toString();
        const ethTxHash = randomTxHash('0x');

        await fetch('/api/bridge/deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            depositId,
            user: ethAccount || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
            amount,
            solanaRecipient: recipient,
            ethTxHash
          })
        });
      } else {
        const burnId = (stats.totalTransactionsCount + 1).toString();
        const solanaTxHash = randomTxHash('');

        await fetch('/api/bridge/burn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            burnId,
            solanaUser: solAccount || '9xQeWvG816bUx9EPjHmaT23yvVM2VJ8U7GkWn3X9vV3',
            amount,
            ethRecipient: recipient,
            solanaTxHash
          })
        });
      }

      await fetchBridgeData();
    } catch (error) {
      console.error('Bridge operation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      
      {/* Top Navbar */}
      <Navbar
        ethAccount={ethAccount}
        solAccount={solAccount}
        connectEthWallet={connectEthWallet}
        connectSolWallet={connectSolWallet}
        openFaucet={() => setIsFaucetOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 pb-16">
        
        {/* Banner Title */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4">
            <Cpu className="w-3.5 h-3.5" />
            <span>Lock-and-Mint & Burn-and-Unlock Architecture</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
            Seamless Cross-Chain <br />
            <span className="gradient-text-eth">Ethereum</span> ↔ <span className="gradient-text-sol">Solana</span> Bridge
          </h1>
          <p className="text-sm text-slate-400">
            Educational interoperability protocol illustrating lock-and-mint smart contract architecture, Solana Anchor programs, and off-chain relayer indexing.
          </p>
        </div>

        {/* Live Metrics */}
        <StatsBanner stats={stats} relayerStatus={relayerStatus} />

        {/* Main Bridge Interaction Card */}
        <BridgeCard
          ethAccount={ethAccount}
          solAccount={solAccount}
          onInitiateBridge={handleInitiateBridge}
          isLoading={isLoading}
        />

        {/* Transaction History Table */}
        <HistoryTable history={history} />

      </main>

      {/* Faucet Modal */}
      <FaucetModal
        isOpen={isFaucetOpen}
        onClose={() => setIsFaucetOpen(false)}
        ethAccount={ethAccount}
        solAccount={solAccount}
      />

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 bg-slate-950/60 mt-auto">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>NexusBridge Cross-Chain Protocol • Educational Project</span>
          </div>
          <div className="flex items-center space-x-6">
            <span className="hover:text-slate-300 transition-colors cursor-pointer flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> PRD Architecture
            </span>
            <span className="hover:text-slate-300 transition-colors cursor-pointer flex items-center gap-1">
              <Github className="w-3.5 h-3.5" /> GitHub
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
