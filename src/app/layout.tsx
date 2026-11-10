import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: { default: 'Eri Street Hub', template: '%s · Eri Street Hub' },
  description: 'The shared workspace for Eri Street Initiative members and staff.',
  icons: { icon: '/logo.png' },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: '#1d2f86' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
