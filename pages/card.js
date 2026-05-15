import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const or='#E35A1B', ink='#1F140E', cr='#FBF7EE', cr2='#F4EDDD', cr3='#EDE3CE', mu='#7A6452'
const ff='"DM Sans",system-ui,sans-serif'
const ffS='"Instrument Serif",serif'

// Mariposa SVG animada
function Mariposa({ size=28, animate=false, color=or, stroke=ink }) {
  return (
    <svg width={size} height={size*0.82} viewBox="0 0 100 82" style={{display:'block',transition:'transform 0.2s'}}>
      <style>{`
        @keyframes aletear {
          0%,100% { transform: scaleX(1); }
          25% { transform: scaleX(0.6); }
          75% { transform: scaleX(0.6); }
        }
        .ala-izq { transform-origin: 50px 41px; animation: ${animate?'aletear 0.6s ease-in-out infinite':'none'}; }
        .ala-der { transform-origin: 50px 41px; animation: ${animate?'aletear 0.6s ease-in-out infinite 0.15s':'none'}; }
      `}</style>
      <g className="ala-izq">
        <path d="M50 41 C42 14,20 6,8 16 C-2 28,6 50,24 56 C36 60,46 54,50 41Z" fill={color} stroke={stroke} strokeWidth="1.2"/>
        <path d="M50 41 C44 56,30 68,22 70 C16 70,18 60,28 54 C36 50,46 50,50 41Z" fill={color} stroke={stroke} strokeWidth="1.2" opacity=".9"/>
      </g>
      <g className="ala-der">
        <path d="M50 41 C58 14,80 6,92 16 C102 28,94 50,76 56 C64 60,54 54,50 41Z" fill={color} stroke={stroke} strokeWidth="1.2"/>
        <path d="M50 41 C56 56,70 68,78 70 C84 70,82 60,72 54 C64 50,54 50,50 41Z" fill={color} stroke={stroke} strokeWidth="1.2" opacity=".9"/>
      </g>
      <ellipse cx="50" cy="46" rx="2.2" ry="22" fill={stroke}/>
      <circle cx="50" cy="24" r="2.8" fill={stroke}/>
    </svg>
  )
}

// Loading screen con mariposa aleteando
function LoadingScreen() {
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:cr,gap:16}}>
      <Mariposa size={52} animate={true} color={or} stroke={ink}/>
      <div style={{fontFamily:ffS,fontSize:'1.1rem',color:mu,fontStyle:'italic'}}>Cargando tu tarjeta…</div>
    </div>
  )
}

// Wing stamp visualization — 5 piezas de la mariposa
function WingStamps({ filled=0 }) {
  // 5 partes de la mariposa como piezas
  const parts = [
    { id:0, label:'Ala sup. izq.', path:"M50 41 C42 14,20 6,8 16 C-2 28,6 50,24 56 C36 60,46 54,50 41Z" },
    { id:1, label:'Ala sup. der.', path:"M50 41 C58 14,80 6,92 16 C102 28,94 50,76 56 C64 60,54 54,50 41Z" },
    { id:2, label:'Ala inf. izq.', path:"M50 41 C44 56,30 68,22 70 C16 70,18 60,28 54 C36 50,46 50,50 41Z" },
    { id:3, label:'Ala inf. der.', path:"M50 41 C56 56,70 68,78 70 C84 70,82 60,72 54 C64 50,54 50,50 41Z" },
    { id:4, label:'Cuerpo', isBody: true },
  ]
  
  return (
    <div style={{position:'relative',width:180,height:148,margin:'0 auto'}}>
      <svg viewBox="0 0 100 82" width="180" height="148">
        {parts.filter(p=>!p.isBody).map((p,i) => (
          <path key={i} d={p.path}
            fill={i < filled ? or : 'rgba(31,20,14,0.08)'}
            stroke={i < filled ? or : 'rgba(31,20,14,0.15)'}
            strokeWidth="1.2"
            style={{transition:'fill 0.4s ease, stroke 0.4s ease'}}
          />
        ))}
        {/* Cuerpo — 5ta pieza */}
        <ellipse cx="50" cy="46" rx="2.2" ry="22"
          fill={filled >= 5 ? ink : 'rgba(31,20,14,0.2)'}
          style={{transition:'fill 0.4s ease'}}
        />
        <circle cx="50" cy="24" r="2.8"
          fill={filled >= 5 ? ink : 'rgba(31,20,14,0.2)'}
          style={{transition:'fill 0.4s ease'}}
        />
      </svg>
    </div>
  )
}

export default function Card({ session }) {
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('tarjeta')
  const [logoAnim, setLogoAnim] = useState(false)

  useEffect(() => {
    if (session === undefined) return
    if (!session) { window.location.href = '/login'; return }
    fetch('/api/card/me', { headers: { Authorization: 'Bearer ' + session.access_token } })
      .then(r => r.json())
      .then(data => { setCard(data.card); setLoading(false) })
      .catch(() => setLoading(false))
  }, [session])

  if (session === undefined || loading) return <LoadingScreen/>

  const cur = card ? (card.stamps % 5 === 0 && card.stamps > 0 ? 5 : card.stamps % 5) : 0
  const hasReward = card && card.stamps > 0 && card.stamps % 5 === 0
  const rem = cur === 0 ? 5 : 5 - cur
  const cycle = card ? (Math.ceil((card.stamps || 1) / 5) || 1) : 1

  function handleSignOut() {
    supabase.auth.signOut().then(() => window.location.href = '/login')
  }

  const navItems = [
    { id:'menu', label:'Menú', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="15" y2="18"/>
      </svg>
    )},
    { id:'ordenar', label:'Ordenar', isMain: true, icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.63A2 2 0 014 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 17v-.08z"/>
      </svg>
    )},
    { id:'tarjeta', label:'Club', icon: (active) => <Mariposa size={22} color={active ? or : mu} stroke={active ? or : mu} animate={active}/> },
  ]

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:${cr};font-family:${ff};overscroll-behavior:none;}
        html,body{height:100%}
        @keyframes aletear {
          0%,100%{transform:scaleX(1)}
          25%,75%{transform:scaleX(0.55)}
        }
        @keyframes fadeUp {
          from{opacity:0;transform:translateY(16px)}
          to{opacity:1;transform:none}
        }
        @keyframes pulse-or {
          0%,100%{box-shadow:0 4px 18px rgba(227,90,27,0.4)}
          50%{box-shadow:0 8px 32px rgba(227,90,27,0.65)}
        }
        .fade-up{animation:fadeUp 0.5s ease both}
        .nav-btn{-webkit-tap-highlight-color:transparent;transition:color 0.15s}
        .nav-btn:active{transform:scale(0.92)}
        .logo-wing{transform-origin:center;transition:transform 0.15s}
        .card-stamp{transition:all 0.4s ease}
      `}</style>

      <div style={{minHeight:'100vh',background:cr,paddingBottom:76,fontFamily:ff}}>

        {/* TOP NAV */}
        <nav style={{position:'sticky',top:0,zIndex:100,background:'rgba(251,247,238,0.94)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(31,20,14,0.06)',padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div 
            style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}
            onMouseEnter={()=>setLogoAnim(true)}
            onMouseLeave={()=>setLogoAnim(false)}
            onClick={()=>{setLogoAnim(true);setTimeout(()=>setLogoAnim(false),600)}}
          >
            <Mariposa size={26} animate={logoAnim} color={or} stroke={ink}/>
            <span style={{fontFamily:ffS,fontSize:'1.05rem',color:ink}}>
              Monarca <em style={{color:or,fontStyle:'italic'}}>de</em> Azúcar
            </span>
          </div>
          <button onClick={handleSignOut} style={{background:'none',border:'none',cursor:'pointer',fontSize:'0.65rem',color:mu,letterSpacing:'0.12em',textTransform:'uppercase',fontFamily:ff}}>
            Salir
          </button>
        </nav>

        {/* CONTENT */}
        <div style={{maxWidth:440,margin:'0 auto',padding:'0 20px'}}>

          {/* TAB: TARJETA / CLUB */}
          {tab === 'tarjeta' && (
            <div className="fade-up">
              {/* Header */}
              <div style={{textAlign:'center',padding:'28px 0 20px'}}>
                <div style={{fontSize:'0.58rem',letterSpacing:'0.2em',textTransform:'uppercase',color:or,marginBottom:8}}>Club Monarca · Tarjeta de Lealtad</div>
                <h2 style={{fontFamily:ffS,fontWeight:400,fontSize:'clamp(1.4rem,6vw,2rem)',color:ink,fontStyle:'italic',marginBottom:4}}>
                  {card ? `Hola, ${card.profiles?.full_name?.split(' ')[0] || 'Amigo'}.` : 'Bienvenido'}
                </h2>
                <div style={{fontSize:'0.65rem',color:mu}}>Miembro #{card?.card_number || '—'}</div>
              </div>

              {!card ? (
                /* No card yet */
                <div style={{background:cr2,borderRadius:20,padding:'2rem',textAlign:'center',border:'1px solid '+cr3,marginBottom:20}}>
                  <Mariposa size={48} animate={false} color="rgba(31,20,14,0.15)" stroke="rgba(31,20,14,0.15)"/>
                  <div style={{fontFamily:ffS,fontSize:'1.2rem',color:ink,margin:'16px 0 8px',fontStyle:'italic'}}>Tu tarjeta está siendo activada</div>
                  <p style={{fontSize:'0.78rem',color:mu,lineHeight:1.6}}>Un momento — pídele al equipo de Monarca que active tu tarjeta en tu próxima visita.</p>
                  <a href="tel:+19393499006" style={{display:'inline-block',marginTop:16,padding:'10px 24px',background:or,color:cr,borderRadius:999,fontSize:'0.72rem',fontWeight:600,textDecoration:'none',letterSpacing:'0.06em'}}>
                    📞 +1 (939) 349-9006
                  </a>
                </div>
              ) : (
                <>
                  {/* BUTTERFLY STAMPS */}
                  <div style={{background:cr2,borderRadius:20,padding:'24px 20px',border:'1px solid '+cr3,marginBottom:16,position:'relative',overflow:'hidden'}}>
                    {/* BG watermark */}
                    <div style={{position:'absolute',right:-20,top:-20,opacity:0.05,pointerEvents:'none'}}>
                      <Mariposa size={160} color={or} stroke={or}/>
                    </div>
                    
                    <div style={{textAlign:'center',marginBottom:8}}>
                      <div style={{fontSize:'0.55rem',letterSpacing:'0.18em',textTransform:'uppercase',color:mu,marginBottom:4}}>Completa una Monarca y elige una recompensa</div>
                    </div>

                    <WingStamps filled={cur}/>

                    <div style={{textAlign:'center',marginTop:12}}>
                      <div style={{fontFamily:ffS,fontSize:'2rem',fontWeight:400,color:ink,lineHeight:1}}>{cur}<span style={{fontSize:'1rem',color:mu}}> / 5</span></div>
                      <div style={{fontSize:'0.7rem',color:mu,marginTop:4,fontStyle:'italic'}}>
                        {hasReward ? '¡Tu Monarca está completa!' : 
                         cur === 0 ? 'Te falta la primera pieza' :
                         `${rem} pieza${rem!==1?'s':''} más y volás`}
                        {card.profiles?.full_name ? `, ${card.profiles.full_name.split(' ')[0]}.` : '.'}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{height:3,background:'rgba(31,20,14,0.08)',borderRadius:3,margin:'16px 0 0'}}>
                      <div style={{height:'100%',width:(cur/5*100)+'%',background:or,borderRadius:3,transition:'width 0.6s ease'}}/>
                    </div>
                  </div>

                  {/* REWARD AVAILABLE */}
                  {hasReward && (
                    <div style={{background:ink,borderRadius:16,padding:'20px',marginBottom:16,textAlign:'center'}}>
                      <div style={{fontSize:'0.55rem',letterSpacing:'0.18em',textTransform:'uppercase',color:'rgba(251,247,238,0.4)',marginBottom:8}}>Elige tu recompensa</div>
                      <div style={{fontFamily:ffS,fontSize:'1.3rem',color:cr,fontStyle:'italic',marginBottom:4}}>¡Tu Monarca está completa!</div>
                      <p style={{fontSize:'0.72rem',color:'rgba(251,247,238,0.6)',marginBottom:16}}>Canjea en el mostrador en tu próxima visita.</p>
                      {[
                        ['🍪','Galleta gratis','Cualquier sabor'],
                        ['🍞','Concha cortesía','Vainilla o canela'],
                        ['☕','Café del día','Pequeño · 12oz'],
                        ['🥐','Empanada','Guayaba o queso'],
                      ].map(([emoji,name,sub])=>(
                        <div key={name} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:'rgba(251,247,238,0.06)',borderRadius:10,marginBottom:8,textAlign:'left'}}>
                          <span style={{fontSize:'1.4rem'}}>{emoji}</span>
                          <div>
                            <div style={{fontSize:'0.82rem',color:cr,fontWeight:500}}>{name}</div>
                            <div style={{fontSize:'0.62rem',color:'rgba(251,247,238,0.4)'}}>{sub}</div>
                          </div>
                          <div style={{marginLeft:'auto',width:18,height:18,borderRadius:'50%',border:'1.5px solid rgba(251,247,238,0.2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <div style={{width:8,height:8,borderRadius:'50%',background:'rgba(251,247,238,0.2)'}}/>
                          </div>
                        </div>
                      ))}
                      <button style={{width:'100%',marginTop:8,padding:'14px',background:or,color:cr,border:'none',borderRadius:999,fontFamily:ff,fontSize:'0.72rem',fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',cursor:'pointer'}}>
                        Canjear en mostrador →
                      </button>
                    </div>
                  )}

                  {/* QR BUTTON */}
                  <button 
                    onClick={()=>window.open(`/c/${card.card_number}`,'_blank')}
                    style={{width:'100%',padding:'14px',background:'transparent',border:'1.5px solid rgba(31,20,14,0.15)',borderRadius:999,fontFamily:ff,fontSize:'0.72rem',fontWeight:500,color:ink,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:12}}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M17 20h3M20 17v3"/></svg>
                    Mostrar QR
                  </button>

                  {/* HISTORY */}
                  {card.stamp_history?.length > 0 && (
                    <div style={{marginBottom:20}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                        <div style={{fontSize:'0.58rem',letterSpacing:'0.16em',textTransform:'uppercase',color:mu}}>Últimas piezas</div>
                        <div style={{fontSize:'0.62rem',color:or,cursor:'pointer'}}>Ver todo →</div>
                      </div>
                      {[...card.stamp_history].reverse().slice(0,5).map((h,i)=>(
                        <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid rgba(31,20,14,0.06)'}}>
                          <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(227,90,27,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:'0.7rem',fontWeight:700,color:or}}>{card.stamp_history.length - i}</div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:'0.78rem',color:ink,fontWeight:500}}>{h.payment_amount || 'Visita registrada'}</div>
                            <div style={{fontSize:'0.62rem',color:mu,marginTop:2}}>{new Date(h.created_at).toLocaleDateString('es-PR',{day:'numeric',month:'short',year:'numeric'})}</div>
                          </div>
                          <span style={{fontSize:'0.62rem',color:or,fontWeight:600}}>+ pieza</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CYCLE INFO */}
                  <div style={{background:ink,borderRadius:14,padding:'16px 20px',marginBottom:20,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{fontSize:'0.52rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'rgba(251,247,238,0.35)',marginBottom:4}}>Próximo premio</div>
                      <div style={{fontFamily:ffS,fontSize:'1rem',color:cr,fontStyle:'italic'}}>
                        {hasReward ? '¡Listo para canjear!' : `${rem} visita${rem!==1?'s':''} para tu galleta gratis`}
                      </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontFamily:ffS,fontSize:'1.5rem',color:or}}>{cur}/5</div>
                      <div style={{fontSize:'0.52rem',color:'rgba(251,247,238,0.35)',letterSpacing:'0.1em',textTransform:'uppercase'}}>Ciclo {cycle}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB: MENÚ */}
          {tab === 'menu' && (
            <div className="fade-up" style={{padding:'28px 0'}}>
              <div style={{textAlign:'center',marginBottom:24}}>
                <div style={{fontFamily:ffS,fontSize:'1.8rem',fontWeight:400,color:ink}}>Menú de hoy</div>
                <div style={{fontSize:'0.65rem',color:mu,marginTop:4,letterSpacing:'0.08em',textTransform:'uppercase'}}>Horneado fresco cada mañana</div>
              </div>
              {[
                ['🍞','Concha de Vainilla','Pan dulce tradicional','$3.50','Hoy'],
                ['🟠','Galleta de Naranja','Glaseada · Ralladura natural','$4.00','Nuevo'],
                ['⚪','Polvorón de Almendra','Delicado y esponjoso','$3.25',null],
                ['🟤','Mantecada de Canela','Temporada · De la abuela','$3.75','Temporada'],
                ['🎂','Tres Leches','Rebanada · Empapado','$6.50',null],
                ['🥐','Cuerno de Mantequilla','Pan hojaldrado','$3.75',null],
              ].map(([emoji,name,desc,price,tag])=>(
                <div key={name} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 0',borderBottom:'1px solid rgba(31,20,14,0.06)'}}>
                  <div style={{width:48,height:48,borderRadius:12,background:cr2,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',flexShrink:0}}>{emoji}</div>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <span style={{fontSize:'0.85rem',color:ink,fontWeight:500}}>{name}</span>
                      {tag && <span style={{fontSize:'0.52rem',padding:'2px 7px',borderRadius:999,background:tag==='Hoy'?or:ink,color:cr,letterSpacing:'0.08em',textTransform:'uppercase'}}>{tag}</span>}
                    </div>
                    <div style={{fontSize:'0.65rem',color:mu,marginTop:2}}>{desc}</div>
                  </div>
                  <div style={{fontFamily:ffS,fontSize:'1rem',color:or,flexShrink:0}}>{price}</div>
                </div>
              ))}
              <div style={{textAlign:'center',padding:'20px 0'}}>
                <a href="tel:+19393499006" style={{display:'inline-flex',alignItems:'center',gap:8,padding:'13px 24px',background:or,color:cr,borderRadius:999,fontSize:'0.72rem',fontWeight:600,textDecoration:'none',letterSpacing:'0.06em'}}>
                  📞 Ordenar · +1 (939) 349-9006
                </a>
              </div>
            </div>
          )}

        </div>

        {/* BOTTOM NAV */}
        <nav style={{position:'fixed',bottom:0,left:0,right:0,background:'rgba(251,247,238,0.96)',backdropFilter:'blur(12px)',borderTop:'1px solid rgba(31,20,14,0.08)',display:'grid',gridTemplateColumns:'1fr auto 1fr',alignItems:'center',padding:'6px 0 14px',zIndex:200}}>
          {/* Menú */}
          <button className="nav-btn" onClick={()=>setTab('menu')} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,background:'none',border:'none',cursor:'pointer',color:tab==='menu'?or:mu,fontFamily:ff}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="15" y2="18"/>
            </svg>
            <span style={{fontSize:'0.58rem',letterSpacing:'0.08em',textTransform:'uppercase',fontWeight:tab==='menu'?600:400}}>Menú</span>
          </button>

          {/* Ordenar — central raised */}
          <a href="tel:+19393499006" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,textDecoration:'none',WebkitTapHighlightColor:'transparent'}}>
            <div style={{width:52,height:52,borderRadius:'50%',background:or,display:'flex',alignItems:'center',justifyContent:'center',marginTop:-20,boxShadow:'0 4px 18px rgba(227,90,27,0.42)',animation:'pulse-or 2.5s ease-in-out infinite'}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.63A2 2 0 014 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 17v-.08z"/>
              </svg>
            </div>
            <span style={{fontSize:'0.58rem',letterSpacing:'0.08em',textTransform:'uppercase',color:or,fontWeight:600,fontFamily:ff}}>Ordenar</span>
          </a>

          {/* Club / Tarjeta */}
          <button className="nav-btn" onClick={()=>setTab('tarjeta')} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,background:'none',border:'none',cursor:'pointer',color:tab==='tarjeta'?or:mu,fontFamily:ff}}>
            <Mariposa size={22} color={tab==='tarjeta'?or:mu} stroke={tab==='tarjeta'?or:mu} animate={tab==='tarjeta'}/>
            <span style={{fontSize:'0.58rem',letterSpacing:'0.08em',textTransform:'uppercase',fontWeight:tab==='tarjeta'?600:400}}>Club</span>
          </button>
        </nav>
      </div>
    </>
  )
}
