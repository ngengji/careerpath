import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ZOOM_OPTIONS, applyZoom, getSavedZoom } from "./zoom";
import {
  ALL_EMP, getPriorityTier, PRIORITY_META, ACTION_TAGS,
  loadActions, type Employee,
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

export default function ExecutivePriorityPage() {
  const [zoomLevel, setZoomLevel] = useState(getSavedZoom());
  const [acts, setActs] = useState<Record<number, string[]>>({});

  useEffect(() => { loadActions().then(setActs); }, []);

  const priorityGroups = {
    P1: ALL_EMP.filter((e) => getPriorityTier(e) === "P1"),
    P2: ALL_EMP.filter((e) => getPriorityTier(e) === "P2"),
    P3: ALL_EMP.filter((e) => getPriorityTier(e) === "P3"),
  };

  const topPriority = [...priorityGroups.P1]
    .sort((a, b) => b.performance - a.performance || b.years - a.years)
    .slice(0, 5);

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
              <div style={{ fontSize: 10, color: C.chartSub, marginTop: 3 }}>P1 = Top 5 (Grade ≤ 3, อายุงาน ≥ 10) เรียง performance สูงก่อน</div>
            </div>
            {(() => {
              const W = 420, H = 290;
              const pad = { top: 20, right: 12, bottom: 36, left: 36 };
              const iW = W - pad.left - pad.right, iH = H - pad.top - pad.bottom;
              const x = (v: number) => pad.left + (v / 15) * iW;
              const y = (v: number) => pad.top + iH - ((v - 1) / 4) * iH;
              return (
                <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
                  <rect x={x(10)} y={pad.top} width={W - pad.right - x(10)} height={iH} fill="#fee2e2" fillOpacity={0.35} rx={4} />
                  {[0, 5, 10, 15].map((t) => (
                    <g key={t}>
                      <line x1={x(t)} y1={pad.top} x2={x(t)} y2={pad.top + iH} stroke={t === 10 ? "#f97316" : "#ebebeb"} strokeWidth={t === 10 ? 1.4 : 0.8} strokeDasharray={t === 10 ? "5 3" : ""} />
                      <text x={x(t)} y={H - 16} textAnchor="middle" fontSize={9} fill={C.chartSub}>{t}</text>
                    </g>
                  ))}
                  {[1, 2, 3, 4, 5].map((v) => (
                    <g key={v}>
                      <line x1={pad.left} y1={y(v)} x2={pad.left + iW} y2={y(v)} stroke="#ebebeb" strokeWidth={0.8} />
                      <text x={pad.left - 5} y={y(v) + 3} textAnchor="end" fontSize={9} fill={C.chartSub}>{v.toFixed(1)}</text>
                    </g>
                  ))}
                  {ALL_EMP.map((e) => {
                    const tier = getPriorityTier(e) as keyof typeof PRIORITY_META;
                    const hasAct = (acts[e.id] || []).length > 0;
                    return (
                      <g key={e.id}>
                        <circle cx={x(e.years)} cy={y(e.performance)} r={3.6} fill={PRIORITY_META[tier].color} fillOpacity={0.68} />
                        {hasAct && <circle cx={x(e.years) + 3.5} cy={y(e.performance) - 3.5} r={2.2} fill="#1a7340" stroke="#fff" strokeWidth={0.8} />}
                      </g>
                    );
                  })}
                  <text x={x(10) + 5} y={pad.top + 10} fontSize={8.5} fill="#b91c1c" fontWeight={700}>P1 Candidate Pool (Tenure ≥ 10)</text>
                  <text x={pad.left + iW / 2} y={H - 3} textAnchor="middle" fontSize={9} fill={C.chartSub} fontStyle="italic">อายุงาน (ปี)</text>
                  <text x={12} y={pad.top + iH / 2} textAnchor="middle" fontSize={9} fill={C.chartSub} transform={`rotate(-90,12,${pad.top + iH / 2})`}>Performance</text>
                  {/* legend */}
                  <circle cx={pad.left + iW - 60} cy={pad.top + iH - 8} r={3} fill="#1a7340" />
                  <text x={pad.left + iW - 55} y={pad.top + iH - 5} fontSize={8} fill={C.chartSub}>มี Action แล้ว</text>
                </svg>
              );
            })()}
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
