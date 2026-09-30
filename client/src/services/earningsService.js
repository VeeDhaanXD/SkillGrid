import { api } from './api';

export function fetchEarnings() {
  return api('/earnings');
}

export function withdraw(amount) {
  return api('/earnings/withdraw', { method: 'POST', body: { amount } });
}
