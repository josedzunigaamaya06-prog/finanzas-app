/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  safelist: ['md:ml-16', 'md:ml-64', 'md:w-16', 'md:w-64'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        // Sidebar siempre oscuro (no cambia con dark mode)
        sidebar: {
          bg:     '#111318',
          surface:'#191c24',
          hover:  '#1a1d27',
          border: '#1e2133',
          muted:  '#4b5168',
          text:   '#8b93a7',
        },
        // Contenido (light mode)
        surface: {
          50:  '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
        },
        dark: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          700: '#334155',
          800: '#1e293b',
          850: '#172032',
          900: '#0f172a',
          950: '#080e1a',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        'card':   '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-md':'0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
        'card-lg':'0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.05)',
        'glow-green': '0 0 20px rgba(16,185,129,0.25)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'fade-in':    'fadeIn 0.25s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'slide-in':   'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scale-in':   'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' },                                        to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(8px)',  opacity: '0' },         to: { transform: 'translateY(0)',  opacity: '1' } },
        slideIn: { from: { transform: 'translateX(-8px)', opacity: '0' },         to: { transform: 'translateX(0)', opacity: '1' } },
        scaleIn: { from: { transform: 'scale(0.96)',      opacity: '0' },         to: { transform: 'scale(1)',      opacity: '1' } },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
