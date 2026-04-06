import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
    plugins: [
        // basicSsl() // Disabled again to fix ERR_SSL_VERSION_OR_CIPHER_MISMATCH
    ],
    server: {
        port: 5173,
        strictPort: true,
        host: true,
        https: false, // Use HTTP for frontend locally to avoid certificate handshake issues
        proxy: {
            '/api': {
                target: 'https://web-6xnp.onrender.com', // Proxy still uses HTTPS to the backend
                changeOrigin: true,
                secure: false, 
                rewrite: (path) => path 
            },
            '/uploads': {
                target: 'https://web-6xnp.onrender.com',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path
            }
        }
    }
})
