import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

const or='#E35A1B',orL='#F8D7C2',ink='#1F140E',cr='#FBF7EE',cr2='#F4EDDD',cr3='#EDE3CE',mu='#7A6452'
const ff='"DM Sans",sans-serif'
const ffS='"Instrument Serif",serif'

function Wing({size=28,color=or,stroke=ink}) {
  return (
    <svg width={size} height={size*0.82} viewBox="0 0 100 82" style={{display:'block'}}>
      <path d="M50 41 C42 14,20 6,8 16 C-2 28,6 50,24 56 C36 60,46 54,50 41Z" fill={color} stroke={stroke} strokeWidth="1.4"/>
      <path d="M50 41 C58 14,80 6,92 16 C102 28,94 50,76 56 C64 60,54 54,50 41Z" fill={color} stroke={stroke} strokeWidth="1.4"/>
      <path d="M50 41 C44 56,30 68,22 70 C16 70,18 60,28 54 C36 50,46 50,50 41Z" fill={color} stroke={stroke} strokeWidth="1.4" opacity=".92"/>
      <path d="M50 41 C56 56,70 68,78 70 C84 70,82 60,72 54 C64 50,54 50,50 41Z" fill={color} stroke={stroke} strokeWidth="1.4" opacity=".92"/>
      <path d="M30 22L38 38 M18 32L32 40 M70 22L62 38 M82 32L68 40" stroke={stroke} strokeWidth=".8" fill="none" opacity=".35"/>
      <ellipse cx="50" cy="46" rx="2.2" ry="22" fill={stroke}/>
      <circle cx="50" cy="24" r="2.8" fill={stroke}/>
      <path d="M50 22L46 14 M50 22L54 14" stroke={stroke} strokeWidth="1" fill="none" strokeLinecap="round"/>
    </svg>
  )
}

export default function PublicCard() {
  const router = useRouter()
  const { card_number } = router.query
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:ink,color:'rgba(251,247,238,0.4)',fontFamily:ff,fontSize:'0.85rem',letterSpacing:'0.1em'}}>
      Cargando tarjeta...
    </div>
  )

  if (error) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:ink,fontFamily:ff}}>
      <div style={{textAlign:'center',color:cr,padding:'2rem'}}>
        <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🦋</div>
        <div style={{fontFamily:ffS,fontSize:'1.4rem',marginBottom:'0.5rem'}}>Tarjeta no encontrada</div>
        <p style={{fontSize:'0.78rem',color:'rgba(251,247,238,0.4)'}}>Verifica el código QR e intenta de nuevo.</p>
      </div>
    </div>
  )

  const cur = card.stamps%5===0&&card.stamps>0 ? 5 : card.stamps%5
  const cycle = Math.ceil((card.stamps||1)/5)||1
  const rem = cur===0 ? 5 : 5-cur
  const hasReward = card.stamps>0 && card.stamps%5===0

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:${cr};font-family:${ff}}`}</style>
      <div style={{background:cr,minHeight:'100vh',fontFamily:ff}}>

        {/* TOP BAR */}
        <div style={{background:'rgba(251,247,238,0.95)',backdropFilter:'blur(12px)',position:'fixed',top:0,left:0,right:0,zIndex:100,height:52,display:'flex',alignItems:'center',justifyContent:'center',borderBottom:'1px solid rgba(31,20,14,0.08)'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <Wing size={22} color={or} stroke={ink}/>
            <span style={{fontFamily:ffS,fontSize:'1.05rem',color:ink}}>Monarca <em style={{color:or,fontStyle:'italic'}}>de</em> Azúcar</span>
          </div>
        </div>

        {/* HERO */}
        <div style={{background:ink,padding:'5.5rem 1.25rem 3rem',textAlign:'center',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 55% 40% at 50% 0%,rgba(227,90,27,0.08) 0%,transparent 70%)',pointerEvents:'none'}}/>
          <div style={{fontSize:'0.56rem',letterSpacing:'0.22em',textTransform:'uppercase',color:or,marginBottom:'0.6rem'}}>Club Monarca · Tarjeta de Lealtad</div>
          <h2 style={{fontFamily:ffS,fontSize:'clamp(1.6rem,6vw,2.5rem)',fontWeight:400,color:cr,marginBottom:'0.4rem',fontStyle:'italic'}}>
            {card.profiles?.full_name ? `Hola, ${card.profiles.full_name.split(' ')[0]}.` : 'Bienvenido'}
          </h2>
          <div style={{fontSize:'0.68rem',color:'rgba(251,247,238,0.35)'}}>Miembro #{card.card_number}</div>
        </div>

        <div style={{maxWidth:420,margin:'0 auto',padding:'0 1.25rem',transform:'translateY(-1.5rem)'}}>

          {/* CARD */}
          <div style={{background:cr2,borderRadius:20,padding:'1.75rem',border:'1px solid '+cr3,boxShadow:'0 20px 50px rgba(31,20,14,0.10)',marginBottom:'1.25rem',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:-30,right:-30,opacity:0.06,pointerEvents:'none'}}>
              <Wing size={160} color={or} stroke={or}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1.5rem'}}>
              <div>
                <Wing size={24} color={or} stroke={ink}/>
                <div style={{fontFamily:ffS,fontSize:'1.1rem',fontWeight:400,marginTop:8,color:ink}}>Carta de Lealtad</div>
                <div style={{fontSize:'0.5rem',letterSpacing:'0.14em',textTransform:'uppercase',color:mu,marginTop:3}}>5 visitas = 1 dulce gratis</div>
              </div>
              <div style={{textAlign:'right',fontSize:'0.5rem',letterSpacing:'0.12em',textTransform:'uppercase',color:mu}}>
                Miembro<br/>#{card.card_number}<br/>
                <span style={{color:or,marginTop:3,display:'block'}}>Ciclo {cycle}</span>
              </div>
            </div>

            {/* STAMPS */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'0.6rem',marginBottom:'0.5rem'}}>
              {Array.from({length:5},(_,i)=>(
                <div key={i} style={{aspectRatio:'1',borderRadius:'50%',border:i<cur?'none':'1.5px dashed '+cr3,background:i<cur?or:'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {i<cur && <Wing size={18} color={cr} stroke={cr}/>}
                </div>
              ))}
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.48rem',color:mu,marginBottom:'1rem'}}>
              <span>Visita 1</span><span>Visita 5</span>
            </div>

            {hasReward && (
              <div style={{display:'inline-flex',alignItems:'center',gap:'0.4rem',background:'rgba(227,90,27,0.10)',border:'1px solid rgba(227,90,27,0.22)',borderRadius:20,padding:'0.35rem 0.85rem',fontSize:'0.58rem',textTransform:'uppercase',color:or,fontWeight:600,marginBottom:'1rem'}}>
                🎁 ¡Premio disponible!
              </div>
            )}

            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',borderTop:'1px solid rgba(31,20,14,0.08)',paddingTop:'1rem'}}>
              <div>
                <div style={{fontSize:'0.5rem',letterSpacing:'0.1em',textTransform:'uppercase',color:mu}}>Miembro</div>
                <div style={{fontSize:'0.9rem',marginTop:'0.15rem',color:ink}}>{card.profiles?.full_name}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'0.58rem',color:or,fontWeight:600}}>{cur}/5 sellos</div>
              </div>
            </div>
          </div>

          {/* PROGRESS BAR */}
          <div style={{marginBottom:'1.25rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.62rem',color:mu,marginBottom:'0.4rem'}}>
              <span>{cur} sello{cur!==1?'s':''} en ciclo actual</span>
              <span>{hasReward ? '¡Reclama tu premio!' : `${rem} más para gratis`}</span>
            </div>
            <div style={{height:3,background:cr3,borderRadius:3}}>
              <div style={{height:'100%',width:(cur/5*100)+'%',background:or,borderRadius:3,transition:'width 0.4s'}}/>
            </div>
          </div>

          {/* NEXT REWARD */}
          <div style={{background:ink,borderRadius:12,padding:'1.1rem 1.25rem',marginBottom:'1.25rem',textAlign:'center'}}>
            <div style={{fontSize:'0.54rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'rgba(251,247,238,0.3)',marginBottom:'0.35rem'}}>Próximo Premio</div>
            <div style={{fontFamily:ffS,fontSize:'1.15rem',fontWeight:400,color:cr,fontStyle:'italic'}}>
              {hasReward ? '¡Tu dulce gratis está listo! 🎉' : `Te faltan ${rem} visita${rem!==1?'s':''} para tu galleta gratis`}
            </div>
          </div>

          {/* HISTORY */}
          {card.stamp_history?.length > 0 && <>
            <div style={{fontSize:'0.56rem',letterSpacing:'0.16em',textTransform:'uppercase',color:mu,marginBottom:'0.85rem'}}>Historial de Visitas</div>
            {[...card.stamp_history].reverse().map((h,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.75rem 0',borderBottom:'1px solid rgba(31,20,14,0.06)'}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:30,height:30,borderRadius:'50%',background:'rgba(227,90,27,0.10)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <Wing size={14} color={or} stroke={or}/>
                  </div>
                  <div>
                    <div style={{fontSize:'0.78rem',color:ink}}>Visita registrada{h.payment_amount?' · '+h.payment_amount:''}</div>
                    <div style={{fontSize:'0.6rem',color:mu,marginTop:'0.1rem'}}>{new Date(h.created_at).toLocaleDateString('es-PR',{day:'numeric',month:'long',year:'numeric'})}</div>
                  </div>
                </div>
                <span style={{fontSize:'0.58rem',padding:'0.2rem 0.6rem',borderRadius:20,background:'rgba(227,90,27,0.10)',color:or,border:'1px solid rgba(227,90,27,0.2)',whiteSpace:'nowrap',fontWeight:600}}>+1 sello</span>
              </div>
            ))}
          </>}

          {/* FOOTER */}
          <div style={{textAlign:'center',padding:'2.5rem 0 1.5rem',borderTop:'1px solid rgba(31,20,14,0.07)',marginTop:'1.5rem'}}>
            <Wing size={24} color={or} stroke={ink}/>
            <div style={{fontFamily:ffS,fontSize:'1rem',color:mu,marginTop:8}}>Monarca <em style={{color:or,fontStyle:'italic'}}>de</em> Azúcar</div>
            <div style={{fontSize:'0.52rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'rgba(31,20,14,0.25)',marginTop:'0.3rem'}}>Panadería Artesanal · San Juan, PR</div>
            <div style={{marginTop:'1rem'}}>
              <a href="tel:+19393499006" style={{fontSize:'0.72rem',color:or,textDecoration:'none',fontWeight:600}}>+1 (939) 349-9006</a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
