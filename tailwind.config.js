/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        desk: {
          bg: "#0b0e11",
          panel: "#12161c",
          border: "#1e2329",
          muted: "#848e9c",
          green: "#0ecb81",
          red: "#f6465d",
          blue: "#3b82f6",
          yellow: "#f0b90b",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
