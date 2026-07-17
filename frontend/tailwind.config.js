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
        // Los tonos 600-800 de slate se usan como SUPERFICIES en modo oscuro
        // (dark:bg-slate-800, dark:border-slate-700...). Por defecto son azul
        // marino y chocaban con el sidebar neutro. Se neutralizan aquí en un solo
        // punto en vez de tocar ~80 archivos. El resto de la escala slate
        // (50-500, 900) queda intacta: es el texto de siempre.
        slate: {
          600: '#3a3f4d',
          700: '#2b2f3b',
          800: '#1c2029',
        },
        // Paleta oscura NEUTRA, de la misma familia que el sidebar (#111318).
        // Antes era azul marino (#0f172a, #1e293b) y chocaba con el sidebar:
        // se veían dos "negros" distintos pegados. Los escalones están separados
        // a propósito para que las tarjetas resalten sobre el fondo:
        //   fondo #0c0d11  <  sidebar #111318  <  tarjetas #1c2029
        dark: {
          50:  '#f6f7f9',
          100: '#e8eaee',
          200: '#c7cad3',
          700: '#2b2f3b', // bordes y divisores (sólidos y visibles)
          800: '#1c2029', // tarjetas, header, modales
          850: '#13151b', // inputs y superficies hundidas
          900: '#0c0d11', // fondo de la app
          950: '#07080a',
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
        'bounce-in':  'bounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' },                                        to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(8px)',  opacity: '0' },         to: { transform: 'translateY(0)',  opacity: '1' } },
        slideIn: { from: { transform: 'translateX(-8px)', opacity: '0' },         to: { transform: 'translateX(0)', opacity: '1' } },
        scaleIn:   { from: { transform: 'scale(0.96)',     opacity: '0' },         to: { transform: 'scale(1)',      opacity: '1' } },
        bounceIn:  { from: { transform: 'scale(0.92)',     opacity: '0' },         to: { transform: 'scale(1)',      opacity: '1' } },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
