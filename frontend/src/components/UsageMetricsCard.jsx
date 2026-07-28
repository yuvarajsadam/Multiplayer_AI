import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Cpu, Zap, Award } from 'lucide-react';

const UsageMetricsCard = () => {
  const { user } = useAuth();

  if (!user) return null;

  const quota = user.monthlyTokenQuota || 100000;
  const used = user.tokensUsed || 0;
  const percentage = Math.min(Math.round((used / quota) * 100), 100);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span>AI Token Usage</span>
        </div>
        <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-semibold border border-indigo-500/30 uppercase">
          {user.tier || 'Free'} Tier
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            percentage > 90 ? 'bg-rose-500' : percentage > 70 ? 'bg-amber-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>{used.toLocaleString()} / {quota.toLocaleString()} tokens</span>
        <span className="font-semibold text-indigo-400">{percentage}%</span>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/80 pt-1.5">
        <span>Prompts Sent: <strong className="text-slate-300">{user.promptsExecuted || 0}</strong></span>
        <span className="flex items-center gap-1 text-amber-400 font-medium">
          <Zap className="w-3 h-3 fill-amber-400" />
          Live Gemini Stream
        </span>
      </div>
    </div>
  );
};

export default UsageMetricsCard;
