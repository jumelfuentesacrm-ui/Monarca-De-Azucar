import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

const gold='#E35A1B',goldL='#d4b47a',black='#1F140E',white='#FBF7EE',gray='#7A6452'
const ff='DM Sans,sans-serif'
const ffS='Instrument Serif,serif'

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
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#111110',color:'rgba(255,255,255,0.4)',fontFamily:ff,fontSize:'0.8rem',letterSpacing:'0.1em'}}>
      Cargando tarjeta...
    </div>
  )

  if (error) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#111110',fontFamily:ff}}>
      <div style={{textAlign:'center',color:white,padding:'2rem'}}>
        <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🎴</div>
        <div style={{fontFamily:ffS,fontSize:'1.4rem',marginBottom:'0.5rem'}}>Tarjeta no encontrada</div>
        <p style={{fontSize:'0.78rem',color:'rgba(255,255,255,0.4)'}}>Verifica el código QR e intenta de nuevo.</p>
      </div>
    </div>
  )

  const cur = card.stamps%5===0&&card.stamps>0 ? 5 : card.stamps%5
  const cycle = Math.ceil((card.stamps||1)/5)||1
  const rem = cur===0 ? 5 : 5-cur
  const hasReward = card.stamps>0 && card.stamps%5===0

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400&display=swap" rel="stylesheet"/>
      <div style={{background:'#111110',minHeight:'100vh',fontFamily:ff}}>

        {/* TOP BAR */}
        <div style={{background:'rgba(31,20,14,0.96)',backdropFilter:'blur(12px)',position:'fixed',top:0,left:0,right:0,zIndex:100,height:52,display:'flex',alignItems:'center',justifyContent:'center',borderBottom:'1px solid rgba(227,90,27,0.1)'}}>
          <div style={{fontFamily:ffS,fontSize:'1.1rem',color:white}}>A<span style={{color:gold,fontStyle:'italic'}}>+</span> CRM</div>
        </div>

        {/* HERO */}
        <div style={{background:black,padding:'5.5rem 1.25rem 3rem',textAlign:'center',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 55% 40% at 50% 0%,rgba(227,90,27,0.07) 0%,transparent 70%)'}}/>
          <div style={{fontSize:'0.56rem',letterSpacing:'0.22em',textTransform:'uppercase',color:gold,marginBottom:'0.6rem'}}>Tu Programa de Lealtad</div>
          <h2 style={{fontFamily:ffS,fontSize:'clamp(1.6rem,5vw,2.5rem)',fontWeight:400,color:white,marginBottom:'0.4rem'}}>{card.profiles?.full_name||'Bienvenido'}</h2>
          <div style={{fontSize:'0.68rem',color:'rgba(255,255,255,0.28)'}}>{card.profiles?.business_name} · Cliente Monarca de Azúcar</div>
        </div>

        {/* CARD */}
        <div style={{maxWidth:420,margin:'0 auto',padding:'0 1.25rem',transform:'translateY(-1.5rem)'}}>
          <div style={{background:'linear-gradient(145deg,#1a1917 0%,#252320 55%,#1a1917 100%)',borderRadius:20,padding:'1.75rem',border:'1px solid rgba(227,90,27,0.28)',boxShadow:'0 30px 70px rgba(0,0,0,0.55)',color:white,position:'relative',overflow:'hidden',marginBottom:'1.25rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1.5rem'}}>
              <div style={{fontFamily:ffS,fontSize:'1.3rem',lineHeight:1}}>
                A<span style={{color:gold,fontStyle:'italic'}}>+</span> CRM
                <small style={{display:'block',fontFamily:ff,fontSize:'0.48rem',letterSpacing:'0.16em',textTransform:'uppercase',color:'rgba(227,90,27,0.55)',marginTop:3}}>Loyalty Card · Pagos a Tiempo</small>
              </div>
              <div style={{width:34,height:24,borderRadius:4,background:'linear-gradient(135deg,'+gold+','+goldL+')',opacity:0.72}}/>
            </div>
            <div style={{fontSize:'0.5rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'rgba(227,90,27,0.45)',marginBottom:'0.6rem'}}>5 pagos a tiempo = 1 mes de servicio gratis</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'0.5rem',marginBottom:'0.4rem'}}>
              {Array.from({length:5},(_,i)=>(
                <div key={i} style={{aspectRatio:'1',borderRadius:'50%',border:i<cur?'none':'1.5px solid rgba(227,90,27,0.2)',background:i<cur?'linear-gradient(135deg,'+gold+','+goldL+')':'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.6rem',fontWeight:700,color:black}}>
                  {i<cur?'✓':''}
                </div>
              ))}
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.48rem',color:'rgba(255,255,255,0.18)',marginBottom:'0.55rem'}}><span>Pago 1</span><span>Pago 5</span></div>
            {hasReward && <div style={{display:'inline-flex',alignItems:'center',gap:'0.4rem',background:'rgba(227,90,27,0.1)',border:'1px solid rgba(227,90,27,0.22)',borderRadius:20,padding:'0.32rem 0.75rem',fontSize:'0.55rem',textTransform:'uppercase',color:gold,marginBottom:'1.5rem'}}>🎁 Premio disponible!</div>}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',borderTop:'1px solid rgba(227,90,27,0.1)',paddingTop:'1rem'}}>
              <div>
                <div style={{fontSize:'0.48rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'rgba(255,255,255,0.26)'}}>Miembro</div>
                <div style={{fontSize:'0.88rem',marginTop:'0.15rem'}}>{card.profiles?.full_name}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'0.48rem',color:'rgba(255,255,255,0.22)'}}>#{card.card_number}</div>
                <div style={{fontSize:'0.58rem',color:gold,marginTop:'0.15rem'}}>Ciclo {cycle} · {cur}/5</div>
              </div>
            </div>
          </div>

          {/* PROGRESS */}
          <div style={{marginBottom:'1.25rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.6rem',color:'rgba(255,255,255,0.3)',marginBottom:'0.4rem'}}>
              <span>{cur} sello{cur!==1?'s':''} en ciclo actual</span>
              <span>Meta: 5 = 1 mes gratis</span>
            </div>
            <div style={{height:2,background:'rgba(255,255,255,0.06)',borderRadius:2}}>
              <div style={{height:'100%',width:(cur/5*100)+'%',background:'linear-gradient(90deg,'+gold+','+goldL+')',borderRadius:2}}/>
            </div>
          </div>

          {/* NEXT REWARD */}
          <div style={{background:'rgba(227,90,27,0.07)',border:'1px solid rgba(227,90,27,0.17)',borderRadius:10,padding:'1rem',marginBottom:'1.25rem',textAlign:'center'}}>
            <div style={{fontSize:'0.54rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'rgba(255,255,255,0.28)',marginBottom:'0.3rem'}}>Proximo Premio</div>
            <div style={{fontFamily:ffS,fontSize:'1.2rem',fontWeight:400,color:white}}>
              {hasReward ? 'Tu mes gratis esta listo! 🎉' : 'Te faltan '+rem+' sello'+(rem!==1?'s':'')+' para tu proximo mes gratis'}
            </div>
          </div>

          {/* STAMP HISTORY */}
          {card.stamp_history?.length > 0 && <>
            <div style={{fontSize:'0.54rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'rgba(255,255,255,0.28)',marginBottom:'0.85rem'}}>Historial de Pagos</div>
            {[...card.stamp_history].reverse().map((h,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.75rem 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                <div>
                  <div style={{fontSize:'0.6rem',color:'rgba(255,255,255,0.26)'}}>{new Date(h.created_at).toLocaleDateString('es-PR',{day:'numeric',month:'long',year:'numeric'})}</div>
                  <div style={{fontSize:'0.78rem',color:'rgba(255,255,255,0.72)',marginTop:'0.1rem'}}>Pago registrado{h.payment_amount?' · '+h.payment_amount:''}</div>
                </div>
                <span style={{fontSize:'0.54rem',padding:'0.18rem 0.55rem',borderRadius:20,background:'rgba(227,90,27,0.1)',color:gold,border:'1px solid rgba(227,90,27,0.22)',whiteSpace:'nowrap'}}>+1 sello</span>
              </div>
            ))}
          </>}

          {/* FOOTER */}
          <div style={{textAlign:'center',padding:'2rem 0',borderTop:'1px solid rgba(255,255,255,0.05)',marginTop:'1rem'}}>
            <div style={{fontFamily:ffS,fontSize:'1rem',color:'rgba(255,255,255,0.3)'}}>A<span style={{color:gold,fontStyle:'italic'}}>+</span> CRM</div>
            <div style={{fontSize:'0.52rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'rgba(255,255,255,0.2)',marginTop:'0.25rem'}}>Panadería Artesanal · San Juan, PR</div>
          </div>
        </div>
      </div>
    </>
  )
}
