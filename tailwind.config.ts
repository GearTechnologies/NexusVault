import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gray: {
          950: '#030712',
        },
      },
    },
  },
  plugins: [],
};

export default config;
