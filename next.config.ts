import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Habilitar optimización de imágenes en producción
    unoptimized: process.env.NODE_ENV === 'development',
    // Dominios permitidos para imágenes remotas
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // ─── Headers de Seguridad (equivalente a Helmet) ─────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Evita que el sitio sea embebido en iframes (previene clickjacking)
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Evita MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Controla la información de referencia
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Restringe APIs del navegador
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Fuerza HTTPS (solo en producción)
          ...(process.env.NODE_ENV === 'production'
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=63072000; includeSubDomains; preload',
                },
              ]
            : []),
          // Content Security Policy
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      // Headers adicionales para API routes
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },

  // ─── Configuraciones de Seguridad ─────────────────────────
  poweredByHeader: false, // Oculta el header "X-Powered-By: Next.js"
};

export default nextConfig;
