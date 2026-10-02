export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // Ensures custom classes defined in @layer components are never purged
    // (Tailwind only keeps component-layer classes it finds in scanned files).
    "./src/**/*.css",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#06120D',
          900: '#0B1F17',
          800: '#12302A',
          700: '#1C4338',
          600: '#2B5A4C',
        },
        leaf: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        lime: {
          300: '#D9F99D',
          400: '#BEF264',
          500: '#A3E635',
        },
        paper: '#F6F7F2',
        'paper-2': '#EEF0E8',
        critical: '#F43F5E',
        high: '#F59E0B',
        medium: '#3B82F6',
        low: '#64748B',
        info: '#0EA5E9',
        brand: {
          green: {
            50: '#ECFDF5',
            100: '#D1FAE5',
            200: '#A7F3D0',
            500: '#10B981',
            600: '#059669',
            700: '#047857',
            800: '#065F46',
          },
          blue: {
            50: '#EFF6FF',
            100: '#DBEAFE',
            200: '#BFDBFE',
            500: '#3B82F6',
            600: '#2563EB',
            700: '#1D4ED8',
            800: '#1E40AF',
          },
          dark: {
            900: '#0F172A',
            800: '#1E293B',
            700: '#334155',
            600: '#475569',
          },
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'Geist', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgb(6 18 13 / .04), 0 8px 24px -8px rgb(6 18 13 / .08)',
        lift: '0 2px 4px rgb(6 18 13 / .05), 0 20px 40px -12px rgb(6 18 13 / .18)',
        glow: '0 0 0 1px rgb(190 242 100 / .35), 0 0 40px -4px rgb(190 242 100 / .35)',
        'glow-leaf': '0 0 0 1px rgb(16 185 129 / .3), 0 0 36px -6px rgb(16 185 129 / .4)',
        'inner-hair': 'inset 0 1px 0 rgb(255 255 255 / .6)',
        card: '0 1px 2px rgb(6 18 13 / .04), 0 8px 24px -8px rgb(6 18 13 / .08)',
        'dark-soft': '0 1px 2px rgb(0 0 0 / .3), 0 16px 40px -16px rgb(0 0 0 / .6)',
      },
      backgroundImage: {
        aurora:
          'radial-gradient(60% 55% at 18% 12%, rgb(16 185 129 / .30) 0%, transparent 60%),' +
          'radial-gradient(50% 45% at 82% 8%, rgb(45 212 191 / .26) 0%, transparent 62%),' +
          'radial-gradient(65% 60% at 55% 96%, rgb(190 242 100 / .20) 0%, transparent 60%),' +
          'radial-gradient(45% 40% at 96% 62%, rgb(16 185 129 / .16) 0%, transparent 60%)',
        'hero-dark': 'linear-gradient(160deg, #06120D 0%, #0B1F17 42%, #12302A 100%)',
        'lime-glow': 'linear-gradient(135deg, #BEF264 0%, #34D399 100%)',
        'card-sheen': 'linear-gradient(135deg, rgb(255 255 255 / .06) 0%, rgb(255 255 255 / 0) 55%)',
        'grid-dots':
          'radial-gradient(circle at 1px 1px, rgb(6 18 13 / .10) 1px, transparent 0)',
        'topo':
          'repeating-radial-gradient(circle at 30% 40%, transparent 0 38px, rgb(6 18 13 / .05) 38px 39px),' +
          'repeating-radial-gradient(circle at 72% 66%, transparent 0 52px, rgb(6 18 13 / .04) 52px 53px)',
      },
      keyframes: {
        aurora: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '33%': { transform: 'translate3d(4%, -3%, 0) scale(1.08)' },
          '66%': { transform: 'translate3d(-3%, 4%, 0) scale(0.95)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(.75)', opacity: '0.9' },
          '75%, 100%': { transform: 'scale(2)', opacity: '0' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'shine': {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(220%)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        shake: {
          '10%, 90%': { transform: 'translateX(-2px)' },
          '20%, 80%': { transform: 'translateX(3px)' },
          '30%, 50%, 70%': { transform: 'translateX(-4px)' },
          '40%, 60%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        aurora: 'aurora 24s ease-in-out infinite',
        shimmer: 'shimmer 1.8s linear infinite',
        'spin-slow': 'spin-slow 1.2s linear infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(.2,.6,.35,1) infinite',
        marquee: 'marquee 38s linear infinite',
        float: 'float 7s ease-in-out infinite',
        shine: 'shine 2.6s ease-in-out infinite',
        'fade-up': 'fade-up .5s cubic-bezier(.16,1,.3,1) both',
        shake: 'shake .4s ease-in-out',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(.16,1,.3,1)',
      },
      zIndex: {
        navbar: '40',
        dropdown: '50',
        modal: '60',
        mapctl: '20',
      },
    },
  },
  plugins: [],
}
