import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: { extend: { fontFamily: { sans: ['Inter', 'Geist', 'Arial', 'sans-serif'] } } },
  plugins: [],
};

export default config;
