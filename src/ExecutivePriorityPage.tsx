import { Link } from "react-router-dom";
import { useState } from "react";
import { ZOOM_OPTIONS, applyZoom, getSavedZoom } from "./zoom";

const C = {
  blue: "#394A76",
  orange: "#EC5924",
  sub: "#a0b0d0",
  surface: "#243464",
  border: "#3a4e7a",
  chartInk: "#1a1a2e",
  chartSub: "#5a6175",
};

const SUBGRADES = [
  { key: "1A", grade: 1, label: "1A" },
  { key: "2B", grade: 2, label: "2B" },
  { key: "2A", grade: 2, label: "2A" },
  { key: "3C", grade: 3, label: "3C" },
  { key: "3B", grade: 3, label: "3B" },
  { key: "3A", grade: 3, label: "3A" },
  { key: "4C", grade: 4, label: "4C" },
  { key: "4B", grade: 4, label: "4B" },
  { key: "4A", grade: 4, label: "4A" },
  { key: "5B", grade: 5, label: "5B" },
  { key: "5A", grade: 5, label: "5A" },
  { key: "6B", grade: 6, label: "6B" },
  { key: "6A", grade: 6, label: "6A" },
];

const DIST: Record<string, number> = {
  "1A": 30,
  "2B": 28,
  "2A": 22,
  "3C": 22,
  "3B": 18,
  "3A": 14,
  "4C": 12,
  "4B": 9,
  "4A": 7,
  "5B": 6,
  "5A": 4,
  "6B": 3,
  "6A": 2,
};

const YEAR_RANGE: Record<string, [number, number]> = {
  "1A": [0, 5],
  "2B": [1, 6],
  "2A": [2, 8],
  "3C": [2, 7],
  "3B": [3, 10],
  "3A": [4, 13],
  "4C": [5, 10],
  "4B": [6, 12],
  "4A": [7, 14],
  "5B": [8, 13],
  "5A": [9, 15],
  "6B": [10, 15],
  "6A": [11, 15],
};

const PRIORITY_META = {
  P1: { label: "P1 ความพร้อมสูง", color: "#b91c1c", bg: "#fee2e2", action: "Top 5: Performance สูง + Tenure สูง + ตำแหน่งต่ำ" },
  P2: { label: "P2 ศักยภาพดี", color: "#c2410c", bg: "#ffedd5", action: "วางแผนเร่งพัฒนาเพื่อขึ้นกลุ่มนำ" },
  P3: { label: "P3 พัฒนาต่อ", color: "#1d4ed8", bg: "#dbeafe", action: "ติดตามรายครึ่งปีและยกระดับ performance" },
};

type Employee = {
  id: number;
  subgrade: string;
  grade: number;
  years: number;
  performance: number;
};

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateEmployees() {
  const rng = seededRandom(42);
  const total = 190;
  const tw = Object.values(DIST).reduce((a, b) => a + b, 0);
  let rem = total;
  const counts: Record<string, number> = {};
  const emps: Employee[] = [];
  let id = 1;

  SUBGRADES.forEach((sg, i) => {
    if (i < SUBGRADES.length - 1) {
      counts[sg.key] = Math.round((DIST[sg.key] / tw) * total);
      rem -= counts[sg.key];
    } else {
      counts[sg.key] = rem;
    }
  });

  SUBGRADES.forEach((sg) => {
    const [mn, mx] = YEAR_RANGE[sg.key];
    for (let i = 0; i < counts[sg.key]; i++) {
      const years = +(mn + rng() * (mx - mn)).toFixed(1);
      const perfRaw = 3.5 + (sg.grade >= 4 ? 0.25 : 0) - (years >= 10 && sg.grade <= 3 ? 0.8 : 0) + (rng() - 0.5) * 1.7;
      const performance = +Math.max(1, Math.min(5, perfRaw)).toFixed(1);
      emps.push({ id: id++, subgrade: sg.key, grade: sg.grade, years, performance });
    }
  });

  return emps;
}

const ALL_EMP = generateEmployees();

const P1_IDS = new Set(
  [...ALL_EMP]
    .filter((e) => e.grade <= 3 && e.years >= 10)
    .sort((a, b) => b.performance - a.performance || b.years - a.years)
    .slice(0, 5)
    .map((e) => e.id)
);

const getPriorityTier = (e: Employee) => {
  if (P1_IDS.has(e.id)) return "P1";
  if ((e.years >= 8 && e.performance >= 3.6 && e.grade <= 4) || (e.years >= 10 && e.performance >= 3.3 && e.grade <= 4)) return "P2";
  return "P3";
};

export default function ExecutivePriorityPage() {
  const [zoomLevel, setZoomLevel] = useState(getSavedZoom());
  const priorityGroups = {
    P1: ALL_EMP.filter((e) => getPriorityTier(e) === "P1"),
    P2: ALL_EMP.filter((e) => getPriorityTier(e) === "P2"),
    P3: ALL_EMP.filter((e) => getPriorityTier(e) === "P3"),
  };

  const topPriority = [...priorityGroups.P1]
    .sort((a, b) => b.performance - a.performance || b.years - a.years)
    .slice(0, 5);

  const onZoomChange = (z: number) => {
    setZoomLevel(z);
    applyZoom(z);
  };

  return (
    <div style={{ background: "linear-gradient(160deg,#1a2644 0%,#222f58 60%,#1e2d50 100%)", minHeight: "100dvh", fontFamily: "'Sarabun',sans-serif", padding: "24px 20px", boxSizing: "border-box" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: C.surface, borderRadius: 12, padding: "18px 22px", borderBottom: `3px solid ${C.orange}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, color: C.sub, marginBottom: 4 }}>Executive Decision View</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>Executive Priority Dashboard</div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 3 }}>จัดลำดับ Action จากอายุงานและผลงานปีที่ผ่านมา</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {ZOOM_OPTIONS.map((z) => (
                <button
                  key={z}
                  onClick={() => onZoomChange(z)}
                  style={{
                    border: `1px solid ${zoomLevel === z ? C.orange : C.border}`,
                    background: zoomLevel === z ? C.orange : "transparent",
                    color: zoomLevel === z ? "#fff" : C.sub,
                    borderRadius: 6,
                    padding: "3px 7px",
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {Math.round(z * 100)}%
                </button>
              ))}
            </div>
            <Link to="/" style={{ textDecoration: "none", background: "#fff", color: C.blue, padding: "8px 12px", borderRadius: 8, fontWeight: 700, fontSize: 12 }}>
              กลับหน้า Overview
            </Link>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10 }}>
          {(["P1", "P2", "P3"] as const).map((k) => (
            <div key={k} style={{ background: "#fff", borderRadius: 10, padding: "12px 13px", borderTop: `3px solid ${PRIORITY_META[k].color}` }}>
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6 }}>{PRIORITY_META[k].label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: PRIORITY_META[k].color }}>{priorityGroups[k].length}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{PRIORITY_META[k].action}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "20px 16px 14px", boxShadow: "0 4px 20px rgba(0,0,0,0.25)", border: "1px solid #e0e4f0" }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.chartInk }}>Priority Matrix: อายุงาน x Performance ปีล่าสุด</div>
              <div style={{ fontSize: 10, color: C.chartSub, marginTop: 3 }}>P1 = Top 5 (Grade ≤ 3, อายุงาน ≥ 10) เรียง performance สูงก่อน</div>
            </div>
            {(() => {
              const W = 420;
              const H = 290;
              const pad = { top: 20, right: 12, bottom: 36, left: 36 };
              const iW = W - pad.left - pad.right;
              const iH = H - pad.top - pad.bottom;
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
                    return <circle key={e.id} cx={x(e.years)} cy={y(e.performance)} r={3.6} fill={PRIORITY_META[tier].color} fillOpacity={0.68} />;
                  })}
                  <text x={x(10) + 5} y={pad.top + 10} fontSize={8.5} fill="#b91c1c" fontWeight={700}>P1 Candidate Pool (Tenure ≥ 10)</text>
                  <text x={pad.left + iW / 2} y={H - 3} textAnchor="middle" fontSize={9} fill={C.chartSub} fontStyle="italic">อายุงาน (ปี)</text>
                  <text x={12} y={pad.top + iH / 2} textAnchor="middle" fontSize={9} fill={C.chartSub} transform={`rotate(-90,12,${pad.top + iH / 2})`}>Performance</text>
                </svg>
              );
            })()}
          </div>

          <div style={{ background: "#fff", borderRadius: 12, padding: "20px 16px 14px", boxShadow: "0 4px 20px rgba(0,0,0,0.25)", border: "1px solid #e0e4f0" }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.chartInk }}>Top Priority Candidates (P1)</div>
              <div style={{ fontSize: 10, color: C.chartSub, marginTop: 3 }}>เรียงจาก performance สูงสุดก่อน แล้วดู tenure สูง</div>
            </div>
            <div style={{ display: "grid", gap: 7 }}>
              {topPriority.map((e, idx) => (
                <div key={e.id} style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 8, padding: "8px 10px", display: "grid", gridTemplateColumns: "30px 1fr auto", gap: 8, alignItems: "center" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9f1239" }}>#{idx + 1}</div>
                  <div style={{ fontSize: 11, color: "#334155" }}>พนักงาน #{e.id} · {e.subgrade}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9f1239" }}>{e.performance}/5 · {e.years} ปี</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
