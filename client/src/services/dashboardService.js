import { api } from './api';

export function fetchFreelancerDashboard() {
  return api('/dashboard/freelancer');
}

export function fetchClientDashboard() {
  return api('/dashboard/client');
}

export function fetchAdminDashboard() {
  return api('/dashboard/admin');
}

export function fetchNotifications() {
  return api('/notifications');
}

export function markAllRead() {
  return api('/notifications/read-all', { method: 'POST', body: {} });
}
