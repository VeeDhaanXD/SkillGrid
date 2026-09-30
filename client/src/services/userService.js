import { api } from './api';

export async function fetchProfile() {
  const data = await api('/users/me');
  return data.user;
}

export async function updateProfile(patch) {
  const data = await api('/users/me', { method: 'PATCH', body: patch });
  return data.user;
}

export async function fetchPublicProfile(id) {
  return api(`/users/${id}`);
}
