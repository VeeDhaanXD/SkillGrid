const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

async function logActivity(users, text, tone = 'emerald') {
  try {
    await Activity.create({ users, text, tone, at: new Date() });
  } catch (err) {
    console.error('[Activity]', err.message);
  }
}

async function notify(user, text, kind = 'info') {
  try {
    await Notification.create({ user, text, kind, at: new Date() });
  } catch (err) {
    console.error('[Notification]', err.message);
  }
}

function shortTime(date) {
  const d = new Date(date);
  const now = new Date();
  const diffH = (now - d) / 36e5;
  if (diffH < 24 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  if (diffH < 24) return '1d';
  const days = Math.floor(diffH / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function initials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function computeMatch(projectSkills = [], userSkills = []) {
  if (!projectSkills.length) return 70;
  const set = new Set(userSkills.map((s) => String(s).toLowerCase()));
  const hits = projectSkills.filter((s) => set.has(String(s).toLowerCase())).length;
  return Math.min(99, Math.round(60 + (hits / projectSkills.length) * 39));
}

function projectStatusLabel(p) {
  if (p.status === 'open' && p.proposalCount > 0) return 'Reviewing';
  return {
    open: 'Open',
    in_progress: 'In Progress',
    completed: 'Completed',
    disputed: 'Disputed',
    cancelled: 'Cancelled',
  }[p.status] || p.status;
}

module.exports = { logActivity, notify, shortTime, fmtDate, initials, computeMatch, projectStatusLabel };
