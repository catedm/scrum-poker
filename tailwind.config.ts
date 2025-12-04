import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        table: "#0b1622",
        felt: "#0f3b2f",
        gold: "#d4af37",
      },
    },
  },
  plugins: [],
};

export default config;
