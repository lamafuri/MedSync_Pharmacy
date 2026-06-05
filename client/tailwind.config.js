/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy:    '#0D1B2A',
        primary: '#0D1B2A',
        mint: {
          DEFAULT: '#00A878',
          mid:     '#009B6D',
          light:   '#E6F7F3',
        },
        red: {
          DEFAULT: '#EF4444',
          light:   '#FEF2F2',
        },
        amber: {
          DEFAULT: '#F59E0B',
          light:   '#FEF3C7',
        },
        green: {
          DEFAULT: '#00A878',
          light:   '#E6F7F3',
        },
        bg:      '#F0F2F5',
        card:    '#FFFFFF',
        surface: '#F8F9FA',
        border:  '#E5E7EB',
        muted:   '#6B7280',
        faint:   '#F8F9FA',
      },
      borderRadius: {
        card: '16px',
        btn:  '9999px',
      },
      boxShadow: {
        modal: '0 8px 40px rgba(0,0,0,0.12)',
      },
      fontFamily: {
        display: ['Inter', '"Plus Jakarta Sans"', 'sans-serif'],
        body:    ['Inter', '"Plus Jakarta Sans"', 'sans-serif'],
        alt:     ['"Manrope"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
