import { useState, useEffect, useRef } from "react";

const C = {
  blue:     "#394A76",
  blueDark: "#222d4a",
  blueLight:"#5a72a8",
  orange:   "#EC5924",
  gray:     "#7a90b8",
  ink:      "#ffffff",
  sub:      "#a0b0d0",
  grid:     "#2e4070",
  bg:       "#1e2d50",
  surface:  "#243464",
  border:   "#3a4e7a",
  chartBg:  "#ffffff",
  chartGrid:"#ebebeb",
  chartInk: "#1a1a2e",
  chartSub: "#5a6175",
};

const SUBGRADES = [
  { key:"1A", grade:1, label:"1A", position:"เจ้าหน้าที่ทั่วไป" },
  { key:"2B", grade:2, label:"2B", position:"เจ้าหน้าที่สนับสนุน" },
  { key:"2A", grade:2, label:"2A", position:"เจ้าหน้าที่สนับสนุน" },
  { key:"3C", grade:3, label:"3C", position:"นักวิชาการ" },
  { key:"3B", grade:3, label:"3B", position:"นักวิชาการ" },
  { key:"3A", grade:3, label:"3A", position:"นักวิชาการ" },
  { key:"4C", grade:4, label:"4C", position:"นักวิชาการอาวุโส" },
  { key:"4B", grade:4, label:"4B", position:"นักวิชาการอาวุโส" },
  { key:"4A", grade:4, label:"4A", position:"นักวิชาการอาวุโส" },
  { key:"5B", grade:5, label:"5B", position:"ผู้เชี่ยวชาญ/ผู้บริหาร" },
  { key:"5A", grade:5, label:"5A", position:"ผู้เชี่ยวชาญ/ผู้บริหาร" },
  { key:"6B", grade:6, label:"6B", position:"ผู้บริหารระดับสูง" },
  { key:"6A", grade:6, label:"6A", position:"ผู้บริหารระดับสูง" },
];

const DIST = {"1A":30,"2B":28,"2A":22,"3C":22,"3B":18,"3A":14,"4C":12,"4B":9,"4A":7,"5B":6,"5A":4,"6B":3,"6A":2};
const YEAR_RANGE = {
  "1A":[0,5],"2B":[1,6],"2A":[2,8],"3C":[2,7],"3B":[3,10],"3A":[4,13],
  "4C":[5,10],"4B":[6,12],"4A":[7,14],"5B":[8,13],"5A":[9,15],"6B":[10,15],"6A":[11,15],
};
const GRADE_DOT = {1:"#c5cad4",2:"#8fa3bf",3:"#5a72a8",4:"#394A76",5:"#EC5924",6:"#a83e18"};

const ACTION_TAGS = [
  { key:"promote",    label:"เลื่อนตำแหน่ง",      color:"#1a7340", bg:"#edfaf3" },
  { key:"succession", label:"วางแผน Succession",   color:C.blue,    bg:"#eef1f8" },
  { key:"retention",  label:"Retention Interview", color:"#b91c1c", bg:"#fef2f2" },
  { key:"stretch",    label:"Stretch Assignment",  color:C.orange,  bg:"#fff4f0" },
];

const RISK_ITEMS = [
  { icon:"⏳", title:"Career Stagnation",    color:C.blue,   body:"อยู่ Sub-Grade เดิมนานเกินเกณฑ์ สะท้อนว่าระบบ promotion ไม่ทำงาน หรือพนักงานขาด development plan" },
  { icon:"🚪", title:"Retention Risk",       color:C.orange, body:"ไม่เห็นความก้าวหน้า → disengage → ลาออก สูญเสีย know-how และต้นทุนการสร้างคนที่สะสมมา" },
  { icon:"💡", title:"Organizational Waste", color:C.blue,   body:"ประสบการณ์สูงแต่ถูก assign งานระดับต้น ศักยภาพไม่ถูกออกมา กระทบ morale ทีม" },
];

function seededRandom(seed) {
  let s = seed;
  return () => { s=(s*16807)%2147483647; return (s-1)/2147483646; };
}
function generateEmployees() {
  const rng=seededRandom(42); const emps=[]; let id=1;
  const total=190, tw=Object.values(DIST).reduce((a,b)=>a+b,0);
  let rem=total; const counts={};
  SUBGRADES.forEach((sg,i)=>{ if(i<SUBGRADES.length-1){counts[sg.key]=Math.round((DIST[sg.key]/tw)*total);rem-=counts[sg.key];}else counts[sg.key]=rem; });
  SUBGRADES.forEach(sg=>{ const [mn,mx]=YEAR_RANGE[sg.key]; for(let i=0;i<counts[sg.key];i++){ const years=+(mn+rng()*(mx-mn)).toFixed(1); const yIdx=SUBGRADES.findIndex(s=>s.key===sg.key); emps.push({id:id++,subgrade:sg.key,grade:sg.grade,yIdx,yPos:yIdx+(rng()-0.5)*0.36,years,name:`พนักงาน #${id-1}`}); } });
  return emps;
}
const ALL_EMP = generateEmployees();
const isAtRisk = e => e.years>=10 && e.grade<=3;

const Pill = ({children,active,color,onClick}) => (
  <button onClick={onClick} style={{padding:"4px 13px",borderRadius:20,border:`1.5px solid ${active?color:"#3a4e7a"}`,background:active?color:"transparent",color:active?"#fff":C.sub,cursor:"pointer",fontSize:11,fontWeight:active?700:500,transition:"all 0.15s",whiteSpace:"nowrap"}}>
    {children}
  </button>
);

export default function App() {
  const containerRef = useRef(null);
  const [cw, setCw] = useState(900);

  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      for (const e of entries) setCw(e.contentRect.width);
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const [hovered,setHovered] = useState(null);
  const [tooltip,setTooltip] = useState(null);
  const [filterGrade,setFG]  = useState(null);
  const [onlyRisk,setOnly]   = useState(false);
  const [selEmp,setSel]      = useState(null);
  const [acts,setActs]       = useState({});
  const [riskOpen,setRisk]   = useState(false);

  // responsive breakpoints
  const compact = cw < 700;
  const wide    = cw >= 960;

  // panel width scales with container
  const PANEL_W  = selEmp ? (compact ? 0 : Math.min(240, cw * 0.28)) : 0;
  const PANEL_GAP = selEmp && !compact ? 12 : 0;

  // SVG dimensions — fills available width
  const SVG_W  = cw - PANEL_W - PANEL_GAP;
  const SVG_H  = compact ? 420 : 500;
  const PAD    = { top:32, right:20, bottom:50, left: compact ? 150 : 210 };
  const pW     = SVG_W - PAD.left - PAD.right;
  const pH     = SVG_H - PAD.top  - PAD.bottom;

  const xSc = v => (v/15)*pW;
  const ySc = i => pH-(i/(SUBGRADES.length-1))*pH;
  const xTicks = compact ? [0,5,10,15] : [0,2,4,6,8,10,12,14];

  const atRisk   = ALL_EMP.filter(isAtRisk);
  const avgYears = (ALL_EMP.reduce((s,e)=>s+e.years,0)/ALL_EMP.length).toFixed(1);
  const actioned = Object.keys(acts).filter(id=>acts[id]?.length>0).length;
  const topG     = Math.max(...atRisk.map(e=>e.grade));

  let dots = filterGrade ? ALL_EMP.filter(e=>e.grade===filterGrade) : ALL_EMP;
  if (onlyRisk) dots = dots.filter(isAtRisk);

  const toggle=(eid,key)=>setActs(p=>{const c=p[eid]||[];return{...p,[eid]:c.includes(key)?c.filter(k=>k!==key):[...c,key]};});

  const kpis=[
    {label:"พนักงานทั้งหมด",      val:ALL_EMP.length,  unit:"คน", sub:"ข้อมูล ณ ปัจจุบัน",           alert:false},
    {label:"กลุ่มน่าเป็นห่วง",   val:atRisk.length,   unit:"คน", sub:"อายุงาน ≥10 ปี · Grade 1–3",  alert:true},
    {label:"อัตราส่วน At-Risk",   val:`${(atRisk.length/ALL_EMP.length*100).toFixed(1)}`,unit:"%",sub:"ของพนักงานทั้งหมด",alert:true},
    {label:"อายุงานเฉลี่ย",       val:avgYears,        unit:"ปี", sub:"ค่าเฉลี่ยองค์กร",               alert:false},
    {label:"ถูก Action แล้ว",     val:actioned,        unit:"คน", sub:`จาก ${atRisk.length} คน`,      alert:false},
    {label:"Grade สูงสุดที่เสี่ยง",val:`G${topG}`,    unit:"",   sub:SUBGRADES.find(s=>s.grade===topG)?.position||"", alert:true},
  ];

  const kpiCols = compact ? 3 : 6;

  return (
    <div ref={containerRef} style={{background:`linear-gradient(160deg,#1a2644 0%,#222f58 60%,#1e2d50 100%)`,minHeight:"100vh",fontFamily:"'Sarabun',sans-serif",padding: compact?"16px 12px":"28px 24px",boxSizing:"border-box"}}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>

      <div style={{maxWidth:1200,margin:"0 auto",display:"flex",flexDirection:"column",gap:14}}>

        {/* ── HEADER ── */}
        <div style={{background:C.surface,borderRadius:12,padding: compact?"14px 16px":"20px 26px",borderBottom:`3px solid ${C.orange}`,boxShadow:"0 4px 20px rgba(0,0,0,0.2)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:4,height:44,background:`linear-gradient(180deg,${C.orange},${C.blue})`,borderRadius:4,flexShrink:0}}/>
              <div>
                <div style={{fontSize:9,letterSpacing:3,color:C.gray,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>สกสว. · Human Resource Strategic Analytics</div>
                <div style={{fontSize:compact?17:21,fontWeight:700,color:"#fff",lineHeight:1.2}}>ระบบวิเคราะห์เส้นทางสายอาชีพ</div>
                {!compact&&<div style={{fontSize:11.5,color:C.sub,marginTop:4,lineHeight:1.5}}>
                  Career Design Dashboard · อายุงาน × Sub-Grade · พนักงาน {ALL_EMP.length} คน ·{" "}
                  <span style={{color:C.orange,fontWeight:700}}>▲ = กลุ่มน่าเป็นห่วง</span>
                </div>}
              </div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{background:C.orange,borderRadius:6,padding:"4px 12px",display:"inline-block",marginBottom:4}}>
                <span style={{fontSize:10,color:"#fff",fontWeight:700,letterSpacing:1.5}}>LIVE DATA</span>
              </div>
              <div style={{fontSize:10,color:C.gray}}>มีนาคม 2569</div>
            </div>
          </div>
        </div>

        {/* ── KPI CARDS ── */}
        <div style={{display:"grid",gridTemplateColumns:`repeat(${kpiCols},1fr)`,gap:10}}>
          {kpis.map((k,i)=>(
            <div key={i} style={{background:"#ffffff",borderRadius:10,padding:"14px 13px",
              borderTop:`3px solid ${k.alert?C.orange:C.blue}`,
              boxShadow:"0 2px 8px rgba(0,0,0,0.15)",transition:"transform 0.15s,box-shadow 0.15s",cursor:"default"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 18px rgba(0,0,0,0.25)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.15)";}}>
              <div style={{fontSize:9,color:"#939598",fontWeight:700,textTransform:"uppercase",letterSpacing:0.6,marginBottom:6,lineHeight:1.4}}>{k.label}</div>
              <div style={{display:"flex",alignItems:"baseline",gap:3,marginBottom:4}}>
                <span style={{fontSize:compact?20:26,fontWeight:700,color:k.alert?C.orange:C.blue,lineHeight:1}}>{k.val}</span>
                {k.unit&&<span style={{fontSize:11,color:k.alert?C.orange:C.blue,fontWeight:600}}>{k.unit}</span>}
              </div>
              <div style={{fontSize:9,color:"#939598",lineHeight:1.4}}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ── RISK PANEL ── */}
        <div>
          <button onClick={()=>setRisk(p=>!p)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",background:C.surface,border:`1px solid ${riskOpen?C.orange:C.border}`,borderRadius:riskOpen?"10px 10px 0 0":"10px",padding:"11px 16px",cursor:"pointer",transition:"border-color 0.18s",boxShadow:"0 2px 8px rgba(0,0,0,0.12)"}}>
            <div style={{width:22,height:22,borderRadius:6,background:riskOpen?C.orange:`${C.orange}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{fontSize:12,color:riskOpen?"#fff":C.orange}}>⚠</span>
            </div>
            <span style={{fontSize:12,fontWeight:700,color:"#fff",flex:1,textAlign:"left"}}>ความเสี่ยง 3 ด้านที่ผู้บริหารควรทราบ</span>
            <span style={{fontSize:12,color:C.orange,display:"inline-block",transform:riskOpen?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</span>
          </button>
          {riskOpen&&(
            <div style={{background:C.surface,border:`1px solid ${C.orange}`,borderTop:"none",borderRadius:"0 0 10px 10px",padding:"16px",display:"grid",gridTemplateColumns:compact?"1fr":"repeat(3,1fr)",gap:12,boxShadow:"0 4px 12px rgba(0,0,0,0.15)"}}>
              {RISK_ITEMS.map((r,i)=>(
                <div key={i} style={{background:"#1a2644",borderRadius:8,padding:"13px 14px",borderLeft:`3px solid ${r.color}`}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#fff",marginBottom:6}}>{r.icon} {r.title}</div>
                  <div style={{fontSize:11,color:C.sub,lineHeight:1.7}}>{r.body}</div>
                </div>
              ))}
              <div style={{gridColumn:"1/-1",background:"#1a2644",borderRadius:7,padding:"10px 14px",borderLeft:`3px solid ${C.blue}`}}>
                <span style={{fontSize:11,color:C.sub,lineHeight:1.6}}><b style={{color:"#fff"}}>แนวทางเชิงระบบ:</b> กำหนด "อายุงานสูงสุดต่อ Sub-Grade" เป็น policy — หากพนักงานอยู่ Sub-Grade เดิมเกิน threshold ให้มี Review บังคับ เพื่อป้องกัน Career Stagnation</span>
              </div>
            </div>
          )}
        </div>

        {/* ── FILTER BAR ── */}
        <div style={{background:C.surface,borderRadius:10,padding:"10px 14px",border:`1px solid ${C.border}`,boxShadow:"0 2px 8px rgba(0,0,0,0.12)",display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:C.gray,fontWeight:600,marginRight:2}}>Grade</span>
          <Pill active={!filterGrade} color={C.blue} onClick={()=>setFG(null)}>ทั้งหมด</Pill>
          {[1,2,3,4,5,6].map(g=>(
            <Pill key={g} active={filterGrade===g} color={GRADE_DOT[g]} onClick={()=>setFG(filterGrade===g?null:g)}>G{g}</Pill>
          ))}
          <div style={{width:1,height:18,background:C.border,margin:"0 2px"}}/>
          <Pill active={onlyRisk} color={C.orange} onClick={()=>setOnly(p=>!p)}>▲ กลุ่มเสี่ยง</Pill>
          <div style={{marginLeft:"auto",display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
            <span style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:C.sub}}>
              <svg width="12" height="11"><polygon points="6,1 11,10 1,10" fill={C.orange}/></svg>น่าเป็นห่วง
            </span>
            <span style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:C.sub}}>
              <svg width="12" height="12"><circle cx="6" cy="6" r="5" fill={C.blueLight} fillOpacity={0.8}/></svg>ทั่วไป
            </span>
            <span style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:C.sub}}>
              <svg width="10" height="10"><circle cx="5" cy="5" r="4" fill="#1a7340"/></svg>Action แล้ว
            </span>
          </div>
        </div>

        {/* ── CHART + ACTION PANEL ── */}
        <div style={{display:"flex",gap:PANEL_GAP,alignItems:"flex-start"}}>

          {/* Chart */}
          <div style={{flex:1,minWidth:0,background:"#ffffff",borderRadius:12,padding:"20px 14px 10px",boxShadow:"0 4px 20px rgba(0,0,0,0.25)",border:"1px solid #e0e4f0",position:"relative"}}>
            <svg width="100%" height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{display:"block",overflow:"visible"}}>
              <g transform={`translate(${PAD.left},${PAD.top})`}>

                {/* alternating band */}
                {[1,2,3,4,5,6].map(g=>{
                  const sgs=SUBGRADES.filter(s=>s.grade===g);
                  const i0=SUBGRADES.findIndex(s=>s.key===sgs[0].key);
                  const i1=SUBGRADES.findIndex(s=>s.key===sgs[sgs.length-1].key);
                  const step=pH/(SUBGRADES.length-1);
                  return <rect key={g} x={0} y={ySc(i1)-step*0.5} width={pW} height={ySc(i0)-ySc(i1)+step} fill={g%2===0?"#f7f9fd":"#ffffff"}/>;
                })}

                {/* grid */}
                {SUBGRADES.map((_,i)=>(
                  <line key={i} x1={0} y1={ySc(i)} x2={pW} y2={ySc(i)} stroke="#ebebeb" strokeWidth={0.8}/>
                ))}
                {[0,5,10,15].map(t=>(
                  <line key={t} x1={xSc(t)} y1={0} x2={xSc(t)} y2={pH} stroke={t===10?"#EC592435":"#ebebeb"} strokeWidth={t===10?1.5:0.8} strokeDasharray={t===10?"6 3":""}/>
                ))}

                {/* at-risk zone */}
                {(()=>{
                  const i3A=SUBGRADES.findIndex(s=>s.key==="3A");
                  const i1A=SUBGRADES.findIndex(s=>s.key==="1A");
                  const step=pH/(SUBGRADES.length-1);
                  const yT=ySc(i3A)-step*0.5, yB=ySc(i1A)+step*0.5;
                  return <>
                    <rect x={xSc(10)} y={yT} width={pW-xSc(10)} height={yB-yT} fill={C.orange} fillOpacity={0.07} rx={2}/>
                    <text x={xSc(10)+7} y={yT+14} fontSize={9} fill={C.orange} fontWeight={700}>⚠ Zone น่าเป็นห่วง</text>
                    <text x={xSc(10)+2} y={-12} fontSize={10} fill={C.orange} fontWeight={700}>10 ปี</text>
                  </>;
                })()}

                {/* dots */}
                {dots.map(e=>{
                  const cx=xSc(e.years), cy=ySc(e.yPos);
                  const risk=isAtRisk(e), isHov=hovered===e.id, isSel=selEmp?.id===e.id;
                  const hasAct=(acts[e.id]||[]).length>0;
                  const r=isHov||isSel?8:risk?6.5:5;
                  return (
                    <g key={e.id} style={{cursor:"pointer"}}
                      onMouseEnter={()=>{setHovered(e.id);setTooltip({e,cx,cy});}}
                      onMouseLeave={()=>{setHovered(null);setTooltip(null);}}
                      onClick={()=>setSel(selEmp?.id===e.id?null:e)}>
                      {risk&&(isHov||isSel)&&<circle cx={cx} cy={cy+r*0.15} r={r*1.8} fill={C.orange} fillOpacity={0.12}/>}
                      {risk
                        ? <polygon points={`${cx},${cy-r} ${cx+r*0.87},${cy+r*0.5} ${cx-r*0.87},${cy+r*0.5}`}
                            fill={C.orange} fillOpacity={isHov||isSel?1:0.85} stroke={isSel?"#fff":"none"} strokeWidth={1.5}/>
                        : <circle cx={cx} cy={cy} r={isHov||isSel?r:4.5}
                            fill={GRADE_DOT[e.grade]} fillOpacity={isHov||isSel?1:0.62} stroke={isSel?"#fff":"none"} strokeWidth={1.5}/>}
                      {hasAct&&<circle cx={cx+(risk?5:4)} cy={cy-(risk?5:4)} r={3} fill="#1a7340" stroke="#fff" strokeWidth={1}/>}
                    </g>
                  );
                })}

                {/* x axis */}
                {xTicks.map(t=>(
                  <g key={t} transform={`translate(${xSc(t)},${pH})`}>
                    <line y1={0} y2={4} stroke="#939598" strokeWidth={0.8}/>
                    <text y={15} textAnchor="middle" fontSize={10} fill="#5a6175">{t}</text>
                  </g>
                ))}
                <text x={pW/2} y={pH+40} textAnchor="middle" fontSize={11} fill="#5a6175" fontStyle="italic">อายุงาน (ปี)</text>

                {/* y axis */}
                {SUBGRADES.map((sg,i)=>{
                  const cnt=ALL_EMP.filter(e=>e.subgrade===sg.key).length;
                  const isHigh=sg.grade>=4;
                  return (
                    <g key={sg.key} transform={`translate(0,${ySc(i)})`}>
                      <line x1={-4} x2={0} stroke="#939598" strokeWidth={0.8}/>
                      <rect x={-PAD.left+4} y={-9} width={26} height={18} rx={4} fill={isHigh?`${C.orange}18`:`${C.blue}15`}/>
                      <text x={-PAD.left+17} y={4} textAnchor="middle" fontSize={10} fontWeight={700} fill={isHigh?C.orange:C.blue}>{sg.label}</text>
                      {!compact&&<text x={-PAD.left+36} y={4} textAnchor="start" fontSize={9} fill="#5a6175">{sg.position}</text>}
                      <text x={-7} y={4} textAnchor="end" fontSize={9} fill="#939598">({cnt})</text>
                    </g>
                  );
                })}

                <line x1={0} y1={pH} x2={pW} y2={pH} stroke="#1a1a2e" strokeWidth={1}/>
                <line x1={0} y1={0}  x2={0}  y2={pH} stroke="#1a1a2e" strokeWidth={1}/>
              </g>
            </svg>

            {/* tooltip */}
            {tooltip&&!selEmp&&(
              <div style={{position:"absolute",
                left:Math.min(tooltip.cx+PAD.left+14, SVG_W-185),
                top:Math.max(tooltip.cy+PAD.top-44, 8),
                background:C.blueDark,borderRadius:8,padding:"10px 14px",
                fontSize:11,color:"#eef1f8",pointerEvents:"none",zIndex:10,
                boxShadow:"0 6px 20px rgba(0,0,0,0.35)",minWidth:170,
                border:`1px solid ${isAtRisk(tooltip.e)?C.orange:C.blueLight}`}}>
                <div style={{fontWeight:700,color:"#fff",marginBottom:4}}>{tooltip.e.name}</div>
                {isAtRisk(tooltip.e)&&<div style={{display:"inline-block",background:`${C.orange}30`,color:C.orange,fontSize:9.5,fontWeight:700,borderRadius:4,padding:"2px 7px",marginBottom:6}}>▲ กลุ่มน่าเป็นห่วง</div>}
                <div style={{color:"#aab3cc",marginBottom:2}}>Sub-Grade: <b style={{color:"#fff"}}>{tooltip.e.subgrade}</b></div>
                <div style={{color:"#aab3cc",marginBottom:6,fontSize:10}}>{SUBGRADES[tooltip.e.yIdx].position}</div>
                <div style={{color:C.orange,fontWeight:700,fontSize:15}}>{tooltip.e.years} <span style={{fontSize:11,color:"#7a8aaa",fontWeight:400}}>ปี อายุงาน</span></div>
                <div style={{color:"#555e7a",fontSize:9,marginTop:7,paddingTop:6,borderTop:"1px solid #2e3a5a"}}>คลิกเพื่อวาง Action Plan</div>
              </div>
            )}
          </div>

          {/* Action Panel — overlay on mobile, side on desktop */}
          {selEmp&&(
            <div style={{
              width: compact ? "100%" : PANEL_W,
              ...(compact ? {position:"fixed",bottom:0,left:0,right:0,borderRadius:"12px 12px 0 0",zIndex:50,maxHeight:"60vh",overflowY:"auto"} : {flexShrink:0}),
              background:C.surface,
              border:`1.5px solid ${isAtRisk(selEmp)?C.orange:C.blue}`,
              boxShadow:"0 -4px 20px rgba(0,0,0,0.3)",
              borderRadius: compact ? "12px 12px 0 0" : 12,
              overflow:"hidden"
            }}>
              <div style={{background:isAtRisk(selEmp)?`${C.orange}20`:`${C.blue}30`,padding:"14px 16px",borderBottom:`1px solid ${C.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontWeight:700,color:"#fff",fontSize:13,marginBottom:2}}>{selEmp.name}</div>
                    <div style={{fontSize:11,color:isAtRisk(selEmp)?C.orange:C.sub,fontWeight:700}}>Sub-Grade: {selEmp.subgrade}</div>
                    <div style={{fontSize:10.5,color:C.gray,marginTop:1}}>{SUBGRADES[selEmp.yIdx].position}</div>
                  </div>
                  <button onClick={()=>setSel(null)} style={{background:"none",border:"none",cursor:"pointer",color:C.gray,fontSize:18,padding:0,lineHeight:1}}>✕</button>
                </div>
                <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
                  <span style={{fontSize:11,color:C.orange,fontWeight:700,background:`${C.orange}25`,padding:"3px 9px",borderRadius:20}}>⏱ {selEmp.years} ปี</span>
                  {isAtRisk(selEmp)&&<span style={{fontSize:11,color:"#fca5a5",fontWeight:700,background:"#b91c1c40",padding:"3px 9px",borderRadius:20}}>▲ น่าเป็นห่วง</span>}
                </div>
              </div>
              <div style={{padding:"14px 16px"}}>
                <div style={{fontSize:11,fontWeight:700,color:"#fff",marginBottom:10}}>Action Plan สำหรับผู้บริหาร</div>
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  {ACTION_TAGS.map(a=>{
                    const checked=(acts[selEmp.id]||[]).includes(a.key);
                    return (
                      <div key={a.key} onClick={()=>toggle(selEmp.id,a.key)}
                        style={{display:"flex",alignItems:"center",gap:9,padding:"8px 11px",borderRadius:8,
                          border:`1.5px solid ${checked?a.color:C.border}`,
                          background:checked?a.bg:"#1a2644",cursor:"pointer",transition:"all 0.14s"}}>
                        <div style={{width:16,height:16,borderRadius:4,flexShrink:0,border:`1.5px solid ${checked?a.color:"#3a4e7a"}`,background:checked?a.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                          {checked&&<svg width="9" height="9" viewBox="0 0 9 9"><polyline points="1,4.5 3.5,7 8,2" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <span style={{fontSize:11,color:checked?a.color:C.sub,fontWeight:checked?700:400}}>{a.label}</span>
                      </div>
                    );
                  })}
                </div>
                {(acts[selEmp.id]||[]).length>0&&(
                  <div style={{marginTop:12,padding:"9px 11px",background:"#1a2644",borderRadius:7,border:`1px solid ${C.border}`}}>
                    <div style={{fontSize:10,fontWeight:700,color:"#fff",marginBottom:5}}>✅ Action ที่เลือก</div>
                    {(acts[selEmp.id]||[]).map(k=>{const a=ACTION_TAGS.find(x=>x.key===k);return <div key={k} style={{fontSize:11,color:a.color,fontWeight:600,marginBottom:2}}>· {a.label}</div>;})}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── GRADE SUMMARY ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8}}>
          {[1,2,3,4,5,6].map(g=>{
            const cnt=ALL_EMP.filter(e=>e.grade===g).length;
            const rCnt=atRisk.filter(e=>e.grade===g).length;
            const pct=(cnt/ALL_EMP.length*100).toFixed(0);
            return (
              <div key={g} style={{background:C.surface,borderRadius:8,padding:"11px 12px",borderTop:`3px solid ${g>=5?C.orange:C.blueLight}`,boxShadow:"0 2px 8px rgba(0,0,0,0.12)"}}>
                <div style={{fontSize:9,color:C.gray,fontWeight:700,letterSpacing:0.5,marginBottom:4}}>GRADE {g}</div>
                <div style={{fontSize:compact?18:22,fontWeight:700,color:g>=5?C.orange:"#fff",lineHeight:1.15}}>{cnt}</div>
                <div style={{fontSize:9,color:C.gray,marginBottom:2}}>{pct}%</div>
                {rCnt>0&&<div style={{fontSize:10,color:C.orange,fontWeight:700}}>▲ {rCnt}</div>}
              </div>
            );
          })}
        </div>

        {/* caption */}
        <div style={{fontSize:10,color:C.gray,lineHeight:1.7,padding:"8px 14px",background:C.surface,borderRadius:6,border:`1px solid ${C.border}`}}>
          <b style={{color:C.sub}}>หมายเหตุ:</b> แต่ละจุดแทนพนักงาน 1 คน · ● น้ำเงิน = พนักงานทั่วไป · ▲ ส้ม = กลุ่มน่าเป็นห่วง (อายุงาน ≥ 10 ปี · Grade 1–3) · ● เขียว = ถูก Action แล้ว · เส้นประส้ม = เกณฑ์ 10 ปี
        </div>

      </div>
    </div>
  );
}
