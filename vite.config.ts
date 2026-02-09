import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // Load env file based on mode in the current working directory
    const env = loadEnv(mode, process.cwd(), '')
    return {
        base: `/${env.VITE_PROJECT_NAME}/`,
        plugins: [
            react(),
            tailwindcss(),
            VitePWA({
                registerType: 'prompt',
                injectRegister: false,

                pwaAssets: {
                    disabled: false,
                    config: true,
                },

                manifest: {
                    name: 'Virtual File Explorer',
                    short_name: 'FileExplorer',
                    description: 'A virtual file storage explorer',
                    theme_color: '#ffffff',
                    icons: [
                        {
                            src: 'favicon.svg',
                            sizes: 'any',
                            type: 'image/svg+xml',
                            purpose: 'any'
                        }
                    ]
                },

                workbox: {
                    globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
                    cleanupOutdatedCaches: true,
                    clientsClaim: true,
                },

                devOptions: {
                    enabled: false,
                    navigateFallback: 'index.html',
                    suppressWarnings: true,
                    type: 'module',
                },
            })
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        server: {
            allowedHosts: env.VITE_LOCAL_DEPLOYMENT_URLS?.split(',').map((host) => host.trim()) || [],
        },
    }
})