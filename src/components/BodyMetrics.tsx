"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { addBodyMetric, getBodyMetrics, BodyMetric, getRecentActivities, getRecentWorkouts } from "@/lib/firestore";
import { format, startOfWeek, addDays, isSameDay, subDays } from "date-fns";
import { Flame, Clock, Award, Edit2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

export default function BodyMetrics() {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState<BodyMetric[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [workouts, setWorkouts] = useState<any[]>([]);

    const [loggingWeight, setLoggingWeight] = useState(false);
    const [weight, setWeight] = useState(70);
    const [height, setHeight] = useState(170);

    useEffect(() => {
        if (!user) return;
        getBodyMetrics(user.uid, 30).then((data) => {
            setMetrics(data.reverse());
            if (data.length > 0) {
                setWeight(data[data.length - 1].weight_kg);
                setHeight(data[data.length - 1].height_cm);
            }
        });
        getRecentActivities(user.uid, 50).then(setActivities);
        getRecentWorkouts(user.uid, 50).then(setWorkouts);
    }, [user, loggingWeight]);

    const handleSaveMetric = async () => {
        if (!user) return;
        await addBodyMetric(user.uid, weight, height);
        setLoggingWeight(false);
    };

    const stats = useMemo(() => {
        const today = new Date();
        const todaysWorkouts = workouts.filter(w => isSameDay(w.timestamp.toDate(), today));
        const todaysActivities = activities.filter(a => isSameDay(a.timestamp.toDate(), today));
        let kcal = 0, mins = 0;
        todaysWorkouts.forEach(w => { mins += w.duration_min; kcal += (w.duration_min * 6); });
        todaysActivities.forEach(a => { mins += a.duration_min; kcal += (a.calories_burned || 0); });
        return { workoutCount: todaysWorkouts.length + todaysActivities.length, kcal: Math.round(kcal), mins };
    }, [workouts, activities]);

    const streakInfo = useMemo(() => {
        const today = new Date();
        const activeDates = new Set([
            ...workouts.map(w => format(w.timestamp.toDate(), "yyyy-MM-dd")),
            ...activities.map(a => format(a.timestamp.toDate(), "yyyy-MM-dd"))
        ]);
        let streak = 0;
        let currTarget = today;
        if (activeDates.has(format(currTarget, "yyyy-MM-dd"))) {
            streak++;
            currTarget = subDays(currTarget, 1);
        } else {
            currTarget = subDays(currTarget, 1);
            if (activeDates.has(format(currTarget, "yyyy-MM-dd"))) {
                streak++;
                currTarget = subDays(currTarget, 1);
            }
        }
        while (activeDates.has(format(currTarget, "yyyy-MM-dd")) && streak > 0) {
            streak++;
            currTarget = subDays(currTarget, 1);
        }
        const weekStart = startOfWeek(today, { weekStartsOn: 0 });
        const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
        return { streak, weekDays, activeDates };
    }, [workouts, activities]);

    const weightData = useMemo(() => {
        if (metrics.length === 0) return [];
        return metrics.map(m => ({
            date: format(m.timestamp.toDate(), "MMM dd"),
            shortDate: format(m.timestamp.toDate(), "dd"),
            weight: m.weight_kg,
        }));
    }, [metrics]);

    const currentWeight = metrics.length > 0 ? metrics[metrics.length - 1].weight_kg : 0;
    const heaviest = metrics.length > 0 ? Math.max(...metrics.map(m => m.weight_kg)) : 0;
    const lightest = metrics.length > 0 ? Math.min(...metrics.map(m => m.weight_kg)) : 0;

    const bmi = height > 0 ? currentWeight / Math.pow(height / 100, 2) : 0;
    const bmiCategory =
        bmi < 18.5 ? { label: "Underweight", color: "#0A84FF" } :
            bmi < 25 ? { label: "Normal", color: "#30D158" } :
                bmi < 30 ? { label: "Overweight", color: "#FF9F0A" } :
                    { label: "Obese", color: "#FF453A" };
    const pointerLeft = Math.min(Math.max(((bmi - 15) / (40 - 15)) * 100, 0), 100);

    const STAT_ITEMS = [
        { label: "Workouts", value: stats.workoutCount, icon: Award, color: "#BF5AF2", bg: "rgba(191,90,242,0.12)" },
        { label: "Kcal", value: stats.kcal, icon: Flame, color: "#FF9F0A", bg: "rgba(255,159,10,0.12)" },
        { label: "Minutes", value: stats.mins, icon: Clock, color: "#0A84FF", bg: "rgba(10,132,255,0.12)" },
    ];

    return (
        <div className="space-y-6 pb-32">
            <h1 className="text-3xl font-bold text-white px-2 tracking-tight">Report</h1>

            {/* Top 3 Stats */}
            <div className="card p-5 grid grid-cols-3 divide-x divide-white/[0.06]">
                {STAT_ITEMS.map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: bg }}>
                            <Icon className="w-5 h-5" style={{ color }} />
                        </div>
                        <div className="text-2xl font-bold stat-num mt-1 text-white">{value}</div>
                        <div className="text-xs text-zinc-500 font-medium">{label}</div>
                    </div>
                ))}
            </div>

            {/* History Calendar */}
            <div>
                <div className="flex items-center justify-between mb-3 px-2">
                    <h2 className="text-xl font-bold text-white tracking-tight">History</h2>
                    <button className="text-[#0A84FF] text-sm font-semibold">All records</button>
                </div>
                <div className="card p-6">
                    <div className="flex justify-between items-center mb-7">
                        {streakInfo.weekDays.map((date, i) => {
                            const isToday = isSameDay(date, new Date());
                            const dateStr = format(date, "yyyy-MM-dd");
                            const hasActivity = streakInfo.activeDates.has(dateStr);

                            return (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <span className="text-xs font-semibold text-zinc-500">{format(date, "EEEEEE")}</span>
                                    <div
                                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 text-sm font-bold
                                        ${isToday
                                                ? "border-2 border-[#0A84FF] text-[#0A84FF]"
                                                : hasActivity
                                                    ? "bg-[#0A84FF] text-white"
                                                    : "text-zinc-600"
                                            }`}
                                        style={isToday ? { boxShadow: "0 0 14px rgba(10,132,255,0.35)" } : {}}
                                    >
                                        {format(date, "d")}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="border-t border-white/[0.06] pt-4">
                        <div className="text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-widest">Day Streak</div>
                        <div className="flex items-center gap-1.5">
                            <Flame className="w-5 h-5 text-[#FF453A]" fill="currentColor" />
                            <span className="text-2xl font-bold stat-num text-white">{streakInfo.streak}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Weight Section */}
            <div>
                <div className="flex items-center justify-between mb-3 px-2">
                    <h2 className="text-xl font-bold text-white tracking-tight">Weight</h2>
                    <button
                        onClick={() => setLoggingWeight(true)}
                        className="bg-[#0A84FF] text-white px-5 py-2 rounded-full text-sm font-semibold active:scale-95 transition-all duration-200"
                        style={{ boxShadow: "0 4px 14px rgba(10,132,255,0.4)" }}
                    >
                        Log
                    </button>
                </div>

                {loggingWeight ? (
                    <div className="card p-5 space-y-4 border-[#0A84FF]/20">
                        <h3 className="font-bold text-white tracking-tight">Log Today&apos;s Weight</h3>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="label">Weight (kg)</label>
                                <input type="number" step="0.1" value={weight} onChange={e => setWeight(parseFloat(e.target.value) || 0)} className="field" />
                            </div>
                            <div className="flex-1">
                                <label className="label">Height (cm)</label>
                                <input type="number" value={height} onChange={e => setHeight(parseFloat(e.target.value) || 0)} className="field" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setLoggingWeight(false)} className="btn btn-ghost flex-1">Cancel</button>
                            <button onClick={handleSaveMetric} className="btn btn-primary flex-1">Save</button>
                        </div>
                    </div>
                ) : (
                    <div className="card p-5 pt-6 pb-2">
                        <div className="flex justify-between items-start mb-5">
                            <div>
                                <div className="text-sm text-zinc-500 font-medium mb-1">Current</div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold stat-num tracking-tight text-white">{currentWeight.toFixed(1)}</span>
                                    <span className="text-xl font-bold text-zinc-400">kg</span>
                                </div>
                            </div>
                            <div className="text-right space-y-1.5">
                                <div className="flex justify-between gap-5 text-sm">
                                    <span className="text-zinc-500 font-medium">Heaviest</span>
                                    <span className="font-bold stat-num text-white">{heaviest.toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between gap-5 text-sm">
                                    <span className="text-zinc-500 font-medium">Lightest</span>
                                    <span className="font-bold stat-num text-white">{lightest.toFixed(1)}</span>
                                </div>
                            </div>
                        </div>

                        {weightData.length > 0 && (
                            <div className="h-44 w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={weightData.slice(-7)} margin={{ top: 24, right: 10, left: -20, bottom: 0 }}>
                                        <XAxis dataKey="shortDate" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 11, fontWeight: 500 }} dy={10} />
                                        <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} hide />
                                        <Tooltip
                                            contentStyle={{ background: "rgba(28,28,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "6px 12px", fontSize: 12, backdropFilter: "blur(12px)" }}
                                            labelStyle={{ color: "#a1a1aa", fontSize: 11 }}
                                            itemStyle={{ color: "#0A84FF", fontWeight: 700 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="weight"
                                            stroke="#0A84FF"
                                            strokeWidth={2.5}
                                            dot={false}
                                            activeDot={{ r: 5, fill: "#0A84FF", stroke: "white", strokeWidth: 2 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                                {/* Weight badge */}
                                <div className="absolute top-[14%] left-1/2 -translate-x-1/2">
                                    <div className="px-3 py-1 rounded-full text-sm font-bold text-white shadow-lg" style={{ background: "rgba(10,132,255,0.25)", backdropFilter: "blur(8px)", border: "1px solid rgba(10,132,255,0.3)" }}>
                                        {currentWeight.toFixed(1)} kg
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* BMI Section */}
            <div>
                <div className="flex items-center justify-between mb-3 px-2">
                    <h2 className="text-xl font-bold text-white tracking-tight">BMI</h2>
                    <button
                        onClick={() => setLoggingWeight(true)}
                        className="bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 text-white px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95 flex items-center gap-1.5"
                    >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                </div>

                <div className="card p-6">
                    <div className="flex justify-between items-center mb-8">
                        <span className="text-4xl font-bold stat-num tracking-tight text-white">{bmi.toFixed(1)}</span>
                        <div
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold"
                            style={{ color: bmiCategory.color, background: `${bmiCategory.color}18`, borderColor: `${bmiCategory.color}40` }}
                        >
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: bmiCategory.color }} />
                            {bmiCategory.label}
                        </div>
                    </div>

                    <div className="relative mb-6 mt-2">
                        <div className="absolute -top-3 -translate-x-1/2 transition-all duration-500 z-10" style={{ left: `${pointerLeft}%` }}>
                            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-white" />
                        </div>
                        <div className="flex gap-1">
                            <div className="bmi-segment flex-[1] bg-[#0A84FF]" />
                            <div className="bmi-segment flex-[2.5] bg-[#5AC8FA]" />
                            <div className="bmi-segment flex-[6.5] bg-[#30D158]" />
                            <div className="bmi-segment flex-[5] bg-[#FF9F0A]" />
                            <div className="bmi-segment flex-[5] bg-[#FF6B35]" />
                            <div className="bmi-segment flex-[5] bg-[#FF453A]" />
                        </div>
                        <div className="flex justify-between text-[11px] font-semibold text-zinc-600 mt-2 px-1">
                            <span>15</span><span>16</span><span>18.5</span><span>25</span><span>30</span><span>35</span><span>40</span>
                        </div>
                    </div>

                    <div className="border-t border-white/[0.06] pt-4 flex justify-between items-center">
                        <span className="text-zinc-500 font-medium">Height</span>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold stat-num text-white">{height}</span>
                            <span className="text-zinc-400 font-bold">cm</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
