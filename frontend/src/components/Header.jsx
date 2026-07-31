import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Copy, Check, Users, Sparkles, Wifi, WifiOff, LogIn, LogOut, Menu } from 'lucide-react';
import RoleSelector from './RoleSelector';

const Header = ({ onOpenRoomModal, onOpenAuthModal, onToggleMobileSidebar }) => {
  const { isConnected, roomId, activeUsers } = useSocket();
  const { user: saasUser, logout } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleCopyRoomCode = () => {
    if (!roomId) return;
    // Copy ONLY the room code, NOT the full URL link
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-dark-800/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between select-none z-20">
      {/* Brand Title & Mobile Menu Button */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Toggle Button for Sidebar */}
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="font-bold text-slate-100 text-xs sm:text-base tracking-wide truncate max-w-[140px] sm:max-w-none">Multiplayer AI</h1>
            <span className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full font-medium ${
              isConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span className="hidden xs:inline">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">Real-Time AI Collaboration Engine</p>
        </div>
      </div>

      {/* Center: Role Selector & Room Code Box */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden lg:block">
          <RoleSelector />
        </div>

        {roomId && (
          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/80 border border-slate-700/60 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-xs">
            <span className="text-slate-400 font-mono text-[11px] sm:text-xs">
              Code: <strong className="text-indigo-400 font-semibold">{roomId}</strong>
            </span>
            <button
              onClick={handleCopyRoomCode}
              className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded transition text-[11px] sm:text-xs"
              title="Copy Room Code"
            >
              {copied ? <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" /> : <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Right Controls: Online Count, Room Modal & Login / Sign Up */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Active Online Count Badge */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 rounded-full px-2.5 sm:px-3 py-1 text-xs font-medium text-slate-300">
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          <span>{activeUsers.length}</span>
        </div>

        {/* Change / Create Room Action */}
        <button
          onClick={onOpenRoomModal}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-lg transition shadow-md shadow-indigo-600/20"
        >
          Rooms
        </button>

        {/* SaaS User Account / Login & Signup Button */}
        {saasUser ? (
          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900 border border-slate-700 rounded-lg px-2 sm:px-2.5 py-1.5 text-xs">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] text-white shrink-0"
              style={{ backgroundColor: saasUser.avatarColor || '#3B82F6' }}
            >
              {saasUser.name ? saasUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-left leading-tight hidden xl:block">
              <div className="font-semibold text-slate-200 truncate max-w-[90px]">{saasUser.name}</div>
              <div className="text-[9px] text-indigo-400 font-mono uppercase">{saasUser.tier || 'free'} tier</div>
            </div>
            <button
              onClick={logout}
              className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition"
              title="Logout Account"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg transition shadow"
          >
            <LogIn className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Login / Sign Up</span>
            <span className="sm:hidden">Login</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
