"use client";

import { useState, useEffect, useCallback } from "react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    RadialBarChart, RadialBar, LineChart, Line, ReferenceLine,
    ScatterChart, Scatter, Cell, CartesianGrid
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import {
    getWorkoutLogs, getNutritionLogs, getReadinessLogs, addReadinessLog, calcReadiness,
    type WorkoutLog, type NutritionLog, type ReadinessLog,
} from "@/lib/firestore";
import { Brain, Dumbbell, Leaf, Loader2, Plus } from "lucide-react";

type AnalyticsTab = "readiness" | "training" | "nutrition";
type TimeRange = "7d" | "30d" | "90d" | "1y" | "all";

function daysForRange(range: TimeRange): number {
    return { "7d": 7, "30d": 30, "90d": 90, "1y": 365, "all": 3650 }[range];
}

function fmtDate(d: Date, short = false): string {
    return d.toLocaleDateString("en-US", short
        ? { month: "short", day: "numeric" }
        : { month: "short", day: "numeric", year: "2-digit" }
    );
}

function ReadinessGauge({ score }: { score: number }) {
    const color = score >= 80 ? "#30D158" : score >= 60 ? "#FF9F0A" : "#FF453A";
    const r = 56;
    const circ = 2 * Math.PI * r;
    const progress = (score / 100) * circ * 0.75;

    return (
        <div className="relative flex items-center justify-center" style={{ width: 152, height: 152 }}>
            <svg width="152" height="152" viewBox="0 0 152 152">
                <circle cx="76" cy="76" r={r} fill="none" stroke="var(--border-subtle)"
                    strokeWidth="10" strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
                    strokeLinecap="round" transform="rotate(135 76 76)"
                />
                <circle cx="76" cy="76" r={r} fill="none" stroke={color}
                    strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${progress} ${circ - progress}`}
                    style={{ filter: `drop-shadow(0 0 6px ${color}60)`, transition: "stroke-dasharray 0.8s ease" }}
                    transform="rotate(135 76 76)"
                />
            </svg>
            <div className="absolute text-center">
                <div className="text-4xl font-bold stat-num" style={{ color }}>{score}</div>
                <div className="text-xs text-[var(--text-muted)] font-medium">Readiness</div>
            </div>
        </div>
    );
}

const GlassTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="card px-3 py-2 text-xs space-y-1 shadow-xl bg-[var(--bg-elevated)] border border-[var(--border-strong)]" style={{ minWidth: 100 }}>
            {label && <div className="text-[var(--text-muted)] font-medium mb-1">{label}</div>}
            {payload.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
                    <span className="text-[var(--text-muted)]">{p.name}:</span>
                    <span className="text-[var(--text-primary)] font-semibold stat-num">{typeof p.value === "number" ? p.value.toFixed(1) : p.value}</span>
                </div>
            ))}
        </div>
    );
};

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)]">{icon}</div>
            <p className="text-[var(--text-muted)] text-sm">{text}</p>
        </div>
    );
}

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
                            <div key={label} className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-[var(--border-subtle)]">
                                <span>{icon}</span>
                                <div className="flex-1">
                                    <div className="text-xs text-[var(--text-muted)]">{label}</div>
                                    <div className="text-sm font-bold stat-num" style={{ color }}>{value}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {trendData.length > 0 && (
                <div className="card p-4">
                    <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">14-Day Readiness Trend</h3>
                    <ResponsiveContainer width="100%" height={120}>
                        <LineChart data={trendData}>
                            <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 100]} hide />
                            <Tooltip content={<GlassTooltip />} />
                            <ReferenceLine y={80} stroke="#30D158" strokeDasharray="3 3" strokeOpacity={0.3} />
                            <ReferenceLine y={60} stroke="#FF9F0A" strokeDasharray="3 3" strokeOpacity={0.3} />
                            <Line type="monotone" dataKey="score" stroke={scoreColor} strokeWidth={2.5} dot={false} name="Readiness" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            <div className="card p-5 space-y-4">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] flex items-center gap-2"><Plus className="w-4 h-4" /> Log Today's Readiness</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="label">HRV (ms)</label>
                        <input type="number" placeholder="e.g. 65" value={hrv} onChange={e => setHrv(e.target.value)} className="field bg-[var(--bg-elevated)]" />
                    </div>
                    <div>
                        <label className="label">Resting HR (bpm)</label>
                        <input type="number" placeholder="e.g. 58" value={restHr} onChange={e => setRestHr(e.target.value)} className="field bg-[var(--bg-elevated)]" />
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

function TrainingTab({ workouts }: { workouts: WorkoutLog[]; }) {
    const volumeByDay = workouts.reduce<Record<string, number>>((acc, w) => {
        const d = fmtDate(w.timestamp?.toDate?.() || new Date(), true);
        acc[d] = (acc[d] || 0) + (w.total_volume_kg || 0);
        return acc;
    }, {});
    const volumeData = Object.entries(volumeByDay).map(([date, vol]) => ({ date, vol: Math.round(vol) })).reverse();

    const muscleData: Record<string, number> = {};
    workouts.forEach(w => w.exercises?.forEach(ex => {
        const mg = (ex as any).muscleGroup || "other";
        muscleData[mg] = (muscleData[mg] || 0) + (ex.sets?.length || 0);
    }));
    const muscleChartData = Object.entries(muscleData).map(([name, sets]) => ({ name, sets })).sort((a, b) => b.sets - a.sets);

    const bubbleData = workouts.map(w => ({
        x: w.total_volume_kg || 0,
        y: w.duration_min || 0,
        z: w.exercises?.length || 1,
        name: w.name,
    }));

    return (
        <div className="space-y-5">
            <div className="card p-4">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Force Projection (kg)</h3>
                {volumeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={volumeData}>
                            <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip content={<GlassTooltip />} />
                            <Bar dataKey="vol" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Volume (kg)" maxBarSize={32} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : <EmptyState icon={<Dumbbell className="w-5 h-5" />} text="Complete workouts to see volume trends" />}
            </div>

            <div className="card p-4">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Sets per Muscle Group</h3>
                {muscleChartData.length > 0 ? (
                    <div className="space-y-2">
                        {muscleChartData.slice(0, 8).map(({ name, sets }, i) => (
                            <div key={name} className="flex items-center gap-3">
                                <span className="text-xs text-[var(--text-muted)] w-20 capitalize shrink-0">{name.replace("_", " ")}</span>
                                <div className="flex-1 h-5 bg-[var(--border-subtle)] rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{ width: `${(sets / muscleChartData[0].sets) * 100}%`, background: `hsl(${210 + i * 20}, 80%, 60%)` }}
                                    />
                                </div>
                                <span className="text-xs stat-num text-[var(--text-primary)] w-6 text-right">{sets}</span>
                            </div>
                        ))}
                    </div>
                ) : <EmptyState icon={<Dumbbell className="w-5 h-5" />} text="Log workouts with muscle groups to track here" />}
            </div>

            {bubbleData.length > 1 && (
                <div className="card p-4">
                    <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-1">Session Volume vs Duration</h3>
                    <p className="text-xs text-[var(--text-muted)] mb-3">Bubble size = exercises count</p>
                    <ResponsiveContainer width="100%" height={180}>
                        <ScatterChart>
                            <XAxis dataKey="x" name="Volume (kg)" tick={{ fill: "var(--text-muted)", fontSize: 10 }} label={{ value: "Volume kg", position: "insideBottom", offset: -2, fill: "var(--text-muted)", fontSize: 10 }} />
                            <YAxis dataKey="y" name="Duration (min)" tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                            <Tooltip content={<GlassTooltip />} />
                            <Scatter data={bubbleData} fill="#3B82F6" fillOpacity={0.7} name="Session">
                                {bubbleData.map((d, i) => (
                                    <Cell key={i} fill="#3B82F6" opacity={0.6 + (d.z / 10) * 0.4} r={Math.max(4, d.z * 3)} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

function NutritionTab({ nutrition }: { nutrition: NutritionLog[] }) {
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
        { name: "Carbs", value: Math.round((macros.carbs / macroTotal) * 100), fill: "#3B82F6" },
        { name: "Fat", value: Math.round((macros.fat / macroTotal) * 100), fill: "#FF9F0A" },
    ];

    const calByDay = nutrition.reduce<Record<string, number>>((acc, n) => {
        const d = fmtDate(n.timestamp?.toDate?.() || new Date(), true);
        acc[d] = (acc[d] || 0) + (n.calories || 0);
        return acc;
    }, {});
    const calData = Object.entries(calByDay).map(([date, cal]) => ({ date, cal: Math.round(cal) })).reverse();

    const foodMap: Record<string, number> = {};
    nutrition.forEach(n => { if (n.meal_name) foodMap[n.meal_name] = (foodMap[n.meal_name] || 0) + n.calories; });
    const topFoods = Object.entries(foodMap).map(([name, cal]) => ({ name: name.slice(0, 18), cal })).sort((a, b) => b.cal - a.cal).slice(0, 6);

    return (
        <div className="space-y-5">
            {nutrition.length === 0 ? (
                <EmptyState icon={<Leaf className="w-5 h-5" />} text="Log meals via Meal Snap to see nutrition analytics" />
            ) : (
                <>
                    <div className="card p-5">
                        <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Nutrient Logistics Split (% of intake)</h3>
                        <div className="flex items-center gap-4">
                            <ResponsiveContainer width={140} height={140}>
                                <RadialBarChart innerRadius="40%" outerRadius="90%" data={radialData} startAngle={90} endAngle={-270}>
                                    <RadialBar dataKey="value" cornerRadius={4} background={{ fill: "var(--border-subtle)" }} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                            <div className="space-y-2 flex-1">
                                {radialData.map(m => (
                                    <div key={m.name} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ background: m.fill }} />
                                        <span className="text-sm text-[var(--text-muted)]">{m.name}</span>
                                        <span className="ml-auto text-sm font-bold stat-num" style={{ color: m.fill }}>{m.value}%</span>
                                    </div>
                                ))}
                                <div className="text-xs text-[var(--text-muted)] pt-2">{Math.round(macros.calories).toLocaleString()} kcal total</div>
                            </div>
                        </div>
                    </div>

                    {calData.length > 1 && (
                        <div className="card p-4">
                            <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Daily Calorie Intake</h3>
                            <ResponsiveContainer width="100%" height={140}>
                                <BarChart data={calData}>
                                    <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Tooltip content={<GlassTooltip />} />
                                    <ReferenceLine y={2200} stroke="#FF9F0A" strokeDasharray="4 4" strokeOpacity={0.4} />
                                    <Bar dataKey="cal" fill="#30D158" radius={[4, 4, 0, 0]} name="Calories" maxBarSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {topFoods.length > 0 && (
                        <div className="card p-4">
                            <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Top Foods by Calories</h3>
                            <div className="space-y-2">
                                {topFoods.map(({ name, cal }, i) => (
                                    <div key={name} className="flex items-center gap-3">
                                        <span className="text-xs text-[var(--text-muted)] w-4">{i + 1}</span>
                                        <span className="text-xs text-[var(--text-secondary)] flex-1 truncate">{name}</span>
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

const TABS: { id: AnalyticsTab; label: string; icon: React.ReactNode }[] = [
    { id: "readiness", label: "Health Readiness", icon: <Brain className="w-4 h-4" /> },
    { id: "training", label: "Operational Force", icon: <Dumbbell className="w-4 h-4" /> },
    { id: "nutrition", label: "Sustainment", icon: <Leaf className="w-4 h-4" /> },
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
    const [nutrition, setNutrition] = useState<NutritionLog[]>([]);
    const [readinessLogs, setReadinessLogs] = useState<ReadinessLog[]>([]);

    const fetchAll = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const days = daysForRange(timeRange);
        const [w, n, r] = await Promise.all([
            getWorkoutLogs(user.uid, days),
            getNutritionLogs(user.uid, days),
            getReadinessLogs(user.uid, days),
        ]);
        setWorkouts(w); setNutrition(n); setReadinessLogs(r);
        setLoading(false);
    }, [user, timeRange]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    return (
        <div className="space-y-5 pb-32">
            <div className="flex items-center justify-between px-1 pt-2">
                <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Briefing</h1>
                <div className="flex gap-1">
                    {TIME_RANGES.map(({ id, label }) => (
                        <button
                            key={id}
                            onClick={() => setTimeRange(id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border"
                            style={timeRange === id
                                ? { background: "var(--accent-blue)", borderColor: "var(--accent-blue)", color: "white" }
                                : { background: "var(--bg-elevated)", borderColor: "var(--border-subtle)", color: "var(--text-muted)" }
                            }
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
                {TABS.map(({ id, label, icon }) => (
                    <button
                        key={id}
                        onClick={() => setTab(id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border whitespace-nowrap text-xs font-semibold shrink-0 transition-all duration-200"
                        style={tab === id
                            ? { background: "rgba(59,130,246,0.1)", borderColor: "rgba(59,130,246,0.2)", color: "#3B82F6" }
                            : { background: "var(--bg-elevated)", borderColor: "var(--border-subtle)", color: "var(--text-muted)" }
                        }
                    >
                        {icon}{label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 text-[#3B82F6] animate-spin" />
                </div>
            ) : (
                <>
                    {tab === "readiness" && <ReadinessTab readinessLogs={readinessLogs} onRefresh={fetchAll} />}
                    {tab === "training" && <TrainingTab workouts={workouts} />}
                    {tab === "nutrition" && <NutritionTab nutrition={nutrition} />}
                </>
            )}
        </div>
    );
}
