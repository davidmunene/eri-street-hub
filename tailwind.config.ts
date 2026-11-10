import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

// Colours resolve to CSS variables defined in src/app/globals.css (light + .dark).
const v = {
      "slate": {
            "50": "rgb(var(--slate-50) / <alpha-value>)",
            "100": "rgb(var(--slate-100) / <alpha-value>)",
            "200": "rgb(var(--slate-200) / <alpha-value>)",
            "300": "rgb(var(--slate-300) / <alpha-value>)",
            "400": "rgb(var(--slate-400) / <alpha-value>)",
            "500": "rgb(var(--slate-500) / <alpha-value>)",
            "600": "rgb(var(--slate-600) / <alpha-value>)",
            "700": "rgb(var(--slate-700) / <alpha-value>)",
            "800": "rgb(var(--slate-800) / <alpha-value>)",
            "900": "rgb(var(--slate-900) / <alpha-value>)",
            "950": "rgb(var(--slate-950) / <alpha-value>)"
      },
      "brand": {
            "50": "rgb(var(--brand-50) / <alpha-value>)",
            "100": "rgb(var(--brand-100) / <alpha-value>)",
            "200": "rgb(var(--brand-200) / <alpha-value>)",
            "300": "rgb(var(--brand-300) / <alpha-value>)",
            "400": "rgb(var(--brand-400) / <alpha-value>)",
            "500": "rgb(var(--brand-500) / <alpha-value>)",
            "600": "rgb(var(--brand-600) / <alpha-value>)",
            "700": "rgb(var(--brand-700) / <alpha-value>)",
            "800": "rgb(var(--brand-800) / <alpha-value>)",
            "900": "rgb(var(--brand-900) / <alpha-value>)"
      },
      "leaf": {
            "50": "rgb(var(--leaf-50) / <alpha-value>)",
            "100": "rgb(var(--leaf-100) / <alpha-value>)",
            "200": "rgb(var(--leaf-200) / <alpha-value>)",
            "500": "rgb(var(--leaf-500) / <alpha-value>)",
            "600": "rgb(var(--leaf-600) / <alpha-value>)",
            "700": "rgb(var(--leaf-700) / <alpha-value>)"
      },
      "amber": {
            "50": "rgb(var(--amber-50) / <alpha-value>)",
            "200": "rgb(var(--amber-200) / <alpha-value>)",
            "500": "rgb(var(--amber-500) / <alpha-value>)",
            "700": "rgb(var(--amber-700) / <alpha-value>)",
            "800": "rgb(var(--amber-800) / <alpha-value>)"
      },
      "rose": {
            "50": "rgb(var(--rose-50) / <alpha-value>)",
            "200": "rgb(var(--rose-200) / <alpha-value>)",
            "300": "rgb(var(--rose-300) / <alpha-value>)",
            "400": "rgb(var(--rose-400) / <alpha-value>)",
            "600": "rgb(var(--rose-600) / <alpha-value>)",
            "700": "rgb(var(--rose-700) / <alpha-value>)",
            "800": "rgb(var(--rose-800) / <alpha-value>)"
      },
      "sky": {
            "50": "rgb(var(--sky-50) / <alpha-value>)",
            "700": "rgb(var(--sky-700) / <alpha-value>)"
      },
      "violet": {
            "50": "rgb(var(--violet-50) / <alpha-value>)",
            "700": "rgb(var(--violet-700) / <alpha-value>)"
      }
};

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ...v,
        'surface': 'rgb(var(--surface) / <alpha-value>)',
        'primary': 'rgb(var(--primary) / <alpha-value>)',
        'primary-hover': 'rgb(var(--primary-hover) / <alpha-value>)',
        'danger': 'rgb(var(--danger) / <alpha-value>)',
        'chart-1': 'rgb(var(--chart-1) / <alpha-value>)',
        'chart-2': 'rgb(var(--chart-2) / <alpha-value>)',
        // Fixed colours that do not change with the theme
        forest: { 800: '#14472a', 900: '#0f3820', 950: '#0a2716' },
        lime: { DEFAULT: '#b8e55b', hover: '#c9ef7a' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [forms],
};

export default config;
