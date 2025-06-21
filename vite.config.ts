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
    // CSP対応: evalを使用しないソースマップ生成
    sourcemap: false,
    minify: 'terser',
    // チャンクサイズの最適化 + キャッシュ無効化
    rollupOptions: {
      output: {
        // キャッシュ無効化のため新しいハッシュを含める
        entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        chunkFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        assetFileNames: `assets/[name]-[hash]-${Date.now()}.[ext]`,
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
    chunkSizeWarningLimit: 300,
    // Terser設定でevalを避ける
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      },
      mangle: true
    }
  },
  // プリロード戦略
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js']
  }
})