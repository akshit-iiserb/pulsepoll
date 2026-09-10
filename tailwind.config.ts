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
        dark: {
          bg: '#0b0b14',
          surface: '#111120',
          surface2: '#191928',
          surface3: '#20203a',
          border: '#252540',
          border2: '#333355',
        },
        rose: {
          950: '#1a0a12',
          900: '#2d1220',
          800: '#4a1f35',
          700: '#6b2e4f',
          600: '#8a3d68',
          500: '#a84e7e',
          400: '#c06890',
          300: '#d58aaa',
          200: '#e8afc5',
          100: '#f5d4e2',
          50: '#fdf0f6',
        },
        muted: {
          text: '#8888aa',
          border: '#252540',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'rose-glow': '0 0 20px rgba(168, 78, 126, 0.25)',
        'rose-glow-sm': '0 0 10px rgba(168, 78, 126, 0.15)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
      },
      backgroundImage: {
        'rose-gradient': 'linear-gradient(135deg, #a84e7e22, #c0689022)',
        'dark-gradient': 'linear-gradient(180deg, #0b0b14 0%, #111120 100%)',
        'hero-gradient': 'radial-gradient(ellipse 80% 50% at 50% -20%, #a84e7e33, transparent)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'bar-grow': 'barGrow 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        barGrow: {
          '0%': { transform: 'scaleX(0)', transformOrigin: 'left' },
          '100%': { transform: 'scaleX(1)', transformOrigin: 'left' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
