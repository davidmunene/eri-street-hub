import type { Audience, Role } from '@prisma/client';

/**
 * Single source of truth for who can do what.
 * Every page and server action checks one of these — the UI hiding a button
 * is never the only line of defence.
 */
export const PERMISSIONS = {
  'dashboard:view': ['ADMIN', 'OFFICIAL', 'STAFF', 'MEMBER', 'VIEWER'],

  'announcements:post': ['ADMIN', 'OFFICIAL', 'STAFF'],
  'announcements:moderate': ['ADMIN', 'OFFICIAL'],
  'comments:post': ['ADMIN', 'OFFICIAL', 'STAFF', 'MEMBER'],

  'events:manage': ['ADMIN', 'OFFICIAL', 'STAFF'],
  'events:rsvp': ['ADMIN', 'OFFICIAL', 'STAFF', 'MEMBER'],

  'tasks:view': ['ADMIN', 'OFFICIAL', 'STAFF', 'MEMBER'],
  'tasks:manage': ['ADMIN', 'OFFICIAL', 'STAFF', 'MEMBER'],

  'documents:upload': ['ADMIN', 'OFFICIAL', 'STAFF', 'MEMBER'],
  'documents:moderate': ['ADMIN', 'OFFICIAL'],

  'members:view': ['ADMIN', 'OFFICIAL', 'STAFF', 'MEMBER'],
  'members:manage': ['ADMIN'],

  'finance:view': ['ADMIN', 'OFFICIAL'],
  'finance:manage': ['ADMIN', 'OFFICIAL'],

  // Beneficiary data is personal & sensitive: field team + leadership only.
  'beneficiaries:view': ['ADMIN', 'OFFICIAL', 'STAFF'],
  'beneficiaries:manage': ['ADMIN', 'OFFICIAL', 'STAFF'],
  'beneficiaries:delete': ['ADMIN'],
  'reports:manage': ['ADMIN', 'OFFICIAL', 'STAFF'],
  'partners:view': ['ADMIN', 'OFFICIAL', 'STAFF', 'MEMBER'],
  'partners:manage': ['ADMIN', 'OFFICIAL', 'STAFF'],

  'suggestions:submit': ['ADMIN', 'OFFICIAL', 'STAFF', 'MEMBER', 'VIEWER'],
  'suggestions:review': ['ADMIN', 'OFFICIAL'],

  'admin:access': ['ADMIN'],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

/** Which audiences a role may see (for announcements and documents). */
export function visibleAudiences(role: Role): Audience[] {
  if (role === 'ADMIN' || role === 'OFFICIAL') return ['EVERYONE', 'TEAM', 'LEADERSHIP'];
  if (role === 'STAFF') return ['EVERYONE', 'TEAM'];
  return ['EVERYONE'];
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrator',
  OFFICIAL: 'Official',
  STAFF: 'Field staff',
  MEMBER: 'Member',
  VIEWER: 'Viewer',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  ADMIN: 'Full control, including members and system settings.',
  OFFICIAL: 'Leadership: finance, governance, all programme data.',
  STAFF: 'Field officers and caseworkers: beneficiary case management.',
  MEMBER: 'Volunteers and members: noticeboard, events, tasks, documents.',
  VIEWER: 'Donors and observers: read-only overview.',
};
