import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// base './' permite desplegar en GitHub Pages / Netlify / Vercel sin configurar la ruta.
export default defineConfig({ plugins: [react()], base: './' });
