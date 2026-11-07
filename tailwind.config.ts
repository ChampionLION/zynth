import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontSize:{xs:"var(--type-label)",sm:"var(--type-small)",base:"var(--type-body)",lg:"var(--type-body)",xl:"var(--type-h2)","2xl":"var(--type-h2)","3xl":"var(--type-h1)","4xl":"var(--type-h1)","5xl":"var(--type-display)","6xl":"var(--type-display)"},
      colors: {
        black:"var(--text)",white:"var(--surface)",
        atlas:{deep:"var(--atlas-deep)",mid:"var(--atlas-mid)",light:"var(--atlas-light)"},
        copper:"var(--primary)",progress:"var(--progress)",paper:"var(--surface)",ink:"var(--text)",
        bg: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        edge: "rgb(var(--color-edge) / <alpha-value>)",
        amber: "rgb(var(--color-amber) / <alpha-value>)",
        purple: "var(--progress)",
        teal: "var(--success)",
        coral: "var(--text-muted)",
        blue: "var(--text-muted)",
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        dim: "rgb(var(--color-dim) / <alpha-value>)",
        gold: "var(--text-muted)",
        fail: "var(--error)",
        bad: "var(--text-muted)",
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
