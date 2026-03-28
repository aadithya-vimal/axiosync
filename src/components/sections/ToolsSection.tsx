"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Dumbbell, Activity, HeartPulse, PieChart, Calculator, Shield } from "lucide-react";

type ToolId = "strength" | "tdee" | "bmi" | "bodyfat" | "army" | "bmr" | "1rm" | "vo2" | "hr" | "macro" | "acft" | "maxbench";

interface Tool { id: ToolId; title: string; icon: React.ComponentType<{ className?: string }> }

const TOOLS: Tool[] = [
    { id: "strength", title: "Strength Standards Calculator", icon: Dumbbell },
    { id: "tdee",     title: "TDEE Calculator",               icon: Activity  },
    { id: "bmi",      title: "BMI Calculator",                icon: Calculator},
    { id: "bodyfat",  title: "Body Fat Calculator",           icon: PieChart  },
    { id: "army",     title: "Army Body Fat Calculator",      icon: Shield    },
    { id: "bmr",      title: "BMR Calculator",                icon: Activity  },
    { id: "1rm",      title: "1RM Calculator",                icon: Dumbbell  },
    { id: "vo2",      title: "VO2 Max Calculator",            icon: HeartPulse},
    { id: "hr",       title: "Heart Rate Zone Calculator",    icon: HeartPulse},
    { id: "macro",    title: "Macro Calculator",              icon: PieChart  },
    { id: "acft",     title: "ACFT Calculator",               icon: Activity  },
    { id: "maxbench", title: "Max Bench Calculator",          icon: Dumbbell  },
];

const InputField = ({ label, value, onChange, unit }: { label: string; value: string; onChange: (v: string) => void; unit?: string }) => (
    <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)]">{label}</label>
        <div className="relative">
            <input
                type="number"
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2.5 text-[var(--text-primary)] font-semibold text-sm focus:outline-none focus:border-blue-500/60 transition-colors pr-10"
            />
            {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] font-medium">{unit}</span>}
        </div>
    </div>
);

const ResultBadge = ({ label, value, color = "#3B82F6" }: { label: string; value: string; color?: string }) => (
    <div className="flex items-center justify-between rounded-xl px-4 py-3 mt-4" style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>{label}</span>
        <span className="text-lg font-bold text-[var(--text-primary)]">{value}</span>
    </div>
);

function SelectInput({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)]">{label}</label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2.5 text-[var(--text-primary)] font-semibold text-sm focus:outline-none focus:border-blue-500/60 transition-colors appearance-none"
            >
                {options.map(o => <option key={o.value} value={o.value} className="bg-[#111827]">{o.label}</option>)}
            </select>
        </div>
    );
}

// ─── Individual Calculator Components ─────────────────────────────────────────

function BMICalc() {
    const [weight, setWeight] = useState("75");
    const [height, setHeight] = useState("175");
    const w = parseFloat(weight), h = parseFloat(height) / 100;
    const bmi = (w && h) ? (w / (h * h)).toFixed(1) : "—";
    const category = !w || !h ? "" : parseFloat(bmi) < 18.5 ? "Underweight" : parseFloat(bmi) < 25 ? "Normal weight" : parseFloat(bmi) < 30 ? "Overweight" : "Obese";
    return (
        <div className="grid grid-cols-2 gap-3">
            <InputField label="Weight" value={weight} onChange={setWeight} unit="kg" />
            <InputField label="Height" value={height} onChange={setHeight} unit="cm" />
            <div className="col-span-2"><ResultBadge label={`BMI — ${category}`} value={bmi} color="#3B82F6" /></div>
        </div>
    );
}

function BMRCalc() {
    const [weight, setWeight] = useState("75");
    const [height, setHeight] = useState("175");
    const [age, setAge] = useState("25");
    const [sex, setSex] = useState("male");
    const w = parseFloat(weight), h = parseFloat(height), a = parseFloat(age);
    const bmr = (w && h && a) ? (sex === "male" ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161).toFixed(0) : "—";
    return (
        <div className="grid grid-cols-2 gap-3">
            <InputField label="Weight" value={weight} onChange={setWeight} unit="kg" />
            <InputField label="Height" value={height} onChange={setHeight} unit="cm" />
            <InputField label="Age" value={age} onChange={setAge} unit="yrs" />
            <SelectInput label="Sex" value={sex} onChange={setSex} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
            <div className="col-span-2"><ResultBadge label="Basal Metabolic Rate" value={bmr !== "—" ? `${bmr} kcal/day` : "—"} color="#10B981" /></div>
        </div>
    );
}

function TDEECalc() {
    const [weight, setWeight] = useState("75");
    const [height, setHeight] = useState("175");
    const [age, setAge] = useState("25");
    const [sex, setSex] = useState("male");
    const [activity, setActivity] = useState("1.55");
    const w = parseFloat(weight), h = parseFloat(height), a = parseFloat(age), act = parseFloat(activity);
    const bmr = (w && h && a) ? (sex === "male" ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161) : 0;
    const tdee = bmr ? (bmr * act).toFixed(0) : "—";
    return (
        <div className="grid grid-cols-2 gap-3">
            <InputField label="Weight" value={weight} onChange={setWeight} unit="kg" />
            <InputField label="Height" value={height} onChange={setHeight} unit="cm" />
            <InputField label="Age" value={age} onChange={setAge} unit="yrs" />
            <SelectInput label="Sex" value={sex} onChange={setSex} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
            <div className="col-span-2">
                <SelectInput label="Activity Level" value={activity} onChange={setActivity} options={[
                    { value: "1.2", label: "Sedentary (desk job)" },
                    { value: "1.375", label: "Lightly active (1-3x/week)" },
                    { value: "1.55", label: "Moderately active (3-5x/week)" },
                    { value: "1.725", label: "Very active (6-7x/week)" },
                    { value: "1.9", label: "Extremely active (athlete)" },
                ]} />
            </div>
            <div className="col-span-2"><ResultBadge label="Total Daily Energy Expenditure" value={tdee !== "—" ? `${tdee} kcal/day` : "—"} color="#F59E0B" /></div>
        </div>
    );
}

function OneRMCalc({ title = "1RM" }: { title?: string }) {
    const [weight, setWeight] = useState("100");
    const [reps, setReps] = useState("5");
    const w = parseFloat(weight), r = parseFloat(reps);
    const epley = (w && r) ? (w * (1 + r / 30)).toFixed(1) : "—";
    return (
        <div className="grid grid-cols-2 gap-3">
            <InputField label="Weight Lifted" value={weight} onChange={setWeight} unit="kg" />
            <InputField label="Reps Performed" value={reps} onChange={setReps} unit="reps" />
            <div className="col-span-2"><ResultBadge label={`Estimated ${title} (Epley formula)`} value={epley !== "—" ? `${epley} kg` : "—"} color="#8B5CF6" /></div>
        </div>
    );
}

function HRZoneCalc() {
    const [age, setAge] = useState("25");
    const a = parseFloat(age);
    const max = a ? 220 - a : 0;
    const zones = max ? [
        { name: "Zone 1 – Recovery", range: `${Math.round(max * 0.5)}–${Math.round(max * 0.6)} bpm`, color: "#10B981" },
        { name: "Zone 2 – Aerobic Base", range: `${Math.round(max * 0.6)}–${Math.round(max * 0.7)} bpm`, color: "#3B82F6" },
        { name: "Zone 3 – Aerobic", range: `${Math.round(max * 0.7)}–${Math.round(max * 0.8)} bpm`, color: "#F59E0B" },
        { name: "Zone 4 – Threshold", range: `${Math.round(max * 0.8)}–${Math.round(max * 0.9)} bpm`, color: "#F97316" },
        { name: "Zone 5 – VO2 Max", range: `${Math.round(max * 0.9)}–${max} bpm`, color: "#EF4444" },
    ] : [];
    return (
        <div className="space-y-3">
            <InputField label="Age" value={age} onChange={setAge} unit="yrs" />
            {max > 0 && <p className="text-xs text-[var(--text-muted)]">Max HR: <span className="text-[var(--text-primary)] font-bold">{max} bpm</span></p>}
            {zones.map(z => <ResultBadge key={z.name} label={z.name} value={z.range} color={z.color} />)}
        </div>
    );
}

function VO2Calc() {
    const [time, setTime] = useState("12");
    const [rhr, setRhr] = useState("60");
    const [mhr, setMhr] = useState("200");
    const t = parseFloat(time), r = parseFloat(rhr), m = parseFloat(mhr);
    const cooper = t ? ((t - 0.3138) / 0.2006).toFixed(1) : "—";
    const hrReserve = (r && m) ? ((m - r) / m * 15.3 + 3.5).toFixed(1) : "—";
    return (
        <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 text-xs text-[var(--text-muted)] font-medium">Cooper 12-min run test</div>
            <div className="col-span-2"><InputField label="Distance run in 12 min" value={time} onChange={setTime} unit="km" /></div>
            <ResultBadge label="VO2 Max (Cooper)" value={cooper !== "—" ? `${cooper} ml/kg/min` : "—"} color="#06B6D4" />
            <div className="col-span-2 border-t border-white/5 pt-3 text-xs text-[var(--text-muted)] font-medium">Heart Rate method</div>
            <InputField label="Resting HR" value={rhr} onChange={setRhr} unit="bpm" />
            <InputField label="Max HR" value={mhr} onChange={setMhr} unit="bpm" />
            <div className="col-span-2"><ResultBadge label="VO2 Max (HR Method)" value={hrReserve !== "—" ? `${hrReserve} ml/kg/min` : "—"} color="#8B5CF6" /></div>
        </div>
    );
}

function BodyFatCalc() {
    const [neck, setNeck] = useState("38");
    const [waist, setWaist] = useState("82");
    const [hip, setHip] = useState("95");
    const [height, setHeight] = useState("175");
    const [sex, setSex] = useState("male");
    const n = parseFloat(neck), w = parseFloat(waist), hi = parseFloat(hip), h = parseFloat(height);
    let bf = "—";
    if (n && w && h) {
        if (sex === "male" && n && w && h) {
            bf = (86.010 * Math.log10(w - n) - 70.041 * Math.log10(h) + 36.76).toFixed(1);
        } else if (sex === "female" && n && w && hi && h) {
            bf = (163.205 * Math.log10(w + hi - n) - 97.684 * Math.log10(h) - 78.387).toFixed(1);
        }
    }
    return (
        <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><SelectInput label="Sex" value={sex} onChange={setSex} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} /></div>
            <InputField label="Neck" value={neck} onChange={setNeck} unit="cm" />
            <InputField label="Waist" value={waist} onChange={setWaist} unit="cm" />
            {sex === "female" && <InputField label="Hip" value={hip} onChange={setHip} unit="cm" />}
            <InputField label="Height" value={height} onChange={setHeight} unit="cm" />
            <div className="col-span-2"><ResultBadge label="Body Fat % (US Navy)" value={bf !== "—" ? `${bf}%` : "—"} color="#EF4444" /></div>
        </div>
    );
}

function ArmyBFCalc() {
    const [neck, setNeck] = useState("38");
    const [waist, setWaist] = useState("82");
    const [height, setHeight] = useState("175");
    const [sex, setSex] = useState("male");
    const [age, setAge] = useState("25");
    const n = parseFloat(neck), w = parseFloat(waist), h = parseFloat(height), a = parseFloat(age);
    let bf = "—";
    let pass = "—";
    if (n && w && h) {
        if (sex === "male") bf = (86.010 * Math.log10(w - n) - 70.041 * Math.log10(h) + 36.76).toFixed(1);
        const bfNum = parseFloat(bf);
        if (!isNaN(bfNum) && a) {
            const limits: Record<string, number> = { "17-20": 20, "21-27": 22, "28-39": 24, "40+": 26 };
            const limit = a <= 20 ? 20 : a <= 27 ? 22 : a <= 39 ? 24 : 26;
            pass = bfNum <= limit ? `PASS (limit: ${limit}%)` : `FAIL (limit: ${limit}%)`;
        }
    }
    return (
        <div className="grid grid-cols-2 gap-3">
            <SelectInput label="Sex" value={sex} onChange={setSex} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
            <InputField label="Age" value={age} onChange={setAge} unit="yrs" />
            <InputField label="Neck" value={neck} onChange={setNeck} unit="cm" />
            <InputField label="Waist" value={waist} onChange={setWaist} unit="cm" />
            <div className="col-span-2"><InputField label="Height" value={height} onChange={setHeight} unit="cm" /></div>
            <div className="col-span-2">
                <ResultBadge label="Body Fat %" value={bf !== "—" ? `${bf}%` : "—"} color="#EF4444" />
                {pass !== "—" && <ResultBadge label="Army Standard" value={pass} color={pass.startsWith("PASS") ? "#10B981" : "#EF4444"} />}
            </div>
        </div>
    );
}

function MacroCalc() {
    const [calories, setCalories] = useState("2500");
    const [goal, setGoal] = useState("maintain");
    const cal = parseFloat(calories);
    const adj = goal === "cut" ? cal * 0.8 : goal === "bulk" ? cal * 1.1 : cal;
    const protein = (adj * 0.3 / 4).toFixed(0);
    const carbs = (adj * 0.45 / 4).toFixed(0);
    const fat = (adj * 0.25 / 9).toFixed(0);
    return (
        <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><InputField label="Daily Calorie Target / TDEE" value={calories} onChange={setCalories} unit="kcal" /></div>
            <div className="col-span-2">
                <SelectInput label="Goal" value={goal} onChange={setGoal} options={[
                    { value: "cut", label: "Cut (−20% calories)" },
                    { value: "maintain", label: "Maintain" },
                    { value: "bulk", label: "Bulk (+10% calories)" },
                ]} />
            </div>
            <ResultBadge label="Protein" value={`${protein}g/day`} color="#10B981" />
            <ResultBadge label="Carbs" value={`${carbs}g/day`} color="#3B82F6" />
            <ResultBadge label="Fat" value={`${fat}g/day`} color="#F59E0B" />
            <div className="col-span-2"><ResultBadge label="Adjusted Calories" value={`${adj.toFixed(0)} kcal/day`} color="#8B5CF6" /></div>
        </div>
    );
}

function StrengthStandards() {
    const [weight, setWeight] = useState("80");
    const [bw, setBw] = useState("80");
    const [lift, setLift] = useState("squat");
    const w = parseFloat(weight), b = parseFloat(bw);
    const ratio = (w && b) ? (w / b).toFixed(2) : "—";
    const STANDARDS: Record<string, { beginner: number; novice: number; intermediate: number; advanced: number; elite: number }> = {
        squat: { beginner: 0.75, novice: 1.25, intermediate: 1.5, advanced: 1.75, elite: 2.25 },
        bench: { beginner: 0.5, novice: 0.75, intermediate: 1.0, advanced: 1.25, elite: 1.5 },
        deadlift: { beginner: 1.0, novice: 1.5, intermediate: 1.75, advanced: 2.0, elite: 2.5 },
        ohp: { beginner: 0.35, novice: 0.55, intermediate: 0.7, advanced: 0.85, elite: 1.1 },
    };
    const std = STANDARDS[lift];
    const ratioParsed = parseFloat(ratio);
    const level = !ratioParsed ? "—" : ratioParsed < std?.novice ? "Beginner" : ratioParsed < std?.intermediate ? "Novice" : ratioParsed < std?.advanced ? "Intermediate" : ratioParsed < std?.elite ? "Advanced" : "Elite";
    const levelColor = level === "Elite" ? "#EF4444" : level === "Advanced" ? "#F97316" : level === "Intermediate" ? "#F59E0B" : "#10B981";
    return (
        <div className="grid grid-cols-2 gap-3">
            <InputField label="Lift (1RM)" value={weight} onChange={setWeight} unit="kg" />
            <InputField label="Bodyweight" value={bw} onChange={setBw} unit="kg" />
            <div className="col-span-2">
                <SelectInput label="Lift" value={lift} onChange={setLift} options={[
                    { value: "squat", label: "Squat" },
                    { value: "bench", label: "Bench Press" },
                    { value: "deadlift", label: "Deadlift" },
                    { value: "ohp", label: "Overhead Press" },
                ]} />
            </div>
            <ResultBadge label="Lift:BW ratio" value={`${ratio}×`} color="#3B82F6" />
            <div className="col-span-2"><ResultBadge label="Standard" value={level} color={levelColor} /></div>
        </div>
    );
}

function ACFTCalc() {
    const fields = [
        { label: "3-Rep Max Deadlift", key: "dl", unit: "lbs" },
        { label: "Standing Power Throw (SPT)", key: "spt", unit: "m" },
        { label: "Hand Release Push-Up (HRPU)", key: "hrpu", unit: "reps" },
        { label: "Sprint-Drag-Carry (SDC)", key: "sdc", unit: "sec" },
        { label: "Plank", key: "plank", unit: "sec" },
        { label: "2-Mile Run", key: "run", unit: "min" },
    ];
    const [values, setValues] = useState<Record<string, string>>({
        dl: "180", spt: "8", hrpu: "35", sdc: "97", plank: "120", run: "17"
    });
    // Simplified ACFT scoring tables
    const scores: Record<string, number> = {
        dl: Math.min(100, Math.max(0, Math.round((parseFloat(values.dl) - 140) / 2.3))),
        spt: Math.min(100, Math.max(0, Math.round((parseFloat(values.spt) - 4.5) * 10))),
        hrpu: Math.min(100, Math.max(0, Math.round((parseFloat(values.hrpu) - 10) * 2.1))),
        sdc: Math.min(100, Math.max(0, Math.round((127 - parseFloat(values.sdc)) * 3))),
        plank: Math.min(100, Math.max(0, Math.round((parseFloat(values.plank) - 60) * 0.75))),
        run: Math.min(100, Math.max(0, Math.round((21 - parseFloat(values.run)) * 6.67))),
    };
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    const pass = total >= 360 && Object.values(scores).every(s => s >= 60);
    return (
        <div className="grid grid-cols-2 gap-3">
            {fields.map(f => (
                <InputField key={f.key} label={f.label} value={values[f.key]} onChange={v => setValues(prev => ({ ...prev, [f.key]: v }))} unit={f.unit} />
            ))}
            <div className="col-span-2">
                <ResultBadge label="Total ACFT Score" value={`${total} / 600`} color={pass ? "#10B981" : "#EF4444"} />
                <ResultBadge label="Status" value={pass ? "PASS" : "FAIL"} color={pass ? "#10B981" : "#EF4444"} />
            </div>
        </div>
    );
}

// ─── Calculator renderings ────────────────────────────────────────────────────

const CALC_MAP: Record<ToolId, React.ReactNode> = {
    strength: <StrengthStandards />,
    tdee:     <TDEECalc />,
    bmi:      <BMICalc />,
    bodyfat:  <BodyFatCalc />,
    army:     <ArmyBFCalc />,
    bmr:      <BMRCalc />,
    "1rm":    <OneRMCalc />,
    vo2:      <VO2Calc />,
    hr:       <HRZoneCalc />,
    macro:    <MacroCalc />,
    acft:     <ACFTCalc />,
    maxbench: <OneRMCalc title="Max Bench" />,
};

// ─── Main export ──────────────────────────────────────────────────────────────

export default function ToolsSection() {
    const [open, setOpen] = useState<ToolId | null>(null);

    return (
        <div className="w-full max-w-2xl mx-auto space-y-2 pb-28">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6 tracking-tight">All Tools</h1>

            {TOOLS.map(({ id, title, icon: Icon }) => (
                <div
                    key={id}
                    className="rounded-2xl overflow-hidden transition-colors"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                >
                    <button
                        onClick={() => setOpen(open === id ? null : id)}
                        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                <Icon className="w-4 h-4 text-blue-400" />
                            </div>
                            <span className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-blue-400 transition-colors">{title}</span>
                        </div>
                        <motion.div animate={{ rotate: open === id ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronDown className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                        </motion.div>
                    </button>

                    <AnimatePresence>
                        {open === id && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.22, ease: "easeInOut" }}
                                className="overflow-hidden"
                            >
                                <div className="px-5 pb-5 pt-2 border-t border-white/[0.04]">
                                    {CALC_MAP[id]}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}
        </div>
    );
}
