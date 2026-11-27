/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['tree-sitter', 'tree-sitter-python', 'tree-sitter-java'],
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
      "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:",
      "img-src 'self' data: https:",
      "worker-src 'self' blob:",
      "connect-src 'self' https://py2java-transpiler.vercel.app https://wandbox.org https://generativelanguage.googleapis.com https://cdn.jsdelivr.net",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
