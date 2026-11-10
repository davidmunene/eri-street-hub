import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { can } from '@/lib/permissions';
import { csvEscape, toDateInput } from '@/lib/format';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'finance:view')) return new Response('Forbidden', { status: 403 });
  const year = Number(new URL(req.url).searchParams.get('year')) || new Date().getFullYear();
  const rows = await prisma.transaction.findMany({
    where: { date: { gte: new Date(`${year}-01-01T00:00:00+03:00`), lt: new Date(`${year + 1}-01-01T00:00:00+03:00`) } },
    orderBy: { date: 'asc' },
    include: { member: { select: { name: true } }, recordedBy: { select: { name: true } } },
  });
  const header = ['Date', 'Type', 'Category', 'Amount (KES)', 'Description', 'Reference', 'Member', 'Recorded by'];
  const lines = rows.map((r) => [toDateInput(r.date), r.type, r.category, r.type === 'INCOME' ? r.amount : -r.amount, r.description, r.reference, r.member?.name, r.recordedBy.name].map(csvEscape).join(','));
  return new Response([header.join(','), ...lines].join('\r\n'), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="eri-street-finance-${year}.csv"` },
  });
}
