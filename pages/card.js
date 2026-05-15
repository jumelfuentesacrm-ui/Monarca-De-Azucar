import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Card() {
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      fetch('/api/card/me', {
        headers: { Authorization: 'Bearer ' + session.access_token }
      })
        .then(r => r.json())
        .then(data => { setCard(data.card); setLoading(false) })
    })
  }, [])

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#1F140E',color:'#FBF7EE',fontFamily:'sans-serif'}}>
      Cargando...
    </div>
  )

  if (!card) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#FBF7EE',fontFamily:'sans-serif',flexDirection:'column',gap:16}}>
      <div style={{fontSize:'2rem'}}>🦋</div>
      <div style={{fontFamily:'serif',fontSize:'1.4rem',color:'#1F140E'}}>Tu tarjeta está siendo activada</div>
      <p style={{fontSize:'0.82rem',color:'#7A6452',textAlign:'center',maxWidth:320}}>Un administrador activará tu tarjeta pronto. Si tienes preguntas llama al +1 (939) 349-9006.</p>
      <button onClick={()=>supabase.auth.signOut().then(()=>window.location.href='/login')} style={{marginTop:8,padding:'10px 24px',background:'#1F140E',color:'#FBF7EE',border:'none',borderRadius:999,cursor:'pointer',fontSize:'0.75rem'}}>
        Cerrar sesión
      </button>
    </div>
  )

  const cur = card.stamps%5===0&&card.stamps>0 ? 5 : card.stamps%5
  const hasReward = card.stamps>0 && card.stamps%5===0
  const rem = cur===0 ? 5 : 5-cur

  return (
    <div style={{minHeight:'100vh',background:'#FBF7EE',fontFamily:'"DM Sans",sans-serif'}}>
      <div style={{background:'rgba(251,247,238,0.95)',backdropFilter:'blur(12px)',position:'sticky',top:0,zIndex:100,height:52,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',borderBottom:'1px solid rgba(31,20,14,0.08)'}}>
        <div style={{fontFamily:'"Instrument Serif",serif',fontSize:'1.05rem',color:'#1F140E'}}>Monarca <em style={{color:'#E35A1B'}}>de</em> Azúcar</div>
        <button onClick={()=>supabase.auth.signOut().then(()=>window.location.href='/login')} style={{background:'none',border:'none',cursor:'pointer',fontSize:'0.7rem',color:'#7A6452',letterSpacing:'0.1em',textTransform:'uppercase'}}>Salir</button>
      </div>

      <div style={{maxWidth:420,margin:'0 auto',padding:'32px 24px'}}>
        <div style={{background:'#F4EDDD',borderRadius:20,padding:'1.75rem',border:'1px solid #EDE3CE',boxShadow:'0 20px 50px rgba(31,20,14,0.10)',marginBottom:'1.25rem'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1.5rem'}}>
            <div>
              <div style={{fontFamily:'"Instrument Serif",serif',fontSize:'1.1rem',color:'#1F140E'}}>Carta de Lealtad</div>
              <div style={{fontSize:'0.5rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'#7A6452',marginTop:3}}>5 visitas = 1 dulce gratis</div>
            </div>
            <div style={{textAlign:'right',fontSize:'0.5rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'#7A6452'}}>
              #{card.card_number}<br/>
              <span style={{color:'#E35A1B'}}>Ciclo {Math.ceil((card.stamps||1)/5)||1}</span>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'0.6rem',marginBottom:'1rem'}}>
            {Array.from({length:5},(_,i)=>(
              <div key={i} style={{aspectRatio:'1',borderRadius:'50%',border:i<cur?'none':'1.5px dashed #EDE3CE',background:i<cur?'#E35A1B':'transparent',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'0.7rem'}}>
                {i<cur?'✓':''}
              </div>
            ))}
          </div>

          {hasReward && <div style={{background:'rgba(227,90,27,0.1)',border:'1px solid rgba(227,90,27,0.22)',borderRadius:20,padding:'0.35rem 0.85rem',fontSize:'0.58rem',color:'#E35A1B',fontWeight:600,display:'inline-block',marginBottom:'1rem'}}>🎁 ¡Premio disponible!</div>}

          <div style={{borderTop:'1px solid rgba(31,20,14,0.08)',paddingTop:'1rem',display:'flex',justifyContent:'space-between'}}>
            <div style={{fontSize:'0.9rem',color:'#1F140E'}}>{card.profiles?.full_name}</div>
            <div style={{fontSize:'0.58rem',color:'#E35A1B',fontWeight:600}}>{cur}/5 sellos</div>
          </div>
        </div>

        <div style={{background:'#1F140E',borderRadius:12,padding:'1rem 1.25rem',textAlign:'center',marginBottom:'1.25rem'}}>
          <div style={{fontSize:'0.54rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'rgba(251,247,238,0.3)',marginBottom:'0.35rem'}}>Próximo Premio</div>
          <div style={{fontFamily:'"Instrument Serif",serif',fontSize:'1.1rem',color:'#FBF7EE',fontStyle:'italic'}}>
            {hasReward ? '¡Tu dulce gratis está listo! 🎉' : `Te faltan ${rem} visita${rem!==1?'s':''} para tu galleta gratis`}
          </div>
        </div>

        {card.stamp_history?.length > 0 && <>
          <div style={{fontSize:'0.56rem',letterSpacing:'0.16em',textTransform:'uppercase',color:'#7A6452',marginBottom:'0.85rem'}}>Historial de Visitas</div>
          {[...card.stamp_history].reverse().map((h,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.75rem 0',borderBottom:'1px solid rgba(31,20,14,0.06)'}}>
              <div>
                <div style={{fontSize:'0.78rem',color:'#1F140E'}}>Visita registrada</div>
                <div style={{fontSize:'0.6rem',color:'#7A6452',marginTop:'0.1rem'}}>{new Date(h.created_at).toLocaleDateString('es-PR',{day:'numeric',month:'long',year:'numeric'})}</div>
              </div>
              <span style={{fontSize:'0.58rem',padding:'0.2rem 0.6rem',borderRadius:20,background:'rgba(227,90,27,0.10)',color:'#E35A1B',border:'1px solid rgba(227,90,27,0.2)',fontWeight:600}}>+1 sello</span>
            </div>
          ))}
        </>}
      </div>
    </div>
  )
}
