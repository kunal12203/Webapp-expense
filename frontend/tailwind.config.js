/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "media", // automatically toggles with system dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: "#60a5fa",
          DEFAULT: "#2563eb",
          dark: "#1e3a8a",
        },
        accent: {
          green: "#10b981",
          red: "#ef4444",
          yellow: "#f59e0b",
          gray: "#6b7280",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 12px rgba(0,0,0,0.08)",
      },
      borderRadius: {
        xl: "1rem",
      },
    },
  },
  plugins: [],
};
