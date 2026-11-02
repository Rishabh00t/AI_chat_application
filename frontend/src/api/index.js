import { request } from './client';
import { localDateString } from '../utils/time';

export const authApi = {
  register: (name, email, password) => request('/auth/register', { method: 'POST', body: { name, email, password } }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
};

export const profileApi = {
  update: (fields) => request('/profile', { method: 'PUT', body: fields }),
  changePassword: (current_password, new_password) =>
    request('/profile/password', { method: 'PUT', body: { current_password, new_password } }),
};

export const chatApi = {
  conversations: () => request('/conversations'),
  messages: (id) => request(`/conversations/${id}/messages`),
  send: (message, conversationId) =>
    request('/chat', { method: 'POST', body: { message, conversation_id: conversationId || null } }),
  remove: (id) => request(`/conversations/${id}`, { method: 'DELETE' }),
  removeAll: () => request('/conversations', { method: 'DELETE' }),
};

export const moodApi = {
  list: (days = 30) => request('/moods', { query: { days, today: localDateString() } }),
  save: (mood, intensity, note) =>
    request('/moods', { method: 'POST', body: { mood, intensity, note, date: localDateString() } }),
  remove: (id) => request(`/moods/${id}`, { method: 'DELETE' }),
};
