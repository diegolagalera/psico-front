/**
 * /sitemap.xml: lo genera el backend (incluye cada recurso publicado).
 * Se sirve desde el dominio principal, como espera Google.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const base = (config.apiBaseServer || 'http://localhost:5001/api').replace(/\/+$/, '')
  try {
    const xml = await $fetch(`${base}/seo/sitemap.xml`, { responseType: 'text' })
    setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
    setHeader(event, 'Cache-Control', 'public, max-age=3600')
    return xml
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Sitemap no disponible' })
  }
})
