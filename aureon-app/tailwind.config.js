/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#2563EB', // Primary Brand
          600: '#1D4ED8', // Primary Hover
          700: '#1E40AF', // Primary Active
        },
        sidebar: {
          bg: '#020617', // Sidebar Background
        },
        main: {
          bg: '#0F172A', // Main Background
        },
        secondary: {
          bg: '#111827', // Secondary Background
        },
        surface: {
          card: '#1F2937', // Surface Card
          hover: '#273549', // Hover Surface
        },
        border: {
          dark: '#334155', // Border
        },
        txt: {
          primary: '#F8FAFC',   // Primary Text
          secondary: '#CBD5E1', // Secondary Text
          muted: '#94A3B8',     // Muted Text
          disabled: '#64748B',  // Disabled Text
        },
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#38BDF8',
        }
      },
      borderRadius: {
        'card': '16px',
        'button': '12px',
        'input': '12px',
        'dialog': '18px',
        'table': '12px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'enterprise': '0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow': '0 0 20px -3px rgba(37, 99, 235, 0.35)',
      }
    },
  },
  plugins: [],
}
