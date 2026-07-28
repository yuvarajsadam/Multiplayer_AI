import React from 'react';
import { useSocket } from '../context/SocketContext';
import { Users, Circle, Sparkles } from 'lucide-react';

const UserPresence = () => {
  const { activeUsers, typingUsers, user: currentUser, streamingMessage } = useSocket();

  return (
    <div className="bg-dark-800/60 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          Active Collaborators ({activeUsers.length})
        </h3>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {activeUsers.length === 0 ? (
          <div className="text-xs text-slate-500 py-2">No active users in room</div>
        ) : (
          activeUsers.map((u) => {
            const isMe = u.id === currentUser.id;
            const isTyping = typingUsers.some(t => t.id === u.id);
            const isTriggeredAI = streamingMessage?.author?.id === u.id;

            return (
              <div
                key={u.socketId || u.id}
                className="flex items-center justify-between bg-slate-900/60 border border-slate-800/80 rounded-lg p-2 transition hover:border-slate-700"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative shrink-0">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm"
                      style={{ backgroundColor: u.color || '#3B82F6' }}
                    >
                      {u.name ? u.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-dark-800 rounded-full"></span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1">
                      <span>{u.name}</span>
                      {isMe && <span className="text-[9px] text-slate-400 bg-slate-800 px-1 py-0.2 rounded">(You)</span>}
                    </div>
                    
                    {/* Live Activity Badges */}
                    {isTyping ? (
                      <div className="text-[10px] text-indigo-400 font-medium flex items-center gap-1 animate-pulse">
                        <Circle className="w-1.5 h-1.5 fill-indigo-400" />
                        <span>Typing prompt...</span>
                      </div>
                    ) : isTriggeredAI ? (
                      <div className="text-[10px] text-amber-400 font-medium flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                        <span>Triggered AI</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500">Connected</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default UserPresence;
