import type { Metadata } from 'next';
import type { Prisma } from '@prisma/client';
import { ArrowDownCircle, ArrowUpCircle, Download, Scale, Trash2 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { can } from '@/lib/permissions';
import { Badge, Card, EmptyState, PageHeader, StatCard, Table, buttonClass, inputClass, td } from '@/components/ui';
import { InlineAction } from '@/components/forms';
import { BarList } from '@/components/charts';
import { formatDate, formatKES, toDateInput } from '@/lib/format';
import TransactionForm from './TransactionForm';
import { deleteTransaction } from './actions';

export const metadata: Metadata = { title: 'Finance' };

function yearRange(y: number) {
  return { gte: new Date(`${y}-01-01T00:00:00+03:00`), lt: new Date(`${y + 1}-01-01T00:00:00+03:00`) };
}

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ year?: string; type?: string }> }) {
  const user = await requireUser('finance:view');
  const sp = await searchParams;
  const thisYear = Number(toDateInput(new Date()).slice(0, 4));
  const year = Number(sp.year) || thisYear;
  const type = sp.type === 'INCOME' || sp.type === 'EXPENSE' ? sp.type : undefined;
  const where: Prisma.TransactionWhereInput = { date: yearRange(year), ...(type ? { type } : {}) };

  const [rows, totals, byCategory, allTime, members, oldest] = await Promise.all([
    prisma.transaction.findMany({ where, orderBy: [{ date: 'desc' }, { createdAt: 'desc' }], take: 300, include: { member: { select: { name: true } }, recordedBy: { select: { name: true } } } }),
    prisma.transaction.groupBy({ by: ['type'], where: { date: yearRange(year) }, _sum: { amount: true } }),
    prisma.transaction.groupBy({ by: ['category'], where: { date: yearRange(year), type: 'EXPENSE' }, _sum: { amount: true }, orderBy: { _sum: { amount: 'desc' } } }),
    prisma.transaction.groupBy({ by: ['type'], _sum: { amount: true } }),
    prisma.user.findMany({ where: { status: 'ACTIVE' }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.transaction.findFirst({ orderBy: { date: 'asc' }, select: { date: true } }),
  ]);
  const sum = (arr: typeof totals, t: 'INCOME' | 'EXPENSE') => arr.find((x) => x.type === t)?._sum.amount ?? 0;
  const income = sum(totals, 'INCOME');
  const expense = sum(totals, 'EXPENSE');
  const balance = sum(allTime, 'INCOME') - sum(allTime, 'EXPENSE');
  const manage = can(user.role, 'finance:manage');
  const firstYear = Math.min(oldest ? Number(toDateInput(oldest.date).slice(0, 4)) : thisYear, thisYear);
  const years = Array.from({ length: thisYear - firstYear + 1 }, (_, i) => thisYear - i);

  return (
    <>
      <PageHeader title="Finance" description="A transparent record of every shilling in and out: dues, donations, grants and programme spending."
        actions={
          <>
            <a href={`/finance/export?year=${year}`} className={buttonClass('secondary')}><Download className="h-4 w-4" /> Export CSV</a>
            {manage ? <TransactionForm members={members} today={toDateInput(new Date())} /> : null}
          </>
        } />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={`Income ${year}`} value={formatKES(income)} icon={<ArrowDownCircle className="h-5 w-5" />} tone="leaf" />
        <StatCard label={`Expenses ${year}`} value={formatKES(expense)} icon={<ArrowUpCircle className="h-5 w-5" />} tone="rose" />
        <StatCard label="Current balance" value={formatKES(balance)} hint="All years combined" icon={<Scale className="h-5 w-5" />} tone={balance < 0 ? 'rose' : 'brand'} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Where the money went" description={`Expenses by category, ${year}`}>
          <BarList data={byCategory.map((c) => ({ label: c.category, value: c._sum.amount ?? 0 }))} unit="kes" emptyText="No expenses recorded" />
        </Card>

        <Card title="Ledger" className="lg:col-span-2" padded={false}
          actions={
            <form className="flex gap-2">
              <select name="year" defaultValue={year} aria-label="Year" className={`${inputClass} w-24 py-1.5`}>{years.map((y) => <option key={y}>{y}</option>)}</select>
              <select name="type" defaultValue={type ?? ''} aria-label="Type" className={`${inputClass} w-28 py-1.5`}><option value="">All</option><option value="INCOME">Income</option><option value="EXPENSE">Expenses</option></select>
              <button className={buttonClass('secondary', 'sm')}>Apply</button>
            </form>
          }>
          {rows.length === 0 ? <div className="p-5"><EmptyState title="No transactions" description="Recorded income and expenses will appear here." /></div> : (
            <Table head={['Date', 'Details', 'Category', 'Amount', '']}>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className={td}>{formatDate(r.date)}</td>
                  <td className="max-w-xs px-4 py-3">
                    <p className="truncate text-slate-800">{r.description ?? '—'}</p>
                    <p className="truncate text-xs text-slate-400">{[r.member?.name, r.reference, `by ${r.recordedBy.name}`].filter(Boolean).join(' · ')}</p>
                  </td>
                  <td className={td}><Badge>{r.category}</Badge></td>
                  <td className={`${td} text-right font-semibold tabular-nums ${r.type === 'INCOME' ? 'text-leaf-700' : 'text-rose-700'}`}>{r.type === 'INCOME' ? '+' : '−'}{formatKES(r.amount)}</td>
                  <td className="px-2">
                    {manage ? (
                      <InlineAction action={deleteTransaction} hidden={{ id: r.id }} confirm="Delete this transaction? This is recorded in the audit log.">
                        <button className="rounded p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                      </InlineAction>
                    ) : null}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
