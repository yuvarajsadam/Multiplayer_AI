import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { createRoomApi, joinRoomApi } from '../services/api';
import { Sparkles, Plus, LogIn, Hash, User, Mail, Lock, UserPlus, Check, ArrowRight, Shield } from 'lucide-react';

const PRESET_COLORS = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', 
  '#EF4444', '#EC4899', '#06B6D4', '#6366F1'
];

const OnboardingModal = ({ isOpen, onClose, defaultRoomId = '' }) => {
  const { user: saasUser, login: saasLogin, register: saasRegister } = useAuth();
  const { joinRoom } = useSocket();

  // If user is logged in, start at Step 2 (Choose Room). Otherwise start at Step 1 (Auth).
  const [step, setStep] = useState(saasUser ? 2 : 1);
  
  // Auth Form State
  const [isLoginTab, setIsLoginTab] = useState(false); // false = Sign Up, true = Login
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  // Room Form State
  const [activeRoomTab, setActiveRoomTab] = useState('join'); // 'join' or 'create'
  const [inputRoomId, setInputRoomId] = useState(defaultRoomId || '');
  const [roomNameInput, setRoomNameInput] = useState('Collaborative AI Session');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-advance to Step 2 if user logs in
  useEffect(() => {
    if (saasUser) {
      setStep(2);
    }
  }, [saasUser]);

  if (!isOpen) return null;

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLoginTab) {
        const res = await saasLogin(email, password);
        if (res.success) {
          setStep(2);
        } else {
          setError(res.error || 'Login failed');
        }
      } else {
        const res = await saasRegister(name, email, password, selectedColor);
        if (res.success) {
          setStep(2);
        } else {
          setError(res.error || 'Registration failed');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await createRoomApi(roomNameInput);
      if (data?.success && data?.room?.roomId) {
        joinRoom(data.room.roomId);
        onClose();
      } else {
        setError(data?.error || 'Failed to create room');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    const targetRoom = inputRoomId.trim() || 'demo-room';
    setLoading(true);
    setError('');

    try {
      const data = await joinRoomApi(targetRoom, saasUser?.name || 'Engineer');
      if (data?.success) {
        joinRoom(targetRoom);
        onClose();
      } else {
        setError(data?.error || 'Failed to join room');
      }
    } catch (err) {
      joinRoom(targetRoom);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-lg flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-dark-800 border border-slate-700/80 rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow effect background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-violet-600/30 rounded-full blur-3xl pointer-events-none"></div>

        {/* Modal Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center mx-auto shadow-xl shadow-indigo-600/30">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-100 tracking-wide">Multiplayer AI Workspace</h2>
          <p className="text-xs text-slate-400">Authentication Required to Access Rooms</p>

          {/* Stepper Progress */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${step === 1 ? 'text-indigo-400' : 'text-emerald-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 1 ? 'bg-indigo-600 text-white' : 'bg-emerald-500 text-white'}`}>
                {saasUser ? <Check className="w-3 h-3" /> : '1'}
              </span>
              <span>1. Account Auth</span>
            </div>
            <div className="w-8 h-0.5 bg-slate-700"></div>
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${step === 2 ? 'text-indigo-400' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                2
              </span>
              <span>2. Room Workspace</span>
            </div>
          </div>
        </div>

        {/* STEP 1: MANDATORY SAAS AUTHENTICATION (SIGN UP OR LOGIN) */}
        {step === 1 && (
          <div className="space-y-4 pt-1">
            {/* Auth Mode Toggle */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => { setIsLoginTab(false); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  !isLoginTab ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
              <button
                type="button"
                onClick={() => { setIsLoginTab(true); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  isLoginTab ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-2.5 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {!isLoginTab && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Engineer"
                      className="w-full glass-input rounded-xl p-3 pl-10 text-sm text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="engineer@company.com"
                    className="w-full glass-input rounded-xl p-3 pl-10 text-sm text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full glass-input rounded-xl p-3 pl-10 text-sm text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              {!isLoginTab && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Avatar Color Theme</label>
                  <div className="flex items-center gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={`w-7 h-7 rounded-full transition flex items-center justify-center ${
                          selectedColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-800' : 'opacity-70'
                        }`}
                        style={{ backgroundColor: c }}
                      >
                        {selectedColor === c && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Authenticating...' : isLoginTab ? 'Sign In & Unlock Rooms' : 'Create Account & Unlock Rooms'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: CREATE OR JOIN ROOM (UNLOCKED AFTER AUTH) */}
        {step === 2 && (
          <div className="space-y-5 pt-1">
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-2.5 rounded-lg flex items-center justify-between">
              <span>Authenticated as <strong>{saasUser?.name || saasUser?.email}</strong></span>
              <span className="text-[10px] uppercase font-bold bg-emerald-500/20 px-2 py-0.5 rounded">{saasUser?.tier || 'Free'} Tier</span>
            </div>

            {/* Tabs for Join vs Create */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveRoomTab('join')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  activeRoomTab === 'join' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Join Existing Room</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveRoomTab('create')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  activeRoomTab === 'create' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Room</span>
              </button>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-2.5 rounded-lg">
                {error}
              </div>
            )}

            {activeRoomTab === 'join' ? (
              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Room Code / ID</label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={inputRoomId}
                      onChange={(e) => setInputRoomId(e.target.value)}
                      placeholder="e.g. demo-room or a1b2c3d4"
                      className="w-full glass-input rounded-xl p-3 pl-10 text-sm text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{loading ? 'Joining Workspace...' : 'Enter Room Workspace'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Workspace Session Title</label>
                  <input
                    type="text"
                    value={roomNameInput}
                    onChange={(e) => setRoomNameInput(e.target.value)}
                    placeholder="e.g. AI System Architecture Review"
                    className="w-full glass-input rounded-xl p-3 text-sm text-white focus:outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{loading ? 'Creating Room...' : 'Create & Enter Room Workspace'}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingModal;
