export default function sitemap() {
  const base = 'https://py2java-transpiler.vercel.app';
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/ast-diff`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];
}
