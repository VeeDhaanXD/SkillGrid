import { api } from './api';

export function submitProposal(projectId, payload) {
  return api(`/projects/${projectId}/proposals`, { method: 'POST', body: payload });
}

export function listMyProposals() {
  return api('/proposals/mine');
}

export function listReceivedProposals() {
  return api('/proposals/received');
}

export function acceptProposal(id) {
  return api(`/proposals/${id}/accept`, { method: 'POST', body: {} });
}

export function declineProposal(id) {
  return api(`/proposals/${id}/decline`, { method: 'POST', body: {} });
}
