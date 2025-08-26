import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0B5FFF",
          muted: "#E8F0FF"
        }
      }
    },
  },
  plugins: [],
};
export default config;
