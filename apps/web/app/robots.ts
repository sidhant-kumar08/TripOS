import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://tripos.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/trips/', '/profile'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
