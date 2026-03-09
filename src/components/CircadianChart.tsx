"use client";

import { useMemo } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";
import { useHealth } from "@/contexts/HealthContext";
import { Moon, Sun, Coffee, Zap } from "lucide-react";

function calcCircadianWindows(wakeHour: number) {
    // Science-based circadian calculations
    const caffeineHalfLifeHours = 5;
    const idealSleepHour = wakeHour + 16; // 16hr wake window
    const caffeineLastDose = idealSleepHour - caffeineHalfLifeHours * 2; // clearance time
    const lightExposure = wakeHour + 0.5;
    const peakAlertness = wakeHour + 5;

    const fmt = (h: number) => {
        const normalized = ((h % 24) + 24) % 24;
        const hh = Math.floor(normalized);
        const mm = Math.round((normalized - hh) * 60);
        const ampm = hh >= 12 ? "PM" : "AM";
        const displayH = hh % 12 === 0 ? 12 : hh % 12;
        return `${displayH}:${mm.toString().padStart(2, "0")} ${ampm}`;
    };

    return {
        lightExposure: fmt(lightExposure),
        peakAlertness: fmt(peakAlertness),
        caffeineLastDose: fmt(caffeineLastDose),
        sleepWindow: fmt(idealSleepHour),
        wakeTime: fmt(wakeHour),
    };
}

export default function CircadianChart() {
    const { sleepLogs } = useHealth();

    const chartData = useMemo(() => {
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const now = new Date();
        return days.map((day, i) => {
            const log = sleepLogs.find((s) => {
                const d = new Date(s.sleep_start);
                return d.getDay() === (i + 1) % 7;
            });
            const duration = log
                ? (log.sleep_end - log.sleep_start) / 3600000
                : null;
            const debt = duration ? Math.max(0, 8 - duration) : null;

            return {
                day,
                sleep: duration ? parseFloat(duration.toFixed(1)) : 0,
                debt: debt ? parseFloat(debt.toFixed(1)) : 0,
                quality: log?.quality_score || 0,
            };
        });
    }, [sleepLogs]);

    // Infer avg wake time from logs
    const avgWakeHour = useMemo(() => {
        if (sleepLogs.length === 0) return 7; // default 7 AM
        const wakeHours = sleepLogs.map((s) => {
            const d = new Date(s.sleep_end);
            return d.getHours() + d.getMinutes() / 60;
        });
        return wakeHours.reduce((a, b) => a + b, 0) / wakeHours.length;
    }, [sleepLogs]);

    const windows = calcCircadianWindows(avgWakeHour);

    const totalDebt = chartData.reduce((a, b) => a + b.debt, 0);
    const avgSleep = chartData.filter((d) => d.sleep > 0).reduce((a, b, _, arr) => a + b.sleep / arr.length, 0);

    return (
        <div className="space-y-4">
            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="text-xs text-slate-400 mb-1">Avg Sleep</div>
                    <div className={`text-xl font-bold ${avgSleep >= 7.5 ? "text-emerald-400" : avgSleep >= 6 ? "text-yellow-400" : "text-red-400"}`}>
                        {avgSleep.toFixed(1)}h
                    </div>
                    <div className="text-xs text-slate-500">of 8h target</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="text-xs text-slate-400 mb-1">Sleep Debt</div>
                    <div className={`text-xl font-bold ${totalDebt < 2 ? "text-emerald-400" : totalDebt < 5 ? "text-yellow-400" : "text-red-400"}`}>
                        {totalDebt.toFixed(1)}h
                    </div>
                    <div className="text-xs text-slate-500">this week</div>
                </div>
            </div>

            {/* Sleep chart */}
            <div>
                <div className="text-xs text-slate-400 mb-2">7-Day Sleep Duration</div>
                <ResponsiveContainer width="100%" height={100}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                        <defs>
                            <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.6} />
                                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.6} />
                                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 10]} />
                        <Tooltip
                            contentStyle={{ background: "#0f1729", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "4px 10px" }}
                            labelStyle={{ color: "#94a3b8", fontSize: 11 }}
                            itemStyle={{ color: "#e2e8f0", fontSize: 12 }}
                        />
                        <ReferenceLine y={8} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.4} />
                        <Area type="monotone" dataKey="sleep" stroke="#6366f1" fill="url(#sleepGrad)" strokeWidth={2} name="Sleep (h)" />
                        <Area type="monotone" dataKey="debt" stroke="#ef4444" fill="url(#debtGrad)" strokeWidth={1.5} name="Debt (h)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Circadian windows */}
            <div>
                <div className="text-xs text-slate-400 mb-2">Today&apos;s Optimal Windows</div>
                <div className="space-y-2">
                    {[
                        { icon: Sun, label: "Light Exposure", value: windows.lightExposure, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
                        { icon: Zap, label: "Peak Alertness", value: windows.peakAlertness, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
                        { icon: Coffee, label: "Caffeine Cutoff", value: windows.caffeineLastDose, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
                        { icon: Moon, label: "Sleep Window", value: windows.sleepWindow, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
                    ].map(({ icon: Icon, label, value, color, bg }) => (
                        <div key={label} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${bg}`}>
                            <div className="flex items-center gap-2">
                                <Icon className={`w-3.5 h-3.5 ${color}`} />
                                <span className="text-xs text-slate-300">{label}</span>
                            </div>
                            <span className={`text-xs font-semibold ${color}`}>{value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
