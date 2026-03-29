"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Dumbbell, CalendarDays, LineChart as ChartIcon, Accessibility } from "lucide-react";
import dynamic from "next/dynamic";
import { Timestamp } from "firebase/firestore";
import type { MuscleGroup } from "@/lib/WorkoutEngine";
import BodyMetrics from "./BodyMetrics";

// Import using dynamic to prevent SSR issues
const BodyModel = dynamic(() => import("react-body-highlighter"), { ssr: false });

interface BodyAnalyticsProps {
    recentWorkouts: any[];
    nutrientAura: boolean;
}

const MUSCLE_BUTTONS: { id: MuscleGroup; label: string; color: string }[] = [
    { id: "chest",      label: "Chest",      color: "#3B82F6" },
    { id: "back",       label: "Back",       color: "#A855F7" },
    { id: "shoulders",  label: "Shoulders",  color: "#06B6D4" },
    { id: "biceps",     label: "Biceps",     color: "#F97316" },
    { id: "triceps",    label: "Triceps",    color: "#EAB308" },
    { id: "core",       label: "Core",       color: "#F59E0B" },
    { id: "quads",      label: "Quads",      color: "#22C55E" },
    { id: "glutes",     label: "Glutes",     color: "#EF4444" },
    { id: "hamstrings", label: "Hamstrings", color: "#10B981" },
    { id: "calves",     label: "Calves",     color: "#14B8A6" },
];

const MUSCLE_MAP: Record<string, string[]> = {
    chest:      ["chest"],
    back:       ["upper-back", "lower-back", "trapezius"],
    shoulders:  ["front-deltoids", "back-deltoids"],
    core:       ["abs", "obliques"],
    quads:      ["quadriceps"],
    glutes:     ["gluteal"],
    hamstrings: ["hamstring"],
    calves:     ["calves"],
    biceps:     ["biceps"],
    triceps:    ["triceps"],
};

const REVERSE_MAP: Record<string, MuscleGroup> = {
    "chest": "chest", "upper-back": "back", "lower-back": "back", "trapezius": "back",
    "front-deltoids": "shoulders", "back-deltoids": "shoulders",
    "abs": "core", "obliques": "core",
    "quadriceps": "quads", "gluteal": "glutes", "hamstring": "hamstrings",
    "calves": "calves", "biceps": "biceps", "triceps": "triceps",
};

export default function BodyAnalytics({ recentWorkouts, nutrientAura }: BodyAnalyticsProps) {
    const [view, setView] = useState<"anatomy" | "metrics">("anatomy");
    const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);

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

    const bodyData: any[] = useMemo(() => {
        let muscles: string[] = [];
        activeMuscles.forEach(m => {
            if (MUSCLE_MAP[m]) muscles.push(...MUSCLE_MAP[m]);
        });
        return [{ name: "Active", muscles: Array.from(new Set(muscles)) }];
    }, [activeMuscles]);

    const handleBodyClick = ({ muscle }: { muscle: string }) => {
        const mapped = REVERSE_MAP[muscle];
        if (mapped) setSelectedMuscle(prev => prev === mapped ? null : mapped);
    };

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
        <div className="space-y-6">
            {/* View Toggle */}
            <div className="flex bg-white/[0.04] p-1 rounded-2xl border border-white/[0.06] w-fit mx-auto sm:mx-0">
                <button
                    onClick={() => setView("anatomy")}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${view === "anatomy" ? "bg-white/[0.08] text-white shadow-lg" : "text-[var(--text-muted)] hover:text-white"}`}
                >
                    <Accessibility className="w-4 h-4" />
                    Anatomy
                </button>
                <button
                    onClick={() => setView("metrics")}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${view === "metrics" ? "bg-white/[0.08] text-white shadow-lg" : "text-[var(--text-muted)] hover:text-white"}`}
                >
                    <ChartIcon className="w-4 h-4" />
                    Metrics
                </button>
            </div>

            <AnimatePresence mode="wait">
                {view === "anatomy" ? (
                    <motion.div
                        key="anatomy"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* Anatomy Header */}
                        <div>
                            <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Anatomy Analysis</h2>
                            <p className="text-sm text-[var(--text-muted)] mt-1">
                                {selectedMuscle
                                    ? `Showing ${selectedMuscle} training history (last 7 days)`
                                    : "Tap a muscle group or click on the body map to filter history."}
                            </p>
                        </div>

                        {/* Muscle selector chips */}
                        <div className="flex flex-wrap gap-2">
                            {MUSCLE_BUTTONS.map(m => {
                                const isWorked = recentMuscles.includes(m.id);
                                const isSelected = selectedMuscle === m.id;
                                return (
                                    <motion.button
                                        key={m.id}
                                        whileTap={{ scale: 0.93 }}
                                        onClick={() => setSelectedMuscle(prev => prev === m.id ? null : m.id)}
                                        className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                                        style={
                                            isSelected
                                                ? { background: `${m.color}28`, border: `1.5px solid ${m.color}`, color: m.color }
                                                : isWorked
                                                    ? { background: `${m.color}12`, border: `1px solid ${m.color}40`, color: m.color, opacity: 0.85 }
                                                    : { background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }
                                        }
                                    >
                                        {isWorked && !isSelected && <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{ background: m.color }} />}
                                        {m.label}
                                    </motion.button>
                                );
                            })}
                            {selectedMuscle && (
                                <button
                                    onClick={() => setSelectedMuscle(null)}
                                    className="px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-400 border border-white/10 hover:border-white/20 transition-colors"
                                >
                                    ✕ Clear
                                </button>
                            )}
                        </div>

                        {/* Body map — LARGE, dual view */}
                        <div className="w-full rounded-3xl border border-white/[0.06] bg-[#0F172A]/60 p-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-8">
                            <div className="relative">
                                <p className="text-center text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2">Front</p>
                                {nutrientAura && (
                                    <motion.div 
                                        animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                        className="absolute inset-0 bg-blue-500/10 blur-[40px] rounded-full pointer-events-none" 
                                    />
                                )}
                                <div className="w-[220px] sm:w-[260px] relative z-10">
                                    <BodyModel
                                        data={bodyData}
                                        style={{ width: "100%", height: "auto" }}
                                        bodyColor="#1e293b"
                                        highlightedColors={["#3B82F6", "#8B5CF6"]}
                                        type="anterior"
                                        onClick={handleBodyClick}
                                    />
                                </div>
                            </div>
                            <div>
                                <p className="text-center text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2">Back</p>
                                <div className="w-[220px] sm:w-[260px]">
                                    <BodyModel
                                        data={bodyData}
                                        style={{ width: "100%", height: "auto" }}
                                        bodyColor="#1e293b"
                                        highlightedColors={["#3B82F6", "#8B5CF6"]}
                                        type="posterior"
                                        onClick={handleBodyClick}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Training history */}
                        <div className="min-h-[100px]">
                            {selectedMuscle ? (
                                <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] px-1">
                                        {selectedMuscle.charAt(0).toUpperCase() + selectedMuscle.slice(1)} — Recent Sessions
                                    </p>
                                    {history.length === 0 ? (
                                        <div className="rounded-2xl p-6 text-center" style={{ background: "var(--bg-elevated)", border: "1px dashed var(--border-subtle)" }}>
                                            <Activity className="w-7 h-7 text-[var(--text-muted)] mx-auto mb-2" />
                                            <p className="text-xs text-[var(--text-muted)]">No {selectedMuscle} work logged in the last 7 days.</p>
                                        </div>
                                    ) : (
                                        history.slice(0, 4).map((w, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: 8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.06 }}
                                                className="rounded-2xl p-3"
                                                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                                            >
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Dumbbell className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                                                        <span className="text-xs font-semibold text-[var(--text-primary)] truncate">{w.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                                                        <CalendarDays className="w-3 h-3" />
                                                        {w.timestamp.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                    </div>
                                                </div>
                                                <div className="text-[10px] text-[var(--text-muted)]">
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
                                <div className="rounded-2xl p-5 text-center" style={{ background: "var(--bg-elevated)", border: "1px dashed var(--border-subtle)" }}>
                                    <p className="text-xs text-[var(--text-muted)]">Select a muscle group above or tap on the body map to view your training history.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="metrics"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <BodyMetrics />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
