export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: 'https://py2java-transpiler.vercel.app/sitemap.xml',
  };
}
