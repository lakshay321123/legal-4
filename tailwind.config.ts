import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9ebff",
          500: "#2563eb",
          600: "#1d4ed8"
        }
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1rem"
      },
      boxShadow: {
        soft: "0 6px 20px rgba(0,0,0,0.06)"
      }
    }
  },
  plugins: [require("@tailwindcss/typography")]
};

export default config;
