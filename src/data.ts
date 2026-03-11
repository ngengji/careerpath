// ── Shared employee data & utilities ────────────────────────────────────────
// Single source of truth — imported by both App.tsx and ExecutivePriorityPage.tsx
import { createClient } from "@supabase/supabase-js";

export const SUBGRADES = [
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

const DIST: Record<string,number> = {
  "1A":30,"2B":28,"2A":22,"3C":22,"3B":18,"3A":14,
  "4C":12,"4B":9,"4A":7,"5B":6,"5A":4,"6B":3,"6A":2,
};
const YEAR_RANGE: Record<string,[number,number]> = {
  "1A":[0,5],"2B":[1,6],"2A":[2,8],"3C":[2,7],"3B":[3,10],"3A":[4,13],
  "4C":[5,10],"4B":[6,12],"4A":[7,14],"5B":[8,13],"5A":[9,15],"6B":[10,15],"6A":[11,15],
};

export type Employee = {
  id: number;
  subgrade: string;
  grade: number;
  yIdx: number;
  yPos: number;
  years: number;
  performance: number;
  name: string;
};

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function generateEmployees(): Employee[] {
  const rng = seededRandom(42);
  const emps: Employee[] = [];
  let id = 1;
  const total = 190;
  const tw = Object.values(DIST).reduce((a, b) => a + b, 0);
  let rem = total;
  const counts: Record<string, number> = {};

  SUBGRADES.forEach((sg, i) => {
    if (i < SUBGRADES.length - 1) {
      counts[sg.key] = Math.round((DIST[sg.key] / tw) * total);
      rem -= counts[sg.key];
    } else {
      counts[sg.key] = rem;
    }
  });

  SUBGRADES.forEach(sg => {
    const [mn, mx] = YEAR_RANGE[sg.key];
    const yIdx = SUBGRADES.findIndex(s => s.key === sg.key);
    for (let i = 0; i < counts[sg.key]; i++) {
      const years       = +(mn + rng() * (mx - mn)).toFixed(1);           // rng call 1
      const perfRaw     = 3.5 + (sg.grade >= 4 ? 0.25 : 0)
                        - (years >= 10 && sg.grade <= 3 ? 0.8 : 0)
                        + (rng() - 0.5) * 1.7;                            // rng call 2
      const performance = +Math.max(1, Math.min(5, perfRaw)).toFixed(1);
      const yPos        = yIdx + (rng() - 0.5) * 0.36;                   // rng call 3
      emps.push({ id: id++, subgrade: sg.key, grade: sg.grade, yIdx, yPos, years, performance, name: `พนักงาน #${id - 1}` });
    }
  });

  return emps;
}

export const ALL_EMP = generateEmployees();

export const isAtRisk = (e: Employee) => e.years >= 10 && e.grade <= 3;

export const P1_IDS = new Set(
  [...ALL_EMP]
    .filter(e => e.grade <= 3 && e.years >= 10 && e.performance >= 3.0)
    .sort((a, b) => b.performance - a.performance || b.years - a.years)
    .slice(0, 5)
    .map(e => e.id)
);

export const getPriorityTier = (e: Employee): "P1" | "P2" | "P3" => {
  if (P1_IDS.has(e.id)) return "P1";
  if ((e.years >= 8 && e.performance >= 3.6 && e.grade <= 4) ||
      (e.years >= 10 && e.performance >= 3.3 && e.grade <= 4)) return "P2";
  return "P3";
};

export const PRIORITY_META = {
  P1: { label: "P1 ความพร้อมสูง", color: "#b91c1c", bg: "#fee2e2", note: "Performance ≥ 3.0 + Tenure ≥ 10 ปี + Grade ≤ 3" },
  P2: { label: "P2 ศักยภาพดี",    color: "#c2410c", bg: "#ffedd5", note: "พร้อมเติบโตต่อในระยะกลาง" },
  P3: { label: "P3 พัฒนาต่อ",     color: "#1d4ed8", bg: "#dbeafe", note: "ติดตามและยกระดับผลลัพธ์" },
};

export const ACTION_TAGS = [
  { key:"promote",    label:"เลื่อนตำแหน่ง",      color:"#1a7340", bg:"#edfaf3" },
  { key:"succession", label:"วางแผน Succession",   color:"#394A76", bg:"#eef1f8" },
  { key:"retention",  label:"Retention Interview", color:"#b91c1c", bg:"#fef2f2" },
  { key:"stretch",    label:"Stretch Assignment",  color:"#EC5924", bg:"#fff4f0" },
];

// ── Supabase client ───────────────────────────────────────────────────────────
const _url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const _key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabase = _url && _key ? createClient(_url, _key) : null;

// ── Shared actions persistence ───────────────────────────────────────────────
export async function loadActions(): Promise<Record<number, string[]>> {
  if (supabase) {
    const { data, error } = await supabase.from("actions").select("emp_id, tags");
    if (!error && data) {
      const result: Record<number, string[]> = {};
      for (const row of data) result[row.emp_id] = row.tags ?? [];
      return result;
    }
  }
  // fallback: localStorage
  try {
    const saved = JSON.parse(localStorage.getItem("career_actions") || "{}");
    const parsed: Record<number, string[]> = {};
    for (const [k, v] of Object.entries(saved)) parsed[Number(k)] = v as string[];
    return parsed;
  } catch {
    return {};
  }
}

export async function saveAction(eid: number, actions: string[]): Promise<void> {
  if (supabase) {
    if (actions.length === 0) {
      await supabase.from("actions").delete().eq("emp_id", eid);
    } else {
      await supabase.from("actions").upsert({ emp_id: eid, tags: actions, updated_at: new Date().toISOString() });
    }
    return;
  }
  // fallback: localStorage
  try {
    const current = JSON.parse(localStorage.getItem("career_actions") || "{}");
    if (actions.length === 0) delete current[eid]; else current[eid] = actions;
    localStorage.setItem("career_actions", JSON.stringify(current));
  } catch {}
}
