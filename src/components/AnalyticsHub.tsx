"use client";

import { useState, useEffect, useCallback } from "react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    RadialBarChart, RadialBar, LineChart, Line, CartesianGrid,
    ScatterChart, Scatter, Cell, Legend, ReferenceLine,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import {
    getWorkoutLogs, getActivityLogs, getNutritionLogs, getSleepLogs,
    getReadinessLogs, addReadinessLog, calcReadiness,
    type WorkoutLog, type ActivityLog, type NutritionLog, type SleepLog, type ReadinessLog,
} from "@/lib/firestore";
import { Brain, Dumbbell, Leaf, Moon, BarChart3, Loader2, Plus } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type AnalyticsTab = "readiness" | "training" | "nutrition" | "sleep" | "correlations";
type TimeRange = "7d" | "30d" | "90d" | "1y" | "all";

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysForRange(range: TimeRange): number {
    return { "7d": 7, "30d": 30, "90d": 90, "1y": 365, "all": 3650 }[range];
}

function fmtDate(d: Date, short = false): string {
    return d.toLocaleDateString("en-US", short
        ? { month: "short", day: "numeric" }
        : { month: "short", day: "numeric", year: "2-digit" }
    );
}

function pearson(a: number[], b: number[]): number {
    const n = Math.min(a.length, b.length);
    if (n < 2) return 0;
    const as = a.slice(0, n), bs = b.slice(0, n);
    const ma = as.reduce((s, v) => s + v, 0) / n;
    const mb = bs.reduce((s, v) => s + v, 0) / n;
    let num = 0, da = 0, db = 0;
    for (let i = 0; i < n; i++) {
        const oa = as[i] - ma, ob = bs[i] - mb;
        num += oa * ob; da += oa * oa; db += ob * ob;
    }
    const denom = Math.sqrt(da * db);
    return denom === 0 ? 0 : parseFloat((num / denom).toFixed(2));
}

// ── Readiness Gauge ────────────────────────────────────────────────────────────

function ReadinessGauge({ score }: { score: number }) {
    const color = score >= 80 ? "#30D158" : score >= 60 ? "#FF9F0A" : "#FF453A";
    const r = 56;
    const circ = 2 * Math.PI * r;
    const progress = (score / 100) * circ * 0.75;
    const dashOffset = circ * 0.75 - progress;

    return (
        <div className="relative flex items-center justify-center" style={{ width: 152, height: 152 }}>
            <svg width="152" height="152" viewBox="0 0 152 152">
                <circle cx="76" cy="76" r={r} fill="none" stroke="rgba(255,255,255,0.06)"
                    strokeWidth="10" strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
                    strokeLinecap="round" transform="rotate(135 76 76)"
                />
                <circle cx="76" cy="76" r={r} fill="none" stroke={color}
                    strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${progress} ${circ - progress}`}
                    style={{ filter: `drop-shadow(0 0 8px ${color}80)`, transition: "stroke-dasharray 0.8s ease" }}
                    transform="rotate(135 76 76)"
                />
            </svg>
            <div className="absolute text-center">
                <div className="text-4xl font-bold stat-num" style={{ color }}>{score}</div>
                <div className="text-xs text-zinc-500 font-medium">Readiness</div>
            </div>
        </div>
    );
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

const GlassTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="card px-3 py-2 text-xs space-y-1 shadow-xl" style={{ minWidth: 100 }}>
            {label && <div className="text-zinc-400 font-medium mb-1">{label}</div>}
            {payload.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
                    <span className="text-zinc-400">{p.name}:</span>
                    <span className="text-white font-semibold stat-num">{typeof p.value === "number" ? p.value.toFixed(1) : p.value}</span>
                </div>
            ))}
        </div>
    );
};

// ── Empty State ────────────────────────────────────────────────────────────────

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center">{icon}</div>
            <p className="text-zinc-600 text-sm">{text}</p>
        </div>
    );
}

// ── Readiness Tab ──────────────────────────────────────────────────────────────

function ReadinessTab({ readinessLogs, onRefresh }: { readinessLogs: ReadinessLog[]; onRefresh: () => void }) {
    const { user } = useAuth();
    const [hrv, setHrv] = useState("");
    const [restHr, setRestHr] = useState("");
    const [sleepQ, setSleepQ] = useState(7);
    const [exertion, setExertion] = useState(3);
    const [saving, setSaving] = useState(false);

    const today = readinessLogs[0];
    const score = today?.readiness_pct ?? calcReadiness(
        hrv ? parseFloat(hrv) : undefined,
        restHr ? parseInt(restHr) : undefined,
        sleepQ * 10,
        exertion * 20
    );

    const trendData = readinessLogs.slice(0, 14).reverse().map(r => ({
        date: fmtDate(r.timestamp?.toDate?.() || new Date(), true),
        score: r.readiness_pct,
    }));

    const handleLog = async () => {
        if (!user) return;
        setSaving(true);
        const hrv_ms = hrv ? parseFloat(hrv) : undefined;
        const resting_hr = restHr ? parseInt(restHr) : undefined;
        const sleep_score = sleepQ * 10;
        const exertion_score = exertion * 20;
        const readiness_pct = calcReadiness(hrv_ms, resting_hr, sleep_score, exertion_score);
        await addReadinessLog(user.uid, {
            date: new Date().toISOString().split("T")[0],
            hrv_ms, resting_hr, sleep_score, exertion_score, readiness_pct,
        });
        setSaving(false);
        onRefresh();
    };

    const scoreColor = score >= 80 ? "#30D158" : score >= 60 ? "#FF9F0A" : "#FF453A";

    return (
        <div className="space-y-5">
            {/* Gauge + sub-scores */}
            <div className="card p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <ReadinessGauge score={score} />
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-1 gap-3 w-full">
                        {[
                            { label: "HRV", value: today?.hrv_ms ? `${today.hrv_ms}ms` : "—", icon: "💓", color: "#BF5AF2" },
                            { label: "Resting HR", value: today?.resting_hr ? `${today.resting_hr}bpm` : "—", icon: "❤️", color: "#FF453A" },
                            { label: "Sleep Score", value: today?.sleep_score ? `${today.sleep_score}/100` : "—", icon: "🌙", color: "#5AC8FA" },
                            { label: "Exertion", value: today?.exertion_score ? `${today.exertion_score}/100` : "—", icon: "⚡", color: "#FF9F0A" },
                        ].map(({ label, value, icon, color }) => (
                            <div key={label} className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-white/[0.04]">
                                <span>{icon}</span>
                                <div className="flex-1">
                                    <div className="text-xs text-zinc-500">{label}</div>
                                    <div className="text-sm font-bold stat-num" style={{ color }}>{value}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 14-day trend */}
            {trendData.length > 0 && (
                <div className="card p-4">
                    <h3 className="text-sm font-semibold text-zinc-300 mb-3">14-Day Readiness Trend</h3>
                    <ResponsiveContainer width="100%" height={120}>
                        <LineChart data={trendData}>
                            <XAxis dataKey="date" tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 100]} hide />
                            <Tooltip content={<GlassTooltip />} />
                            <ReferenceLine y={80} stroke="#30D158" strokeDasharray="3 3" strokeOpacity={0.3} />
                            <ReferenceLine y={60} stroke="#FF9F0A" strokeDasharray="3 3" strokeOpacity={0.3} />
                            <Line type="monotone" dataKey="score" stroke={scoreColor} strokeWidth={2.5} dot={false} name="Readiness" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Manual logger */}
            <div className="card p-5 space-y-4">
                <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2"><Plus className="w-4 h-4" /> Log Today's Readiness</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="label">HRV (ms)</label>
                        <input type="number" placeholder="e.g. 65" value={hrv} onChange={e => setHrv(e.target.value)} className="field" />
                    </div>
                    <div>
                        <label className="label">Resting HR (bpm)</label>
                        <input type="number" placeholder="e.g. 58" value={restHr} onChange={e => setRestHr(e.target.value)} className="field" />
                    </div>
                </div>
                {[
                    { label: `Sleep Quality: ${sleepQ}/10`, val: sleepQ, set: setSleepQ, max: 10, color: "#5AC8FA" },
                    { label: `Yesterday's Exertion: ${exertion}/10 (${exertion >= 8 ? "Intense" : exertion >= 5 ? "Moderate" : "Light"})`, val: exertion, set: setExertion, max: 10, color: "#FF9F0A" },
                ].map(({ label, val, set, max, color }) => (
                    <div key={label}>
                        <label className="label">{label}</label>
                        <input type="range" min={1} max={max} value={val} onChange={e => set(parseInt(e.target.value))}
                            className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ accentColor: color }} />
                    </div>
                ))}
                <button className="btn btn-primary w-full" onClick={handleLog} disabled={saving}>
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Log Readiness"}
                </button>
            </div>
        </div>
    );
}

// ── Training Tab ───────────────────────────────────────────────────────────────

function TrainingTab({ workouts, activities }: { workouts: WorkoutLog[]; activities: ActivityLog[] }) {
    // Volume by day
    const volumeByDay = workouts.reduce<Record<string, number>>((acc, w) => {
        const d = fmtDate(w.timestamp?.toDate?.() || new Date(), true);
        acc[d] = (acc[d] || 0) + (w.total_volume_kg || 0);
        return acc;
    }, {});
    const volumeData = Object.entries(volumeByDay).map(([date, vol]) => ({ date, vol: Math.round(vol) })).reverse();

    // Sets per muscle group
    const muscleData: Record<string, number> = {};
    workouts.forEach(w => w.exercises?.forEach(ex => {
        const mg = (ex as any).muscleGroup || "other";
        muscleData[mg] = (muscleData[mg] || 0) + (ex.sets?.length || 0);
    }));
    const muscleChartData = Object.entries(muscleData).map(([name, sets]) => ({ name, sets })).sort((a, b) => b.sets - a.sets);

    // HR zone stacked bar per cardio session
    const hrZoneData = activities.filter(a => a.hr_zones).map(a => ({
        name: fmtDate(a.timestamp?.toDate?.() || new Date(), true),
        Z1: a.hr_zones!.z1_min,
        Z2: a.hr_zones!.z2_min,
        Z3: a.hr_zones!.z3_min,
        Z4: a.hr_zones!.z4_min,
        Z5: a.hr_zones!.z5_min,
    })).reverse();

    const ZONE_COLORS = ["#30D158", "#0A84FF", "#FF9F0A", "#FF6B35", "#FF453A"];

    // Bubble chart data: each workout session
    const bubbleData = workouts.map(w => ({
        x: w.total_volume_kg || 0,
        y: w.duration_min || 0,
        z: w.exercises?.length || 1,
        name: w.name,
    }));

    return (
        <div className="space-y-5">
            {/* Volume over time */}
            <div className="card p-4">
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">Weight Lifted by Session (kg)</h3>
                {volumeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={volumeData}>
                            <XAxis dataKey="date" tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip content={<GlassTooltip />} />
                            <Bar dataKey="vol" fill="#0A84FF" radius={[4, 4, 0, 0]} name="Volume (kg)" maxBarSize={32} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : <EmptyState icon={<Dumbbell className="w-5 h-5 text-zinc-600" />} text="Complete workouts to see volume trends" />}
            </div>

            {/* Sets per muscle group */}
            <div className="card p-4">
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">Sets per Muscle Group</h3>
                {muscleChartData.length > 0 ? (
                    <div className="space-y-2">
                        {muscleChartData.slice(0, 8).map(({ name, sets }, i) => (
                            <div key={name} className="flex items-center gap-3">
                                <span className="text-xs text-zinc-500 w-20 capitalize shrink-0">{name.replace("_", " ")}</span>
                                <div className="flex-1 h-5 bg-white/[0.05] rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{ width: `${(sets / muscleChartData[0].sets) * 100}%`, background: `hsl(${210 + i * 20}, 80%, 60%)` }}
                                    />
                                </div>
                                <span className="text-xs stat-num text-white w-6 text-right">{sets}</span>
                            </div>
                        ))}
                    </div>
                ) : <EmptyState icon={<Dumbbell className="w-5 h-5 text-zinc-600" />} text="Log workouts with muscle groups to track here" />}
            </div>

            {/* HR Zone distribution */}
            {hrZoneData.length > 0 && (
                <div className="card p-4">
                    <h3 className="text-sm font-semibold text-zinc-300 mb-3">HR Zone Distribution — Cardio Sessions</h3>
                    <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={hrZoneData}>
                            <XAxis dataKey="name" tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip content={<GlassTooltip />} />
                            {["Z1", "Z2", "Z3", "Z4", "Z5"].map((z, i) => (
                                <Bar key={z} dataKey={z} stackId="a" fill={ZONE_COLORS[i]} name={`Zone ${i + 1}`} />
                            ))}
                            <Legend formatter={(v) => <span style={{ color: "#71717a", fontSize: 11 }}>{v}</span>} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Bubble chart */}
            {bubbleData.length > 1 && (
                <div className="card p-4">
                    <h3 className="text-sm font-semibold text-zinc-300 mb-1">Session Volume vs Duration</h3>
                    <p className="text-xs text-zinc-600 mb-3">Bubble size = exercises count</p>
                    <ResponsiveContainer width="100%" height={180}>
                        <ScatterChart>
                            <XAxis dataKey="x" name="Volume (kg)" tick={{ fill: "#52525b", fontSize: 10 }} label={{ value: "Volume kg", position: "insideBottom", offset: -2, fill: "#52525b", fontSize: 10 }} />
                            <YAxis dataKey="y" name="Duration (min)" tick={{ fill: "#52525b", fontSize: 10 }} />
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <Tooltip content={<GlassTooltip />} />
                            <Scatter data={bubbleData} fill="#0A84FF" fillOpacity={0.7} name="Session">
                                {bubbleData.map((d, i) => (
                                    <Cell key={i} fill="#0A84FF" opacity={0.6 + (d.z / 10) * 0.4} r={Math.max(4, d.z * 3)} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

// ── Nutrition Tab ──────────────────────────────────────────────────────────────

function NutritionTab({ nutrition }: { nutrition: NutritionLog[] }) {
    // Macro totals aggregated
    const macros = nutrition.reduce(
        (acc, n) => ({
            protein: acc.protein + (n.protein_g || 0),
            carbs: acc.carbs + (n.carbs_g || 0),
            fat: acc.fat + (n.fat_g || 0),
            calories: acc.calories + (n.calories || 0),
        }),
        { protein: 0, carbs: 0, fat: 0, calories: 0 }
    );
    const macroTotal = macros.protein + macros.carbs + macros.fat || 1;

    const radialData = [
        { name: "Protein", value: Math.round((macros.protein / macroTotal) * 100), fill: "#30D158" },
        { name: "Carbs", value: Math.round((macros.carbs / macroTotal) * 100), fill: "#0A84FF" },
        { name: "Fat", value: Math.round((macros.fat / macroTotal) * 100), fill: "#FF9F0A" },
    ];

    // Calories by day
    const calByDay = nutrition.reduce<Record<string, number>>((acc, n) => {
        const d = fmtDate(n.timestamp?.toDate?.() || new Date(), true);
        acc[d] = (acc[d] || 0) + (n.calories || 0);
        return acc;
    }, {});
    const calData = Object.entries(calByDay).map(([date, cal]) => ({ date, cal: Math.round(cal) })).reverse();

    // Top foods by calorie
    const foodMap: Record<string, number> = {};
    nutrition.forEach(n => { if (n.meal_name) foodMap[n.meal_name] = (foodMap[n.meal_name] || 0) + n.calories; });
    const topFoods = Object.entries(foodMap).map(([name, cal]) => ({ name: name.slice(0, 18), cal })).sort((a, b) => b.cal - a.cal).slice(0, 6);

    return (
        <div className="space-y-5">
            {nutrition.length === 0 ? (
                <EmptyState icon={<Leaf className="w-5 h-5 text-zinc-600" />} text="Log meals via Meal Snap to see nutrition analytics" />
            ) : (
                <>
                    {/* Macro radial */}
                    <div className="card p-5">
                        <h3 className="text-sm font-semibold text-zinc-300 mb-3">Macro Split (% of intake)</h3>
                        <div className="flex items-center gap-4">
                            <ResponsiveContainer width={140} height={140}>
                                <RadialBarChart innerRadius="40%" outerRadius="90%" data={radialData} startAngle={90} endAngle={-270}>
                                    <RadialBar dataKey="value" cornerRadius={4} background={{ fill: "rgba(255,255,255,0.04)" }} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                            <div className="space-y-2 flex-1">
                                {radialData.map(m => (
                                    <div key={m.name} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ background: m.fill }} />
                                        <span className="text-sm text-zinc-400">{m.name}</span>
                                        <span className="ml-auto text-sm font-bold stat-num" style={{ color: m.fill }}>{m.value}%</span>
                                    </div>
                                ))}
                                <div className="text-xs text-zinc-600 pt-2">{Math.round(macros.calories).toLocaleString()} kcal total</div>
                            </div>
                        </div>
                    </div>

                    {/* Daily calories */}
                    {calData.length > 1 && (
                        <div className="card p-4">
                            <h3 className="text-sm font-semibold text-zinc-300 mb-3">Daily Calorie Intake</h3>
                            <ResponsiveContainer width="100%" height={140}>
                                <BarChart data={calData}>
                                    <XAxis dataKey="date" tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Tooltip content={<GlassTooltip />} />
                                    <ReferenceLine y={2200} stroke="#FF9F0A" strokeDasharray="4 4" strokeOpacity={0.4} />
                                    <Bar dataKey="cal" fill="#30D158" radius={[4, 4, 0, 0]} name="Calories" maxBarSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Top foods */}
                    {topFoods.length > 0 && (
                        <div className="card p-4">
                            <h3 className="text-sm font-semibold text-zinc-300 mb-3">Top Foods by Calories</h3>
                            <div className="space-y-2">
                                {topFoods.map(({ name, cal }, i) => (
                                    <div key={name} className="flex items-center gap-3">
                                        <span className="text-xs text-zinc-600 w-4">{i + 1}</span>
                                        <span className="text-xs text-zinc-400 flex-1 truncate">{name}</span>
                                        <span className="text-xs stat-num text-[#30D158] font-semibold">{Math.round(cal)} kcal</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ── Sleep Tab ──────────────────────────────────────────────────────────────────

function SleepTab({ sleepLogs }: { sleepLogs: SleepLog[] }) {
    const chartData = sleepLogs.slice(0, 14).reverse().map(s => ({
        date: fmtDate(s.sleep_start?.toDate?.() || new Date(), true),
        hours: parseFloat(s.duration_hours?.toFixed(1) || "0"),
        quality: s.quality_score || 0,
    }));

    const avgSleep = chartData.length ? (chartData.reduce((a, b) => a + b.hours, 0) / chartData.length).toFixed(1) : "—";

    return (
        <div className="space-y-5">
            {sleepLogs.length === 0 ? (
                <EmptyState icon={<Moon className="w-5 h-5 text-zinc-600" />} text="Log sleep via the Sleep Logger to see analytics" />
            ) : (
                <>
                    {/* Average stat pills */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: "Avg Duration", value: `${avgSleep}h`, color: "#5AC8FA" },
                            { label: "Avg Quality", value: chartData.length ? `${(chartData.reduce((a, b) => a + b.quality, 0) / chartData.length).toFixed(1)}/10` : "—", color: "#BF5AF2" },
                        ].map(({ label, value, color }) => (
                            <div key={label} className="card p-4 text-center">
                                <div className="text-2xl font-bold stat-num" style={{ color }}>{value}</div>
                                <div className="text-xs text-zinc-500 mt-1">{label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Duration chart */}
                    <div className="card p-4">
                        <h3 className="text-sm font-semibold text-zinc-300 mb-3">Sleep Duration (hours)</h3>
                        <ResponsiveContainer width="100%" height={150}>
                            <BarChart data={chartData}>
                                <XAxis dataKey="date" tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 12]} hide />
                                <Tooltip content={<GlassTooltip />} />
                                <ReferenceLine y={8} stroke="#5AC8FA" strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: "Goal 8h", position: "right", fill: "#5AC8FA", fontSize: 10 }} />
                                <Bar dataKey="hours" fill="#5AC8FA" radius={[4, 4, 0, 0]} name="Sleep (h)" maxBarSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Quality trend */}
                    <div className="card p-4">
                        <h3 className="text-sm font-semibold text-zinc-300 mb-3">Sleep Quality Trend</h3>
                        <ResponsiveContainer width="100%" height={110}>
                            <LineChart data={chartData}>
                                <XAxis dataKey="date" tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 10]} hide />
                                <Tooltip content={<GlassTooltip />} />
                                <ReferenceLine y={7} stroke="#BF5AF2" strokeDasharray="3 3" strokeOpacity={0.3} />
                                <Line type="monotone" dataKey="quality" stroke="#BF5AF2" strokeWidth={2} dot={false} name="Quality" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}
        </div>
    );
}

// ── Correlations Tab ───────────────────────────────────────────────────────────

function CorrelationsTab({
    workouts, activities, nutrition, sleep, readiness,
}: {
    workouts: WorkoutLog[];
    activities: ActivityLog[];
    nutrition: NutritionLog[];
    sleep: SleepLog[];
    readiness: ReadinessLog[];
}) {
    // Build daily data aligned by date string
    const dateMap: Record<string, {
        volume?: number; cardio_min?: number; calories?: number;
        sleep_h?: number; hrv?: number; readiness?: number; resting_hr?: number;
    }> = {};

    workouts.forEach(w => {
        const d = w.timestamp?.toDate?.()?.toISOString().split("T")[0] || "";
        if (!dateMap[d]) dateMap[d] = {};
        dateMap[d].volume = (dateMap[d].volume || 0) + (w.total_volume_kg || 0);
    });

    activities.forEach(a => {
        const d = a.timestamp?.toDate?.()?.toISOString().split("T")[0] || "";
        if (!dateMap[d]) dateMap[d] = {};
        dateMap[d].cardio_min = (dateMap[d].cardio_min || 0) + a.duration_min;
    });

    nutrition.forEach(n => {
        const d = n.timestamp?.toDate?.()?.toISOString().split("T")[0] || "";
        if (!dateMap[d]) dateMap[d] = {};
        dateMap[d].calories = (dateMap[d].calories || 0) + n.calories;
    });

    sleep.forEach(s => {
        const d = s.sleep_start?.toDate?.()?.toISOString().split("T")[0] || "";
        if (!dateMap[d]) dateMap[d] = {};
        dateMap[d].sleep_h = s.duration_hours;
    });

    readiness.forEach(r => {
        const d = r.timestamp?.toDate?.()?.toISOString().split("T")[0] || "";
        if (!dateMap[d]) dateMap[d] = {};
        dateMap[d].hrv = r.hrv_ms;
        dateMap[d].readiness = r.readiness_pct;
        dateMap[d].resting_hr = r.resting_hr;
    });

    const rows = Object.values(dateMap);
    const metrics = [
        { key: "volume", label: "Volume" },
        { key: "cardio_min", label: "Cardio" },
        { key: "calories", label: "Calories" },
        { key: "sleep_h", label: "Sleep" },
        { key: "hrv", label: "HRV" },
        { key: "readiness", label: "Readiness" },
        { key: "resting_hr", label: "Resting HR" },
    ] as const;

    const matrix = metrics.map(a =>
        metrics.map(b => {
            const as = rows.map(r => (r as any)[a.key]).filter(v => v !== undefined) as number[];
            const bs = rows.map(r => (r as any)[b.key]).filter(v => v !== undefined) as number[];
            if (a.key === b.key) return 1;
            return pearson(as, bs);
        })
    );

    const corrColor = (v: number) => {
        if (v === 1) return "#1C1C1E";
        if (v > 0.5) return `rgba(48,209,88,${Math.abs(v) * 0.85})`;
        if (v < -0.5) return `rgba(255,69,58,${Math.abs(v) * 0.85})`;
        return "rgba(255,255,255,0.06)";
    };

    const hasData = rows.length >= 3;

    return (
        <div className="space-y-5">
            <div className="card p-4">
                <h3 className="text-sm font-semibold text-zinc-300 mb-1">Correlation Matrix</h3>
                <p className="text-xs text-zinc-600 mb-4">Green = positive correlation · Red = negative · Gray = no data</p>
                {!hasData ? (
                    <EmptyState icon={<BarChart3 className="w-5 h-5 text-zinc-600" />} text="Need at least 3 days of diverse data for correlations" />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="text-center w-full min-w-[400px]" style={{ borderSpacing: 3, borderCollapse: "separate" }}>
                            <thead>
                                <tr>
                                    <td className="w-16" />
                                    {metrics.map(m => (
                                        <td key={m.key} className="text-[9px] text-zinc-500 pb-2 font-medium">{m.label}</td>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {matrix.map((row, ri) => (
                                    <tr key={ri}>
                                        <td className="text-[9px] text-zinc-500 pr-2 text-right font-medium">{metrics[ri].label}</td>
                                        {row.map((val, ci) => (
                                            <td key={ci} className="text-[9px] font-bold stat-num rounded-lg"
                                                style={{ background: corrColor(val), padding: "6px 4px", color: Math.abs(val) > 0.4 ? "white" : "rgba(255,255,255,0.4)" }}
                                            >
                                                {ri === ci ? "—" : val.toFixed(1)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main AnalyticsHub ──────────────────────────────────────────────────────────

const TABS: { id: AnalyticsTab; label: string; icon: React.ReactNode }[] = [
    { id: "readiness", label: "Readiness", icon: <Brain className="w-4 h-4" /> },
    { id: "training", label: "Training", icon: <Dumbbell className="w-4 h-4" /> },
    { id: "nutrition", label: "Nutrition", icon: <Leaf className="w-4 h-4" /> },
    { id: "sleep", label: "Sleep", icon: <Moon className="w-4 h-4" /> },
    { id: "correlations", label: "Correlate", icon: <BarChart3 className="w-4 h-4" /> },
];

const TIME_RANGES: { id: TimeRange; label: string }[] = [
    { id: "7d", label: "7D" },
    { id: "30d", label: "30D" },
    { id: "90d", label: "90D" },
    { id: "1y", label: "1Y" },
    { id: "all", label: "All" },
];

export default function AnalyticsHub() {
    const { user } = useAuth();
    const [tab, setTab] = useState<AnalyticsTab>("readiness");
    const [timeRange, setTimeRange] = useState<TimeRange>("30d");
    const [loading, setLoading] = useState(true);

    const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [nutrition, setNutrition] = useState<NutritionLog[]>([]);
    const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
    const [readinessLogs, setReadinessLogs] = useState<ReadinessLog[]>([]);

    const fetchAll = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const days = daysForRange(timeRange);
        const [w, a, n, s, r] = await Promise.all([
            getWorkoutLogs(user.uid, days),
            getActivityLogs(user.uid, days),
            getNutritionLogs(user.uid, days),
            getSleepLogs(user.uid, days),
            getReadinessLogs(user.uid, days),
        ]);
        setWorkouts(w); setActivities(a); setNutrition(n); setSleepLogs(s); setReadinessLogs(r);
        setLoading(false);
    }, [user, timeRange]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    return (
        <div className="space-y-5 pb-32">
            {/* Header */}
            <div className="flex items-center justify-between px-1 pt-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">Analytics</h1>
                <div className="flex gap-1">
                    {TIME_RANGES.map(({ id, label }) => (
                        <button
                            key={id}
                            onClick={() => setTimeRange(id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border"
                            style={timeRange === id
                                ? { background: "#0A84FF20", borderColor: "#0A84FF50", color: "#0A84FF" }
                                : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)", color: "#52525b" }
                            }
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab strip */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
                {TABS.map(({ id, label, icon }) => (
                    <button
                        key={id}
                        onClick={() => setTab(id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border whitespace-nowrap text-xs font-semibold shrink-0 transition-all duration-200"
                        style={tab === id
                            ? { background: "#0A84FF18", borderColor: "#0A84FF45", color: "#0A84FF" }
                            : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)", color: "#52525b" }
                        }
                    >
                        {icon}{label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 text-[#0A84FF] animate-spin" />
                </div>
            ) : (
                <>
                    {tab === "readiness" && <ReadinessTab readinessLogs={readinessLogs} onRefresh={fetchAll} />}
                    {tab === "training" && <TrainingTab workouts={workouts} activities={activities} />}
                    {tab === "nutrition" && <NutritionTab nutrition={nutrition} />}
                    {tab === "sleep" && <SleepTab sleepLogs={sleepLogs} />}
                    {tab === "correlations" && (
                        <CorrelationsTab workouts={workouts} activities={activities} nutrition={nutrition} sleep={sleepLogs} readiness={readinessLogs} />
                    )}
                </>
            )}
        </div>
    );
}
