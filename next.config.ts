import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  
  // Configuration pour les uploads de fichiers
  experimental: {
    // Augmenter la taille max du body pour les uploads (100MB)
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  
  // Headers pour permettre les gros fichiers
  async headers() {
    return [
      {
        source: '/api/media/upload',
        headers: [
          {
            key: 'x-middleware-cache',
            value: 'no-cache',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
