import { useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const ff = '"DM Sans",system-ui,sans-serif'

export default function AuthCallback() {
  useEffect(() => {
    async function handle() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }

      const res = await fetch('/api/auth/ensure-profile', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + session.access_token }
      })
      const data = await res.json()
      window.location.href = data?.role === 'admin' ? '/admin' : '/card'
    }
    handle()
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#FBF7EE', fontFamily: ff, color: '#7A6452', fontSize: '0.82rem' }}>
      Verificando tu cuenta…
    </div>
  )
}
