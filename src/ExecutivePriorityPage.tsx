import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { ZOOM_OPTIONS, applyZoom, getSavedZoom } from "./zoom";
import {
  ALL_EMP, getPriorityTier, PRIORITY_META, ACTION_TAGS,
  loadActions, isAtRisk, P1_IDS, type Employee,
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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadActions().then(setActs); }, []);

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
                {/* dots — P3/P2 first, then at-risk, then P1 on top */}
                {[...ALL_EMP]
                  .sort((a, b) => {
                    const ta = getPriorityTier(a), tb = getPriorityTier(b);
                    const order = { P3: 0, P2: 1, P1: 2 };
                    return order[ta] - order[tb];
                  })
                  .map((e) => {
                    const tier = getPriorityTier(e) as keyof typeof PRIORITY_META;
                    const hasAct = (acts[e.id] || []).length > 0;
                    const risk = isAtRisk(e);
                    const rank = p1Ranks.get(e.id);
                    const isHov = hoveredEmp?.id === e.id;
                    const dotX = cx(e.years), dotY = cy(e.performance);
                    const r = rank ? 5.5 : risk ? 5 : 3.8;
                    // at-risk = orange (matches overview page), P1 = red, non-at-risk = tier color
                    const color = rank ? "#b91c1c" : risk ? C.orange : PRIORITY_META[tier].color;
                    return (
                      <g key={e.id} style={{ cursor: "pointer" }} onMouseEnter={() => setHoveredEmp(e)}>
                        {/* glow for hovered */}
                        {isHov && <circle cx={dotX} cy={dotY} r={r + 5} fill={color} fillOpacity={0.18} />}
                        {/* shape: triangle for at-risk (grade ≤ 3), circle for others */}
                        {risk
                          ? <polygon
                              points={`${dotX},${dotY - r} ${dotX + r * 0.87},${dotY + r * 0.5} ${dotX - r * 0.87},${dotY + r * 0.5}`}
                              fill={color} fillOpacity={isHov ? 1 : 0.8}
                              stroke={rank ? "#fff" : "none"} strokeWidth={rank ? 1.2 : 0}
                            />
                          : <circle cx={dotX} cy={dotY} r={r} fill={color} fillOpacity={isHov ? 1 : 0.65} />
                        }
                        {/* action dot */}
                        {hasAct && <circle cx={dotX + r * 0.75} cy={dotY - r * 0.75} r={2.2} fill="#1a7340" stroke="#fff" strokeWidth={0.8} />}
                        {/* rank label for P1 */}
                        {rank && (
                          <text x={dotX} y={dotY + 3.5} textAnchor="middle" fontSize={7} fontWeight={700} fill="#fff" pointerEvents="none">
                            {rank}
                          </text>
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
                  <circle cx={6} cy={30} r={3.5} fill="#1d4ed8" fillOpacity={0.65} />
                  <text x={14} y={34} fontSize={8} fill={C.chartSub}>Grade 4+ (P2/P3)</text>
                  <circle cx={6} cy={42} r={2} fill="#1a7340" />
                  <text x={14} y={46} fontSize={8} fill={C.chartSub}>มี Action แล้ว</text>
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
                  <div key={e.id} style={{ background: hasAct ? "#f0fdf4" : "#fff1f2", border: `1px solid ${hasAct ? "#bbf7d0" : "#fecdd3"}`, borderRadius: 8, padding: "8px 10px" }}>
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
                <div key={e.id} style={{ background: hasAct ? "#f0fdf4" : "#fffbeb", border: `1px solid ${hasAct ? "#bbf7d0" : "#fde68a"}`, borderRadius: 8, padding: "8px 10px" }}>
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

      </div>
    </div>
  );
}
