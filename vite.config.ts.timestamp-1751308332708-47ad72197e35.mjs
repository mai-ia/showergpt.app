// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [
    react()
    // VitePWA disabled for StackBlitz compatibility
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    //     runtimeCaching: [
    //       {
    //         urlPattern: /^https:\/\/images\.pexels\.com\/.*/i,
    //         handler: 'CacheFirst',
    //         options: {
    //           cacheName: 'pexels-images',
    //           expiration: {
    //             maxEntries: 100,
    //             maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
    //           }
    //         }
    //       },
    //       {
    //         urlPattern: /^https:\/\/api\.openai\.com\/.*/i,
    //         handler: 'NetworkFirst',
    //         options: {
    //           cacheName: 'openai-api',
    //           expiration: {
    //             maxEntries: 50,
    //             maxAgeSeconds: 60 * 5 // 5 minutes
    //           }
    //         }
    //       }
    //     ]
    //   }
    // })
  ],
  optimizeDeps: {
    exclude: ["lucide-react"]
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: ["lucide-react"],
          auth: ["@supabase/supabase-js"],
          realtime: ["@tanstack/react-virtual", "react-window"],
          utils: ["web-vitals", "html2canvas"]
        }
      }
    },
    chunkSizeWarningLimit: 1e3,
    sourcemap: false,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  server: {
    hmr: {
      overlay: false
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICAvLyBWaXRlUFdBIGRpc2FibGVkIGZvciBTdGFja0JsaXR6IGNvbXBhdGliaWxpdHlcbiAgICAvLyBWaXRlUFdBKHtcbiAgICAvLyAgIHJlZ2lzdGVyVHlwZTogJ2F1dG9VcGRhdGUnLFxuICAgIC8vICAgd29ya2JveDoge1xuICAgIC8vICAgICBnbG9iUGF0dGVybnM6IFsnKiovKi57anMsY3NzLGh0bWwsaWNvLHBuZyxzdmd9J10sXG4gICAgLy8gICAgIHJ1bnRpbWVDYWNoaW5nOiBbXG4gICAgLy8gICAgICAge1xuICAgIC8vICAgICAgICAgdXJsUGF0dGVybjogL15odHRwczpcXC9cXC9pbWFnZXNcXC5wZXhlbHNcXC5jb21cXC8uKi9pLFxuICAgIC8vICAgICAgICAgaGFuZGxlcjogJ0NhY2hlRmlyc3QnLFxuICAgIC8vICAgICAgICAgb3B0aW9uczoge1xuICAgIC8vICAgICAgICAgICBjYWNoZU5hbWU6ICdwZXhlbHMtaW1hZ2VzJyxcbiAgICAvLyAgICAgICAgICAgZXhwaXJhdGlvbjoge1xuICAgIC8vICAgICAgICAgICAgIG1heEVudHJpZXM6IDEwMCxcbiAgICAvLyAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQgKiAzMCAvLyAzMCBkYXlzXG4gICAgLy8gICAgICAgICAgIH1cbiAgICAvLyAgICAgICAgIH1cbiAgICAvLyAgICAgICB9LFxuICAgIC8vICAgICAgIHtcbiAgICAvLyAgICAgICAgIHVybFBhdHRlcm46IC9eaHR0cHM6XFwvXFwvYXBpXFwub3BlbmFpXFwuY29tXFwvLiovaSxcbiAgICAvLyAgICAgICAgIGhhbmRsZXI6ICdOZXR3b3JrRmlyc3QnLFxuICAgIC8vICAgICAgICAgb3B0aW9uczoge1xuICAgIC8vICAgICAgICAgICBjYWNoZU5hbWU6ICdvcGVuYWktYXBpJyxcbiAgICAvLyAgICAgICAgICAgZXhwaXJhdGlvbjoge1xuICAgIC8vICAgICAgICAgICAgIG1heEVudHJpZXM6IDUwLFxuICAgIC8vICAgICAgICAgICAgIG1heEFnZVNlY29uZHM6IDYwICogNSAvLyA1IG1pbnV0ZXNcbiAgICAvLyAgICAgICAgICAgfVxuICAgIC8vICAgICAgICAgfVxuICAgIC8vICAgICAgIH1cbiAgICAvLyAgICAgXVxuICAgIC8vICAgfVxuICAgIC8vIH0pXG4gIF0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGV4Y2x1ZGU6IFsnbHVjaWRlLXJlYWN0J10sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgIHZlbmRvcjogWydyZWFjdCcsICdyZWFjdC1kb20nXSxcbiAgICAgICAgICB1aTogWydsdWNpZGUtcmVhY3QnXSxcbiAgICAgICAgICBhdXRoOiBbJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcyddLFxuICAgICAgICAgIHJlYWx0aW1lOiBbJ0B0YW5zdGFjay9yZWFjdC12aXJ0dWFsJywgJ3JlYWN0LXdpbmRvdyddLFxuICAgICAgICAgIHV0aWxzOiBbJ3dlYi12aXRhbHMnLCAnaHRtbDJjYW52YXMnXVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsXG4gICAgc291cmNlbWFwOiBmYWxzZSxcbiAgICBtaW5pZnk6ICd0ZXJzZXInLFxuICAgIHRlcnNlck9wdGlvbnM6IHtcbiAgICAgIGNvbXByZXNzOiB7XG4gICAgICAgIGRyb3BfY29uc29sZTogdHJ1ZSxcbiAgICAgICAgZHJvcF9kZWJ1Z2dlcjogdHJ1ZVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgaG1yOiB7XG4gICAgICBvdmVybGF5OiBmYWxzZVxuICAgIH1cbiAgfVxufSk7Il0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUFvQjtBQUN0UCxPQUFPLFdBQVc7QUFHbEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFnQ1I7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyxjQUFjO0FBQUEsRUFDMUI7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQSxVQUNaLFFBQVEsQ0FBQyxTQUFTLFdBQVc7QUFBQSxVQUM3QixJQUFJLENBQUMsY0FBYztBQUFBLFVBQ25CLE1BQU0sQ0FBQyx1QkFBdUI7QUFBQSxVQUM5QixVQUFVLENBQUMsMkJBQTJCLGNBQWM7QUFBQSxVQUNwRCxPQUFPLENBQUMsY0FBYyxhQUFhO0FBQUEsUUFDckM7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsdUJBQXVCO0FBQUEsSUFDdkIsV0FBVztBQUFBLElBQ1gsUUFBUTtBQUFBLElBQ1IsZUFBZTtBQUFBLE1BQ2IsVUFBVTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsZUFBZTtBQUFBLE1BQ2pCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLEtBQUs7QUFBQSxNQUNILFNBQVM7QUFBQSxJQUNYO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
