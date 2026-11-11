/** @format */

import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
    base: './',
    server: {
        host: true,
    },
    build: {
        rollupOptions: {
            input: {
                integrated: resolve(__dirname, 'index.html'),
                cover: resolve(__dirname, 'cover.html'),
                directory: resolve(__dirname, 'page2.html'),
                profile: resolve(__dirname, 'page3.html'),
                imageArchive: resolve(__dirname, 'page4.html'),
                photoArchive: resolve(__dirname, 'page5.html'),
                contact: resolve(__dirname, 'page6.html'),
            },
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules/three')) return 'vendor-three';
                    if (id.includes('node_modules')) return 'vendor';
                },
            },
        },
    },
});
