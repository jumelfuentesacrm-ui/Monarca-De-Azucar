import { Html, Head, Main, NextScript } from 'next/document'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Bakery',
  name: 'Monarca de Azúcar',
  description: 'Panadería artesanal en San Juan, Puerto Rico. Pan fresco, pasteles y dulces hechos a mano.',
  url: 'https://monarcadeazucar.app',
  logo: 'https://monarcadeazucar.app/android-chrome-512x512.png',
  image: 'https://monarcadeazucar.app/android-chrome-512x512.png',
  telephone: null,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'San Juan',
    addressRegion: 'PR',
    addressCountry: 'US',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 18.4655,
    longitude: -66.1057,
  },
  servesCuisine: ['Pan artesanal', 'Pasteles', 'Dulces'],
  priceRange: '$$',
  sameAs: ['https://www.instagram.com/monarcadeazucar'],
  hasMap: 'https://maps.google.com/?q=Monarca+de+Azucar+San+Juan+PR',
}

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
