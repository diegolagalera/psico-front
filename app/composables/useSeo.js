/**
 * Composable de SEO Clínico y Datos Estructurados (Schema.org JSON-LD)
 * para "Vuelve a Ti · Carla Viladot Psicóloga".
 *
 * Gestiona dinámicamente:
 * - <title>, <meta name="description">, <meta name="keywords">, <meta name="robots">
 * - <link rel="canonical">
 * - Open Graph (og:title, og:description, og:url, og:image, og:type)
 * - Twitter Card (twitter:title, twitter:description, twitter:image)
 * - JSON-LD (datos estructurados)
 * Todo se escribe con useHead, así sale en el HTML del servidor.
 */

const SITE_URL = 'https://www.carlaviladotpsicologia.com'
const API_URL = 'https://api.carlaviladotpsicologia.com'
const DEFAULT_IMAGE = `${SITE_URL}/images/carla-viladot.jpg`

const DEFAULT_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'

function absoluteUrl(path = '/') {
  if (path.startsWith('http')) return path
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

/**
 * Convierte una configuración SEO en el objeto que entiende useHead (Nuxt/unhead).
 * Al usarse en el servidor, todo esto sale ya escrito en el HTML que reciben
 * Google, Bing y los buscadores con IA.
 */
export function buildSeoHead({
  title,
  description,
  keywords,
  canonicalPath = '/',
  ogType = 'website',
  imageUrl = DEFAULT_IMAGE,
  robots = DEFAULT_ROBOTS,
  jsonLd = null,
} = {}) {
  const canonical = absoluteUrl(canonicalPath)
  const image = imageUrl || DEFAULT_IMAGE
  const meta = [
    description && { key: 'description', name: 'description', content: description },
    keywords && { key: 'keywords', name: 'keywords', content: keywords },
    { key: 'robots', name: 'robots', content: robots },
    { key: 'og:type', property: 'og:type', content: ogType },
    { key: 'og:url', property: 'og:url', content: canonical },
    title && { key: 'og:title', property: 'og:title', content: title },
    description && { key: 'og:description', property: 'og:description', content: description },
    { key: 'og:image', property: 'og:image', content: image },
    { key: 'og:image:secure_url', property: 'og:image:secure_url', content: image },
    title && { key: 'og:image:alt', property: 'og:image:alt', content: title },
    title && { key: 'twitter:title', name: 'twitter:title', content: title },
    description && { key: 'twitter:description', name: 'twitter:description', content: description },
    { key: 'twitter:image', name: 'twitter:image', content: image },
  ].filter(Boolean)

  const head = {
    meta,
    link: [{ key: 'canonical', rel: 'canonical', href: canonical }],
    script: [],
  }
  if (title) head.title = title
  if (jsonLd) {
    head.script.push({
      key: 'json-ld',
      type: 'application/ld+json',
      // Escapar "<" evita que un título con "</script>" rompa la página (XSS)
      innerHTML: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
    })
  }
  return head
}

/**
 * Aplica el SEO de una página. Acepta un objeto o una función (reactiva), por
 * ejemplo para un recurso que llega de la API. Debe llamarse en el setup.
 */
export function usePageSeo(source) {
  const read = typeof source === 'function' ? source : () => source
  useHead(() => {
    const opts = read()
    return opts ? buildSeoHead(opts) : {}
  })
}

/** Páginas privadas: título y fuera de los buscadores */
export function privatePageSeo(title) {
  return { title: title || 'Área Privada · Vuelve a Ti', robots: 'noindex, nofollow' }
}

/** Páginas legales */
export function legalPageSeo(title, path) {
  return { title, canonicalPath: path, robots: 'index, follow' }
}

export function landingSeo() {
  const title =
    'Vuelve a Ti · Terapia Ruptura de Pareja | Carla Viladot'
  const description =
    'Programa clínico de 10 semanas para superar tu ruptura de pareja, calmar la ansiedad y sostener el contacto cero. Carla Viladot, Psicóloga (Col. 29332).'
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

  return {
    title,
    description,
    keywords,
    canonicalPath: '/',
    ogType: 'website',
    imageUrl: DEFAULT_IMAGE,
    jsonLd,
  }
}

export function resourcesHubSeo(resourcesList = []) {
  const title =
    'Recursos Gratuitos para Superar tu Ruptura | Carla Viladot'
  const description =
    'Guías clínicas gratuitas, ejercicios de contacto cero, regulación de ansiedad y cuadernos PDF para superar tu ruptura con Carla Viladot Psicóloga.'
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

  return {
    title,
    description,
    keywords,
    canonicalPath: '/recursos',
    ogType: 'website',
    imageUrl: DEFAULT_IMAGE,
    jsonLd,
  }
}

export function resourceDetailSeo(res) {
  if (!res) return null
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

  return {
    title,
    description,
    keywords,
    canonicalPath: `/recursos/${res.slug}`,
    ogType: 'article',
    imageUrl,
    jsonLd,
  }
}

/**
 * SEO de la página /terapia-online: servicios con precio, FAQ y migas de pan.
 * Las reseñas NO se marcan con estrellas (Google no las muestra para el propio
 * negocio y puede considerarlo spam).
 */
export function therapySeo() {
  const pageUrl = `${SITE_URL}/terapia-online`
  const imageUrl = `${SITE_URL}/images/terapia/carla-viladot-psicologa-terapia-online.webp`
  const title = 'Psicóloga online · Terapia individual y de pareja | Carla Viladot'
  const description =
    'Terapia psicológica online en castellano y catalán: relaciones, dependencia emocional, apego, autoestima y terapia de pareja. Respuesta en menos de 24 horas.'
  const keywords =
    'psicóloga online, terapia online, terapia de pareja online, dependencia emocional, terapia apego, autoestima, ansiedad, terapia EMDR, psicòloga online català, Carla Viladot'

  const faqs = [
    [
      '¿Es efectiva la terapia online?',
      'Sí. La terapia online es tan eficaz como la presencial: lo único que cambia es el canal. Además, te da más flexibilidad y comodidad, algo que facilita implicarte en el proceso y mantener la constancia.',
    ],
    [
      '¿Cuánto duran las sesiones? ¿Puedo cambiar o cancelar mi cita?',
      'Las sesiones duran entre 50 y 55 minutos. Puedes cambiar tu cita de día u hora siempre que me avises con al menos 24 horas de antelación.',
    ],
    [
      '¿Dónde se hacen las sesiones?',
      'Las sesiones son 100% online: no hago terapia presencial. Nos vemos por Google Meet, sin necesidad de descargar nada, y 24 horas antes de la sesión te envío por WhatsApp el enlace para entrar.',
    ],
  ]

  const service = (id, name, desc, price) => ({
    '@type': 'Service',
    '@id': `${pageUrl}#${id}`,
    name,
    description: desc,
    serviceType: 'Psicoterapia online',
    provider: { '@id': `${SITE_URL}/#organization` },
    areaServed: { '@type': 'Country', name: 'España' },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: pageUrl,
      availableLanguage: ['es', 'ca'],
    },
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: 'EUR',
      url: `${pageUrl}#reservar`,
      description: 'Sesión online de 50–55 minutos',
    },
  })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Psychologist', 'ProfessionalService', 'MedicalBusiness'],
        '@id': `${SITE_URL}/#organization`,
        name: 'Carla Viladot · Psicóloga online',
        url: `${SITE_URL}/`,
        image: imageUrl,
        description:
          'Psicóloga General Sanitaria (Col. 29332). Terapia online individual y de pareja: relaciones, dependencia emocional, apego, autoestima, ansiedad y trauma (EMDR, IFS).',
        areaServed: { '@type': 'Country', name: 'España' },
        availableLanguage: ['es', 'ca'],
        priceRange: '60 € – 70 €',
        sameAs: ['https://www.instagram.com/carlaviladot.psicologa/'],
        founder: { '@id': `${SITE_URL}/#person` },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Terapia online',
          itemListElement: [
            { '@id': `${pageUrl}#terapia-individual` },
            { '@id': `${pageUrl}#terapia-pareja` },
          ],
        },
      },
      {
        '@type': 'Person',
        '@id': `${SITE_URL}/#person`,
        name: 'Carla Viladot',
        jobTitle: 'Psicóloga General Sanitaria (Col. 29332)',
        url: pageUrl,
        image: imageUrl,
        knowsLanguage: ['es', 'ca'],
        knowsAbout: [
          'Terapia de pareja',
          'Dependencia emocional',
          'Teoría del apego',
          'Autoestima y límites',
          'Ansiedad y regulación emocional',
          'Trauma y EMDR',
          'Terapia de Sistemas de Familia Interna (IFS)',
        ],
        sameAs: ['https://www.instagram.com/carlaviladot.psicologa/'],
      },
      service(
        'terapia-individual',
        'Terapia individual online',
        'Para entender lo que se repite en tus relaciones, recuperar tu autoestima y aprender a calmarte desde dentro.',
        '60'
      ),
      service(
        'terapia-pareja',
        'Terapia de pareja online',
        'Para parejas que se quieren pero se están alejando, discuten siempre por lo mismo o sienten que ya no se entienden.',
        '70'
      ),
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: title,
        description,
        inLanguage: 'es',
        about: { '@id': `${SITE_URL}/#organization` },
        primaryImageOfPage: imageUrl,
      },
      {
        '@type': 'FAQPage',
        '@id': `${pageUrl}#faq`,
        mainEntity: faqs.map(([q, a]) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Terapia online', item: pageUrl },
        ],
      },
    ],
  }

  return {
    title,
    description,
    keywords,
    canonicalPath: '/terapia-online',
    imageUrl,
    jsonLd,
  }
}
