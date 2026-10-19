/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#050811',
          900: '#080D1A',
          800: '#0B111E',
          700: '#111A2E',
          600: '#17233D',
        },
        neon: {
          cyan: '#00E5FF',
          yellow: '#FFC700',
          red: '#FF3B3B',
          green: '#00E676',
          orange: '#FF9100',
          blue: '#1E6BFF',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        display: ['Rajdhani', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 20px -3px rgba(0, 229, 255, 0.45)',
        'neon-cyan-lg': '0 0 35px -2px rgba(0, 229, 255, 0.65)',
        'neon-yellow': '0 0 20px -3px rgba(255, 199, 0, 0.45)',
        'neon-green': '0 0 20px -3px rgba(0, 230, 118, 0.45)',
        'neon-red': '0 0 20px -3px rgba(255, 59, 59, 0.55)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glowPulse: {
          '0%': { filter: 'drop-shadow(0 0 8px rgba(0, 229, 255, 0.4))' },
          '100%': { filter: 'drop-shadow(0 0 20px rgba(0, 229, 255, 0.8))' },
        }
      }
    },
  },
  plugins: [],
}
