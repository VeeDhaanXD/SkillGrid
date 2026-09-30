import { api } from './api';

export function listUsers(params = {}) {
  const qs = new URLSearchParams(Object.entries(params)).toString();
  return api(`/admin/users${qs ? `?${qs}` : ''}`);
}

export function setUserStatus(id, status) {
  return api(`/admin/users/${id}`, { method: 'PATCH', body: { status } });
}

export function listFlaggedProjects(flagged = true) {
  return api(`/admin/projects${flagged ? '?flagged=1' : ''}`);
}

export function moderateProject(id, action, reason) {
  return api(`/admin/projects/${id}`, { method: 'PATCH', body: { action, reason } });
}

export function listDisputes(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  ).toString();
  return api(`/admin/disputes${qs ? `?${qs}` : ''}`);
}

export function resolveDispute(id, resolution, notes) {
  return api(`/admin/disputes/${id}/resolve`, { method: 'POST', body: { resolution, notes } });
}
