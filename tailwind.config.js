/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17211d',
        mist: '#eef4f1',
        pine: '#1f5f4a',
        teal: '#197b83',
        amber: '#b97823',
        rose: '#b8405c'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif']
      },
      boxShadow: {
        panel: '0 1px 2px rgb(23 33 29 / 0.08), 0 16px 42px rgb(23 33 29 / 0.08)'
      }
    }
  },
  plugins: []
};
