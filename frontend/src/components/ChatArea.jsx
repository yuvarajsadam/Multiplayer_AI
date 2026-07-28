import React, { useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import ChatMessage from './ChatMessage';
import { Bot, Sparkles, MessageSquare } from 'lucide-react';

const ChatArea = ({ onEditPrompt, onViewVersions }) => {
  const { chatHistory, streamingMessage, roomId } = useSocket();
  const bottomRef = useRef(null);

  // Auto-scroll to latest streaming message or new entry
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, streamingMessage?.response]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {chatHistory.length === 0 && !streamingMessage ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-xl">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Welcome to Room #{roomId}</h2>
          <p className="text-sm text-slate-400 max-w-md mt-2 leading-relaxed">
            Collaborate in real-time with team members. Edit prompts together live, switch AI personas dynamically, and stream token-by-token responses.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-slate-400">
            <span className="px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700">⚡ Live WebSocket Sync</span>
            <span className="px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700">🤖 Multiple AI Personas</span>
            <span className="px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700">📜 Prompt Versioning</span>
          </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto space-y-6">
          {chatHistory.map((msg) => (
            <ChatMessage
              key={msg.messageId}
              message={msg}
              onEditPrompt={onEditPrompt}
              onViewVersions={onViewVersions}
            />
          ))}

          {/* Active Token-by-Token Streaming Message Card */}
          {streamingMessage && (
            <ChatMessage
              key={streamingMessage.messageId}
              message={streamingMessage}
              onEditPrompt={onEditPrompt}
              onViewVersions={onViewVersions}
            />
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};

export default ChatArea;
