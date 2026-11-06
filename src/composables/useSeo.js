/**
 * Composable de SEO Clínico y Datos Estructurados (Schema.org JSON-LD)
 * para "Vuelve a Ti · Carla Viladot Psicóloga".
 *
 * Gestiona dinámicamente:
 * - <title>, <meta name="description">, <meta name="keywords">, <meta name="robots">
 * - <link rel="canonical">
 * - Open Graph (og:title, og:description, og:url, og:image, og:type)
 * - Twitter Card (twitter:title, twitter:description, twitter:image)
 * - <script id="dynamic-json-ld" type="application/ld+json">
 */

const SITE_URL = 'https://www.carlaviladotpsicologia.com'
const API_URL = 'https://api.carlaviladotpsicologia.com'
const DEFAULT_IMAGE = `${SITE_URL}/images/carla-viladot.jpg`

function setMetaTag(attrName, attrValue, content) {
  if (typeof document === 'undefined' || !content) return
  let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attrName, attrValue)
    document.head.appendChild(el)
  }
  el.setAttribute('content', String(content))
}

function setCanonicalUrl(url) {
  if (typeof document === 'undefined' || !url) return
  let link = document.head.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', url)
}

function setJsonLdSchema(schemaObj) {
  if (typeof document === 'undefined' || !schemaObj) return
  let script = document.getElementById('dynamic-json-ld')
  if (!script) {
    script = document.createElement('script')
    script.id = 'dynamic-json-ld'
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(schemaObj)
}

export function applySeoMeta({
  title,
  description,
  keywords,
  canonicalPath = '/',
  ogType = 'website',
  imageUrl = DEFAULT_IMAGE,
  robots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  jsonLd = null,
} = {}) {
  try {
    const cleanCanonical = canonicalPath.startsWith('http')
      ? canonicalPath
      : `${SITE_URL}${canonicalPath.startsWith('/') ? '' : '/'}${canonicalPath}`

    if (title && typeof document !== 'undefined') {
      document.title = title
    }

    setMetaTag('name', 'description', description)
    if (keywords) {
      setMetaTag('name', 'keywords', keywords)
    }
    setMetaTag('name', 'robots', robots)
    setCanonicalUrl(cleanCanonical)

    // Open Graph
    setMetaTag('property', 'og:type', ogType)
    setMetaTag('property', 'og:url', cleanCanonical)
    setMetaTag('property', 'og:title', title)
    setMetaTag('property', 'og:description', description)
    setMetaTag('property', 'og:image', imageUrl || DEFAULT_IMAGE)
    setMetaTag('property', 'og:image:secure_url', imageUrl || DEFAULT_IMAGE)
    setMetaTag('property', 'og:image:alt', title)

    // Twitter / X
    setMetaTag('name', 'twitter:title', title)
    setMetaTag('name', 'twitter:description', description)
    setMetaTag('name', 'twitter:image', imageUrl || DEFAULT_IMAGE)

    if (jsonLd) {
      setJsonLdSchema(jsonLd)
    }
  } catch {
    // Nunca interrumpir la navegación si ocurre algún error de DOM
  }
}

export function applyLandingSeo() {
  const title =
    'Vuelve a Ti | Terapia para Superar una Ruptura de Pareja · Carla Viladot Psicóloga'
  const description =
    'Programa clínico de 10 semanas para superar tu ruptura de pareja, frenar la rumiación, sostener el contacto cero y recuperar tu estabilidad emocional. Con Carla Viladot, Psicóloga Sanitaria (Col. 29332).'
  const keywords =
    'terapia ruptura de pareja, psicóloga ruptura amorosa, cómo superar una ruptura de pareja, duelo amoroso, contacto cero psicología, ansiedad tras ruptura, apego ansioso, dependencia emocional, Carla Viladot psicóloga, programa Vuelve a Ti'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Psychologist', 'ProfessionalService', 'MedicalBusiness'],
        '@id': `${SITE_URL}/#organization`,
        name: 'Carla Viladot Psicología · Programa Vuelve a Ti',
        url: `${SITE_URL}/`,
        image: DEFAULT_IMAGE,
        description:
          'Psicóloga Sanitaria (Col. 29332) especialista en terapia de ruptura de pareja, duelo afectivo, regulación del sistema nervioso, apego e IFS.',
        areaServed: {
          '@type': 'Country',
          name: 'España',
        },
        availableLanguage: ['es'],
        sameAs: ['https://www.instagram.com/carlaviladot.psicologa/'],
        founder: {
          '@id': `${SITE_URL}/#person`,
        },
      },
      {
        '@type': 'Person',
        '@id': `${SITE_URL}/#person`,
        name: 'Carla Viladot',
        jobTitle: 'Psicóloga General Sanitaria (Col. 29332)',
        url: `${SITE_URL}/`,
        image: DEFAULT_IMAGE,
        knowsAbout: [
          'Terapia de ruptura de pareja',
          'Duelo amoroso y afectivo',
          'Contacto cero y regulación emocional',
          'Teoría del Apego',
          'Terapia de Sistemas de Familia Interna (IFS)',
          'Regulación somática y ansiedad tras ruptura',
        ],
        sameAs: ['https://www.instagram.com/carlaviladot.psicologa/'],
      },
      {
        '@type': 'Course',
        '@id': `${SITE_URL}/#programa-vuelve-a-ti`,
        name: 'Programa Vuelve a Ti · Terapia y Acompañamiento para Superar tu Ruptura',
        description:
          'Acompañamiento terapéutico intensivo de 10 semanas combinando sesiones individuales 1:1, módulos clínicos en vídeo y cuadernos prácticos basados en neurobiología, apego e IFS.',
        provider: {
          '@id': `${SITE_URL}/#organization`,
        },
        inLanguage: 'es',
        hasCourseInstance: {
          '@type': 'CourseInstance',
          courseMode: 'online',
          duration: 'P10W',
        },
      },
      {
        '@type': 'FAQPage',
        '@id': `${SITE_URL}/#faq`,
        mainEntity: [
          {
            '@type': 'Question',
            name: '¿Cómo funciona el programa terapéutico Vuelve a Ti para superar una ruptura de pareja?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Es un acompañamiento clínico de 10 semanas estructurado en 3 fases (Regulación del sistema nervioso, Comprensión de patrones de apego e IFS, e Integración de autoestima y límites) que combina sesiones individuales con Carla Viladot (Psicóloga Sanitaria Col. 29332), contenido clínico en vídeo 24/7 y cuadernos de trabajo prácticos.',
            },
          },
          {
            '@type': 'Question',
            name: '¿Por qué no consigo mantener el contacto cero ni dejar de pensar en mi ex?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Tras una ruptura de pareja, el cerebro experimenta un síndrome de abstinencia neuroquímico que activa la hipervigilancia y la rumiación nocturna. En el programa trabajamos la regulación somática de tu sistema nervioso y las heridas de apego para frenar el bucle mental sin depender solo de la fuerza de voluntad.',
            },
          },
          {
            '@type': 'Question',
            name: '¿Cómo puedo acceder al programa Vuelve a Ti?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Para garantizar que el programa es adecuado para tu caso y momento vital, el acceso requiere completar un breve cuestionario previo en la web y realizar una sesión de valoración gratuita de 30 minutos por videollamada con Carla Viladot.',
            },
          },
        ],
      },
    ],
  }

  applySeoMeta({
    title,
    description,
    keywords,
    canonicalPath: '/',
    ogType: 'website',
    imageUrl: DEFAULT_IMAGE,
    jsonLd,
  })
}

export function applyResourcesHubSeo(resourcesList = []) {
  const title =
    'Recursos Gratuitos para Superar una Ruptura de Pareja | Carla Viladot Psicóloga'
  const description =
    'Biblioteca de recursos terapéuticos gratuitos, guías de contacto cero, ejercicios para frenar la rumiación nocturna y cuadernos PDF descargables por Carla Viladot Psicóloga.'
  const keywords =
    'recursos gratuitos ruptura de pareja, guía contacto cero pdf, ejercicios superar ruptura, ansiedad tras ruptura, apego ansioso test, Carla Viladot psicóloga'

  const itemListElements = (resourcesList || []).slice(0, 20).map((r, idx) => ({
    '@type': 'ListItem',
    position: idx + 1,
    name: r.title,
    url: `${SITE_URL}/recursos/${r.slug}`,
  }))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}/recursos#collection`,
        name: title,
        description,
        url: `${SITE_URL}/recursos`,
        inLanguage: 'es-ES',
        isPartOf: {
          '@type': 'WebSite',
          name: 'Carla Viladot Psicología · Vuelve a Ti',
          url: `${SITE_URL}/`,
        },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: itemListElements,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Inicio',
            item: `${SITE_URL}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Recursos Gratuitos',
            item: `${SITE_URL}/recursos`,
          },
        ],
      },
    ],
  }

  applySeoMeta({
    title,
    description,
    keywords,
    canonicalPath: '/recursos',
    ogType: 'website',
    imageUrl: DEFAULT_IMAGE,
    jsonLd,
  })
}

export function applyResourceDetailSeo(res) {
  if (!res) return
  const customTitle = (res.meta_title || '').trim()
  const title = customTitle
    ? customTitle
    : `${res.title} · Recurso Gratuito | Carla Viladot Psicóloga`

  const rawDesc =
    (res.meta_description || '').trim() ||
    (res.subtitle || '').trim() ||
    (res.teaser_text || '').replace(/\s+/g, ' ').trim() ||
    'Guía práctica y cuaderno terapéutico gratuito para superar tu ruptura de pareja con Carla Viladot Psicóloga.'

  const description =
    rawDesc.length > 165 ? `${rawDesc.slice(0, 162).trim()}...` : rawDesc

  const keywords =
    (res.seo_keywords || '').trim() ||
    `${res.title}, ${res.category || 'duelo amoroso'}, terapia ruptura de pareja, superar ruptura, contacto cero, Carla Viladot psicóloga`

  const canonicalUrl = `${SITE_URL}/recursos/${res.slug}`
  const imageUrl =
    res.cover_resolved_url ||
    res.cover_image_url ||
    `${API_URL}/api/og/resources/${res.slug}/cover.jpg`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${canonicalUrl}#article`,
        headline: res.title,
        description,
        image: [imageUrl],
        articleSection: res.category || 'Ruptura de Pareja y Regulación Emocional',
        keywords,
        inLanguage: 'es-ES',
        datePublished: res.created_at || new Date().toISOString(),
        dateModified: res.updated_at || res.created_at || new Date().toISOString(),
        isAccessibleForFree: true,
        author: {
          '@type': 'Person',
          name: 'Carla Viladot',
          jobTitle: 'Psicóloga Sanitaria (Col. 29332)',
          url: `${SITE_URL}/`,
        },
        publisher: {
          '@type': 'Organization',
          name: 'Carla Viladot Psicología · Programa Vuelve a Ti',
          url: `${SITE_URL}/`,
          logo: {
            '@type': 'ImageObject',
            url: DEFAULT_IMAGE,
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalUrl,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Inicio',
            item: `${SITE_URL}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Recursos Gratuitos',
            item: `${SITE_URL}/recursos`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: res.title,
            item: canonicalUrl,
          },
        ],
      },
    ],
  }

  applySeoMeta({
    title,
    description,
    keywords,
    canonicalPath: `/recursos/${res.slug}`,
    ogType: 'article',
    imageUrl,
    jsonLd,
  })
}
