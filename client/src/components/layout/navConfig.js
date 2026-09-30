import { LayoutDashboard, Search, Wallet, User, Plus, FolderKanban, FileText, Activity, ShieldAlert, UserCheck, Flag } from 'lucide-react';

export const freelancerNav = [
  { label: 'Overview', path: '/freelancer', icon: LayoutDashboard },
  { label: 'Browse Jobs', path: '/freelancer/browse', icon: Search },
  { label: 'Earnings', path: '/freelancer/earnings', icon: Wallet },
  { label: 'Profile', path: '/freelancer/profile', icon: User },
];

export const clientNav = [
  { label: 'Overview', path: '/client', icon: LayoutDashboard },
  { label: 'Post Project', path: '/client/create', icon: Plus },
  { label: 'Projects', path: '/client/manage', icon: FolderKanban },
  { label: 'Proposals', path: '/client/proposals', icon: FileText },
  { label: 'Profile', path: '/client/profile', icon: User },
];

export const adminNav = [
  { label: 'Overview', path: '/admin', icon: Activity },
  { label: 'Disputes', path: '/admin/disputes', icon: ShieldAlert },
  { label: 'Moderation', path: '/admin/moderation', icon: Flag },
  { label: 'Users', path: '/admin/users', icon: UserCheck },
];
