/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FDFBF7',
        'card-white': '#FFFFFF',
        lavender: '#E6E6FA',
        mint: '#E0F4F1',
        blush: '#FCE4EC',
        'pale-yellow': '#FFF9C4',
        'text-slate': '#4A4556',
        'subtle-gray': '#9B93A9',
        // Dark mode surfaces
        'dark-bg': '#16171D',
        'dark-card': '#1E1F28',
        'dark-border': '#2E303A',
        'dark-text': '#E2E0E7',
        'dark-muted': '#8B839A',
      },
    },
  },
  plugins: [],
}
