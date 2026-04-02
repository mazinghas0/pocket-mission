import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        secondary: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
        quest: {
          cream: '#FFFBF5',
          coral: '#FF6B35',
          'coral-light': '#FFF0EB',
          mint: '#10B981',
          'mint-light': '#ECFDF5',
          gold: '#F59E0B',
          'gold-light': '#FFFBEB',
          purple: '#7C3AED',
          'purple-light': '#F5F3FF',
          navy: '#1A1A2E',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        quest: '0 2px 12px rgba(0, 0, 0, 0.08)',
        'quest-coral': '0 4px 20px rgba(255, 107, 53, 0.18)',
        'quest-gold': '0 4px 20px rgba(245, 158, 11, 0.22)',
        'quest-purple': '0 4px 20px rgba(124, 58, 237, 0.18)',
      },
    },
  },
  plugins: [],
};

export default config;
