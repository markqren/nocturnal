/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // nocturnal dark palette
        bg: "#09090b",        // zinc-950
        surface: "#18181b",   // zinc-900
        border: "#27272a",    // zinc-800
        muted: "#71717a",     // zinc-500
        text: "#fafafa",      // zinc-50
        accent: "#a78bfa",    // violet-400
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
