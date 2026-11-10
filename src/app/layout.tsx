import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { themeInitScript } from '@/lib/theme';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: { default: 'Eri Street Hub', template: '%s · Eri Street Hub' },
  description: 'The shared workspace for Eri Street Initiative members and staff.',
  icons: { icon: '/logo.png' },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: [{ media: '(prefers-color-scheme: light)', color: '#0f3820' }, { media: '(prefers-color-scheme: dark)', color: '#0a2716' }] };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the init script adds the `dark` class before React hydrates.
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
