"use client";

import { useMemo, useState } from "react";
import type { WorkoutLog, ActivityLog } from "@/lib/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Target } from "lucide-react";

interface Props {
    workouts: WorkoutLog[];
    activities: ActivityLog[];
}

function getDateKey(ts: any): string {
    if (!ts) return "";
    const d = ts?.toDate?.() || new Date(ts);
    return d.toISOString().split("T")[0];
}

export default function StreakCalendar({ workouts, activities }: Props) {
    const WEEKS = 16;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [selectedDate, setSelectedDate] = useState<{ date: string; items: (WorkoutLog | ActivityLog)[] } | null>(null);

    // Build activity map: dateKey → count & items
    const activityMap = useMemo(() => {
        const map: Record<string, { count: number; items: (WorkoutLog | ActivityLog)[] }> = {};
        [...workouts, ...activities].forEach(entry => {
            const key = getDateKey((entry as any).timestamp);
            if (key) {
                if (!map[key]) map[key] = { count: 0, items: [] };
                map[key].count += 1;
                map[key].items.push(entry);
            }
        });
        return map;
    }, [workouts, activities]);

    // Build grid: WEEKS*7 days, ending today (Sunday-aligned)
    const dayOfWeek = today.getDay(); // 0=Sun
    const endDay = new Date(today);
    const startDay = new Date(today);
    startDay.setDate(today.getDate() - (WEEKS * 7 - 1));

    const cells: { date: Date; key: string; count: number; items: (WorkoutLog | ActivityLog)[] }[] = [];
    for (let i = 0; i < WEEKS * 7; i++) {
        const d = new Date(startDay);
        d.setDate(startDay.getDate() + i);
        const key = d.toISOString().split("T")[0];
        cells.push({ date: d, key, count: activityMap[key]?.count || 0, items: activityMap[key]?.items || [] });
    }

    // Calculate streaks
    let currentStreak = 0, longestStreak = 0, temp = 0;
    for (let i = cells.length - 1; i >= 0; i--) {
        if (cells[i].count > 0) {
            temp++;
            if (i === cells.length - 1 || i === cells.length - 2) currentStreak = temp; // allow for today
        } else { temp = 0; }
        longestStreak = Math.max(longestStreak, temp);
    }

    const cellColor = (count: number) => {
        if (count === 0) return "rgba(255,255,255,0.04)";
        if (count === 1) return "rgba(10,132,255,0.35)";
        if (count === 2) return "rgba(10,132,255,0.60)";
        return "rgba(10,132,255,0.90)";
    };

    const MONTH_LABELS: { label: string; col: number }[] = [];
    let lastMonth = -1;
    cells.filter((_, i) => i % 7 === 0).forEach((cell, weekIdx) => {
        const m = cell.date.getMonth();
        if (m !== lastMonth) {
            MONTH_LABELS.push({ label: cell.date.toLocaleDateString("en", { month: "short" }), col: weekIdx });
            lastMonth = m;
        }
    });

    const weeks: typeof cells[] = [];
    for (let w = 0; w < WEEKS; w++) {
        weeks.push(cells.slice(w * 7, w * 7 + 7));
    }

    const totalActiveDays = cells.filter(c => c.count > 0).length;

    return (
        <div className="card p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[var(--text-primary)]">Activity Calendar</h3>
                <div className="flex gap-3 text-xs text-[var(--text-muted)]">
                    <span><span className="text-[#30D158] font-bold">{currentStreak}</span> day streak</span>
                    <span><span className="text-[#0A84FF] font-bold">{totalActiveDays}</span> active days</span>
                </div>
            </div>

            {/* Streak banner */}
            {currentStreak > 0 && (
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl" style={{ background: "rgba(48,209,88,0.08)", border: "1px solid rgba(48,209,88,0.2)" }}>
                    <span className="text-lg">🔥</span>
                    <div>
                        <div className="text-sm font-semibold text-[#30D158]">{currentStreak}-day streak!</div>
                        <div className="text-xs text-[var(--text-muted)]">Longest: {longestStreak} days</div>
                    </div>
                </div>
            )}

            {/* Month labels */}
            <div className="overflow-x-auto no-scrollbar">
                <div style={{ display: "flex", gap: 3, marginLeft: 20, marginBottom: 2 }}>
                    {MONTH_LABELS.map(({ label, col }) => (
                        <div key={`${label}-${col}`} style={{ minWidth: (col === 0 ? 0 : (col - (MONTH_LABELS.find(m => m.col < col)?.col ?? 0)) * 13) + "px" }} className="text-[9px] text-[var(--text-muted)] shrink-0">
                            {label}
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div style={{ display: "flex", gap: 3 }}>
                    {/* Day labels */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingTop: 0 }}>
                        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                            <div key={i} className="text-[9px] text-[var(--text-muted)] flex items-center justify-end" style={{ width: 14, height: 10, lineHeight: 1 }}>{d}</div>
                        ))}
                    </div>

                    {weeks.map((week, wi) => (
                        <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            {week.map((cell) => (
                                <div
                                    key={cell.key}
                                    title={cell.count > 0 ? `${cell.key}: ${cell.count} activit${cell.count > 1 ? "ies" : "y"}` : cell.key}
                                    onClick={() => cell.count > 0 && setSelectedDate({ date: cell.key, items: cell.items })}
                                    style={{
                                        width: 10, height: 10, borderRadius: 2,
                                        background: cellColor(cell.count),
                                        cursor: cell.count > 0 ? "pointer" : "default",
                                        border: cell.key === today.toISOString().split("T")[0] ? "1px solid rgba(255,255,255,0.3)" : "none",
                                    }}
                                />
                            ))}
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-2 mt-3 justify-end">
                    <span className="text-[9px] text-[var(--text-muted)]">Less</span>
                    {[0, 1, 2, 3].map(n => (
                        <div key={n} style={{ width: 10, height: 10, borderRadius: 2, background: cellColor(n) }} />
                    ))}
                    <span className="text-[9px] text-[var(--text-muted)]">More</span>
                </div>
            </div>

            {/* Daily Details Modal */}
            <AnimatePresence>
                {selectedDate && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[var(--bg-overlay)] backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-[#12121a] border border-[var(--border-subtle)] shadow-2xl rounded-2xl w-full max-w-md overflow-hidden relative"
                        >
                            <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[#1a1a24]">
                                <div>
                                    <h3 className="font-bold text-lg text-[var(--text-primary)]">Daily Summary</h3>
                                    <p className="text-[var(--text-muted)] text-sm">{new Date(selectedDate.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                                <button onClick={() => setSelectedDate(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-[var(--text-muted)]" />
                                </button>
                            </div>
                            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
                                {selectedDate.items.map((item, idx) => {
                                    const isWorkout = 'exercises' in item;
                                    const wItem = item as WorkoutLog;
                                    const aItem = item as ActivityLog;
                                    return (
                                        <div key={idx} className="bg-[#1a1a24] border border-[var(--border-subtle)] rounded-xl p-4 flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-[var(--text-primary)] capitalize flex items-center gap-2">
                                                    {isWorkout ? "🏋️ Strength & Muscle" : "🏃 Cardiovascular"}
                                                </span>
                                                <span className="text-xs font-semibold text-[var(--text-muted)] bg-[var(--bg-overlay)] px-2 py-1 rounded-md flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {item.duration_min} min
                                                </span>
                                            </div>
                                            {isWorkout && (
                                                <div className="mt-2 text-sm text-[var(--text-muted)] flex items-center gap-2">
                                                    <Target className="w-4 h-4 text-[#A855F7]" />
                                                    {wItem.name} • {wItem.exercises.length} Exercises
                                                </div>
                                            )}
                                            {!isWorkout && (
                                                <div className="mt-2 text-sm text-[var(--text-muted)] capitalize flex items-center gap-2">
                                                    Activity: {aItem.type.replace("_", " ")}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
