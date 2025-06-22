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
    // ブラウザ互換性の向上
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
    // チャンクサイズの最適化
    rollupOptions: {
      output: {
        // キャッシュバスティングのための動的ファイル名生成
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name!.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash].${ext}`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        },
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
        drop_debugger: true,
        // IE11対応のためのES5互換設定
        ecma: 2020,
        unsafe_arrows: false,
        unsafe_methods: false
      },
      mangle: {
        safari10: true
      },
      format: {
        safari10: true,
        webkit: true
      }
    },
    // レガシーブラウザ対応
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    // ポリフィル自動注入
    polyfillModulePreload: true
  },
  // プリロード戦略とブラウザ互換性
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js'],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  // アセット処理の最適化
  assetsInclude: ['**/*.woff', '**/*.woff2'],
  // 開発時のHMR設定
  esbuild: {
    target: 'es2020',
    // プロダクションビルドでのデバッグ情報削除
    drop: ['console', 'debugger']
  }
})