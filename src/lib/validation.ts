import { z } from 'zod';
import { parseNairobi } from '@/lib/format';

// Friendly messages for every schema (users should never see raw validator output).
z.setErrorMap((issue, ctx) => {
  if (issue.code === 'invalid_enum_value') return { message: issue.received === '' ? 'Please choose an option' : 'Please choose one of the listed options' };
  if (issue.code === 'invalid_type' && issue.received === 'undefined') return { message: 'This field is required' };
  return { message: ctx.defaultError };
});

// Form helpers: empty strings from HTML inputs become undefined / null.
const blank = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
export const optText = (max = 2000) => z.preprocess(blank, z.string().trim().max(max).optional());
export const reqText = (max = 200, label = 'This field') =>
  z.string({ required_error: `${label} is required` }).trim().min(1, `${label} is required`).max(max);
export const optInt = (min = 0, max = 1_000_000) => z.preprocess(blank, z.coerce.number().int().min(min).max(max).optional());
export const checkbox = z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean());
export const reqDate = (label = 'Date') =>
  z.string({ required_error: `${label} is required` }).min(1, `${label} is required`).transform((v, ctx) => {
    const d = parseNairobi(v);
    if (Number.isNaN(d.getTime())) { ctx.addIssue({ code: 'custom', message: 'Invalid date' }); return z.NEVER; }
    return d;
  });
export const optDate = z.preprocess(blank, z.string().optional()).transform((v) => (v ? parseNairobi(v) : undefined));
export const optId = z.preprocess(blank, z.string().cuid().optional());
const list = z.preprocess((v) => (v == null ? [] : Array.isArray(v) ? v : [v]), z.array(z.string()));
const commaList = z.preprocess(
  (v) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : []),
  z.array(z.string().max(40)).max(20),
);

export const passwordSchema = z
  .string()
  .min(10, 'Use at least 10 characters')
  .max(128)
  .regex(/[a-zA-Z]/, 'Include at least one letter')
  .regex(/[0-9]/, 'Include at least one number');

export const announcementSchema = z.object({
  title: reqText(150, 'Title'),
  body: reqText(10_000, 'Message'),
  audience: z.enum(['EVERYONE', 'TEAM', 'LEADERSHIP']).default('EVERYONE'),
  pinned: checkbox,
});

export const eventSchema = z
  .object({
    title: reqText(150, 'Title'),
    description: optText(5000),
    type: z.enum(['MEETING', 'OUTREACH', 'TRAINING', 'FUNDRAISER', 'SOCIAL', 'OTHER']),
    startsAt: reqDate('Start time'),
    endsAt: optDate,
    venue: optText(200),
    siteId: optId,
  })
  .refine((e) => !e.endsAt || e.endsAt >= e.startsAt, { path: ['endsAt'], message: 'End must be after start' });

export const taskSchema = z.object({
  title: reqText(200, 'Title'),
  description: optText(3000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  dueDate: optDate,
  assigneeId: optId,
});

export const documentSchema = z.object({
  title: reqText(200, 'Title'),
  description: optText(1000),
  category: z.enum(['POLICY', 'SOP', 'MINUTES', 'REPORT', 'FORM', 'TRAINING', 'OTHER']),
  audience: z.enum(['EVERYONE', 'TEAM', 'LEADERSHIP']).default('EVERYONE'),
  externalUrl: z.preprocess(blank, z.string().url('Enter a full link starting with https://').startsWith('https://', 'Links must use https://').optional()),
});

export const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  category: reqText(60, 'Category'),
  amount: z.coerce.number({ invalid_type_error: 'Enter an amount' }).int('Whole shillings only').positive('Amount must be more than 0').max(100_000_000),
  date: reqDate(),
  description: optText(500),
  reference: optText(60),
  memberId: optId,
});

export const memberSchema = z.object({
  name: reqText(120, 'Name'),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  role: z.enum(['ADMIN', 'OFFICIAL', 'STAFF', 'MEMBER', 'VIEWER']),
  position: optText(80),
  phone: optText(30),
  siteId: optId,
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const profileSchema = z.object({
  name: reqText(120, 'Name'),
  phone: optText(30),
  bio: optText(1000),
  skills: commaList,
});

export const beneficiarySchema = z
  .object({
    legalName: reqText(150, 'Full name'),
    alias: optText(80),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { required_error: 'Select a gender' }),
    dateOfBirth: optDate,
    estimatedAge: optInt(0, 120),
    phone: optText(30),
    siteId: optId,
    caseworkerId: optId,
    hasDisability: checkbox,
    disabilityDetails: optText(1000),
    hasHealthcare: checkbox,
    healthConditions: optText(2000),
    householdSize: optInt(0, 50),
    caregiverName: optText(120),
    caregiverRelation: optText(60),
    caregiverPhone: optText(30),
    vulnerabilityFlags: list,
    consentGiven: checkbox,
    status: z.enum(['ACTIVE', 'ON_HOLD', 'EXITED']).default('ACTIVE'),
    birthCertificate: z.enum(['MISSING', 'IN_PROCESS', 'OBTAINED']).default('MISSING'),
    nationalId: z.enum(['MISSING', 'IN_PROCESS', 'OBTAINED']).default('MISSING'),
    nationalIdNumber: optText(30),
    shaCard: z.enum(['MISSING', 'IN_PROCESS', 'OBTAINED']).default('MISSING'),
    initialNote: optText(5000),
  })
  .refine((b) => b.consentGiven, { path: ['consentGiven'], message: 'Consent is required to store personal information' });

export const fieldReportSchema = z.object({
  type: z.enum(['FOOD', 'HEALTH', 'DOCUMENTATION', 'COUNSELLING', 'EDUCATION', 'SHELTER', 'LIVELIHOOD', 'REFERRAL', 'OTHER']),
  date: reqDate(),
  siteId: optId,
  summary: reqText(5000, 'Summary'),
  outcome: z.enum(['SUCCESS', 'IN_PROGRESS', 'NEEDS_FOLLOW_UP', 'CRITICAL']),
  peopleReached: optInt(0, 100_000),
  beneficiaryIds: list,
});

export const partnerSchema = z.object({
  name: reqText(150, 'Name'),
  type: reqText(60, 'Type'),
  services: optText(1000),
  contactPerson: optText(120),
  phone: optText(30),
  email: z.preprocess(blank, z.string().email().optional()),
  siteId: optId,
  notes: optText(2000),
});

export const suggestionSchema = z.object({
  body: reqText(3000, 'Suggestion'),
  anonymous: checkbox,
});

export const VULNERABILITY_FLAGS = [
  'Substance use', 'Mental health', 'Chronic illness', 'Pregnant / young mother',
  'Minor', 'Elderly', 'No shelter', 'Food insecurity', 'Survivor of violence',
] as const;

export const TX_CATEGORIES = {
  INCOME: ['Member dues', 'Donation', 'Grant', 'Fundraiser', 'Other income'],
  EXPENSE: ['Food & meals', 'Transport', 'Medical', 'Documentation fees', 'Rent & utilities', 'Equipment', 'Training', 'Stipends', 'Admin', 'Other expense'],
} as const;
