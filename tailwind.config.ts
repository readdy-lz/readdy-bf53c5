/** @type {import('tailwindcss').Config} */
const scaleSteps = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];

const makeScale = (name: string): Record<string, string> => {
  const result: Record<string, string> = {};
  scaleSteps.forEach((step) => {
    result[step] = `oklch(var(--${name}-${step}) / <alpha-value>)`;
  });
  return result;
};

export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          background: makeScale("background"),
          foreground: makeScale("foreground"),
          primary: makeScale("primary"),
          accent: makeScale("accent"),
          secondary: makeScale("secondary"),
        },
        fontFamily: {
          sans: ["var(--font-body)"],
          body: ["var(--font-body)"],
          heading: ["var(--font-heading)"],
          label: ["var(--font-label)"],
        },
      },
    },
    plugins: [],
  }