import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  {
    ignores: [".data/**", "playwright-report/**", "test-results/**", "coverage/**"],
  },
];

export default config;
