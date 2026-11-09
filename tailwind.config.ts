import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-poppins)', 'Poppins', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          blue: "#0f3a98",
          "blue-dark": "#0a2666",
          "blue-light": "#e8effc",
          "blue-muted": "#1644ad",
          yellow: "#ffbe00",
          "yellow-dark": "#e0a700",
          "yellow-light": "#fff9e6",
          "yellow-subtle": "#fef3c7"
        }
      },
    },
  },
  plugins: [],
} satisfies Config;
