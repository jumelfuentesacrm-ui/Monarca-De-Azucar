import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Head from 'next/head'

export default function App({ Component, pageProps }) {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
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
        <link rel="manifest" href="/manifest.json"/>
        <meta name="mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
        <meta name="apple-mobile-web-app-title" content="Monarca de Azúcar"/>
        <meta name="theme-color" content="#1F140E"/>
        <title>Monarca de Azúcar</title>
      </Head>
      <Component {...pageProps} session={session} />
    </>
  )
}
