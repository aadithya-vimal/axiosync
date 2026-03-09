"use client";

import { useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import type { WorkoutLog, ActivityLog } from "@/lib/firestore";

interface Achievement {
    id: string;
    icon: string;
    title: string;
    desc: string;
    color: string;
    unlocked: boolean;
    progress?: number; // 0-1
    progressLabel?: string;
}

function buildAchievements(workouts: WorkoutLog[], activities: ActivityLog[]): Achievement[] {
    const totalVolume = workouts.reduce((a, w) => a + (w.total_volume_kg || 0), 0);
    const totalWorkouts = workouts.length;
    const totalActivities = activities.length;
    const totalCardioKm = activities
        .filter(a => ["run", "cycle", "walk", "hike", "swim"].includes(a.type))
        .reduce((a, b) => a + (b.distance_km || 0), 0);
    const totalRunKm = activities.filter(a => a.type === "run").reduce((a, b) => a + (b.distance_km || 0), 0);
    const totalCycleKm = activities.filter(a => a.type === "cycle").reduce((a, b) => a + (b.distance_km || 0), 0);

    // Streak calc
    const allDays = new Set([
        ...workouts.map(w => w.timestamp?.toDate?.()?.toISOString().split("T")[0] || ""),
        ...activities.map(a => a.timestamp?.toDate?.()?.toISOString().split("T")[0] || ""),
    ]);
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
        const d = new Date(today); d.setDate(today.getDate() - i);
        const key = d.toISOString().split("T")[0];
        if (allDays.has(key)) streak++;
        else if (i > 0) break;
    }

    // Types logged
    const modalities = new Set(activities.map(a => a.type));
    const muscleGroups = new Set(
        workouts.flatMap(w => (w.exercises || []).map((e: any) => e.muscleGroup).filter(Boolean))
    );

    return [
        {
            id: "first_workout",
            icon: "🏋️",
            title: "First Rep",
            desc: "Logged your first workout",
            color: "#0A84FF",
            unlocked: totalWorkouts >= 1,
            progress: Math.min(1, totalWorkouts),
        },
        {
            id: "streak_3",
            icon: "🔥",
            title: "On Fire",
            desc: "3-day activity streak",
            color: "#FF9F0A",
            unlocked: streak >= 3,
            progress: Math.min(1, streak / 3),
            progressLabel: `${streak}/3 days`,
        },
        {
            id: "streak_7",
            icon: "⚡",
            title: "Week Warrior",
            desc: "7-day activity streak",
            color: "#FF9F0A",
            unlocked: streak >= 7,
            progress: Math.min(1, streak / 7),
            progressLabel: `${streak}/7 days`,
        },
        {
            id: "volume_1000",
            icon: "💪",
            title: "Tonne Lifter",
            desc: "Lifted 1,000kg total",
            color: "#30D158",
            unlocked: totalVolume >= 1000,
            progress: Math.min(1, totalVolume / 1000),
            progressLabel: `${Math.round(totalVolume).toLocaleString()}/1,000kg`,
        },
        {
            id: "volume_10000",
            icon: "🏆",
            title: "Ironclad",
            desc: "Lifted 10,000kg total",
            color: "#FF9F0A",
            unlocked: totalVolume >= 10000,
            progress: Math.min(1, totalVolume / 10000),
            progressLabel: `${Math.round(totalVolume / 1000).toFixed(1)}/10 tonnes`,
        },
        {
            id: "run_10km",
            icon: "🏃",
            title: "10K Club",
            desc: "Ran 10km total",
            color: "#30D158",
            unlocked: totalRunKm >= 10,
            progress: Math.min(1, totalRunKm / 10),
            progressLabel: `${totalRunKm.toFixed(1)}/10km`,
        },
        {
            id: "cycle_100km",
            icon: "🚴",
            title: "Century Rider",
            desc: "Cycled 100km total",
            color: "#0A84FF",
            unlocked: totalCycleKm >= 100,
            progress: Math.min(1, totalCycleKm / 100),
            progressLabel: `${totalCycleKm.toFixed(0)}/100km`,
        },
        {
            id: "cardio_50km",
            icon: "🌍",
            title: "Expedition",
            desc: "50km across all cardio",
            color: "#BF5AF2",
            unlocked: totalCardioKm >= 50,
            progress: Math.min(1, totalCardioKm / 50),
            progressLabel: `${totalCardioKm.toFixed(1)}/50km`,
        },
        {
            id: "multi_modal",
            icon: "🎯",
            title: "All-Rounder",
            desc: "Logged 3 different activity types",
            color: "#5AC8FA",
            unlocked: modalities.size >= 3,
            progress: Math.min(1, modalities.size / 3),
            progressLabel: `${modalities.size}/3 types`,
        },
        {
            id: "muscle_groups_5",
            icon: "💡",
            title: "Full Body",
            desc: "Trained 5 muscle groups",
            color: "#FF453A",
            unlocked: muscleGroups.size >= 5,
            progress: Math.min(1, muscleGroups.size / 5),
            progressLabel: `${muscleGroups.size}/5 groups`,
        },
        {
            id: "sessions_10",
            icon: "📅",
            title: "Consistent",
            desc: "10 total sessions logged",
            color: "#30D158",
            unlocked: (totalWorkouts + totalActivities) >= 10,
            progress: Math.min(1, (totalWorkouts + totalActivities) / 10),
            progressLabel: `${totalWorkouts + totalActivities}/10 sessions`,
        },
        {
            id: "streak_30",
            icon: "👑",
            title: "Legend",
            desc: "30-day activity streak",
            color: "#FF9F0A",
            unlocked: streak >= 30,
            progress: Math.min(1, streak / 30),
            progressLabel: `${streak}/30 days`,
        },
    ];
}

const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05 } },
};
const item: Variants = {
    hidden: { opacity: 0, scale: 0.85 },
    show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
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

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Achievements</h3>
                <span className="text-xs text-zinc-500 font-medium tabular-nums">
                    <span className="text-[#FF9F0A] font-bold">{unlocked.length}</span>/{achievements.length} unlocked
                </span>
            </div>

            {/* Unlocked */}
            {unlocked.length > 0 && (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-3 sm:grid-cols-4 gap-2"
                >
                    {unlocked.map(a => (
                        <motion.div
                            key={a.id}
                            variants={item}
                            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center relative overflow-hidden"
                            style={{ background: `${a.color}10`, borderColor: `${a.color}30` }}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <div
                                className="absolute inset-0 opacity-[0.06] pointer-events-none"
                                style={{ background: `radial-gradient(circle at 50% 0%, ${a.color}, transparent 70%)` }}
                            />
                            <span className="text-2xl">{a.icon}</span>
                            <div className="text-[10px] font-bold" style={{ color: a.color }}>{a.title}</div>
                            <div className="text-[9px] text-zinc-500 leading-tight">{a.desc}</div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Locked — in progress */}
            <div className="space-y-1.5">
                {locked.slice(0, 4).map(a => (
                    <div key={a.id} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                        <span className="text-xl opacity-30">{a.icon}</span>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-zinc-500">{a.title}</div>
                            <div className="text-[10px] text-zinc-700">{a.desc}</div>
                            {a.progress !== undefined && (
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(a.progress || 0) * 100}%` }}
                                            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                                            className="h-full rounded-full"
                                            style={{ background: a.color }}
                                        />
                                    </div>
                                    <span className="text-[9px] text-zinc-600 tabular-nums">{a.progressLabel}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
