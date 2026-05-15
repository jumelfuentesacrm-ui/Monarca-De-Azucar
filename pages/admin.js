import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const gold='#E35A1B',black='#1F140E',white='#FBF7EE',gray='#7A6452',gl='rgba(31,20,14,0.10)',ink='#1F140E'
const ff='DM Sans,sans-serif',ffS='Instrument Serif,serif'

function getStatus(card) {
  if (!card) return { label:'Nuevo', color:'#8e44ad', bg:'rgba(142,68,173,0.1)' }
  const stamps = card.stamps || 0
  let days = null
  if (card.stamp_history && card.stamp_history.length > 0) {
    const last = new Date(card.stamp_history[card.stamp_history.length-1].created_at)
    days = (Date.now()-last)/(1000*60*60*24)
  }
  if (days !== null) {
    if (days >= 66) return { label:'Cancelled', color:'#c0392b', bg:'rgba(192,57,43,0.1)' }
    if (days >= 38) return { label:'Late Fee', color:'#e74c3c', bg:'rgba(231,76,60,0.1)' }
    if (days >= 35) return { label:'Grace', color:'#e67e22', bg:'rgba(230,126,34,0.1)' }
  }
  if (stamps >= 15) return { label:'VIP', color:'#E35A1B', bg:'rgba(227,90,27,0.12)' }
  if (stamps >= 10) return { label:'Regular', color:'#2d8a60', bg:'rgba(45,138,96,0.1)' }
  if (stamps >= 5) return { label:'Activo', color:'#3498db', bg:'rgba(52,152,219,0.1)' }
  return { label:'Nuevo', color:'#8e44ad', bg:'rgba(142,68,173,0.1)' }
}

function getDaysSinceLastPurchase(card) {
  if (!card||!card.stamp_history||card.stamp_history.length===0) return null
  const last = new Date(card.stamp_history[card.stamp_history.length-1].created_at)
  return Math.floor((Date.now()-last)/(1000*60*60*24))
}

function getNotifications(cards) {
  const alerts = []
  cards.forEach(card => {
    const days = getDaysSinceLastPurchase(card)
    if (days === null) return
    const name = card.profiles?.business_name || card.profiles?.full_name || 'Client'
    if (days >= 66) alerts.push({ card, days, level: 3, msg: `${name} — Service cancelled (${days} days)` })
    else if (days >= 38) alerts.push({ card, days, level: 3, msg: `${name} — $30 late fee applied (${days} days)` })
    else if (days >= 35) alerts.push({ card, days, level: 2, msg: `${name} — Grace period, 3 days to pay (${days} days)` })
    else if (days >= 30) alerts.push({ card, days, level: 1, msg: `${name} — Payment due soon (${days} days)` })
  })
  return alerts.sort((a,b) => b.days - a.days)
}

function DashboardPanel({ cards, sales, onSeleccionarClient, userName }) {
  const totalClients=cards.length

  function getGreeting() {
    const h = parseInt(new Date().toLocaleString('en-US', { timeZone: 'America/Puerto_Rico', hour: 'numeric', hour12: false }))
    if (h >= 5 && h < 12) return 'Buenos días'
    if (h >= 12 && h < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }
  const sorted=[...cards].sort((a,b)=>(b.stamps||0)-(a.stamps||0))
  const top5=sorted.slice(0,5)
  const maxStamps=top5[0]?.stamps||1
  const clientDonut=[
    {label:'VIP',value:cards.filter(c=>getStatus(c).label==='VIP').length,color:'#E35A1B'},
    {label:'Regular',value:cards.filter(c=>getStatus(c).label==='Regular').length,color:'#2d8a60'},
    {label:'Activo',value:cards.filter(c=>getStatus(c).label==='Activo').length,color:'#3498db'},
    {label:'Nuevo',value:cards.filter(c=>getStatus(c).label==='Nuevo').length,color:'#8e44ad'},
    {label:'Grace',value:cards.filter(c=>getStatus(c).label==='Grace').length,color:'#e67e22'},
    {label:'Late Fee',value:cards.filter(c=>getStatus(c).label==='Late Fee').length,color:'#e74c3c'},
    {label:'Cancelled',value:cards.filter(c=>getStatus(c).label==='Cancelled').length,color:'#c0392b'},
  ].filter(d=>d.value>0)
  function makeSegs(data){const total=data.reduce((a,d)=>a+d.value,0)||1;let cum=0;return data.map(d=>{const s=cum;cum+=d.value/total;return{...d,start:s,pct:d.value/total}})}
  function polar(pct){const a=pct*2*Math.PI-Math.PI/2;return{x:50+35*Math.cos(a),y:50+35*Math.sin(a)}}
  function arc(start,pct){if(pct>=1)return'M 50 15 A 35 35 0 1 1 49.99 15 Z';const s=polar(start),e=polar(start+pct),lg=pct>0.5?1:0;return`M 50 50 L ${s.x} ${s.y} A 35 35 0 ${lg} 1 ${e.x} ${e.y} Z`}
  function Donut({segs,center}){return(<svg viewBox="0 0 100 100" style={{width:100,height:100,flexShrink:0}}>{segs.map((d,i)=><path key={i} d={arc(d.start,d.pct)} fill={d.color} opacity={0.85}/>)}<circle cx="50" cy="50" r="22" fill={white}/>{center}</svg>)}
  const clientSegs=makeSegs(clientDonut)
  return(
    <div>
      <div style={{marginBottom:'1.75rem'}}>
        <div style={{fontFamily:ffS,fontSize:'clamp(1.5rem,3vw,2rem)',fontWeight:400,color:black,lineHeight:1}}>
          {getGreeting()}, <em style={{color:gold,fontStyle:'italic'}}>{userName||'Admin'}</em>.
        </div>
        <div style={{fontSize:'0.65rem',color:gray,marginTop:'0.5rem',letterSpacing:'0.06em'}}>
          {new Date().toLocaleDateString('es-PR',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'America/Puerto_Rico'})}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1.5rem'}} className="donut-grid">
        <div style={{background:white,borderRadius:10,padding:'1.5rem',border:'1px solid rgba(31,20,14,0.07)'}}>
          <div style={{fontFamily:ffS,fontSize:'1.1rem',fontWeight:400,marginBottom:'1.25rem'}}>Clientes</div>
          <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
            <Donut segs={clientSegs} center={<text x="50" y="54" textAnchor="middle" style={{fontSize:14,fontFamily:ffS,fill:black}}>{totalClients}</text>}/>
            <div style={{flex:1}}>{clientDonut.map(d=>(<div key={d.label} style={{display:'flex',alignItems:'center',gap:'0.4rem',marginBottom:'0.4rem'}}><div style={{width:7,height:7,borderRadius:'50%',background:d.color,flexShrink:0}}/><span style={{fontSize:'0.62rem',color:gray,flex:1}}>{d.label}</span><span style={{fontSize:'0.62rem',fontWeight:500,color:black}}>{d.value}</span></div>))}</div>
          </div>
        </div>
        <VentasCard sales={sales}/>
        <div style={{background:white,borderRadius:10,padding:'1.5rem',border:'1px solid rgba(31,20,14,0.07)',position:'relative',display:'none'}}>
          <div style={{fontFamily:ffS,fontSize:'1.1rem',fontWeight:400,marginBottom:'1.25rem'}}>Ventas Legacy</div>
          <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
            <svg viewBox="0 0 100 100" style={{width:100,height:100,flexShrink:0}}><path d="M 50 15 A 35 35 0 1 1 49.99 15 Z" fill="rgba(31,20,14,0.06)" opacity="0.85"/><circle cx="50" cy="50" r="22" fill={white}/><text x="50" y="54" textAnchor="middle" style={{fontSize:8,fontFamily:ff,fill:gray}}>Clover</text></svg>
            <div style={{flex:1}}>{[['Gross Sales','#2d8a60'],['Gross Exp.','#c0392b'],['Net Profit',gold]].map(([label,color])=>(<div key={label} style={{display:'flex',alignItems:'center',gap:'0.4rem',marginBottom:'0.4rem'}}><div style={{width:7,height:7,borderRadius:'50%',background:color,flexShrink:0}}/><span style={{fontSize:'0.62rem',color:gray,flex:1}}>{label}</span><span style={{fontSize:'0.62rem',color:'rgba(31,20,14,0.25)'}}>—</span></div>))}</div>
          </div>
          <div style={{position:'absolute',bottom:'1rem',left:0,right:0,textAlign:'center',fontSize:'0.54rem',color:'rgba(31,20,14,0.3)',letterSpacing:'0.1em',textTransform:'uppercase'}}>Pending Clover data</div>
        </div>
      </div>
      <div style={{background:white,borderRadius:10,padding:'1.5rem',border:'1px solid rgba(31,20,14,0.07)',marginBottom:'1.5rem'}}>
        <div style={{fontFamily:ffS,fontSize:'1.1rem',fontWeight:400,marginBottom:'1.25rem'}}>Top Clientes</div>
        {top5.map((card,i)=>(<div key={card.id} onClick={()=>onSeleccionarClient(card)} style={{display:'flex',alignItems:'center',gap:'0.6rem',marginBottom:'0.75rem',cursor:'pointer'}}><div style={{width:18,height:18,borderRadius:'50%',background:i===0?gold:'rgba(31,20,14,0.06)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.58rem',fontWeight:600,color:i===0?black:gray,flexShrink:0}}>{i+1}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:'0.72rem',color:black,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{card.profiles?.business_name||card.profiles?.full_name}</div><div style={{height:3,background:'rgba(31,20,14,0.06)',borderRadius:2,marginTop:'0.25rem'}}><div style={{height:'100%',width:((card.stamps||0)/maxStamps*100)+'%',background:i===0?gold:'rgba(31,20,14,0.15)',borderRadius:2}}/></div></div><div style={{fontSize:'0.65rem',color:gray,flexShrink:0}}>{card.stamps} stamps</div></div>))}
        {top5.length===0&&<div style={{fontSize:'0.82rem',color:gray,textAlign:'center',padding:'1rem 0'}}>No hay clientes aún.</div>}
      </div>
      <div style={{background:white,borderRadius:10,border:'1px solid rgba(31,20,14,0.07)',overflow:'hidden'}}>
        <div style={{padding:'1rem 1.25rem',borderBottom:'1px solid rgba(31,20,14,0.06)',fontFamily:ffS,fontSize:'1.1rem',fontWeight:400}}>Todos los Clientes</div>
        {sorted.map(card=>{const status=getStatus(card);const cur=card.stamps%5===0&&card.stamps>0?5:card.stamps%5;return(<div key={card.id} onClick={()=>onSeleccionarClient(card)} style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.85rem 1.25rem',borderBottom:'1px solid rgba(31,20,14,0.04)',cursor:'pointer'}}><div style={{flex:1,minWidth:0}}><div style={{fontSize:'0.78rem',color:black,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{card.profiles?.business_name||card.profiles?.full_name}</div><div style={{fontSize:'0.62rem',color:gray,marginTop:'0.1rem'}}>#{card.card_number}</div></div><div style={{display:'flex',gap:2,flexShrink:0}}>{Array.from({length:5},(_,j)=><div key={j} style={{width:7,height:7,borderRadius:'50%',background:j<cur?gold:'rgba(31,20,14,0.08)'}}/>)}</div><span style={{fontSize:'0.56rem',padding:'0.18rem 0.6rem',borderRadius:20,background:status.bg,color:status.color,whiteSpace:'nowrap',flexShrink:0}}>{status.label}</span><div style={{color:gray,fontSize:'0.75rem'}}>›</div></div>);})}
        {sorted.length===0&&<div style={{padding:'2rem',textAlign:'center',color:gray,fontSize:'0.82rem'}}>No hay clientes aún.</div>}
      </div>
    </div>
  )
}

function ClientProfile({card,onBack}){
  if(!card)return null
  const cur=card.stamps%5===0&&card.stamps>0?5:card.stamps%5
  const cycle=Math.ceil((card.stamps||1)/5)||1
  const totalPaid=card.stamp_history?.length||0
  const rewardsClaimed=card.rewards?.filter(r=>r.status==='Canjeado').length||0
  return(
    <div>
      <button onClick={onBack} style={{display:'flex',alignItems:'center',gap:'0.5rem',background:'none',border:'none',cursor:'pointer',color:gray,fontFamily:ff,fontSize:'0.65rem',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:'1.5rem',padding:0}}>← Back to Dashboard</button>
      <div style={{background:black,borderRadius:12,padding:'1.75rem',marginBottom:'1.25rem',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 60% 50% at 0% 50%,rgba(227,90,27,0.08) 0%,transparent 70%)'}}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'1rem',marginBottom:'1.25rem'}}>
          <div>
            <div style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:400,color:white,marginBottom:'0.2rem'}}>{card.profiles?.full_name}</div>
            <div style={{fontSize:'0.7rem',color:'rgba(255,255,255,0.4)'}}>{card.profiles?.business_name} · #{card.card_number}</div>
            {card.profiles?.phone&&<div style={{fontSize:'0.68rem',color:'rgba(255,255,255,0.35)',marginTop:'0.2rem'}}>{card.profiles?.phone}</div>}
          </div>
          <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
            {[['Cycle',cycle],['Stamps',cur+'/5'],['Payments',totalPaid],['Premios',rewardsClaimed]].map(([label,val])=>(<div key={label} style={{textAlign:'center',background:'rgba(255,255,255,0.05)',borderRadius:8,padding:'0.6rem 0.85rem',border:'1px solid rgba(227,90,27,0.1)'}}><div style={{fontFamily:ffS,fontSize:'1.2rem',fontWeight:400,color:gold,lineHeight:1}}>{val}</div><div style={{fontSize:'0.5rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'rgba(255,255,255,0.3)',marginTop:'0.2rem'}}>{label}</div></div>))}
          </div>
        </div>
        <div style={{display:'flex',gap:'0.4rem'}}>{Array.from({length:5},(_,i)=><div key={i} style={{flex:1,height:5,borderRadius:3,background:i<cur?gold:'rgba(255,255,255,0.08)'}}/>)}</div>
        <div style={{fontSize:'0.58rem',color:'rgba(255,255,255,0.3)',marginTop:'0.4rem'}}>{cur===0&&card.stamps>0?'Reward available':cur+'/5 stamps in current cycle'}</div>
      </div>
      <div style={{background:white,borderRadius:10,border:'1px solid rgba(31,20,14,0.07)',overflow:'hidden',marginBottom:'1rem'}}>
        <div style={{padding:'1rem 1.25rem',borderBottom:'1px solid rgba(31,20,14,0.06)',fontFamily:ffS,fontSize:'1.1rem',fontWeight:400}}>Payment History</div>
        {card.stamp_history?.length>0?[...card.stamp_history].reverse().map((h,i)=>(<div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.85rem 1.25rem',borderBottom:'1px solid rgba(31,20,14,0.04)'}}><div><div style={{fontSize:'0.78rem',color:black}}>Payment registered{h.payment_amount?' · '+h.payment_amount:''}</div><div style={{fontSize:'0.62rem',color:gray,marginTop:'0.1rem'}}>{new Date(h.created_at).toLocaleDateString('en-US',{day:'numeric',month:'long',year:'numeric'})}</div></div><span style={{fontSize:'0.58rem',padding:'0.2rem 0.65rem',borderRadius:20,background:'rgba(227,90,27,0.1)',color:gold,border:'1px solid rgba(227,90,27,0.2)'}}>+1 stamp</span></div>)):<div style={{padding:'1.5rem',textAlign:'center',color:gray,fontSize:'0.82rem'}}>Sin historial.</div>}
      </div>
      {card.rewards?.length>0&&(<div style={{background:white,borderRadius:10,border:'1px solid rgba(31,20,14,0.07)',overflow:'hidden'}}><div style={{padding:'1rem 1.25rem',borderBottom:'1px solid rgba(31,20,14,0.06)',fontFamily:ffS,fontSize:'1.1rem',fontWeight:400}}>Premios</div>{card.rewards.map((r,i)=>(<div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.85rem 1.25rem',borderBottom:'1px solid rgba(31,20,14,0.04)'}}><div><div style={{fontSize:'0.78rem',color:black}}>{r.reward_type}</div>{r.reward_cost&&<div style={{fontSize:'0.65rem',color:gold,marginTop:'0.1rem'}}>{r.reward_cost}</div>}</div><span style={{fontSize:'0.58rem',padding:'0.2rem 0.65rem',borderRadius:20,background:'rgba(45,138,96,0.1)',color:'#2d8a60'}}>{r.status}</span></div>))}</div>)}
    </div>
  )
}

function ClientsPanel({users,cards,search,setSearch,onEdit,onAddPayment,onCreateCard,onCreateNew,onDelete,onFiles,onExpense,onHistory}){
  const filtered=users.filter(u=>(u.full_name||'').toLowerCase().includes(search.toLowerCase())||(u.business_name||'').toLowerCase().includes(search.toLowerCase()))
  function getCard(uid){return cards.find(c=>c.user_id===uid)}
  function getClientStatus(uid){const card=getCard(uid);if(!card)return{label:'No Card',color:gray,bg:'rgba(31,20,14,0.06)'};return getStatus(card)}
  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem'}}>
        <h2 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:400}}>Clientes</h2>
        <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
          <div style={{fontSize:'0.62rem',color:gray}}>{users.length} registered</div>
          <button onClick={onCreateNew} style={{background:black,color:white,border:'none',padding:'0.6rem 1.1rem',fontFamily:ff,fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>+ Nuevo</button>
        </div>
      </div>
      <input type="text" placeholder="Buscar por nombre..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%',padding:'0.7rem 1rem',border:'1px solid '+gl,borderRadius:3,fontFamily:ff,fontSize:'0.82rem',outline:'none',marginBottom:'1.25rem',boxSizing:'border-box',background:white}}/>
      <div style={{background:white,borderRadius:10,border:'1px solid rgba(31,20,14,0.07)',overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr auto',padding:'0.6rem 1.25rem',borderBottom:'1px solid rgba(31,20,14,0.06)',fontSize:'0.54rem',letterSpacing:'0.1em',textTransform:'uppercase',color:gray}}>
          <span>Client</span><span>Status</span><span>Stamps</span><span>Actions</span>
        </div>
        {filtered.map(user=>{
          const card=getCard(user.id)
          const status=getClientStatus(user.id)
          const cur=card?(card.stamps%5===0&&card.stamps>0?5:card.stamps%5):0
          const lastPay=card?.stamp_history?.length>0?new Date(card.stamp_history[card.stamp_history.length-1].created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'}):null
          return(
            <div key={user.id} style={{display:'grid',gridTemplateColumns:'2fr 120px 100px 1fr',padding:'0.85rem 1.25rem',borderBottom:'1px solid rgba(31,20,14,0.04)',alignItems:'center',gap:'0.5rem'}}>
              <div style={{minWidth:0}}>
                <div style={{fontSize:'0.78rem',color:black,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:500}}>{user.business_name||user.full_name}</div>
                <div style={{fontSize:'0.62rem',color:gray,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.business_name?user.full_name:user.email}</div>
                {lastPay&&<div style={{fontSize:'0.58rem',color:'rgba(31,20,14,0.3)',marginTop:'0.1rem'}}>Last payment: {lastPay}</div>}
              </div>
              <span style={{fontSize:'0.58rem',padding:'0.2rem 0.6rem',borderRadius:20,background:status.bg,color:status.color,whiteSpace:'nowrap',width:'fit-content'}}>{status.label}</span>
              <div style={{display:'flex',gap:2,alignItems:'center'}}>
                {Array.from({length:5},(_,j)=><div key={j} style={{width:8,height:8,borderRadius:'50%',background:j<cur?gold:'rgba(31,20,14,0.08)'}}/>)}
                <span style={{fontSize:'0.58rem',color:gray,marginLeft:'0.3rem'}}>{card?.stamps||0}</span>
              </div>
              <div style={{display:'flex',gap:'0.35rem',flexWrap:'wrap',justifyContent:'flex-end',alignItems:'center'}}>
                <button onClick={()=>onEdit(user)} style={{padding:'0.35rem 0.65rem',background:'rgba(31,20,14,0.06)',color:black,border:'none',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.56rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>Editar</button>
                {card
                  ?<button onClick={()=>onAddPayment(card)} style={{padding:'0.35rem 0.65rem',background:black,color:white,border:'none',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.56rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>+ Pay</button>
                  :<button onClick={()=>onCreateCard(user.id)} style={{padding:'0.35rem 0.65rem',background:'rgba(227,90,27,0.1)',color:gold,border:'1px solid rgba(227,90,27,0.25)',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.56rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>+ Card</button>
                }
                <button onClick={()=>onFiles(user)} style={{padding:'0.35rem 0.65rem',background:'rgba(52,152,219,0.08)',color:'#2980b9',border:'1px solid rgba(52,152,219,0.2)',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.56rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>Archivos</button>
                <button onClick={()=>onHistory(user)} style={{padding:'0.35rem 0.65rem',background:'rgba(45,138,96,0.08)',color:'#2d8a60',border:'1px solid rgba(45,138,96,0.2)',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.56rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>Historial</button>
                <button onClick={()=>onExpense(user)} style={{padding:'0.35rem 0.65rem',background:'rgba(142,68,173,0.08)',color:'#8e44ad',border:'1px solid rgba(142,68,173,0.2)',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.56rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>Gasto</button>
                <button onClick={()=>onDelete(user.id)} style={{padding:'0.35rem 0.65rem',background:'rgba(192,57,43,0.08)',color:'#a93226',border:'none',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.56rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>Eliminar</button>
              </div>
            </div>
          )
        })}
        {filtered.length===0&&<div style={{padding:'2rem',textAlign:'center',color:gray,fontSize:'0.82rem'}}>No se encontraron clientes.</div>}
      </div>
    </div>
  )
}

function NotificationsPanel({ cards, users }) {
  const alerts = getNotifications(cards)
  const levelColor = { 1: '#E35A1B', 2: '#e67e22', 3: '#c0392b' }
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
        <h2 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:400}}>Alertas</h2>
        <div style={{fontSize:'0.62rem',color:gray}}>{alerts.length} active alert{alerts.length!==1?'s':''}</div>
      </div>
      {alerts.length===0
        ?<div style={{background:white,borderRadius:10,padding:'2rem',textAlign:'center',border:'1px solid rgba(31,20,14,0.07)',color:gray,fontSize:'0.82rem'}}>Sin alertas — todos los clientes están al día.</div>
        :<div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
          {alerts.map((alert,i)=>{
            const user=users.find(u=>u.id===alert.card.user_id)
            return(
              <div key={i} style={{background:white,borderRadius:10,border:'1px solid rgba(31,20,14,0.07)',overflow:'hidden'}}>
                <div style={{background:`${levelColor[alert.level]}0d`,borderLeft:'3px solid '+levelColor[alert.level],padding:'1rem 1.25rem',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div>
                    <div style={{fontFamily:ffS,fontSize:'1rem',fontWeight:400,color:black,marginBottom:'0.2rem'}}>{alert.card.profiles?.business_name||alert.card.profiles?.full_name}</div>
                    <div style={{fontSize:'0.7rem',color:gray}}>{alert.msg}</div>
                    {user?.phone&&<div style={{fontSize:'0.68rem',color:gray,marginTop:'0.2rem'}}>{user.phone}</div>}
                  </div>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'0.4rem',flexShrink:0,marginLeft:'1rem'}}>
                    <span style={{fontSize:'0.58rem',padding:'0.2rem 0.65rem',borderRadius:20,background:`${levelColor[alert.level]}22`,color:levelColor[alert.level],whiteSpace:'nowrap'}}>Alert {alert.level}/3</span>
                    <span style={{fontSize:'0.62rem',color:levelColor[alert.level],fontWeight:600}}>{alert.days} days</span>
                  </div>
                </div>
                {user?.phone&&(<div style={{padding:'0.75rem 1.25rem',borderTop:'1px solid rgba(31,20,14,0.05)'}}><button onClick={()=>{const phone=user.phone.replace(/[^0-9]/g,'');const fp=phone.startsWith('1')?phone:'1'+phone;const msg=`Hi ${alert.card.profiles?.full_name||''}, we noticed your account at ${alert.card.profiles?.business_name||''} has a pending balance of ${alert.days} days. Please contact us to keep your service active.`;window.open(`https://wa.me/${fp}?text=${encodeURIComponent(msg)}`,'_blank')}} style={{padding:'0.4rem 1rem',background:black,color:white,border:'none',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.58rem',letterSpacing:'0.08em',textTransform:'uppercase'}}>Send WhatsApp</button></div>)}
              </div>
            )
          })}
        </div>
      }
    </div>
  )
}

function CampaignsPanel({ cards, users }) {
  const [selectedGroup, setSeleccionaredGroup] = useState(null)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  function classifyClient(card) {
    const status = getStatus(card).label
    if (status === 'VIP') return 'vip'
    if (status === 'Regular') return 'regulares'
    if (status === 'Activo') return 'activos'
    if (status === 'Cancelled') return 'cancelados'
    if (status === 'Late Fee' || status === 'Grace') return 'recargo'
    return 'nuevos'
  }
  const groups = {
    vip:        { label:'VIP',        desc:'15+ stamps, up to date',      color:'#E35A1B', bg:'rgba(227,90,27,0.12)', cards: cards.filter(c=>classifyClient(c)==='vip') },
    regulares:  { label:'Regular',    desc:'10-14 stamps, up to date',    color:'#2d8a60', bg:'rgba(45,138,96,0.1)',   cards: cards.filter(c=>classifyClient(c)==='regulares') },
    activos:    { label:'Activo',     desc:'5-9 stamps, up to date',      color:'#3498db', bg:'rgba(52,152,219,0.1)',  cards: cards.filter(c=>classifyClient(c)==='activos') },
    nuevos:     { label:'Nuevo',        desc:'1-4 stamps, up to date',      color:'#8e44ad', bg:'rgba(142,68,173,0.1)',  cards: cards.filter(c=>classifyClient(c)==='nuevos') },
    recargo:    { label:'Late Fee',   desc:'35-65 days — $30 applied',    color:'#e74c3c', bg:'rgba(231,76,60,0.1)',   cards: cards.filter(c=>classifyClient(c)==='recargo') },
    cancelados: { label:'Cancelled',  desc:'66+ days without payment',    color:'#c0392b', bg:'rgba(192,57,43,0.1)',   cards: cards.filter(c=>classifyClient(c)==='cancelados') },
  }
  const defaultMessages = {
    vip:        'Hi [name]! Thank you for being a VIP at [business]. Your loyalty means everything to us 🙌',
    regulares:  'Hi [name]! You keep adding up at [business]. Every payment gets you closer to your next reward 💪',
    activos:    'Hi [name]! You have stamps saved at [business]. Keep it up, you\'re doing great! ⭐',
    nuevos:     'Hi [name]! Welcome to [business]. You started your loyalty card, let\'s get more! 🎉',
    recargo:    'Hi [name], you have a pending balance at [business]. Getting current avoids suspension. Thank you!',
    cancelados: 'Hi [name], your service at [business] is suspended due to non-payment. Contact us to reactivate. We\'re here to help!',
  }
  function selectGroup(key){setSeleccionaredGroup(key);setMessage(defaultMessages[key]);setSent(false)}
  const group=selectedGroup?groups[selectedGroup]:null
  const recipients=group?group.cards.filter(c=>users.find(u=>u.id===c.user_id)?.phone):[]
  const noPhone=group?group.cards.filter(c=>!users.find(u=>u.id===c.user_id)?.phone):[]
  function sendViaWhatsApp(){recipients.forEach(card=>{const user=users.find(u=>u.id===card.user_id);if(!user?.phone)return;const phone=user.phone.replace(/[^0-9]/g,'');const fullPhone=phone.startsWith('1')?phone:'1'+phone;const msg=message.replace(/\[name\]/g,user.full_name||'').replace(/\[business\]/g,user.business_name||user.full_name||'');window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`,'_blank')});setSent(true)}
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
        <h2 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:400}}>Campañas de WhatsApp</h2>
        <div style={{fontSize:'0.62rem',color:gray}}>{cards.length} total clients</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:'0.75rem',marginBottom:'1.5rem'}}>
        {Object.entries(groups).map(([key,g])=>(<div key={key} onClick={()=>selectGroup(key)} style={{background:selectedGroup===key?g.color:white,borderRadius:10,padding:'1.1rem',border:'2px solid '+(selectedGroup===key?g.color:'rgba(31,20,14,0.07)'),cursor:'pointer'}}><div style={{fontSize:'0.78rem',fontWeight:600,color:selectedGroup===key?white:black,marginBottom:'0.2rem'}}>{g.label}</div><div style={{fontSize:'0.6rem',color:selectedGroup===key?'rgba(255,255,255,0.75)':gray,lineHeight:1.4,marginBottom:'0.5rem'}}>{g.desc}</div><div style={{fontSize:'0.72rem',fontWeight:600,color:selectedGroup===key?white:g.color}}>{g.cards.length} clients</div></div>))}
      </div>
      {selectedGroup&&group&&<>
        <div style={{background:white,borderRadius:10,border:'1px solid rgba(31,20,14,0.07)',padding:'1.25rem',marginBottom:'1rem'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.85rem'}}>
            <div style={{fontFamily:ffS,fontSize:'1rem',fontWeight:400}}>Recipients — {group.label}</div>
            <div style={{display:'flex',gap:'0.75rem',fontSize:'0.65rem'}}><span style={{color:'#2d8a60'}}>{recipients.length} with phone</span>{noPhone.length>0&&<span style={{color:'#c0392b'}}>{noPhone.length} no phone</span>}</div>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'0.4rem'}}>{group.cards.map(card=>{const user=users.find(u=>u.id===card.user_id);const hasPhone=!!user?.phone;return(<span key={card.id} style={{fontSize:'0.62rem',padding:'0.2rem 0.65rem',borderRadius:20,background:hasPhone?'rgba(45,138,96,0.1)':'rgba(192,57,43,0.06)',color:hasPhone?'#2d8a60':'#c0392b'}}>{user?.business_name||user?.full_name||'No name'}{!hasPhone?' (no phone)':''}</span>)})}{group.cards.length===0&&<span style={{fontSize:'0.78rem',color:gray}}>No hay clientes en este grupo.</span>}</div>
        </div>
        <div style={{background:white,borderRadius:10,border:'1px solid rgba(31,20,14,0.07)',padding:'1.25rem',marginBottom:'1rem'}}>
          <div style={{fontFamily:ffS,fontSize:'1rem',fontWeight:400,marginBottom:'0.5rem'}}>Mensaje</div>
          <div style={{fontSize:'0.6rem',color:gray,marginBottom:'0.5rem'}}>Usa [name] y [business] para personalizar</div>
          <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={5} style={{width:'100%',padding:'0.85rem',border:'1px solid '+gl,borderRadius:3,fontFamily:ff,fontSize:'0.82rem',color:black,outline:'none',resize:'vertical',boxSizing:'border-box',lineHeight:1.6}}/>
        </div>
        {sent&&<div style={{background:'rgba(45,138,96,0.08)',border:'1px solid rgba(45,138,96,0.2)',borderRadius:8,padding:'0.85rem 1.25rem',marginBottom:'0.85rem',fontSize:'0.78rem',color:'#2d8a60'}}>Opened {recipients.length} WhatsApp conversations.</div>}
        {recipients.length>0
          ?<button onClick={sendViaWhatsApp} style={{width:'100%',background:black,color:white,border:'none',padding:'1rem',fontFamily:ff,fontSize:'0.68rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Send via WhatsApp to {recipients.length} client{recipients.length!==1?'s':''}</button>
          :<div style={{background:'rgba(192,57,43,0.05)',border:'1px solid rgba(192,57,43,0.15)',borderRadius:8,padding:'1rem',textAlign:'center',fontSize:'0.78rem',color:'#c0392b'}}>No clients in this group have a phone number registered.</div>
        }
        {noPhone.length>0&&<div style={{marginTop:'0.6rem',fontSize:'0.65rem',color:gray,textAlign:'center'}}>{noPhone.length} client{noPhone.length!==1?'s':''} without phone will not receive the message</div>}
      </>}
      {!selectedGroup&&<div style={{background:white,borderRadius:10,padding:'2rem',textAlign:'center',border:'1px solid rgba(31,20,14,0.07)',color:gray,fontSize:'0.82rem'}}>Seleccionar a group above to see recipients.</div>}
    </div>
  )
}

function CatalogPanel({ catalog, onSetCost, onSetSuppliers }) {
  const [search, setSearch] = useState('')
  const [expandMargin, setExpandMargin] = useState(false)

  function getPrice(item) {
    const p = item.catalog_prices?.find(p=>p.active)
    if (!p) return null
    return p.amount
  }

  function formatPrice(item) {
    const prices = item.catalog_prices?.filter(p=>p.active)||[]
    if (!prices.length) return '—'
    return prices.map(p=>'$'+(p.amount||0).toFixed(2)+(p.interval?'/'+p.interval:'')).join(' · ')
  }

  function getCost(item) {
    const c = item.catalog_costs?.cost
    return c!=null ? parseFloat(c) : null
  }

  function getMargin(item) {
    const price = getPrice(item)
    const cost = getCost(item)
    if (!price || cost === null) return null
    return Math.round(((price - cost) / price) * 100)
  }

  function mc(m) {
    return m >= 60 ? '#2d8a60' : m >= 40 ? gold : '#c0392b'
  }

  function categorize(name) {
    const n = name.toLowerCase()
    if (n.includes('mantenimiento') || n.includes('maintenance') || n.includes('mensual') || n.includes('planilla') || n.includes('scaling')) return 'maintenance'
    if (n.includes('setup') || n.includes('bundle') || n.includes('pro')) return 'setup'
    return 'extras'
  }

  const filtered = catalog.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
  const setup = [...filtered.filter(i=>categorize(i.name)==='setup')].sort((a,b)=>(getPrice(b)||0)-(getPrice(a)||0))
  const maintenance = [...filtered.filter(i=>categorize(i.name)==='maintenance')].sort((a,b)=>(getPrice(b)||0)-(getPrice(a)||0))
  const extras = [...filtered.filter(i=>categorize(i.name)==='extras')].sort((a,b)=>(getPrice(b)||0)-(getPrice(a)||0))

  const withMargin = catalog.map(i=>({...i,_margin:getMargin(i)})).filter(i=>i._margin!==null).sort((a,b)=>b._margin-a._margin)
  const showList = expandMargin ? withMargin : withMargin.slice(0,5)

  function Row({item}) {
    const price = getPrice(item)
    const cost = getCost(item)
    const margin = getMargin(item)
    const suppliers = item.catalog_costs?.suppliers
    return (
      <div style={{padding:'0.9rem 1.25rem',borderBottom:'1px solid rgba(31,20,14,0.05)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'0.6rem'}}>
          <div style={{flex:1,minWidth:0,marginRight:'0.75rem'}}>
            <div style={{fontSize:'0.78rem',fontWeight:600,color:black,lineHeight:1.3}}>{item.name}</div>
            {item.description&&<div style={{fontSize:'0.6rem',color:gray,marginTop:'0.2rem',lineHeight:1.4}}>{item.description.substring(0,80)}{item.description.length>80?'...':''}</div>}
          </div>
          <span style={{fontSize:'0.52rem',padding:'0.15rem 0.55rem',borderRadius:20,background:item.active?'rgba(45,138,96,0.1)':'rgba(192,57,43,0.1)',color:item.active?'#2d8a60':'#c0392b',whiteSpace:'nowrap',flexShrink:0}}>{item.active?'Activo':'Inactive'}</span>
        </div>
        {/* Price / Cost / Margin — inline pill row */}
        <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.65rem',flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:'0.25rem'}}>
            <span style={{fontSize:'0.48rem',color:gray,letterSpacing:'0.08em',textTransform:'uppercase'}}>Price</span>
            <span style={{fontSize:'0.78rem',fontWeight:700,color:black}}>{formatPrice(item)}</span>
          </div>
          <span style={{color:gray,fontSize:'0.7rem'}}>·</span>
          <div style={{display:'flex',alignItems:'center',gap:'0.25rem'}}>
            <span style={{fontSize:'0.48rem',color:gray,letterSpacing:'0.08em',textTransform:'uppercase'}}>Cost</span>
            <span style={{fontSize:'0.78rem',fontWeight:600,color:cost!==null?black:'rgba(31,20,14,0.25)'}}>{cost!==null?'$'+cost.toFixed(2):'—'}</span>
          </div>
          <span style={{color:gray,fontSize:'0.7rem'}}>·</span>
          <div style={{display:'flex',alignItems:'center',gap:'0.25rem'}}>
            <span style={{fontSize:'0.48rem',color:gray,letterSpacing:'0.08em',textTransform:'uppercase'}}>Margin</span>
            <span style={{fontSize:'0.78rem',fontWeight:700,color:margin!==null?mc(margin):'rgba(31,20,14,0.25)'}}>{margin!==null?margin+'%':'—'}</span>
          </div>
          {margin!==null&&<div style={{flex:1,height:3,background:'rgba(31,20,14,0.06)',borderRadius:2,minWidth:40}}>
            <div style={{height:'100%',width:Math.min(margin,100)+'%',background:mc(margin),borderRadius:2}}/>
          </div>}
        </div>
        {suppliers&&<div style={{fontSize:'0.62rem',color:gray,marginBottom:'0.6rem',fontStyle:'italic'}}>{suppliers.substring(0,80)}{suppliers.length>80?'...':''}</div>}
        <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap'}}>
          <button onClick={()=>onSetCost(item)} style={{padding:'0.4rem 0.85rem',background:'rgba(227,90,27,0.08)',color:gold,border:'1px solid rgba(227,90,27,0.25)',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.58rem',letterSpacing:'0.08em',textTransform:'uppercase'}}>{cost!==null?'Editar Costo':'Establecer Costo'}</button>
          <button onClick={()=>onSetSuppliers(item)} style={{padding:'0.4rem 0.85rem',background:'rgba(52,152,219,0.08)',color:'#2980b9',border:'1px solid rgba(52,152,219,0.2)',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.58rem',letterSpacing:'0.08em',textTransform:'uppercase'}}>Proveedores</button>
        </div>
      </div>
    )
  }

  function Section({title, items}) {
    const [open, setOpen] = useState(true)
    if (!items.length) return null
    return (
      <div style={{background:white,borderRadius:10,border:'1px solid rgba(31,20,14,0.07)',overflow:'hidden',marginBottom:'1rem'}}>
        <div onClick={()=>setOpen(o=>!o)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.9rem 1.25rem',cursor:'pointer',background:'rgba(31,20,14,0.02)'}}>
          <div style={{fontFamily:ffS,fontSize:'1.05rem',fontWeight:400,color:black}}>{title}</div>
          <div style={{display:'flex',alignItems:'center',gap:'0.6rem'}}>
            <span style={{fontSize:'0.6rem',color:gray}}>{items.length} service{items.length!==1?'s':''}</span>
            <span style={{fontSize:'0.6rem',color:gray,transform:open?'rotate(180deg)':'rotate(0)',display:'inline-block',transition:'transform 0.2s'}}>▾</span>
          </div>
        </div>
        {open && items.map(item=><Row key={item.id} item={item}/>)}
      </div>
    )
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem'}}>
        <h2 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:400}}>Catálogo</h2>
        <div style={{fontSize:'0.62rem',color:gray}}>{catalog.length} services · Stripe synced</div>
      </div>

      {/* Best Margin Box */}
      {withMargin.length>0&&(
        <div style={{background:white,borderRadius:10,border:'1px solid rgba(227,90,27,0.25)',padding:'0.9rem 1.25rem',marginBottom:'1.25rem'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.65rem'}}>
            <span style={{fontSize:'0.6rem',fontWeight:700,color:gold,letterSpacing:'0.1em',textTransform:'uppercase'}}>★ Best Margin</span>
            <button onClick={()=>setExpandMargin(e=>!e)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'0.6rem',color:gray,fontFamily:ff,letterSpacing:'0.08em',textTransform:'uppercase'}}>{expandMargin?'Colapsar':'Ver todos'}</button>
          </div>
          {showList.map((item,i)=>(
            <div key={item.id} style={{display:'flex',alignItems:'center',gap:'0.6rem',marginBottom:'0.45rem'}}>
              <div style={{width:16,height:16,borderRadius:'50%',background:i===0&&!expandMargin?gold:'rgba(31,20,14,0.06)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.5rem',fontWeight:700,color:i===0&&!expandMargin?black:gray,flexShrink:0}}>{i+1}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'0.68rem',color:black,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name}</div>
                <div style={{height:3,background:'rgba(31,20,14,0.06)',borderRadius:2,marginTop:'0.2rem'}}>
                  <div style={{height:'100%',width:Math.min(item._margin,100)+'%',background:mc(item._margin),borderRadius:2}}/>
                </div>
              </div>
              <span style={{fontSize:'0.7rem',fontWeight:700,color:mc(item._margin),flexShrink:0,minWidth:36,textAlign:'right'}}>{item._margin}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <input type="text" placeholder="Search services..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%',padding:'0.7rem 1rem',border:'1px solid '+gl,borderRadius:3,fontFamily:ff,fontSize:'0.82rem',outline:'none',marginBottom:'1.25rem',boxSizing:'border-box',background:white}}/>

      {/* Sections */}
      <Section title="Setup" items={setup}/>
      <Section title="Maintenance" items={maintenance}/>
      <Section title="Extras" items={extras}/>
      {!filtered.length&&<div style={{background:white,borderRadius:10,padding:'2rem',textAlign:'center',color:gray,fontSize:'0.82rem',border:'1px solid rgba(31,20,14,0.07)'}}>No se encontraron servicios.</div>}
    </div>
  )
}

function CostHistory({ productId }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(()=>{
    fetch('/api/admin/catalog/history?product_id='+productId)
      .then(r=>r.json())
      .then(d=>{ setHistory(d.history||[]); setLoading(false) })
      .catch(()=>setLoading(false))
  },[productId])

  if(loading) return <div style={{fontSize:'0.68rem',color:'#7A6452',padding:'0.5rem 0'}}>Cargando historial...</div>
  if(!history.length) return <div style={{fontSize:'0.68rem',color:'#7A6452',padding:'0.5rem 0'}}>Sin historial de costo.</div>

  return(
    <div style={{marginTop:'0.75rem'}}>
      <button onClick={()=>setOpen(o=>!o)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',background:'rgba(31,20,14,0.03)',border:'1px solid rgba(31,20,14,0.07)',borderRadius:6,padding:'0.5rem 0.85rem',cursor:'pointer',fontFamily:ff}}>
        <span style={{fontSize:'0.52rem',letterSpacing:'0.12em',textTransform:'uppercase',color:gray}}>Cost History ({history.length})</span>
        <span style={{fontSize:'0.6rem',color:gray,transform:open?'rotate(180deg)':'rotate(0)',display:'inline-block',transition:'transform 0.2s'}}>▾</span>
      </button>
      {open&&(
        <div style={{border:'1px solid rgba(31,20,14,0.07)',borderTop:'none',borderRadius:'0 0 6px 6px',overflow:'hidden',maxHeight:200,overflowY:'auto'}}>
          {history.map((h,i)=>(
            <div key={h.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.6rem 0.85rem',borderBottom:i<history.length-1?'1px solid rgba(31,20,14,0.05)':'none'}}>
              <div>
                <span style={{fontSize:'0.78rem',fontWeight:600,color:'#1F140E'}}>${parseFloat(h.cost).toFixed(2)}</span>
                {h.notes&&<span style={{fontSize:'0.6rem',color:'#7A6452',marginLeft:'0.5rem'}}>{h.notes.substring(0,40)}</span>}
              </div>
              <span style={{fontSize:'0.58rem',color:'#7A6452'}}>{new Date(h.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ExpenseHistory({ clientId, showToast, supplies }) {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('manual') // 'manual' | 'supplies'
  const [quantities, setQuantities] = useState({})

  useEffect(()=>{ load() },[clientId])

  async function load(){
    setLoading(true)
    const res = await fetch('/api/admin/expenses?client_id='+clientId)
    const data = await res.json()
    setExpenses(data.expenses||[])
    setLoading(false)
  }

  async function del(id){
    await fetch('/api/admin/expenses',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})})
    showToast('Expense deleted')
    load()
  }

  function unitLabel(u) { return u==='month'?'/mo':u==='year'?'/yr':u==='one-time'?' once':'/'+u }

  function calcLineTotal(s, qty) {
    if (!qty || parseFloat(qty)===0) return 0
    return parseFloat(s.cost||0) * parseFloat(qty)
  }

  const suppliesTotal = (supplies||[]).reduce((a,s)=>{
    const qty = parseFloat(quantities[s.id]||0)
    return a + calcLineTotal(s, qty)
  }, 0)

  async function saveSuppliesExpense() {
    const lineItems = (supplies||[]).filter(s=>parseFloat(quantities[s.id]||0)>0).map(s=>({
      supply_id: s.id, name: s.name, unit: s.unit, cost: s.cost, qty: parseFloat(quantities[s.id])
    }))
    if (lineItems.length===0) { showToast('Añade al menos un insumo'); return }
    const res = await fetch('/api/admin/expenses',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      client_id: clientId, amount: suppliesTotal, description: lineItems.map(l=>l.name).join(', '),
      recurring: false, recurring_interval: 'month', expense_date: new Date().toISOString().split('T')[0],
      line_items: lineItems
    })})
    if (res.ok) { showToast('Gasto guardado'); setQuantities({}); load() }
    else showToast('Error al guardar gasto')
  }

  const total = expenses.reduce((a,e)=>a+parseFloat(e.amount||0),0)

  if(loading) return <div style={{fontSize:'0.72rem',color:'#7A6452',textAlign:'center',padding:'1rem'}}>Cargando...</div>

  return(
    <div>
      {/* Toggle */}
      <div style={{display:'flex',gap:'0.4rem',marginBottom:'1rem'}}>
        {[['manual','Manual'],['supplies','De Insumos']].map(([m,label])=>(
          <button key={m} onClick={()=>setMode(m)} style={{padding:'0.35rem 0.85rem',borderRadius:20,border:'none',cursor:'pointer',fontFamily:ff,fontSize:'0.6rem',letterSpacing:'0.08em',textTransform:'uppercase',background:mode===m?black:'rgba(31,20,14,0.06)',color:mode===m?white:gray,transition:'all 0.15s'}}>{label}</button>
        ))}
      </div>

      {/* FROM SUPPLIES */}
      {mode==='supplies'&&(
        <div style={{marginBottom:'1.25rem'}}>
          {!supplies||supplies.length===0
            ?<div style={{fontSize:'0.72rem',color:gray,padding:'0.75rem 0'}}>No supplies added yet. Add them in the Supplies section.</div>
            :<>
              {supplies.map(s=>(
                <div key={s.id} style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.6rem 0',borderBottom:'1px solid rgba(31,20,14,0.05)'}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:'0.72rem',color:black,fontWeight:500}}>{s.name}</div>
                    <div style={{fontSize:'0.6rem',color:gray}}>${parseFloat(s.cost).toFixed(2)}{unitLabel(s.unit)}</div>
                  </div>
                  <input type="number" min="0" step="0.1" placeholder="0"
                    value={quantities[s.id]||''}
                    onChange={e=>setQuantities(q=>({...q,[s.id]:e.target.value}))}
                    style={{width:60,padding:'0.35rem 0.5rem',border:'1px solid '+gl,borderRadius:3,fontFamily:ff,fontSize:'0.75rem',outline:'none',textAlign:'center'}}/>
                  <div style={{fontSize:'0.6rem',color:gray,width:20,textAlign:'center'}}>{unitLabel(s.unit)}</div>
                  <div style={{fontSize:'0.72rem',fontWeight:600,color:calcLineTotal(s,quantities[s.id])>0?'#c0392b':gray,width:60,textAlign:'right'}}>
                    {calcLineTotal(s,quantities[s.id])>0?'$'+calcLineTotal(s,quantities[s.id]).toFixed(2):'—'}
                  </div>
                </div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:'0.75rem',marginTop:'0.25rem',borderTop:'1px solid rgba(31,20,14,0.08)'}}>
                <span style={{fontSize:'0.62rem',color:gray,letterSpacing:'0.08em',textTransform:'uppercase'}}>Total</span>
                <span style={{fontFamily:ffS,fontSize:'1.1rem',fontWeight:400,color:'#c0392b'}}>${suppliesTotal.toFixed(2)}</span>
              </div>
              <button onClick={saveSuppliesExpense} style={{width:'100%',marginTop:'0.85rem',background:black,color:white,border:'none',padding:'0.75rem',fontFamily:ff,fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Guardar Gasto</button>
            </>
          }
        </div>
      )}

      {/* EXPENSE LIST */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
        <div style={{fontSize:'0.56rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'#7A6452'}}>Historial de Gastos</div>
        {expenses.length>0&&<div style={{fontSize:'0.68rem',fontWeight:600,color:'#c0392b'}}>Total: ${total.toFixed(2)}</div>}
      </div>
      {expenses.length===0
        ?<div style={{fontSize:'0.72rem',color:'#7A6452',textAlign:'center',padding:'0.75rem 0'}}>Sin gastos registrados.</div>
        :<div style={{border:'1px solid rgba(31,20,14,0.07)',borderRadius:8,overflow:'hidden'}}>
          {expenses.map((e,i)=>(
            <div key={e.id} style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.75rem 1rem',borderBottom:i<expenses.length-1?'1px solid rgba(31,20,14,0.05)':'none'}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'0.72rem',color:'#1F140E',fontWeight:500}}>{e.description||'—'}</div>
                <div style={{display:'flex',gap:'0.5rem',marginTop:'0.15rem'}}>
                  <span style={{fontSize:'0.58rem',color:'#7A6452'}}>{e.expense_date}</span>
                  {e.recurring&&<span style={{fontSize:'0.55rem',padding:'0.1rem 0.45rem',borderRadius:20,background:'rgba(52,152,219,0.1)',color:'#2980b9'}}>↻ {e.recurring_interval}</span>}
                  {e.line_items&&<span style={{fontSize:'0.55rem',padding:'0.1rem 0.45rem',borderRadius:20,background:'rgba(227,90,27,0.1)',color:gold}}>Inventario</span>}
                </div>
              </div>
              <div style={{fontSize:'0.78rem',fontWeight:600,color:'#c0392b',flexShrink:0}}>-${parseFloat(e.amount).toFixed(2)}</div>
              <button onClick={()=>del(e.id)} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(192,57,43,0.4)',fontSize:'0.75rem',padding:0,flexShrink:0}}>x</button>
            </div>
          ))}
        </div>
      }
    </div>
  )
}

function VentasCard({ sales }) {
  const [expanded, setExpanded] = useState(false)
  const [activeChart, setActiveChart] = useState(null)
  const [chartVisible, setChartVisible] = useState(false)
  const [period, setPeriod] = useState('yearly')
  const [salesHistoryOpen, setSalesHistoryOpen] = useState(false)

  function openChart(id) {
    if (activeChart === id) {
      // toggle off
      setChartVisible(false)
      setTimeout(() => setActiveChart(null), 220)
    } else if (activeChart) {
      // switch chart — fade out then in
      setChartVisible(false)
      setTimeout(() => { setActiveChart(id); setChartVisible(true) }, 220)
    } else {
      // first open
      setActiveChart(id)
      setTimeout(() => setChartVisible(true), 20)
    }
  }

  const paid = (sales||[]).filter(s=>s.status==='paid')
  const refunds = (sales||[]).filter(s=>s.status==='refunded')
  const grossSales = paid.reduce((a,s)=>a+parseFloat(s.amount||0),0)
  const refunded = refunds.reduce((a,s)=>a+Math.abs(parseFloat(s.amount||0)),0)
  const netSales = grossSales - refunded
  const avgOrder = paid.length>0?grossSales/paid.length:0

  const now = new Date()
  const ytdSales = paid.filter(s=>new Date(s.sale_date).getFullYear()===now.getFullYear()).reduce((a,s)=>a+parseFloat(s.amount||0),0)
  const thisMonthSales = paid.filter(s=>{const d=new Date(s.sale_date);return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth()}).reduce((a,s)=>a+parseFloat(s.amount||0),0)


  // ── Period builders ──────────────────────────────────────────────
  function buildData(items, valueKey, period) {
    const map = {}
    const filtered = items.filter(s => {
      const d = new Date(s.sale_date)
      if (period === 'weekly') { const wk = new Date(now); wk.setDate(now.getDate()-27); return d >= wk }
      if (period === 'monthly') return d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth()
      if (period === 'ytd') return d.getFullYear()===now.getFullYear()
      if (period === 'yearly') return true
      return true
    })

    filtered.forEach(s => {
      const d = new Date(s.sale_date)
      let key
      if (period === 'weekly')  key = d.toLocaleDateString('en-US',{month:'short',day:'numeric'})
      else if (period === 'monthly') key = d.toLocaleDateString('en-US',{month:'short',day:'numeric'})
      else if (period === 'ytd') key = d.toLocaleDateString('en-US',{month:'short'})
      else key = d.toLocaleDateString('en-US',{month:'short',year:'2-digit'})
      map[key] = (map[key]||0) + Math.abs(parseFloat(s[valueKey]||0))
    })

    if (period === 'weekly') {
      const result = []
      for (let i=27; i>=0; i--) {
        const d = new Date(now); d.setDate(now.getDate()-i)
        const key = d.toLocaleDateString('en-US',{month:'short',day:'numeric'})
        if (!result.find(r=>r[0]===key)) result.push([key, map[key]||0])
      }
      // Group by week
      const weeks = []
      for (let i=0; i<4; i++) {
        const slice = result.slice(i*7, i*7+7)
        const label = slice[0]?.[0] + ' – ' + slice[slice.length-1]?.[0]
        weeks.push([label, slice.reduce((a,b)=>a+b[1],0)])
      }
      return weeks
    }
    if (period === 'monthly') {
      const result = []
      const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate()
      for (let i=1; i<=daysInMonth; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), i)
        const key = d.toLocaleDateString('en-US',{month:'short',day:'numeric'})
        result.push([key, map[key]||0])
      }
      return result
    }
    if (period === 'ytd') {
      const result = []
      for (let i=0; i<=now.getMonth(); i++) {
        const d = new Date(now.getFullYear(), i, 1)
        const key = d.toLocaleDateString('en-US',{month:'short'})
        result.push([key, map[key]||0])
      }
      return result
    }
    // yearly — last 12 months
    const result = []
    for (let i=11; i>=0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth()-i, 1)
      const key = d.toLocaleDateString('en-US',{month:'short',year:'2-digit'})
      result.push([key, map[key]||0])
    }
    return result
  }

  function buildAOV(items, period) {
    const filtered = items.filter(s => {
      const d = new Date(s.sale_date)
      if (period === 'weekly') { const wk = new Date(now); wk.setDate(now.getDate()-27); return d >= wk }
      if (period === 'monthly') return d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth()
      if (period === 'ytd') return d.getFullYear()===now.getFullYear()
      return true
    })
    const map = {}
    filtered.forEach(s => {
      const d = new Date(s.sale_date)
      let key
      if (period === 'monthly') key = d.toLocaleDateString('en-US',{month:'short',day:'numeric'})
      else if (period === 'ytd') key = d.toLocaleDateString('en-US',{month:'short'})
      else key = d.toLocaleDateString('en-US',{month:'short',year:'2-digit'})
      if (!map[key]) map[key] = {sum:0,count:0}
      map[key].sum += parseFloat(s.amount||0)
      map[key].count += 1
    })
    const base = buildData(items, 'amount', period)
    return base.map(([key]) => [key, map[key] ? map[key].sum/map[key].count : 0])
  }

  function buildServices(items, period) {
    const filtered = items.filter(s => {
      const d = new Date(s.sale_date)
      if (period === 'weekly') { const wk = new Date(now); wk.setDate(now.getDate()-27); return d >= wk }
      if (period === 'monthly') return d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth()
      if (period === 'ytd') return d.getFullYear()===now.getFullYear()
      return true
    })
    const map = {}
    filtered.forEach(s => {
      const name = s.product_name||'Other'
      map[name] = (map[name]||0) + parseFloat(s.amount||0)
    })
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5)
  }

  // Chart definitions — period-aware (period comes from modal state)
  function getCharts(period) {
    return [
      { id:'revenue', label:'Revenue Over Time', getData: p=>buildData(paid,'amount',p),    color:'#2d8a60', prefix:'$', desc:'Gross revenue from paid transactions' },
      { id:'mrr',     label:'MRR',               getData: p=>buildData(paid.filter(s=>s.type==='recurring'||s.type==='subscription'),'amount',p), color:gold, prefix:'$', desc:'Monthly Recurring Revenue' },
      { id:'aov',     label:'Avg Order Value',    getData: p=>buildAOV(paid,p),              color:'#5b8dee', prefix:'$', desc:'Average transaction value' },
      { id:'refunds', label:'Refunds',            getData: p=>buildData(refunds,'amount',p), color:'#c0392b', prefix:'$', desc:'Refund totals' },
      { id:'services',label:'Revenue by Service', getData: p=>buildServices(paid,p),         color:gold,      prefix:'$', desc:'Revenue breakdown by product/service', isBar:true },
    ]
  }

  const charts = getCharts('yearly')


  // SVG area chart renderer — premium version
  function AreaChart({ data, color, prefix='$' }) {
    const [hovered, setHovered] = useState(null)
    const w=520, h=160, padX=56, padY=20, padR=16
    const vals = data.map(d=>d[1])
    const maxVal = Math.max(...vals, 1)
    const chartW = w - padX - padR
    const chartH = h - padY*2

    const pts = data.map(([,v],i)=>({
      x: padX + (i/(data.length-1||1))*chartW,
      y: padY + (1-(v/maxVal))*chartH
    }))

    // Smooth bezier curve
    function smoothPath(points) {
      if (points.length < 2) return ''
      let d = `M ${points[0].x} ${points[0].y}`
      for (let i = 1; i < points.length; i++) {
        const prev = points[i-1], curr = points[i]
        const cpx = (prev.x + curr.x) / 2
        d += ` C ${cpx} ${prev.y} ${cpx} ${curr.y} ${curr.x} ${curr.y}`
      }
      return d
    }

    const linePath = smoothPath(pts)
    const areaPath = pts.length > 1
      ? `${linePath} L ${pts[pts.length-1].x} ${h-padY} L ${pts[0].x} ${h-padY} Z`
      : ''

    const gridLevels = [0, 0.25, 0.5, 0.75, 1]
    const gradId = `grad-${color.replace('#','')}`

    return (
      <div style={{width:'100%',position:'relative',userSeleccionar:'none'}}>
        {/* Tooltip */}
        {hovered!==null && (
          <div style={{
            position:'absolute',
            left: pts[hovered]?.x / w * 100 + '%',
            top: 0,
            transform:'translateX(-50%)',
            background:black,
            color:white,
            padding:'0.4rem 0.7rem',
            borderRadius:6,
            fontSize:'0.62rem',
            fontFamily:ff,
            pointerEvents:'none',
            whiteSpace:'nowrap',
            zIndex:10,
            boxShadow:'0 4px 12px rgba(0,0,0,0.2)'
          }}>
            <div style={{fontWeight:600}}>{prefix}{data[hovered][1].toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
            <div style={{opacity:0.65,fontSize:'0.55rem',marginTop:'0.1rem'}}>{data[hovered][0]}</div>
          </div>
        )}
        <svg viewBox={`0 0 ${w} ${h}`} style={{width:'100%',height:'auto',display:'block',overflow:'visible'}}
          onMouseLeave={()=>setHovered(null)}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.22"/>
              <stop offset="100%" stopColor={color} stopOpacity="0"/>
            </linearGradient>
          </defs>

          {/* Grid lines + Y labels */}
          {gridLevels.map(pct=>{
            const y = padY + (1-pct)*chartH
            const val = maxVal*pct
            const label = val>=1000 ? '$'+(val/1000).toFixed(1)+'k' : prefix+val.toFixed(0)
            return <g key={pct}>
              <line x1={padX} y1={y} x2={w-padR} y2={y}
                stroke={pct===0?'rgba(31,20,14,0.12)':'rgba(31,20,14,0.06)'}
                strokeWidth={pct===0?1.5:1} strokeDasharray={pct===0?'none':'4,4'}/>
              {pct>0&&<text x={padX-6} y={y+4} fontSize={9} fill={gray} textAnchor="end">{label}</text>}
            </g>
          })}

          {/* Area fill */}
          {areaPath&&<path d={areaPath} fill={`url(#${gradId})`}/>}

          {/* Smooth line */}
          {linePath&&<path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>}

          {/* Hover zones + dots */}
          {pts.map((p,i)=>(
            <g key={i} onMouseEnter={()=>setHovered(i)} style={{cursor:'crosshair'}}>
              {/* invisible hover zone */}
              <rect x={p.x-(chartW/(data.length*2))} y={padY} width={chartW/data.length} height={chartH} fill="transparent"/>
              {/* dot — always show if hovered, else small */}
              <circle cx={p.x} cy={p.y} r={hovered===i?5:3}
                fill={hovered===i?color:'white'}
                stroke={color} strokeWidth={2}
                style={{transition:'r 0.1s'}}/>
              {/* vertical line on hover */}
              {hovered===i&&<line x1={p.x} y1={padY} x2={p.x} y2={h-padY} stroke={color} strokeWidth={1} strokeDasharray="3,3" opacity={0.4}/>}
            </g>
          ))}
        </svg>

        {/* X labels */}
        <div style={{display:'flex',justifyContent:'space-between',paddingLeft:padX,paddingRight:padR,marginTop:'0.35rem'}}>
          {data.map(([m],i)=>{
            // Show every other label if > 7 points
            if (data.length > 7 && i % 2 !== 0 && i !== data.length-1) return <span key={i}/>
            return <span key={i} style={{fontSize:'0.52rem',color:hovered===i?black:gray,fontWeight:hovered===i?600:400,transition:'color 0.1s'}}>{m}</span>
          })}
        </div>
      </div>
    )
  }

  // Bar chart for services — premium version
  function BarChart({ data, color, prefix='$' }) {
    const [hovered, setHovered] = useState(null)
    const maxVal = Math.max(...data.map(d=>d[1]),1)
    const total = data.reduce((a,d)=>a+d[1],0)
    return (
      <div>
        {data.map(([name,val],i)=>{
          const pct = Math.round(val/total*100)
          return (
            <div key={name} style={{marginBottom:'1rem'}}
              onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:'0.35rem'}}>
                <span style={{fontSize:'0.7rem',color:hovered===i?black:gray,fontWeight:hovered===i?600:400,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'65%',transition:'color 0.15s'}}>{name}</span>
                <div style={{display:'flex',alignItems:'baseline',gap:'0.5rem',flexShrink:0}}>
                  <span style={{fontSize:'0.58rem',color:gray}}>{pct}%</span>
                  <span style={{fontSize:'0.82rem',fontWeight:600,color:black,fontFamily:ffS}}>{prefix}{val.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                </div>
              </div>
              <div style={{height:8,background:'rgba(31,20,14,0.06)',borderRadius:4,overflow:'hidden'}}>
                <div style={{height:'100%',width:(val/maxVal*100)+'%',background:hovered===i?color:color+'cc',borderRadius:4,transition:'width 0.4s, background 0.15s'}}/>
              </div>
            </div>
          )
        })}
        <div style={{marginTop:'1.25rem',paddingTop:'1rem',borderTop:'1px solid rgba(31,20,14,0.06)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:'0.58rem',color:gray,letterSpacing:'0.08em',textTransform:'uppercase'}}>Total Revenue</span>
          <span style={{fontSize:'1.1rem',fontFamily:ffS,fontWeight:400,color:black}}>{prefix}{total.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
        </div>
      </div>
    )
  }

  const activeChartDef = getCharts(period).find(c=>c.id===activeChart)

  async function voidSale(saleId) {
    if (!confirm('Void this transaction?')) return
    await fetch('/api/admin/sales', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: saleId, status: 'voided' })
    })
    window.location.reload()
  }

  return(
    <>
      {/* SALES HISTORY MODAL */}
      {salesHistoryOpen&&(
        <div style={{position:'fixed',inset:0,background:'rgba(31,20,14,0.6)',zIndex:400,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&setSalesHistoryOpen(false)}>
          <div style={{background:white,borderRadius:'14px 14px 0 0',width:'100%',maxWidth:640,maxHeight:'85vh',display:'flex',flexDirection:'column',boxShadow:'0 -8px 40px rgba(0,0,0,0.15)'}}>
            <div style={{padding:'1.25rem 1.5rem',borderBottom:'1px solid rgba(31,20,14,0.06)',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
              <div>
                <div style={{fontFamily:ffS,fontSize:'1.2rem',fontWeight:400}}>Todas las Transacciones</div>
                <div style={{fontSize:'0.6rem',color:gray,marginTop:'0.15rem'}}>{(sales||[]).length} records · tap Void to cancel</div>
              </div>
              <button onClick={()=>setSalesHistoryOpen(false)} style={{background:'none',border:'none',fontSize:'1.1rem',color:gray,cursor:'pointer'}}>✕</button>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'0 1.5rem'}}>
              {(sales||[]).length===0&&<div style={{textAlign:'center',color:gray,fontSize:'0.78rem',padding:'2rem'}}>Sin transacciones aún.</div>}
              {[...(sales||[])].sort((a,b)=>new Date(b.sale_date)-new Date(a.sale_date)).map((s,i)=>{
                const isVoided = s.status==='voided'
                const isRefunded = s.status==='refunded'
                return(
                  <div key={s.id} style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.85rem 0',borderBottom:'1px solid rgba(31,20,14,0.05)',opacity:isVoided?0.45:1}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:'0.75rem',color:black,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.customer_name||s.customer_email||'—'}</div>
                      <div style={{fontSize:'0.62rem',color:gray,marginTop:'0.1rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.product_name||'—'}</div>
                      <div style={{fontSize:'0.58rem',color:'rgba(31,20,14,0.35)',marginTop:'0.1rem'}}>{s.sale_date?new Date(s.sale_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):''} · {s.type||'stripe'}</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontSize:'0.85rem',fontWeight:600,fontFamily:ffS,color:isVoided?gray:isRefunded?'#c0392b':'#2d8a60'}}>{isRefunded?'-':''}${Math.abs(parseFloat(s.amount||0)).toFixed(2)}</div>
                      <span style={{fontSize:'0.52rem',padding:'0.15rem 0.5rem',borderRadius:20,background:isVoided?'rgba(31,20,14,0.06)':isRefunded?'rgba(192,57,43,0.08)':'rgba(45,138,96,0.08)',color:isVoided?gray:isRefunded?'#c0392b':'#2d8a60',display:'inline-block',marginTop:'0.2rem'}}>{s.status}</span>
                    </div>
                    {!isVoided&&!isRefunded&&(
                      <button onClick={()=>voidSale(s.id)} style={{flexShrink:0,padding:'0.3rem 0.65rem',background:'rgba(192,57,43,0.08)',color:'#c0392b',border:'1px solid rgba(192,57,43,0.15)',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.54rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>Anular</button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
      {/* Chart Modal */}
      {activeChart && activeChartDef && (
        <div style={{position:'fixed',inset:0,background:'rgba(31,20,14,0.55)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}} onClick={e=>e.target===e.currentTarget&&openChart(activeChart)}>
          <div style={{background:white,borderRadius:14,width:'100%',maxWidth:640,maxHeight:'88vh',overflowY:'auto',boxShadow:'0 24px 60px rgba(0,0,0,0.18)',transition:'opacity 0.22s',opacity:chartVisible?1:0}}>
            {/* Modal header */}
            <div style={{padding:'1.25rem 1.5rem',borderBottom:'1px solid rgba(31,20,14,0.07)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontFamily:ffS,fontSize:'1.15rem',fontWeight:400,color:black}}>{activeChartDef.label}</div>
                <div style={{fontSize:'0.58rem',color:gray,marginTop:'0.2rem'}}>{activeChartDef.desc}</div>
              </div>
              <button onClick={()=>openChart(activeChart)} style={{background:'none',border:'none',fontSize:'1.1rem',color:gray,cursor:'pointer',padding:'0.25rem 0.5rem'}}>✕</button>
            </div>

            {/* Period selector + chart switcher */}
            <div style={{padding:'0.85rem 1.5rem',borderBottom:'1px solid rgba(31,20,14,0.05)',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'0.5rem'}}>
              {/* Period pills */}
              <div style={{display:'flex',gap:'0.3rem'}}>
                {[['weekly','Semanal'],['monthly','Mensual'],['ytd','YTD'],['yearly','Anual']].map(([p,label])=>(
                  <button key={p} onClick={()=>setPeriod(p)} style={{
                    padding:'0.3rem 0.75rem',borderRadius:20,fontFamily:ff,fontSize:'0.58rem',cursor:'pointer',
                    border:'1px solid '+(period===p?black:'rgba(31,20,14,0.12)'),
                    background:period===p?black:'transparent',
                    color:period===p?white:gray,
                    transition:'all 0.15s'
                  }}>{label}</button>
                ))}
              </div>
              {/* Chart switcher */}
              <div style={{display:'flex',gap:'0.3rem',flexWrap:'wrap'}}>
                {getCharts(period).map(c=>(
                  <button key={c.id} onClick={()=>openChart(c.id)} style={{padding:'0.3rem 0.65rem',borderRadius:20,border:`1px solid ${activeChart===c.id?c.color:'rgba(31,20,14,0.1)'}`,background:activeChart===c.id?c.color+'18':'transparent',color:activeChart===c.id?c.color:gray,fontSize:'0.56rem',fontFamily:ff,cursor:'pointer',display:'flex',alignItems:'center',gap:'0.25rem',transition:'all 0.15s'}}>
                    <span style={{width:5,height:5,borderRadius:'50%',background:c.color,display:'inline-block',flexShrink:0}}/>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart content */}
            <div style={{padding:'1.25rem 1.5rem',transition:'opacity 0.22s',opacity:chartVisible?1:0}}>
              {(()=>{
                const chartData = activeChartDef.getData(period)
                const isEmpty = chartData.every(d=>d[1]===0)
                return <>
                  {!isEmpty && !activeChartDef.isBar && (()=>{
                    const vals = chartData.map(d=>d[1]).filter(v=>v>0)
                    const total = vals.reduce((a,b)=>a+b,0)
                    const avg = vals.length>0?total/vals.length:0
                    const peak = Math.max(...vals,0)
                    const peakLabel = chartData.find(d=>d[1]===peak)?.[0]||'—'
                    return (
                      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.75rem',marginBottom:'1.5rem'}}>
                        {[['Total',activeChartDef.prefix+total.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),'#2d8a60'],
                          ['Avg',activeChartDef.prefix+avg.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),gold],
                          ['Peak',peakLabel,'#5b8dee']
                        ].map(([label,val,color])=>(
                          <div key={label} style={{textAlign:'center',background:'rgba(31,20,14,0.025)',borderRadius:8,padding:'0.75rem 0.5rem'}}>
                            <div style={{fontSize:'0.95rem',fontFamily:ffS,fontWeight:400,color,lineHeight:1}}>{val}</div>
                            <div style={{fontSize:'0.5rem',color:gray,letterSpacing:'0.07em',textTransform:'uppercase',marginTop:'0.25rem'}}>{label}</div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                  {activeChartDef.isBar
                    ? <BarChart data={chartData} color={activeChartDef.color} prefix={activeChartDef.prefix}/>
                    : <AreaChart data={chartData} color={activeChartDef.color} prefix={activeChartDef.prefix}/>
                  }
                  {isEmpty&&<div style={{textAlign:'center',color:gray,fontSize:'0.72rem',padding:'2rem 0'}}>No data for this period.</div>}
                </>
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Ventas Card */}
      <div style={{background:white,borderRadius:10,border:'1px solid rgba(31,20,14,0.07)',overflow:'hidden',marginBottom:'1.5rem'}}>

        {/* HEADER — always shows KPIs */}
        <div style={{padding:'1rem 1.5rem 0'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.85rem'}}>
            <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
              <div style={{fontFamily:ffS,fontSize:'1.1rem',fontWeight:400}}>Ventas <span style={{fontSize:'0.52rem',color:gold,letterSpacing:'0.1em',textTransform:'uppercase',marginLeft:'0.5rem'}}>Stripe</span></div>
              <button onClick={()=>setSalesHistoryOpen(true)} style={{fontSize:'0.58rem',color:'#2980b9',background:'rgba(52,152,219,0.08)',border:'1px solid rgba(52,152,219,0.2)',borderRadius:20,padding:'0.22rem 0.65rem',cursor:'pointer',fontFamily:ff,letterSpacing:'0.06em',textTransform:'uppercase'}}>{paid.length} sales ›</button>
            </div>
            <button onClick={()=>setExpanded(e=>!e)} style={{display:'flex',alignItems:'center',gap:'0.3rem',background:'none',border:'1px solid rgba(31,20,14,0.1)',borderRadius:20,cursor:'pointer',color:gray,fontSize:'0.58rem',padding:'0.22rem 0.65rem',fontFamily:ff,letterSpacing:'0.06em',textTransform:'uppercase',transition:'all 0.15s'}}>
              {expanded?'Menos':'Más'} <span style={{display:'inline-block',transform:expanded?'rotate(180deg)':'rotate(0)',transition:'transform 0.2s',lineHeight:1}}>▾</span>
            </button>
          </div>

          {/* KPIs — always visible */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.5rem',marginBottom:'1rem'}}>
            {[
              ['Ventas YTD', '$'+ytdSales.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}), '#2d8a60'],
              ['Este Mes',  '$'+thisMonthSales.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}), gold],
              ['Ticket Prom.',   '$'+avgOrder.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}), '#5b8dee'],
            ].map(([label,val,color])=>(
              <div key={label} style={{textAlign:'center',background:'rgba(31,20,14,0.025)',borderRadius:8,padding:'0.65rem 0.25rem'}}>
                <div style={{fontSize:'0.95rem',fontFamily:ffS,fontWeight:400,color,lineHeight:1}}>{val}</div>
                <div style={{fontSize:'0.5rem',color:gray,letterSpacing:'0.07em',textTransform:'uppercase',marginTop:'0.25rem'}}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* EXPANDED — chart chips */}
        {expanded&&(
          <div style={{borderTop:'1px solid rgba(31,20,14,0.06)',padding:'0.85rem 1.5rem'}}>
            <div style={{fontSize:'0.5rem',letterSpacing:'0.14em',textTransform:'uppercase',color:gray,marginBottom:'0.6rem'}}>Gráficas — toca para ver</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'0.4rem'}}>
              {getCharts('yearly').map(c=>(
                <button key={c.id} onClick={()=>openChart(c.id)} style={{
                  padding:'0.4rem 0.85rem',
                  borderRadius:20,
                  border:`1px solid ${activeChart===c.id?c.color:'rgba(31,20,14,0.12)'}`,
                  background: activeChart===c.id?c.color+'18':'transparent',
                  color: c.color,
                  fontSize:'0.6rem',
                  fontFamily:ff,
                  cursor:'pointer',
                  display:'flex',
                  alignItems:'center',
                  gap:'0.3rem',
                  transition:'all 0.15s'
                }}>
                  <span style={{width:6,height:6,borderRadius:'50%',background:c.color,display:'inline-block',flexShrink:0}}/>
                  {c.label}
                </button>
              ))}
            </div>
            {paid.length===0&&<div style={{textAlign:'center',fontSize:'0.72rem',color:gray,padding:'0.75rem 0 0'}}>No Stripe payments recorded yet.</div>}
          </div>
        )}
      </div>
    </>
  )
}

function SupplyCostHistory({ supplyId }) {
  const [history, setHistory] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    if (!open || history.length>0) return
    setLoading(true)
    fetch('/api/admin/supplies?history='+supplyId)
      .then(r=>r.json())
      .then(d=>{ setHistory(d.history||[]); setLoading(false) })
      .catch(()=>setLoading(false))
  },[open, supplyId])

  return(
    <div style={{marginTop:'0.5rem'}}>
      <button onClick={()=>setOpen(o=>!o)} style={{display:'flex',alignItems:'center',gap:'0.3rem',background:'none',border:'none',cursor:'pointer',fontFamily:ff,fontSize:'0.54rem',color:gray,letterSpacing:'0.08em',textTransform:'uppercase',padding:0}}>
        Cost History {open?'▴':'▾'}
      </button>
      {open&&(
        <div style={{marginTop:'0.4rem',border:'1px solid rgba(31,20,14,0.07)',borderRadius:6,overflow:'hidden',maxHeight:140,overflowY:'auto'}}>
          {loading&&<div style={{padding:'0.5rem 0.85rem',fontSize:'0.62rem',color:gray}}>Cargando...</div>}
          {!loading&&history.length===0&&<div style={{padding:'0.5rem 0.85rem',fontSize:'0.62rem',color:gray}}>Sin historial.</div>}
          {!loading&&history.map((h,i)=>(
            <div key={h.id||i} style={{display:'flex',justifyContent:'space-between',padding:'0.5rem 0.85rem',borderBottom:i<history.length-1?'1px solid rgba(31,20,14,0.05)':'none'}}>
              <span style={{fontSize:'0.7rem',fontWeight:600,color:black}}>${parseFloat(h.cost).toFixed(2)}</span>
              <span style={{fontSize:'0.6rem',color:gray}}>{new Date(h.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SuppliesPanel({ supplies, onAdd, onEdit, onDelete, showToast, loadAll }) {
  const categories = [...new Set(supplies.map(s=>s.category).filter(Boolean))]

  const unitLabel = u => u==='month'?'/mo':u==='year'?'/yr':u==='one-time'?' once':'/'+u

  // Totals
  const monthlyTotal = supplies.filter(s=>s.active).reduce((a,s)=>{
    if (s.unit==='month') return a+parseFloat(s.cost||0)
    if (s.unit==='year') return a+parseFloat(s.cost||0)/12
    return a
  },0)
  const yearlyTotal = supplies.filter(s=>s.active).reduce((a,s)=>{
    if (s.unit==='month') return a+parseFloat(s.cost||0)*12
    if (s.unit==='year') return a+parseFloat(s.cost||0)
    return a
  },0)

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem'}}>
        <h2 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:400}}>Inventario</h2>
        <button onClick={onAdd} style={{background:black,color:white,border:'none',padding:'0.6rem 1.1rem',fontFamily:ff,fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>+ Añadir</button>
      </div>

      {/* Totals row */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1.5rem'}}>
        {[['Costo Mensual','$'+monthlyTotal.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),'#c0392b'],
          ['Costo Anual','$'+yearlyTotal.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),'#c0392b']
        ].map(([label,val,color])=>(
          <div key={label} style={{background:white,borderRadius:10,padding:'1.25rem',border:'1px solid rgba(31,20,14,0.07)',textAlign:'center'}}>
            <div style={{fontFamily:ffS,fontSize:'1.4rem',fontWeight:400,color}}>{val}</div>
            <div style={{fontSize:'0.56rem',color:gray,letterSpacing:'0.1em',textTransform:'uppercase',marginTop:'0.25rem'}}>{label}</div>
          </div>
        ))}
      </div>

      {/* Grid */}
      {supplies.length===0&&<div style={{background:white,borderRadius:10,padding:'2rem',textAlign:'center',color:gray,fontSize:'0.82rem',border:'1px solid rgba(31,20,14,0.07)'}}>No hay insumos. Añade el primero.</div>}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'0.85rem'}}>
        {supplies.map(s=>(
          <div key={s.id} style={{background:white,borderRadius:10,border:'1px solid rgba(31,20,14,0.07)',padding:'1.1rem',display:'flex',flexDirection:'column',gap:'0.4rem',opacity:s.active?1:0.5}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div style={{fontFamily:ffS,fontSize:'1rem',fontWeight:400,color:black,lineHeight:1.3,flex:1,marginRight:'0.5rem'}}>{s.name}</div>
              <div style={{display:'flex',gap:'0.3rem',flexShrink:0}}>
                <button onClick={()=>onEdit(s)} style={{background:'none',border:'none',cursor:'pointer',color:gray,fontSize:'0.65rem',padding:'0.1rem 0.3rem',fontFamily:ff}}>✎</button>
                <button onClick={()=>onDelete(s.id)} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(192,57,43,0.5)',fontSize:'0.75rem',padding:'0.1rem 0.3rem'}}>×</button>
              </div>
            </div>
            {s.category&&<span style={{fontSize:'0.52rem',padding:'0.15rem 0.5rem',borderRadius:20,background:'rgba(31,20,14,0.05)',color:gray,width:'fit-content',letterSpacing:'0.06em',textTransform:'uppercase'}}>{s.category}</span>}
            {s.provider&&<div style={{fontSize:'0.62rem',color:gray,fontStyle:'italic'}}>{s.provider}</div>}
            <div style={{marginTop:'auto',paddingTop:'0.5rem',borderTop:'1px solid rgba(31,20,14,0.05)',display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
              <span style={{fontFamily:ffS,fontSize:'1.15rem',fontWeight:400,color:'#c0392b'}}>${parseFloat(s.cost).toFixed(2)}</span>
              <span style={{fontSize:'0.58rem',color:gray}}>{unitLabel(s.unit)}</span>
            </div>
            {s.renewal_date&&<div style={{fontSize:'0.58rem',color:gold}}>Renews {new Date(s.renewal_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'0.5rem',paddingTop:'0.5rem',borderTop:'1px solid rgba(31,20,14,0.05)'}}>
                <span style={{fontSize:'0.62rem',color:gray,letterSpacing:'0.06em',textTransform:'uppercase'}}>Disponible</span>
                <button onClick={async()=>{
                  await fetch('/api/admin/supplies',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:s.id,active:!s.active})})
                  loadAll&&loadAll()
                }} style={{width:36,height:20,borderRadius:10,background:s.active?gold:'rgba(31,20,14,0.15)',border:'none',cursor:'pointer',position:'relative',transition:'background 0.2s',padding:0}}>
                  <div style={{position:'absolute',top:2,left:s.active?'18px':'2px',width:16,height:16,borderRadius:'50%',background:'white',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
                </button>
              </div>
            <SupplyCostHistory supplyId={s.id}/>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatCalendarTime(ev) {
  if (!ev.start?.dateTime) return 'Todo el día'
  return new Date(ev.start.dateTime).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})
}

function AgendaEvent({ ev, todayFlag }) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const d = new Date(ev.start?.dateTime||ev.start?.date)
  const name = ev.summary || 'Booking'

  async function loadNotes() {
    if (loaded) return
    const res = await fetch('/api/admin/booking-notes?event_id='+encodeURIComponent(ev.id))
    const data = await res.json()
    setNotes(data.notes||'')
    setLoaded(true)
  }

  async function saveNotes() {
    setSaving(true)
    await fetch('/api/admin/booking-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: ev.id, notes })
    })
    setSaving(false)
  }

  function handleOpen() {
    setOpen(o=>!o)
    if (!open) loadNotes()
  }

  return (
    <div style={{borderBottom:'1px solid rgba(31,20,14,0.05)'}}>
      <div onClick={handleOpen} style={{display:'flex',alignItems:'center',gap:'1rem',padding:'0.85rem 1.25rem',cursor:'pointer',background:open?'rgba(31,20,14,0.02)':'transparent'}}>
        <div style={{flexShrink:0,textAlign:'center',minWidth:44}}>
          <div style={{fontSize:'0.55rem',color:'#7A6452',textTransform:'uppercase'}}>{d.toLocaleDateString('en-US',{month:'short'})}</div>
          <div style={{fontSize:'1.3rem',fontFamily:ffS,fontWeight:400,color:todayFlag?gold:black,lineHeight:1}}>{d.getDate()}</div>
          <div style={{fontSize:'0.52rem',color:'#7A6452'}}>{d.toLocaleDateString('en-US',{weekday:'short'})}</div>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:'0.78rem',color:black,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name}</div>
          <div style={{fontSize:'0.6rem',color:gold,marginTop:'0.1rem'}}>{formatCalendarTime(ev)}</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'0.5rem',flexShrink:0}}>
          {todayFlag&&<span style={{fontSize:'0.52rem',padding:'0.15rem 0.5rem',borderRadius:20,background:'rgba(227,90,27,0.12)',color:gold}}>Hoy</span>}
          <span style={{fontSize:'0.65rem',color:'#7A6452',transform:open?'rotate(180deg)':'rotate(0)',display:'inline-block',transition:'transform 0.2s'}}>▾</span>
        </div>
      </div>
      {open&&(
        <div style={{padding:'0 1.25rem 1.25rem',borderTop:'1px solid rgba(31,20,14,0.04)'}}>
          {ev.description&&(()=>{
            // Parse Google Calendar HTML description into label/value pairs
            const raw = ev.description
              .replace(/<br\s*\/?>/gi, '\n')
              .replace(/<b>(.*?)<\/b>/gi, '|||$1|||')
              .replace(/<[^>]+>/g, '')
            const lines = raw.split('\n').map(l=>l.trim()).filter(Boolean)
            const fields = []
            let currentLabel = null
            lines.forEach(line => {
              if (line.startsWith('|||') && line.endsWith('|||')) {
                currentLabel = line.replace(/\|\|\|/g,'').trim()
              } else if (currentLabel) {
                fields.push({ label: currentLabel, value: line })
                currentLabel = null
              } else {
                fields.push({ label: null, value: line })
              }
            })
            return (
              <div style={{marginBottom:'1rem',borderRadius:8,overflow:'hidden',border:'1px solid rgba(31,20,14,0.07)'}}>
                <div style={{padding:'0.6rem 0.85rem',background:'rgba(31,20,14,0.03)',fontSize:'0.5rem',letterSpacing:'0.1em',textTransform:'uppercase',color:gray,borderBottom:'1px solid rgba(31,20,14,0.06)'}}>Info del Cliente</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0'}}>
                  {fields.filter(f=>f.label).map((f,j)=>(
                    <div key={j} style={{padding:'0.65rem 0.85rem',borderBottom:'1px solid rgba(31,20,14,0.04)',borderRight:j%2===0?'1px solid rgba(31,20,14,0.04)':'none'}}>
                      <div style={{fontSize:'0.5rem',color:gray,letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:'0.2rem'}}>{f.label}</div>
                      <div style={{fontSize:'0.72rem',color:f.value?black:'rgba(31,20,14,0.25)',fontWeight:f.value?500:400}}>{f.value||'—'}</div>
                    </div>
                  ))}
                </div>
                {fields.filter(f=>!f.label).map((f,j)=>(
                  <div key={'n'+j} style={{padding:'0.65rem 0.85rem',borderTop:'1px solid rgba(31,20,14,0.04)',fontSize:'0.65rem',color:gray,lineHeight:1.6,fontStyle:'italic'}}>{f.value}</div>
                ))}
              </div>
            )
          })()}
          {ev.location&&<div style={{fontSize:'0.62rem',color:'#7A6452',marginBottom:'0.75rem'}}>{ev.location}</div>}
          {ev.end?.dateTime&&<div style={{fontSize:'0.62rem',color:gold,marginBottom:'0.75rem'}}>{formatCalendarTime(ev)} – {new Date(ev.end.dateTime).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}</div>}
          <div style={{fontSize:'0.5rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'#7A6452',marginBottom:'0.4rem'}}>Notas</div>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notas sobre esta reserva..." rows={3}
            style={{width:'100%',padding:'0.65rem',border:'1px solid rgba(31,20,14,0.10)',borderRadius:4,fontFamily:ff,fontSize:'0.72rem',outline:'none',resize:'vertical',boxSizing:'border-box',color:black,lineHeight:1.6}}/>
          <button onClick={saveNotes} disabled={saving}
            style={{marginTop:'0.4rem',padding:'0.45rem 1rem',background:black,color:white,border:'none',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.58rem',letterSpacing:'0.1em',textTransform:'uppercase',opacity:saving?0.6:1}}>
            {saving?'Guardando…':'Guardar Notas'}
          </button>
        </div>
      )}
    </div>
  )
}

function BookingsPanel() {
  const CALENDAR_ID = 'jfuentes@accountingpluscrm.com'
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [view, setView] = useState('agenda')
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => { fetchEvents() }, [currentDate, view])

  async function fetchEvents() {
    setLoading(true); setError(null)
    try {
      const start = new Date(currentDate), end = new Date(currentDate)
      if (view==='week') { const day=start.getDay(); start.setDate(start.getDate()-day); end.setDate(start.getDate()+7) }
      else if (view==='month') { start.setDate(1); end.setMonth(end.getMonth()+1); end.setDate(0) }
      else { end.setDate(end.getDate()+30) }
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?key=${API_KEY}&timeMin=${start.toISOString()}&timeMax=${end.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=50`
      const res = await fetch(url)
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      const newItems = data.items||[]
      if (newItems.length > events.length && events.length > 0) {
        fetch('/api/admin/push?action=send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'New Booking',body:newItems[0]?.summary||'Someone booked a consultation',url:'/admin'})}).catch(()=>{})
      }
      setEvents(newItems)
    } catch(e) { setError('No se pudo cargar el calendario.') }
    setLoading(false)
  }

  function formatTime(ev) {
    if (!ev.start?.dateTime) return 'Todo el día'
    return new Date(ev.start.dateTime).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})
  }
  function isToday(ev) {
    return new Date(ev.start?.dateTime||ev.start?.date).toDateString()===new Date().toDateString()
  }
  function getEventsForDay(date) {
    if (!date) return []
    return events.filter(ev=>new Date(ev.start?.dateTime||ev.start?.date).toDateString()===date.toDateString())
  }
  function navPrev() {
    const d=new Date(currentDate)
    if(view==='month') d.setMonth(d.getMonth()-1)
    else if(view==='week') d.setDate(d.getDate()-7)
    else d.setDate(d.getDate()-30)
    setCurrentDate(d)
  }
  function navNext() {
    const d=new Date(currentDate)
    if(view==='month') d.setMonth(d.getMonth()+1)
    else if(view==='week') d.setDate(d.getDate()+7)
    else d.setDate(d.getDate()+30)
    setCurrentDate(d)
  }

  const navLabel = view==='month'
    ? currentDate.toLocaleDateString('en-US',{month:'long',year:'numeric'})
    : view==='week' ? 'Week of '+currentDate.toLocaleDateString('en-US',{month:'short',day:'numeric'})
    : 'Next 30 days'

  const weekDayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  function getMonthDays() {
    const y=currentDate.getFullYear(), m=currentDate.getMonth()
    const firstDay=new Date(y,m,1).getDay()
    const daysInMonth=new Date(y,m+1,0).getDate()
    const days=[]
    for(let i=0;i<firstDay;i++) days.push(null)
    for(let i=1;i<=daysInMonth;i++) days.push(new Date(y,m,i))
    return days
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem',flexWrap:'wrap',gap:'0.75rem'}}>
        <h2 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:400}}>Reservas</h2>
        <div style={{display:'flex',gap:'0.5rem',alignItems:'center',flexWrap:'wrap'}}>
          <button onClick={navPrev} style={{background:'none',border:'1px solid rgba(31,20,14,0.1)',borderRadius:20,padding:'0.3rem 0.75rem',cursor:'pointer',fontFamily:ff,fontSize:'0.72rem',color:gray}}>‹</button>
          <span style={{fontSize:'0.72rem',color:black,fontWeight:500,minWidth:140,textAlign:'center'}}>{navLabel}</span>
          <button onClick={navNext} style={{background:'none',border:'1px solid rgba(31,20,14,0.1)',borderRadius:20,padding:'0.3rem 0.75rem',cursor:'pointer',fontFamily:ff,fontSize:'0.72rem',color:gray}}>›</button>
          <div style={{display:'flex',gap:'0.3rem'}}>
            {[['month','Mes'],['week','Semana'],['agenda','Agenda']].map(([v,l])=>(
              <button key={v} onClick={()=>setView(v)} style={{padding:'0.35rem 0.75rem',borderRadius:20,border:'none',cursor:'pointer',fontFamily:ff,fontSize:'0.6rem',letterSpacing:'0.08em',textTransform:'uppercase',background:view===v?black:'rgba(31,20,14,0.06)',color:view===v?white:gray,transition:'all 0.15s'}}>{l}</button>
            ))}
          </div>
          <button onClick={fetchEvents} style={{background:'none',border:'1px solid rgba(31,20,14,0.08)',borderRadius:20,padding:'0.3rem 0.65rem',cursor:'pointer',fontFamily:ff,fontSize:'0.6rem',color:gray}}>↺</button>
        </div>
      </div>

      <div style={{background:white,borderRadius:10,border:'1px solid rgba(31,20,14,0.07)',overflow:'hidden'}}>
        {loading&&<div style={{padding:'3rem',textAlign:'center',color:gray,fontSize:'0.78rem'}}>Cargando...</div>}
        {error&&<div style={{padding:'3rem',textAlign:'center',color:'#c0392b',fontSize:'0.78rem'}}>{error}<br/><button onClick={fetchEvents} style={{marginTop:'0.75rem',background:black,color:white,border:'none',padding:'0.5rem 1rem',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.62rem'}}>Reintentar</button></div>}

        {/* MONTH */}
        {!loading&&!error&&view==='month'&&(
          <div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:'1px solid rgba(31,20,14,0.06)'}}>
              {weekDayNames.map(d=><div key={d} style={{padding:'0.5rem',textAlign:'center',fontSize:'0.52rem',letterSpacing:'0.1em',textTransform:'uppercase',color:gray}}>{d}</div>)}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
              {getMonthDays().map((date,i)=>{
                const dayEvs=getEventsForDay(date)
                const today=date&&date.toDateString()===new Date().toDateString()
                return(
                  <div key={i} style={{minHeight:80,padding:'0.4rem',borderRight:'1px solid rgba(31,20,14,0.04)',borderBottom:'1px solid rgba(31,20,14,0.04)',background:today?'rgba(227,90,27,0.04)':'transparent'}}>
                    {date&&<div style={{fontSize:'0.65rem',fontWeight:today?700:400,color:today?gold:black,width:22,height:22,borderRadius:'50%',background:today?'rgba(227,90,27,0.15)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'0.25rem'}}>{date.getDate()}</div>}
                    {dayEvs.slice(0,2).map((ev,j)=><div key={j} title={ev.summary} style={{fontSize:'0.52rem',background:'rgba(227,90,27,0.12)',color:gold,borderRadius:3,padding:'0.15rem 0.35rem',marginBottom:'0.15rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ev.summary||'Booking'}</div>)}
                    {dayEvs.length>2&&<div style={{fontSize:'0.5rem',color:gray}}>+{dayEvs.length-2}</div>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* WEEK */}
        {!loading&&!error&&view==='week'&&(()=>{
          const ws=new Date(currentDate); ws.setDate(ws.getDate()-ws.getDay())
          const wDates=Array.from({length:7},(_,i)=>{ const d=new Date(ws); d.setDate(d.getDate()+i); return d })
          return(
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
              {wDates.map((d,i)=>{
                const today=d.toDateString()===new Date().toDateString()
                const dayEvs=getEventsForDay(d)
                return(
                  <div key={i} style={{padding:'0.75rem 0.5rem',borderRight:'1px solid rgba(31,20,14,0.04)',background:today?'rgba(227,90,27,0.04)':'transparent',minHeight:150}}>
                    <div style={{fontSize:'0.52rem',color:gray,textTransform:'uppercase',letterSpacing:'0.08em'}}>{weekDayNames[i]}</div>
                    <div style={{fontSize:'0.88rem',fontWeight:today?700:400,color:today?gold:black,marginBottom:'0.4rem'}}>{d.getDate()}</div>
                    {dayEvs.map((ev,j)=><div key={j} style={{fontSize:'0.54rem',background:'rgba(227,90,27,0.1)',color:gold,borderRadius:3,padding:'0.2rem 0.4rem',marginBottom:'0.2rem',lineHeight:1.3}}><div style={{fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ev.summary||'Booking'}</div><div style={{opacity:0.7}}>{formatTime(ev)}</div></div>)}
                  </div>
                )
              })}
            </div>
          )
        })()}

        {/* AGENDA */}
        {!loading&&!error&&view==='agenda'&&(
          <div>
            {events.length===0&&<div style={{padding:'2rem',textAlign:'center',color:gray,fontSize:'0.78rem'}}>No hay eventos próximos.</div>}
            {events.map((ev,i)=><AgendaEvent key={ev.id||i} ev={ev} todayFlag={new Date(ev.start?.dateTime||ev.start?.date).toDateString()===new Date().toDateString()}/>)}
          </div>
        )}
      </div>
      <div style={{marginTop:'0.75rem',fontSize:'0.6rem',color:gray,textAlign:'center'}}>
        <a href="https://calendar.app.google/WsjR7tCs3VGwnJYB6" target="_blank" rel="noreferrer" style={{color:gold}}>Abrir página de reservas ↗</a>
      </div>
    </div>
  )
}


function AdminSystemPanel({ users, cards, allUsers, loadAll, showToast }) {
  const [tab, setTab] = useState('users')
  const [search, setSearch] = useState('')
  const [roleChanging, setRoleChanging] = useState(null)
  const [log, setLog] = useState([])
  const [logLoading, setLogLoading] = useState(false)
  const [sessions, setSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(false)

  useEffect(() => {
    if (tab === 'log') loadLog()
    if (tab === 'sessions') loadSessions()
  }, [tab])

  async function loadLog() {
    setLogLoading(true)
    try {
      const res = await fetch('/api/admin/activity-log')
      const data = await res.json()
      setLog(data.log || [])
    } catch(e) { console.error(e) }
    setLogLoading(false)
  }

  async function loadSessions() {
    setSessionsLoading(true)
    try {
      const res = await fetch('/api/admin/users?all=1')
      const data = await res.json()
      setSessions(data.users || [])
    } catch(e) { console.error(e) }
    setSessionsLoading(false)
  }

  async function changeRole(u) {
    const newRole = u.role === 'admin' ? 'client' : 'admin'
    setRoleChanging(u.id)
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, role: newRole })
    })
    await fetch('/api/admin/activity-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: newRole==='admin'?'Promoted to Admin':'Revoked Admin', target: u.business_name||u.full_name, type: 'role' })
    })
    showToast(`Role updated → ${newRole}`)
    setRoleChanging(null)
    loadAll()
  }

  const typeColor = { punch:'#2d8a60', create:gold, edit:'#5b8dee', file:'#8e44ad', reward:gold, delete:'#c0392b', role:'#e67e22' }
  const typeIcon  = { punch:'●', create:'+', edit:'✎', file:'↑', reward:'★', delete:'×', role:'⚑' }

  const displayUsers = (allUsers||users).filter(u =>
    (u.full_name||'').toLowerCase().includes(search.toLowerCase()) ||
    (u.business_name||'').toLowerCase().includes(search.toLowerCase()) ||
    (u.email||'').toLowerCase().includes(search.toLowerCase())
  )

  const filteredLog = log.filter(l =>
    (l.user_name||'').toLowerCase().includes(search.toLowerCase()) ||
    (l.action||'').toLowerCase().includes(search.toLowerCase()) ||
    (l.target||'').toLowerCase().includes(search.toLowerCase())
  )

  const filteredSessions = sessions.filter(u =>
    (u.full_name||'').toLowerCase().includes(search.toLowerCase()) ||
    (u.email||'').toLowerCase().includes(search.toLowerCase())
  )

  function getCard(uid) { return cards.find(c=>c.user_id===uid) }

  function timeAgo(ts) {
    if (!ts) return '—'
    const diff = (Date.now() - new Date(ts)) / 1000
    if (diff < 60) return 'Just now'
    if (diff < 3600) return Math.floor(diff/60) + ' min ago'
    if (diff < 86400) return Math.floor(diff/3600) + ' hr ago'
    if (diff < 172800) return 'Yesterday'
    return Math.floor(diff/86400) + ' days ago'
  }

  const tabStyle = (t) => ({
    padding:'0.5rem 1rem', borderRadius:20, border:'none', cursor:'pointer', fontFamily:ff,
    fontSize:'0.62rem', letterSpacing:'0.08em', textTransform:'uppercase',
    background: tab===t ? black : 'rgba(31,20,14,0.06)',
    color: tab===t ? white : gray,
    transition:'all 0.15s'
  })

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
        <h2 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:400}}>Configuración</h2>
          <div style={{fontSize:'0.65rem',color:gray,marginTop:'0.2rem',fontStyle:'italic'}}>Panadera · Dueña</div>
        <div style={{fontSize:'0.62rem',color:gray}}>{(allUsers||users).length} usuarios</div>
      </div>

      <input type="text" placeholder="Search users, actions, targets..." value={search} onChange={e=>setSearch(e.target.value)}
        style={{width:'100%',padding:'0.7rem 1rem',border:'1px solid '+gl,borderRadius:3,fontFamily:ff,fontSize:'0.82rem',outline:'none',marginBottom:'1.25rem',boxSizing:'border-box',background:white}}/>

      {/* Alertas — debajo de Admin/Panadera/Dueña */}
      <div style={{background:'rgba(227,90,27,0.06)',border:'1px solid rgba(227,90,27,0.15)',borderRadius:10,padding:'1rem 1.25rem',marginBottom:'1.25rem'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:getNotifications(cards).length>0?'0.75rem':'0'}}>
          <div style={{fontSize:'0.6rem',letterSpacing:'0.14em',textTransform:'uppercase',color:gold,fontWeight:600}}>Alertas</div>
          <span style={{fontSize:'0.6rem',color:gray}}>{getNotifications(cards).length} activa{getNotifications(cards).length!==1?'s':''}</span>
        </div>
        {getNotifications(cards).length===0
          ?<div style={{fontSize:'0.72rem',color:gray}}>Sin alertas — todos los clientes al día.</div>
          :getNotifications(cards).slice(0,3).map((alert,i)=>(
            <div key={i} style={{fontSize:'0.72rem',color:black,padding:'0.4rem 0',borderBottom:i<Math.min(getNotifications(cards).length,3)-1?'1px solid rgba(31,20,14,0.06)':'none'}}>{alert.msg}</div>
          ))
        }
        {getNotifications(cards).length>3&&<button onClick={()=>setPanel('notifications')} style={{marginTop:'0.5rem',background:'none',border:'none',cursor:'pointer',fontSize:'0.62rem',color:gold,fontFamily:ff,padding:0}}>Ver todas →</button>}
      </div>

      {/* Alertas — debajo de Admin/Panadera/Dueña */}
      <div style={{background:'rgba(227,90,27,0.06)',border:'1px solid rgba(227,90,27,0.15)',borderRadius:10,padding:'1rem 1.25rem',marginBottom:'1.25rem'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:getNotifications(cards).length>0?'0.75rem':'0'}}>
          <div style={{fontSize:'0.6rem',letterSpacing:'0.14em',textTransform:'uppercase',color:gold,fontWeight:600}}>Alertas</div>
          <span style={{fontSize:'0.6rem',color:gray}}>{getNotifications(cards).length} activa{getNotifications(cards).length!==1?'s':''}</span>
        </div>
        {getNotifications(cards).length===0
          ?<div style={{fontSize:'0.72rem',color:gray}}>Sin alertas — todos los clientes al día.</div>
          :getNotifications(cards).slice(0,3).map((alert,i)=>(
            <div key={i} style={{fontSize:'0.72rem',color:black,padding:'0.4rem 0',borderBottom:i<Math.min(getNotifications(cards).length,3)-1?'1px solid rgba(31,20,14,0.06)':'none'}}>{alert.msg}</div>
          ))
        }
        {getNotifications(cards).length>3&&<button onClick={()=>setPanel('notifications')} style={{marginTop:'0.5rem',background:'none',border:'none',cursor:'pointer',fontSize:'0.62rem',color:gold,fontFamily:ff,padding:0}}>Ver todas →</button>}
      </div>

      <div style={{display:'flex',gap:'0.5rem',marginBottom:'1.5rem'}}>
        <button style={tabStyle('users')} onClick={()=>setTab('users')}>Usuarios y Roles</button>
        <button style={tabStyle('log')} onClick={()=>setTab('log')}>Registro de Actividad</button>
        <button style={tabStyle('sessions')} onClick={()=>setTab('sessions')}>Sesiones</button>
      </div>

      {/* PHOTO UPLOAD */}
      {tab==='users'&&(
        <div style={{background:white,borderRadius:10,border:'1px solid rgba(31,20,14,0.07)',padding:'1.25rem',marginBottom:'1.25rem'}}>
          <div style={{fontFamily:ffS,fontSize:'1rem',fontWeight:400,marginBottom:'1rem'}}>Foto de perfil</div>
          <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
            <div style={{width:64,height:64,borderRadius:'50%',background:'rgba(227,90,27,0.1)',border:'2px solid rgba(227,90,27,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',overflow:'hidden',flexShrink:0}}>
              {(() => {
                const me = (allUsers||users).find(u=>u.id===users.find(u2=>u2.role==='admin')?.id)
                return me?.avatar_url ? <img src={me.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : '🦋'
              })()}
            </div>
            <div>
              <input type="file" accept="image/*" id="avatar-upload" style={{display:'none'}}
                onChange={async(e)=>{
                  const file = e.target.files[0]
                  if (!file) return
                  const fd = new FormData()
                  fd.append('file', file)
                  fd.append('type', 'avatar')
                  const res = await fetch('/api/admin/files', {method:'POST', body:fd})
                  if (res.ok) { showToast('Foto actualizada'); loadAll() }
                  else showToast('Error al subir foto')
                }}
              />
              <label htmlFor="avatar-upload" style={{display:'inline-block',padding:'0.5rem 1rem',background:black,color:white,borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.62rem',letterSpacing:'0.1em',textTransform:'uppercase'}}>
                Cambiar foto
              </label>
              <div style={{fontSize:'0.62rem',color:gray,marginTop:'0.4rem'}}>JPG, PNG · máx 5MB</div>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO UPLOAD */}
      {tab==='users'&&(
        <div style={{background:white,borderRadius:10,border:'1px solid rgba(31,20,14,0.07)',padding:'1.25rem',marginBottom:'1.25rem'}}>
          <div style={{fontFamily:ffS,fontSize:'1rem',fontWeight:400,marginBottom:'1rem'}}>Foto de perfil</div>
          <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
            <div style={{width:64,height:64,borderRadius:'50%',background:'rgba(227,90,27,0.1)',border:'2px solid rgba(227,90,27,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.8rem',flexShrink:0}}>🦋</div>
            <div>
              <input type="file" accept="image/*" id="avatar-upload" style={{display:'none'}} onChange={async(e)=>{const file=e.target.files[0];if(!file)return;showToast('Foto actualizada ✓')}}/>
              <label htmlFor="avatar-upload" style={{display:'inline-block',padding:'0.5rem 1rem',background:black,color:white,borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.62rem',letterSpacing:'0.1em',textTransform:'uppercase'}}>Cambiar foto</label>
              <div style={{fontSize:'0.62rem',color:gray,marginTop:'0.4rem'}}>JPG, PNG · máx 5MB</div>
            </div>
          </div>
        </div>
      )}

     
      {/* FOTO DE PERFIL */}
      {tab==='users'&&(
        <div style={{background:white,borderRadius:10,border:'1px solid rgba(31,20,14,0.07)',padding:'1.25rem',marginBottom:'1.25rem'}}>
          <div style={{fontFamily:ffS,fontSize:'1rem',fontWeight:400,marginBottom:'1rem'}}>Foto de perfil</div>
          <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
            <div style={{width:64,height:64,borderRadius:'50%',background:'rgba(227,90,27,0.1)',border:'2px solid rgba(227,90,27,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.8rem',flexShrink:0}}>🦋</div>
            <div>
              <input type="file" accept="image/*" id="avatar-upload" style={{display:'none'}} onChange={async(e)=>{const file=e.target.files[0];if(!file)return;showToast('Próximamente disponible')}}/>
              <label htmlFor="avatar-upload" style={{display:'inline-block',padding:'0.5rem 1rem',background:black,color:white,borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.62rem',letterSpacing:'0.1em',textTransform:'uppercase'}}>Cambiar foto</label>
              <div style={{fontSize:'0.62rem',color:gray,marginTop:'0.4rem'}}>JPG, PNG · máx 5MB</div>
            </div>
          </div>
        </div>
      )}

 {/* USERS & ROLES */}
      {tab==='users'&&(
        <div style={{background:white,borderRadius:10,border:'1px solid rgba(31,20,14,0.07)',overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',padding:'0.6rem 1.25rem',borderBottom:'1px solid rgba(31,20,14,0.06)',fontSize:'0.52rem',letterSpacing:'0.1em',textTransform:'uppercase',color:gray}}>
            <span>User</span><span>Role</span><span>Card</span><span>Actions</span>
          </div>
          {displayUsers.map(u=>{
            const card = getCard(u.id)
            const isAdmin = u.role === 'admin'
            return (
              <div key={u.id} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',padding:'0.85rem 1.25rem',borderBottom:'1px solid rgba(31,20,14,0.04)',alignItems:'center',gap:'0.5rem'}}>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:'0.75rem',color:black,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.business_name||u.full_name}</div>
                  <div style={{fontSize:'0.6rem',color:gray,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.email||'—'}</div>
                </div>
                <span style={{fontSize:'0.58rem',padding:'0.18rem 0.55rem',borderRadius:20,
                  background:isAdmin?'rgba(227,90,27,0.12)':'rgba(52,152,219,0.08)',
                  color:isAdmin?gold:'#2980b9',width:'fit-content',whiteSpace:'nowrap'}}>
                  {isAdmin?'Admin':'Client'}
                </span>
                <span style={{fontSize:'0.62rem',color:card?'#2d8a60':gray}}>
                  {card?'#'+card.card_number:'Sin tarjeta'}
                </span>
                <div style={{display:'flex',gap:'0.35rem',flexWrap:'wrap'}}>
                  <button onClick={()=>changeRole(u)} disabled={roleChanging===u.id}
                    style={{padding:'0.3rem 0.6rem',background:isAdmin?'rgba(192,57,43,0.08)':'rgba(227,90,27,0.1)',
                      color:isAdmin?'#c0392b':gold,border:isAdmin?'none':'1px solid rgba(227,90,27,0.25)',
                      borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.54rem',letterSpacing:'0.06em',textTransform:'uppercase',opacity:roleChanging===u.id?0.5:1}}>
                    {roleChanging===u.id?'Guardando…':isAdmin?'Revocar Admin':'Hacer Admin'}
                  </button>
                  <button onClick={()=>window.open('/card','_blank')}
                    style={{padding:'0.3rem 0.6rem',background:'rgba(91,141,238,0.08)',color:'#5b8dee',
                      border:'1px solid rgba(91,141,238,0.2)',borderRadius:3,cursor:'pointer',
                      fontFamily:ff,fontSize:'0.54rem',letterSpacing:'0.06em',textTransform:'uppercase'}}>
                    View
                  </button>
                </div>
              </div>
            )
          })}
          {displayUsers.length===0&&<div style={{padding:'2rem',textAlign:'center',color:gray,fontSize:'0.82rem'}}>No se encontraron usuarios.</div>}
        </div>
      )}

      {/* ACTIVITY LOG */}
      {tab==='log'&&(
        <div style={{background:white,borderRadius:10,border:'1px solid rgba(31,20,14,0.07)',overflow:'hidden'}}>
          <div style={{padding:'0.75rem 1.25rem',borderBottom:'1px solid rgba(31,20,14,0.06)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:'0.6rem',color:gray,letterSpacing:'0.1em',textTransform:'uppercase'}}>Actividad reciente</span>
            <button onClick={loadLog} style={{background:'none',border:'none',cursor:'pointer',fontSize:'0.6rem',color:gray,fontFamily:ff,letterSpacing:'0.08em',textTransform:'uppercase'}}>↺ Refresh</button>
          </div>
          {logLoading&&<div style={{padding:'2rem',textAlign:'center',color:gray,fontSize:'0.78rem'}}>Cargando...</div>}
          {!logLoading&&filteredLog.length===0&&<div style={{padding:'2rem',textAlign:'center',color:gray,fontSize:'0.82rem'}}>Sin actividad aún.</div>}
          {!logLoading&&filteredLog.map((l,i)=>(
            <div key={l.id} style={{display:'flex',alignItems:'center',gap:'0.85rem',padding:'0.85rem 1.25rem',borderBottom:'1px solid rgba(31,20,14,0.04)'}}>
              <div style={{width:28,height:28,borderRadius:'50%',background:(typeColor[l.type]||gray)+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem',color:typeColor[l.type]||gray,flexShrink:0,fontWeight:700}}>
                {typeIcon[l.type]||'·'}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'0.72rem',color:black,fontWeight:500}}>{l.action}</div>
                <div style={{fontSize:'0.62rem',color:gray,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:'0.1rem'}}>{l.target||'—'}</div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontSize:'0.6rem',color:gray}}>{l.created_at?new Date(l.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})+' · '+new Date(l.created_at).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}):'—'}</div>
                <div style={{fontSize:'0.56rem',color:'rgba(31,20,14,0.3)',marginTop:'0.1rem'}}>{l.user_name||'Admin'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SESSIONS */}
      {tab==='sessions'&&(
        <div style={{background:white,borderRadius:10,border:'1px solid rgba(31,20,14,0.07)',overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',padding:'0.6rem 1.25rem',borderBottom:'1px solid rgba(31,20,14,0.06)',fontSize:'0.52rem',letterSpacing:'0.1em',textTransform:'uppercase',color:gray}}>
            <span>User</span><span>Role</span><span>Last Sign In</span>
          </div>
          {sessionsLoading&&<div style={{padding:'2rem',textAlign:'center',color:gray,fontSize:'0.78rem'}}>Cargando...</div>}
          {!sessionsLoading&&filteredSessions.map((u,i)=>(
            <div key={u.id} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',padding:'0.85rem 1.25rem',borderBottom:'1px solid rgba(31,20,14,0.04)',alignItems:'center',gap:'0.5rem'}}>
              <div style={{minWidth:0}}>
                <div style={{fontSize:'0.75rem',color:black,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.business_name||u.full_name||'—'}</div>
                <div style={{fontSize:'0.6rem',color:gray,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.email||'—'}</div>
              </div>
              <span style={{fontSize:'0.58rem',padding:'0.18rem 0.55rem',borderRadius:20,
                background:u.role==='admin'?'rgba(227,90,27,0.12)':'rgba(52,152,219,0.08)',
                color:u.role==='admin'?gold:'#2980b9',width:'fit-content'}}>
                {u.role==='admin'?'Admin':'Client'}
              </span>
              <span style={{fontSize:'0.62rem',color:gray}}>{u.last_sign_in_at?new Date(u.last_sign_in_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})+' · '+new Date(u.last_sign_in_at).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}):'Nunca'}</span>
            </div>
          ))}
          {!sessionsLoading&&filteredSessions.length===0&&<div style={{padding:'2rem',textAlign:'center',color:gray,fontSize:'0.82rem'}}>No se encontraron sesiones.</div>}
        </div>
      )}
    </div>
  )
}


function LogoButterfly({ color='#E35A1B', bodyColor='#FBF7EE', size=24 }) {
  const [flap, setFlap] = React.useState(false)
  React.useEffect(() => {
    const tick = () => {
      setFlap(true)
      setTimeout(() => setFlap(false), 700)
    }
    tick() // flap on mount
    const iv = setInterval(tick, 5000)
    return () => clearInterval(iv)
  }, [])
  const wStyle = {
    transformOrigin: '50px 41px',
    transition: 'transform 0.15s ease-in-out',
  }
  const flapL = flap ? {
    ...wStyle,
    animation: 'adm5s-aletear 0.35s ease-in-out 2',
  } : wStyle
  const flapR = flap ? {
    ...wStyle,
    animation: 'adm5s-aletear 0.35s ease-in-out 2 0.1s',
  } : wStyle
  return (
    <svg width={size} height={size*0.82} viewBox="0 0 100 82" style={{flexShrink:0}}>
      <style>{`@keyframes adm5s-aletear{0%,100%{transform:scaleX(1)}50%{transform:scaleX(0.35)}}`}</style>
      <g style={flapL}>
        <path d="M50 41 C42 14,20 6,8 16 C-2 28,6 50,24 56 C36 60,46 54,50 41Z" fill={color}/>
        <path d="M50 41 C44 56,30 68,22 70 C16 70,18 60,28 54 C36 50,46 50,50 41Z" fill={color} opacity=".9"/>
      </g>
      <g style={flapR}>
        <path d="M50 41 C58 14,80 6,92 16 C102 28,94 50,76 56 C64 60,54 54,50 41Z" fill={color}/>
        <path d="M50 41 C56 56,70 68,78 70 C84 70,82 60,72 54 C64 50,54 50,50 41Z" fill={color} opacity=".9"/>
      </g>
      <ellipse cx="50" cy="46" rx="2.2" ry="22" fill={bodyColor}/>
      <circle cx="50" cy="24" r="2.8" fill={bodyColor}/>
    </svg>
  )
}


function WebsitePanel({ catalog, showToast, loadAll }) {
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('Todos')
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState({name:'',description:'',category:'Galleta',price:'',active:true})

  const gold='#E35A1B', ink='#1F140E', cr='#FBF7EE', mu='#7A6452'
  const ffS='"Instrument Serif",serif'
  const ff='"DM Sans",sans-serif'

  useEffect(()=>{
    // Initialize from catalog with local state for toggles/badges
    setItems((catalog||[]).map(item=>({
      ...item,
      visible: item.active,
      badge_hoy: false,
      badge_nuevo: false,
      badge_temporada: false,
      badge_agotado: false,
      price: item.catalog_prices?.[0]?.amount || item.price || '',
      category: item.category || 'Galleta',
    })))
  },[catalog])

  const categories = ['Todos','Galleta','Pan dulce','Pastel']
  const filtered = filter==='Todos' ? items : items.filter(i=>i.category===filter)
  const visibleItems = items.filter(i=>i.visible)
  const hoyItems = items.filter(i=>i.badge_hoy)
  const nuevoItems = items.filter(i=>i.badge_nuevo)

  function toggleBadge(id, badge) {
    setItems(prev=>prev.map(i=>i.id===id?{...i,[badge]:!i[badge]}:i))
  }

  function toggleVisible(id) {
    setItems(prev=>prev.map(i=>i.id===id?{...i,visible:!i.visible}:i))
  }

  async function publish() {
    setSaving(true)
    try {
      // Update catalog_items active status for each item
      for (const item of items) {
        await fetch('/api/admin/catalog', {
          method:'PATCH',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            product_id: item.id,
            active: item.visible,
            badge_hoy: item.badge_hoy,
            badge_nuevo: item.badge_nuevo,
            badge_temporada: item.badge_temporada,
            badge_agotado: item.badge_agotado,
          })
        })
      }
      showToast('¡Cambios publicados en el sitio!')
    } catch(e) {
      showToast('Error al publicar')
    }
    setSaving(false)
  }

  async function addProduct() {
    if(!newItem.name){showToast('Nombre requerido');return}
    const res = await fetch('/api/admin/catalog',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newItem)})
    if(res.ok){showToast('Producto añadido');setShowAddForm(false);setNewItem({name:'',description:'',category:'Galleta',price:'',active:true});loadAll()}
    else showToast('Error al añadir producto')
  }

  const BadgeBtn = ({active,label,color,onClick}) => (
    <button onClick={onClick} style={{padding:'0.18rem 0.55rem',borderRadius:20,border:'1px solid '+(active?color:'rgba(31,20,14,0.12)'),background:active?color+'18':'transparent',color:active?color:'rgba(31,20,14,0.3)',fontSize:'0.52rem',fontFamily:ff,cursor:'pointer',letterSpacing:'0.06em',textTransform:'uppercase',transition:'all 0.15s'}}>
      {label}
    </button>
  )

  const previewSorted = [...items.filter(i=>i.visible)].sort((a,b)=>(b.badge_hoy?1:0)-(a.badge_hoy?1:0))

  return(
    <div>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1.25rem',flexWrap:'wrap',gap:'0.75rem'}}>
        <div>
          <h2 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:400}}>Website · <em style={{color:gold,fontStyle:'italic'}}>el menú visible</em></h2>
          <p style={{fontSize:'0.72rem',color:mu,marginTop:'0.3rem',lineHeight:1.5,maxWidth:480}}>Escoge del catálogo qué productos aparecen en la sección "Lo que se hornea hoy" del sitio web. Sin crear nada nuevo — sólo prendes/apagas y arrastras para ordenar.</p>
          <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginTop:'0.5rem'}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:'#2d8a60',animation:'pulse-green 2s ease-in-out infinite'}}/>
            <style>{'@keyframes pulse-green{0%,100%{opacity:1}50%{opacity:0.4}}'}</style>
            <span style={{fontSize:'0.62rem',color:mu}}>En vivo en monarcadeazucar.com</span>
          </div>
        </div>
        <button onClick={publish} disabled={saving} style={{background:ink,color:cr,border:'none',padding:'0.75rem 1.5rem',borderRadius:999,fontFamily:ff,fontSize:'0.68rem',fontWeight:600,letterSpacing:'0.08em',cursor:'pointer',whiteSpace:'nowrap',opacity:saving?0.7:1}}>
          {saving?'Publicando…':'Publicar cambios →'}
        </button>
      </div>

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.75rem',marginBottom:'1.25rem'}}>
        {[
          ['Visibles en web', visibleItems.length, `de ${items.length} en catálogo`, ink],
          ['Marcadas "Hoy"', hoyItems.length, 'aparecen primero', '#E35A1B'],
          ['Marcadas "Nuevo"', nuevoItems.length, 'con badge verde', '#8e44ad'],
          ['Última publicación', 'Hoy', new Date().toLocaleTimeString('es-PR',{hour:'numeric',minute:'2-digit',timeZone:'America/Puerto_Rico'}), '#2d8a60'],
        ].map(([label,val,sub,color])=>(
          <div key={label} style={{background:'#FBF7EE',borderRadius:10,padding:'1rem',border:'1px solid rgba(31,20,14,0.07)'}}>
            <div style={{fontSize:'0.52rem',letterSpacing:'0.12em',textTransform:'uppercase',color:mu,marginBottom:'0.4rem'}}>{label}</div>
            <div style={{fontFamily:ffS,fontSize:'1.6rem',fontWeight:400,color,lineHeight:1}}>{val}</div>
            <div style={{fontSize:'0.6rem',color:mu,marginTop:'0.25rem'}}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:'1.25rem',alignItems:'start'}}>
        {/* LEFT — catalog list */}
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
            <div>
              <div style={{fontSize:'0.52rem',letterSpacing:'0.14em',textTransform:'uppercase',color:mu,marginBottom:'0.35rem'}}>Catálogo · Catalog</div>
              <div style={{fontFamily:ffS,fontSize:'1.05rem',fontWeight:400}}>Prende lo que va al sitio</div>
            </div>
            <button onClick={()=>setShowAddForm(s=>!s)} style={{background:ink,color:cr,border:'none',padding:'0.5rem 1rem',borderRadius:999,fontFamily:ff,fontSize:'0.6rem',fontWeight:600,letterSpacing:'0.08em',cursor:'pointer'}}>
              + Añadir producto
            </button>
          </div>

          {/* Add form */}
          {showAddForm&&(
            <div style={{background:'#FBF7EE',borderRadius:10,border:'1px solid rgba(31,20,14,0.1)',padding:'1.25rem',marginBottom:'1rem'}}>
              <div style={{fontFamily:ffS,fontSize:'1rem',fontWeight:400,marginBottom:'1rem'}}>Nuevo producto</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <div>
                  <div style={{fontSize:'0.52rem',letterSpacing:'0.12em',textTransform:'uppercase',color:mu,marginBottom:'0.3rem'}}>Nombre</div>
                  <input value={newItem.name} onChange={e=>setNewItem(f=>({...f,name:e.target.value}))} placeholder="Concha de vainilla" style={{width:'100%',padding:'0.6rem 0.85rem',border:'1px solid rgba(31,20,14,0.12)',borderRadius:6,fontFamily:ff,fontSize:'0.82rem',outline:'none',boxSizing:'border-box'}}/>
                </div>
                <div>
                  <div style={{fontSize:'0.52rem',letterSpacing:'0.12em',textTransform:'uppercase',color:mu,marginBottom:'0.3rem'}}>Precio</div>
                  <input value={newItem.price} onChange={e=>setNewItem(f=>({...f,price:e.target.value}))} placeholder="3.50" type="number" step="0.01" style={{width:'100%',padding:'0.6rem 0.85rem',border:'1px solid rgba(31,20,14,0.12)',borderRadius:6,fontFamily:ff,fontSize:'0.82rem',outline:'none',boxSizing:'border-box'}}/>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <div>
                  <div style={{fontSize:'0.52rem',letterSpacing:'0.12em',textTransform:'uppercase',color:mu,marginBottom:'0.3rem'}}>Categoría</div>
                  <select value={newItem.category} onChange={e=>setNewItem(f=>({...f,category:e.target.value}))} style={{width:'100%',padding:'0.6rem 0.85rem',border:'1px solid rgba(31,20,14,0.12)',borderRadius:6,fontFamily:ff,fontSize:'0.82rem',outline:'none',boxSizing:'border-box'}}>
                    {['Galleta','Pan dulce','Pastel'].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{fontSize:'0.52rem',letterSpacing:'0.12em',textTransform:'uppercase',color:mu,marginBottom:'0.3rem'}}>Descripción</div>
                  <input value={newItem.description} onChange={e=>setNewItem(f=>({...f,description:e.target.value}))} placeholder="Opcional" style={{width:'100%',padding:'0.6rem 0.85rem',border:'1px solid rgba(31,20,14,0.12)',borderRadius:6,fontFamily:ff,fontSize:'0.82rem',outline:'none',boxSizing:'border-box'}}/>
                </div>
              </div>
              <div style={{display:'flex',gap:'0.5rem'}}>
                <button onClick={addProduct} style={{flex:1,background:ink,color:cr,border:'none',padding:'0.7rem',borderRadius:6,fontFamily:ff,fontSize:'0.65rem',fontWeight:600,letterSpacing:'0.08em',cursor:'pointer'}}>Guardar producto</button>
                <button onClick={()=>setShowAddForm(false)} style={{padding:'0.7rem 1rem',background:'rgba(31,20,14,0.06)',color:ink,border:'none',borderRadius:6,fontFamily:ff,fontSize:'0.65rem',cursor:'pointer'}}>Cancelar</button>
              </div>
            </div>
          )}

          {/* Filter pills */}
          <div style={{display:'flex',gap:'0.4rem',marginBottom:'0.85rem'}}>
            {categories.map(c=>(
              <button key={c} onClick={()=>setFilter(c)} style={{padding:'0.35rem 0.85rem',borderRadius:999,border:'none',fontFamily:ff,fontSize:'0.65rem',cursor:'pointer',background:filter===c?ink:'rgba(31,20,14,0.06)',color:filter===c?cr:ink,transition:'all 0.15s'}}>{c}</button>
            ))}
          </div>

          {/* Items list */}
          <div style={{background:'#FBF7EE',borderRadius:10,border:'1px solid rgba(31,20,14,0.07)',overflow:'hidden'}}>
            {filtered.map((item,i)=>(
              <div key={item.id} style={{display:'flex',alignItems:'center',gap:'0.85rem',padding:'0.85rem 1.1rem',borderBottom:i<filtered.length-1?'1px solid rgba(31,20,14,0.05)':'none',opacity:item.badge_agotado?0.5:1}}>
                {/* Toggle */}
                <button onClick={()=>toggleVisible(item.id)} style={{width:40,height:22,borderRadius:11,border:'none',cursor:'pointer',padding:2,background:item.visible?gold:'rgba(31,20,14,0.15)',transition:'background 0.2s',flexShrink:0,position:'relative'}}>
                  <div style={{width:18,height:18,borderRadius:'50%',background:'white',position:'absolute',top:2,left:item.visible?20:2,transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
                </button>

                {/* Butterfly icon */}
                <div style={{width:36,height:36,borderRadius:8,background:'rgba(227,90,27,0.08)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <svg width="18" height="15" viewBox="0 0 100 82">
                    <path d="M50 41 C42 14,20 6,8 16 C-2 28,6 50,24 56 C36 60,46 54,50 41Z" fill={item.visible?gold:'rgba(31,20,14,0.2)'}/>
                    <path d="M50 41 C58 14,80 6,92 16 C102 28,94 50,76 56 C64 60,54 54,50 41Z" fill={item.visible?gold:'rgba(31,20,14,0.2)'}/>
                    <path d="M50 41 C44 56,30 68,22 70 C16 70,18 60,28 54 C36 50,46 50,50 41Z" fill={item.visible?gold:'rgba(31,20,14,0.2)'} opacity=".8"/>
                    <path d="M50 41 C56 56,70 68,78 70 C84 70,82 60,72 54 C64 50,54 50,50 41Z" fill={item.visible?gold:'rgba(31,20,14,0.2)'} opacity=".8"/>
                  </svg>
                </div>

                {/* Info */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'0.78rem',color:ink,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name}</div>
                  <div style={{fontSize:'0.6rem',color:mu,marginTop:'0.15rem'}}>{item.category} · ${parseFloat(item.price||0).toFixed(2)}</div>
                </div>

                {/* Order number */}
                {item.visible&&<div style={{fontSize:'0.62rem',color:mu,flexShrink:0}}>#{i+1}</div>}

                {/* Badges */}
                <div style={{display:'flex',gap:'0.3rem',flexShrink:0,flexWrap:'wrap'}}>
                  <BadgeBtn active={item.badge_hoy} label="Hoy" color={gold} onClick={()=>toggleBadge(item.id,'badge_hoy')}/>
                  <BadgeBtn active={item.badge_nuevo} label="Nuevo" color="#8e44ad" onClick={()=>toggleBadge(item.id,'badge_nuevo')}/>
                  <BadgeBtn active={item.badge_temporada} label="Temporada" color="#2d8a60" onClick={()=>toggleBadge(item.id,'badge_temporada')}/>
                  <BadgeBtn active={item.badge_agotado} label="Agotado" color="#c0392b" onClick={()=>toggleBadge(item.id,'badge_agotado')}/>
                </div>
              </div>
            ))}
            {filtered.length===0&&<div style={{padding:'2rem',textAlign:'center',color:mu,fontSize:'0.82rem'}}>No hay productos en esta categoría.</div>}
          </div>

          <div style={{marginTop:'0.75rem',fontSize:'0.62rem',color:mu,textAlign:'center'}}>
            ¿No está en el catálogo? Añade el producto arriba y aquí aparecerá.
          </div>
        </div>

        {/* RIGHT — live preview */}
        <div style={{position:'sticky',top:72}}>
          <div style={{background:ink,borderRadius:12,overflow:'hidden',border:'1px solid rgba(255,255,255,0.06)'}}>
            {/* Browser chrome */}
            <div style={{background:'rgba(255,255,255,0.04)',padding:'0.6rem 1rem',display:'flex',alignItems:'center',gap:'0.5rem',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
              <div style={{display:'flex',gap:4}}>{['#ff5f57','#ffbd2e','#28c840'].map(c=><div key={c} style={{width:8,height:8,borderRadius:'50%',background:c}}/>)}</div>
              <div style={{flex:1,background:'rgba(255,255,255,0.06)',borderRadius:4,padding:'0.2rem 0.6rem',fontSize:'0.55rem',color:'rgba(255,255,255,0.4)',textAlign:'center'}}>monarcadeazucar.com/#menu</div>
              <div style={{width:8,height:8,borderRadius:'50%',background:'#28c840',animation:'pulse-green 2s ease-in-out infinite'}}/>
            </div>
            {/* Preview content */}
            <div style={{padding:'1.25rem 1rem',maxHeight:480,overflowY:'auto'}}>
              <div style={{fontSize:'0.52rem',letterSpacing:'0.16em',textTransform:'uppercase',color:'rgba(251,247,238,0.35)',marginBottom:'0.25rem'}}>§ 01 · El menú</div>
              <div style={{fontFamily:ffS,fontSize:'1.4rem',color:'#FBF7EE',fontStyle:'italic',marginBottom:'1rem'}}>Lo que se <em style={{color:gold}}>hornea</em> hoy.</div>
              {previewSorted.length===0&&<div style={{fontSize:'0.72rem',color:'rgba(251,247,238,0.3)',textAlign:'center',padding:'1rem 0'}}>Activa productos para verlos aquí</div>}
              {previewSorted.map((item,i)=>(
                <div key={item.id} style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.65rem 0',borderBottom:'1px solid rgba(255,255,255,0.06)',opacity:item.badge_agotado?0.4:1}}>
                  <span style={{fontSize:'0.62rem',color:'rgba(251,247,238,0.3)',width:20,flexShrink:0,textAlign:'right'}}>{String(i+1).padStart(2,'0')}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'0.75rem',color:'#FBF7EE',fontWeight:500}}>{item.name}</div>
                    {(item.badge_temporada||item.badge_nuevo||item.badge_agotado)&&(
                      <div style={{display:'flex',gap:4,marginTop:3}}>
                        {item.badge_temporada&&<span style={{fontSize:'0.48rem',padding:'0.1rem 0.4rem',borderRadius:20,background:'rgba(45,138,96,0.2)',color:'#4ecb71',letterSpacing:'0.06em',textTransform:'uppercase'}}>Temporada</span>}
                        {item.badge_nuevo&&<span style={{fontSize:'0.48rem',padding:'0.1rem 0.4rem',borderRadius:20,background:'rgba(142,68,173,0.2)',color:'#b07fd4',letterSpacing:'0.06em',textTransform:'uppercase'}}>Nuevo</span>}
                        {item.badge_agotado&&<span style={{fontSize:'0.48rem',padding:'0.1rem 0.4rem',borderRadius:20,background:'rgba(192,57,43,0.2)',color:'#e74c3c',letterSpacing:'0.06em',textTransform:'uppercase'}}>Agotado</span>}
                      </div>
                    )}
                  </div>
                  <span style={{fontFamily:ffS,fontSize:'0.88rem',color:gold,flexShrink:0}}>${parseFloat(item.price||0).toFixed(2)}</span>
                </div>
              ))}
              {previewSorted.length>0&&(
                <div style={{marginTop:'0.75rem',fontSize:'0.55rem',color:'rgba(251,247,238,0.25)',lineHeight:1.6}}>
                  Tip: los productos con badge "Hoy" se ordenan automáticamente primero. Los "Agotado" se muestran en gris.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Admin({session}){
  const [panel,setPanel]=useState('dashboard')
  const [hamburgerOpen,setHamburgerOpen]=useState(false)
  const [cards,setCards]=useState([])
  const [users,setUsers]=useState([])
  const [rewards,setRewards]=useState([])
  const [catalog,setCatalog]=useState([])
  const [loading,setLoading]=useState(true)
  const [punchId,setPunchId]=useState('')
  const [punchAmt,setPunchAmt]=useState('')
  const [modal,setModal]=useState(null)
  const [form,setForm]=useState({})
  const [toast,setToast]=useState('')
  const [qrCard,setQrCard]=useState(null)
  const [search,setSearch]=useState('')
  const [selectedClient,setSeleccionaredClient]=useState(null)
  const [loyaltyOpen,setLoyaltyOpen]=useState(true)
  const [clientSearch,setClientSearch]=useState('')
  const [editingClient,setEditingClient]=useState(null)
  const [editForm,setEditForm]=useState({})
  const [filesClient,setFilesClient]=useState(null)
  const [editCost,setEditCost]=useState(null)
  const [costForm,setCostForm]=useState({cost:'',notes:''})
  const [suppliersItem,setSuppliersItem]=useState(null)
  const [suppliersText,setSuppliersText]=useState('')
  const [suppliersTitle,setSuppliersTitle]=useState('')
  const [expenseClient,setExpenseClient]=useState(null)
  const [historyClient,setHistoryClient]=useState(null)
  const [sales,setSales]=useState([])
  const [allUsers,setAllUsers]=useState([])
  const [supplies,setSupplies]=useState([])
  const [supplyModal,setSupplyModal]=useState(null) // null | 'add' | supply object
  const [supplyForm,setSupplyForm]=useState({name:'',category:'',cost:'',unit:'month',provider:'',renewal_date:'',notes:''})
  const [rewardCard,setRewardCard]=useState(null) // card for inline reward modal
  const [expenseForm,setExpenseForm]=useState({amount:'',description:'',date:new Date().toISOString().split('T')[0]})

  useEffect(()=>{
    if(session===undefined) return
    if(!session){window.location.href='/login';return}
    fetch('/api/admin/check-role', { headers:{ Authorization: 'Bearer ' + session.access_token } })
      .then(r=>r.json())
      .then(d=>{ if(d.role==='admin') loadAll(); else window.location.href='/card' })
      .catch(()=>window.location.href='/card')
  },[session])

  async function loadAll(){
    setLoading(true)
    const [c,u,r,cat]=await Promise.all([
      fetch('/api/admin/cards').then(r=>r.json()),
      fetch('/api/admin/users').then(r=>r.json()),
      fetch('/api/admin/rewards').then(r=>r.json()),
      fetch('/api/admin/catalog').then(r=>r.json())
    ])
    setCards(c.cards||[]);setUsers(u.users||[]);setRewards(r.rewards||[]);setCatalog(cat.items||[])
    fetch('/api/admin/supplies').then(r=>r.json()).then(d=>setSupplies(d.supplies||[])).catch(()=>{})
    fetch('/api/admin/users?all=1').then(r=>r.json()).then(d=>setAllUsers(d.users||[])).catch(()=>{})
    // Load sales for financial card
    fetch('/api/admin/sales').then(r=>r.json()).then(d=>setSales(d.sales||[])).catch(e=>console.error('Sales fetch error:',e))
    setLoading(false)
  }

  function showToast(msg){setToast(msg);setTimeout(()=>setToast(''),3200)}

  async function doPunch(){
    if(!punchId){showToast('Seleccionar a client');return}
    if(!punchAmt||parseFloat(punchAmt)<=0){showToast('El monto es requerido');return}
    const res=await fetch('/api/admin/punch',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({card_id:punchId,payment_amount:punchAmt})})
    const data=await res.json()
    if(res.ok){
      showToast(data.message)
      const card=cards.find(c=>c.id===punchId)
      // Register sale + push notification
      await fetch('/api/admin/sales',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        customer_id:card?.user_id,
        customer_name:card?.profiles?.business_name||card?.profiles?.full_name||'',
        customer_email:card?.profiles?.email||'',
        product_name:'Manual Payment',
        amount:parseFloat(punchAmt),
        currency:'usd',
        type:'manual',
        status:'paid',
        sale_date:new Date().toISOString().split('T')[0],
        notes:'Registered via punch'
      })})
      sendPush('New Sale', `$${parseFloat(punchAmt).toFixed(2)} — ${card?.profiles?.business_name||card?.profiles?.full_name||'Client'}`, '/admin')
      setPunchId('');setPunchAmt('');loadAll()
    }
    else showToast('Error: '+data.error)
  }

  async function createClient(){
    if(!form.new_email||!form.new_password){showToast('Email and password required');return}
    const res=await fetch('/api/admin/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.new_email,password:form.new_password,full_name:form.new_name,business_name:form.new_business,phone:form.new_phone})})
    const data=await res.json()
    if(res.ok){
      showToast('Cliente creado')
      await fetch('/api/admin/activity-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'Created client',target:form.new_business||form.new_name||form.new_email,type:'create'})})
      setForm(f=>({...f,new_email:'',new_password:'',new_name:'',new_business:'',new_phone:'',user_id:data.user.id}));loadAll()
    }
    else showToast('Error: '+data.error)
  }

  async function createCard(){
    if(!form.user_id){showToast('Seleccionar a client');return}
    const res=await fetch('/api/admin/cards',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:form.user_id,notes:form.notes})})
    const data=await res.json()
    if(res.ok){showToast('Tarjeta creada');setModal(null);setForm({});loadAll()}
    else showToast('Error: '+data.error)
  }

  async function deleteCard(id){
    if(!confirm('Delete this card?'))return
    const card=cards.find(c=>c.id===id)
    await fetch('/api/admin/cards',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})})
    await fetch('/api/admin/activity-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'Deleted card',target:(card?.profiles?.business_name||card?.profiles?.full_name||'')+(card?' · #'+card.card_number:''),type:'delete'})})
    showToast('Tarjeta eliminada');loadAll()
  }

  async function saveReward(){
    const card=cards.find(c=>c.user_id===form.reward_user_id)
    if(!card){showToast('User has no active card');return}
    const res=await fetch('/api/admin/rewards',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({card_id:card.id,user_id:form.reward_user_id,reward_type:form.reward_type||'1 Free Month',reward_cost:form.reward_cost,notes:form.reward_notes})})
    if(res.ok){
      showToast('Recompensa registrada')
      const u=users.find(u=>u.id===form.reward_user_id)
      await fetch('/api/admin/activity-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'Registered reward',target:(form.reward_type||'1 Free Month')+' → '+(u?.business_name||u?.full_name||''),type:'reward'})})
      setModal(null);setForm({});loadAll()
    }
  }

  async function deleteReward(id){
    await fetch('/api/admin/rewards',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})})
    showToast('Recompensa eliminada');loadAll()
  }

  const signOut=async()=>{await supabase.auth.signOut();window.location.href='/login'}

  async function subscribeToPush() {
    try {
      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      if (existing) { showToast('Notificaciones ya activadas'); return }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      })
      await fetch('/api/admin/push?action=subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub)
      })
      showToast('¡Notificaciones activadas!')
    } catch(e) {
      showToast('No se pudieron activar notificaciones')
    }
  }

  async function sendPush(title, body, url) {
    await fetch('/api/admin/push?action=send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, url })
    }).catch(()=>{})
  }
  const upd=(k,v)=>setForm(f=>({...f,[k]:v}))
  const cardUrl=(card)=>`https://monarca-de-azucar.vercel.app/c/${card?.card_number}`
  const inp={width:'100%',padding:'0.75rem 0.9rem',border:'1px solid '+gl,borderRadius:3,background:white,fontFamily:ff,fontSize:'0.88rem',outline:'none',color:black,marginBottom:'1rem',boxSizing:'border-box'}
  const lbl={fontSize:'0.56rem',letterSpacing:'0.13em',textTransform:'uppercase',color:gray,display:'block',marginBottom:'0.35rem'}

  if(loading)return(
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#FBF7EE',gap:16}}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
      <style>{`@keyframes aletear-admin{0%,100%{transform:scaleX(1)}25%,75%{transform:scaleX(0.5)}}`}</style>
      <svg width="56" height="46" viewBox="0 0 100 82">
        <g style={{transformOrigin:'50px 41px',animation:'aletear-admin 0.6s ease-in-out infinite'}}>
          <path d="M50 41 C42 14,20 6,8 16 C-2 28,6 50,24 56 C36 60,46 54,50 41Z" fill="#E35A1B"/>
          <path d="M50 41 C44 56,30 68,22 70 C16 70,18 60,28 54 C36 50,46 50,50 41Z" fill="#E35A1B" opacity=".9"/>
        </g>
        <g style={{transformOrigin:'50px 41px',animation:'aletear-admin 0.6s ease-in-out infinite 0.15s'}}>
          <path d="M50 41 C58 14,80 6,92 16 C102 28,94 50,76 56 C64 60,54 54,50 41Z" fill="#E35A1B"/>
          <path d="M50 41 C56 56,70 68,78 70 C84 70,82 60,72 54 C64 50,54 50,50 41Z" fill="#E35A1B" opacity=".9"/>
        </g>
        <ellipse cx="50" cy="46" rx="2.2" ry="22" fill="#1F140E"/>
        <circle cx="50" cy="24" r="2.8" fill="#1F140E"/>
      </svg>
      <div style={{fontFamily:'"Instrument Serif",serif',fontSize:'1.1rem',color:'#7A6452',fontStyle:'italic'}}>Cargando panel…</div>
    </div>
  )

  return(
    <>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
      <style>{`
        html,body{background:#F4EDDD;overscroll-behavior:none;}
        @media(max-width:700px){
          .admin-sidebar{display:none!important;}
          .admin-main{margin-left:0!important;padding:1rem!important;}
          .donut-grid{grid-template-columns:1fr!important;}
          .punch-row{grid-template-columns:1fr!important;}
          .mobile-nav{display:flex!important;}
        }
        .mobile-nav{display:none;position:fixed;bottom:0;left:0;right:0;background:${ink};z-index:200;border-top:1px solid rgba(227,90,27,0.15);}
        .mobile-nav button{flex:1;padding:0.75rem 0.1rem;background:none;border:none;color:rgba(255,255,255,0.4);font-family:${ff};font-size:0.65rem;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:0.2rem;}
        .mobile-nav button.active{color:${gold};}
      `}</style>
      <div style={{background:'#F4EDDD',minHeight:'100vh',fontFamily:ff,paddingBottom:70}}>
        <div style={{background:black,position:'fixed',top:0,left:0,right:0,zIndex:100,height:52,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 1.25rem'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
              <LogoButterfly color={gold} bodyColor={white}/>
              <div style={{fontFamily:ffS,fontSize:'1.05rem',color:white}}>Monarca <em style={{color:gold,fontStyle:'italic',fontWeight:400}}>de</em> Azúcar <span style={{fontSize:'0.48rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'rgba(255,255,255,0.26)',marginLeft:'0.4rem',fontFamily:ff,fontStyle:'normal'}}>Admin</span></div>
            </div>
          <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
            <button onClick={subscribeToPush} title="Enable notifications" style={{background:'none',border:'1px solid rgba(227,90,27,0.3)',color:'rgba(255,255,255,0.5)',padding:'0.25rem 0.65rem',fontSize:'0.52rem',cursor:'pointer',borderRadius:2,fontFamily:ff,letterSpacing:'0.1em',textTransform:'uppercase'}}>Notis</button>
            <button onClick={signOut} style={{background:'none',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.38)',padding:'0.25rem 0.75rem',fontSize:'0.52rem',letterSpacing:'0.1em',textTransform:'uppercase',cursor:'pointer',borderRadius:2,fontFamily:ff}}>Salir</button>
          </div>
        </div>
        <div style={{display:'flex',paddingTop:52,minHeight:'100vh'}}>
          {/* SIDEBAR */}
          <div className="admin-sidebar" style={{width:220,background:ink,flexShrink:0,position:'fixed',top:52,left:0,bottom:0,overflowY:'auto',display:'flex',flexDirection:'column'}}>
            <div style={{padding:'1.25rem 1.25rem 0.75rem',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
              <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
                <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(227,90,27,0.2)',border:'1px solid rgba(227,90,27,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.72rem',fontWeight:700,color:gold,flexShrink:0,fontFamily:ff}}>
                  {(users.find(u=>u.id===session?.user?.id)?.full_name||'AD').split(' ').map(w=>w[0]).join('').slice(0,2)}
                </div>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:'0.78rem',color:white,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{users.find(u=>u.id===session?.user?.id)?.full_name||'Admin'}</div>
                  <div style={{fontSize:'0.6rem',color:'rgba(255,255,255,0.35)'}}>Panadera · Dueña</div>
                </div>
              </div>
            </div>

            {/* Alertas mini — entre badge y NEGOCIO */}
            {getNotifications(cards).length>0&&(
              <div onClick={()=>setPanel('notifications')} style={{margin:'0.6rem 0.85rem 0',background:'rgba(192,57,43,0.15)',border:'1px solid rgba(192,57,43,0.25)',borderRadius:6,padding:'0.5rem 0.75rem',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:'0.62rem',color:'#e74c3c'}}>⚠ {getNotifications(cards).length} alerta{getNotifications(cards).length!==1?'s':''}</span>
                <span style={{fontSize:'0.6rem',color:'rgba(255,255,255,0.35)'}}>ver →</span>
              </div>
            )}

            <div style={{padding:'1rem 0 0.25rem'}}>
              <div style={{fontSize:'0.52rem',letterSpacing:'0.18em',textTransform:'uppercase',color:'rgba(255,255,255,0.25)',padding:'0 1.25rem',marginBottom:'0.4rem',fontFamily:ff}}>Negocio</div>
              {[['dashboard','◆','Resumen'],['clients','◌','Clientes'],['bookings','◇','Encargos'],['cards','☰','Tarjetas'],['punch','◯','Sellar visita'],['campaigns','◐','Campañas'],['website','◈','Website']].map(([id,icon,label])=>(
                <button key={id} onClick={()=>setPanel(id)} style={{display:'flex',alignItems:'center',gap:'0.65rem',padding:'0.7rem 1.25rem',width:'100%',background:panel===id?'rgba(227,90,27,0.1)':'none',border:'none',borderLeft:panel===id?'2px solid '+gold:'2px solid transparent',cursor:'pointer',textAlign:'left',fontFamily:ff}}>
                  <span style={{fontSize:'0.75rem',color:panel===id?gold:'rgba(255,255,255,0.3)',flexShrink:0,width:16,textAlign:'center'}}>{icon}</span>
                  <span style={{fontSize:'0.75rem',color:panel===id?gold:'rgba(255,255,255,0.75)'}}>{label}</span>
                </button>
              ))}
            </div>
            <div style={{height:'1px',background:'rgba(255,255,255,0.06)',margin:'0.25rem 1.25rem'}}/>
            <div style={{padding:'0.25rem 0'}}>
              <div style={{fontSize:'0.52rem',letterSpacing:'0.18em',textTransform:'uppercase',color:'rgba(255,255,255,0.25)',padding:'0 1.25rem',marginBottom:'0.4rem',fontFamily:ff}}>Operación</div>
              {[['system','⛭','Configuración'],['catalog','◔','Catálogo'],['supplies','◈','Inventario']].map(([id,icon,label])=>(
                <button key={id} onClick={()=>setPanel(id)} style={{display:'flex',alignItems:'center',gap:'0.65rem',padding:'0.7rem 1.25rem',width:'100%',background:panel===id?'rgba(227,90,27,0.1)':'none',border:'none',borderLeft:panel===id?'2px solid '+gold:'2px solid transparent',cursor:'pointer',textAlign:'left',fontFamily:ff}}>
                  <span style={{fontSize:'0.75rem',color:panel===id?gold:'rgba(255,255,255,0.3)',flexShrink:0,width:16,textAlign:'center'}}>{icon}</span>
                  <span style={{fontSize:'0.75rem',color:panel===id?gold:'rgba(255,255,255,0.75)'}}>{label}</span>
                </button>
              ))}
            </div>
            <div style={{marginTop:'auto',padding:'1rem 1.25rem',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
              <div style={{fontSize:'0.5rem',color:'rgba(255,255,255,0.2)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:'0.2rem'}}>Powered by</div>
              <div style={{fontSize:'0.65rem',color:'rgba(255,255,255,0.35)',fontFamily:ffS}}>A<span style={{color:gold}}>+</span> CRM</div>
            </div>
          </div>

          {/* MAIN */}
          <div className="admin-main" style={{marginLeft:220,flex:1,padding:'1.75rem',maxWidth:980}}>
            {panel==='dashboard'&&<DashboardPanel cards={cards} sales={sales} onSeleccionarClient={(card)=>{setSeleccionaredClient(card);setPanel('client')}} userName={session?.user?.user_metadata?.full_name||users.find(u=>u.id===session?.user?.id)?.full_name}/>}
            {panel==='client'&&selectedClient&&<ClientProfile card={selectedClient} onBack={()=>{setSeleccionaredClient(null);setPanel('dashboard')}}/>}
            {panel==='notifications'&&<NotificationsPanel cards={cards} users={users}/>}
            {panel==='bookings'&&<BookingsPanel/>}
            {panel==='campaigns'&&<CampaignsPanel cards={cards} users={users}/>}
            {panel==='catalog'&&<CatalogPanel catalog={catalog} onSetCost={(item)=>{setEditCost(item);setCostForm({cost:item.catalog_costs?.cost||'',notes:item.catalog_costs?.notes||''});setModal('cost')}} onSetSuppliers={(item)=>{setSuppliersItem(item);setSuppliersText(item.catalog_costs?.suppliers||'');setSuppliersTitle('');setModal('suppliers')}}/>}
            {panel==='website'&&<WebsitePanel catalog={catalog} showToast={showToast} loadAll={loadAll}/>}
            {panel==='supplies'&&<SuppliesPanel supplies={supplies}
              onAdd={()=>{setSupplyForm({name:'',category:'',cost:'',unit:'month',provider:'',renewal_date:'',notes:''});setSupplyModal('add')}}
              onEdit={(s)=>{setSupplyForm({name:s.name,category:s.category||'',cost:s.cost,unit:s.unit||'month',provider:s.provider||'',renewal_date:s.renewal_date||'',notes:s.notes||''});setSupplyModal(s)}}
              onDelete={async(id)=>{if(!confirm('Delete this supply?'))return;await fetch('/api/admin/supplies',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});showToast('Insumo eliminado');loadAll()}}
              showToast={showToast}
            />}
            {panel==='system'&&<AdminSystemPanel users={users} cards={cards} allUsers={allUsers} loadAll={loadAll} showToast={showToast}/>}
            {panel==='loyalty'&&(<div><h2 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:400,marginBottom:'1.5rem'}}>Club Monarca</h2><div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>{[['cards','Tarjetas','Create and manage loyalty cards'],['punch','Punchear','Register payments and stamps']].map(([id,label,desc])=>(<div key={id} onClick={()=>setPanel(id)} style={{background:white,borderRadius:10,padding:'1.25rem 1.5rem',border:'1px solid rgba(31,20,14,0.07)',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><div style={{fontFamily:ffS,fontSize:'1.1rem',fontWeight:400,color:black,marginBottom:'0.2rem'}}>{label}</div><div style={{fontSize:'0.68rem',color:gray}}>{desc}</div></div><div style={{color:gold,fontSize:'1rem'}}>›</div></div>))}</div></div>)}
            {panel==='clients'&&<ClientsPanel users={users} cards={cards} search={clientSearch} setSearch={setClientSearch}
              onEdit={(u)=>{setEditingClient(u);setEditForm({name:u.full_name||'',business:u.business_name||'',phone:u.phone||'',email:'',password:''});setModal('editclient')}}
              onAddPayment={(card)=>{setPunchId(card.id);setPanel('punch')}}
              onCreateCard={(uid)=>{setForm({user_id:uid});setModal('card')}}
              onCreateNew={()=>{setForm({});setModal('card')}}
              onDelete={async(uid)=>{if(!confirm('Delete this client?'))return;const u=users.find(u=>u.id===uid);await fetch('/api/admin/users',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:uid})});await fetch('/api/admin/activity-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'Deleted client',target:u?.business_name||u?.full_name||'',type:'delete'})});showToast('Cliente eliminado');loadAll()}}
              onFiles={(u)=>{setFilesClient(u);setModal('files')}}
              onExpense={(u)=>{setExpenseClient(u);setExpenseForm({amount:'',description:'',date:new Date().toISOString().split('T')[0]});setModal('expense')}}
              onHistory={(u)=>{setHistoryClient(u);setModal('history')}}
            />}
            {panel==='cards'&&<>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
                <h2 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:400}}>Tarjetas</h2>
                <button onClick={()=>setModal('card')} style={{background:black,color:white,border:'none',padding:'0.6rem 1.1rem',fontFamily:ff,fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>+ Nuevo</button>
              </div>
              <input type="text" placeholder="Buscar cliente..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%',padding:'0.7rem 1rem',border:'1px solid '+gl,borderRadius:3,fontFamily:ff,fontSize:'0.82rem',outline:'none',marginBottom:'1.25rem',boxSizing:'border-box',background:white}}/>
              <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
                {cards.filter(c=>(c.profiles?.full_name||'').toLowerCase().includes(search.toLowerCase())||(c.profiles?.business_name||'').toLowerCase().includes(search.toLowerCase())).map(card=>{
                  const cur=card.stamps%5===0&&card.stamps>0?5:card.stamps%5
                  const cycle=Math.ceil((card.stamps||1)/5)||1
                  const hasR=card.stamps>0&&card.stamps%5===0
                  return(<div key={card.id} style={{background:white,borderRadius:10,border:'1px solid rgba(31,20,14,0.07)',overflow:'hidden'}}>
                    <div style={{background:'linear-gradient(135deg,#1a1917,#252320)',padding:'1rem 1.25rem',color:white,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div>
                        <div style={{fontFamily:ffS,fontSize:'0.9rem',marginBottom:'0.15rem'}}>A<span style={{color:gold,fontStyle:'italic'}}>+</span> CRM</div>
                        <div style={{fontSize:'0.72rem',color:'rgba(255,255,255,0.8)',marginBottom:'0.5rem'}}>{card.profiles?.business_name||card.profiles?.full_name}</div>
                        <div style={{display:'flex',gap:3}}>{Array.from({length:5},(_,i)=><div key={i} style={{width:10,height:10,borderRadius:'50%',border:'1px solid rgba(227,90,27,0.22)',background:i<cur?gold:'transparent'}}/>)}</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:'0.6rem',color:'rgba(255,255,255,0.4)',marginBottom:'0.2rem'}}>#{card.card_number}</div>
                        <div style={{fontSize:'0.68rem',color:hasR?gold:'rgba(255,255,255,0.5)'}}>{cur}/5 · Cycle {cycle}</div>
                      </div>
                    </div>
                    <div style={{padding:'0.75rem 1.25rem',display:'flex',gap:'0.4rem'}}>
                      <button onClick={()=>{setPunchId(card.id);setPanel('punch')}} style={{flex:1,padding:'0.45rem',background:black,color:white,border:'none',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.56rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>+ Sello</button>
                      <button onClick={()=>setRewardCard(card)} style={{flex:1,padding:'0.45rem',background:'rgba(45,138,96,0.1)',color:'#2d8a60',border:'1px solid rgba(45,138,96,0.25)',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.56rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>Premio</button>
                      <button onClick={()=>{setQrCard(card);setModal('qr')}} style={{flex:1,padding:'0.45rem',background:'rgba(227,90,27,0.1)',color:gold,border:'1px solid rgba(227,90,27,0.25)',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.56rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>QR</button>
                      <button onClick={()=>deleteCard(card.id)} style={{flex:1,padding:'0.45rem',background:'rgba(192,57,43,0.08)',color:'#a93226',border:'none',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.56rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>Eliminar</button>
                    </div>
                    {/* Next Reward editable */}
                    <div style={{padding:'0 1.25rem 0.85rem',display:'flex',gap:'0.5rem',alignItems:'center'}}>
                      <span style={{fontSize:'0.52rem',color:gray,letterSpacing:'0.08em',textTransform:'uppercase',whiteSpace:'nowrap'}}>Próximo Premio:</span>
                      <input
                        type="text"
                        defaultValue={card.notes||''}
                        placeholder="ej. 1 galleta gratis"
                        onBlur={async(e)=>{
                          await fetch('/api/admin/cards',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:card.id,notes:e.target.value})})
                          showToast('Premio actualizado')
                        }}
                        style={{flex:1,padding:'0.3rem 0.6rem',border:'1px solid rgba(227,90,27,0.2)',borderRadius:3,fontFamily:ff,fontSize:'0.62rem',outline:'none',background:'rgba(227,90,27,0.04)',color:black}}
                      />
                    </div>
                  </div>)
                })}
                {cards.length===0&&<p style={{color:gray,fontSize:'0.85rem'}}>No hay tarjetas aún.</p>}
              </div>
            </>}
            {panel==='punch'&&<>
              <h2 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:400,marginBottom:'1.25rem'}}>Punch Card</h2>
              <div style={{background:white,borderRadius:10,padding:'1.5rem',border:'1px solid rgba(31,20,14,0.07)'}}>
                <div className="punch-row" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1rem'}}>
                  <div><label style={lbl}>Client</label><select value={punchId} onChange={e=>setPunchId(e.target.value)} style={{...inp,marginBottom:0}}><option value="">Seleccionar</option>{cards.map(c=><option key={c.id} value={c.id}>{c.profiles?.business_name||c.profiles?.full_name} · {c.stamps%5===0&&c.stamps>0?5:c.stamps%5}/5</option>)}</select></div>
                  <div><label style={lbl}>Amount <span style={{color:'#c0392b'}}>*</span></label><input style={{...inp,marginBottom:0}} type="number" step="0.01" placeholder="0.00" value={punchAmt} onChange={e=>setPunchAmt(e.target.value)}/></div>
                </div>
                {punchId&&(()=>{const card=cards.find(c=>c.id===punchId);const cur=card?(card.stamps%5===0&&card.stamps>0?5:card.stamps%5):0;return<div style={{background:'linear-gradient(135deg,#1a1917,#252320)',borderRadius:10,padding:'1.1rem',marginBottom:'1rem',border:'1px solid rgba(227,90,27,0.22)',color:white}}><div style={{fontFamily:ffS,fontSize:'1rem',marginBottom:'0.45rem'}}>A<span style={{color:gold,fontStyle:'italic'}}>+</span> CRM · {card?.profiles?.business_name||card?.profiles?.full_name}</div><div style={{display:'flex',gap:5}}>{Array.from({length:5},(_,i)=><div key={i} style={{width:15,height:15,borderRadius:'50%',border:'1.5px solid rgba(227,90,27,0.22)',background:i<cur?gold:i===cur?'rgba(227,90,27,0.35)':'transparent'}}/>)}</div></div>})()}
                <button onClick={doPunch} style={{width:'100%',background:black,color:white,border:'none',padding:'0.85rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Dar Sello</button>
              </div>
            </>}
          </div>
        </div>

        {/* MOBILE NAV */}
        <div className="mobile-nav">
          {[
            ['dashboard','Resumen'],
            ['clients','Clientes'],
            ['cards','Tarjetas'],
          ].map(([id,label])=>(
            <button key={id} onClick={()=>{setPanel(id);setHamburgerOpen(false)}}
              className={panel===id||(['cards','punch','rewards'].includes(panel)&&id==='loyalty')?'active':''}>
              {label}
            </button>
          ))}
          <button onClick={()=>setHamburgerOpen(o=>!o)}
            className={hamburgerOpen||['clients','campaigns','catalog','supplies','system','bookings'].includes(panel)?'active':''}
            style={{border:'1px solid rgba(227,90,27,0.35)',borderRadius:4,margin:'0.35rem 0.15rem',padding:'0.2rem 0.6rem',background:hamburgerOpen?'rgba(227,90,27,0.12)':'transparent'}}>
            <span style={{fontSize:'1.15rem',lineHeight:1,display:'block'}}>☰</span>
          </button>
        </div>

        {/* HAMBURGER DRAWER */}
        {hamburgerOpen&&(
          <>
            <div onClick={()=>setHamburgerOpen(false)}
              style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:195}}/>
            <div style={{position:'fixed',bottom:0,left:0,right:0,background:ink,zIndex:196,
              paddingBottom:52}}>
              <div style={{width:36,height:3,background:'rgba(255,255,255,0.15)',borderRadius:2,margin:'0.75rem auto 0.5rem'}}/>
              {[
                ['bookings','Reservas'],
                ['clients','Clientes'],
                ['campaigns','Campañas'],
                ['catalog','Catálogo'],
                ['website','Website'],
                ['supplies','Inventario'],
                ['system','Configuración'],
              ].map(([id,label])=>(
                <button key={id} onClick={()=>{setPanel(id);setHamburgerOpen(false)}}
                  style={{display:'flex',alignItems:'center',width:'100%',padding:'0.9rem 1.5rem',
                    background:panel===id?'rgba(227,90,27,0.08)':'none',border:'none',
                    borderLeft:panel===id?'2px solid '+gold:'2px solid transparent',
                    color:panel===id?gold:'rgba(255,255,255,0.65)',
                    fontFamily:ff,fontSize:'0.72rem',letterSpacing:'0.1em',textTransform:'uppercase',
                    cursor:'pointer',textAlign:'left'}}>
                  {label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* MODAL: New Card */}
        {modal==='card'&&(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div style={{background:white,borderRadius:'12px 12px 0 0',padding:'2rem',width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto'}}>
            <h3 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:400,marginBottom:'1.5rem'}}>Nueva Tarjeta</h3>
            <div style={{background:'rgba(227,90,27,0.05)',border:'1px solid rgba(227,90,27,0.2)',borderRadius:8,padding:'1.25rem',marginBottom:'1.25rem'}}>
              <div style={{fontSize:'0.58rem',letterSpacing:'0.14em',textTransform:'uppercase',color:gold,marginBottom:'1rem'}}>Create New Client</div>
              <label style={lbl}>Nombre Completo</label><input style={inp} type="text" placeholder="Client name" value={form.new_name||''} onChange={e=>upd('new_name',e.target.value)}/>
              <label style={lbl}>Nombre del Negocio</label><input style={inp} type="text" placeholder="Business name" value={form.new_business||''} onChange={e=>upd('new_business',e.target.value)}/>
              <label style={lbl}>Phone</label><input style={inp} type="tel" placeholder="787-000-0000" value={form.new_phone||''} onChange={e=>upd('new_phone',e.target.value)}/>
              <label style={lbl}>Email</label><input style={inp} type="email" placeholder="email@business.com" value={form.new_email||''} onChange={e=>upd('new_email',e.target.value)}/>
              <label style={lbl}>Contraseña Temporal</label><input style={{...inp,marginBottom:0}} type="text" placeholder="min. 6 characters" value={form.new_password||''} onChange={e=>upd('new_password',e.target.value)}/>
              <button onClick={createClient} style={{width:'100%',background:gold,color:white,border:'none',padding:'0.75rem',fontFamily:ff,fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',borderRadius:3,cursor:'pointer',marginTop:'0.85rem'}}>Crear Cliente</button>
            </div>
            <div style={{fontSize:'0.58rem',letterSpacing:'0.14em',textTransform:'uppercase',color:gray,marginBottom:'0.75rem',textAlign:'center'}}>— or select existing —</div>
            <label style={lbl}>Cliente Existente</label>
            <select value={form.user_id||''} onChange={e=>upd('user_id',e.target.value)} style={inp}><option value="">Seleccionar client</option>{users.map(u=><option key={u.id} value={u.id}>{u.business_name||u.full_name}</option>)}</select>
            <label style={lbl}>Notas (opcional)</label><input style={inp} type="text" placeholder="Info adicional..." value={form.notes||''} onChange={e=>upd('notes',e.target.value)}/>
            <div style={{display:'flex',gap:'0.75rem'}}>
              <button onClick={createCard} style={{flex:1,background:black,color:white,border:'none',padding:'0.85rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Asignar Tarjeta</button>
              <button onClick={()=>setModal(null)} style={{background:'rgba(31,20,14,0.06)',color:black,border:'none',padding:'0.85rem 1.25rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>)}

        {/* MODAL: QR */}
        {modal==='qr'&&qrCard&&(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:'1.25rem'}} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div style={{background:white,borderRadius:12,padding:'2rem',width:'100%',maxWidth:360,textAlign:'center'}}>
            <h3 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:400,marginBottom:'0.25rem'}}>Código QR</h3>
            <p style={{fontSize:'0.72rem',color:gray,marginBottom:'0.5rem'}}>{qrCard.profiles?.business_name||qrCard.profiles?.full_name}</p>
            <p style={{fontSize:'0.6rem',color:gray,marginBottom:'1.25rem'}}>#{qrCard.card_number}</p>
            <div style={{display:'flex',justifyContent:'center',marginBottom:'1.25rem'}}><img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(cardUrl(qrCard))}&color=1F140E&bgcolor=FBF7EE`} alt="QR" style={{borderRadius:8,border:'1px solid '+gl,padding:8,background:white}} width={200} height={200}/></div>
            <p style={{fontSize:'0.58rem',color:gray,marginBottom:'1.25rem',wordBreak:'break-all',lineHeight:1.6}}>{cardUrl(qrCard)}</p>
            <div style={{display:'flex',gap:'0.75rem'}}>
              <button onClick={()=>window.open(cardUrl(qrCard),'_blank')} style={{flex:1,background:black,color:white,border:'none',padding:'0.85rem',fontFamily:ff,fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Abrir</button>
              <button onClick={()=>{navigator.clipboard.writeText(cardUrl(qrCard));showToast('¡Enlace copiado!')}} style={{flex:1,background:'rgba(227,90,27,0.1)',color:gold,border:'1px solid rgba(227,90,27,0.25)',padding:'0.85rem',fontFamily:ff,fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Copiar</button>
              <button onClick={()=>setModal(null)} style={{background:'rgba(31,20,14,0.06)',color:black,border:'none',padding:'0.85rem 0.75rem',fontFamily:ff,fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>X</button>
            </div>
          </div>
        </div>)}

        {/* MODAL: Edit Client */}
        {modal==='editclient'&&editingClient&&(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div style={{background:white,borderRadius:'12px 12px 0 0',padding:'2rem',width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
              <h3 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:400}}>Editar Cliente</h3>
              <button onClick={()=>setModal(null)} style={{background:'none',border:'none',fontSize:'1.1rem',cursor:'pointer',color:gray}}>x</button>
            </div>
            <label style={lbl}>Nombre Completo</label><input style={inp} type="text" value={editForm.name||''} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))}/>
            <label style={lbl}>Nombre del Negocio</label><input style={inp} type="text" value={editForm.business||''} onChange={e=>setEditForm(f=>({...f,business:e.target.value}))}/>
            <label style={lbl}>Phone</label><input style={inp} type="tel" value={editForm.phone||''} onChange={e=>setEditForm(f=>({...f,phone:e.target.value}))}/>
            <label style={lbl}>Nuevo Email (opcional)</label><input style={inp} type="email" placeholder="Dejar vacío para mantener" value={editForm.email||''} onChange={e=>setEditForm(f=>({...f,email:e.target.value}))}/>
            <label style={lbl}>Nueva Contraseña (opcional)</label><input style={inp} type="text" placeholder="Dejar vacío para mantener" value={editForm.password||''} onChange={e=>setEditForm(f=>({...f,password:e.target.value}))}/>
            <div style={{display:'flex',gap:'0.75rem'}}>
              <button onClick={async()=>{await fetch('/api/admin/users',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:editingClient.id,full_name:editForm.name,business_name:editForm.business,phone:editForm.phone,email:editForm.email||null,password:editForm.password||null})});await fetch('/api/admin/activity-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'Edited client',target:editForm.business||editForm.name||'',type:'edit'})});showToast('Cliente actualizado');setModal(null);setEditingClient(null);loadAll()}} style={{flex:1,background:black,color:white,border:'none',padding:'0.85rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Guardar</button>
              <button onClick={()=>setModal(null)} style={{background:'rgba(31,20,14,0.06)',color:black,border:'none',padding:'0.85rem 1.25rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Cancelar</button>
            </div>
          </div>
        </div>)}

        {/* MODAL: Files */}
        {modal==='files'&&filesClient&&(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div style={{background:white,borderRadius:'12px 12px 0 0',padding:'2rem',width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
              <h3 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:400}}>Files — {filesClient.business_name||filesClient.full_name}</h3>
              <button onClick={()=>setModal(null)} style={{background:'none',border:'none',fontSize:'1.1rem',cursor:'pointer',color:gray}}>x</button>
            </div>
            <div style={{border:'2px dashed rgba(227,90,27,0.3)',borderRadius:8,padding:'2rem',textAlign:'center',marginBottom:'1.25rem',background:'rgba(227,90,27,0.03)'}}>
              <div style={{fontSize:'1.5rem',marginBottom:'0.5rem'}}>+</div>
              <div style={{fontSize:'0.78rem',color:gray,marginBottom:'0.75rem'}}>Arrastra archivos o haz click</div>
              <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.png,.csv,.xlsx" onChange={async(e)=>{const files=Array.from(e.target.files);for(const file of files){const fd=new FormData();fd.append('file',file);fd.append('user_id',filesClient.id);const res=await fetch('/api/admin/files',{method:'POST',body:fd});const data=await res.json();if(res.ok)showToast(file.name+' uploaded');else showToast('Error: '+data.error)};e.target.value='';setModal(null);setTimeout(()=>setModal('files'),100)}} style={{display:'none'}} id="file-input"/>
              <label htmlFor="file-input" style={{background:black,color:white,padding:'0.6rem 1.25rem',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase'}}>Seleccionar Files</label>
            </div>
            <FilesListForClient userId={filesClient.id} showToast={showToast}/>
          </div>
        </div>)}

        {/* MODAL: Expense */}
        {modal==='expense'&&expenseClient&&(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div style={{background:white,borderRadius:'12px 12px 0 0',padding:'2rem',width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.25rem'}}>
              <h3 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:400}}>Expenses</h3>
              <button onClick={()=>setModal(null)} style={{background:'none',border:'none',fontSize:'1.1rem',cursor:'pointer',color:gray}}>x</button>
            </div>
            <p style={{fontSize:'0.72rem',color:gray,marginBottom:'1.5rem'}}>{expenseClient.business_name||expenseClient.full_name}</p>
            <label style={lbl}>Monto ($)</label><input style={inp} type="number" step="0.01" placeholder="0.00" value={expenseForm.amount} onChange={e=>setExpenseForm(f=>({...f,amount:e.target.value}))}/>
            <label style={lbl}>Descripción</label><input style={inp} type="text" placeholder="ej. Harina, mantequilla..." value={expenseForm.description} onChange={e=>setExpenseForm(f=>({...f,description:e.target.value}))}/>
            <label style={lbl}>Fecha</label><input style={{...inp}} type="date" value={expenseForm.date} onChange={e=>setExpenseForm(f=>({...f,date:e.target.value}))}/>
            <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'1rem'}}>
              <input type="checkbox" id="recurring-cb" checked={expenseForm.recurring||false} onChange={e=>setExpenseForm(f=>({...f,recurring:e.target.checked}))} style={{width:16,height:16,cursor:'pointer'}}/>
              <label htmlFor="recurring-cb" style={{fontSize:'0.72rem',color:black,cursor:'pointer'}}>Gasto recurrente</label>
            </div>
            {expenseForm.recurring&&(
              <div style={{marginBottom:'1rem'}}>
                <label style={lbl}>Intervalo</label>
                <select value={expenseForm.recurring_interval||'month'} onChange={e=>setExpenseForm(f=>({...f,recurring_interval:e.target.value}))} style={{...inp,marginBottom:0}}>
                  <option value="week">Semanal</option>
                  <option value="month">Mensual</option>
                  <option value="year">Anual</option>
                </select>
              </div>
            )}
            <div style={{display:'flex',gap:'0.75rem',marginBottom:'1.5rem'}}>
              <button onClick={async()=>{
                const res=await fetch('/api/admin/expenses',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({client_id:expenseClient.id,amount:expenseForm.amount,description:expenseForm.description,recurring:expenseForm.recurring||false,recurring_interval:expenseForm.recurring_interval||'month',expense_date:expenseForm.date})})
                if(res.ok){showToast('Gasto guardado');setExpenseForm({amount:'',description:'',date:new Date().toISOString().split('T')[0],recurring:false,recurring_interval:'month'})}
                else showToast('Error al guardar gasto')
              }} style={{flex:1,background:black,color:white,border:'none',padding:'0.85rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Guardar Gasto</button>
              <button onClick={()=>setModal(null)} style={{background:'rgba(31,20,14,0.06)',color:black,border:'none',padding:'0.85rem 1.25rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Cerrar</button>
            </div>
            <ExpenseHistory clientId={expenseClient.id} showToast={showToast} supplies={supplies}/>
          </div>
        </div>)}

        {/* MODAL: Set Cost */}
        {modal==='cost'&&editCost&&(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div style={{background:white,borderRadius:'12px 12px 0 0',padding:'2rem',width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.25rem'}}>
              <h3 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:400}}>Establecer Costo</h3>
              <button onClick={()=>setModal(null)} style={{background:'none',border:'none',fontSize:'1.1rem',cursor:'pointer',color:gray}}>x</button>
            </div>
            <p style={{fontSize:'0.72rem',color:gray,marginBottom:'1.25rem'}}>{editCost.name}</p>

            {/* Supplies calculator */}
            {supplies.length>0&&(
              <div style={{background:'rgba(227,90,27,0.04)',border:'1px solid rgba(227,90,27,0.15)',borderRadius:8,padding:'1rem',marginBottom:'1.25rem'}}>
                <div style={{fontSize:'0.52rem',letterSpacing:'0.12em',textTransform:'uppercase',color:gold,marginBottom:'0.75rem'}}>Calcular de Insumos</div>
                {supplies.map(s=>{
                  const unitLabel = s.unit==='month'?'/mo':s.unit==='year'?'/yr':' once'
                  const qtyKey = 'cost_qty_'+s.id
                  const qty = parseFloat(costForm[qtyKey]||0)
                  const lineTotal = qty>0?parseFloat(s.cost)*qty:0
                  return(
                    <div key={s.id} style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'0.5rem'}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:'0.68rem',color:black,fontWeight:500}}>{s.name}</div>
                        <div style={{fontSize:'0.58rem',color:gray}}>${parseFloat(s.cost).toFixed(2)}{unitLabel}</div>
                      </div>
                      <input type="number" min="0" step="0.1" placeholder="0"
                        value={costForm[qtyKey]||''}
                        onChange={e=>{
                          const newQty = parseFloat(e.target.value||0)
                          setCostForm(f=>{
                            const updated = {...f,[qtyKey]:e.target.value}
                            // Recalculate total from all supply lines
                            const total = supplies.reduce((acc,sup)=>{
                              const q = parseFloat(updated['cost_qty_'+sup.id]||0)
                              return acc + (q>0?parseFloat(sup.cost)*q:0)
                            },0)
                            return {...updated, cost: total>0?total.toFixed(2):f.cost}
                          })
                        }}
                        style={{width:55,padding:'0.3rem 0.4rem',border:'1px solid '+gl,borderRadius:3,fontFamily:ff,fontSize:'0.72rem',outline:'none',textAlign:'center'}}/>
                      <div style={{fontSize:'0.62rem',color:lineTotal>0?'#c0392b':gray,width:55,textAlign:'right',fontWeight:lineTotal>0?600:400}}>
                        {lineTotal>0?'$'+lineTotal.toFixed(2):'—'}
                      </div>
                    </div>
                  )
                })}
                <div style={{display:'flex',justifyContent:'space-between',paddingTop:'0.6rem',marginTop:'0.25rem',borderTop:'1px solid rgba(31,20,14,0.07)'}}>
                  <span style={{fontSize:'0.58rem',color:gray,letterSpacing:'0.08em',textTransform:'uppercase'}}>Total Cost</span>
                  <span style={{fontFamily:ffS,fontSize:'1rem',fontWeight:400,color:'#c0392b'}}>${parseFloat(costForm.cost||0).toFixed(2)}</span>
                </div>
              </div>
            )}

            <div style={{display:'flex',gap:'0.75rem',marginBottom:'1rem',alignItems:'flex-end'}}>
              <div style={{flex:1}}>
                <label style={lbl}>Costo ($) <span style={{color:gray,fontWeight:400,textTransform:'none',letterSpacing:0}}>— edit manually or calculate above</span></label>
                <input id="cost-input" style={{...inp,marginBottom:0,fontSize:'1.1rem',fontWeight:600}} type="number" step="0.01" placeholder="0.00" value={costForm.cost} onChange={e=>setCostForm(f=>({...f,cost:e.target.value}))}/>
              </div>
              <button onClick={async()=>{
                if(!costForm.cost){showToast('Enter a cost first');return}
                const r=await fetch('/api/admin/catalog',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({product_id:editCost.id,cost:costForm.cost})})
                const d=await r.json()
                if(r.ok){
                  showToast('Cost saved ✓')
                  fetch('/api/admin/catalog').then(r=>r.json()).then(d=>setCatalog(d.items||[]))
                  setEditCost(d.item||editCost)
                  setCostForm(f=>({...f,cost:d.item?.catalog_costs?.[0]?.cost||f.cost}))
                } else showToast('Error: '+(d.error||'Unknown'))
              }} style={{padding:'0.78rem 1.25rem',background:black,color:white,border:'none',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',flexShrink:0}}>Guardar</button>
            </div>
            <CostHistory productId={editCost.id}/>
            <button onClick={()=>setModal(null)} style={{width:'100%',background:'rgba(31,20,14,0.06)',color:black,border:'none',padding:'0.75rem',fontFamily:ff,fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',borderRadius:3,cursor:'pointer',marginTop:'0.5rem'}}>Cerrar</button>
          </div>
        </div>)}

        {/* MODAL: Suppliers */}
        {modal==='suppliers'&&suppliersItem&&(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div style={{background:white,borderRadius:'12px 12px 0 0',padding:'2rem',width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.25rem'}}>
              <h3 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:400}}>Proveedores</h3>
              <button onClick={()=>setModal(null)} style={{background:'none',border:'none',fontSize:'1.1rem',cursor:'pointer',color:gray}}>x</button>
            </div>
            <p style={{fontSize:'0.72rem',color:gray,marginBottom:'1.25rem'}}>{suppliersItem.name}</p>
            <div style={{background:'rgba(227,90,27,0.04)',border:'1px solid rgba(227,90,27,0.15)',borderRadius:8,padding:'1rem',marginBottom:'1rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.5rem'}}>
                <input value={suppliersTitle} onChange={e=>setSuppliersTitle(e.target.value)} placeholder="Note title..." style={{background:'none',border:'none',outline:'none',fontFamily:ffS,fontSize:'1rem',fontWeight:400,color:black,flex:1}} id="suppliers-title"/>
                <span style={{fontSize:'0.58rem',color:gray,flexShrink:0,marginLeft:'0.5rem'}}>{new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
              </div>
              <textarea id="suppliers-text" value={suppliersText} onChange={e=>setSuppliersText(e.target.value)} rows={6} placeholder="e.g. Vercel hosting, GoDaddy domain, Supabase..." style={{width:'100%',background:'none',border:'none',outline:'none',fontFamily:ff,fontSize:'0.82rem',color:black,resize:'vertical',boxSizing:'border-box',lineHeight:1.7}}/>
            </div>
            <div style={{display:'flex',gap:'0.75rem'}}>
              <button onClick={async()=>{
                const r=await fetch('/api/admin/catalog',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({product_id:suppliersItem.id,suppliers:suppliersText})})
                const d=await r.json()
                if(r.ok){showToast('Saved ✓');fetch('/api/admin/catalog').then(r=>r.json()).then(d=>setCatalog(d.items||[]))}
                else showToast('Error: '+(d.error||'Unknown'))
              }} style={{flex:1,background:black,color:white,border:'none',padding:'0.85rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Guardar</button>
              <button onClick={()=>setModal(null)} style={{background:'rgba(31,20,14,0.06)',color:black,border:'none',padding:'0.85rem 1.25rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Cerrar</button>
            </div>
          </div>
        </div>)}

        {/* MODAL: History */}
        {modal==='history'&&historyClient&&(
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
            <div style={{background:white,borderRadius:'12px 12px 0 0',width:'100%',maxWidth:560,maxHeight:'85vh',display:'flex',flexDirection:'column'}}>
              <div style={{padding:'1.5rem 1.5rem 1rem',flexShrink:0}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <h3 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:400}}>Transaction History</h3>
                  <button onClick={()=>setModal(null)} style={{background:'none',border:'none',fontSize:'1.1rem',cursor:'pointer',color:gray}}>x</button>
                </div>
                <p style={{fontSize:'0.72rem',color:gray,marginTop:'0.25rem'}}>{historyClient.business_name||historyClient.full_name}</p>
              </div>
              <ClientHistory client={historyClient}/>
            </div>
          </div>
        )}

        {/* MODAL: Reward — inline per card */}
        {rewardCard&&(
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&setRewardCard(null)}>
            <div style={{background:white,borderRadius:'12px 12px 0 0',padding:'2rem',width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.25rem'}}>
                <h3 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:400}}>Premios</h3>
                <button onClick={()=>setRewardCard(null)} style={{background:'none',border:'none',fontSize:'1.1rem',cursor:'pointer',color:gray}}>x</button>
              </div>
              <p style={{fontSize:'0.72rem',color:gray,marginBottom:'1.5rem'}}>{rewardCard.profiles?.business_name||rewardCard.profiles?.full_name} · #{rewardCard.card_number}</p>

              {/* Existing rewards list */}
              {rewardCard.rewards?.length>0&&(
                <div style={{marginBottom:'1.5rem',border:'1px solid rgba(31,20,14,0.07)',borderRadius:8,overflow:'hidden'}}>
                  <div style={{padding:'0.6rem 1rem',background:'rgba(31,20,14,0.02)',fontSize:'0.52rem',letterSpacing:'0.1em',textTransform:'uppercase',color:gray}}>Historial de Recompensas</div>
                  {rewardCard.rewards.map((r,i)=>(
                    <div key={r.id||i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.75rem 1rem',borderTop:'1px solid rgba(31,20,14,0.05)'}}>
                      <div>
                        <div style={{fontSize:'0.75rem',color:black,fontWeight:500}}>{r.reward_type}</div>
                        <div style={{fontSize:'0.6rem',color:gray,marginTop:'0.1rem'}}>
                          {r.redeemed_at?new Date(r.redeemed_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):r.created_at?new Date(r.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—'}
                          {r.reward_cost&&' · '+r.reward_cost}
                        </div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                        <span style={{fontSize:'0.56rem',padding:'0.18rem 0.55rem',borderRadius:20,background:'rgba(45,138,96,0.1)',color:'#2d8a60'}}>{r.status}</span>
                        <button onClick={async()=>{await fetch('/api/admin/rewards',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:r.id})});showToast('Recompensa eliminada');loadAll();setRewardCard(c=>({...c,rewards:c.rewards.filter(x=>x.id!==r.id)}))}} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(192,57,43,0.4)',fontSize:'0.75rem',padding:0}}>x</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {(!rewardCard.rewards||rewardCard.rewards.length===0)&&<p style={{fontSize:'0.72rem',color:gray,marginBottom:'1.5rem'}}>Sin recompensas aún.</p>}

              {/* Register new reward */}
              <div style={{fontSize:'0.52rem',letterSpacing:'0.14em',textTransform:'uppercase',color:gold,marginBottom:'1rem'}}>Registrar Recompensa</div>
              <label style={lbl}>Reward Type</label>
              <select value={form.reward_type||'1 Free Month'} onChange={e=>upd('reward_type',e.target.value)} style={inp}>
                {['1 Free Month','50% Discount','Extra Service','Other'].map(t=><option key={t}>{t}</option>)}
              </select>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
                <div><label style={lbl}>Cost (optional)</label><input style={{...inp,marginBottom:0}} type="text" placeholder="$0.00" value={form.reward_cost||''} onChange={e=>upd('reward_cost',e.target.value)}/></div>
                <div><label style={lbl}>Fecha</label><input style={{...inp,marginBottom:0}} type="date" value={form.reward_date||new Date().toISOString().split('T')[0]} onChange={e=>upd('reward_date',e.target.value)}/></div>
              </div>
              <button onClick={async()=>{
                const res=await fetch('/api/admin/rewards',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({card_id:rewardCard.id,user_id:rewardCard.user_id,reward_type:form.reward_type||'1 Free Month',reward_cost:form.reward_cost,notes:form.reward_notes})})
                if(res.ok){
                  showToast('Recompensa registrada')
                  await fetch('/api/admin/activity-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'Registered reward',target:(form.reward_type||'1 Free Month')+' → '+(rewardCard.profiles?.business_name||rewardCard.profiles?.full_name||''),type:'reward'})})
                  setForm({})
                  // Refresh cards and update rewardCard in place
                  const updated=await fetch('/api/admin/cards').then(r=>r.json())
                  const updatedCard=(updated.cards||[]).find(c=>c.id===rewardCard.id)
                  if(updatedCard) setRewardCard(updatedCard)
                  setCards(updated.cards||[])
                }
              }} style={{width:'100%',background:black,color:white,border:'none',padding:'0.85rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Register Reward</button>
            </div>
          </div>
        )}

        {/* MODAL: Supply Add/Edit */}
        {supplyModal&&(
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&setSupplyModal(null)}>
            <div style={{background:white,borderRadius:'12px 12px 0 0',padding:'2rem',width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
                <h3 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:400}}>{supplyModal==='add'?'Añadir Insumo':'Editar Insumo'}</h3>
                <button onClick={()=>setSupplyModal(null)} style={{background:'none',border:'none',fontSize:'1.1rem',cursor:'pointer',color:gray}}>x</button>
              </div>
              <label style={lbl}>Nombre</label>
              <input style={inp} type="text" placeholder="ej. Harina Premium" value={supplyForm.name} onChange={e=>setSupplyForm(f=>({...f,name:e.target.value}))}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                <div>
                  <label style={lbl}>Categoría</label>
                  <input style={{...inp,marginBottom:0}} type="text" placeholder="Ingredientes, Equipos..." value={supplyForm.category} onChange={e=>setSupplyForm(f=>({...f,category:e.target.value}))}/>
                </div>
                <div>
                  <label style={lbl}>Proveedor</label>
                  <input style={{...inp,marginBottom:0}} type="text" placeholder="Proveedor..." value={supplyForm.provider} onChange={e=>setSupplyForm(f=>({...f,provider:e.target.value}))}/>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginTop:'1rem'}}>
                <div>
                  <label style={lbl}>Costo ($)</label>
                  <input style={{...inp,marginBottom:0}} type="number" step="0.01" placeholder="0.00" value={supplyForm.cost} onChange={e=>setSupplyForm(f=>({...f,cost:e.target.value}))}/>
                </div>
                <div>
                  <label style={lbl}>Facturación</label>
                  <select style={{...inp,marginBottom:0}} value={supplyForm.unit} onChange={e=>setSupplyForm(f=>({...f,unit:e.target.value}))}>
                    <option value="month">Mensual</option>
                    <option value="year">Anual</option>
                    <option value="one-time">Una vez</option>
                  </select>
                </div>
              </div>
              <div style={{marginTop:'1rem'}}>
                <label style={lbl}>Fecha de renovación (opcional)</label>
                <input style={inp} type="date" value={supplyForm.renewal_date} onChange={e=>setSupplyForm(f=>({...f,renewal_date:e.target.value}))}/>
              </div>
              <label style={lbl}>Notas (opcional)</label>
              <input style={inp} type="text" placeholder="Info adicional..." value={supplyForm.notes} onChange={e=>setSupplyForm(f=>({...f,notes:e.target.value}))}/>
              <div style={{display:'flex',gap:'0.75rem'}}>
                <button onClick={async()=>{
                  if(!supplyForm.name||!supplyForm.cost){showToast('Name and cost required');return}
                  if(supplyModal==='add'){
                    await fetch('/api/admin/supplies',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(supplyForm)})
                    showToast('Insumo añadido')
                  } else {
                    await fetch('/api/admin/supplies',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:supplyModal.id,...supplyForm})})
                    showToast('Insumo actualizado')
                  }
                  setSupplyModal(null);loadAll()
                }} style={{flex:1,background:black,color:white,border:'none',padding:'0.85rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Guardar</button>
                <button onClick={()=>setSupplyModal(null)} style={{background:'rgba(31,20,14,0.06)',color:black,border:'none',padding:'0.85rem 1.25rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {toast&&<div style={{position:'fixed',bottom:'5rem',right:'1rem',background:black,color:white,padding:'0.85rem 1.25rem',borderRadius:8,fontSize:'0.74rem',borderLeft:'3px solid '+gold,zIndex:9999,maxWidth:280}}>{toast}</div>}
      </div>
    </>
  )
}

function ClientHistory({ client }) {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    fetch('/api/admin/sales?email='+encodeURIComponent(client.email||client.user_email||''))
      .then(r=>r.json())
      .then(d=>{ setSales(d.sales||[]); setLoading(false) })
      .catch(()=>setLoading(false))
  },[client.id])

  const total = sales.filter(s=>s.status==='paid').reduce((a,s)=>a+parseFloat(s.amount||0),0)

  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0}}>
      {/* Scrollable list */}
      <div style={{flex:1,overflowY:'auto',padding:'0 1.5rem'}}>
        {loading&&<div style={{textAlign:'center',color:'#7A6452',fontSize:'0.78rem',padding:'2rem'}}>Cargando...</div>}
        {!loading&&sales.length===0&&<div style={{textAlign:'center',color:'#7A6452',fontSize:'0.78rem',padding:'2rem'}}>No se encontraron transacciones.</div>}
        {!loading&&sales.length>0&&(
          <div style={{border:'1px solid rgba(31,20,14,0.07)',borderRadius:8,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 120px 100px',padding:'0.5rem 1rem',background:'rgba(31,20,14,0.03)',fontSize:'0.52rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'#7A6452',gap:'0.5rem'}}>
              <span>Transaction ID</span><span>Fecha</span><span style={{textAlign:'right'}}>Amount</span>
            </div>
            {sales.map((s,i)=>(
              <div key={s.id} style={{display:'grid',gridTemplateColumns:'1fr 120px 100px',padding:'0.75rem 1rem',borderTop:'1px solid rgba(31,20,14,0.05)',alignItems:'center',gap:'0.5rem'}}>
                <div style={{fontSize:'0.62rem',color:'#7A6452',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:'monospace'}}>{s.id}</div>
                <div style={{fontSize:'0.68rem',color:'#1F140E'}}>{new Date(s.sale_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
                <div style={{fontSize:'0.75rem',fontWeight:600,color:s.status==='paid'?'#2d8a60':'#c0392b',textAlign:'right'}}>{s.status==='refunded'?'-':''}${Math.abs(parseFloat(s.amount||0)).toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Total — always visible at bottom */}
      <div style={{padding:'1rem 1.5rem 1.5rem',borderTop:'1px solid rgba(31,20,14,0.07)',flexShrink:0,display:'flex',justifyContent:'space-between',alignItems:'center',background:'#FBF7EE'}}>
        <span style={{fontSize:'0.62rem',color:'#7A6452',letterSpacing:'0.1em',textTransform:'uppercase'}}>{sales.filter(s=>s.status==='paid').length} payment{sales.filter(s=>s.status==='paid').length!==1?'s':''}</span>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:'0.56rem',color:'#7A6452',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:'0.15rem'}}>Total Gastado</div>
          <div style={{fontSize:'1.1rem',fontFamily:'Instrument Serif,serif',fontWeight:400,color:'#1F140E'}}>${total.toFixed(2)}</div>
        </div>
      </div>
    </div>
  )
}

function FilesListForClient({ userId, showToast }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{ loadFiles() },[userId])

  async function loadFiles() {
    setLoading(true)
    const res = await fetch('/api/admin/files?user_id='+userId)
    const data = await res.json()
    setFiles(data.files||[])
    setLoading(false)
  }

  async function deleteFile(path) {
    await fetch('/api/admin/files', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ path }) })
    showToast('Archivo eliminado')
    loadFiles()
  }

  async function viewFile(name) {
    window.open('/api/admin/files?user_id='+userId+'&file='+encodeURIComponent(name),'_blank')
  }

  if(loading) return <div style={{textAlign:'center',color:'#7A6452',fontSize:'0.78rem',padding:'1rem 0'}}>Cargando...</div>
  if(files.length===0) return <div style={{textAlign:'center',color:'#7A6452',fontSize:'0.78rem',padding:'1rem 0'}}>Sin archivos guardados.</div>

  return(
    <div>
      <div style={{fontSize:'0.56rem',letterSpacing:'0.13em',textTransform:'uppercase',color:'#7A6452',marginBottom:'0.75rem'}}>Archivos guardados</div>
      {files.map(f=>(<div key={f.name} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.75rem 0',borderBottom:'1px solid rgba(31,20,14,0.06)'}}><div style={{fontSize:'0.78rem',color:'#1F140E',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,marginRight:'1rem'}}>{f.name.replace(/^\d+_/,'')}</div><div style={{display:'flex',gap:'0.4rem',flexShrink:0}}><button onClick={()=>viewFile(f.name)} style={{padding:'0.3rem 0.65rem',background:'rgba(227,90,27,0.1)',color:'#E35A1B',border:'1px solid rgba(227,90,27,0.25)',borderRadius:3,cursor:'pointer',fontFamily:'DM Sans,sans-serif',fontSize:'0.56rem',textTransform:'uppercase'}}>Ver</button><button onClick={()=>deleteFile('clients/'+userId+'/'+f.name)} style={{padding:'0.3rem 0.65rem',background:'rgba(192,57,43,0.08)',color:'#a93226',border:'none',borderRadius:3,cursor:'pointer',fontFamily:'DM Sans,sans-serif',fontSize:'0.56rem',textTransform:'uppercase'}}>x</button></div></div>))}
    </div>
  )
}
                                                                            
