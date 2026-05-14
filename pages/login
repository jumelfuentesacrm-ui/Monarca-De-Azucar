import { useState } from 'react'
import { supabase } from '../lib/supabase'

const or='#E35A1B',orD='#B8420B',ink='#1F140E',cr='#FBF7EE',cr2='#F4EDDD',cr3='#EDE3CE',mu='#7A6452',ln='rgba(31,20,14,0.10)'
const ff='"DM Sans",sans-serif'
const ffS='"Instrument Serif",serif'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ email:'', password:'', full_name:'', phone:'', confirm_password:'' })
  const upd = (k,v) => setForm(f=>({...f,[k]:v}))

  async function handleLogin(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (error) { setError('Correo o contraseña incorrectos.'); setLoading(false); return }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    window.location.href = profile?.role === 'admin' ? '/admin' : '/card'
  }

  async function handleSignup(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (form.password !== form.confirm_password) { setError('Las contraseñas no coinciden.'); return }
    if (form.password.length < 6) { setError('Mínimo 6 caracteres.'); return }
    setLoading(true)
    const res = await fetch('/api/auth/signup', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Error al crear cuenta.'); return }
    setSuccess('¡Cuenta creada! Inicia sesión.')
    setMode('login')
  }

  const inp = {
    width:'100%', padding:'0.85rem 1rem',
    border:'1px solid '+ln, borderRadius:6,
    background:'#fff', fontFamily:ff, fontSize:'0.9rem',
    outline:'none', color:ink, marginBottom:'1rem', boxSizing:'border-box',
  }
  const lbl = { fontSize:'0.58rem', letterSpacing:'0.14em', textTransform:'uppercase', color:mu, display:'block', marginBottom:'0.35rem' }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:${cr};font-family:${ff}}
        @media(max-width:700px){
          .lg{grid-template-columns:1fr!important}
          .lg-left{display:none!important}
        }
      `}</style>
      <div className="lg" style={{minHeight:'100vh',display:'grid',gridTemplateColumns:'1fr 1fr',fontFamily:ff}}>

        {/* LEFT — brand panel */}
        <div className="lg-left" style={{background:ink,display:'flex',flexDirection:'column',justifyContent:'center',padding:'5rem',position:'relative',overflow:'hidden'}}>
          {/* big BG butterfly */}
          <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',opacity:0.04,pointerEvents:'none'}}>
            <svg width="420" height="344" viewBox="0 0 100 82">
              <path d="M50 41 C42 14,20 6,8 16 C-2 28,6 50,24 56 C36 60,46 54,50 41Z" fill={or}/>
              <path d="M50 41 C58 14,80 6,92 16 C102 28,94 50,76 56 C64 60,54 54,50 41Z" fill={or}/>
              <path d="M50 41 C44 56,30 68,22 70 C16 70,18 60,28 54 C36 50,46 50,50 41Z" fill={or}/>
              <path d="M50 41 C56 56,70 68,78 70 C84 70,82 60,72 54 C64 50,54 50,50 41Z" fill={or}/>
              <ellipse cx="50" cy="46" rx="2.2" ry="22" fill={or}/>
              <circle cx="50" cy="24" r="2.8" fill={or}/>
            </svg>
          </div>

          {/* Logo */}
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:'0.6rem'}}>
            <svg width="32" height="26" viewBox="0 0 100 82">
              <path d="M50 41 C42 14,20 6,8 16 C-2 28,6 50,24 56 C36 60,46 54,50 41Z" fill={or}/>
              <path d="M50 41 C58 14,80 6,92 16 C102 28,94 50,76 56 C64 60,54 54,50 41Z" fill={or}/>
              <path d="M50 41 C44 56,30 68,22 70 C16 70,18 60,28 54 C36 50,46 50,50 41Z" fill={or} opacity=".9"/>
              <path d="M50 41 C56 56,70 68,78 70 C84 70,82 60,72 54 C64 50,54 50,50 41Z" fill={or} opacity=".9"/>
              <ellipse cx="50" cy="46" rx="2.2" ry="22" fill={cr}/>
              <circle cx="50" cy="24" r="2.8" fill={cr}/>
            </svg>
            <div style={{fontFamily:ffS,fontSize:'1.5rem',color:cr}}>Monarca <em style={{color:or,fontStyle:'italic'}}>de</em> Azúcar</div>
          </div>
          <div style={{fontSize:'0.58rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'rgba(251,247,238,0.3)',marginBottom:'3.5rem'}}>Panadería Artesanal · San Juan, PR</div>

          {[
            ['Tarjeta de Lealtad Digital','5 visitas = 1 dulce gratis. Sin app pesada.'],
            ['Sellos en Tiempo Real','Tu historial actualizado al instante.'],
            ['Acceso Seguro','Tu cuenta, tus datos.'],
          ].map(([title,sub])=>(
            <div key={title} style={{display:'flex',alignItems:'flex-start',gap:'1rem',marginBottom:'1.4rem'}}>
              <div style={{width:28,height:28,borderRadius:'50%',background:'rgba(227,90,27,0.12)',border:'1px solid rgba(227,90,27,0.25)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="12" height="10" viewBox="0 0 100 82"><path d="M50 41 C42 14,20 6,8 16 C-2 28,6 50,24 56 C36 60,46 54,50 41Z" fill={or}/><path d="M50 41 C58 14,80 6,92 16 C102 28,94 50,76 56 C64 60,54 54,50 41Z" fill={or}/></svg>
              </div>
              <div>
                <span style={{display:'block',fontSize:'0.85rem',color:cr,marginBottom:'0.1rem'}}>{title}</span>
                <span style={{fontSize:'0.72rem',color:'rgba(251,247,238,0.38)',lineHeight:1.6}}>{sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT — form */}
        <div style={{background:cr,display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem',minHeight:'100vh'}}>
          <div style={{width:'100%',maxWidth:420}}>

            {/* mobile logo */}
            <div style={{textAlign:'center',marginBottom:'2rem'}}>
              <svg width="36" height="30" viewBox="0 0 100 82" style={{display:'inline-block',marginBottom:8}}>
                <path d="M50 41 C42 14,20 6,8 16 C-2 28,6 50,24 56 C36 60,46 54,50 41Z" fill={or}/>
                <path d="M50 41 C58 14,80 6,92 16 C102 28,94 50,76 56 C64 60,54 54,50 41Z" fill={or}/>
                <path d="M50 41 C44 56,30 68,22 70 C16 70,18 60,28 54 C36 50,46 50,50 41Z" fill={or} opacity=".9"/>
                <path d="M50 41 C56 56,70 68,78 70 C84 70,82 60,72 54 C64 50,54 50,50 41Z" fill={or} opacity=".9"/>
                <ellipse cx="50" cy="46" rx="2.2" ry="22" fill={ink}/>
                <circle cx="50" cy="24" r="2.8" fill={ink}/>
              </svg>
              <div style={{fontFamily:ffS,fontSize:'1.5rem',color:ink}}>Monarca <em style={{color:or,fontStyle:'italic'}}>de</em> Azúcar</div>
              <div style={{fontSize:'0.6rem',letterSpacing:'0.14em',textTransform:'uppercase',color:mu,marginTop:4}}>Club de Lealtad</div>
            </div>

            <h2 style={{fontFamily:ffS,fontSize:'1.7rem',fontWeight:400,marginBottom:'0.3rem',textAlign:'center',color:ink}}>
              {mode==='login' ? 'Bienvenido de vuelta' : 'Crear cuenta'}
            </h2>
            <p style={{fontSize:'0.75rem',color:mu,marginBottom:'2rem',lineHeight:1.7,textAlign:'center'}}>
              {mode==='login' ? 'Accede a tu tarjeta de lealtad.' : 'Regístrate y te activamos tu tarjeta.'}
            </p>

            {error && <div style={{color:'#a33b22',fontSize:'0.75rem',marginBottom:'0.85rem',padding:'0.65rem 0.9rem',background:'rgba(163,59,34,0.07)',borderRadius:6,border:'1px solid rgba(163,59,34,0.15)'}}>{error}</div>}
            {success && <div style={{color:'#3F7A4C',fontSize:'0.75rem',marginBottom:'0.85rem',padding:'0.65rem 0.9rem',background:'rgba(63,122,76,0.07)',borderRadius:6,border:'1px solid rgba(63,122,76,0.2)'}}>{success}</div>}

            <form onSubmit={mode==='login' ? handleLogin : handleSignup}>
              {mode==='signup' && <>
                <label style={lbl}>Nombre Completo</label>
                <input style={inp} type="text" placeholder="Tu nombre" value={form.full_name} onChange={e=>upd('full_name',e.target.value)} required/>
                <label style={lbl}>Teléfono</label>
                <input style={inp} type="tel" placeholder="939-000-0000" value={form.phone} onChange={e=>upd('phone',e.target.value)}/>
              </>}
              <label style={lbl}>Correo Electrónico</label>
              <input style={inp} type="email" placeholder="tu@correo.com" value={form.email} onChange={e=>upd('email',e.target.value)} required/>
              <label style={lbl}>Contraseña</label>
              <input style={inp} type="password" placeholder="••••••••" value={form.password} onChange={e=>upd('password',e.target.value)} required/>
              {mode==='signup' && <>
                <label style={lbl}>Confirmar Contraseña</label>
                <input style={inp} type="password" placeholder="••••••••" value={form.confirm_password} onChange={e=>upd('confirm_password',e.target.value)} required/>
              </>}
              <button type="submit" disabled={loading} style={{width:'100%',background:or,color:'#fff',border:'none',padding:'1rem',cursor:'pointer',fontFamily:ff,fontSize:'0.75rem',letterSpacing:'0.12em',textTransform:'uppercase',fontWeight:600,borderRadius:999,opacity:loading?0.6:1,marginTop:'0.25rem'}}>
                {loading ? 'Un momento...' : (mode==='login' ? 'Entrar →' : 'Crear cuenta')}
              </button>
            </form>

            <div style={{fontSize:'0.72rem',color:mu,marginTop:'1.25rem',textAlign:'center'}}>
              {mode==='login'
                ? <span>¿No tienes cuenta? <span style={{color:or,cursor:'pointer',fontWeight:600}} onClick={()=>{setMode('signup');setError('');setSuccess('')}}>Regístrate</span></span>
                : <span>¿Ya tienes cuenta? <span style={{color:or,cursor:'pointer',fontWeight:600}} onClick={()=>{setMode('login');setError('');setSuccess('')}}>Inicia sesión</span></span>
              }
            </div>

            <div style={{marginTop:'2.5rem',paddingTop:'1.5rem',borderTop:'1px solid '+ln,textAlign:'center',fontSize:'0.65rem',color:'rgba(31,20,14,0.3)',letterSpacing:'0.1em'}}>
              © 2026 Monarca de Azúcar · @monarcadeazucar
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
