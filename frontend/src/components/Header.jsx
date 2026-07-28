import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Copy, Check, Users, Sparkles, Wifi, WifiOff, LogIn, LogOut, Shield } from 'lucide-react';
import RoleSelector from './RoleSelector';

const Header = ({ onOpenRoomModal, onOpenAuthModal }) => {
  const { isConnected, roomId, activeUsers } = useSocket();
  const { user: saasUser, logout } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (!roomId) return;
    const shareUrl = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-dark-800/80 backdrop-blur-md px-6 flex items-center justify-between select-none z-20">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-slate-100 text-base tracking-wide">Multiplayer AI Workspace</h1>
            <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${
              isConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isConnected ? 'LIVE SYNC' : 'OFFLINE'}
            </span>
          </div>
          <p className="text-xs text-slate-400">Scalable SaaS AI Collaboration Engine</p>
        </div>
      </div>

      {/* Center: Role Selector & Room Code Link */}
      <div className="hidden md:flex items-center gap-4">
        <RoleSelector />

        {roomId && (
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs">
            <span className="text-slate-400 font-mono">Room: <strong className="text-indigo-400 font-semibold">{roomId}</strong></span>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition"
              title="Copy Share Link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Share'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Right Controls: SaaS Auth & Online Count */}
      <div className="flex items-center gap-3">
        {/* Active Online Count Badge */}
        <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 rounded-full px-3 py-1 text-xs font-medium text-slate-300">
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          <span>{activeUsers.length} active</span>
        </div>

        {/* Change / Create Room Action */}
        <button
          onClick={onOpenRoomModal}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition shadow-md shadow-indigo-600/20"
        >
          Rooms
        </button>

        {/* SaaS User Account / Login Button */}
        {saasUser ? (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] text-white"
              style={{ backgroundColor: saasUser.avatarColor || '#3B82F6' }}
            >
              {saasUser.name ? saasUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-left leading-tight hidden lg:block">
              <div className="font-semibold text-slate-200 truncate max-w-[90px]">{saasUser.name}</div>
              <div className="text-[9px] text-indigo-400 font-mono uppercase">{saasUser.tier || 'free'} tier</div>
            </div>
            <button
              onClick={logout}
              className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition ml-1"
              title="Logout SaaS Account"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
          >
            <LogIn className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
