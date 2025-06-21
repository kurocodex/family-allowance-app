import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '127.0.0.1',
    open: false,
    strictPort: false
  },
  build: {
    // チャンクサイズの最適化
    rollupOptions: {
      output: {
        manualChunks: {
          // ベンダーライブラリを分離
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js', '@supabase/auth-ui-react'],
          icons: ['lucide-react'],
          routing: ['react-router-dom'],
          forms: ['react-hook-form']
        }
      }
    },
    // より小さなチャンクサイズ警告閾値
    chunkSizeWarningLimit: 300
  },
  // プリロード戦略
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js']
  }
})