import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { getRoomHistoryApi, getUserRoomsApi } from '../services/api';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const auth = useAuth();
  const saasUser = auth?.user;
  const saasToken = auth?.token;

  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState(() => {
    if (saasUser) {
      return {
        id: saasUser.id,
        name: saasUser.name,
        email: saasUser.email,
        color: saasUser.avatarColor || '#3B82F6',
        tier: saasUser.tier || 'free'
      };
    }
    const saved = localStorage.getItem('ai_workspace_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    const id = 'user_' + Math.random().toString(36).substring(2, 9);
    const name = 'Engineer #' + Math.floor(100 + Math.random() * 900);
    const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const newUser = { id, name, color };
    localStorage.setItem('ai_workspace_user', JSON.stringify(newUser));
    return newUser;
  });

  const [roomId, setRoomId] = useState(null);
  const [joinedRooms, setJoinedRooms] = useState(() => {
    const saved = localStorage.getItem('ai_workspace_joined_rooms');
    return saved ? JSON.parse(saved) : [{ roomId: 'demo-room', name: 'Default Shared Room' }];
  });

  const [activeUsers, setActiveUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [activeRole, setActiveRole] = useState('Coder AI');
  const [liveDraftPrompt, setLiveDraftPrompt] = useState('');
  const [lastEditor, setLastEditor] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [streamingMessage, setStreamingMessage] = useState(null);

  const socketRef = useRef(null);

  // Sync user state with SaaS JWT user profile
  useEffect(() => {
    if (saasUser) {
      const updatedUser = {
        id: saasUser.id,
        name: saasUser.name,
        email: saasUser.email,
        color: saasUser.avatarColor || '#3B82F6',
        tier: saasUser.tier || 'free'
      };
      setUser(updatedUser);
      localStorage.setItem('ai_workspace_user', JSON.stringify(updatedUser));
    }
  }, [saasUser]);

  // Initialize Socket Connection with JWT Auth Handshake
  useEffect(() => {
    const jwtToken = localStorage.getItem('ai_saas_jwt_token') || '';
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      auth: {
        token: jwtToken
      }
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('[Socket Connected]', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket Disconnected]');
      setIsConnected(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Sync joined rooms from API when available
  const refreshUserRooms = useCallback(() => {
    getUserRoomsApi().then(data => {
      if (data?.success && data?.rooms) {
        const formatted = data.rooms.map(r => ({ roomId: r.roomId, name: r.name || `Room #${r.roomId}` }));
        setJoinedRooms(prev => {
          const merged = [...prev];
          formatted.forEach(r => {
            if (!merged.some(m => m.roomId === r.roomId)) merged.push(r);
          });
          localStorage.setItem('ai_workspace_joined_rooms', JSON.stringify(merged));
          return merged;
        });
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    refreshUserRooms();
  }, [refreshUserRooms]);

  // Handle Token Change: Update socket handshake auth and reconnect
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.auth = { token: saasToken || '' };
      if (socketRef.current.connected) {
        socketRef.current.disconnect().connect();
      }
    }
    refreshUserRooms();
  }, [saasToken, refreshUserRooms]);

  // Bind Socket Event Listeners for active room
  useEffect(() => {
    if (!socket || !roomId) return;

    // Load initial room history from REST API
    getRoomHistoryApi(roomId).then(data => {
      if (data?.success) {
        setChatHistory(data.history || []);
      }
    }).catch(err => console.error('Failed to load chat history:', err));

    const handleRoomState = (state) => {
      if (state.activeRole) setActiveRole(state.activeRole);
      if (state.currentDraftPrompt !== undefined) setLiveDraftPrompt(state.currentDraftPrompt);
    };

    const handleUserJoined = ({ user: joinedUser, activeUsers: usersList }) => {
      setActiveUsers(usersList || []);
    };

    const handleUserLeft = ({ userId, userName, activeUsers: usersList }) => {
      setActiveUsers(usersList || []);
    };

    const handleTyping = ({ typingUsers: users }) => {
      setTypingUsers(users.filter(u => u.id !== user.id));
    };

    const handlePromptUpdated = ({ prompt, editor }) => {
      setLiveDraftPrompt(prompt);
      if (editor) setLastEditor(editor);
    };

    const handleRoleSwitched = ({ role, user: switchedUser }) => {
      setActiveRole(role);
    };

    const handleAiStreamStart = (data) => {
      setStreamingMessage({
        messageId: data.messageId,
        roomId: data.roomId,
        prompt: data.prompt,
        response: '',
        role: data.role,
        author: data.author,
        version: data.version,
        versions: data.versions || [],
        isStreaming: true,
        timestamp: data.timestamp
      });
    };

    const handleAiStreamChunk = ({ messageId, chunk, accumulated }) => {
      setStreamingMessage(prev => {
        if (!prev || prev.messageId !== messageId) return prev;
        return {
          ...prev,
          response: accumulated
        };
      });
    };

    const handleAiStreamEnd = ({ messageId, message }) => {
      setStreamingMessage(null);
      setChatHistory(prev => {
        const index = prev.findIndex(m => m.messageId === messageId);
        if (index !== -1) {
          const copy = [...prev];
          copy[index] = message;
          return copy;
        } else {
          return [...prev, message];
        }
      });
    };

    const handlePromptVoted = ({ messageId, votes }) => {
      setChatHistory(prev => prev.map(msg => msg.messageId === messageId ? { ...msg, votes } : msg));
    };

    socket.on('room_state', handleRoomState);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    socket.on('typing', handleTyping);
    socket.on('prompt_updated', handlePromptUpdated);
    socket.on('role_switched', handleRoleSwitched);
    socket.on('ai_stream_start', handleAiStreamStart);
    socket.on('ai_stream_chunk', handleAiStreamChunk);
    socket.on('ai_stream_end', handleAiStreamEnd);
    socket.on('prompt_voted', handlePromptVoted);

    return () => {
      socket.off('room_state', handleRoomState);
      socket.off('user_joined', handleUserJoined);
      socket.off('user_left', handleUserLeft);
      socket.off('typing', handleTyping);
      socket.off('prompt_updated', handlePromptUpdated);
      socket.off('role_switched', handleRoleSwitched);
      socket.off('ai_stream_start', handleAiStreamStart);
      socket.off('ai_stream_chunk', handleAiStreamChunk);
      socket.off('ai_stream_end', handleAiStreamEnd);
      socket.off('prompt_voted', handlePromptVoted);
    };
  }, [socket, roomId, user.id]);

  // Action Methods
  const joinRoom = useCallback((newRoomId, roomTitle = null) => {
    if (!socket || !newRoomId) return;
    setRoomId(newRoomId);

    // Save to joined rooms list
    setJoinedRooms(prev => {
      if (prev.some(r => r.roomId === newRoomId)) return prev;
      const updated = [...prev, { roomId: newRoomId, name: roomTitle || `Room #${newRoomId}` }];
      localStorage.setItem('ai_workspace_joined_rooms', JSON.stringify(updated));
      return updated;
    });

    socket.emit('join_room', { roomId: newRoomId, user });
  }, [socket, user]);

  const sendDraftPrompt = useCallback((promptText) => {
    setLiveDraftPrompt(promptText);
    setLastEditor(user);
    if (socket && roomId) {
      socket.emit('edit_prompt', { roomId, prompt: promptText, editor: user });
    }
  }, [socket, roomId, user]);

  const executePrompt = useCallback((promptText, originalMessageId = null) => {
    if (!socket || !roomId || !promptText.trim()) return;
    socket.emit('send_prompt', {
      roomId,
      prompt: promptText,
      role: activeRole,
      author: user,
      originalMessageId
    });
  }, [socket, roomId, activeRole, user]);

  const switchRole = useCallback((newRole) => {
    setActiveRole(newRole);
    if (socket && roomId) {
      socket.emit('switch_role', { roomId, role: newRole, user });
    }
  }, [socket, roomId, user]);

  const sendTypingStatus = useCallback((isTyping) => {
    if (socket && roomId) {
      socket.emit('typing', { roomId, isTyping, user });
    }
  }, [socket, roomId, user]);

  const votePrompt = useCallback((messageId, voteType) => {
    if (socket && roomId) {
      socket.emit('vote_prompt', { roomId, messageId, voteType, userId: user.id });
    }
  }, [socket, roomId, user.id]);

  const updateUserProfile = useCallback((name) => {
    const updated = { ...user, name };
    setUser(updated);
    localStorage.setItem('ai_workspace_user', JSON.stringify(updated));
    if (socket && roomId) {
      socket.emit('join_room', { roomId, user: updated });
    }
  }, [socket, roomId, user]);

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      user,
      roomId,
      joinedRooms,
      activeUsers,
      typingUsers,
      activeRole,
      liveDraftPrompt,
      lastEditor,
      chatHistory,
      streamingMessage,
      joinRoom,
      sendDraftPrompt,
      executePrompt,
      switchRole,
      sendTypingStatus,
      votePrompt,
      updateUserProfile,
      refreshUserRooms
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
