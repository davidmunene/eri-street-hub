import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/lib/permissions';
import { Avatar, Badge, Card, PageHeader } from '@/components/ui';
import { InlineAction } from '@/components/forms';
import { formatDate } from '@/lib/format';
import ProfileForm from './ProfileForm';
import ThemeToggle from '@/components/ThemeToggle';
import PasswordForm from './PasswordForm';
import { removeAvatar } from './actions';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const me = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: me.id }, include: { site: true } });

  return (
    <>
      <PageHeader title="My profile & settings" description="Update how you appear to other members and keep your account secure." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Profile"><ProfileForm user={user} /></Card>
          <Card title="Change password"><PasswordForm /></Card>
          <Card title="Appearance" description="Choose light or dark mode. Your choice is remembered on this device.">
            <ThemeToggle withLabel className="ring-1 ring-inset ring-slate-300" />
          </Card>
        </div>
        <Card title="Your account">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} src={user.image} size="lg" />
            <div className="min-w-0">
              <p className="break-words font-semibold">{user.name}</p>
              <p className="break-all text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
          {user.image ? (
            <InlineAction action={removeAvatar} className="mt-3"><button className="text-xs text-slate-500 underline">Remove photo</button></InlineAction>
          ) : null}
          <dl className="mt-6 space-y-3 text-sm">
            <div><dt className="text-slate-500">Role</dt><dd className="mt-0.5"><Badge tone="brand">{ROLE_LABELS[user.role]}</Badge><p className="mt-1 text-xs text-slate-500">{ROLE_DESCRIPTIONS[user.role]}</p></dd></div>
            {user.position ? <div><dt className="text-slate-500">Position</dt><dd>{user.position}</dd></div> : null}
            <div><dt className="text-slate-500">Site</dt><dd>{user.site?.name ?? '—'}</dd></div>
            <div><dt className="text-slate-500">Member since</dt><dd>{formatDate(user.joinedAt)}</dd></div>
          </dl>
          <p className="mt-6 text-xs text-slate-500">Role, position and email are managed by an administrator.</p>
        </Card>
      </div>
    </>
  );
}
