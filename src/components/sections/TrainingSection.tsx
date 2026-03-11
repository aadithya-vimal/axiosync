"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Dumbbell, Activity } from "lucide-react";
import WorkoutTracker from "@/components/WorkoutTracker";
import CardioTracker from "@/components/CardioTracker";
import AIInsightsFeed from "@/components/AIInsightsFeed";
import AchievementBadges from "@/components/AchievementBadges";

const pageVariants = {
    initial: { opacity: 0, y: 16 },
    enter: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 320, damping: 30, mass: 0.8 } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.18 } },
};

function Skeleton({ className = "" }: { className?: string }) {
    return (
        <div className={`animate-pulse rounded-2xl bg-white/[0.04] ${className}`} />
    );
}

export default function TrainingSection({
    recentWorkouts,
    recentActivities,
    readinessPct,
    streakDays,
    dataLoaded,
    latestMetric,
}: {
    recentWorkouts: any[];
    recentActivities: any[];
    readinessPct: number;
    streakDays: number;
    latestMetric: any;
    dataLoaded: boolean;
}) {
    const [subView, setSubView] = useState<"home" | "strength" | "cardio">("home");

    // Workout recency
    const lastWorkoutTs = recentWorkouts[0]?.timestamp?.toDate?.();
    const daysSince = lastWorkoutTs
        ? Math.floor((Date.now() - lastWorkoutTs.getTime()) / 86400000)
        : 99;
    const lastCardioKm = recentActivities[0]?.distance_km || 0;
    const totalToday = recentWorkouts.filter(w => {
        const d = w.timestamp?.toDate?.();
        return d && new Date().toDateString() === d.toDateString();
    }).reduce((a: number, w: any) => a + (w.total_volume_kg || 0), 0);

    const scoreColor = readinessPct >= 80 ? "#30D158" : readinessPct >= 60 ? "#FF9F0A" : "#FF453A";

    if (subView === "strength") {
        return (
            <div className="pb-32">
                <button onClick={() => setSubView("home")} className="flex items-center gap-2 text-[#0A84FF] text-sm font-semibold mb-5 hover:opacity-80 transition-opacity">
                    ← Back to Dashboard
                </button>
                <WorkoutTracker />
            </div>
        );
    }

    if (subView === "cardio") {
        return (
            <div className="pb-32">
                <button onClick={() => setSubView("home")} className="flex items-center gap-2 text-[#FF9F0A] text-sm font-semibold mb-5 hover:opacity-80 transition-opacity">
                    ← Back to Dashboard
                </button>
                <CardioTracker />
            </div>
        );
    }

    return (
        <motion.div
            variants={pageVariants} initial="initial" animate="enter" exit="exit"
            className="space-y-4 pb-32"
        >
            <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight px-1 pt-2">Operations</h1>

            {/* ── AI Insights Feed ── */}
            {dataLoaded && (
                <div className="card p-5">
                    <AIInsightsFeed
                        readinessPct={readinessPct}
                        daysSinceWorkout={daysSince}
                        totalVolumeToday={totalToday}
                        streakDays={streakDays}
                        lastCardioKm={lastCardioKm}
                        weightKg={latestMetric?.weight_kg}
                        heightCm={latestMetric?.height_cm}
                    />
                </div>
            )}
            {!dataLoaded && <Skeleton className="h-40" />}

            {/* ── Bento Row 1: Readiness + Streak ── */}
            <div className="grid grid-cols-2 gap-3">
                {/* Readiness Bento */}
                <motion.div
                    className="card p-4 flex flex-col gap-2 relative overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                >
                    <div
                        className="absolute inset-0 opacity-10 pointer-events-none"
                        style={{ background: `radial-gradient(circle at 80% 20%, ${scoreColor}, transparent 60%)` }}
                    />
                    <div className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-widest">Readiness</div>
                    {dataLoaded ? (
                        <>
                            <div className="text-4xl font-bold stat-num" style={{ color: scoreColor }}>{readinessPct}</div>
                            <div className="text-xs text-[var(--text-muted)]">
                                {readinessPct >= 80 ? "Peak — go hard" : readinessPct >= 60 ? "Good — train steady" : "Low — recover"}
                            </div>
                            <div className="w-full h-1 bg-white/[0.06] rounded-full mt-1">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${readinessPct}%` }}
                                    transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
                                    className="h-full rounded-full"
                                    style={{ background: scoreColor, boxShadow: `0 0 8px ${scoreColor}60` }}
                                />
                            </div>
                        </>
                    ) : <Skeleton className="h-12" />}
                </motion.div>

                {/* Streak Bento */}
                <motion.div
                    className="card p-4 flex flex-col gap-2 relative overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                >
                    <div
                        className="absolute inset-0 opacity-10 pointer-events-none"
                        style={{ background: "radial-gradient(circle at 80% 20%, #FF9F0A, transparent 60%)" }}
                    />
                    <div className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-widest">Streak</div>
                    {dataLoaded ? (
                        <>
                            <div className="flex items-end gap-1">
                                <div className="text-4xl font-bold stat-num text-[#FF9F0A]">{streakDays}</div>
                                <div className="text-sm text-[var(--text-muted)] mb-1">days</div>
                            </div>
                            <div className="text-xs text-[var(--text-muted)]">
                                {streakDays === 0 ? "Start today!" : streakDays < 3 ? "Keep going!" : streakDays < 7 ? "Building momentum" : "🔥 On fire!"}
                            </div>
                        </>
                    ) : <Skeleton className="h-12" />}
                </motion.div>
            </div>

            {/* ── Bento Row 2: Quick Launch Buttons ── */}
            <div className="grid grid-cols-2 gap-3">
                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 24 }}
                    onClick={() => setSubView("strength")}
                    className="card p-5 flex flex-col gap-3 text-left relative overflow-hidden group"
                    style={{ background: "rgba(10,132,255,0.08)", borderColor: "rgba(10,132,255,0.2)" }}
                >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" style={{ background: "radial-gradient(circle at 50% 0%, #0A84FF, transparent)" }} />
                    <div className="w-10 h-10 rounded-2xl bg-[#0A84FF]/20 flex items-center justify-center">
                        <Dumbbell className="w-5 h-5 text-[#0A84FF]" />
                    </div>
                    <div>
                        <div className="font-bold text-[var(--text-primary)] text-base">Power Deployment</div>
                        <div className="text-xs text-[var(--text-muted)] mt-0.5">
                            {daysSince < 99 ? `Last: ${daysSince === 0 ? "today" : `${daysSince}d ago`}` : "No sessions yet"}
                        </div>
                    </div>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 24 }}
                    onClick={() => setSubView("cardio")}
                    className="card p-5 flex flex-col gap-3 text-left relative overflow-hidden group"
                    style={{ background: "rgba(255,159,10,0.08)", borderColor: "rgba(255,159,10,0.2)" }}
                >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" style={{ background: "radial-gradient(circle at 50% 0%, #FF9F0A, transparent)" }} />
                    <div className="w-10 h-10 rounded-2xl bg-[#FF9F0A]/20 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-[#FF9F0A]" />
                    </div>
                    <div>
                        <div className="font-bold text-[var(--text-primary)] text-base">Endurance Protocol</div>
                        <div className="text-xs text-[var(--text-muted)] mt-0.5">
                            {lastCardioKm > 0 ? `Last: ${lastCardioKm.toFixed(1)}km` : "No sessions yet"}
                        </div>
                    </div>
                </motion.button>
            </div>

            {/* ── Bento Row 3: Recent activity + Stats ── */}
            {dataLoaded && (recentWorkouts.length > 0 || recentActivities.length > 0) && (
                <div className="card p-4 space-y-3">
                    <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">Recent Sessions</div>
                    {[...recentWorkouts.slice(0, 2).map(w => ({ type: "strength" as const, name: w.name, value: `${Math.round(w.total_volume_kg || 0).toLocaleString()}kg`, date: w.timestamp?.toDate?.() })),
                    ...recentActivities.slice(0, 2).map(a => ({ type: "cardio" as const, name: a.name || a.type, value: a.distance_km ? `${a.distance_km.toFixed(1)}km` : `${a.duration_min}min`, date: a.timestamp?.toDate?.() })),
                    ].sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0)).slice(0, 3).map((s, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs ${s.type === "strength" ? "bg-[#0A84FF]/15 text-[#0A84FF]" : "bg-[#FF9F0A]/15 text-[#FF9F0A]"}`}>
                                {s.type === "strength" ? <Dumbbell className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm text-[var(--text-primary)] font-medium truncate capitalize">{s.name}</div>
                                <div className="text-xs text-[var(--text-muted)]">{s.date ? s.date.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" }) : ""}</div>
                            </div>
                            <div className="text-sm font-bold stat-num text-[var(--text-secondary)]">{s.value}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Bento Row 4: Achievements ── */}
            {dataLoaded && (
                <div className="card p-5">
                    <AchievementBadges workouts={recentWorkouts} activities={recentActivities} />
                </div>
            )}
            {!dataLoaded && <Skeleton className="h-48" />}
        </motion.div>
    );
}
