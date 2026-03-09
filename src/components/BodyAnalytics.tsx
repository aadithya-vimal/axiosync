"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Dumbbell, CalendarDays } from "lucide-react";
import AnatomyMap from "./BodyMap3D";
import { Timestamp } from "firebase/firestore";
import type { MuscleGroup } from "@/lib/WorkoutEngine";

interface BodyAnalyticsProps {
    recentWorkouts: any[];
    nutrientAura: boolean;
}

const MUSCLE_BUTTONS: { id: MuscleGroup; label: string; color: string }[] = [
    { id: "chest", label: "Chest", color: "#3B82F6" },
    { id: "back", label: "Back", color: "#A855F7" },
    { id: "shoulders", label: "Shoulders", color: "#06B6D4" },
    { id: "biceps", label: "Biceps", color: "#F97316" },
    { id: "triceps", label: "Triceps", color: "#EAB308" },
    { id: "core", label: "Core", color: "#F59E0B" },
    { id: "quads", label: "Quads", color: "#22C55E" },
    { id: "glutes", label: "Glutes", color: "#EF4444" },
    { id: "hamstrings", label: "Hamstrings", color: "#10B981" },
    { id: "calves", label: "Calves", color: "#14B8A6" },
];

export default function BodyAnalytics({ recentWorkouts }: BodyAnalyticsProps) {
    const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);

    // Derive all recently-worked muscles for passive highlighting
    const recentMuscles = useMemo<MuscleGroup[]>(() => {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const seen = new Set<MuscleGroup>();
        recentWorkouts?.forEach(w => {
            const ts = w.timestamp as Timestamp;
            if (!ts || ts.toMillis() < sevenDaysAgo) return;
            w.exercises?.forEach((ex: any) => {
                const mg = (ex.muscleGroup || "").toLowerCase() as MuscleGroup;
                if (mg) seen.add(mg);
            });
        });
        return Array.from(seen);
    }, [recentWorkouts]);

    const activeMuscles: MuscleGroup[] = selectedMuscle ? [selectedMuscle] : recentMuscles;

    const history = useMemo(() => {
        if (!selectedMuscle || !recentWorkouts) return [];
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return recentWorkouts.filter(w => {
            const ts = w.timestamp as Timestamp;
            if (!ts || ts.toMillis() < sevenDaysAgo) return false;
            return w.exercises?.some((ex: any) => {
                const mg = (ex.muscleGroup || "").toLowerCase();
                if (selectedMuscle === "back" && (mg.includes("back") || mg.includes("lat"))) return true;
                if (selectedMuscle === "quads" && (mg.includes("quad") || mg.includes("leg"))) return true;
                return mg.includes(selectedMuscle);
            });
        }).sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
    }, [selectedMuscle, recentWorkouts]);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Body Analytics</h2>
                <p className="text-sm text-zinc-500 mt-1">
                    {selectedMuscle
                        ? `Showing ${selectedMuscle} training history (7 days)`
                        : "Muscles lit = trained in last 7 days. Tap to filter history."}
                </p>
            </div>

            {/* Two-column layout: SVG map + history */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-4 md:items-start">
                {/* Left: SVG anatomy map */}
                <div
                    className="shrink-0 rounded-2xl p-4 w-full md:w-auto flex justify-center"
                    style={{
                        background: "rgba(9,9,11,0.6)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        backdropFilter: "blur(12px)",
                        minWidth: 160,
                    }}
                >
                    <AnatomyMap
                        activeMuscles={activeMuscles}
                        onMuscleClick={(m) => setSelectedMuscle(prev => prev === m ? null : m)}
                    />
                </div>

                {/* Right: Muscle selector + history */}
                <div className="flex-1 space-y-3 min-w-full md:min-w-0">
                    {/* Muscle tag buttons */}
                    <div className="flex flex-wrap gap-1.5">
                        {MUSCLE_BUTTONS.map(m => {
                            const isWorked = recentMuscles.includes(m.id);
                            const isSelected = selectedMuscle === m.id;
                            return (
                                <motion.button
                                    key={m.id}
                                    whileTap={{ scale: 0.94 }}
                                    onClick={() => setSelectedMuscle(prev => prev === m.id ? null : m.id)}
                                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-200"
                                    style={
                                        isSelected
                                            ? { background: `${m.color}22`, border: `1px solid ${m.color}60`, color: m.color }
                                            : isWorked
                                                ? { background: `${m.color}10`, border: `1px solid ${m.color}35`, color: m.color, opacity: 0.8 }
                                                : { background: "var(--bg-elevated)", border: "1px solid rgba(255,255,255,0.06)", color: "var(--text-muted)" }
                                    }
                                >
                                    {m.label}
                                    {isWorked && !isSelected && <span className="ml-1 opacity-60">·</span>}
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Training history */}
                    <AnimatePresence mode="wait">
                        {selectedMuscle ? (
                            <motion.div
                                key="history"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="space-y-2"
                            >
                                {history.length === 0 ? (
                                    <div
                                        className="rounded-2xl p-5 text-center"
                                        style={{ background: "var(--bg-elevated)", border: "1px solid rgba(255,255,255,0.06)" }}
                                    >
                                        <Activity className="w-7 h-7 text-zinc-700 mx-auto mb-2" />
                                        <p className="text-xs text-zinc-500">No {selectedMuscle} work logged in the last 7 days.</p>
                                    </div>
                                ) : (
                                    history.slice(0, 4).map((w, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: 8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.06 }}
                                            className="rounded-2xl p-3"
                                            style={{ background: "var(--bg-elevated)", border: "1px solid rgba(255,255,255,0.06)" }}
                                        >
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <Dumbbell className="w-3.5 h-3.5 text-zinc-500" />
                                                    <span className="text-xs font-semibold text-white truncate">{w.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                                                    <CalendarDays className="w-3 h-3" />
                                                    {w.timestamp.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-zinc-600">
                                                {w.exercises?.filter((ex: any) => (ex.muscleGroup || "").toLowerCase().includes(selectedMuscle))
                                                    .slice(0, 3)
                                                    .map((ex: any, j: number) => (
                                                        <span key={j} className="mr-2">{ex.name} ({ex.sets?.length || 0}×)</span>
                                                    ))}
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="rounded-2xl p-5 text-center"
                                style={{ background: "var(--bg-elevated)", border: "1px dashed rgba(255,255,255,0.06)" }}
                            >
                                <p className="text-xs text-zinc-600">Select a muscle group to view training history</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
