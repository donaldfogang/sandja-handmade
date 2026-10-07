import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.135', 'localhost:3000'],
  devIndicators: false, // Masque complètement l'overlay d'erreurs/dev
};

export default nextConfig;