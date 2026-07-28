import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import TypingIndicator from './TypingIndicator';
import { Play, Sparkles, Trash2, Edit3, UserCheck } from 'lucide-react';

const SharedPromptEditor = ({ editingMessageId, onCancelEdit }) => {
  const {
    liveDraftPrompt,
    sendDraftPrompt,
    executePrompt,
    activeRole,
    lastEditor,
    sendTypingStatus,
    streamingMessage,
    user
  } = useSocket();

  const [promptInput, setPromptInput] = useState(liveDraftPrompt || '');
  const typingTimeoutRef = useRef(null);

  // Sync internal input state with incoming WebSocket live draft updates
  useEffect(() => {
    setPromptInput(liveDraftPrompt);
  }, [liveDraftPrompt]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setPromptInput(val);
    sendDraftPrompt(val);

    // Trigger live typing indicator to other room members
    sendTypingStatus(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 1500);
  };

  const handleExecute = (e) => {
    e.preventDefault();
    if (!promptInput.trim() || streamingMessage) return;

    executePrompt(promptInput, editingMessageId);
    sendTypingStatus(false);
    if (onCancelEdit) onCancelEdit();
  };

  const handleClear = () => {
    sendDraftPrompt('');
    if (onCancelEdit) onCancelEdit();
  };

  const isStreaming = !!streamingMessage;

  return (
    <div className="border-t border-slate-800 bg-dark-800/90 p-4 relative z-10">
      <div className="max-w-5xl mx-auto space-y-2">
        {/* Top Bar: Typing Indicator & Last Editor Info */}
        <div className="flex items-center justify-between text-xs min-h-[24px]">
          <TypingIndicator />

          {lastEditor && lastEditor.id !== user.id && (
            <div className="flex items-center gap-1.5 text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-full border border-slate-800">
              <UserCheck className="w-3 h-3 text-indigo-400" />
              <span>Last edited live by <strong className="text-slate-200">{lastEditor.name}</strong></span>
            </div>
          )}

          {editingMessageId && (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2.5 py-1 rounded-md">
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editing Version for Execution</span>
              <button onClick={onCancelEdit} className="hover:underline font-semibold ml-2">Cancel</button>
            </div>
          )}
        </div>

        {/* Collaborative Textarea Box */}
        <form onSubmit={handleExecute} className="relative group">
          <textarea
            value={promptInput}
            onChange={handleInputChange}
            placeholder={`Collaborate on prompt here for ${activeRole}... (Live synced across room)`}
            rows={3}
            disabled={isStreaming}
            className="w-full glass-input rounded-xl p-3.5 pr-28 text-slate-100 text-sm placeholder-slate-500 focus:outline-none transition resize-none disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleExecute(e);
              }
            }}
          />

          {/* Action Buttons inside Textarea */}
          <div className="absolute right-3 bottom-4 flex items-center gap-2">
            {promptInput && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
                title="Clear Draft"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={!promptInput.trim() || isStreaming}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg transition ${
                !promptInput.trim() || isStreaming
                  ? 'bg-slate-700 opacity-50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-600/30 active:scale-95'
              }`}
            >
              {isStreaming ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Streaming AI...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>{editingMessageId ? 'Re-run (v+1)' : 'Execute'}</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">Ctrl + Enter</kbd> to execute prompt</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Real-time draft sync enabled
          </span>
        </div>
      </div>
    </div>
  );
};

export default SharedPromptEditor;
