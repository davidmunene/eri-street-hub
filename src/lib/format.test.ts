import { describe, expect, it } from 'vitest';
import { ageFrom, beneficiaryCode, csvEscape, humanize, initials, parseNairobi, toDateTimeLocal } from './format';

describe('format helpers', () => {
  it('builds zero-padded case codes', () => {
    expect(beneficiaryCode(7)).toBe('ESI-0007');
    expect(beneficiaryCode(12345)).toBe('ESI-12345');
  });

  it('neutralises spreadsheet formula injection in CSV exports', () => {
    expect(csvEscape('=HYPERLINK("http://evil")')).toBe(`"'=HYPERLINK(""http://evil"")"`);
    expect(csvEscape('+254700')).toBe("'+254700");
    expect(csvEscape('a,b')).toBe('"a,b"');
    expect(csvEscape(null)).toBe('');
    expect(csvEscape(42)).toBe('42');
  });

  it('round-trips Nairobi local times', () => {
    const d = parseNairobi('2026-03-15T14:30');
    expect(d.toISOString()).toBe('2026-03-15T11:30:00.000Z');
    expect(toDateTimeLocal(d)).toBe('2026-03-15T14:30');
    expect(parseNairobi('2026-03-15').toISOString()).toBe('2026-03-14T21:00:00.000Z');
  });

  it('computes age from date of birth, else uses the estimate', () => {
    const now = new Date('2026-06-01');
    expect(ageFrom(new Date('2000-06-02'), null, now)).toBe(25);
    expect(ageFrom(new Date('2000-05-31'), null, now)).toBe(26);
    expect(ageFrom(null, 30, now)).toBe(30);
  });

  it('humanizes enums and builds initials', () => {
    expect(humanize('NEEDS_FOLLOW_UP')).toBe('Needs follow up');
    expect(initials('Grace  Wanjiru Kamau')).toBe('GW');
    expect(initials('')).toBe('?');
  });
});
