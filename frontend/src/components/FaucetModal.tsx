import React, { useState } from 'react';
import { X, Droplets, CheckCircle, Sparkles } from 'lucide-react';

interface FaucetModalProps {
  isOpen: boolean;
  onClose: () => void;
  ethAccount: string | null;
  solAccount: string | null;
}

export const FaucetModal: React.FC<FaucetModalProps> = ({
  isOpen,
  onClose,
  ethAccount,
  solAccount
}) => {
  const [isMinting, setIsMinting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleClaimErc20 = async () => {
    setIsMinting(true);
    setSuccessMsg('');
    setTimeout(() => {
      setIsMinting(false);
      setSuccessMsg('Successfully minted 1,000 TBT test tokens to your Ethereum wallet!');
    }, 1500);
  };

  const handleClaimSol = async () => {
    setIsMinting(true);
    setSuccessMsg('');
    setTimeout(() => {
      setIsMinting(false);
      setSuccessMsg('Successfully requested 1.0 SOL test faucet drop to your Solana wallet!');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-md w-full glass-panel rounded-3xl p-6 border border-white/10 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
              <span>Testnet Faucet</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h3>
            <p className="text-xs text-slate-400">Mint free test tokens for bridge testing</p>
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Faucet Options */}
        <div className="space-y-3">
          
          {/* Ethereum ERC-20 Faucet */}
          <div className="glass-card rounded-2xl p-4 border border-indigo-500/20 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">ERC-20 Test Token (TBT)</div>
              <div className="text-[11px] text-slate-400 font-mono-code">1,000 TBT per claim</div>
            </div>
            <button
              onClick={handleClaimErc20}
              disabled={isMinting}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
            >
              {isMinting ? 'Minting...' : 'Claim TBT'}
            </button>
          </div>

          {/* Solana Devnet Faucet */}
          <div className="glass-card rounded-2xl p-4 border border-emerald-500/20 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">Solana Devnet SOL</div>
              <div className="text-[11px] text-slate-400 font-mono-code">1.0 SOL for gas</div>
            </div>
            <button
              onClick={handleClaimSol}
              disabled={isMinting}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
            >
              {isMinting ? 'Requesting...' : 'Claim SOL'}
            </button>
          </div>

        </div>

        <p className="mt-6 text-center text-[11px] text-slate-500">
          Educational Bridge Faucet • No real economic value
        </p>

      </div>
    </div>
  );
};
