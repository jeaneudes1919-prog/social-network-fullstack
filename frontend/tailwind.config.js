/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // On lie Tailwind à nos variables CSS
        primary: 'var(--bg-primary)',
        secondary: 'var(--bg-secondary)',
        textMain: 'var(--text-primary)',
        textSub: 'var(--text-secondary)',
        accent: 'var(--accent)',
        accentHover: 'var(--accent-hover)',
        borderCol: 'var(--border)',
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
      }
    },
  },
  plugins: [],
}