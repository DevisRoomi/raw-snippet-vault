/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F7F5F0',
          aged: '#EFECE4',
          sheet: '#FAF9F6',
          border: '#D8D2C4',
        },
        ink: {
          DEFAULT: '#141312',
          light: '#2B2927',
          muted: '#6E6760',
          faint: '#A69F96',
        },
        editorial: {
          red: '#991B1B',
          redlight: '#FEE2E2',
          amber: '#92400E',
          accent: '#1E293B',
        },
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        raw: '3px 3px 0px #141312',
        'raw-sm': '1px 1px 0px #141312',
        'raw-press': '0px 0px 0px #141312',
      },
    },
  },
  plugins: [],
};
