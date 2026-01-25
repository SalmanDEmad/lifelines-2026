/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './screens/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1976D2',
        text: '#212121',
        background: '#FFFFFF',
        border: '#BDBDBD',
        success: '#4CAF50',
        rubble: '#EF5350',
        hazard: '#FFA726',
        blocked_road: '#AB47BC',
        error: '#D32F2F',
        offline: '#FF6F00',
        lightGray: '#F5F5F5',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        base: '16px',
        lg: '20px',
        xl: '24px',
        '2xl': '32px',
      },
    },
  },
  plugins: [],
};
