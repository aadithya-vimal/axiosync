"use client";

import { useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { WorkoutLog, ActivityLog, formatLocalISO } from "@/lib/firestore";

interface Achievement {
    id: string;
    icon: string;
    title: string;
    desc: string;
    color: string;
    unlocked: boolean;
    progress?: number; // 0-1
    progressLabel?: string;
    category: "strength" | "cardio" | "consistency" | "nutrition" | "variety" | "special";
}

function buildAchievements(workouts: WorkoutLog[], activities: ActivityLog[]): Achievement[] {
    const totalVolume = workouts.reduce((a, w) => a + (w.total_volume_kg || 0), 0);
    const totalWorkouts = workouts.length;
    const totalActivities = activities.length;
    const totalSessions = totalWorkouts + totalActivities;
    
    const totalCardioKm = activities
        .filter(a => ["run", "cycle", "walk", "hike", "swim"].includes(a.type))
        .reduce((a, b) => a + (b.distance_km || 0), 0);
    const totalRunKm = activities.filter(a => a.type === "run").reduce((a, b) => a + (b.distance_km || 0), 0);
    const totalCycleKm = activities.filter(a => a.type === "cycle").reduce((a, b) => a + (b.distance_km || 0), 0);
    const totalSwimKm = activities.filter(a => a.type === "swim").reduce((a, b) => a + (b.distance_km || 0), 0);

    // Streak calc
    const allDays = new Set([
        ...workouts.map(w => w.timestamp?.toDate?.()?.toISOString().split("T")[0] || ""),
        ...activities.map(a => a.timestamp?.toDate?.()?.toISOString().split("T")[0] || ""),
    ]);
    let currentStreak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
        const d = new Date(today); d.setDate(today.getDate() - i);
        const key = d.toISOString().split("T")[0];
        if (allDays.has(key)) currentStreak++;
        else if (i > 0) break;
    }

    // Types logged
    const modalities = new Set(activities.map(a => a.type));
    const muscleGroups = new Set(
        workouts.flatMap(w => (w.exercises || []).map((e: any) => e.muscleGroup).filter(Boolean))
    );

    const achievements: Achievement[] = [
        // ── STRENGTH ─────────────────────────────────────────────────────────
        {
            id: "vol_1k",
            icon: "💪",
            title: "Iron Initiate",
            desc: "Lift 1,000kg total volume",
            color: "#30D158",
            unlocked: totalVolume >= 1000,
            progress: Math.min(1, totalVolume / 1000),
            progressLabel: `${Math.round(totalVolume).toLocaleString()}kg`,
            category: "strength",
        },
        {
            id: "vol_10k",
            icon: "🏗️",
            title: "Tonne Titan",
            desc: "Lift 10,000kg total volume",
            color: "#FF9F0A",
            unlocked: totalVolume >= 10000,
            progress: Math.min(1, totalVolume / 10000),
            progressLabel: `${Math.round(totalVolume / 1000)}t`,
            category: "strength",
        },
        {
            id: "vol_50k",
            icon: "⚖️",
            title: "Steel Specialist",
            desc: "Lift 50,000kg total volume",
            color: "#0A84FF",
            unlocked: totalVolume >= 50000,
            progress: Math.min(1, totalVolume / 50000),
            progressLabel: `${Math.round(totalVolume / 1000)}t`,
            category: "strength",
        },
        {
            id: "vol_100k",
            icon: "🏛️",
            title: "Iron Architect",
            desc: "Lift 100,000kg total volume",
            color: "#BF5AF2",
            unlocked: totalVolume >= 100000,
            progress: Math.min(1, totalVolume / 100000),
            progressLabel: `${Math.round(totalVolume / 1000)}t`,
            category: "strength",
        },
        {
            id: "vol_1m",
            icon: "🌌",
            title: "Gravity Defier",
            desc: "Lift 1,000,000kg total volume",
            color: "#FF375F",
            unlocked: totalVolume >= 1000000,
            progress: Math.min(1, totalVolume / 1000000),
            progressLabel: `${(totalVolume / 1000000).toFixed(2)}M kg`,
            category: "strength",
        },

        // ── CARDIO ───────────────────────────────────────────────────────────
        {
            id: "run_5k",
            icon: "🏃",
            title: "Quick 5K",
            desc: "Run 5km total distance",
            color: "#30D158",
            unlocked: totalRunKm >= 5,
            progress: Math.min(1, totalRunKm / 5),
            progressLabel: `${totalRunKm.toFixed(1)}km`,
            category: "cardio",
        },
        {
            id: "run_42k",
            icon: "🏁",
            title: "Marathoner",
            desc: "Run 42.2km total distance",
            color: "#FF9F0A",
            unlocked: totalRunKm >= 42.2,
            progress: Math.min(1, totalRunKm / 42.2),
            progressLabel: `${totalRunKm.toFixed(1)}km`,
            category: "cardio",
        },
        {
            id: "run_100k",
            icon: "🦅",
            title: "Ultra Runner",
            desc: "Run 100km total distance",
            color: "#BF5AF2",
            unlocked: totalRunKm >= 100,
            progress: Math.min(1, totalRunKm / 100),
            progressLabel: `${totalRunKm.toFixed(0)}km`,
            category: "cardio",
        },
        {
            id: "cycle_100k",
            icon: "🚴",
            title: "Century Cycle",
            desc: "Cycle 100km total distance",
            color: "#0A84FF",
            unlocked: totalCycleKm >= 100,
            progress: Math.min(1, totalCycleKm / 100),
            progressLabel: `${totalCycleKm.toFixed(0)}km`,
            category: "cardio",
        },
        {
            id: "cycle_500k",
            icon: "🚵",
            title: "Tour de Axio",
            desc: "Cycle 500km total distance",
            color: "#5AC8FA",
            unlocked: totalCycleKm >= 500,
            progress: Math.min(1, totalCycleKm / 500),
            progressLabel: `${totalCycleKm.toFixed(0)}km`,
            category: "cardio",
        },
        {
            id: "swim_10k",
            icon: "🏊",
            title: "Deep Sea",
            desc: "Swim 10km total distance",
            color: "#64D2FF",
            unlocked: totalSwimKm >= 10,
            progress: Math.min(1, totalSwimKm / 10),
            progressLabel: `${totalSwimKm.toFixed(1)}km`,
            category: "cardio",
        },

        // ── CONSISTENCY ──────────────────────────────────────────────────────
        {
            id: "streak_3",
            icon: "🔥",
            title: "Habit Former",
            desc: "3-day activity streak",
            color: "#FF9F0A",
            unlocked: currentStreak >= 3,
            progress: Math.min(1, currentStreak / 3),
            progressLabel: `${currentStreak}/3d`,
            category: "consistency",
        },
        {
            id: "streak_7",
            icon: "⚡",
            title: "Weekly Warrior",
            desc: "7-day activity streak",
            color: "#FFD60A",
            unlocked: currentStreak >= 7,
            progress: Math.min(1, currentStreak / 7),
            progressLabel: `${currentStreak}/7d`,
            category: "consistency",
        },
        {
            id: "streak_30",
            icon: "🛡️",
            title: "Unstoppable",
            desc: "30-day activity streak",
            color: "#30D158",
            unlocked: currentStreak >= 30,
            progress: Math.min(1, currentStreak / 30),
            progressLabel: `${currentStreak}/30d`,
            category: "consistency",
        },
        {
            id: "streak_100",
            icon: "👑",
            title: "Centurion",
            desc: "100-day activity streak",
            color: "#FF375F",
            unlocked: currentStreak >= 100,
            progress: Math.min(1, currentStreak / 100),
            progressLabel: `${currentStreak}/100d`,
            category: "consistency",
        },
        {
            id: "sessions_50",
            icon: "📈",
            title: "Grinder",
            desc: "50 total sessions logged",
            color: "#BF5AF2",
            unlocked: totalSessions >= 50,
            progress: Math.min(1, totalSessions / 50),
            progressLabel: `${totalSessions}/50`,
            category: "consistency",
        },
        {
            id: "sessions_250",
            icon: "💎",
            title: "Elite Athlete",
            desc: "250 total sessions logged",
            color: "#0A84FF",
            unlocked: totalSessions >= 250,
            progress: Math.min(1, totalSessions / 250),
            progressLabel: `${totalSessions}/250`,
            category: "consistency",
        },

        // ── VARIETY ──────────────────────────────────────────────────────────
        {
            id: "muscle_all",
            icon: "🧬",
            title: "Human Anatomy",
            desc: "Train 8 different muscle groups",
            color: "#FF453A",
            unlocked: muscleGroups.size >= 8,
            progress: Math.min(1, muscleGroups.size / 8),
            progressLabel: `${muscleGroups.size}/8`,
            category: "variety",
        },
        {
            id: "modal_5",
            icon: "🎯",
            title: "Polymath",
            desc: "Try 5 different activity types",
            color: "#5AC8FA",
            unlocked: modalities.size >= 5,
            progress: Math.min(1, modalities.size / 5),
            progressLabel: `${modalities.size}/5`,
            category: "variety",
        },
        {
            id: "bw_expert",
            icon: "🧘",
            title: "Ninja",
            desc: "Complete 10 pure bodyweight sessions",
            color: "#30D158",
            unlocked: workouts.filter(w => (w.total_volume_kg || 0) === 0).length >= 10,
            progress: Math.min(1, workouts.filter(w => (w.total_volume_kg || 0) === 0).length / 10),
            progressLabel: `${workouts.filter(w => (w.total_volume_kg || 0) === 0).length}/10`,
            category: "variety",
        },

        // ── SPECIAL ──────────────────────────────────────────────────────────
        {
            id: "early_bird",
            icon: "🌅",
            title: "Morning Glory",
            desc: "Log an activity before 7:00 AM",
            color: "#FFD60A",
            unlocked: [...workouts, ...activities].some(s => {
                const d = s.timestamp?.toDate?.() || new Date(s.timestamp);
                return d.getHours() < 7;
            }),
            category: "special",
        },
        {
            id: "night_owl",
            icon: "🌙",
            title: "Midnight Oil",
            desc: "Log an activity after 10:00 PM",
            color: "#5E5CE6",
            unlocked: [...workouts, ...activities].some(s => {
                const d = s.timestamp?.toDate?.() || new Date(s.timestamp);
                return d.getHours() >= 22;
            }),
            category: "special",
        },
    ];

    return achievements;
}

const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.02 } },
};
const item: Variants = {
    hidden: { opacity: 0, scale: 0.85, y: 10 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 25 } },
};

export default function AchievementBadges({
    workouts,
    activities,
}: {
    workouts: WorkoutLog[];
    activities: ActivityLog[];
}) {
    const achievements = useMemo(() => buildAchievements(workouts, activities), [workouts, activities]);
    const unlocked = achievements.filter(a => a.unlocked);
    const locked = achievements.filter(a => !a.unlocked);

    // Group by category
    const categories = Array.from(new Set(achievements.map(a => a.category)));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-lg text-[var(--text-primary)]">Achievements</h3>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Your Progression Journey</p>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-xl font-black text-[#FF9F0A] tabular-nums">
                        {unlocked.length}
                    </span>
                    <span className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-tighter">
                        of {achievements.length} Unlocked
                    </span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(unlocked.length / achievements.length) * 100}%` }}
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                />
            </div>

            {/* Unlocked Grid */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-4 sm:grid-cols-5 gap-2"
            >
                {unlocked.map(a => (
                    <motion.div
                        key={a.id}
                        variants={item}
                        className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border text-center relative overflow-hidden group"
                        style={{ background: `${a.color}08`, borderColor: `${a.color}25` }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <div
                            className="absolute inset-0 opacity-[0.04] pointer-events-none group-hover:opacity-[0.08] transition-opacity"
                            style={{ background: `radial-gradient(circle at 50% 0%, ${a.color}, transparent 70%)` }}
                        />
                        <span className="text-2xl drop-shadow-sm">{a.icon}</span>
                        <div className="text-[8px] font-black uppercase tracking-tighter leading-tight text-white/90">{a.title}</div>
                    </motion.div>
                ))}
                
                {unlocked.length === 0 && (
                    <div className="col-span-full py-8 text-center border border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                        <p className="text-xs text-[var(--text-muted)] italic font-medium">No achievements unlocked yet. Keep pushing!</p>
                    </div>
                )}
            </motion.div>

            {/* Locked — Next Milestones */}
            <div className="space-y-2">
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">Upcoming Milestones</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {locked.slice(0, 6).map(a => (
                        <div key={a.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                            <span className="text-xl opacity-20 grayscale">{a.icon}</span>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-end mb-1">
                                    <div className="text-[11px] font-bold text-white/70">{a.title}</div>
                                    <span className="text-[9px] text-[var(--text-muted)] font-bold tabular-nums">{a.progressLabel}</span>
                                </div>
                                {a.progress !== undefined && (
                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(a.progress || 0) * 100}%` }}
                                            className="h-full rounded-full"
                                            style={{ background: a.color }}
                                        />
                                    </div>
                                )}
                                <div className="text-[9px] text-[var(--text-muted)] mt-1.5 line-clamp-1">{a.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
