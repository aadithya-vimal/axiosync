"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { addActivityLog, getRecentActivities, ActivityLog, ActivityType } from "@/lib/firestore";
import { format } from "date-fns";
import { Heart, Plus, X } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const ACTIVITY_CONFIG: Record<ActivityType, { label: string; emoji: string; color: string; hasDistance: boolean; hasElevation: boolean }> = {
    run: { label: "Run", emoji: "🏃", color: "#0A84FF", hasDistance: true, hasElevation: false },
    walk: { label: "Walk", emoji: "🚶", color: "#30D158", hasDistance: true, hasElevation: false },
    cycle: { label: "Cycle", emoji: "🚴", color: "#FF9F0A", hasDistance: true, hasElevation: false },
    swim: { label: "Swim", emoji: "🏊", color: "#5AC8FA", hasDistance: true, hasElevation: false },
    trek: { label: "Trek", emoji: "🥾", color: "#BF5AF2", hasDistance: true, hasElevation: true },
    hike: { label: "Hike", emoji: "🏔️", color: "#A78BFA", hasDistance: true, hasElevation: true },
    climb: { label: "Climb", emoji: "🧗", color: "#FF9F0A", hasDistance: false, hasElevation: true },
    hiit: { label: "HIIT", emoji: "🔥", color: "#FF453A", hasDistance: false, hasElevation: false },
    rowing: { label: "Row", emoji: "🛶", color: "#5AC8FA", hasDistance: true, hasElevation: false },
    skiing: { label: "Ski", emoji: "⛷️", color: "#E0F2FE", hasDistance: true, hasElevation: true },
    yoga: { label: "Yoga", emoji: "🧘", color: "#BF5AF2", hasDistance: false, hasElevation: false },
    other: { label: "Other", emoji: "⚡", color: "#52525b", hasDistance: false, hasElevation: false },
};

export default function ActivityLogger() {
    const { user } = useAuth();
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [logging, setLogging] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [form, setForm] = useState({
        type: "run" as ActivityType,
        duration_min: 30,
        distance_km: 5,
        avg_hr: 0,
        calories_burned: 0,
        elevation_m: 0,
        notes: "",
    });

    useEffect(() => {
        if (!user) return;
        getRecentActivities(user.uid, 20).then(setActivities);
    }, [user, saved]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        const cfg = ACTIVITY_CONFIG[form.type];
        const payload: Omit<ActivityLog, "id" | "uid" | "timestamp"> = {
            type: form.type,
            name: cfg.label,
            duration_min: form.duration_min,
            ...(cfg.hasDistance && form.distance_km > 0 && { distance_km: form.distance_km }),
            ...(form.avg_hr > 0 && { avg_hr: form.avg_hr }),
            ...(form.calories_burned > 0 && { calories_burned: form.calories_burned }),
            ...(cfg.hasElevation && form.elevation_m > 0 && { elevation_m: form.elevation_m }),
            ...(form.notes && { notes: form.notes }),
        };
        await addActivityLog(user.uid, payload);
        setSaving(false);
        setSaved((p) => !p);
        setLogging(false);
        setForm({ type: "run", duration_min: 30, distance_km: 5, avg_hr: 0, calories_burned: 0, elevation_m: 0, notes: "" });
    };

    const cfg = ACTIVITY_CONFIG[form.type];

    const totalActivities = activities.length;
    const totalMins = activities.reduce((a, b) => a + b.duration_min, 0);
    const totalCals = activities.reduce((a, b) => a + (b.calories_burned || 0), 0);
    const totalKm = activities.reduce((a, b) => a + (b.distance_km || 0), 0);

    const typeCounts: Record<string, number> = {};
    activities.forEach((a) => { typeCounts[a.type] = (typeCounts[a.type] || 0) + 1; });
    const donutData = Object.entries(typeCounts).map(([type, count]) => ({
        name: ACTIVITY_CONFIG[type as ActivityType]?.label || type,
        value: count,
        color: ACTIVITY_CONFIG[type as ActivityType]?.color || "#52525b",
    }));

    return (
        <div className="space-y-5">
            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-3">
                {[
                    { label: "Activities", value: totalActivities.toString() },
                    { label: "Hours Active", value: (totalMins / 60).toFixed(1) },
                    { label: "Km Covered", value: totalKm.toFixed(1) },
                    { label: "Kcal Burned", value: totalCals.toLocaleString() },
                ].map(({ label, value }) => (
                    <div key={label} className="card p-4">
                        <div className="label mb-1">{label}</div>
                        <div className="text-xl font-bold text-white stat-num">{value}</div>
                    </div>
                ))}
            </div>

            {/* Donut chart */}
            {donutData.length > 0 && (
                <div className="card p-4">
                    <div className="label mb-3">Activity Breakdown</div>
                    <ResponsiveContainer width="100%" height={140}>
                        <PieChart>
                            <Pie data={donutData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                                {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                            </Pie>
                            <Tooltip
                                contentStyle={{ background: "rgba(28,28,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "4px 10px", fontSize: 12, backdropFilter: "blur(12px)" }}
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                formatter={((v: number, name: string) => [v, name]) as any}
                            />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#71717a" }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Log activity */}
            {!logging ? (
                <button onClick={() => setLogging(true)} className="btn btn-primary w-full">
                    <Plus className="w-4 h-4" /> Log Activity
                </button>
            ) : (
                <div className="card p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white">Log Activity</h3>
                        <button onClick={() => setLogging(false)} className="text-zinc-500 hover:text-white transition-colors p-1">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Activity type grid */}
                    <div className="grid grid-cols-4 gap-2">
                        {(Object.keys(ACTIVITY_CONFIG) as ActivityType[]).map((type) => {
                            const c = ACTIVITY_CONFIG[type];
                            const isSelected = form.type === type;
                            return (
                                <button
                                    key={type}
                                    onClick={() => setForm((f) => ({ ...f, type }))}
                                    className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl border transition-all duration-200 text-xs active:scale-[0.96]
                                    ${isSelected
                                            ? "border-[#0A84FF]/50 bg-[#0A84FF]/12 text-white"
                                            : "border-white/[0.07] bg-transparent text-zinc-500 hover:text-white hover:border-white/15 hover:bg-white/[0.04]"
                                        }`}
                                >
                                    <span className="text-lg">{c.emoji}</span>
                                    <span className="font-medium">{c.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Duration (min)</label>
                            <input type="number" value={form.duration_min} onChange={(e) => setForm((f) => ({ ...f, duration_min: parseInt(e.target.value) || 0 }))} className="field" />
                        </div>
                        {cfg.hasDistance && (
                            <div>
                                <label className="label">Distance (km)</label>
                                <input type="number" step="0.1" value={form.distance_km} onChange={(e) => setForm((f) => ({ ...f, distance_km: parseFloat(e.target.value) || 0 }))} className="field" />
                            </div>
                        )}
                        <div>
                            <label className="label">Avg Heart Rate</label>
                            <input type="number" value={form.avg_hr || ""} placeholder="Optional" onChange={(e) => setForm((f) => ({ ...f, avg_hr: parseInt(e.target.value) || 0 }))} className="field" />
                        </div>
                        <div>
                            <label className="label">Calories Burned</label>
                            <input type="number" value={form.calories_burned || ""} placeholder="Optional" onChange={(e) => setForm((f) => ({ ...f, calories_burned: parseInt(e.target.value) || 0 }))} className="field" />
                        </div>
                        {cfg.hasElevation && (
                            <div>
                                <label className="label">Elevation (m)</label>
                                <input type="number" value={form.elevation_m || ""} placeholder="Optional" onChange={(e) => setForm((f) => ({ ...f, elevation_m: parseInt(e.target.value) || 0 }))} className="field" />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="label">Notes</label>
                        <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="field" placeholder="How did it feel?" />
                    </div>

                    <button onClick={handleSave} disabled={saving} className="btn btn-success w-full">
                        {saving ? "Saving…" : `Log ${cfg.label} ${cfg.emoji}`}
                    </button>
                </div>
            )}

            {/* Activity history */}
            {activities.length > 0 && (
                <div className="space-y-2">
                    <span className="label">History</span>
                    {activities.slice(0, 8).map((a) => {
                        const c = ACTIVITY_CONFIG[a.type];
                        return (
                            <div key={a.id} className="card p-3 flex items-center gap-3 hover:bg-white/[0.07] transition-all duration-200">
                                <div
                                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
                                    style={{ background: `${c.color}18` }}
                                >
                                    {c.emoji}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-white">{c.label}</div>
                                    <div className="text-xs text-zinc-500 truncate">
                                        {format(a.timestamp.toDate(), "MMM d")} ·{" "}
                                        {a.duration_min}min
                                        {a.distance_km ? ` · ${a.distance_km}km` : ""}
                                        {a.calories_burned ? ` · ${a.calories_burned}kcal` : ""}
                                    </div>
                                </div>
                                {a.avg_hr && (
                                    <div className="flex items-center gap-1 text-xs text-[#FF453A] stat-num flex-shrink-0">
                                        <Heart className="w-3 h-3" fill="currentColor" /> {a.avg_hr}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {activities.length === 0 && !logging && (
                <div className="text-center py-10 text-zinc-600 text-sm">
                    No activities logged yet. Get moving! 🏃
                </div>
            )}
        </div>
    );
}
