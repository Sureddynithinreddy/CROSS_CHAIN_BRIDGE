import React from 'react';
import { Lock, Coins, Activity, CheckCircle2 } from 'lucide-react';

interface StatsProps {
  stats: {
    totalTransactionsCount: number;
    completedTransactionsCount: number;
    pendingTransactionsCount: number;
    totalEthDeposits: number;
    totalSolBurned: number;
  };
  relayerStatus: 'online' | 'offline';
}

export const StatsBanner: React.FC<StatsProps> = ({ stats, relayerStatus }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      
      {/* Total Locked Metric */}
      <div className="glass-card rounded-2xl p-4 border border-white/15">
        <div className="flex items-center justify-between text-zinc-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">ETH Locked</span>
          <div className="p-1.5 rounded-lg bg-white/10 text-white border border-white/10">
            <Lock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white font-mono-code">
          {stats.totalEthDeposits} <span className="text-sm font-normal text-zinc-400">TBT</span>
        </div>
        <p className="text-[11px] text-zinc-400 mt-1">Ethereum Bridge Balance</p>
      </div>

      {/* Total Minted Metric */}
      <div className="glass-card rounded-2xl p-4 border border-white/15">
        <div className="flex items-center justify-between text-zinc-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">SPL Minted</span>
          <div className="p-1.5 rounded-lg bg-white/10 text-white border border-white/10">
            <Coins className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white font-mono-code">
          {stats.totalSolBurned} <span className="text-sm font-normal text-zinc-400">wTBT</span>
        </div>
        <p className="text-[11px] text-zinc-400 mt-1">Solana Active Supply</p>
      </div>

      {/* Transactions Metric */}
      <div className="glass-card rounded-2xl p-4 border border-white/15">
        <div className="flex items-center justify-between text-zinc-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Bridge Ops</span>
          <div className="p-1.5 rounded-lg bg-white/10 text-white border border-white/10">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white font-mono-code">
          {stats.totalTransactionsCount}
        </div>
        <p className="text-[11px] text-zinc-400 mt-1">
          {stats.completedTransactionsCount} Success / {stats.pendingTransactionsCount} Pending
        </p>
      </div>

      {/* Relayer Engine Health */}
      <div className="glass-card rounded-2xl p-4 border border-white/15">
        <div className="flex items-center justify-between text-zinc-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Relayer Network</span>
          <div className="p-1.5 rounded-lg bg-white/10 text-white border border-white/10">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className={`h-3 w-3 rounded-full ${relayerStatus === 'online' ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`}></span>
          <span className="text-lg font-bold text-white uppercase font-mono-code">
            {relayerStatus}
          </span>
        </div>
        <p className="text-[11px] text-zinc-400 mt-1">Auto-indexing active</p>
      </div>

    </div>
  );
};
