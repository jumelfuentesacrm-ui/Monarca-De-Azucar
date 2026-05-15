import { useState } from 'react'
import { supabase } from '../lib/supabase'

const gold='#E35A1B',black='#1F140E',white='#FBF7EE',gray='#7A6452',gl='rgba(31,20,14,0.10)'
const ff='DM Sans,sans-serif'
const ffS='Instrument Serif,serif'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [tab, setTab] = useState('client')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ email:'', password:'', full_name:'', business_name:'', phone:'', confirm_password:'' })
  const upd = (k,v) => setForm(f=>({...f,[k]:v}))

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (error) { setError('Credenciales incorrectas.'); setLoading(false); return }
    const roleRes = await fetch('/api/admin/check-role', { headers: { Authorization: 'Bearer ' + data.session.access_token } })
    const roleData = await roleRes.json()
    window.location.href = roleData?.role === 'admin' ? '/admin' : '/card'
  }

  async function handleSignup(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (form.password !== form.confirm_password) { setError('Las contrasenas no coinciden.'); return }
    if (form.password.length < 6) { setError('Minimo 6 caracteres.'); return }
    setLoading(true)
    const res = await fetch('/api/auth/signup', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Error al crear cuenta.'); return }
    setSuccess('Cuenta creada. Inicia sesion.')
    setMode('login')
  }

  const inp = { width:'100%', padding:'0.8rem 1rem', border:'1px solid '+gl, borderRadius:3, background:white, fontFamily:ff, fontSize:'0.88rem', outline:'none', color:black, marginBottom:'1rem', boxSizing:'border-box' }
  const lbl = { fontSize:'0.56rem', letterSpacing:'0.13em', textTransform:'uppercase', color:gray, display:'block', marginBottom:'0.35rem' }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400&display=swap" rel="stylesheet"/>
      <style>{`
        @media(max-width:700px){
          .login-grid{grid-template-columns:1fr!important;}
          .login-left{display:none!important;}
        }
      `}</style>
      <div className="login-grid" style={{ minHeight:'100vh', display:'grid', gridTemplateColumns:'1fr 1fr', fontFamily:ff }}>
        <div className="login-left" style={{ background:black, display:'flex', flexDirection:'column', justifyContent:'center', padding:'5rem', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontFamily:ffS, fontSize:'18rem', fontWeight:400, color:'rgba(227,90,27,0.04)', lineHeight:1, pointerEvents:'none' }}>A+</div>
          <div style={{ fontFamily:ffS, fontSize:'2.5rem', fontWeight:400, color:white, marginBottom:'0.4rem' }}>A<span style={{color:gold,fontStyle:'italic'}}>+</span> CRM</div>
          <div style={{ fontSize:'0.6rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', marginBottom:'3rem' }}>Panadería Artesanal · San Juan, PR</div>
          {[['Tarjeta de Lealtad Digital','5 pagos a tiempo = 1 mes gratis.'],['Datos en Tiempo Real','Sellos e historial actualizados al instante.'],['Acceso Seguro','Tu cuenta, tus datos.']].map(([title,sub])=>(
            <div key={title} style={{ display:'flex', alignItems:'flex-start', gap:'1rem', marginBottom:'1.25rem' }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(227,90,27,0.12)', border:'1px solid rgba(227,90,27,0.25)', flexShrink:0 }}></div>
              <div><span style={{ display:'block', fontSize:'0.82rem', color:white, marginBottom:'0.1rem' }}>{title}</span><span style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.38)', lineHeight:1.6 }}>{sub}</span></div>
            </div>
          ))}
        </div>
        <div style={{ background:white, display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem', minHeight:'100vh' }}>
          <div style={{ width:'100%', maxWidth:420 }}>
            <div style={{ fontFamily:ffS, fontSize:'1.8rem', fontWeight:400, color:black, marginBottom:'0.3rem', textAlign:'center' }}>A<span style={{color:gold,fontStyle:'italic'}}>+</span> CRM</div>
            <h2 style={{ fontFamily:ffS, fontSize:'1.6rem', fontWeight:400, marginBottom:'0.3rem', textAlign:'center' }}>{mode==='login'?'Iniciar Sesion':'Crear Cuenta'}</h2>
            <p style={{ fontSize:'0.72rem', color:gray, marginBottom:'2rem', lineHeight:1.7, textAlign:'center' }}>{mode==='login'?'Accede a tu portal Monarca de Azúcar.':'Tu representante activara tu tarjeta una vez te registres.'}</p>
            {mode==='login' && (
              <div style={{ display:'flex', border:'1px solid '+gl, borderRadius:4, overflow:'hidden', marginBottom:'1.75rem' }}>
                {[['client','Cliente / Negocio'],['admin','Administrador']].map(([t,label])=>(
                  <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:'0.6rem', fontSize:'0.62rem', letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer', border:'none', fontFamily:ff, background:tab===t?black:white, color:tab===t?white:gray }}>{label}</button>
                ))}
              </div>
            )}
            {error && <div style={{ color:'#c0392b', fontSize:'0.72rem', marginBottom:'0.85rem', padding:'0.6rem 0.85rem', background:'rgba(192,57,43,0.06)', borderRadius:3 }}>{error}</div>}
            {success && <div style={{ color:'#2d8a60', fontSize:'0.72rem', marginBottom:'0.85rem', padding:'0.6rem 0.85rem', background:'rgba(45,138,96,0.06)', borderRadius:3 }}>{success}</div>}
            <form onSubmit={mode==='login'?handleLogin:handleSignup}>
              {mode==='signup' && <>
                <label style={lbl}>Nombre Completo</label>
                <input style={inp} type="text" placeholder="Tu nombre" value={form.full_name} onChange={e=>upd('full_name',e.target.value)} required/>
                <label style={lbl}>Nombre del Negocio</label>
                <input style={inp} type="text" placeholder="Nombre de tu negocio" value={form.business_name} onChange={e=>upd('business_name',e.target.value)}/>
                <label style={lbl}>Telefono</label>
                <input style={inp} type="tel" placeholder="787-000-0000" value={form.phone} onChange={e=>upd('phone',e.target.value)}/>
              </>}
              <label style={lbl}>Correo Electronico</label>
              <input style={inp} type="email" placeholder="correo@negocio.com" value={form.email} onChange={e=>upd('email',e.target.value)} required/>
              <label style={lbl}>Contrasena</label>
              <input style={inp} type="password" placeholder="••••••••" value={form.password} onChange={e=>upd('password',e.target.value)} required/>
              {mode==='signup' && <>
                <label style={lbl}>Confirmar Contrasena</label>
                <input style={inp} type="password" placeholder="••••••••" value={form.confirm_password} onChange={e=>upd('confirm_password',e.target.value)} required/>
              </>}
              <button type="submit" disabled={loading} style={{ width:'100%', background:black, color:white, border:'none', padding:'0.95rem', cursor:'pointer', fontFamily:ff, fontSize:'0.68rem', letterSpacing:'0.16em', textTransform:'uppercase', borderRadius:3, opacity:loading?0.6:1 }}>
                {loading?'Procesando...':(mode==='login'?'Entrar':'Crear Cuenta')}
              </button>
            </form>
            <div style={{ fontSize:'0.68rem', color:gray, marginTop:'1.25rem', textAlign:'center' }}>
              {mode==='login'
                ? <span>No tienes cuenta? <span style={{ color:gold, cursor:'pointer', textDecoration:'underline' }} onClick={()=>{setMode('signup');setError('');setSuccess('')}}>Crear cuenta</span></span>
                : <span>Ya tienes cuenta? <span style={{ color:gold, cursor:'pointer', textDecoration:'underline' }} onClick={()=>{setMode('login');setError('');setSuccess('')}}>Iniciar sesion</span></span>
              }
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
