"use client";

import { useMemo, useState } from "react";
import type { WorkoutLog, ActivityLog } from "@/lib/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Target, Trash2, Maximize2, Flame, Calendar, Info, ChevronDown } from "lucide-react";

interface Props {
    workouts: WorkoutLog[];
    activities: ActivityLog[];
    onDelete?: (id: string, type: 'workout' | 'activity') => Promise<void>;
}

function getDateKey(ts: any): string {
    if (!ts) return "";
    const d = ts?.toDate?.() || new Date(ts);
    return d.toISOString().split("T")[0];
}

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const START_YEAR = 2024;
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i).reverse();

export default function StreakCalendar({ workouts, activities, onDelete }: Props) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState<{ date: string; items: (WorkoutLog | ActivityLog)[] } | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Build activity map
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

    // Monthly Grid Logic
    const { monthDays, firstDayOfWeek } = useMemo(() => {
        const firstDay = new Date(selectedYear, selectedMonth, 1);
        const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
        const days = lastDay.getDate();
        const startDay = firstDay.getDay(); // 0 is Sunday
        return { monthDays: days, firstDayOfWeek: startDay };
    }, [selectedMonth, selectedYear]);

    // Calculate statistics for the selected month
    const { monthActiveDays, monthIntensity } = useMemo(() => {
        let active = 0, intensity = 0;
        for (let d = 1; d <= monthDays; d++) {
            const key = new Date(selectedYear, selectedMonth, d).toISOString().split("T")[0];
            const entries = activityMap[key];
            if (entries) {
                active++;
                intensity += entries.count;
            }
        }
        return { monthActiveDays: active, monthIntensity: intensity };
    }, [selectedMonth, selectedYear, monthDays, activityMap]);

    // Global Streaks (still useful context)
    const { currentStreak, longestStreak } = useMemo(() => {
        let cur = 0, longest = 0, temp = 0;
        const checkDays = 365; // Check last year for streaks
        for (let i = 0; i < checkDays; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const key = d.toISOString().split("T")[0];
            if (activityMap[key]) {
                temp++;
            } else {
                if (i <= 1) cur = temp; // today or yesterday
                temp = 0;
            }
            longest = Math.max(longest, temp);
        }
        if (cur === 0) {
            const yesterdayKey = new Date(today.getTime() - 86400000).toISOString().split("T")[0];
            if (activityMap[yesterdayKey]) {
                let yTemp = 0;
                for (let i = 1; i < checkDays; i++) {
                    const d = new Date(today);
                    d.setDate(today.getDate() - i);
                    const key = d.toISOString().split("T")[0];
                    if (activityMap[key]) yTemp++; else break;
                }
                cur = yTemp;
            }
        }
        return { currentStreak: cur, longestStreak: longest };
    }, [activityMap, today]);

    const cellColor = (count: number) => {
        if (count === 0) return "rgba(255, 255, 255, 0.05)";
        if (count === 1) return "rgba(10, 132, 255, 0.4)";
        if (count === 2) return "rgba(10, 132, 255, 0.65)";
        return "rgba(10, 132, 255, 0.95)";
    };

    const renderGrid = () => {
        const gap = 4;
        
        // Build the days grid (including padding for the first day of week)
        const gridDays = [];
        for (let i = 0; i < firstDayOfWeek; i++) {
            gridDays.push(null);
        }
        for (let d = 1; d <= monthDays; d++) {
            const date = new Date(selectedYear, selectedMonth, d);
            const key = date.toISOString().split("T")[0];
            gridDays.push({ d, key, count: activityMap[key]?.count || 0, items: activityMap[key]?.items || [] });
        }

        return (
            <div className="flex flex-col gap-2 w-full max-w-sm mx-auto sm:max-w-md">
                {/* Day Header */}
                <div className="grid grid-cols-7 text-center mb-1">
                    {["S", "M", "T", "W", "T", "F", "S"].map(d => (
                        <div key={d} className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">
                            {d}
                        </div>
                    ))}
                </div>
                
                {/* The Grid */}
                <div className="grid grid-cols-7" style={{ gap }}>
                    {gridDays.map((day, i) => (
                        <div key={i} className="aspect-square flex items-center justify-center">
                            {day ? (
                                <motion.div
                                    whileHover={{ scale: 1.1, zIndex: 10 }}
                                    onClick={() => day.count > 0 && setSelectedDate({ date: day.key, items: day.items })}
                                    className={`relative flex items-center justify-center transition-all duration-300 w-full h-full ${day.count > 0 ? "cursor-pointer" : "cursor-default"}`}
                                    style={{
                                        borderRadius: 4,
                                        background: cellColor(day.count),
                                        border: day.key === getDateKey(today) ? "1px solid rgba(255,255,255,0.4)" : "none",
                                    }}
                                >
                                    <span className={`text-[9px] sm:text-xs font-bold ${day.count > 0 ? "text-white" : "text-white/10"}`}>
                                        {day.d}
                                    </span>
                                </motion.div>
                            ) : (
                                <div className="w-full h-full opacity-0 pointer-events-none" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="card bg-white/[0.02] border-white/[0.05] p-6 space-y-6 relative overflow-hidden group">
            {/* Context Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <Calendar className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-[var(--text-primary)]">Activity Index</h3>
                        <p className="text-xs text-[var(--text-muted)]">Monthly Visualization</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end px-4 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                        <div className="flex items-center gap-1.5 text-[#30D158]">
                            <Flame className="w-3.5 h-3.5 fill-current" />
                            <span className="text-sm font-bold tracking-tight">{currentStreak} Day Streak</span>
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] font-medium">Month Active: {monthActiveDays} Days</span>
                    </div>
                </div>
            </div>

            {/* Selection & Navigation Area */}
            <div className="flex flex-wrap items-center gap-2 relative z-10">
                <div className="relative flex-1 sm:flex-none">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="w-full sm:w-32 bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-sm font-bold text-white appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 cursor-pointer"
                    >
                        {MONTHS.map((m, i) => <option key={i} value={i} className="bg-[#0f0f15]">{m}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                </div>
                <div className="relative flex-1 sm:flex-none">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="w-full sm:w-24 bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-sm font-bold text-white appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 cursor-pointer"
                    >
                        {YEARS.map(y => <option key={y} value={y} className="bg-[#0f0f15]">{y}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                </div>
            </div>

            {/* Grid Area */}
            <div className="relative py-2">
                {renderGrid()}
                
                <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center gap-1.5 bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/[0.05]">
                        <Info className="w-3 h-3 text-[var(--text-muted)]" />
                        <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">{monthActiveDays} Active Days this month</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Intensity</span>
                        <div className="flex gap-1">
                            {[0, 1, 2, 3].map(n => (
                                <div key={n} style={{ width: 10, height: 10, borderRadius: 2, background: cellColor(n) }} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Overlay */}
            <AnimatePresence>
                {selectedDate && (
                    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="w-full max-w-lg bg-[#14141c] border border-white/10 shadow-2xl rounded-3xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-white/[0.05] flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-xl text-white">Daily Summary</h4>
                                    <p className="text-sm text-[var(--text-muted)]">
                                        {new Date(selectedDate.date).toLocaleDateString(undefined, {
                                            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <button onClick={() => setSelectedDate(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                                {selectedDate.items.map((item, idx) => {
                                    const isWorkout = 'exercises' in item;
                                    const wItem = item as WorkoutLog;
                                    const aItem = item as ActivityLog;
                                    const itemId = item.id || '';
                                    const isConfirming = deletingId === itemId;

                                    return (
                                        <div key={itemId || idx} className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4 flex flex-col gap-3 group relative">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isWorkout ? 'bg-purple-500/20 text-purple-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                                        {isWorkout ? <Target className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-bold text-white capitalize block decoration-blue-500 underline-offset-4 decoration-2">
                                                            {isWorkout ? "Strength Session" : aItem.type.replace("_", " ")}
                                                        </span>
                                                        <span className="text-[10px] text-[var(--text-muted)] font-bold">{item.duration_min} Minutes logged</span>
                                                    </div>
                                                </div>

                                                {onDelete && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (isConfirming) {
                                                                (async () => {
                                                                    setIsDeleting(true);
                                                                    await onDelete(itemId, isWorkout ? 'workout' : 'activity');
                                                                    setSelectedDate(prev => prev ? { ...prev, items: prev.items.filter(i => i.id !== itemId) } : null);
                                                                    setDeletingId(null);
                                                                    setIsDeleting(false);
                                                                })();
                                                            } else {
                                                                setDeletingId(itemId);
                                                            }
                                                        }}
                                                        disabled={isDeleting}
                                                        className={`p-2 rounded-xl transition-all ${isConfirming ? "bg-red-500 text-white" : "text-red-400 opacity-0 group-hover:opacity-100 bg-red-500/10"}`}
                                                    >
                                                        {isConfirming ? <span className="text-[10px] font-bold px-2">Confirm</span> : <Trash2 className="w-4 h-4" />}
                                                    </button>
                                                )}
                                            </div>

                                            {isWorkout && (
                                                <div className="text-xs text-[var(--text-muted)] font-medium flex-1">
                                                    <span className="text-purple-400 font-bold">{wItem.name}</span> • {wItem.exercises.length} Exercises completed
                                                </div>
                                            )}

                                            {isConfirming && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
                                                    className="absolute -top-2 -right-2 bg-white text-black text-[10px] font-bold px-3 py-1 rounded-full shadow-lg"
                                                >
                                                    Cancel
                                                </button>
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
