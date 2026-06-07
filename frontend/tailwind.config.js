/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Neon Indigo Ops System
        'neon-bg': '#0B1020',
        'neon-surface': 'rgba(20, 30, 60, 0.6)',
        'neon-surface-hover': 'rgba(20, 30, 60, 0.8)',
        'neon-primary': '#6366F1',
        'neon-accent': '#22D3EE',
        'neon-success': '#34D399',
        'neon-warning': '#FBBF24',
        'neon-danger': '#F87171',
        'neon-text': '#F8FAFC',
        'neon-text-secondary': '#CBD5E1',
        'neon-divider': 'rgba(100, 116, 139, 0.3)',
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50: '#fefce8',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
      },
      spacing: {
        '128': '32rem',
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'pulse-glow': 'pulse-glow 2s infinite',
        'soft-pulse': 'soft-pulse 2s infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 12px rgba(34, 211, 238, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(34, 211, 238, 0.8)' },
        },
        'soft-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      backdropBlur: {
        'glass': '20px',
      },
      boxShadow: {
        'glow-cyan': '0 0 12px rgba(34, 211, 238, 0.5)',
        'glow-cyan-lg': '0 0 20px rgba(34, 211, 238, 0.7)',
        'glow-indigo': '0 0 16px rgba(99, 102, 241, 0.4)',
        'glow-red': '0 0 12px rgba(248, 113, 113, 0.4)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
