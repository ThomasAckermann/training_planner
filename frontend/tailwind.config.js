/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0d0d0d",
        surface: "#1a1a1a",
        surface2: "#222222",
        "border-color": "#333333",
        accent: "#cc1414",
        accent2: "#ffffff",
        "text-primary": "#f0f0f0",
        "text-muted": "#888888",
        danger: "#ff3333",
        success: "#22cc44",
      },
      fontFamily: {
        display: ['"Bebas Neue"', "cursive"],
        ui: ['"DM Sans"', "sans-serif"],
        body: ["Lora", "serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
