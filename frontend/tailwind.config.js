/** @type {import('tailwindcss').Config} */
export default {
  
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#A259FF',    // Light purple for primary accents
        secondary: '#8B30FF',  // Darker purple for hover effects
        plum: '#2A1E5C',       // Deep plum for headings
        softPink: '#FF70A6',   // Accent pink
        softGray: '#FDF7F3',   // Light, warm background
        mutedGray: '#A8A6B8',  // Muted text
        darkText: '#333333',   // Primary dark text color
        gold: '#FFD700',       // Golden color for icons or highlights
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        display: ['Montserrat', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 8px rgba(162, 89, 255, 0.3)', // Soft shadow for buttons
      },
      borderRadius: {
        lg: '12px',          // Softer, rounded edges
      },
    },
  },
  plugins: [],
};
