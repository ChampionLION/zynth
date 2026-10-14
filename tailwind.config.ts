import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0D0D14",
        surface: "#13131F",
        edge: "#2A2A3A",
        amber: "#C87D2F",
        purple: "#534AB7",
        teal: "#1D9E75",
        coral: "#C85A3A",
        blue: "#3A7BC8",
        primary: "#E8E6F0",
        muted: "#8888A0",
        dim: "#4A4A60",
        gold: "#FFD700",
        fail: "#C83A3A",
        bad: "#C86A2F",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 1.5s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-16px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
