import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { createRoomApi, joinRoomApi } from '../services/api';
import { Sparkles, Plus, LogIn, Hash, User, Mail, Lock, UserPlus, Check, ArrowRight, ShieldAlert } from 'lucide-react';

const PRESET_COLORS = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', 
  '#EF4444', '#EC4899', '#06B6D4', '#6366F1'
];

const OnboardingModal = ({ isOpen, onClose, defaultRoomId = '' }) => {
  const { joinRoom, user: socketUser } = useSocket();
  const { user: saasUser, login: saasLogin, register: saasRegister } = useAuth();

  // Step 1: Login / Sign Up, Step 2: Join / Create Room
  const [step, setStep] = useState(saasUser ? 2 : 1);
  
  // Auth Form State
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  // Room Form State
  const [activeRoomTab, setActiveRoomTab] = useState('join'); // 'join' or 'create'
  const [inputRoomId, setInputRoomId] = useState(defaultRoomId || '');
  const [roomNameInput, setRoomNameInput] = useState('Collaborative AI Session');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Automatically advance to Step 2 if user logs in
  useEffect(() => {
    if (saasUser) {
      setStep(2);
    } else {
      setStep(1);
    }
  }, [saasUser]);

  if (!isOpen) return null;

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLoginTab) {
        const res = await saasLogin(authEmail, authPassword);
        if (res.success) {
          setStep(2);
        } else {
          setError(res.error || 'Login failed');
        }
      } else {
        const res = await saasRegister(authName, authEmail, authPassword, selectedColor);
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
    if (!saasUser) {
      setError('Please login or create an account first to create a room.');
      setStep(1);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await createRoomApi(roomNameInput);
      if (data?.success && data?.room?.roomId) {
        await joinRoom(data.room.roomId, data.room.name);
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
    if (!saasUser) {
      setError('Please login or create an account first to join a room.');
      setStep(1);
      return;
    }

    const targetRoom = inputRoomId.trim();
    if (!targetRoom) {
      setError('Please enter a valid room code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check in the database via REST API first
      const data = await joinRoomApi(targetRoom, saasUser.name);
      if (data?.success) {
        const success = await joinRoom(targetRoom);
        if (success) {
          onClose();
        } else {
          setError('Room does not exist in database');
        }
      } else {
        setError(data?.error || 'Room does not exist in database');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Room does not exist in database');
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
          <p className="text-xs text-slate-400">
            {step === 1 ? 'Login required to create or join room workspaces' : `Logged in as ${saasUser?.name || saasUser?.email}`}
          </p>

          {/* Stepper Progress */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${step === 1 ? 'text-indigo-400' : 'text-emerald-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 1 ? 'bg-indigo-600 text-white' : 'bg-emerald-500 text-white'}`}>
                {saasUser ? <Check className="w-3 h-3" /> : '1'}
              </span>
              <span>1. Login / Signup</span>
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

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-xl font-medium flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: MANDATORY SAAS AUTH (LOGIN OR SIGNUP) */}
        {step === 1 && (
          <div className="space-y-4 pt-1">
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs p-2.5 rounded-xl text-center font-medium">
              🔒 You must sign in or create an account before creating or joining a room.
            </div>

            {/* Auth Mode Toggle */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
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
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {!isLoginTab && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
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
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
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
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
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

        {/* STEP 2: CREATE OR JOIN ROOM (UNLOCKED ONLY AFTER LOGIN) */}
        {step === 2 && (
          <div className="space-y-5 pt-1">
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-2.5 rounded-xl flex items-center justify-between">
              <span>Authenticated as <strong>{saasUser?.name || saasUser?.email}</strong></span>
              <span className="text-[10px] uppercase font-bold bg-emerald-500/20 px-2 py-0.5 rounded">{saasUser?.tier || 'Free'} Tier</span>
            </div>

            {/* Tabs for Join vs Create */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => { setActiveRoomTab('join'); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  activeRoomTab === 'join' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Join Existing Room</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveRoomTab('create'); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  activeRoomTab === 'create' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Room</span>
              </button>
            </div>

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
                  <span>{loading ? 'Checking Database...' : 'Enter Room Workspace'}</span>
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
