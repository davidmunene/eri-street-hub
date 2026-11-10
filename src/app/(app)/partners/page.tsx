import type { Metadata } from 'next';
import { Handshake, Mail, Phone, Trash2, User } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { can } from '@/lib/permissions';
import { Badge, EmptyState, PageHeader, inputClass, buttonClass } from '@/components/ui';
import { InlineAction } from '@/components/forms';
import PartnerForm from './PartnerForm';
import { deletePartner } from './actions';

export const metadata: Metadata = { title: 'Partners' };

export default async function PartnersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser('partners:view');
  const { q } = await searchParams;
  const [partners, sites] = await Promise.all([
    prisma.partner.findMany({
      where: q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { services: { contains: q, mode: 'insensitive' } }, { type: { contains: q, mode: 'insensitive' } }] } : {},
      orderBy: [{ type: 'asc' }, { name: 'asc' }], include: { site: true },
    }),
    prisma.site.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);
  const manage = can(user.role, 'partners:manage');

  return (
    <>
      <PageHeader title="Partners & referrals" description="Hospitals, government offices, shelters and organisations we refer people to."
        actions={manage ? <PartnerForm sites={sites} /> : null} />
      <form className="mb-5 flex max-w-md gap-2">
        <input name="q" defaultValue={q} placeholder="Search by name or service, e.g. “rehab”" aria-label="Search partners" className={inputClass} />
        <button className={buttonClass('secondary')}>Search</button>
      </form>
      {partners.length === 0 ? <EmptyState title="No partners yet" icon={<Handshake className="h-8 w-8" />} /> : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {partners.map((p) => (
            <li key={p.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{p.name}</h2>
                  <div className="mt-1 flex flex-wrap gap-1.5"><Badge tone="brand">{p.type}</Badge>{p.site ? <Badge>{p.site.name}</Badge> : null}</div>
                </div>
              </div>
              {p.services ? <p className="mt-3 text-sm text-slate-700">{p.services}</p> : null}
              {p.notes ? <p className="mt-2 text-xs text-slate-500">{p.notes}</p> : null}
              <div className="mt-auto space-y-1 pt-4 text-sm text-slate-600">
                {p.contactPerson ? <p className="flex items-center gap-2"><User className="h-4 w-4 text-slate-400" />{p.contactPerson}</p> : null}
                {p.phone ? <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /><a href={`tel:${p.phone}`} className="hover:underline">{p.phone}</a></p> : null}
                {p.email ? <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /><a href={`mailto:${p.email}`} className="truncate hover:underline">{p.email}</a></p> : null}
              </div>
              {manage ? (
                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                  <PartnerForm sites={sites} partner={p} />
                  <InlineAction action={deletePartner} hidden={{ id: p.id }} confirm={`Remove ${p.name}?`} className="ml-auto">
                    <button className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                  </InlineAction>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
