import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

const or='#E87828', ink='#1F140E', cr='#FBF7EE', cr2='#F4EDDD', cr3='#EDE3CE', mu='#7A6452'
const ff='"DM Sans",system-ui,sans-serif'
const ffS='"Raleway",sans-serif'

function Mariposa({ size=28, animate=false, color=or, stroke=ink }) {
  return (
    <svg width={size} height={size*0.82} viewBox="0 0 100 82" style={{display:'block'}}>
      <style>{`
        @keyframes aletear-pub {
          0%,100%{transform:scaleX(1)}
          25%,75%{transform:scaleX(0.55)}
        }
        .pub-ala-izq { transform-origin: 50px 41px; animation: ${animate?'aletear-pub 0.6s ease-in-out infinite':'none'}; }
        .pub-ala-der { transform-origin: 50px 41px; animation: ${animate?'aletear-pub 0.6s ease-in-out infinite 0.15s':'none'}; }
      `}</style>
      <g className="pub-ala-izq">
        <path d="M50 41 C42 14,20 6,8 16 C-2 28,6 50,24 56 C36 60,46 54,50 41Z" fill={color} stroke={stroke} strokeWidth="1.2"/>
        <path d="M50 41 C44 56,30 68,22 70 C16 70,18 60,28 54 C36 50,46 50,50 41Z" fill={color} stroke={stroke} strokeWidth="1.2" opacity=".9"/>
      </g>
      <g className="pub-ala-der">
        <path d="M50 41 C58 14,80 6,92 16 C102 28,94 50,76 56 C64 60,54 54,50 41Z" fill={color} stroke={stroke} strokeWidth="1.2"/>
        <path d="M50 41 C56 56,70 68,78 70 C84 70,82 60,72 54 C64 50,54 50,50 41Z" fill={color} stroke={stroke} strokeWidth="1.2" opacity=".9"/>
      </g>
      <ellipse cx="50" cy="46" rx="2.2" ry="22" fill={stroke}/>
      <circle cx="50" cy="24" r="2.8" fill={stroke}/>
    </svg>
  )
}

function WingStamps({ filled=0 }) {
  return (
    <div style={{position:'relative',width:200,height:164,margin:'0 auto'}}>
      <svg viewBox="0 0 100 82" width="200" height="164">
        <path d="M50 41 C42 14,20 6,8 16 C-2 28,6 50,24 56 C36 60,46 54,50 41Z"
          fill={filled >= 1 ? or : 'rgba(31,20,14,0.08)'}
          stroke={filled >= 1 ? or : 'rgba(31,20,14,0.15)'} strokeWidth="1.2"
          style={{transition:'fill 0.5s ease'}}/>
        <path d="M50 41 C58 14,80 6,92 16 C102 28,94 50,76 56 C64 60,54 54,50 41Z"
          fill={filled >= 2 ? or : 'rgba(31,20,14,0.08)'}
          stroke={filled >= 2 ? or : 'rgba(31,20,14,0.15)'} strokeWidth="1.2"
          style={{transition:'fill 0.5s ease 0.1s'}}/>
        <path d="M50 41 C44 56,30 68,22 70 C16 70,18 60,28 54 C36 50,46 50,50 41Z"
          fill={filled >= 3 ? or : 'rgba(31,20,14,0.08)'}
          stroke={filled >= 3 ? or : 'rgba(31,20,14,0.15)'} strokeWidth="1.2" opacity=".9"
          style={{transition:'fill 0.5s ease 0.2s'}}/>
        <path d="M50 41 C56 56,70 68,78 70 C84 70,82 60,72 54 C64 50,54 50,50 41Z"
          fill={filled >= 4 ? or : 'rgba(31,20,14,0.08)'}
          stroke={filled >= 4 ? or : 'rgba(31,20,14,0.15)'} strokeWidth="1.2" opacity=".9"
          style={{transition:'fill 0.5s ease 0.3s'}}/>
        <ellipse cx="50" cy="46" rx="2.2" ry="22"
          fill={filled >= 5 ? ink : 'rgba(31,20,14,0.15)'}
          style={{transition:'fill 0.5s ease 0.4s'}}/>
        <circle cx="50" cy="24" r="2.8"
          fill={filled >= 5 ? ink : 'rgba(31,20,14,0.15)'}
          style={{transition:'fill 0.5s ease 0.4s'}}/>
      </svg>
    </div>
  )
}

export default function PublicCard() {
  const router = useRouter()
  const { card_number } = router.query
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [logoAnim, setLogoAnim] = useState(false)

  useEffect(() => {
    if (!card_number) return
    fetch('/api/public/card?card_number='+card_number)
      .then(r=>r.json())
      .then(data => {
        if (data.card) setCard(data.card)
        else setError('Tarjeta no encontrada')
        setLoading(false)
      })
  }, [card_number])

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:cr,gap:16}}>
      <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>
      <Mariposa size={52} animate={true} color={or} stroke={ink}/>
      <div style={{fontFamily:ffS,fontSize:'1.1rem',color:mu,fontStyle:'italic'}}>Cargando tu tarjeta…</div>
    </div>
  )

  if (error) return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:cr,gap:16}}>
      <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>
      <Mariposa size={48} animate={false} color="rgba(31,20,14,0.15)" stroke="rgba(31,20,14,0.15)"/>
      <div style={{fontFamily:ffS,fontSize:'1.4rem',color:ink,textAlign:'center'}}>Tarjeta no encontrada</div>
      <p style={{fontSize:'0.78rem',color:mu,textAlign:'center',maxWidth:280}}>Verifica el código QR e intenta de nuevo.</p>
    </div>
  )

  const cur = card.stamps%5===0&&card.stamps>0 ? 5 : card.stamps%5
  const cycle = Math.ceil((card.stamps||1)/5)||1
  const rem = cur===0 ? 5 : 5-cur
  const hasReward = card.stamps>0 && card.stamps%5===0

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:${cr};font-family:${ff}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        @keyframes pulse-or{0%,100%{box-shadow:0 4px 18px rgba(227,90,27,0.35)}50%{box-shadow:0 8px 32px rgba(227,90,27,0.6)}}
        .fade-up{animation:fadeUp 0.5s ease both}
      `}</style>

      <div style={{minHeight:'100vh',background:cr,fontFamily:ff}}>
        {/* TOP NAV */}
        <div style={{position:'sticky',top:0,zIndex:100,background:'rgba(251,247,238,0.94)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(31,20,14,0.06)',padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
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
          <div style={{fontSize:'0.62rem',color:mu,letterSpacing:'0.08em'}}>#{card.card_number}</div>
        </div>

        <div style={{maxWidth:440,margin:'0 auto',padding:'0 20px 40px'}}>

          {/* HERO */}
          <div style={{textAlign:'center',padding:'28px 0 20px'}} className="fade-up">
            <div style={{fontSize:'0.58rem',letterSpacing:'0.2em',textTransform:'uppercase',color:or,marginBottom:8}}>Club Monarca · Tarjeta de Lealtad</div>
            <h2 style={{fontFamily:ffS,fontWeight:400,fontSize:'clamp(1.5rem,6vw,2.2rem)',color:ink,fontStyle:'italic',marginBottom:4}}>
              {card.profiles?.full_name ? `Hola, ${card.profiles.full_name.split(' ')[0]}.` : 'Bienvenido'}
            </h2>
            <div style={{fontSize:'0.65rem',color:mu}}>Miembro #{card.card_number} · Ciclo {cycle}</div>
          </div>

          {/* CARD */}
          <div className="fade-up" style={{background:cr2,borderRadius:20,padding:'24px 20px',border:'1px solid '+cr3,marginBottom:16,position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',right:-20,top:-20,opacity:0.05,pointerEvents:'none'}}>
              <Mariposa size={180} color={or} stroke={or}/>
            </div>

            <div style={{textAlign:'center',marginBottom:8}}>
              <div style={{fontSize:'0.55rem',letterSpacing:'0.18em',textTransform:'uppercase',color:mu,marginBottom:4}}>
                Completa una Monarca y elige una recompensa
              </div>
            </div>

            <WingStamps filled={cur}/>

            <div style={{textAlign:'center',marginTop:12}}>
              <div style={{fontFamily:ffS,fontSize:'2.2rem',fontWeight:400,color:ink,lineHeight:1}}>
                {cur}<span style={{fontSize:'1.1rem',color:mu}}> / 5</span>
              </div>
              <div style={{fontSize:'0.72rem',color:mu,marginTop:6,fontStyle:'italic'}}>
                {hasReward
                  ? '¡Tu Monarca está completa!'
                  : cur === 0 ? 'Cada visita es una pieza'
                  : `${rem} pieza${rem!==1?'s':''} más y volás`}
                {card.profiles?.full_name ? `, ${card.profiles.full_name.split(' ')[0]}.` : '.'}
              </div>
            </div>

            <div style={{height:3,background:'rgba(31,20,14,0.08)',borderRadius:3,margin:'16px 0 0'}}>
              <div style={{height:'100%',width:(cur/5*100)+'%',background:or,borderRadius:3,transition:'width 0.6s ease'}}/>
            </div>
          </div>

          {/* REWARD */}
          {hasReward && (
            <div className="fade-up" style={{background:ink,borderRadius:16,padding:'20px',marginBottom:16}}>
              <div style={{textAlign:'center',marginBottom:16}}>
                <div style={{fontSize:'0.55rem',letterSpacing:'0.18em',textTransform:'uppercase',color:'rgba(251,247,238,0.35)',marginBottom:8}}>Tu recompensa</div>
                <div style={{fontFamily:ffS,fontSize:'1.3rem',color:cr,fontStyle:'italic'}}>¡Tu Monarca está completa!</div>
                <p style={{fontSize:'0.7rem',color:'rgba(251,247,238,0.5)',marginTop:6}}>Canjea en el mostrador en tu próxima visita.</p>
              </div>
              {[
                ['🍪','Galleta gratis','Cualquier sabor'],
                ['🍞','Concha cortesía','Vainilla o canela'],
                ['☕','Café del día','Pequeño · 12oz'],
                ['🥐','Empanada','Guayaba o queso'],
              ].map(([emoji,name,sub])=>(
                <div key={name} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:'rgba(251,247,238,0.06)',borderRadius:10,marginBottom:8}}>
                  <span style={{fontSize:'1.3rem'}}>{emoji}</span>
                  <div>
                    <div style={{fontSize:'0.8rem',color:cr,fontWeight:500}}>{name}</div>
                    <div style={{fontSize:'0.6rem',color:'rgba(251,247,238,0.4)'}}>{sub}</div>
                  </div>
                </div>
              ))}
              <button style={{width:'100%',marginTop:8,padding:'14px',background:or,color:cr,border:'none',borderRadius:999,fontFamily:ff,fontSize:'0.72rem',fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',cursor:'pointer',animation:'pulse-or 2.5s ease-in-out infinite'}}>
                Canjear en mostrador →
              </button>
            </div>
          )}

          {/* NEXT REWARD */}
          <div className="fade-up" style={{background:ink,borderRadius:14,padding:'16px 20px',marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
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

          {/* HISTORY */}
          {card.stamp_history?.length > 0 && (
            <div className="fade-up">
              <div style={{fontSize:'0.58rem',letterSpacing:'0.16em',textTransform:'uppercase',color:mu,marginBottom:12}}>Últimas piezas</div>
              {[...card.stamp_history].reverse().slice(0,5).map((h,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid rgba(31,20,14,0.06)'}}>
                  <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(227,90,27,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:'0.72rem',fontWeight:700,color:or}}>
                    {card.stamp_history.length - i}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'0.78rem',color:ink,fontWeight:500}}>{h.payment_amount || 'Visita registrada'}</div>
                    <div style={{fontSize:'0.62rem',color:mu,marginTop:2}}>
                      {new Date(h.created_at).toLocaleDateString('es-PR',{day:'numeric',month:'short',year:'numeric'})}
                    </div>
                  </div>
                  <span style={{fontSize:'0.62rem',color:or,fontWeight:600}}>+ pieza</span>
                </div>
              ))}
            </div>
          )}

          {/* FOOTER */}
          <div style={{textAlign:'center',padding:'32px 0 16px',borderTop:'1px solid rgba(31,20,14,0.07)',marginTop:24}}>
            <div style={{display:'flex',justifyContent:'center',marginBottom:8}}>
              <Mariposa size={28} animate={false} color={or} stroke={ink}/>
            </div>
            <div style={{fontFamily:ffS,fontSize:'1rem',color:mu}}>
              Monarca <em style={{color:or,fontStyle:'italic'}}>de</em> Azúcar
            </div>
            <div style={{fontSize:'0.55rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'rgba(31,20,14,0.3)',marginTop:4}}>
              Panadería Artesanal · San Juan, PR
            </div>
            <a href="tel:+19393499006" style={{display:'inline-block',marginTop:12,fontSize:'0.72rem',color:or,textDecoration:'none',fontWeight:600}}>
              +1 (939) 349-9006
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
