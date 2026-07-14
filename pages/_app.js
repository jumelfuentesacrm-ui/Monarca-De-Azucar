import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Head from 'next/head'

export default function App({ Component, pageProps }) {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    const fallback = new Promise(resolve =>
      setTimeout(() => resolve({ data: { session: null } }), 4000)
    )
    Promise.race([supabase.auth.getSession(), fallback]).then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
    })
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#1F140E',color:'#FBF7EE',fontFamily:'sans-serif',fontSize:'0.8rem',letterSpacing:'0.1em'}}>
      Monarca de Azúcar
    </div>
  )

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico"/>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
        <link rel="manifest" href="/manifest.json"/>
        <meta name="mobile-web-app-capable" content="yes"/>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
        <meta name="apple-mobile-web-app-title" content="Monarca de Azúcar"/>
        <meta name="theme-color" content="#1F140E"/>
        <title>Monarca de Azúcar · Panadería Artesanal en San Juan, PR</title>
        <meta name="description" content="Panadería artesanal en San Juan, Puerto Rico. Pan fresco, pasteles y dulces hechos a mano. Únete a nuestro club de lealtad y gana recompensas con cada visita."/>
        <meta name="keywords" content="panadería, pan artesanal, San Juan, Puerto Rico, pasteles, dulces, monarca de azucar"/>
        <meta name="robots" content="index, follow"/>
        <link rel="canonical" href="https://monarcadeazucar.app"/>
        <meta property="og:type" content="website"/>
        <meta property="og:site_name" content="Monarca de Azúcar"/>
        <meta property="og:title" content="Monarca de Azúcar · Panadería Artesanal en San Juan, PR"/>
        <meta property="og:description" content="Panadería artesanal en San Juan, Puerto Rico. Pan fresco, pasteles y dulces hechos a mano. Club de lealtad digital."/>
        <meta property="og:image" content="https://monarcadeazucar.app/android-chrome-512x512.png"/>
        <meta property="og:image:width" content="512"/>
        <meta property="og:image:height" content="512"/>
        <meta property="og:url" content="https://monarcadeazucar.app"/>
        <meta property="og:locale" content="es_PR"/>
        <meta name="twitter:card" content="summary"/>
        <meta name="twitter:title" content="Monarca de Azúcar · Panadería Artesanal"/>
        <meta name="twitter:description" content="Pan fresco, pasteles y dulces artesanales en San Juan, PR."/>
        <meta name="twitter:image" content="https://monarcadeazucar.app/android-chrome-512x512.png"/>
      </Head>
      <Component {...pageProps} session={session} />
    </>
  )
}
