"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Dumbbell, Activity, Eye } from "lucide-react";
import WorkoutTracker from "@/components/WorkoutTracker";
import WorkoutDetailView from "../WorkoutDetailView";
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
    todayCalories = 0,
    todayProteinG = 0,
    calTarget = 2500,
    initialWorkoutPlan,
    onClearWorkoutPlan,
    onRefresh,
    onWorkoutStateChange,
}: {
    recentWorkouts: any[];
    recentActivities: any[];
    readinessPct: number;
    streakDays: number;
    latestMetric: any;
    dataLoaded: boolean;
    todayCalories?: number;
    todayProteinG?: number;
    calTarget?: number;
    initialWorkoutPlan?: any;
    onClearWorkoutPlan?: () => void;
    onRefresh?: () => Promise<void>;
    onWorkoutStateChange?: (state: string) => void;
}) {
    const [subView, setSubView] = useState<"home" | "strength" | "cardio">("home");
    const [viewingWorkout, setViewingWorkout] = useState<any | null>(null);
    const [showDetail, setShowDetail] = useState(false);

    const [activeWorkoutPlan, setActiveWorkoutPlan] = useState<any>(null);

    // Auto-switch to strength tab if an initial plan is loaded
    useEffect(() => {
        if (initialWorkoutPlan) {
            let plan = { ...initialWorkoutPlan };
            // If it's a CustomWorkout (exercises have sets as array), normalize it
            if (plan.exercises && plan.exercises.length > 0 && Array.isArray(plan.exercises[0].sets)) {
                plan = {
                    ...plan,
                    exercises: plan.exercises.map((ex: any) => ({
                        ...ex,
                        sets: ex.sets.length,
                        reps: ex.sets[0]?.reps || (ex.sets[0]?.time_s ? `${ex.sets[0].time_s}s` : "12"),
                        restSeconds: ex.sets[0]?.restSeconds || 60,
                        // Ensure required WorkoutPlan fields
                        id: ex.exerciseId || Math.random().toString(),
                        imageUrl: ex.imageUrl || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
                        instructions: ex.instructions || ex.notes || "No instructions provided.",
                        muscleGroup: ex.muscleGroup || "full_body",
                        equipment: ex.modality || "Any",
                    }))
                };
            }
            setActiveWorkoutPlan(plan);
            setSubView("strength");
        } else {
            setActiveWorkoutPlan(null);
        }
    }, [initialWorkoutPlan]);

    // Workout recency
    const lastWorkoutTs = recentWorkouts[0]?.timestamp?.toDate?.();
    const daysSince = lastWorkoutTs
        ? Math.floor((Date.now() - lastWorkoutTs.getTime()) / 86400000)
        : 99;
    const lastCardioKm = recentActivities[0]?.distance_km || 0;
    const todayWorkouts = recentWorkouts.filter(w => {
        const d = w.timestamp?.toDate?.();
        return d && new Date().toDateString() === d.toDateString();
    });
    const todayWorkoutNames = todayWorkouts.map(w => w.name);
    const totalToday = todayWorkouts.reduce((a: number, w: any) => a + (w.total_volume_kg || 0), 0);

    const scoreColor = readinessPct >= 80 ? "#30D158" : readinessPct >= 60 ? "#FF9F0A" : "#FF453A";

    if (subView === "strength") {
        return (
            <div className="pb-32">
                <button onClick={() => {
                    setSubView("home");
                    onClearWorkoutPlan?.();
                }} className="flex items-center gap-2 text-[#0A84FF] text-sm font-semibold mb-5 hover:opacity-80 transition-opacity">
                    ← Back
                </button>
                <WorkoutTracker
                    initialPlan={activeWorkoutPlan}
                    onClearPlan={onClearWorkoutPlan}
                    onRefresh={onRefresh}
                    onStateChange={onWorkoutStateChange}
                />
            </div>
        );
    }

    if (subView === "cardio") {
        return (
            <div className="pb-32">
                <button onClick={() => setSubView("home")} className="flex items-center gap-2 text-[#FF9F0A] text-sm font-semibold mb-5 hover:opacity-80 transition-opacity">
                    ← Back
                </button>
                <CardioTracker onRefresh={onRefresh} />
            </div>
        );
    }

    return (
        <motion.div
            variants={pageVariants} initial="initial" animate="enter" exit="exit"
            className="space-y-4 pb-32"
        >
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight px-1 pt-2">Workouts</h1>

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
                        todayCalories={todayCalories}
                        todayProteinG={todayProteinG}
                        calTarget={calTarget}
                        todayWorkoutNames={todayWorkoutNames}
                    />
                </div>
            )}
            {!dataLoaded && <Skeleton className="h-40" />}

            {/* ── Hero Readiness Card (full-width, mobile-first) ── */}
            <motion.div
                className="relative overflow-hidden rounded-[24px] p-5 shadow-2xl"
                style={{
                    transformPerspective: 1000,
                    background: `linear-gradient(135deg, ${scoreColor}14 0%, ${scoreColor}06 50%, rgba(8,8,12,0.6) 100%)`,
                    border: `1px solid ${scoreColor}25`,
                    boxShadow: `0 0 40px ${scoreColor}12, 0 4px 24px rgba(0,0,0,0.4)`,
                }}
                whileHover={{ scale: 1.02, rotateX: 5, rotateY: 5, z: 10 }}
                whileTap={{ scale: 0.99, rotateX: 0, rotateY: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
                {/* Ambient glow blob */}
                <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-20 pointer-events-none blur-2xl"
                    style={{ background: scoreColor }}
                />

                <div className="flex items-center gap-5">
                    {/* Animated readiness ring */}
                    <div className="relative shrink-0">
                        <svg width="76" height="76" viewBox="0 0 76 76" className="-rotate-90">
                            <circle cx="38" cy="38" r="30" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                            <motion.circle
                                cx="38" cy="38" r="30" fill="none"
                                stroke={scoreColor}
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 30}`}
                                initial={{ strokeDashoffset: 2 * Math.PI * 30 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 30 * (1 - readinessPct / 100) }}
                                transition={{ duration: 1.1, ease: "easeOut", delay: 0.1 }}
                                style={{ filter: `drop-shadow(0 0 6px ${scoreColor}90)` }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-xl font-bold stat-num" style={{ color: scoreColor }}>
                                {dataLoaded ? readinessPct : "—"}
                            </span>
                            <span className="text-[8px] text-[var(--text-muted)] font-bold uppercase tracking-widest -mt-0.5">Rdy</span>
                        </div>
                    </div>

                    {/* Stats column */}
                    <div className="flex-1 space-y-2">
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-0.5">Today's Readiness</div>
                            <div className="text-base font-semibold text-[var(--text-primary)]">
                                {dataLoaded
                                    ? readinessPct >= 80 ? "Peak — go hard 🔥" : readinessPct >= 60 ? "Good — train steady" : "Low — recover first"
                                    : "Loading…"
                                }
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div>
                                <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-widest">Streak</div>
                                <div className="text-lg font-bold stat-num text-[#FF9F0A]">
                                    {dataLoaded ? `${streakDays}d` : "—"}
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-widest">Volume</div>
                                <div className="text-lg font-bold stat-num text-[#30D158]">
                                    {dataLoaded ? `${Math.round(totalToday)}kg` : "—"}
                                </div>
                            </div>
                            {lastCardioKm > 0 && (
                                <div>
                                    <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-widest">Last Run</div>
                                    <div className="text-lg font-bold stat-num text-[#0A84FF]">{lastCardioKm.toFixed(1)}km</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── Quick Launch Buttons ── */}
            <div className="grid grid-cols-2 gap-3">
                <motion.button
                    onClick={() => setSubView("strength")}
                    whileHover={{ scale: 1.03, y: -4, rotateX: 5, rotateY: 5 }}
                    whileTap={{ scale: 0.96, rotateX: 0, rotateY: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 24 }}
                    className="relative overflow-hidden rounded-[22px] p-5 flex flex-col gap-3 text-left shadow-[0_4px_20px_rgba(10,132,255,0.12)]"
                    style={{ transformPerspective: 1000, 
                        background: "linear-gradient(145deg, rgba(10,132,255,0.15) 0%, rgba(10,132,255,0.06) 100%)",
                        border: "1px solid rgba(10,132,255,0.22)",
                        minHeight: 110,
                    }}
                >
                    <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity pointer-events-none"
                        style={{ background: "radial-gradient(circle at 30% 0%, rgba(10,132,255,0.14), transparent 60%)" }}
                    />
                    <div className="w-11 h-11 rounded-[14px] flex items-center justify-center" style={{ background: "rgba(10,132,255,0.18)", border: "1px solid rgba(10,132,255,0.25)" }}>
                        <Dumbbell className="w-5 h-5 text-[#0A84FF]" />
                    </div>
                    <div>
                        <div className="font-bold text-[var(--text-primary)] text-[15px] leading-tight">Strength Training</div>
                        <div className="text-xs text-[var(--text-muted)] mt-0.5">
                            {daysSince < 99 ? `Last: ${daysSince === 0 ? "today" : `${daysSince}d ago`}` : "Log sets, reps & weight"}
                        </div>
                    </div>
                </motion.button>

                <motion.button
                    onClick={() => setSubView("cardio")}
                    whileHover={{ scale: 1.03, y: -4, rotateX: 5, rotateY: -5 }}
                    whileTap={{ scale: 0.96, rotateX: 0, rotateY: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 24 }}
                    className="relative overflow-hidden rounded-[22px] p-5 flex flex-col gap-3 text-left shadow-[0_4px_20px_rgba(255,159,10,0.10)]"
                    style={{
                        transformPerspective: 1000,
                        background: "linear-gradient(145deg, rgba(255,159,10,0.15) 0%, rgba(255,159,10,0.06) 100%)",
                        border: "1px solid rgba(255,159,10,0.22)",
                        minHeight: 110,
                    }}
                >
                    <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity pointer-events-none"
                        style={{ background: "radial-gradient(circle at 30% 0%, rgba(255,159,10,0.14), transparent 60%)" }}
                    />
                    <div className="w-11 h-11 rounded-[14px] flex items-center justify-center" style={{ background: "rgba(255,159,10,0.18)", border: "1px solid rgba(255,159,10,0.25)" }}>
                        <Activity className="w-5 h-5 text-[#FF9F0A]" />
                    </div>
                    <div>
                        <div className="font-bold text-[var(--text-primary)] text-[15px] leading-tight">Cardio &amp; Endurance</div>
                        <div className="text-xs text-[var(--text-muted)] mt-0.5">
                            {lastCardioKm > 0 ? `Last run: ${lastCardioKm.toFixed(1)} km` : "Running, cycling & more"}
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
                    ].sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0)).slice(0, 3).map((s, i) => {
                        const originalItem = s.type === "strength" 
                            ? recentWorkouts.find(w => w.timestamp?.toDate?.()?.getTime() === s.date?.getTime())
                            : recentActivities.find(a => a.timestamp?.toDate?.()?.getTime() === s.date?.getTime());
                        
                        return (
                            <div key={i} className="flex items-center gap-3">
                                <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs ${s.type === "strength" ? "bg-[#0A84FF]/15 text-[#0A84FF]" : "bg-[#FF9F0A]/15 text-[#FF9F0A]"}`}>
                                    {s.type === "strength" ? <Dumbbell className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-[var(--text-primary)] font-medium truncate capitalize">{s.name}</div>
                                    <div className="text-xs text-[var(--text-muted)]">{s.date ? s.date.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" }) : ""}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-sm font-bold stat-num text-[var(--text-secondary)]">{s.value}</div>
                                    {s.type === "strength" && (
                                        <button 
                                            onClick={() => setViewingWorkout(originalItem)}
                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-all"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Bento Row 4: Achievements ── */}
            {dataLoaded && (
                <div className="card p-5">
                    <AchievementBadges workouts={recentWorkouts} activities={recentActivities} />
                </div>
            )}
            {!dataLoaded && <Skeleton className="h-48" />}

            <WorkoutDetailView 
                workout={viewingWorkout} 
                onClose={() => setViewingWorkout(null)} 
            />
        </motion.div>
    );
}
