import React, { useState } from 'react';
import { ArrowDown, RefreshCw, CheckCircle, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';

interface BridgeCardProps {
  ethAccount: string | null;
  solAccount: string | null;
  onInitiateBridge: (
    direction: 'ETH_TO_SOL' | 'SOL_TO_ETH',
    amount: string,
    recipient: string
  ) => Promise<void>;
  isLoading: boolean;
}

export const BridgeCard: React.FC<BridgeCardProps> = ({
  ethAccount,
  solAccount,
  onInitiateBridge,
  isLoading
}) => {
  const [direction, setDirection] = useState<'ETH_TO_SOL' | 'SOL_TO_ETH'>('ETH_TO_SOL');
  const [amount, setAmount] = useState<string>('10');
  const [customRecipient, setCustomRecipient] = useState<string>('');

  const recipient = customRecipient || (direction === 'ETH_TO_SOL' ? solAccount || '' : ethAccount || '');

  const handleBridge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    if (!recipient) {
      alert('Please enter a valid recipient address');
      return;
    }
    await onInitiateBridge(direction, amount, recipient);
  };

  const toggleDirection = () => {
    setDirection(prev => (prev === 'ETH_TO_SOL' ? 'SOL_TO_ETH' : 'ETH_TO_SOL'));
    setCustomRecipient('');
  };

  return (
    <div className="max-w-xl mx-auto glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden mb-12">
      
      {/* Decorative gradient blur backdrop */}
      <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 transition-all ${
        direction === 'ETH_TO_SOL' ? 'bg-indigo-500' : 'bg-emerald-500'
      }`}></div>

      {/* Card Header & Tabs */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Cross-Chain Transfer</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </h2>
          <p className="text-xs text-slate-400">Lock-and-Mint & Burn-and-Unlock protocol</p>
        </div>

        {/* Direction Switch Badge */}
        <div className="flex bg-black p-1 rounded-xl border border-white/20 text-xs">
          <button
            onClick={() => setDirection('ETH_TO_SOL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              direction === 'ETH_TO_SOL'
                ? 'bg-white text-black font-bold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            ETH ➔ SOL
          </button>
          <button
            onClick={() => setDirection('SOL_TO_ETH')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              direction === 'SOL_TO_ETH'
                ? 'bg-white text-black font-bold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            SOL ➔ ETH
          </button>
        </div>
      </div>

      <form onSubmit={handleBridge} className="space-y-6">

        {/* FROM BLOCK */}
        <div className="glass-card rounded-2xl p-4 border border-white/15 relative">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span>Source Chain</span>
            <span>Balance: {direction === 'ETH_TO_SOL' ? '1,000 TBT' : '100 wTBT'}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <input
              type="number"
              min="0.1"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="bg-transparent text-2xl font-bold text-white font-mono-code focus:outline-none w-full"
              required
            />

            {/* Token Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/20 bg-white/10 font-semibold text-sm text-white">
              <span className="h-2 w-2 rounded-full bg-white"></span>
              {direction === 'ETH_TO_SOL' ? 'ERC-20 (TBT)' : 'SPL (wTBT)'}
            </div>
          </div>

          <div className="mt-2 text-[11px] text-zinc-400 font-mono-code">
            Chain: {direction === 'ETH_TO_SOL' ? 'Ethereum Sepolia' : 'Solana Devnet'}
          </div>
        </div>

        {/* DIRECTION SWITCH BUTTON */}
        <div className="flex justify-center -my-3 z-10 relative">
          <button
            type="button"
            onClick={toggleDirection}
            className="p-3 rounded-full bg-black border border-white/30 text-white hover:bg-zinc-800 hover:scale-110 transition-all shadow-xl"
            title="Switch Direction"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>

        {/* TO BLOCK */}
        <div className="glass-card rounded-2xl p-4 border border-white/15">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span>Destination Chain</span>
            <span>You Receive</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="text-2xl font-bold text-white font-mono-code">
              {amount ? amount : '0.0'}
            </div>

            {/* Token Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/20 bg-white/10 font-semibold text-sm text-white">
              <span className="h-2 w-2 rounded-full bg-white"></span>
              {direction === 'ETH_TO_SOL' ? 'SPL (wTBT)' : 'ERC-20 (TBT)'}
            </div>
          </div>

          {/* RECIPIENT INPUT */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <label className="block text-xs text-zinc-400 mb-1.5">
              {direction === 'ETH_TO_SOL' ? 'Solana Wallet Recipient Address' : 'Ethereum Wallet Recipient Address'}
            </label>
            <input
              type="text"
              value={customRecipient || recipient}
              onChange={(e) => setCustomRecipient(e.target.value)}
              placeholder={direction === 'ETH_TO_SOL' ? 'Enter Solana Base58 Address...' : 'Enter 0x... Ethereum Address'}
              className="w-full glass-input rounded-xl px-3.5 py-2 text-xs font-mono-code"
              required
            />
          </div>
        </div>

        {/* SECURITY & PROTOCOL INFO */}
        <div className="rounded-xl p-3 bg-zinc-950 border border-white/10 flex items-start gap-2.5 text-xs text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-white shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">Mechanism: </span>
            {direction === 'ETH_TO_SOL'
              ? 'Tokens will be locked in Ethereum Bridge contract. Off-chain relayer indexer verifies event & mints SPL tokens.'
              : 'SPL tokens will be burned on Solana. Off-chain relayer verifies burn event & releases locked ERC-20 tokens.'}
          </div>
        </div>

        {/* ACTION BUTTON */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition-all shadow-xl flex items-center justify-center gap-2 ${
            isLoading
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/10'
              : 'bg-white hover:bg-zinc-200 text-black shadow-white/10 hover:scale-[1.01]'
          }`}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-current" />
              <span>Processing Cross-Chain Transaction...</span>
            </>
          ) : (
            <span>
              {direction === 'ETH_TO_SOL' ? 'Lock ERC-20 & Mint SPL' : 'Burn SPL & Unlock ERC-20'}
            </span>
          )}
        </button>

      </form>
    </div>
  );
};
