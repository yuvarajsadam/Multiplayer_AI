import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const createRoomApi = async (name) => {
  const response = await api.post('/rooms/create', { name });
  return response.data;
};

export const joinRoomApi = async (roomId, userName) => {
  const response = await api.post('/rooms/join', { roomId, userName });
  return response.data;
};

export const getUserRoomsApi = async () => {
  const response = await api.get('/rooms/my-rooms');
  return response.data;
};

export const deleteRoomApi = async (roomId) => {
  const response = await api.delete(`/rooms/${roomId}`);
  return response.data;
};

export const getRoomDetailsApi = async (roomId) => {
  const response = await api.get(`/rooms/${roomId}`);
  return response.data;
};

export const getRoomHistoryApi = async (roomId) => {
  const response = await api.get(`/rooms/${roomId}/history`);
  return response.data;
};

export default api;
