
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/', // Vercel يفضل المسار الرئيسي المطلق لضمان عمل الروابط بشكل صحيح
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
  },
  server: {
    historyApiFallback: true // لدعم التوجيه أثناء التطوير المحلي
  }
});
