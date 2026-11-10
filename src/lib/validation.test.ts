import { describe, expect, it } from 'vitest';
import { beneficiarySchema, documentSchema, passwordSchema, transactionSchema } from './validation';

describe('validation', () => {
  it('requires consent before storing a beneficiary', () => {
    const base = { legalName: 'Test Person', gender: 'MALE' };
    expect(beneficiarySchema.safeParse(base).success).toBe(false);
    const ok = beneficiarySchema.safeParse({ ...base, consentGiven: 'on', estimatedAge: '', vulnerabilityFlags: 'Minor' });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.estimatedAge).toBeUndefined();
      expect(ok.data.vulnerabilityFlags).toEqual(['Minor']);
      expect(ok.data.birthCertificate).toBe('MISSING');
    }
  });

  it('accepts only positive whole-shilling amounts', () => {
    const base = { type: 'INCOME', category: 'Donation', date: '2026-01-10' };
    expect(transactionSchema.safeParse({ ...base, amount: '500' }).success).toBe(true);
    expect(transactionSchema.safeParse({ ...base, amount: '-5' }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...base, amount: '10.5' }).success).toBe(false);
  });

  it('enforces a reasonable password policy', () => {
    expect(passwordSchema.safeParse('short1').success).toBe(false);
    expect(passwordSchema.safeParse('onlyletterslong').success).toBe(false);
    expect(passwordSchema.safeParse('Baobab-7342-Rain').success).toBe(true);
  });

  it('blocks non-https and javascript: document links', () => {
    expect(documentSchema.safeParse({ title: 'x', category: 'OTHER', externalUrl: 'javascript:alert(1)' }).success).toBe(false);
    expect(documentSchema.safeParse({ title: 'x', category: 'OTHER', externalUrl: 'http://example.com' }).success).toBe(false);
    expect(documentSchema.safeParse({ title: 'x', category: 'OTHER', externalUrl: 'https://drive.google.com/x' }).success).toBe(true);
  });
});

describe('error messages', () => {
  it('are human-friendly for empty selects', () => {
    const r = beneficiarySchema.safeParse({ legalName: 'A', gender: '', consentGiven: 'on' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.find((i) => i.path[0] === 'gender')?.message).toBe('Please choose an option');
  });
});
