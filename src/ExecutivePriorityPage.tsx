import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { ZOOM_OPTIONS, applyZoom, getSavedZoom } from "./zoom";
import {
  ALL_EMP, SUBGRADES, getPriorityTier, PRIORITY_META, ACTION_TAGS,
  loadActions, saveAction, isAtRisk, P1_IDS, type Employee,
} from "./data";

const C = {
  blue: "#394A76",
  orange: "#EC5924",
  sub: "#a0b0d0",
  surface: "#243464",
  border: "#3a4e7a",
  chartInk: "#1a1a2e",
  chartSub: "#5a6175",
};

// ── Action badge component ──────────────────────────────────────────────────
function ActionBadges({ empActs }: { empActs: string[] }) {
  if (empActs.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 5 }}>
      {empActs.map(k => {
        const a = ACTION_TAGS.find(x => x.key === k);
        if (!a) return null;
        return (
          <span key={k} style={{ fontSize: 10, fontWeight: 700, color: a.color, background: a.bg, padding: "2px 7px", borderRadius: 20, border: `1px solid ${a.color}30` }}>
            {a.label}
          </span>
        );
      })}
    </div>
  );
}

// chart helpers (module-level — no re-creation)
const CW = 420, CH = 290;
const CPAD = { top: 22, right: 14, bottom: 38, left: 38 };
const CiW = CW - CPAD.left - CPAD.right;
const CiH = CH - CPAD.top - CPAD.bottom;
const cx = (v: number) => CPAD.left + (v / 15) * CiW;
const cy = (v: number) => CPAD.top + CiH - ((v - 1) / 4) * CiH;

export default function ExecutivePriorityPage() {
  const [zoomLevel, setZoomLevel] = useState(getSavedZoom());
  const [acts, setActs] = useState<Record<number, string[]>>({});
  const [hoveredEmp, setHoveredEmp] = useState<Employee | null>(null);
  const [selEmp, setSelEmp] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadActions().then(setActs); }, []);

  const matchSearch = (e: Employee, q: string) => {
    const t = q.trim().toLowerCase();
    if (!t) return false;
    return String(e.id).includes(t) || `พนักงาน #${e.id}`.toLowerCase().includes(t);
  };
  const searchActive = searchQuery.trim().length > 0;
  const searchMatches = searchActive ? ALL_EMP.filter(e => matchSearch(e, searchQuery)) : [];

  const priorityGroups = {
    P1: ALL_EMP.filter((e) => getPriorityTier(e) === "P1"),
    P2: ALL_EMP.filter((e) => getPriorityTier(e) === "P2"),
    P3: ALL_EMP.filter((e) => getPriorityTier(e) === "P3"),
  };

  const topPriority = [...priorityGroups.P1]
    .sort((a, b) => b.performance - a.performance || b.years - a.years)
    .slice(0, 5);

  // rank map for P1 dots: id → 1-5
  const p1Ranks = new Map(topPriority.map((e, i) => [e.id, i + 1]));

  // จำนวนที่มี action แล้วในแต่ละกลุ่ม
  const actionedCount = (list: Employee[]) => list.filter(e => (acts[e.id] || []).length > 0).length;

  const onZoomChange = (z: number) => { setZoomLevel(z); applyZoom(z); };

  const toggle = (eid: number, key: string) => {
    setActs(prev => {
      const current = prev[eid] || [];
      const next = current.includes(key) ? current.filter(k => k !== key) : [...current, key];
      setSaving(true);
      saveAction(eid, next).finally(() => setSaving(false));
      return { ...prev, [eid]: next };
    });
  };

  return (
    <div style={{ background: "linear-gradient(160deg,#1a2644 0%,#222f58 60%,#1e2d50 100%)", minHeight: "100dvh", fontFamily: "'Sarabun',sans-serif", padding: "24px 20px", boxSizing: "border-box" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Header */}
        <div style={{ background: C.surface, borderRadius: 12, padding: "18px 22px", borderBottom: `3px solid ${C.orange}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, color: C.sub, marginBottom: 4 }}>Executive Decision View</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>Executive Priority Dashboard</div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 3 }}>จัดลำดับ Action จากอายุงานและผลงานปีที่ผ่านมา</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {ZOOM_OPTIONS.map((z) => (
                <button key={z} onClick={() => onZoomChange(z)} style={{ border: `1px solid ${zoomLevel === z ? C.orange : C.border}`, background: zoomLevel === z ? C.orange : "transparent", color: zoomLevel === z ? "#fff" : C.sub, borderRadius: 6, padding: "3px 7px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                  {Math.round(z * 100)}%
                </button>
              ))}
            </div>
            {/* search box */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#1a2644", border: `1.5px solid ${searchActive ? C.orange : C.border}`, borderRadius: 8, padding: "5px 10px" }}>
              <span style={{ fontSize: 11, color: "#7a90b8" }}>🔍</span>
              <input
                type="text"
                placeholder="ค้นหา #ID หรือชื่อ…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 11, width: 130, fontFamily: "'Sarabun',sans-serif" }}
              />
              {searchActive && (
                <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", color: "#7a90b8", cursor: "pointer", padding: 0, fontSize: 12 }}>✕</button>
              )}
            </div>
            {searchActive && (
              <div style={{ fontSize: 10, color: searchMatches.length > 0 ? C.orange : "#94a3b8", fontWeight: 700, textAlign: "right" }}>
                {searchMatches.length > 0 ? `พบ ${searchMatches.length} คน` : "ไม่พบ"}
              </div>
            )}
            <Link to="/" style={{ textDecoration: "none", background: "#fff", color: C.blue, padding: "8px 12px", borderRadius: 8, fontWeight: 700, fontSize: 12 }}>
              กลับหน้า Overview
            </Link>
          </div>
        </div>

        {/* KPI cards — เพิ่ม Action Progress */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10 }}>
          {(["P1", "P2", "P3"] as const).map((k) => {
            const total = priorityGroups[k].length;
            const actioned = actionedCount(priorityGroups[k]);
            const pct = total > 0 ? Math.round(actioned / total * 100) : 0;
            return (
              <div key={k} style={{ background: "#fff", borderRadius: 10, padding: "12px 13px", borderTop: `3px solid ${PRIORITY_META[k].color}` }}>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6 }}>{PRIORITY_META[k].label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: PRIORITY_META[k].color }}>{total}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, marginBottom: 8 }}>{PRIORITY_META[k].note}</div>
                {/* Progress bar */}
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                  <span>Action Progress</span>
                  <span style={{ fontWeight: 700, color: actioned > 0 ? "#1a7340" : "#94a3b8" }}>{actioned}/{total} ({pct}%)</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: "#e2e8f0", overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: actioned > 0 ? "#1a7340" : "#e2e8f0", borderRadius: 3, transition: "width 0.4s" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Matrix + Top P1 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "20px 16px 14px", boxShadow: "0 4px 20px rgba(0,0,0,0.25)", border: "1px solid #e0e4f0" }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.chartInk }}>Priority Matrix: อายุงาน x Performance ปีล่าสุด</div>
              <div style={{ fontSize: 10, color: C.chartSub, marginTop: 3 }}>
                Zone สีแดง = <b>กลุ่มน่าเป็นห่วง</b> (Grade ≤ 3 + อายุงาน ≥ 10) · P1 = Top 5 เรียง Performance สูงก่อน · ▲ = Grade ≤ 3
              </div>
            </div>
            <div ref={chartRef} style={{ position: "relative" }}>
              <svg
                width="100%" height={CH}
                viewBox={`0 0 ${CW} ${CH}`}
                style={{ display: "block", overflow: "visible" }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const scaleX = CW / rect.width;
                  const scaleY = CH / rect.height;
                  setMousePos({ x: (e.clientX - rect.left) / scaleX, y: (e.clientY - rect.top) / scaleY });
                }}
                onMouseLeave={() => setHoveredEmp(null)}
              >
                {/* at-risk zone: Tenure ≥ 10 */}
                <rect x={cx(10)} y={CPAD.top} width={CW - CPAD.right - cx(10)} height={CiH} fill="#fee2e2" fillOpacity={0.4} rx={4} />
                {/* grid lines */}
                {[0, 5, 10, 15].map((t) => (
                  <g key={t}>
                    <line x1={cx(t)} y1={CPAD.top} x2={cx(t)} y2={CPAD.top + CiH} stroke={t === 10 ? "#f97316" : "#ebebeb"} strokeWidth={t === 10 ? 1.5 : 0.8} strokeDasharray={t === 10 ? "5 3" : ""} />
                    <text x={cx(t)} y={CH - 18} textAnchor="middle" fontSize={9} fill={C.chartSub}>{t}</text>
                  </g>
                ))}
                {[1, 2, 3, 4, 5].map((v) => (
                  <g key={v}>
                    <line x1={CPAD.left} y1={cy(v)} x2={CPAD.left + CiW} y2={cy(v)} stroke="#ebebeb" strokeWidth={0.8} />
                    <text x={CPAD.left - 5} y={cy(v) + 3} textAnchor="end" fontSize={9} fill={C.chartSub}>{v.toFixed(1)}</text>
                  </g>
                ))}
                {/* dots — P3/P2 first, then at-risk, then P1, then search hits on top */}
                {[...ALL_EMP]
                  .sort((a, b) => {
                    const aHit = searchActive && matchSearch(a, searchQuery) ? 3 : 0;
                    const bHit = searchActive && matchSearch(b, searchQuery) ? 3 : 0;
                    const order = { P3: 0, P2: 1, P1: 2 } as const;
                    const ta = getPriorityTier(a), tb = getPriorityTier(b);
                    return (order[ta] + aHit) - (order[tb] + bHit);
                  })
                  .map((e) => {
                    const tier = getPriorityTier(e) as keyof typeof PRIORITY_META;
                    const hasAct = (acts[e.id] || []).length > 0;
                    const risk = isAtRisk(e);
                    const rank = p1Ranks.get(e.id);
                    const isHov = hoveredEmp?.id === e.id;
                    const isSearchHit = searchActive && matchSearch(e, searchQuery);
                    const isDimmed = searchActive && !isSearchHit;
                    const dotX = cx(e.years), dotY = cy(e.performance);
                    const r = isSearchHit ? 8 : rank ? 5.5 : risk ? 5 : 3.8;
                    // at-risk = orange, P1 = red, Grade 5-6 (ผู้บริหาร) = orange circle, rest = blue
                    const color = rank ? "#b91c1c" : risk ? C.orange : e.grade >= 5 ? C.orange : "#1d4ed8";
                    return (
                      <g key={e.id} style={{ cursor: "pointer" }}
                        onMouseEnter={() => setHoveredEmp(e)}
                        onClick={() => setSelEmp(selEmp?.id === e.id ? null : e)}>
                        {/* search hit glow */}
                        {isSearchHit && <circle cx={dotX} cy={dotY} r={r + 6} fill="#fff" fillOpacity={0.2} />}
                        {/* hover glow */}
                        {isHov && !isSearchHit && <circle cx={dotX} cy={dotY} r={r + 5} fill={color} fillOpacity={0.18} />}
                        {/* shape: triangle for at-risk (grade ≤ 3), circle for others */}
                        {risk
                          ? <polygon
                              points={`${dotX},${dotY - r} ${dotX + r * 0.87},${dotY + r * 0.5} ${dotX - r * 0.87},${dotY + r * 0.5}`}
                              fill={color} fillOpacity={isDimmed ? 0.15 : isHov || isSearchHit ? 1 : 0.8}
                              stroke={isSearchHit ? "#fff" : rank ? "#fff" : "none"} strokeWidth={isSearchHit ? 1.5 : rank ? 1.2 : 0}
                            />
                          : <circle cx={dotX} cy={dotY} r={r} fill={color} fillOpacity={isDimmed ? 0.12 : isHov || isSearchHit ? 1 : 0.65}
                              stroke={isSearchHit ? "#fff" : "none"} strokeWidth={1.5} />
                        }
                        {/* action dot */}
                        {hasAct && !isDimmed && <circle cx={dotX + r * 0.75} cy={dotY - r * 0.75} r={2.2} fill="#1a7340" stroke="#fff" strokeWidth={0.8} />}
                        {/* rank label for P1 */}
                        {rank && !isSearchHit && (
                          <text x={dotX} y={dotY + 3.5} textAnchor="middle" fontSize={7} fontWeight={700} fill="#fff" pointerEvents="none">{rank}</text>
                        )}
                        {/* search hit label */}
                        {isSearchHit && (
                          <text x={dotX} y={dotY - r - 4} textAnchor="middle" fontSize={8} fontWeight={700} fill="#fff"
                            stroke="#1a2644" strokeWidth={3} paintOrder="stroke" pointerEvents="none">#{e.id}</text>
                        )}
                      </g>
                    );
                  })
                }
                {/* axis labels */}
                <text x={cx(10) + 5} y={CPAD.top + 11} fontSize={8.5} fill="#b91c1c" fontWeight={700}>⚠ กลุ่มน่าเป็นห่วง (Grade ≤ 3 · Tenure ≥ 10)</text>
                <text x={CPAD.left + CiW / 2} y={CH - 4} textAnchor="middle" fontSize={9} fill={C.chartSub} fontStyle="italic">อายุงาน (ปี)</text>
                <text x={12} y={CPAD.top + CiH / 2} textAnchor="middle" fontSize={9} fill={C.chartSub} transform={`rotate(-90,12,${CPAD.top + CiH / 2})`}>Performance</text>
                {/* legend */}
                <g transform={`translate(${CPAD.left + CiW - 120},${CPAD.top + CiH - 26})`}>
                  <polygon points="6,0 10.4,8 1.6,8" fill="#b91c1c" fillOpacity={0.9} />
                  <text x={14} y={8} fontSize={8} fill={C.chartSub}>P1 (top 5 at-risk)</text>
                  <polygon points="6,12 10.4,20 1.6,20" fill={C.orange} fillOpacity={0.85} />
                  <text x={14} y={20} fontSize={8} fill={C.chartSub}>▲ กลุ่มน่าเป็นห่วง</text>
                  <circle cx={6} cy={30} r={3.5} fill={C.orange} fillOpacity={0.65} />
                  <text x={14} y={34} fontSize={8} fill={C.chartSub}>● ผู้บริหาร (Grade 5-6)</text>
                  <circle cx={6} cy={42} r={3.5} fill="#1d4ed8" fillOpacity={0.65} />
                  <text x={14} y={46} fontSize={8} fill={C.chartSub}>● Grade 1-4</text>
                  <circle cx={6} cy={54} r={2} fill="#1a7340" />
                  <text x={14} y={58} fontSize={8} fill={C.chartSub}>มี Action แล้ว</text>
                </g>
                <text x={CPAD.left + CiW - 55} y={CPAD.top + 11} fontSize={8} fill="#b91c1c" fontWeight={700}>
                  {/* P1 rank indicator */}
                </text>
              </svg>
              {/* tooltip */}
              {hoveredEmp && (
                <div style={{
                  position: "absolute",
                  left: Math.min(mousePos.x * (chartRef.current?.offsetWidth ?? CW) / CW + 12, (chartRef.current?.offsetWidth ?? 300) - 190),
                  top: Math.max(mousePos.y * (chartRef.current?.offsetHeight ?? CH) / CH - 20, 0),
                  background: "#1a2644", borderRadius: 8, padding: "10px 13px",
                  fontSize: 11, color: "#eef1f8", pointerEvents: "none", zIndex: 20,
                  boxShadow: "0 6px 20px rgba(0,0,0,0.35)", minWidth: 170,
                  border: `1.5px solid ${isAtRisk(hoveredEmp) ? C.orange : "#3a5090"}`,
                }}>
                  <div style={{ fontWeight: 700, color: "#fff", marginBottom: 4, fontSize: 12 }}>{hoveredEmp.name}</div>
                  {p1Ranks.has(hoveredEmp.id) && (
                    <div style={{ display: "inline-block", background: "#b91c1c", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 4, padding: "1px 7px", marginBottom: 5 }}>
                      P1 #{p1Ranks.get(hoveredEmp.id)}
                    </div>
                  )}
                  {isAtRisk(hoveredEmp) && !p1Ranks.has(hoveredEmp.id) && (
                    <div style={{ display: "inline-block", background: `${C.orange}30`, color: C.orange, fontSize: 10, fontWeight: 700, borderRadius: 4, padding: "1px 7px", marginBottom: 5 }}>▲ กลุ่มน่าเป็นห่วง</div>
                  )}
                  <div style={{ color: "#aab3cc", marginBottom: 2 }}>Sub-Grade: <b style={{ color: "#fff" }}>{hoveredEmp.subgrade}</b></div>
                  <div style={{ color: C.orange, fontWeight: 700, fontSize: 13, marginTop: 3 }}>{hoveredEmp.years} <span style={{ fontSize: 10, color: "#7a8aaa", fontWeight: 400 }}>ปี อายุงาน</span></div>
                  <div style={{ color: "#60a5fa", fontWeight: 700, fontSize: 11, marginTop: 2 }}>Performance: {hoveredEmp.performance}/5</div>
                  <div style={{ marginTop: 4, fontSize: 10, fontWeight: 700, color: PRIORITY_META[getPriorityTier(hoveredEmp)].color }}>
                    {PRIORITY_META[getPriorityTier(hoveredEmp)].label}
                  </div>
                  {(acts[hoveredEmp.id] || []).length > 0 && (
                    <div style={{ marginTop: 5, fontSize: 10, color: "#4ade80" }}>
                      ✓ {(acts[hoveredEmp.id] || []).map(k => ACTION_TAGS.find(a => a.key === k)?.label).join(", ")}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Top P1 with action badges */}
          <div style={{ background: "#fff", borderRadius: 12, padding: "20px 16px 14px", boxShadow: "0 4px 20px rgba(0,0,0,0.25)", border: "1px solid #e0e4f0" }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.chartInk }}>Top Priority Candidates (P1)</div>
              <div style={{ fontSize: 10, color: C.chartSub, marginTop: 3 }}>เรียงจาก performance สูงสุดก่อน แล้วดู tenure สูง</div>
            </div>
            <div style={{ display: "grid", gap: 7 }}>
              {topPriority.map((e, idx) => {
                const empActs = acts[e.id] || [];
                const hasAct = empActs.length > 0;
                return (
                  <div key={e.id} style={{ background: matchSearch(e, searchQuery) ? "#fefce8" : hasAct ? "#f0fdf4" : "#fff1f2", border: `2px solid ${matchSearch(e, searchQuery) ? C.orange : hasAct ? "#bbf7d0" : "#fecdd3"}`, borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "30px 1fr auto", gap: 8, alignItems: "center" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#9f1239" }}>#{idx + 1}</div>
                      <div style={{ fontSize: 11, color: "#334155" }}>พนักงาน #{e.id} · {e.subgrade}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#9f1239" }}>{e.performance}/5 · {e.years} ปี</div>
                        {hasAct
                          ? <span style={{ fontSize: 10, background: "#1a7340", color: "#fff", padding: "1px 7px", borderRadius: 10, fontWeight: 700 }}>✓ Action</span>
                          : <span style={{ fontSize: 10, background: "#f1f5f9", color: "#94a3b8", padding: "1px 7px", borderRadius: 10 }}>ยังไม่ได้ Action</span>}
                      </div>
                    </div>
                    <ActionBadges empActs={empActs} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Action Panel (appears when a dot is clicked) ── */}
        {selEmp && (
          <div style={{ background: C.surface, border: `1.5px solid ${isAtRisk(selEmp) ? C.orange : C.blue}`, boxShadow: "0 4px 20px rgba(0,0,0,0.3)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ background: isAtRisk(selEmp) ? `${C.orange}20` : `${C.blue}30`, padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#fff", fontSize: 14, marginBottom: 2 }}>{selEmp.name}</div>
                  <div style={{ fontSize: 12, color: isAtRisk(selEmp) ? C.orange : C.sub, fontWeight: 700 }}>Sub-Grade: {selEmp.subgrade}</div>
                  <div style={{ fontSize: 12, color: "#7a90b8", marginTop: 1 }}>{SUBGRADES[selEmp.yIdx]?.position}</div>
                </div>
                <button onClick={() => setSelEmp(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#7a90b8", fontSize: 18, padding: 0, lineHeight: 1 }}>✕</button>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: C.orange, fontWeight: 700, background: `${C.orange}25`, padding: "3px 9px", borderRadius: 20 }}>⏱ {selEmp.years} ปี</span>
                <span style={{ fontSize: 12, color: "#93c5fd", fontWeight: 700, background: "#1e3a8a40", padding: "3px 9px", borderRadius: 20 }}>📊 {selEmp.performance}/5</span>
                <span style={{ fontSize: 12, color: PRIORITY_META[getPriorityTier(selEmp)].color, fontWeight: 700, background: PRIORITY_META[getPriorityTier(selEmp)].bg, padding: "3px 9px", borderRadius: 20 }}>{PRIORITY_META[getPriorityTier(selEmp)].label}</span>
                {isAtRisk(selEmp) && <span style={{ fontSize: 12, color: "#fca5a5", fontWeight: 700, background: "#b91c1c40", padding: "3px 9px", borderRadius: 20 }}>▲ น่าเป็นห่วง</span>}
              </div>
            </div>
            <div style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Action Plan สำหรับผู้บริหาร</div>
                {saving && <span style={{ fontSize: 10, color: C.orange, fontWeight: 600 }}>กำลังบันทึก...</span>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {ACTION_TAGS.map(a => {
                  const checked = (acts[selEmp.id] || []).includes(a.key);
                  return (
                    <div key={a.key} onClick={() => toggle(selEmp.id, a.key)}
                      style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 11px", borderRadius: 8,
                        border: `1.5px solid ${checked ? a.color : C.border}`,
                        background: checked ? a.bg : "#1a2644", cursor: "pointer", transition: "all 0.14s" }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `1.5px solid ${checked ? a.color : "#3a4e7a"}`, background: checked ? a.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {checked && <svg width="9" height="9" viewBox="0 0 9 9"><polyline points="1,4.5 3.5,7 8,2" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </div>
                      <span style={{ fontSize: 12, color: checked ? a.color : C.sub, fontWeight: checked ? 700 : 400 }}>{a.label}</span>
                    </div>
                  );
                })}
              </div>
              {(acts[selEmp.id] || []).length > 0 && (
                <div style={{ marginTop: 12, padding: "9px 11px", background: "#1a2644", borderRadius: 7, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", marginBottom: 5 }}>✅ Action ที่เลือก</div>
                  {(acts[selEmp.id] || []).map(k => { const a = ACTION_TAGS.find(x => x.key === k); return a ? <div key={k} style={{ fontSize: 12, color: a.color, fontWeight: 600, marginBottom: 2 }}>· {a.label}</div> : null; })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* P2 list with actions */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.12)", border: "1px solid #e0e4f0" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.chartInk, marginBottom: 10 }}>
            P2 ศักยภาพดี — {actionedCount(priorityGroups.P2)}/{priorityGroups.P2.length} คนมี Action แล้ว
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 7 }}>
            {priorityGroups.P2.map(e => {
              const empActs = acts[e.id] || [];
              const hasAct = empActs.length > 0;
              return (
                <div key={e.id} style={{ background: matchSearch(e, searchQuery) ? "#fefce8" : hasAct ? "#f0fdf4" : "#fffbeb", border: `${matchSearch(e, searchQuery) ? "2px" : "1px"} solid ${matchSearch(e, searchQuery) ? C.orange : hasAct ? "#bbf7d0" : "#fde68a"}`, borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#334155" }}>พนักงาน #{e.id} · {e.subgrade}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#c2410c" }}>{e.performance}/5 · {e.years}ปี</span>
                  </div>
                  {hasAct
                    ? <ActionBadges empActs={empActs} />
                    : <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>ยังไม่ได้ Action</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* P3 list with actions */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.12)", border: "1px solid #e0e4f0" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.chartInk, marginBottom: 10 }}>
            P3 พัฒนาต่อ — {actionedCount(priorityGroups.P3)}/{priorityGroups.P3.length} คนมี Action แล้ว
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 7 }}>
            {priorityGroups.P3.map(e => {
              const empActs = acts[e.id] || [];
              const hasAct = empActs.length > 0;
              return (
                <div key={e.id} style={{ background: matchSearch(e, searchQuery) ? "#fefce8" : hasAct ? "#f0fdf4" : "#f8fafc", border: `${matchSearch(e, searchQuery) ? "2px" : "1px"} solid ${matchSearch(e, searchQuery) ? C.orange : hasAct ? "#bbf7d0" : "#e2e8f0"}`, borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#334155" }}>พนักงาน #{e.id} · {e.subgrade}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#1d4ed8" }}>{e.performance}/5 · {e.years}ปี</span>
                  </div>
                  {hasAct
                    ? <ActionBadges empActs={empActs} />
                    : <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>ยังไม่ได้ Action</div>}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
