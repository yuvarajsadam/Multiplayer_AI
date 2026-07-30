import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { createRoomApi, joinRoomApi } from '../services/api';
import { X, Plus, LogIn, Sparkles, Hash, User } from 'lucide-react';

const RoomModal = ({ isOpen, onClose, mode = 'room', initialName = '' }) => {
  const { joinRoom, user, updateUserProfile } = useSocket();
  const [activeTab, setActiveTab] = useState('join');
  const [inputRoomId, setInputRoomId] = useState('');
  const [roomNameInput, setRoomNameInput] = useState('AI Pair Programming Session');
  const [userNameInput, setUserNameInput] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

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
    if (!inputRoomId.trim()) return;
    setLoading(true);
    setError('');

    try {
      const data = await joinRoomApi(inputRoomId.trim(), user.name);
      if (data?.success) {
        joinRoom(inputRoomId.trim(), data.room?.name);
        onClose();
      } else {
        setError(data?.error || 'Room does not exist. Please check the room code.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Room not found. Please verify the room code or create a new room.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    if (!userNameInput.trim()) return;
    updateUserProfile(userNameInput.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-dark-800 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              {mode === 'profile' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>
            <h3 className="font-bold text-slate-100 text-sm">
              {mode === 'profile' ? 'Update Engineer Profile' : 'Workspace Room System'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode === 'profile' ? (
          /* Profile Mode */
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Your Display Name</label>
              <input
                type="text"
                value={userNameInput}
                onChange={(e) => setUserNameInput(e.target.value)}
                className="w-full glass-input rounded-xl p-3 text-sm text-white focus:outline-none"
                placeholder="e.g. Principal Engineer"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition"
            >
              Save Profile
            </button>
          </form>
        ) : (
          /* Room Navigation Tabs */
          <div>
            <div className="flex bg-slate-900 p-1 rounded-xl mb-4 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('join')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${activeTab === 'join' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                Join Existing Room
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${activeTab === 'create' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                Create New Room
              </button>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-2.5 rounded-lg mb-3">
                {error}
              </div>
            )}

            {activeTab === 'join' ? (
              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Room Code / ID</label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      value={inputRoomId}
                      onChange={(e) => setInputRoomId(e.target.value)}
                      placeholder="e.g. demo-room or a1b2c3d4"
                      className="w-full glass-input rounded-xl p-3 pl-9 text-sm text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{loading ? 'Joining...' : 'Enter Workspace'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Workspace Title</label>
                  <input
                    type="text"
                    value={roomNameInput}
                    onChange={(e) => setRoomNameInput(e.target.value)}
                    placeholder="e.g. Real-Time Architecture Review"
                    className="w-full glass-input rounded-xl p-3 text-sm text-white focus:outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{loading ? 'Creating...' : 'Create Room Code'}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomModal;
