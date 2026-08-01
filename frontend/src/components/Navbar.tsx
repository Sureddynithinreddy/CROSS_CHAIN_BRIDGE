import React from 'react';
import { Wallet, ShieldCheck, ArrowLeftRight, ExternalLink } from 'lucide-react';

interface NavbarProps {
  ethAccount: string | null;
  solAccount: string | null;
  connectEthWallet: () => void;
  connectSolWallet: () => void;
  openFaucet: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  ethAccount,
  solAccount,
  connectEthWallet,
  connectSolWallet,
  openFaucet
}) => {
  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/10 px-4 lg:px-8 py-4 mb-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-white/10 p-0.5 flex items-center justify-center border border-white/20">
            <div className="h-full w-full bg-black rounded-[10px] flex items-center justify-center">
              <ArrowLeftRight className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-mono-code">NexusBridge</h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase bg-white/10 text-white px-2 py-0.5 rounded-full border border-white/20">
                Educational
              </span>
            </div>
            <p className="text-xs text-zinc-400">Ethereum Sepolia ↔ Solana Devnet</p>
          </div>
        </div>

        {/* Action Controls & Wallets */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Faucet Button */}
          <button
            onClick={openFaucet}
            className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white border border-white/20 transition-all flex items-center gap-1.5"
          >
            <span>🚰 Faucet</span>
          </button>

          {/* Ethereum Wallet Connection */}
          <button
            onClick={connectEthWallet}
            className={`text-xs font-medium px-4 py-2 rounded-xl border transition-all flex items-center gap-2 ${
              ethAccount
                ? 'bg-zinc-900 border-white/30 text-white'
                : 'bg-white hover:bg-zinc-200 text-black font-bold border-transparent'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse"></span>
            <span className="font-mono-code">
              {ethAccount ? `ETH: ${formatAddress(ethAccount)}` : 'Connect MetaMask'}
            </span>
          </button>

          {/* Solana Wallet Connection */}
          <button
            onClick={connectSolWallet}
            className={`text-xs font-medium px-4 py-2 rounded-xl border transition-all flex items-center gap-2 ${
              solAccount
                ? 'bg-zinc-900 border-white/30 text-white'
                : 'bg-white hover:bg-zinc-200 text-black font-bold border-transparent'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono-code">
              {solAccount ? `SOL: ${formatAddress(solAccount)}` : 'Connect Phantom'}
            </span>
          </button>
        </div>

      </div>
    </header>
  );
};
