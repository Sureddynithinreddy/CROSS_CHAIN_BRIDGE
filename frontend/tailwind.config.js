/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        eth: {
          light: '#627EEA',
          DEFAULT: '#454A75',
          dark: '#2A2D45',
        },
        sol: {
          light: '#9945FF',
          green: '#14F195',
          DEFAULT: '#14F195',
          dark: '#0B1E16',
        },
        bridge: {
          bg: '#0F172A',
          card: 'rgba(30, 41, 59, 0.7)',
          border: 'rgba(255, 255, 255, 0.1)',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
      }
    },
  },
  plugins: [],
}
