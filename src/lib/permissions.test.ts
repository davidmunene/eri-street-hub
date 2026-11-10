import { describe, expect, it } from 'vitest';
import { can, visibleAudiences, PERMISSIONS } from './permissions';

describe('permissions', () => {
  it('keeps beneficiary data away from members and viewers', () => {
    for (const role of ['MEMBER', 'VIEWER'] as const) {
      expect(can(role, 'beneficiaries:view')).toBe(false);
      expect(can(role, 'beneficiaries:manage')).toBe(false);
    }
    expect(can('STAFF', 'beneficiaries:manage')).toBe(true);
  });

  it('restricts finance to leadership', () => {
    expect(can('OFFICIAL', 'finance:manage')).toBe(true);
    expect(can('STAFF', 'finance:view')).toBe(false);
    expect(can('MEMBER', 'finance:view')).toBe(false);
  });

  it('only admins manage members, delete records and see the admin area', () => {
    for (const p of ['members:manage', 'beneficiaries:delete', 'admin:access'] as const) {
      expect(PERMISSIONS[p]).toEqual(['ADMIN']);
    }
  });

  it('denies everything without a role', () => {
    expect(can(undefined, 'dashboard:view')).toBe(false);
    expect(can(null, 'suggestions:submit')).toBe(false);
  });

  it('scopes announcement audiences by role', () => {
    expect(visibleAudiences('VIEWER')).toEqual(['EVERYONE']);
    expect(visibleAudiences('MEMBER')).toEqual(['EVERYONE']);
    expect(visibleAudiences('STAFF')).toEqual(['EVERYONE', 'TEAM']);
    expect(visibleAudiences('OFFICIAL')).toContain('LEADERSHIP');
  });
});
