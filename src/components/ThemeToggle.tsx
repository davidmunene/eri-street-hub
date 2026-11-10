'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/components/ui';
import { THEME_KEY } from '@/lib/theme';

type Theme = 'light' | 'dark';
const KEY = THEME_KEY;

function apply(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export default function ThemeToggle({ className, withLabel = false }: { className?: string; withLabel?: boolean }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    // Follow the operating system until the user picks a theme explicitly.
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      let saved: string | null = null;
      try { saved = localStorage.getItem(KEY); } catch {}
      if (!saved) { const t = e.matches ? 'dark' : 'light'; apply(t); setTheme(t); }
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    apply(next);
    setTheme(next);
    try { localStorage.setItem(KEY, next); } catch {}
  };

  const dark = theme === 'dark';
  const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      aria-pressed={dark}
      className={cn('inline-flex items-center gap-2 rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900', className)}
    >
      {/* Render both icons until mounted to avoid a hydration mismatch */}
      {theme === null ? <Moon className="h-5 w-5 opacity-0" /> : dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      {withLabel ? <span className="text-sm font-medium">{dark ? 'Light mode' : 'Dark mode'}</span> : null}
    </button>
  );
}
