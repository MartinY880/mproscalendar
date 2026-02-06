/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // MortgagePros Brand Colors
        primary: {
          DEFAULT: '#06427F',
          50: '#E8F0F8',
          100: '#C5D9ED',
          200: '#9FC1E1',
          300: '#79A9D5',
          400: '#5391C9',
          500: '#2D79BD',
          600: '#1E619B',
          700: '#06427F',
          800: '#053566',
          900: '#04284D'
        },
        gray: {
          DEFAULT: '#7B7E77',
          50: '#F5F5F4',
          100: '#EBEBEA',
          200: '#D6D7D4',
          300: '#C2C3BF',
          400: '#ADAFA9',
          500: '#999B94',
          600: '#7B7E77',
          700: '#5D5F5A',
          800: '#3F403D',
          900: '#212120'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)'
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem'
      }
    },
  },
  plugins: [],
}
