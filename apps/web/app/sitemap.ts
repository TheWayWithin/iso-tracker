import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://iso-tracker.app'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/iso-objects`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/guidelines`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Dynamic ISO object pages
  try {
    const supabase = await createClient()
    const { data: isoObjects } = await supabase
      .from('iso_objects')
      .select('id, updated_at')
      .order('updated_at', { ascending: false })

    const isoPages: MetadataRoute.Sitemap = (isoObjects || []).map((iso) => ({
      url: `${baseUrl}/iso-objects/${iso.id}`,
      lastModified: new Date(iso.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    return [...staticPages, ...isoPages]
  } catch (error) {
    // If database fails, return static pages only
    console.error('Sitemap generation error:', error)
    return staticPages
  }
}
