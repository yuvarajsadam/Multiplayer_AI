import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Code2, Layers, ShieldCheck, ThumbsUp, ThumbsDown, Copy, Check, RotateCcw, History, Sparkles } from 'lucide-react';

const ROLE_CONFIG = {
  'Coder AI': { icon: Code2, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  'Architect AI': { icon: Layers, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  'Reviewer AI': { icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' }
};

const formatInlineText = (text) => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={i} className="font-semibold text-slate-100">{p.slice(2, -2)}</strong>;
    }
    if (p.startsWith('`') && p.endsWith('`')) {
      return <code key={i} className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono">{p.slice(1, -1)}</code>;
    }
    return p;
  });
};

const FormattedMarkdown = ({ content, isStreaming }) => {
  if (!content) {
    return isStreaming ? <span className="text-slate-400 italic">Thinking...</span> : null;
  }

  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className={`space-y-2 text-sm text-slate-200 leading-relaxed ${isStreaming ? 'streaming-cursor' : ''}`}>
      {parts.map((part, idx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const match = part.match(/^```(\w+)?\n([\s\S]*?)```$/);
          const lang = match ? match[1] || 'code' : 'code';
          const codeText = match ? match[2] : part.slice(3, -3);

          return (
            <div key={idx} className="my-3 rounded-lg overflow-hidden border border-slate-700/80 bg-slate-950/90 shadow-md">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400">
                <span className="uppercase text-[10px] font-bold tracking-wider text-indigo-400">{lang}</span>
              </div>
              <pre className="p-3 font-mono text-xs overflow-x-auto text-emerald-300 leading-relaxed">
                <code>{codeText}</code>
              </pre>
            </div>
          );
        }

        const lines = part.split('\n');
        return (
          <div key={idx} className="space-y-1">
            {lines.map((line, lineIdx) => {
              if (!line.trim()) return <div key={lineIdx} className="h-1" />;

              if (line.startsWith('### ')) {
                return (
                  <h3 key={lineIdx} className="text-base font-bold text-slate-100 mt-2 mb-1">
                    {formatInlineText(line.replace('### ', ''))}
                  </h3>
                );
              }
              if (line.startsWith('## ')) {
                return (
                  <h2 key={lineIdx} className="text-lg font-bold text-slate-100 mt-2 mb-1">
                    {formatInlineText(line.replace('## ', ''))}
                  </h2>
                );
              }
              if (line.startsWith('> ')) {
                return (
                  <blockquote key={lineIdx} className="border-l-2 border-indigo-500/80 pl-3 py-1 text-slate-300 italic bg-indigo-500/5 rounded-r-md my-1">
                    {formatInlineText(line.replace('> ', ''))}
                  </blockquote>
                );
              }
              if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                return (
                  <li key={lineIdx} className="ml-4 list-disc text-slate-200 pl-1">
                    {formatInlineText(line.trim().replace(/^[-*]\s+/, ''))}
                  </li>
                );
              }

              return (
                <p key={lineIdx} className="text-slate-200">
                  {formatInlineText(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

const ChatMessage = ({ message, onEditPrompt, onViewVersions }) => {
  const { votePrompt, user } = useSocket();
  const [copied, setCopied] = useState(false);

  const roleInfo = ROLE_CONFIG[message.role] || ROLE_CONFIG['Coder AI'];
  const RoleIcon = roleInfo.icon;

  const upvotes = message.votes?.upvotes || [];
  const downvotes = message.votes?.downvotes || [];
  const hasUpvoted = upvotes.includes(user.id);
  const hasDownvoted = hasUpvoted ? false : downvotes.includes(user.id);

  const handleCopyResponse = () => {
    if (!message.response) return;
    navigator.clipboard.writeText(message.response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedTime = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="space-y-3 bg-dark-800/40 border border-slate-800/80 rounded-2xl p-4 transition hover:border-slate-700/80">
      {/* Prompt Header: Author & Metadata */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm"
            style={{ backgroundColor: message.author?.color || '#3B82F6' }}
          >
            {message.author?.name ? message.author.name.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">{message.author?.name || 'Collaborator'}</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                v{message.version || 1}
              </span>
            </div>
            <span className="text-[10px] text-slate-500">{formattedTime}</span>
          </div>
        </div>

        {/* Prompt Actions */}
        <div className="flex items-center gap-2">
          {message.versions && message.versions.length > 0 && (
            <button
              onClick={() => onViewVersions(message)}
              className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-2 py-1 rounded-lg transition"
            >
              <History className="w-3 h-3" />
              <span>{message.versions.length + 1} Versions</span>
            </button>
          )}

          <button
            onClick={() => onEditPrompt(message)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg transition"
            title="Edit prompt and re-run as new version"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Re-run</span>
          </button>
        </div>
      </div>

      {/* User Prompt Text */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 font-medium whitespace-pre-wrap">
        {message.prompt}
      </div>

      {/* AI Persona Response Section */}
      <div className={`rounded-xl p-4 border ${roleInfo.bg} space-y-2 relative`}>
        {/* Persona Header */}
        <div className="flex items-center justify-between border-b border-slate-700/40 pb-2">
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded flex items-center justify-center bg-slate-800 ${roleInfo.color}`}>
              <RoleIcon className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-200">{message.role}</span>
            {message.isStreaming && (
              <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                <Sparkles className="w-2.5 h-2.5 animate-spin" />
                <span>Streaming tokens...</span>
              </span>
            )}
          </div>

          <button
            onClick={handleCopyResponse}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
            title="Copy response"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* AI Output Content */}
        <FormattedMarkdown content={message.response} isStreaming={message.isStreaming} />

        {/* Voting & Metadata Bar */}
        {!message.isStreaming && message.response && (
          <div className="flex items-center justify-end gap-3 pt-2 text-xs border-t border-slate-700/30">
            <div className="flex items-center gap-2">
              <button
                onClick={() => votePrompt(message.messageId, 'up')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md transition ${
                  hasUpvoted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{upvotes.length}</span>
              </button>

              <button
                onClick={() => votePrompt(message.messageId, 'down')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md transition ${
                  hasDownvoted ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                <span>{downvotes.length}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
