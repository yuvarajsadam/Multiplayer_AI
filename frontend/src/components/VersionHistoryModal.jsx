import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { X, History, RotateCcw, GitCommit, Check } from 'lucide-react';

const VersionHistoryModal = ({ message, onClose, onSelectVersion }) => {
  const { chatHistory } = useSocket();

  // If a specific message was passed, use its versions. Otherwise show all messages with version history.
  const targetMessage = message || chatHistory.find(m => m.versions && m.versions.length > 0) || chatHistory[0];

  if (!targetMessage) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-dark-800 border border-slate-800 rounded-2xl p-6 max-w-md w-full text-center">
          <History className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-200">No Prompt Versions Yet</h3>
          <p className="text-xs text-slate-400 mt-2">
            Re-run or edit an existing prompt in the workspace to automatically record v1, v2, v3 version history.
          </p>
          <button
            onClick={onClose}
            className="mt-5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Construct full list of versions (v1 -> current version)
  const allVersions = [
    ...(targetMessage.versions || []).map(v => ({
      versionNumber: v.versionNumber,
      prompt: v.prompt,
      response: v.response,
      role: v.role,
      author: v.author,
      timestamp: v.timestamp
    })),
    {
      versionNumber: targetMessage.version || 1,
      prompt: targetMessage.prompt,
      response: targetMessage.response,
      role: targetMessage.role,
      author: targetMessage.author,
      timestamp: targetMessage.timestamp
    }
  ];

  const [selectedVer, setSelectedVer] = useState(allVersions[allVersions.length - 1]);

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-dark-800 border border-slate-700/80 rounded-2xl max-w-3xl w-full flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Prompt Version History</h3>
              <p className="text-[11px] text-slate-400">Compare and restore previous iteration snapshots</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split view (Version List vs Version Preview) */}
        <div className="flex flex-1 overflow-hidden">
          {/* Version List Sidebar */}
          <div className="w-56 border-r border-slate-800 bg-slate-900/40 p-3 space-y-2 overflow-y-auto">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Versions ({allVersions.length})</div>
            {allVersions.map((ver) => {
              const isSelected = selectedVer.versionNumber === ver.versionNumber;
              return (
                <button
                  key={ver.versionNumber}
                  onClick={() => setSelectedVer(ver)}
                  className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-slate-100'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GitCommit className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <div>
                      <div className="text-xs font-bold font-mono">Version v{ver.versionNumber}</div>
                      <div className="text-[10px] text-slate-400">{ver.role}</div>
                    </div>
                  </div>
                  {ver.versionNumber === targetMessage.version && (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-semibold">Latest</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Version Detail View */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-dark-900/50">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold text-slate-200 font-mono">Snapshot v{selectedVer.versionNumber}</span>
                <div className="text-[11px] text-slate-400">
                  Edited by {selectedVer.author?.name || 'User'} • {selectedVer.timestamp ? new Date(selectedVer.timestamp).toLocaleString() : ''}
                </div>
              </div>
              <button
                onClick={() => {
                  onSelectVersion(selectedVer);
                  onClose();
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Load this Version</span>
              </button>
            </div>

            {/* Prompt Content */}
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Prompt Text</div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono whitespace-pre-wrap">
                {selectedVer.prompt}
              </div>
            </div>

            {/* AI Output Content */}
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <span>AI Output ({selectedVer.role})</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 font-mono whitespace-pre-wrap">
                {selectedVer.response || 'No AI response generated for this snapshot.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersionHistoryModal;
