import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/crm/', '/api/', '/login', '/register'],
      },
    ],
    sitemap: 'https://dainganxanh.com.vn/sitemap.xml',
  }
}
