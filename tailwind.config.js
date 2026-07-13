/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Soléan's brand accent — overrides Tailwind's default teal shades.
        // 300/400 are light enough to sit under dark text (badges, swatches);
        // 500/600/700 are dark enough to use as text/borders directly on the
        // white page background.
        teal: {
          300: '#9fe0d6',
          400: '#4fc3b4',
          500: '#249c8d',
          600: '#1c7a6e',
          700: '#155a52',
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
