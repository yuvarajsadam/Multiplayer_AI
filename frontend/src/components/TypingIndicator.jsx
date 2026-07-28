import React from 'react';
import { useSocket } from '../context/SocketContext';
import { Edit2 } from 'lucide-react';

const TypingIndicator = () => {
  const { typingUsers } = useSocket();

  if (!typingUsers || typingUsers.length === 0) return null;

  const namesText = typingUsers.map(u => u.name).join(', ');

  return (
    <div className="flex items-center gap-2 bg-indigo-950/60 border border-indigo-500/30 rounded-lg px-3 py-1.5 text-xs text-indigo-300 animate-pulse">
      <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
      <span className="font-semibold">{namesText}</span>
      <span>{typingUsers.length === 1 ? 'is typing a prompt...' : 'are typing a prompt...'}</span>
      <span className="flex gap-1 ml-1">
        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
      </span>
    </div>
  );
};

export default TypingIndicator;
