import React from 'react';
import { useSocket } from '../context/SocketContext';
import { Code2, Layers, ShieldCheck, ChevronDown } from 'lucide-react';

const ROLES = [
  {
    id: 'Coder AI',
    title: 'Coder AI',
    desc: 'Code generation, logic & refactoring',
    icon: Code2,
    color: 'from-blue-500 to-cyan-500',
    borderColor: 'border-blue-500/40',
    badgeColor: 'bg-blue-500/20 text-blue-400'
  },
  {
    id: 'Architect AI',
    title: 'Architect AI',
    desc: 'System design & architecture trade-offs',
    icon: Layers,
    color: 'from-purple-500 to-violet-500',
    borderColor: 'border-purple-500/40',
    badgeColor: 'bg-purple-500/20 text-purple-400'
  },
  {
    id: 'Reviewer AI',
    title: 'Reviewer AI',
    desc: 'Security, edge cases & code review',
    icon: ShieldCheck,
    color: 'from-emerald-500 to-teal-500',
    borderColor: 'border-emerald-500/40',
    badgeColor: 'bg-emerald-500/20 text-emerald-400'
  }
];

const RoleSelector = () => {
  const { activeRole, switchRole } = useSocket();
  const currentRole = ROLES.find(r => r.id === activeRole) || ROLES[0];
  const IconComponent = currentRole.icon;

  return (
    <div className="relative group">
      <button className={`flex items-center gap-2 bg-slate-900 border ${currentRole.borderColor} rounded-lg px-3 py-1.5 text-xs transition shadow-sm`}>
        <div className={`w-5 h-5 rounded flex items-center justify-center bg-gradient-to-tr ${currentRole.color} text-white`}>
          <IconComponent className="w-3 h-3" />
        </div>
        <div className="text-left">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Active Persona</div>
          <div className="font-semibold text-slate-100 flex items-center gap-1">
            <span>{currentRole.title}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>
        </div>
      </button>

      {/* Role Switch Dropdown */}
      <div className="absolute top-full left-0 mt-1 w-64 glass-panel rounded-xl shadow-2xl p-2 hidden group-hover:block z-30 transition-all border border-slate-700/60">
        <div className="px-2 py-1 mb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Switch AI Persona
        </div>
        <div className="space-y-1">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = activeRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => switchRole(role.id)}
                className={`w-full text-left p-2 rounded-lg flex items-start gap-2.5 transition ${
                  isSelected ? 'bg-indigo-600/20 border border-indigo-500/40' : 'hover:bg-slate-800/60'
                }`}
              >
                <div className={`w-6 h-6 rounded flex items-center justify-center bg-gradient-to-tr ${role.color} text-white shrink-0 mt-0.5`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                    <span>{role.title}</span>
                    {isSelected && <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500 text-white">Active</span>}
                  </div>
                  <div className="text-[11px] text-slate-400 leading-tight mt-0.5">{role.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;
