/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // iRace brand — electric blue, clearly distinct from Strava orange
        'brand': {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#3B82F6',
          faint: '#EFF6FF',
          dark: '#1E40AF',
        },
        // Strava-reserved: ONLY for official Connect button, Powered-by lockup, View-on-Strava links
        'strava-orange': '#FC5200',
        'strava-orange-legacy': '#FC4C02',
        // Sport identity colors (not brand colors)
        'running': '#FF6B35',
        'cycling': '#4285F4',
        'swimming': '#00BCD4',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
};