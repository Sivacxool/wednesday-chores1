import { useState, useEffect, useRef } from "react";

const CATEGORIES = [
  { id: "trash",  label: "ทิ้งขยะ",  en: "Trash Disposal", glyph: "🗑" },
  { id: "sweep",  label: "กวาดห้อง", en: "Sweep the Room",  glyph: "🧹" },
  { id: "desk",   label: "จัดโต๊ะ",  en: "Organize Desk",  glyph: "📚" },
  { id: "group",  label: "รูปรวม",   en: "Group Photo",    glyph: "📸" },
  { id: "other",  label: "อื่นๆ",    en: "Miscellaneous",  glyph: "✦"  },
];

const ADMIN_PASS  = "wednesday";
const THAI_DAYS   = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์"];
const THAI_MONTHS = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];

const todayStr = () => new Date().toISOString().slice(0,10);
const fileToB64 = f => new Promise(res => { const r=new FileReader(); r.onload=e=>res(e.target.result); r.readAsDataURL(f); });

async function aiCategorize(b64, mimeType) {
  const key = import.meta.env.VITE_ANTHROPIC_KEY;
  if (!key) return "other";
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true" },
      body: JSON.stringify({
        model:"claude-sonnet-4-20250514", max_tokens:30,
        messages:[{ role:"user", content:[
          { type:"image", source:{ type:"base64", media_type:mimeType, data:b64.split(",")[1] }},
          { type:"text",  text:"Categorize: trash|sweep|desk|group|other. trash=garbage/bins, sweep=cleaning floors, desk=table organizing, group=people group photo, other=else. Reply ONLY the ID." }
        ]}]
      })
    });
    const d = await res.json();
    const r = d.content?.[0]?.text?.trim().toLowerCase() ?? "other";
    return CATEGORIES.some(c=>c.id===r) ? r : "other";
  } catch { return "other"; }
}

export default function App() {
  const [scene,      setScene]     = useState("public");
  const [pass,       setPass]      = useState("");
  const [wrongPass,  setWrongPass] = useState(false);
  const [photos,     setPhotos]    = useState({});
  const [viewDate,   setViewDate]  = useState(todayStr());
  const [lightbox,   setLightbox]  = useState(null);
  const [uploading,  setUploading] = useState(false);
  const [uploadMsg,  setUploadMsg] = useState("");
  const [uploadList, setUploadList]= useState([]);
  const fileRef = useRef();

  useEffect(() => {
    try { const s=localStorage.getItem("wed_photos"); if(s) setPhotos(JSON.parse(s)); } catch {}
  }, []);

  const savePhotos = next => {
    setPhotos(next);
    try { localStorage.setItem("wed_photos", JSON.stringify(next)); } catch {}
  };

  const handleFiles = async (files, forceCat=null) => {
    if (!files.length) return;
    setUploading(true);
    const log=[];
    for (const f of files) {
      setUploadMsg(`⚙ กำลังจัดหมวดหมู่ ${f.name}…`);
      const b64 = await fileToB64(f);
      const cat = forceCat ?? await aiCategorize(b64, f.type);
      const catLabel = CATEGORIES.find(c=>c.id===cat)?.label ?? cat;
      const entry = { id:`${Date.now()}_${Math.random()}`, b64, date:viewDate, name:f.name, cat };
      log.push(`✓ ${f.name} → ${catLabel}`);
      setUploadList([...log]);
      setPhotos(prev => { const next={...prev,[cat]:[...(prev[cat]||[]),entry]}; savePhotos(next); return next; });
    }
    setUploadMsg("อัพโหลดสำเร็จ");
    setUploading(false);
    setTimeout(()=>{ setUploadMsg(""); setUploadList([]); }, 4000);
  };

  const deletePhoto = (catId, photoId) => {
    setPhotos(prev => { const next={...prev,[catId]:(prev[catId]||[]).filter(p=>p.id!==photoId)}; savePhotos(next); return next; });
  };

  const datePhotos={};
  for(const cat of CATEGORIES) datePhotos[cat.id]=(photos[cat.id]||[]).filter(p=>p.date===viewDate);
  const totalCount=Object.values(datePhotos).reduce((s,a)=>s+a.length,0);
  const vDate=new Date(viewDate+"T00:00:00");

  const G={
    page:{minHeight:"100vh",background:"#0b0908",fontFamily:"'IM Fell English',Georgia,serif",color:"#e2d9c8",overflowX:"hidden"},
    header:{textAlign:"center",padding:"2.5rem 1rem 1rem",borderBottom:"1px solid #3a2a1a"},
    titleWrap:{display:"flex",alignItems:"center",justifyContent:"center",gap:"1rem",marginBottom:".4rem"},
    h1:{fontFamily:"'Cinzel Decorative',serif",fontSize:"clamp(1.4rem,4vw,2.5rem)",letterSpacing:".15em",color:"#f0e6d0",margin:0},
    subtitle:{fontSize:".85rem",letterSpacing:".3em",color:"#7a6040",textTransform:"uppercase",marginBottom:"1.2rem"},
    dateBlock:{display:"inline-flex",flexDirection:"column",alignItems:"center",border:"1px solid #3a2a1a",padding:".8rem 2rem",background:"#120f0d",marginBottom:".8rem"},
    dayName:{fontFamily:"'Cinzel Decorative',serif",fontSize:".9rem",color:"#8b4513",letterSpacing:".2em"},
    dayNum:{fontFamily:"'Cinzel Decorative',serif",fontSize:"3rem",lineHeight:1,color:"#e2d9c8"},
    monthYear:{fontSize:".8rem",letterSpacing:".15em",color:"#7a6040"},
    navRow:{display:"flex",alignItems:"center",justifyContent:"center",gap:"1rem",margin:".6rem 0"},
    navBtn:{background:"transparent",border:"1px solid #3a2a1a",color:"#c8b89a",padding:".3rem .9rem",cursor:"pointer",fontFamily:"inherit",fontSize:".8rem"},
    dateInput:{background:"#1a1310",border:"1px solid #3a2a1a",color:"#c8b89a",padding:".3rem .6rem",fontFamily:"inherit",fontSize:".85rem",outline:"none"},
    photoCount:{fontSize:".8rem",color:"#5a4a30",letterSpacing:".15em"},
    divider:{textAlign:"center",color:"#3a2a1a",padding:"1.2rem 0",letterSpacing:".5em",fontSize:"1.1rem"},
    main:{maxWidth:"1100px",margin:"0 auto",padding:"0 1rem 3rem"},
    section:{marginBottom:"2.5rem"},
    catBar:{display:"flex",alignItems:"baseline",gap:".8rem",borderBottom:"1px solid #2a1e12",padding:".5rem 0 .7rem",marginBottom:"1rem"},
    catLabel:{fontFamily:"'Cinzel Decorative',serif",fontSize:"1.1rem",color:"#f0e6d0",letterSpacing:".1em"},
    catEn:{fontSize:".75rem",color:"#5a4030",letterSpacing:".15em",textTransform:"uppercase"},
    catCount:{marginLeft:"auto",fontSize:".8rem",color:"#7a6040",fontStyle:"italic"},
    grid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"8px"},
    card:{position:"relative",overflow:"hidden",background:"#180f0a",border:"1px solid #2a1e12",cursor:"zoom-in",aspectRatio:"1"},
    cardImg:{width:"100%",height:"100%",objectFit:"cover",display:"block",filter:"sepia(.15) brightness(.9)"},
    empty:{textAlign:"center",padding:"4rem 1rem",color:"#3a2a1a"},
    lbBackdrop:{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,cursor:"zoom-out"},
    lbImg:{maxWidth:"90vw",maxHeight:"88vh",objectFit:"contain",border:"1px solid #3a2a1a"},
    lbClose:{position:"fixed",top:"1rem",right:"1.5rem",background:"none",border:"none",color:"#c8b89a",fontSize:"2rem",cursor:"pointer"},
    cobweb:{position:"fixed",top:0,left:0,pointerEvents:"none",zIndex:50},
    cobwebR:{position:"fixed",top:0,right:0,pointerEvents:"none",zIndex:50,transform:"scaleX(-1)"},
    adminBtn:{position:"fixed",bottom:"1.5rem",right:"1.5rem",background:"#1a0f0a",border:"1px solid #3a2a1a",color:"#7a5030",width:"2.5rem",height:"2.5rem",cursor:"pointer",fontSize:"1.2rem",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200},
    footer:{textAlign:"center",padding:"1.5rem",color:"#3a2a1a",fontSize:".8rem",letterSpacing:".2em",borderTop:"1px solid #1a1310"},
    loginPage:{minHeight:"100vh",background:"#0b0908",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'IM Fell English',Georgia,serif"},
    loginBox:{background:"#120f0d",border:"1px solid #3a2a1a",padding:"3rem 2.5rem",textAlign:"center",width:"min(380px,90vw)"},
    loginTitle:{fontFamily:"'Cinzel Decorative',serif",color:"#f0e6d0",fontSize:"1.2rem",letterSpacing:".15em",marginBottom:"2rem"},
    loginInput:{background:"#1a1310",border:"1px solid #3a2a1a",color:"#c8b89a",padding:".6rem .8rem",width:"100%",fontSize:".9rem",fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:".8rem"},
    loginBtn:{width:"100%",background:"#3a1a0a",border:"1px solid #5a2a10",color:"#e2c8a0",padding:".7rem",cursor:"pointer",fontSize:".9rem",fontFamily:"'Cinzel Decorative',serif",letterSpacing:".15em"},
    loginBack:{marginTop:"1.2rem",fontSize:".8rem",color:"#5a4030",cursor:"pointer"},
    loginErr:{color:"#8b2020",fontSize:".8rem",marginBottom:".6rem"},
    adminPage:{minHeight:"100vh",background:"#0b0908",fontFamily:"'IM Fell English',Georgia,serif",color:"#e2d9c8"},
    adminHeader:{display:"flex",alignItems:"center",gap:"1rem",padding:"1rem 1.5rem",borderBottom:"1px solid #2a1e12",flexWrap:"wrap"},
    adminTitle:{fontFamily:"'Cinzel Decorative',serif",color:"#f0e6d0",fontSize:"1rem",letterSpacing:".15em",marginRight:"auto"},
    adminSmBtn:{background:"#1a1310",border:"1px solid #3a2a1a",color:"#c8b89a",padding:".4rem .9rem",cursor:"pointer",fontSize:".8rem",fontFamily:"inherit"},
    adminBody:{maxWidth:"1100px",margin:"0 auto",padding:"1.5rem"},
    uploadZone:{border:"1px dashed #3a2a1a",padding:"2.5rem 1rem",textAlign:"center",cursor:"pointer",background:"#120f0d",marginBottom:"1.5rem"},
    uploadText:{fontSize:".95rem",color:"#c8b89a",letterSpacing:".1em"},
    uploadSub:{fontSize:".75rem",color:"#5a4030",marginTop:".3rem"},
    uploadLog:{background:"#0d0b09",border:"1px solid #2a1e12",padding:".8rem 1rem",marginBottom:"1.5rem",maxHeight:"120px",overflowY:"auto"},
    logLine:{fontSize:".8rem",color:"#7a8a50",fontFamily:"monospace",lineHeight:1.8},
    adminCats:{display:"flex",flexDirection:"column",gap:"1.5rem"},
    adminCatBox:{background:"#120f0d",border:"1px solid #2a1e12",padding:"1rem"},
    adminCatH:{display:"flex",alignItems:"center",gap:".6rem",marginBottom:"1rem",paddingBottom:".5rem",borderBottom:"1px solid #1a1410"},
    adminCatL:{fontFamily:"'Cinzel Decorative',serif",fontSize:".85rem",color:"#f0e6d0",letterSpacing:".1em"},
    adminCatC:{marginLeft:"auto",fontSize:".75rem",color:"#5a4030",fontStyle:"italic"},
    addBtn:{background:"#1a1310",border:"1px solid #3a2a1a",color:"#7a6040",padding:".2rem .6rem",cursor:"pointer",fontSize:".85rem"},
    adminGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:"8px"},
    adminCard:{position:"relative",background:"#1a1310",border:"1px solid #2a1e12",aspectRatio:"1",overflow:"hidden"},
    adminThumb:{width:"100%",height:"100%",objectFit:"cover",display:"block",filter:"grayscale(.3) brightness(.85)"},
    adminDel:{position:"absolute",top:"4px",right:"4px",background:"rgba(0,0,0,.8)",border:"none",color:"#c05030",cursor:"pointer",fontSize:".9rem",padding:"2px 6px"},
    adminDate:{position:"absolute",bottom:0,left:0,right:0,background:"rgba(0,0,0,.7)",fontSize:".65rem",color:"#7a6040",padding:"2px 4px",fontFamily:"monospace"},
    emptySlot:{fontSize:".75rem",color:"#3a2a1a",fontStyle:"italic",padding:".5rem"},
  };

  const webStyle=`@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400&family=IM+Fell+English:ital@0;1&display=swap');*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:#3a2a1a}.nb:hover{border-color:#5a3a20!important;color:#e2c8a0!important}.pc:hover{border-color:#5a3a20!important}`;

  if(scene==="login") return (
    <><style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400&family=IM+Fell+English:ital@0;1&display=swap');`}</style>
    <div style={G.loginPage}><div style={G.loginBox}>
      <div style={{fontSize:"2.5rem",marginBottom:".5rem"}}>🕷</div>
      <div style={G.loginTitle}>ห้องลับของแม่บ้าน</div>
      {wrongPass && <div style={G.loginErr}>รหัสผ่านไม่ถูกต้อง</div>}
      <input style={G.loginInput} type="password" placeholder="รหัสผ่าน…" value={pass}
        onChange={e=>setPass(e.target.value)} autoFocus
        onKeyDown={e=>{if(e.key==="Enter"){if(pass===ADMIN_PASS){setScene("admin");setWrongPass(false);}else setWrongPass(true);}}}/>
      <button style={G.loginBtn} onClick={()=>{if(pass===ADMIN_PASS){setScene("admin");setWrongPass(false);}else setWrongPass(true);}}>เข้าสู่ระบบ</button>
      <div style={G.loginBack} onClick={()=>setScene("public")}>← กลับหน้าหลัก</div>
    </div></div></>
  );

  if(scene==="admin") return (
    <><style>{webStyle}</style>
    <div style={G.adminPage}>
      <div style={G.adminHeader}>
        <span style={{fontSize:"1.5rem"}}>🕷</span>
        <span style={G.adminTitle}>ห้องควบคุม — Wednesday Chores</span>
        <input type="date" value={viewDate} onChange={e=>setViewDate(e.target.value)} style={{...G.dateInput,fontSize:".8rem"}}/>
        <button style={G.adminSmBtn} onClick={()=>setScene("public")}>👁 หน้าแสดง</button>
        <button style={G.adminSmBtn} onClick={()=>setScene("public")}>ออกจากระบบ</button>
      </div>
      <div style={G.adminBody}>
        <div style={G.uploadZone} onClick={()=>fileRef.current.click()}
          onDragOver={e=>e.preventDefault()}
          onDrop={e=>{e.preventDefault();handleFiles(Array.from(e.dataTransfer.files));}}>
          <input ref={fileRef} type="file" multiple accept="image/*" style={{display:"none"}} onChange={e=>handleFiles(Array.from(e.target.files))}/>
          <div style={{fontSize:"2.5rem",marginBottom:".5rem"}}>{uploading?"⚙":"🖼"}</div>
          {uploading
            ? <div style={{...G.uploadText,color:"#8b6030"}}>{uploadMsg}</div>
            : <><div style={G.uploadText}>ลากรูปมาวางที่นี่ หรือ คลิกเพื่อเลือก</div><div style={G.uploadSub}>AI จะจัดหมวดหมู่ให้อัตโนมัติ</div></>}
        </div>
        {uploadList.length>0 && <div style={G.uploadLog}>{uploadList.map((l,i)=><div key={i} style={G.logLine}>{l}</div>)}</div>}
        <div style={G.adminCats}>
          {CATEGORIES.map(cat=>{
            const cp=photos[cat.id]||[];
            return <div key={cat.id} style={G.adminCatBox}>
              <div style={G.adminCatH}>
                <span style={{fontSize:"1.2rem"}}>{cat.glyph}</span>
                <span style={G.adminCatL}>{cat.label}</span>
                <span style={{fontSize:".75rem",color:"#5a4030"}}>{cat.en}</span>
                <span style={G.adminCatC}>{cp.length} รูปทั้งหมด</span>
                <label style={G.addBtn}>+ เพิ่ม<input type="file" multiple accept="image/*" style={{display:"none"}} onChange={e=>handleFiles(Array.from(e.target.files),cat.id)}/></label>
              </div>
              <div style={G.adminGrid}>
                {cp.length===0 ? <div style={G.emptySlot}>— ยังไม่มีรูป —</div>
                  : cp.map(p=><div key={p.id} style={G.adminCard}>
                    <img src={p.b64} style={G.adminThumb} alt={p.name}/>
                    <div style={G.adminDate}>{p.date}</div>
                    <button style={G.adminDel} onClick={()=>deletePhoto(cat.id,p.id)}>✕</button>
                  </div>)}
              </div>
            </div>;
          })}
        </div>
      </div>
    </div></>
  );

  const CW=()=><g stroke="#2a1e12" strokeWidth=".8" opacity=".9">
    <line x1="0" y1="0" x2="140" y2="50"/><line x1="0" y1="0" x2="90" y2="140"/>
    <line x1="0" y1="0" x2="140" y2="100"/><line x1="0" y1="0" x2="40" y2="140"/>
    <path d="M30,0 Q15,15 0,30" fill="none"/><path d="M65,0 Q35,30 0,65" fill="none"/>
    <path d="M100,5 Q55,50 5,100" fill="none"/><path d="M130,20 Q75,75 20,130" fill="none"/>
  </g>;

  return (
    <><style>{webStyle}</style>
    <svg style={G.cobweb} width="140" height="140" viewBox="0 0 140 140" fill="none"><CW/></svg>
    <svg style={G.cobwebR} width="140" height="140" viewBox="0 0 140 140" fill="none"><CW/></svg>
    <div style={G.page}>
      <header style={G.header}>
        <div style={G.titleWrap}><span style={{fontSize:"2rem",opacity:.7}}>⚰</span><h1 style={G.h1}>บันทึกงานบ้าน</h1><span style={{fontSize:"2rem",opacity:.7}}>⚰</span></div>
        <div style={G.subtitle}>Household Chore Records · Wednesday Edition</div>
        <div style={G.dateBlock}>
          <div style={G.dayName}>วัน{THAI_DAYS[vDate.getDay()]}</div>
          <div style={G.dayNum}>{vDate.getDate()}</div>
          <div style={G.monthYear}>{THAI_MONTHS[vDate.getMonth()]} {vDate.getFullYear()+543}</div>
        </div>
        <div style={G.navRow}>
          <button className="nb" style={G.navBtn} onClick={()=>{const d=new Date(viewDate);d.setDate(d.getDate()-1);setViewDate(d.toISOString().slice(0,10));}}>‹ ก่อนหน้า</button>
          <input style={G.dateInput} type="date" value={viewDate} onChange={e=>setViewDate(e.target.value)}/>
          <button className="nb" style={G.navBtn} onClick={()=>{const d=new Date(viewDate);d.setDate(d.getDate()+1);setViewDate(d.toISOString().slice(0,10));}}>ถัดไป ›</button>
        </div>
        <div style={G.photoCount}>{totalCount} รูปภาพ</div>
      </header>
      <div style={G.divider}>— ✦ —</div>
      <main style={G.main}>
        {totalCount===0
          ? <div style={G.empty}><div style={{fontSize:"3rem",marginBottom:"1rem"}}>🕸</div><div style={{fontSize:"1.1rem",letterSpacing:".2em",fontStyle:"italic"}}>ยังไม่มีบันทึกสำหรับวันนี้</div></div>
          : CATEGORIES.map(cat=>{
              const cp=datePhotos[cat.id]||[];
              if(!cp.length) return null;
              return <section key={cat.id} style={G.section}>
                <div style={G.catBar}>
                  <span style={{fontSize:"1.4rem"}}>{cat.glyph}</span>
                  <span style={G.catLabel}>{cat.label}</span>
                  <span style={G.catEn}>{cat.en}</span>
                  <span style={G.catCount}>{cp.length} รูป</span>
                </div>
                <div style={G.grid}>
                  {cp.map(p=><div key={p.id} className="pc" style={G.card} onClick={()=>setLightbox(p)}>
                    <img src={p.b64} style={G.cardImg} alt={cat.label}/>
                  </div>)}
                </div>
              </section>;
            })
        }
      </main>
      <footer style={G.footer}>⚰ งานบ้านสำเร็จ งานดีมีสุข ⚰</footer>
    </div>
    {lightbox&&<div style={G.lbBackdrop} onClick={()=>setLightbox(null)}>
      <button style={G.lbClose} onClick={()=>setLightbox(null)}>✕</button>
      <img src={lightbox.b64} style={G.lbImg} alt="" onClick={e=>e.stopPropagation()}/>
    </div>}
    <button style={G.adminBtn} onClick={()=>setScene("login")}>🕷</button>
    </>
  );
}
