import React from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import UserPresence from './UserPresence';
import UsageMetricsCard from './UsageMetricsCard';
import RoleSelector from './RoleSelector';
import { Sparkles, History, Plus, Layers, Hash, Check, Key, X } from 'lucide-react';

const QUICK_PROMPTS = [
  { label: 'Refactor Express route', prompt: 'Refactor an Express.js POST route with input validation and error handling.', role: 'Coder AI' },
  { label: 'System Design Architecture', prompt: 'Design a high availability real-time chat architecture with microservices and Redis pub/sub.', role: 'Architect AI' },
  { label: 'Security Code Review', prompt: 'Audit this snippet for SQL injection, XSS, and race conditions.', role: 'Reviewer AI' }
];

const Sidebar = ({ onOpenRoomModal, onOpenVersionModal, onOpenAuthModal, isMobileOpen, onCloseMobile }) => {
  const { roomId, joinedRooms, joinRoom, chatHistory, sendDraftPrompt, switchRole } = useSocket();
  const { user } = useAuth();

  const handleApplyTemplate = (item) => {
    switchRole(item.role);
    sendDraftPrompt(item.prompt);
    if (onCloseMobile) onCloseMobile();
  };

  const handleSelectRoom = (rId, rName) => {
    joinRoom(rId, rName);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      <aside
        className={`w-80 bg-dark-800/95 border-r border-slate-800 flex flex-col h-full shrink-0 select-none transition-transform duration-300 z-40 ${
          isMobileOpen
            ? 'fixed inset-y-0 left-0 translate-x-0 shadow-2xl md:relative md:translate-x-0'
            : 'fixed inset-y-0 left-0 -translate-x-full md:relative md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Room Workspaces</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { onOpenRoomModal(); if (onCloseMobile) onCloseMobile(); }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 hover:bg-slate-800 px-2 py-1 rounded transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New / Join</span>
            </button>
            {/* Close Button for Mobile Drawer */}
            <button
              onClick={onCloseMobile}
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Mobile Role Selector */}
          <div className="lg:hidden bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider mb-2">AI Persona Role</div>
            <RoleSelector />
          </div>

          {/* Active Room Info Box */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Active Workspace</div>
            <div className="text-sm font-bold text-slate-100 mt-0.5 truncate">{roomId ? `Room #${roomId}` : 'No Room Selected'}</div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
              <span>Total Messages:</span>
              <span className="font-semibold text-indigo-400">{chatHistory.length}</span>
            </div>
          </div>

          {/* Joined Workspaces List */}
          {joinedRooms && joinedRooms.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Joined Workspaces ({joinedRooms.length})</span>
                </span>
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {joinedRooms.map((r) => {
                  const isActive = r.roomId === roomId;
                  return (
                    <button
                      key={r.roomId}
                      onClick={() => handleSelectRoom(r.roomId, r.name)}
                      className={`w-full text-left p-2 rounded-xl border transition flex items-center justify-between text-xs ${
                        isActive
                          ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-bold'
                          : 'bg-slate-900/40 border-slate-800/80 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="truncate min-w-0 pr-2">
                        <div className="truncate font-semibold">{r.name || `Room #${r.roomId}`}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Code: {r.roomId}</div>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Usage Metrics Progress Tracker or Auth Card */}
          {user ? (
            <UsageMetricsCard />
          ) : (
            <div className="bg-gradient-to-r from-indigo-900/40 to-violet-900/40 border border-indigo-500/30 rounded-xl p-3.5 space-y-2">
              <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" />
                <span>Account Integration</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-tight">
                Sign in or create an account to track AI token usage, save workspaces, and unlock multi-tenant features.
              </p>
              <button
                onClick={() => { onOpenAuthModal(); if (onCloseMobile) onCloseMobile(); }}
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition shadow-md shadow-indigo-600/30"
              >
                Login / Sign Up
              </button>
            </div>
          )}

          {/* User Presence System */}
          <UserPresence />

          {/* Version History Toggle Button */}
          <button
            onClick={() => { onOpenVersionModal(); if (onCloseMobile) onCloseMobile(); }}
            className="w-full bg-slate-900/80 border border-slate-800 hover:border-indigo-500/60 text-slate-200 text-xs font-semibold p-3 rounded-xl transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400 group-hover:rotate-[-20deg] transition-transform" />
              <span>Prompt Version History</span>
            </div>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30">View All</span>
          </button>

          {/* Quick Prompt Starters */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Collaborative Starters</span>
            </div>
            <div className="space-y-1.5">
              {QUICK_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyTemplate(item)}
                  className="w-full text-left p-2.5 bg-slate-900/40 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 rounded-lg text-xs transition group"
                >
                  <div className="font-medium text-slate-300 group-hover:text-indigo-400 flex items-center justify-between">
                    <span>{item.label}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">{item.role}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-1">{item.prompt}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/50 text-[11px] text-slate-400 text-center">
          <span>JWT WebSockets • Rate-Engine Active</span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
