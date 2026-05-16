import { useState } from 'react'
import { supabase } from '../lib/supabase'

const or='#E35A1B', ink='#1F140E', cr='#FBF7EE', cr2='#F4EDDD', mu='#7A6452'
const ff='"DM Sans",system-ui,sans-serif'
const ffS='"Instrument Serif",serif'

const BFLY_DARK = "M134.0,37.0L179.0,38.0L225.0,44.0L288.0,56.0L351.0,73.0L413.0,95.0L472.0,121.0L521.0,147.0L562.0,172.0L600.0,198.0L657.0,243.0L686.0,269.0L746.0,330.0L837.0,437.0L870.0,483.0L895.0,526.0L899.0,504.0L911.0,486.0L911.0,481.0L905.0,428.0L893.0,377.0L872.0,328.0L853.0,300.0L827.0,275.0L804.0,265.0L800.0,261.0L799.0,255.0L806.0,248.0L811.0,248.0L818.0,252.0L858.0,290.0L874.0,312.0L891.0,344.0L909.0,399.0L921.0,479.0L929.0,476.0L947.0,478.0L951.0,436.0L960.0,391.0L976.0,344.0L993.0,312.0L1009.0,290.0L"
const BFLY_ORANGE = "M392.0,121.0L418.0,121.0L437.0,129.0L476.0,166.0L489.0,185.0L472.0,177.0L446.0,160.0L391.0,133.0L385.0,127.0L385.0,123.0L391.0,122.0ZM1449.0,121.0L1475.0,121.0L1482.0,123.0L1482.0,127.0L1476.0,133.0L1421.0,160.0L1395.0,177.0L1378.0,185.0L1384.0,174.0L1414.0,143.0L1430.0,129.0L1448.0,122.0ZM334.0,130.0L348.0,131.0L367.0,137.0L415.0,161.0L427.0,170.0L429.0,177.0L421.0,180.0L329.0,159.0L302.0,151.0L286.0,143.0L287.0,140.0L301.0,135.0L333.0,131.0ZM1531.0,130.0L1566.0,135.0L1580.0,140.0L1581.0,143.0L"

function Butterfly({ size=48 }) {
  return (
    <svg width={size} height={Math.round(size*0.65)} viewBox="0 0 1867 1217" style={{display:'block'}}>
      <path d="M134,37L179,38L225,44L288,56L351,73L413,95L472,121L521,147L562,172L600,198L657,243L686,269L746,330L837,437L870,483L895,526L899,504L911,486L911,481L905,428L893,377L872,328L853,300L827,275L804,265L800,261L799,255L806,248L811,248L818,252L858,290L874,312L891,344L909,399L921,479L929,476L947,478L951,436L960,391L976,344L993,312L1009,290L1049,252L1056,248L1061,248L1068,255L1068,259L1063,265L1040,275L1014,300L995,328L974,377L962,428L956,481L956,486L968,504L972,526L997,483L1030,437L1074,383L1138,312L1181,269L1238,220L1287,184L1346,147L1410,114L1475,87L1544,65L1607,50L1678,39L1733,37L1776,44L1806,58L1818,70L1828,91L1830,100L1828,130L1812,164L1771,212L1756,238L1753,252L1754,320L1752,329L1745,347L1728,374L1720,393L1716,415L1716,443L1713,455L1708,463L1691,476L1676,493L1673,504L1672,529L1667,545L1657,557L1635,573L1631,579L1620,611L1609,626L1590,641L1567,651L1536,658L1447,662L1494,687L1535,717L1560,743L1574,768L1574,780L1563,817L1563,835L1566,849L1575,871L1576,882L1569,902L1550,927L1542,945L1541,993L1539,1005L1533,1017L1516,1031L1491,1044L1477,1057L1472,1068L1467,1091L1460,1100L1451,1105L1417,1115L1406,1125L1397,1140L1380,1153L1365,1157L1317,1162L1295,1176L1283,1180L1267,1180L1247,1176L1195,1179L1178,1175L1161,1167L1139,1152L1093,1109L1067,1076L1044,1039L1025,1000L1007,950L972,800L970,876L959,947L950,974L943,986L937,991L930,991L924,986L913,964L903,924L896,863L895,800L864,936L855,966L838,1009L812,1058L785,1096L748,1135L715,1160L695,1170L677,1175L629,1175L600,1180L584,1180L572,1176L550,1162L509,1158L487,1153L470,1140L461,1125L450,1115L416,1105L407,1100L400,1091L395,1068L390,1057L376,1044L342,1025L329,1008L326,994L325,945L317,927L298,902L291,882L292,871L300,852L304,835L304,817L293,780L293,768L307,743L332,717L373,687L420,662L365,661L325,657L297,650L268,635L258,626L247,611L236,579L232,573L210,557L200,545L195,529L194,504L190,491L183,482L163,467L154,455L151,443L151,415L147,393L139,374L122,347L113,320L114,252L111,238L96,212L66,179L53,161L42,139L37,120L37,100L41,85L49,70L61,58L91,44L114,39L133,38Z" fill="${ink}" fillRule="evenodd"/>
      <path d="M392,121L418,121L437,129L476,166L489,185L472,177L446,160L391,133L385,127L385,123L391,122ZM1449,121L1475,121L1482,123L1482,127L1476,133L1421,160L1395,177L1378,185L1384,174L1414,143L1430,129L1448,122ZM868,662L864,680L849,718L818,777L758,858L708,940L679,1004L661,1072L647,1082L632,1085L622,1084L615,1075L607,1051L604,1024L605,1008L616,966L624,946L663,875L689,835L727,790L772,748L831,704L868,663ZM999,662L1036,704L1095,748L1141,791L1178,835L1204,875L1243,946L1251,966L1262,1008L1263,1024L1260,1051L1252,1075L1245,1084L1235,1085L1220,1082L1206,1072L1188,1004L1159,940L1109,858L1049,777L1018,718L1003,680L999,663Z" fill="${or}" fillRule="evenodd"/>
    </svg>
  )
}

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
    const roleRes = await fetch('/api/admin/check-role', { headers: { Authorization: 'Bearer ' + data.session.access_token } })
    const roleData = await roleRes.json()
    window.location.href = roleData?.role === 'admin' ? '/admin' : '/card'
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
    border:'1px solid rgba(31,20,14,0.12)', borderRadius:8,
    background:'white', fontFamily:ff, fontSize:'0.9rem',
    outline:'none', color:ink, marginBottom:'1rem', boxSizing:'border-box',
  }
  const lbl = { fontSize:'0.56rem', letterSpacing:'0.14em', textTransform:'uppercase', color:mu, display:'block', marginBottom:'0.35rem' }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:${cr};font-family:${ff};min-height:100vh}
        @media(min-width:700px){
          .login-grid{display:grid;grid-template-columns:1fr 1fr;min-height:100vh}
          .login-left{display:flex!important}
          .login-right{min-height:100vh}
        }
        @media(max-width:699px){
          .login-left{display:none!important}
          .login-right{min-height:100vh;padding:2rem 1.5rem}
        }
      `}</style>

      <div className="login-grid">

        {/* LEFT — brand panel */}
        <div className="login-left" style={{background:ink,display:'none',flexDirection:'column',justifyContent:'space-between',padding:'3rem',position:'relative',overflow:'hidden'}}>
          {/* BG butterfly watermark */}
          <div style={{position:'absolute',bottom:-40,right:-40,opacity:0.04,pointerEvents:'none',transform:'scale(1.5)'}}>
            <Butterfly size={400}/>
          </div>

          {/* Logo */}
          <div>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:'0.5rem'}}>
              <Butterfly size={32}/>
              <div style={{fontFamily:ffS,fontSize:'1.4rem',color:cr}}>Monarca <em style={{color:or,fontStyle:'italic'}}>de</em> Azúcar</div>
            </div>
            <div style={{fontSize:'0.56rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'rgba(251,247,238,0.3)'}}>Panadería Artesanal · San Juan, PR</div>
          </div>

          {/* Benefits */}
          <div>
            {[
              ['Tarjeta Digital','Cinco visitas, una en la casa. Sin app pesada.'],
              ['Sellos en Tiempo Real','Tu historial actualizado al instante.'],
              ['Ordena en Línea','Pide para recoger directo desde tu tarjeta.'],
            ].map(([title,sub])=>(
              <div key={title} style={{display:'flex',alignItems:'flex-start',gap:'1rem',marginBottom:'1.75rem'}}>
                <div style={{width:28,height:28,borderRadius:'50%',background:'rgba(227,90,27,0.15)',border:'1px solid rgba(227,90,27,0.3)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Butterfly size={14}/>
                </div>
                <div>
                  <span style={{display:'block',fontSize:'0.88rem',color:cr,marginBottom:'0.15rem',fontWeight:500}}>{title}</span>
                  <span style={{fontSize:'0.72rem',color:'rgba(251,247,238,0.38)',lineHeight:1.6}}>{sub}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{fontSize:'0.6rem',color:'rgba(251,247,238,0.2)',letterSpacing:'0.1em'}}>© 2026 Monarca de Azúcar</div>
        </div>

        {/* RIGHT — form */}
        <div className="login-right" style={{background:cr,display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem'}}>
          <div style={{width:'100%',maxWidth:400}}>

            {/* Mobile logo */}
            <div style={{textAlign:'center',marginBottom:'2rem'}}>
              <div style={{display:'flex',justifyContent:'center',marginBottom:10}}>
                <Butterfly size={52}/>
              </div>
              <div style={{fontFamily:ffS,fontSize:'1.6rem',color:ink}}>Monarca <em style={{color:or,fontStyle:'italic'}}>de</em> Azúcar</div>
              <div style={{fontSize:'0.58rem',letterSpacing:'0.18em',textTransform:'uppercase',color:mu,marginTop:4}}>Club de Lealtad</div>
            </div>

            <h2 style={{fontFamily:ffS,fontSize:'1.8rem',fontWeight:400,marginBottom:'0.3rem',textAlign:'center',color:ink}}>
              {mode==='login' ? 'Bienvenido de vuelta' : 'Crear cuenta'}
            </h2>
            <p style={{fontSize:'0.75rem',color:mu,marginBottom:'2rem',lineHeight:1.7,textAlign:'center'}}>
              {mode==='login' ? 'Accede a tu tarjeta de lealtad.' : 'Regístrate y te activamos tu tarjeta.'}
            </p>

            {error && <div style={{color:'#a33b22',fontSize:'0.75rem',marginBottom:'0.85rem',padding:'0.65rem 0.9rem',background:'rgba(163,59,34,0.07)',borderRadius:8,border:'1px solid rgba(163,59,34,0.15)'}}>{error}</div>}
            {success && <div style={{color:'#3F7A4C',fontSize:'0.75rem',marginBottom:'0.85rem',padding:'0.65rem 0.9rem',background:'rgba(63,122,76,0.07)',borderRadius:8,border:'1px solid rgba(63,122,76,0.2)'}}>{success}</div>}

            <form onSubmit={mode==='login' ? handleLogin : handleSignup}>
              {mode==='signup' && <>
                <label style={lbl}>Nombre completo</label>
                <input style={inp} type="text" placeholder="Tu nombre" value={form.full_name} onChange={e=>upd('full_name',e.target.value)} required/>
                <label style={lbl}>Teléfono</label>
                <input style={inp} type="tel" placeholder="939-000-0000" value={form.phone} onChange={e=>upd('phone',e.target.value)}/>
              </>}
              <label style={lbl}>Correo electrónico</label>
              <input style={inp} type="email" placeholder="tu@correo.com" value={form.email} onChange={e=>upd('email',e.target.value)} required/>
              <label style={lbl}>Contraseña</label>
              <input style={inp} type="password" placeholder="••••••••" value={form.password} onChange={e=>upd('password',e.target.value)} required/>
              {mode==='signup' && <>
                <label style={lbl}>Confirmar contraseña</label>
                <input style={{...inp,marginBottom:'1.5rem'}} type="password" placeholder="••••••••" value={form.confirm_password} onChange={e=>upd('confirm_password',e.target.value)} required/>
              </>}
              <button type="submit" disabled={loading} style={{width:'100%',background:or,color:cr,border:'none',padding:'1rem',cursor:'pointer',fontFamily:ff,fontSize:'0.78rem',letterSpacing:'0.1em',textTransform:'uppercase',fontWeight:600,borderRadius:999,opacity:loading?0.6:1,marginTop:mode==='login'?'0.5rem':0}}>
                {loading ? 'Un momento...' : (mode==='login' ? 'Entrar →' : 'Crear cuenta')}
              </button>
            </form>

            <div style={{fontSize:'0.72rem',color:mu,marginTop:'1.5rem',textAlign:'center'}}>
              {mode==='login'
                ? <span>¿No tienes cuenta? <span style={{color:or,cursor:'pointer',fontWeight:600}} onClick={()=>{setMode('signup');setError('');setSuccess('')}}>Regístrate</span></span>
                : <span>¿Ya tienes cuenta? <span style={{color:or,cursor:'pointer',fontWeight:600}} onClick={()=>{setMode('login');setError('');setSuccess('')}}>Inicia sesión</span></span>
              }
            </div>

            <div style={{marginTop:'2.5rem',paddingTop:'1.5rem',borderTop:'1px solid rgba(31,20,14,0.08)',textAlign:'center',fontSize:'0.62rem',color:'rgba(31,20,14,0.3)',letterSpacing:'0.1em'}}>
              © 2026 Monarca de Azúcar · @monarcadeazucar
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
