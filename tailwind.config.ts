import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2fb',
          100: '#dbe3f7',
          200: '#b5c6ee',
          500: '#2b52c6',
          600: '#2443a6',
          700: '#1d2f86',
          800: '#18266b',
          900: '#121c50',
        },
        leaf: {
          50: '#effaeb',
          100: '#dcf3d3',
          500: '#4bab3c',
          600: '#3b8d2f',
          700: '#2f7026',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [forms],
};

export default config;
