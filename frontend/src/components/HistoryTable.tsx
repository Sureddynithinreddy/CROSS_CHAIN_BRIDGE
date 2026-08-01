import React from 'react';
import { ExternalLink, CheckCircle2, Clock, XCircle, ArrowRight } from 'lucide-react';

export interface BridgeTx {
  id: string;
  direction: 'ETH_TO_SOL' | 'SOL_TO_ETH';
  sender: string;
  recipient: string;
  amount: string;
  sourceTxHash: string;
  destinationTxHash?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  errorMessage?: string;
  createdAt: string;
}

interface HistoryTableProps {
  history: BridgeTx[];
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ history }) => {
  const formatHash = (hash: string) => (hash ? `${hash.slice(0, 8)}...${hash.slice(-6)}` : '-');

  const getStatusBadge = (status: BridgeTx['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            COMPLETED
          </span>
        );
      case 'PROCESSING':
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
            <Clock className="w-3 h-3 animate-spin" />
            {status}
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            FAILED
          </span>
        );
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/15 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white font-mono-code">Bridge Transaction Log</h3>
          <p className="text-xs text-zinc-400">Real-time indexed cross-chain activity</p>
        </div>
        <span className="text-xs bg-zinc-900 text-white px-3 py-1 rounded-lg border border-white/20">
          {history.length} Transactions
        </span>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 text-sm">
          No bridge transactions found yet. Initiate your first transfer above!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-zinc-400 border-b border-white/15 uppercase tracking-wider text-[10px]">
                <th className="pb-3 px-3">Direction</th>
                <th className="pb-3 px-3">Sender ➔ Recipient</th>
                <th className="pb-3 px-3">Amount</th>
                <th className="pb-3 px-3">Source Tx</th>
                <th className="pb-3 px-3">Dest Tx</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 font-mono-code">
              {history.map((tx) => (
                <tr key={tx.id} className="hover:bg-zinc-900/80 transition-colors">
                  
                  {/* Direction */}
                  <td className="py-4 px-3 font-semibold">
                    {tx.direction === 'ETH_TO_SOL' ? (
                      <span className="text-indigo-300 flex items-center gap-1">
                        ETH ➔ SOL
                      </span>
                    ) : (
                      <span className="text-emerald-300 flex items-center gap-1">
                        SOL ➔ ETH
                      </span>
                    )}
                  </td>

                  {/* Sender & Recipient */}
                  <td className="py-4 px-3 text-zinc-300">
                    <div className="flex items-center gap-1 text-[11px]">
                      <span>{formatHash(tx.sender)}</span>
                      <ArrowRight className="w-3 h-3 text-zinc-500" />
                      <span className="text-white">{formatHash(tx.recipient)}</span>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="py-4 px-3 font-bold text-white">
                    {tx.amount} {tx.direction === 'ETH_TO_SOL' ? 'TBT' : 'wTBT'}
                  </td>

                  {/* Source Tx Hash */}
                  <td className="py-4 px-3">
                    {tx.sourceTxHash ? (
                      <span className="text-zinc-300 hover:underline hover:text-white cursor-pointer flex items-center gap-1">
                        {formatHash(tx.sourceTxHash)}
                        <ExternalLink className="w-3 h-3 text-zinc-500" />
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>

                  {/* Destination Tx Hash */}
                  <td className="py-4 px-3">
                    {tx.destinationTxHash ? (
                      <span className="text-zinc-300 hover:underline hover:text-white cursor-pointer flex items-center gap-1">
                        {formatHash(tx.destinationTxHash)}
                        <ExternalLink className="w-3 h-3 text-zinc-500" />
                      </span>
                    ) : (
                      <span className="text-zinc-500 italic">Pending Relayer</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-3">{getStatusBadge(tx.status)}</td>

                  {/* Time */}
                  <td className="py-4 px-3 text-zinc-400 text-[11px]">
                    {new Date(tx.createdAt).toLocaleTimeString()}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
