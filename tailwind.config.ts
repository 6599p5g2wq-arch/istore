import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["var(--font-cairo)", "system-ui", "sans-serif"] },
      colors: {
        brand: { 50:"#eef6ff",100:"#d9eaff",200:"#bcdbff",300:"#8ec2ff",400:"#599dff",500:"#3378ff",600:"#1b56f5",700:"#1442e1",800:"#1737b6",900:"#19338f",950:"#142157" },
      },
    },
  },
  plugins: [],
};
export default config;
