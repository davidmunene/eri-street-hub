/**
 * Seeds the first administrator and default sites.
 * With SEED_DEMO=true it also creates FICTIONAL demo data for trying the system out.
 * Safe to run more than once.
 */
import { PrismaClient, type Stage, type Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}. Copy .env.example to .env and fill it in.`);
  return v;
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const daysAhead = (n: number, hour = 10) => { const d = new Date(Date.now() + n * 86_400_000); d.setUTCHours(hour - 3, 0, 0, 0); return d; };

async function main() {
  const email = required('SEED_ADMIN_EMAIL').toLowerCase();
  const password = required('SEED_ADMIN_PASSWORD');
  if (password.length < 10) throw new Error('SEED_ADMIN_PASSWORD must be at least 10 characters.');

  const siteNames = [
    ['Thika / Juja', 'Thika town & Juja outreach points'],
    ['Mlango Kubwa', 'Mathare, Mlango Kubwa ward'],
    ['Makadara Grounds', 'Makadara & Jogoo Road area'],
  ];
  const sites = await Promise.all(siteNames.map(([name, description]) => prisma.site.upsert({ where: { name }, update: {}, create: { name, description } })));

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email, name: process.env.SEED_ADMIN_NAME || 'System Administrator', role: 'ADMIN', position: 'System Administrator',
      passwordHash: await bcrypt.hash(password, 12), mustChangePassword: true, siteId: sites[0].id,
    },
  });
  console.log(`✔ Administrator: ${admin.email}`);

  if (process.env.SEED_DEMO !== 'true') return;
  if ((await prisma.beneficiary.count()) > 0) { console.log('ℹ Demo data skipped: beneficiaries already exist.'); return; }

  const demoPassword = await bcrypt.hash(process.env.SEED_DEMO_PASSWORD || password, 12);
  // Fictional people. Any resemblance to real persons is coincidental.
  const people: [string, string, Role, string, number][] = [
    ['Grace Wanjiru', 'chair@demo.eristreet.org', 'OFFICIAL', 'Chairperson', 0],
    ['Peter Otieno', 'treasurer@demo.eristreet.org', 'OFFICIAL', 'Treasurer', 1],
    ['Amina Hassan', 'secretary@demo.eristreet.org', 'OFFICIAL', 'Secretary', 2],
    ['Brian Kiprono', 'field1@demo.eristreet.org', 'STAFF', 'Field Officer', 0],
    ['Faith Achieng', 'field2@demo.eristreet.org', 'STAFF', 'Caseworker', 1],
    ['Samuel Mwangi', 'field3@demo.eristreet.org', 'STAFF', 'Field Officer', 2],
    ['Joy Njoki', 'member1@demo.eristreet.org', 'MEMBER', 'Volunteer', 0],
    ['Kevin Mutua', 'member2@demo.eristreet.org', 'MEMBER', 'Volunteer, Communications', 1],
    ['Esther Chebet', 'donor@demo.eristreet.org', 'VIEWER', 'Partner representative', 2],
  ];
  const users = [];
  for (const [name, mail, role, position, site] of people) {
    users.push(await prisma.user.upsert({
      where: { email: mail }, update: {},
      create: { name, email: mail, role, position, siteId: sites[site].id, passwordHash: demoPassword, mustChangePassword: false, skills: role === 'STAFF' ? ['Counselling', 'First aid', 'Swahili'] : [] },
    }));
  }
  const [chair, treasurer, secretary, field1, field2, field3, member1, member2] = users;
  const staff = [field1, field2, field3];

  // Beneficiaries spread across the pipeline
  const names = ['Daniel Kamau', 'Mercy Atieno', 'John Ouma', 'Ruth Wambui', 'Moses Kiptoo', 'Lucy Nduta', 'Hassan Ali', 'Agnes Moraa', 'Tom Barasa', 'Naomi Jeptoo',
    'Felix Omondi', 'Sharon Wairimu', 'Victor Njoroge', 'Diana Akinyi', 'Collins Kibet', 'Rose Muthoni', 'Ibrahim Abdi', 'Janet Kerubo', 'Paul Wekesa', 'Beatrice Nyambura'];
  const aliases = ['Dan', 'Mama Mercy', 'Johnte', null, 'Mose', null, 'Hassa', null, 'Tommy', null, 'Fello', 'Shaz', 'Vic', null, 'Colo', null, 'Ibra', null, 'Paulo', 'Bea'];
  const stages: Stage[] = ['HELPING_HAND', 'HELPING_HAND', 'HELPING_HAND', 'HELPING_HAND', 'IDENTIFICATION', 'IDENTIFICATION', 'IDENTIFICATION', 'IDENTIFICATION',
    'ACCESS_REHABILITATION', 'ACCESS_REHABILITATION', 'ACCESS_REHABILITATION', 'REINTEGRATION', 'REINTEGRATION', 'REINTEGRATION', 'RESOCIALIZATION', 'RESOCIALIZATION', 'GRADUATED', 'GRADUATED', 'HELPING_HAND', 'IDENTIFICATION'];
  const flags = [['Substance use'], ['Pregnant / young mother', 'Food insecurity'], ['No shelter'], ['Minor'], ['Substance use', 'Mental health'], [], ['Chronic illness'], ['Survivor of violence'], [], ['Elderly']];
  const order = Object.fromEntries(['HELPING_HAND', 'IDENTIFICATION', 'ACCESS_REHABILITATION', 'REINTEGRATION', 'RESOCIALIZATION', 'GRADUATED'].map((s, i) => [s, i]));

  const beneficiaries = [];
  for (let i = 0; i < names.length; i++) {
    const stage = stages[i];
    const level = order[stage];
    const docStatus = (min: number) => (level > min ? 'OBTAINED' : level === min ? 'IN_PROCESS' : 'MISSING') as 'OBTAINED' | 'IN_PROCESS' | 'MISSING';
    const intake = daysAgo(20 + i * 17);
    const caseworker = staff[i % 3];
    beneficiaries.push(await prisma.beneficiary.create({
      data: {
        code: `ESI-${String(i + 1).padStart(4, '0')}`, legalName: names[i], alias: aliases[i], gender: i % 2 ? 'FEMALE' : 'MALE',
        estimatedAge: 16 + ((i * 7) % 40), siteId: sites[i % 3].id, stage, intakeDate: intake, stageChangedAt: daysAgo(5 + ((i * 11) % 80)),
        hasDisability: i % 7 === 3, disabilityDetails: i % 7 === 3 ? 'Partial hearing loss' : null, hasHealthcare: level >= 2,
        householdSize: 1 + (i % 5), caregiverName: i % 3 === 0 ? 'Mother (name withheld)' : null, caregiverRelation: i % 3 === 0 ? 'Mother' : null,
        vulnerabilityFlags: flags[i % flags.length], consentGiven: true, caseworkerId: caseworker.id, registeredById: caseworker.id,
        idDocuments: { create: [
          { type: 'BIRTH_CERTIFICATE', status: docStatus(1) },
          { type: 'NATIONAL_ID', status: docStatus(1) },
          { type: 'SHA_CARD', status: docStatus(2) },
        ] },
        notes: { create: [
          { authorId: caseworker.id, body: 'First contact during evening outreach. Shared a meal and explained the programme.', createdAt: intake },
          ...(level > 0 ? [{ authorId: caseworker.id, body: 'Accompanied to the Huduma Centre to begin the ID application.', createdAt: daysAgo(10 + i) }] : []),
        ] },
        ...(level > 0 ? { stageChanges: { create: { fromStage: 'HELPING_HAND' as Stage, toStage: stage, changedById: caseworker.id, createdAt: daysAgo(5 + ((i * 11) % 80)) } } } : {}),
      },
    }));
  }

  // Field reports
  const reportTypes = ['FOOD', 'HEALTH', 'DOCUMENTATION', 'COUNSELLING', 'FOOD', 'REFERRAL'] as const;
  for (let i = 0; i < 12; i++) {
    await prisma.fieldReport.create({
      data: {
        type: reportTypes[i % reportTypes.length], date: daysAgo(i * 6 + 1), siteId: sites[i % 3].id, staffId: staff[i % 3].id,
        outcome: i % 5 === 4 ? 'NEEDS_FOLLOW_UP' : 'SUCCESS', peopleReached: 15 + i * 3,
        summary: ['Hot lunch and tea served at the evening outreach point.', 'Health screening with volunteer nurse; 4 referred to the county hospital.', 'ID application day: forms filled and documents photocopied.', 'Group counselling session on substance use recovery.'][i % 4],
        beneficiaries: { connect: beneficiaries.filter((_, j) => j % 3 === i % 3).slice(0, 4).map((b) => ({ id: b.id })) },
      },
    });
  }

  // Partners
  await prisma.partner.createMany({ data: [
    { name: 'County Referral Hospital (demo)', type: 'Health facility', services: 'Outpatient care, HIV/TB testing, SHA registration desk', contactPerson: 'Social work office', phone: '0700 000 001', siteId: sites[1].id },
    { name: 'Huduma Centre (demo)', type: 'Government office', services: 'National ID applications, birth certificate replacement', notes: 'Bring a letter from the chief and two passport photos.', siteId: sites[2].id },
    { name: 'Hope Rehabilitation Centre (demo)', type: 'Rehabilitation centre', services: '90-day residential rehab programme, family therapy', phone: '0700 000 002', siteId: sites[0].id },
    { name: 'Youth Skills Polytechnic (demo)', type: 'School / training', services: 'Tailoring, welding, hairdressing short courses; fee waivers available', siteId: sites[0].id },
  ] });

  // Noticeboard
  await prisma.announcement.create({ data: { title: 'Welcome to the Eri Street Hub 🎉', pinned: true, authorId: chair.id, body: 'This is our new shared space. Please update your profile, RSVP to the next members\' meeting and use the suggestion box for any ideas.\n\nThank you for everything you do for our community.' } });
  await prisma.announcement.create({ data: { title: 'Outreach schedule for this month', authorId: field1.id, audience: 'TEAM', body: 'Tuesdays: Mlango Kubwa\nThursdays: Makadara Grounds\nSaturdays: Thika / Juja\n\nMeet at the usual points at 5pm.' } });
  await prisma.announcement.create({ data: { title: 'Monthly dues reminder', authorId: treasurer.id, body: 'Member dues of KES 500 are due by the 5th. Pay via M-Pesa and share the code with the treasurer.' } });

  // Events
  const meeting = await prisma.event.create({ data: { title: 'Monthly members\' meeting', type: 'MEETING', startsAt: daysAhead(6, 14), endsAt: daysAhead(6, 16), venue: 'Community hall', siteId: sites[0].id, organizerId: secretary.id, description: '1. Opening\n2. Treasurer\'s report\n3. Programme updates from each site\n4. AOB' } });
  await prisma.event.create({ data: { title: 'ID registration drive', type: 'OUTREACH', startsAt: daysAhead(10, 9), venue: 'Makadara Grounds', siteId: sites[2].id, organizerId: field3.id } });
  await prisma.event.create({ data: { title: 'Volunteer first-aid training', type: 'TRAINING', startsAt: daysAhead(18, 10), venue: 'Online (link shared on the day)', organizerId: chair.id } });
  const past = await prisma.event.create({ data: { title: 'Annual planning meeting', type: 'MEETING', startsAt: daysAgo(25), venue: 'Community hall', organizerId: secretary.id, minutes: 'Present: 9 members.\n\n1. Agreed to expand outreach to a fourth site.\n2. Treasurer to prepare a budget for ID application fees.\n\nAction points:\n- Secretary to circulate minutes\n- Field officers to map new outreach points' } });
  await prisma.eventRsvp.createMany({ data: [chair, treasurer, secretary, field1, member1].map((u) => ({ eventId: meeting.id, userId: u.id, status: 'GOING' as const })) });
  await prisma.eventRsvp.createMany({ data: users.slice(0, 7).map((u) => ({ eventId: past.id, userId: u.id, status: 'GOING' as const, attended: true })) });

  // Tasks
  await prisma.task.createMany({ data: [
    { title: 'Prepare Q3 donor report', priority: 'HIGH', dueDate: daysAhead(4), assigneeId: secretary.id, creatorId: chair.id },
    { title: 'Buy food supplies for Saturday outreach', priority: 'MEDIUM', dueDate: daysAhead(2), assigneeId: treasurer.id, creatorId: field1.id, status: 'IN_PROGRESS' },
    { title: 'Follow up on 5 pending ID applications', priority: 'HIGH', dueDate: daysAgo(1), assigneeId: field3.id, creatorId: field3.id },
    { title: 'Design posters for the fundraiser', priority: 'LOW', assigneeId: member2.id, creatorId: chair.id },
    { title: 'Update partner contact list', priority: 'LOW', creatorId: field2.id },
    { title: 'Book venue for members\' meeting', priority: 'MEDIUM', assigneeId: secretary.id, creatorId: chair.id, status: 'DONE', completedAt: daysAgo(2) },
  ] });

  // Finance (whole KES)
  const tx = [];
  for (let m = 0; m < 6; m++) {
    for (const u of users.slice(0, 8)) tx.push({ type: 'INCOME' as const, category: 'Member dues', amount: 500, date: daysAgo(m * 30 + 3), memberId: u.id, recordedById: treasurer.id, description: 'Monthly dues' });
    tx.push({ type: 'EXPENSE' as const, category: 'Food & meals', amount: 6000 + m * 400, date: daysAgo(m * 30 + 8), recordedById: treasurer.id, description: 'Outreach meals' });
    tx.push({ type: 'EXPENSE' as const, category: 'Transport', amount: 1800, date: daysAgo(m * 30 + 12), recordedById: treasurer.id, description: 'Field staff fare' });
    if (m % 2 === 0) tx.push({ type: 'EXPENSE' as const, category: 'Documentation fees', amount: 2500, date: daysAgo(m * 30 + 15), recordedById: treasurer.id, description: 'Birth certificate applications' });
  }
  tx.push({ type: 'INCOME' as const, category: 'Grant', amount: 60000, date: daysAgo(120), recordedById: treasurer.id, description: 'Community foundation grant (demo)' });
  tx.push({ type: 'INCOME' as const, category: 'Donation', amount: 15000, date: daysAgo(40), recordedById: treasurer.id, description: 'Well-wisher donation', reference: 'DEMO123ABC' });
  await prisma.transaction.createMany({ data: tx });

  await prisma.document.createMany({ data: [
    { title: 'Safeguarding policy (sample link)', category: 'POLICY', externalUrl: 'https://www.odpc.go.ke/', uploaderId: chair.id, description: 'Replace with your own policy document.' },
    { title: 'Intake procedure (SOP)', category: 'SOP', externalUrl: 'https://www.odpc.go.ke/', uploaderId: field1.id, audience: 'TEAM' },
  ] });

  await prisma.suggestion.create({ data: { body: 'Could we hold a quarterly open day for families of beneficiaries?', authorId: member1.id } });
  await prisma.auditLog.create({ data: { actorId: admin.id, action: 'system.seed', summary: 'Demo data loaded' } });

  console.log(`✔ Demo data created. Demo accounts (e.g. ${people[0][1]}) use SEED_DEMO_PASSWORD or the admin password.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
