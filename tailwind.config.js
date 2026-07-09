/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Shortcut: kept the "rose" key separate AND overrode "emerald" to
        // the same values, since most existing components still reference
        // emerald-* classes. This avoids a mass find/replace across every
        // file right now. Before final launch, do the find/replace properly
        // (emerald-400 -> rose-400 etc.) so the codebase reads cleanly —
        // added to DEFERRED_TODO.md.
        emerald: {
          300: '#e8b4bc',
          400: '#d88c9a',
          500: '#c26b7a',
          600: '#a8505f',
          700: '#8a3d4a',
        },
        rose: {
          300: '#e8b4bc',
          400: '#d88c9a',
          500: '#c26b7a',
          600: '#a8505f',
          700: '#8a3d4a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};
