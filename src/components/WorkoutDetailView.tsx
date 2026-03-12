"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Target, Dumbbell, Flame, CheckCircle2, ChevronRight, Info } from "lucide-react";
import dynamic from "next/dynamic";
import { Timestamp } from "firebase/firestore";

const AnatomyMap = dynamic<any>(() => import("./BodyMap2D"), { ssr: false });

export interface WorkoutDetail {
    id?: string;
    name: string;
    description?: string;
    emoji?: string;
    color?: string;
    duration_min?: number;
    estimatedMinutes?: number;
    timestamp?: any;
    createdAt?: any;
    total_volume_kg?: number;
    muscle_groups?: string[];
    targetMuscles?: string[];
    exercises: any[];
}

interface Props {
    workout: WorkoutDetail | null;
    onClose: () => void;
    onStart?: (workout: any) => void;
}

export default function WorkoutDetailView({ workout, onClose, onStart }: Props) {
    if (!workout) return null;

    const name = workout.name;
    const emoji = workout.emoji || "🏋️";
    const color = workout.color || "#3B82F6";
    const duration = workout.duration_min || workout.estimatedMinutes || 0;
    
    const dateStr = workout.timestamp 
        ? (workout.timestamp.toDate?.() || new Date(workout.timestamp)).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
        : workout.createdAt
        ? (workout.createdAt.toDate?.() || new Date(workout.createdAt)).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
        : null;

    const muscles = workout.muscle_groups || workout.targetMuscles || [];
    const exercises = workout.exercises || [];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6 overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="w-full max-w-2xl bg-[#0f0f15] border border-white/10 shadow-2xl rounded-[32px] flex flex-col max-h-[90vh] overflow-hidden"
                >
                    {/* Header Banner */}
                    <div className="relative shrink-0 p-6 flex items-start justify-between bg-gradient-to-br" style={{ backgroundImage: `linear-gradient(135deg, ${color}33 0%, transparent 100%)` }}>
                        <div className="flex gap-4">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg border border-white/10" style={{ backgroundColor: `${color}22` }}>
                                {emoji}
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white tracking-tight">{name}</h3>
                                <div className="flex items-center gap-3 mt-1.5 text-[var(--text-muted)] text-sm font-medium">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" /> {duration}m
                                    </div>
                                    {dateStr && (
                                        <>
                                            <div className="w-1 h-1 rounded-full bg-white/20" />
                                            <div>{dateStr}</div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors border border-white/5">
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
                        {/* Muscle Map Section */}
                        <div className="flex flex-col md:flex-row gap-8 items-center bg-white/[0.02] rounded-[24px] p-6 border border-white/[0.05]">
                            <div className="w-32 h-44 shrink-0 flex items-center justify-center">
                                <AnatomyMap activeMuscles={muscles} className="scale-110" />
                            </div>
                            <div className="flex-1 space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                                    <Target className="w-3.5 h-3.5 text-blue-400" /> Target Muscle Groups
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {muscles.map(m => (
                                        <span key={m} className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold capitalize">
                                            {m.replace("_", " ")}
                                        </span>
                                    ))}
                                    {muscles.length === 0 && <span className="text-xs text-[var(--text-muted)]">No specific groups logged</span>}
                                </div>
                                {workout.description && (
                                    <p className="text-sm text-[var(--text-muted)] leading-relaxed mt-2 italic">
                                        "{workout.description}"
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Exercises Section */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2 px-1">
                                <Dumbbell className="w-3.5 h-3.5 text-purple-400" /> Protocol Execution
                            </h4>
                            <div className="space-y-3">
                                {exercises.map((ex, i) => {
                                    const setData = ex.sets || [];
                                    const totalSets = typeof ex.sets === 'number' ? ex.sets : setData.length;
                                    const reps = ex.reps || (setData[0]?.reps) || "—";
                                    const weight = ex.weightKg !== undefined ? ex.weightKg : (setData[0]?.weight_kg !== undefined ? setData[0].weight_kg : null);

                                    return (
                                        <div key={i} className="group flex items-center gap-4 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.05] rounded-2xl p-4 transition-all">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-[var(--text-muted)] group-hover:text-white transition-colors">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold text-white truncate">{ex.name}</div>
                                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[var(--text-muted)] uppercase font-extrabold tracking-tighter">
                                                    <span className="text-purple-400/80">{ex.muscleGroup?.replace("_", " ") || "Full Body"}</span>
                                                    <span>•</span>
                                                    <span>{totalSets} Sets × {reps} Reps</span>
                                                    {weight !== null && weight > 0 && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-blue-400/80">{weight}kg</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            {ex.instructions && (
                                                <div className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Info className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    {onStart && (
                        <div className="p-6 bg-white/[0.02] border-t border-white/5">
                            <button
                                onClick={() => onStart(workout)}
                                className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                                style={{
                                    background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
                                    color: "white",
                                    boxShadow: `0 8px 24px ${color}33`
                                }}
                            >
                                <Flame className="w-5 h-5 fill-current" /> Deploy Protocol
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
