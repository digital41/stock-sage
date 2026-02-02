import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Headers de securite
  async headers() {
    return [
      {
        // Appliquer a toutes les routes
        source: '/:path*',
        headers: [
          {
            // Empecher le clickjacking (iframe)
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            // Empecher le sniffing MIME type
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // Protection XSS (navigateurs anciens)
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            // Controler les informations de referrer
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // Permissions Policy (desactiver fonctionnalites sensibles)
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            // Forcer HTTPS (HSTS) - 1 an
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },

  // Desactiver le header X-Powered-By
  poweredByHeader: false,
};

export default nextConfig;
