
import React, { useState } from 'react';
import { Trophy, Check, Zap, Star, X, ShieldCheck, LockOpen, CreditCard, Lock, Loader2, Shield, AlertCircle, Users, Calendar, Clock, Crown, Search, Bookmark, MessageSquare, Globe } from 'lucide-react';
import { createStripeCheckout } from '../services/stripe';

interface PremiumGateProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onAdminGrant?: () => void;
  onLoginClick?: () => void;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({ isOpen, onClose, onUpgrade, onAdminGrant, onLoginClick }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'daily' | 'monthly'>('monthly');

  if (!isOpen) return null;

  const handleStripeInitiate = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const checkoutUrl = await createStripeCheckout(selectedPlan);
      if (checkoutUrl === "SIMULATED_SUCCESS_PATH") {
         setTimeout(() => { onUpgrade(); setIsProcessing(false); }, 2000);
      } else {
        window.location.assign(checkoutUrl);
      }
    } catch (err) {
      setError("Payment gateway unreachable. Please try again later.");
      setIsProcessing(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="relative bg-[#0d1526] w-full max-w-2xl rounded-[3rem] border border-slate-800 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden cursor-default p-10 md:p-16 flex flex-col items-center text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>

        <button 
          onClick={onClose}
          className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors p-2"
        >
          <X className="w-6 h-6" />
        </button>

        {isProcessing ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in-95">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
            <div className="text-center">
              <h3 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">Initializing Relay...</h3>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Securing Cloud Transaction</p>
            </div>
          </div>
        ) : (
          <>
            {/* Trophy Icon - Matching Screenshot */}
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl mb-8 transform hover:scale-110 transition-transform">
              <Trophy className="text-white w-8 h-8" />
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tighter uppercase">Select Your Intel Access</h2>
            <p className="text-slate-400 text-base md:text-lg mb-12 max-w-sm font-medium">
              Get the professional edge with elite portal intelligence.
            </p>

            {error && (
              <div className="w-full mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-bold animate-shake">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Plan Grid - Matching Screenshot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full mb-12">
              <button
                onClick={() => setSelectedPlan('daily')}
                className={`group relative p-8 rounded-[2rem] border-2 transition-all text-left flex flex-col gap-4 bg-slate-900/40 ${
                  selectedPlan === 'daily' 
                  ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.15)] ring-4 ring-blue-500/10' 
                  : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <Clock className={`w-6 h-6 ${selectedPlan === 'daily' ? 'text-blue-400' : 'text-slate-600'}`} />
                  {selectedPlan === 'daily' && <Check className="w-6 h-6 text-blue-400" />}
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Daily Pass</div>
                  <div className="text-3xl font-black text-white leading-none">$1<span className="text-xs text-slate-600 ml-1">/day</span></div>
                </div>
              </button>

              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`group relative p-8 rounded-[2rem] border-2 transition-all text-left flex flex-col gap-4 bg-slate-900/40 ${
                  selectedPlan === 'monthly' 
                  ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.15)] ring-4 ring-blue-500/10' 
                  : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <Calendar className={`w-6 h-6 ${selectedPlan === 'monthly' ? 'text-blue-400' : 'text-slate-600'}`} />
                  {selectedPlan === 'monthly' && <Check className="w-6 h-6 text-blue-400" />}
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Season Access</div>
                  <div className="text-3xl font-black text-white leading-none">$19<span className="text-xs text-slate-600 ml-1">/mo</span></div>
                </div>
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-2xl">Most Popular</div>
              </button>
            </div>

            <div className="w-full space-y-8">
              <button
                onClick={handleStripeInitiate}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-[1.25rem] text-xl shadow-[0_0_50px_rgba(37,99,235,0.4)] transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-4"
              >
                <CreditCard className="w-7 h-7" />
                Pay ${selectedPlan === 'daily' ? '1.00' : '19.00'} & Get Access
              </button>
              
              <button
                onClick={() => { onClose(); if (onLoginClick) onLoginClick(); }}
                className="w-full text-slate-500 hover:text-white transition-colors text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2"
              >
                Already a Pro member? <span className="text-blue-400 underline underline-offset-4 decoration-2">Sign in here</span>
              </button>
            </div>

            <div className="mt-16 flex items-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all">
               <div className="flex flex-col items-center gap-2">
                  <Users className="w-5 h-5 text-white" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Scout</span>
               </div>
               <div className="flex flex-col items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-white" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Deep</span>
               </div>
               <div className="flex flex-col items-center gap-2">
                  <Zap className="w-5 h-5 text-white" />
                  <span className="text-[8px] font-black uppercase tracking-widest">AI</span>
               </div>
            </div>

            {onAdminGrant && (
              <button
                onClick={onAdminGrant}
                className="mt-10 text-slate-900 hover:text-slate-800 font-bold text-[8px] uppercase tracking-[0.4em] transition-all"
              >
                Admin Bypass Protocol
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
