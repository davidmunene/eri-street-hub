'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { signOut } from 'next-auth/react';
import type { Role } from '@prisma/client';
import {
  LayoutDashboard, Megaphone, CalendarDays, KanbanSquare, FolderOpen, Users, Wallet,
  HeartHandshake, Workflow, ClipboardList, Handshake, MessageSquareHeart, Shield, Menu, X,
  Search, LogOut, Settings, ChevronDown, UserPlus,
} from 'lucide-react';
import { can, ROLE_LABELS, type Permission } from '@/lib/permissions';
import { Avatar, cn } from '@/components/ui';
import ThemeToggle from '@/components/ThemeToggle';

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; perm: Permission; badgeKey?: string };
const NAV: { section: string; items: NavItem[] }[] = [
  { section: '', items: [{ href: '/', label: 'Dashboard', icon: LayoutDashboard, perm: 'dashboard:view' }] },
  {
    section: 'Organisation',
    items: [
      { href: '/announcements', label: 'Noticeboard', icon: Megaphone, perm: 'dashboard:view' },
      { href: '/events', label: 'Events & meetings', icon: CalendarDays, perm: 'dashboard:view' },
      { href: '/tasks', label: 'Tasks', icon: KanbanSquare, perm: 'tasks:view', badgeKey: 'tasks' },
      { href: '/documents', label: 'Documents', icon: FolderOpen, perm: 'dashboard:view' },
      { href: '/members', label: 'Members', icon: Users, perm: 'members:view' },
      { href: '/finance', label: 'Finance', icon: Wallet, perm: 'finance:view' },
    ],
  },
  {
    section: 'Programme',
    items: [
      { href: '/beneficiaries', label: 'Beneficiaries', icon: HeartHandshake, perm: 'beneficiaries:view' },
      { href: '/pipeline', label: 'Case pipeline', icon: Workflow, perm: 'beneficiaries:view' },
      { href: '/field-reports', label: 'Field reports', icon: ClipboardList, perm: 'beneficiaries:view' },
      { href: '/partners', label: 'Partners', icon: Handshake, perm: 'partners:view' },
    ],
  },
  {
    section: 'Community',
    items: [
      { href: '/suggestions', label: 'Suggestion box', icon: MessageSquareHeart, perm: 'suggestions:submit', badgeKey: 'suggestions' },
      { href: '/admin', label: 'Administration', icon: Shield, perm: 'admin:access' },
    ],
  },
];

export type ShellUser = { name: string; email: string; role: Role; position: string | null; image: string | null };

export default function AppShell({ user, badges, children }: { user: ShellUser; badges: Record<string, number>; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/'));

  const nav = (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Main">
      {NAV.map((group) => {
        const items = group.items.filter((i) => can(user.role, i.perm));
        if (!items.length) return null;
        return (
          <div key={group.section || 'main'}>
            {group.section ? <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40">{group.section}</p> : null}
            <ul className="space-y-0.5">
              {items.map((item) => {
                const active = isActive(item.href);
                const badge = item.badgeKey ? badges[item.badgeKey] : 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime',
                        active ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white',
                      )}
                    >
                      {active ? <span aria-hidden className="absolute inset-y-1.5 left-0 w-1 rounded-r bg-lime" /> : null}
                      <item.icon className={cn('h-[18px] w-[18px] flex-none', active ? 'text-lime' : 'text-white/50 group-hover:text-white/80')} />
                      <span className="flex-1">{item.label}</span>
                      {badge ? <span className="rounded-full bg-lime px-1.5 py-0.5 text-[10px] font-bold text-forest-950">{badge}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  const brand = (
    <Link href="/" className="flex items-center gap-3 px-5 py-5">
      <Image src="/logo.png" alt="" width={38} height={38} className="rounded-xl bg-white p-0.5 shadow-sm" />
      <span className="leading-tight">
        <span className="block text-sm font-bold text-white">Eri Street</span>
        <span className="block text-xs font-medium text-lime/80">Initiative Hub</span>
      </span>
    </Link>
  );

  const quickAdd = can(user.role, 'beneficiaries:manage') ? (
    <div className="border-t border-white/10 p-3">
      <Link href="/beneficiaries/new" className="flex items-center justify-center gap-2 rounded-lg bg-lime px-3 py-2.5 text-sm font-semibold text-forest-950 shadow-sm transition hover:bg-lime-hover">
        <UserPlus className="h-4 w-4" /> New intake
      </Link>
    </div>
  ) : null;

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-gradient-to-b from-forest-900 to-forest-950 lg:flex">
        {brand}
        {nav}
        {quickAdd}
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-gradient-to-b from-forest-900 to-forest-950 shadow-xl">
            <div className="flex items-center justify-between pr-3">
              {brand}
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Close menu"><X className="h-5 w-5" /></button>
            </div>
            {nav}
            {quickAdd}
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-surface/90 px-4 backdrop-blur sm:px-6">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <form action="/search" className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              type="search"
              placeholder="Search people, cases, documents…"
              aria-label="Search"
              className="w-full rounded-lg border-0 bg-slate-100 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:bg-surface focus:ring-2 focus:ring-brand-500"
            />
          </form>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu user={user} />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

function UserMenu({ user }: { user: ShellUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-slate-100" aria-expanded={open} aria-haspopup="menu">
        <Avatar name={user.name} src={user.image} size="sm" />
        <span className="hidden text-left sm:block">
          <span className="block max-w-[10rem] truncate text-sm font-semibold text-slate-800">{user.name}</span>
          <span className="block text-xs text-slate-500">{user.position ?? ROLE_LABELS[user.role]}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 mt-2 w-60 rounded-xl border border-slate-200 bg-surface p-1.5 shadow-lg">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          <div className="my-1 border-t border-slate-100" />
          <Link role="menuitem" href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50"><Settings className="h-4 w-4 text-slate-400" /> My profile & settings</Link>
          <button role="menuitem" onClick={() => signOut({ callbackUrl: '/login' })} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-700 hover:bg-rose-50"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
      ) : null}
    </div>
  );
}
