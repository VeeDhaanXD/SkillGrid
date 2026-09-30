import { api } from './api';

export function listProjects(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return api(`/projects${qs ? `?${qs}` : ''}`);
}

export function createProject(payload) {
  return api('/projects', { method: 'POST', body: payload });
}

export function getProject(id) {
  return api(`/projects/${id}`);
}

export function updateProject(id, payload) {
  return api(`/projects/${id}`, { method: 'PATCH', body: payload });
}

export function deleteProject(id) {
  return api(`/projects/${id}`, { method: 'DELETE' });
}

export function listProjectProposals(id) {
  return api(`/projects/${id}/proposals`);
}

export function raiseDispute(id, reason) {
  return api(`/projects/${id}/dispute`, { method: 'POST', body: { reason } });
}
