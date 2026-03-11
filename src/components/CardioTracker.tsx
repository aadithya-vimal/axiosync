"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { addActivityLog } from "@/lib/firestore";
import {
    ActivitySquare, Timer, MapPin, TrendingUp, Heart, ChevronDown, ChevronUp,
    CheckCircle, Loader2, Zap, Wind, Navigation, Footprints,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

// ── Constants ──────────────────────────────────────────────────────────────────

const MODALITIES = [
    { id: "run", label: "Run", emoji: "🏃", color: "#EF4444", unit: "km" },
    { id: "cycle", label: "Cycle", emoji: "🚴", color: "#3B82F6", unit: "km" },
    { id: "swim", label: "Swim", emoji: "🏊", color: "#06B6D4", unit: "km" },
    { id: "row", label: "Row", emoji: "🚣", color: "#A855F7", unit: "km" },
    { id: "hike", label: "Hike", emoji: "🥾", color: "#22C55E", unit: "km" },
    { id: "walk", label: "Walk", emoji: "🚶", color: "#10B981", unit: "km" },
    { id: "hiit", label: "HIIT", emoji: "⚡", color: "#F59E0B", unit: "" },
    { id: "ski", label: "Ski", emoji: "⛷️", color: "#60A5FA", unit: "km" },
    { id: "yoga", label: "Yoga", emoji: "🧘", color: "#8B5CF6", unit: "" },
    { id: "other", label: "Other", emoji: "🏅", color: "#6B7280", unit: "" },
] as const;

type ModalityId = (typeof MODALITIES)[number]["id"];

const HR_ZONE_CONFIG = [
    { zone: 1, label: "Recovery", color: "#6B7280", min: 0, max: 50 },
    { zone: 2, label: "Aerobic", color: "#22C55E", min: 0, max: 60 },
    { zone: 3, label: "Tempo", color: "#3B82F6", min: 0, max: 60 },
    { zone: 4, label: "Threshold", color: "#F59E0B", min: 0, max: 45 },
    { zone: 5, label: "Anaerobic", color: "#EF4444", min: 0, max: 20 },
];

// ── Auto-generate km splits ───────────────────────────────────────────────────

interface Split {
    km: number;
    paceMin: string;
    hr: number;
    elevation: number;
}

function generateSplits(distanceKm: number, avgPaceMin: number, avgHR: number, elevationM: number): Split[] {
    const fullKms = Math.floor(distanceKm);
    const splits: Split[] = [];
    let cumulativeEle = 0;

    for (let i = 1; i <= Math.min(fullKms, 20); i++) {
        const paceVariance = (Math.random() - 0.5) * 20; // ±10 seconds
        const basePaceSeconds = avgPaceMin * 60;
        const splitSeconds = basePaceSeconds + paceVariance;
        const splitMin = Math.floor(splitSeconds / 60);
        const splitSec = Math.round(splitSeconds % 60);
        const eleGain = Math.round((elevationM / Math.max(distanceKm, 1)) + (Math.random() - 0.5) * 8);
        cumulativeEle += eleGain;
        splits.push({
            km: i,
            paceMin: `${splitMin}:${splitSec.toString().padStart(2, "0")}`,
            hr: Math.round(avgHR + (Math.random() - 0.5) * 12),
            elevation: eleGain,
        });
    }
    return splits;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, unit, color, icon }: { label: string; value: string; unit: string; color: string; icon: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1 p-3.5 rounded-2xl" style={{ background: "var(--bg-elevated)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs">{icon} {label}</div>
            <div className="flex items-end gap-1">
                <span className="text-2xl font-bold stat-num" style={{ color }}>{value}</span>
                <span className="text-xs text-[var(--text-muted)] mb-0.5">{unit}</span>
            </div>
        </div>
    );
}

// ── Map Placeholder ───────────────────────────────────────────────────────────

function MapPlaceholder() {
    return (
        <div
            className="w-full rounded-2xl overflow-hidden flex items-center justify-center relative"
            style={{
                height: 180,
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
                border: "1px solid rgba(255,255,255,0.06)",
            }}
        >
            {/* Simulated map grid lines */}
            <svg className="absolute inset-0 w-full h-full opacity-10">
                {[...Array(8)].map((_, i) => (
                    <line key={`h${i}`} x1="0" y1={`${(i / 7) * 100}%`} x2="100%" y2={`${(i / 7) * 100}%`} stroke="#3B82F6" strokeWidth="0.5" />
                ))}
                {[...Array(12)].map((_, i) => (
                    <line key={`v${i}`} x1={`${(i / 11) * 100}%`} y1="0" x2={`${(i / 11) * 100}%`} y2="100%" stroke="#3B82F6" strokeWidth="0.5" />
                ))}
                {/* Simulated route path */}
                <path d="M60,150 C100,120 140,80 180,90 C220,100 240,60 280,50 C320,40 350,70 380,60"
                    stroke="#EF4444" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
                <circle cx="60" cy="150" r="5" fill="#22C55E" />
                <circle cx="380" cy="60" r="5" fill="#EF4444" />
            </svg>
            <div className="text-center relative z-10 space-y-1">
                <Navigation className="w-5 h-5 text-[#3B82F6] mx-auto opacity-60" />
                <p className="text-xs text-[var(--text-muted)] font-medium">Route Map</p>
                <p className="text-[10px] text-[var(--text-secondary)]">Mapbox / Leaflet integration ready</p>
            </div>
        </div>
    );
}

// ── HR Zone Bars ──────────────────────────────────────────────────────────────

function HRZoneChart({ zones }: { zones: number[] }) {
    const data = HR_ZONE_CONFIG.map((z, i) => ({ name: `Z${z.zone}`, mins: zones[i] || 0, color: z.color, label: z.label }));
    return (
        <div style={{ height: 90 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} barSize={20}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#71717A" }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                        contentStyle={{ background: "var(--bg-elevated)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 11 }}
                        labelStyle={{ color: "#fff" }}
                        formatter={(v: any, _: any, entry: any) => [`${v}min`, entry.payload.label]}
                    />
                    <Bar dataKey="mins" radius={4}>
                        {data.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={d.mins > 0 ? 0.9 : 0.2} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CardioTracker() {
    const { user } = useAuth();
    const [modality, setModality] = useState<ModalityId>("run");
    const [durationMin, setDurationMin] = useState("");
    const [distanceKm, setDistanceKm] = useState("");
    const [elevation, setElevation] = useState("");
    const [avgHR, setAvgHR] = useState("");
    const [maxHR, setMaxHR] = useState("");
    const [cadence, setCadence] = useState("");
    const [zones, setZones] = useState([0, 0, 0, 0, 0]);
    const [showZones, setShowZones] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showSplits, setShowSplits] = useState(false);

    const current = MODALITIES.find(m => m.id === modality)!;

    // Derived stats
    const distNum = parseFloat(distanceKm) || 0;
    const durNum = parseFloat(durationMin) || 0;
    const eleNum = parseFloat(elevation) || 0;
    const hrNum = parseFloat(avgHR) || 140;

    const paceMinPerKm = distNum > 0 && durNum > 0 ? durNum / distNum : 0;
    const paceFormatted = paceMinPerKm > 0
        ? `${Math.floor(paceMinPerKm)}:${String(Math.round((paceMinPerKm % 1) * 60)).padStart(2, "0")}`
        : "--:--";
    const speedKmh = durNum > 0 && distNum > 0 ? (distNum / (durNum / 60)) : 0;
    const calBurned = Math.round(durNum * 8.5);

    const splits = distNum > 0 && durNum > 0
        ? generateSplits(distNum, paceMinPerKm, hrNum, eleNum)
        : [];

    const totalZoneMins = zones.reduce((a, b) => a + b, 0);

    const handleSave = useCallback(async () => {
        if (!user || !durationMin) return;
        setSaving(true);
        await addActivityLog(user.uid, {
            type: modality,
            name: `${current.label}`,
            duration_min: durNum,
            distance_km: distNum || undefined,
            elevation_m: eleNum || undefined,
            avg_hr: hrNum || undefined,
            max_hr: parseFloat(maxHR) || undefined,
            calories_burned: calBurned,
            hr_zones: {
                z1_min: zones[0], z2_min: zones[1], z3_min: zones[2], z4_min: zones[3], z5_min: zones[4],
            },
        } as any);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        setSaving(false);
    }, [user, modality, durationMin, distanceKm, elevation, avgHR, maxHR, zones, durNum, distNum, eleNum, hrNum, calBurned, current.label]);

    return (
        <div className="space-y-5">
            {/* Modality picker */}
            <div>
                <p className="section-header">Activity Type</p>
                <div className="grid grid-cols-5 gap-1.5">
                    {MODALITIES.map(m => (
                        <motion.button
                            key={m.id}
                            onClick={() => setModality(m.id)}
                            whileTap={{ scale: 0.93 }}
                            className="flex flex-col items-center gap-1 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200"
                            style={modality === m.id
                                ? { background: `${m.color}18`, border: `1px solid ${m.color}40`, color: m.color }
                                : { background: "var(--bg-elevated)", border: "1px solid rgba(255,255,255,0.06)", color: "var(--text-muted)" }
                            }
                        >
                            <span className="text-lg">{m.emoji}</span>
                            <span className="text-[10px]">{m.label}</span>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Map placeholder */}
            <MapPlaceholder />

            {/* Core metrics grid */}
            <div>
                <p className="section-header">Session Data</p>
                <div className="grid grid-cols-2 gap-2.5">
                    {[
                        { label: "Duration", value: durationMin, set: setDurationMin, unit: "min", placeholder: "45" },
                        { label: "Distance", value: distanceKm, set: setDistanceKm, unit: current.unit || "km", placeholder: "5.0", hidden: !current.unit },
                        { label: "Elevation", value: elevation, set: setElevation, unit: "m gain", placeholder: "120" },
                        { label: "Avg Cadence", value: cadence, set: setCadence, unit: "rpm / spm", placeholder: "165", hidden: !["run", "cycle", "row"].includes(modality) },
                    ].filter(f => !f.hidden).map(({ label, value, set, unit, placeholder }) => (
                        <div key={label}>
                            <label className="label">{label}</label>
                            <div className="relative">
                                <input type="number" placeholder={placeholder} value={value}
                                    onChange={e => set(e.target.value)} className="field text-sm pr-12" />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] pointer-events-none">{unit}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Heart rate */}
            <div className="grid grid-cols-2 gap-2.5">
                <div>
                    <label className="label">Avg Heart Rate</label>
                    <div className="relative">
                        <input type="number" placeholder="148" value={avgHR}
                            onChange={e => setAvgHR(e.target.value)} className="field text-sm pr-12" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] pointer-events-none">bpm</span>
                    </div>
                </div>
                <div>
                    <label className="label">Max Heart Rate</label>
                    <div className="relative">
                        <input type="number" placeholder="172" value={maxHR}
                            onChange={e => setMaxHR(e.target.value)} className="field text-sm pr-12" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] pointer-events-none">bpm</span>
                    </div>
                </div>
            </div>

            {/* Live derived stats */}
            {(durNum > 0 || distNum > 0) && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                >
                    {modality !== "hiit" && modality !== "yoga" && (
                        <StatCard label="Avg Pace" value={paceFormatted} unit="min/km"
                            color={current.color} icon={<Timer className="w-3 h-3" />} />
                    )}
                    {distNum > 0 && (
                        <StatCard label="Speed" value={speedKmh.toFixed(1)} unit="km/h"
                            color={current.color} icon={<Wind className="w-3 h-3" />} />
                    )}
                    <StatCard label="Est. Calories" value={String(calBurned)} unit="kcal"
                        color="#F59E0B" icon={<Zap className="w-3 h-3" />} />
                    {distNum > 0 && (
                        <StatCard label="Distance" value={distanceKm} unit="km"
                            color="#22C55E" icon={<Footprints className="w-3 h-3" />} />
                    )}
                </motion.div>
            )}

            {/* HR Zones */}
            <div>
                <button
                    onClick={() => setShowZones(v => !v)}
                    className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors font-medium"
                >
                    <Heart className="w-3.5 h-3.5" />
                    HR Zone Distribution
                    {showZones ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                <AnimatePresence>
                    {showZones && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-3 space-y-3"
                        >
                            <div className="grid grid-cols-5 gap-1.5">
                                {HR_ZONE_CONFIG.map((z, i) => (
                                    <div key={z.zone} className="space-y-1">
                                        <label className="label text-center block" style={{ color: z.color }}>Z{z.zone}</label>
                                        <input
                                            type="number" min="0" placeholder="0"
                                            value={zones[i] || ""}
                                            onChange={e => setZones(prev => { const n = [...prev]; n[i] = parseFloat(e.target.value) || 0; return n; })}
                                            className="field text-sm text-center px-1"
                                        />
                                        <div className="text-center text-[9px] text-[var(--text-secondary)]">{z.label}</div>
                                    </div>
                                ))}
                            </div>
                            {totalZoneMins > 0 && (
                                <>
                                    <HRZoneChart zones={zones} />
                                    {/* Stacked zone bar */}
                                    <div className="flex h-2.5 rounded-full overflow-hidden gap-px">
                                        {HR_ZONE_CONFIG.map((z, i) => {
                                            const pct = totalZoneMins > 0 ? (zones[i] / totalZoneMins) * 100 : 0;
                                            return pct > 0 ? (
                                                <div key={z.zone} style={{ width: `${pct}%`, background: z.color }} title={`Z${z.zone}: ${zones[i]}min`} />
                                            ) : null;
                                        })}
                                    </div>
                                    <div className="flex justify-between text-[9px] text-[var(--text-muted)]">
                                        <span>Aerobic: {Math.round(((zones[0] + zones[1] + zones[2]) / totalZoneMins) * 100)}%</span>
                                        <span>Anaerobic: {Math.round(((zones[3] + zones[4]) / totalZoneMins) * 100)}%</span>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Auto-generated splits */}
            {splits.length > 0 && (
                <div>
                    <button
                        onClick={() => setShowSplits(v => !v)}
                        className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors font-medium"
                    >
                        <TrendingUp className="w-3.5 h-3.5" />
                        Km Splits ({splits.length})
                        {showSplits ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <AnimatePresence>
                        {showSplits && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden mt-2"
                            >
                                <div className="rounded-2xl overflow-hidden border border-white/[0.06]" style={{ background: "var(--bg-elevated)" }}>
                                    {/* Table header */}
                                    <div className="grid grid-cols-4 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] border-b border-white/[0.05]">
                                        <span>KM</span><span>Pace</span><span>HR</span><span>↑ Ele</span>
                                    </div>
                                    <div className="thin-scrollbar overflow-y-auto" style={{ maxHeight: 180 }}>
                                        {splits.map((s, i) => (
                                            <motion.div
                                                key={s.km}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: i * 0.03 }}
                                                className="grid grid-cols-4 px-3 py-2 text-xs border-b border-white/[0.03] last:border-0"
                                            >
                                                <span className="font-bold text-[var(--text-primary)]">{s.km}</span>
                                                <span className="stat-num" style={{ color: current.color }}>{s.paceMin}</span>
                                                <span className="text-[#EF4444] stat-num">{s.hr} bpm</span>
                                                <span className="text-[#22C55E]">{s.elevation > 0 ? "+" : ""}{s.elevation}m</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Save */}
            <motion.button
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={saving || !durationMin}
                className="btn w-full py-4 text-sm font-semibold"
                style={{
                    background: saved
                        ? "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)"
                        : `linear-gradient(135deg, ${current.color} 0%, ${current.color}cc 100%)`,
                    boxShadow: `0 6px 24px ${current.color}35, 0 1px 0 rgba(255,255,255,0.1) inset`,
                    color: "white",
                }}
            >
                {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    : saved
                        ? <><CheckCircle className="w-4 h-4" /> Session Saved!</>
                        : <><ActivitySquare className="w-4 h-4" /> Log {current.label} Session</>
                }
            </motion.button>
        </div>
    );
}
