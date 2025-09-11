import { defineConfig } from 'tailwindcss'

export default defineConfig({
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx,mdx,css}'  
  ],
  theme: {
    extend: {
      fontFamily: {
        icons: ["primeicons", "react-icons"],
      },
    }
  }
})
