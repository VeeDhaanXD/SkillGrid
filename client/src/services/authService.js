import { api, setToken } from './api';

export async function login(email, password) {
  const data = await api('/auth/login', { method: 'POST', body: { email, password }, auth: false });
  setToken(data.token);
  return data.user;
}

export async function register(payload) {
  const data = await api('/auth/register', { method: 'POST', body: payload, auth: false });
  setToken(data.token);
  return data.user;
}

export async function fetchMe() {
  const data = await api('/auth/me');
  return data.user;
}

export function logoutRemote() {
  setToken(null);
}
