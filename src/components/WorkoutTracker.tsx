"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Play, Pause, SkipForward, ChevronLeft, Flame, Clock,
    CheckCircle, X, Trophy, Dumbbell, ChevronRight, RotateCcw, AlertTriangle, Video,
    Sparkles, Zap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { addWorkoutLog } from "@/lib/firestore";
import { WORKOUT_PLANS, WorkoutPlan, Exercise } from "@/lib/workoutData";
import {
    generateWorkout, FOCUS_OPTIONS, GOAL_OPTIONS, ALL_EQUIPMENT,
    DURATION_OPTIONS, INTENSITY_OPTIONS, STYLE_OPTIONS,
    type Goal, type Equipment, type GeneratedWorkout, type GeneratedExercise,
    type Duration, type Intensity, type WorkoutStyle,
} from "@/lib/WorkoutEngine";
import AnatomyMap from "./BodyMap2D";

// ── Types ────────────────────────────────────────────────────────────────────

type EngineState = "browse" | "preview" | "active" | "rest" | "complete";

interface SetLog {
    reps: number;
    weightKg: number;
    completed: boolean;
}

interface ExerciseLog {
    exerciseId: string;
    name: string;
    sets: SetLog[];
}

interface SessionState {
    plan: WorkoutPlan;
    exerciseIndex: number;
    setIndex: number;
    sessionLogs: ExerciseLog[];
    startedAt: Date;
    elapsed: number; // seconds
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(s: number): string {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
}

function calcTotalVolume(logs: ExerciseLog[]): number {
    return logs.reduce((total, ex) =>
        total + ex.sets.reduce((s, set) => s + (set.completed ? set.reps * set.weightKg : 0), 0),
        0
    );
}

// ── SVG Rest Ring ────────────────────────────────────────────────────────────

function RestRing({ remaining, total, color }: { remaining: number; total: number; color: string }) {
    const r = 54;
    const circ = 2 * Math.PI * r;
    const progress = remaining / total;
    return (
        <svg width="136" height="136" viewBox="0 0 136 136">
            <circle cx="68" cy="68" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <circle
                cx="68" cy="68" r={r} fill="none"
                stroke={color} strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${progress * circ} ${circ}`}
                transform="rotate(-90 68 68)"
                style={{ transition: "stroke-dasharray 0.5s linear" }}
            />
        </svg>
    );
}

// ── Plan Card ─────────────────────────────────────────────────────────────────

function PlanCard({ plan, onSelect }: { plan: WorkoutPlan; onSelect: () => void }) {
    const diffLabels = ["", "Beginner", "Intermediate", "Advanced"];
    return (
        <button
            onClick={onSelect}
            className="w-full text-left card overflow-hidden hover:border-[var(--border-subtle)] active:scale-[0.98] transition-all duration-300 group"
        >
            <div className="relative h-36 overflow-hidden">
                <img
                    src={plan.exercises[0].imageUrl}
                    alt={plan.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div
                    className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: `${plan.color}25`, color: plan.color, border: `1px solid ${plan.color}45` }}
                >
                    {plan.emoji} {diffLabels[plan.difficulty]}
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-[var(--text-primary)] font-bold text-lg leading-tight tracking-tight">{plan.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{plan.estimatedMinutes} min</span>
                        <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3" />{plan.exercises.length} exercises</span>
                    </div>
                </div>
            </div>
            <div className="p-3">
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{plan.description}</p>
            </div>
        </button>
    );
}

// ── Preview Sheet ─────────────────────────────────────────────────────────────

function PreviewSheet({ plan, onStart, onBack }: { plan: WorkoutPlan; onStart: () => void; onBack: () => void }) {
    return (
        <div className="space-y-5 pb-32">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="w-9 h-9 rounded-full bg-white/[0.07] flex items-center justify-center hover:bg-white/[0.12] transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{plan.emoji} {plan.name}</h1>
                    <p className="text-sm text-[var(--text-muted)]">{plan.exercises.length} exercises · ~{plan.estimatedMinutes} min</p>
                </div>
            </div>

            {/* Hero */}
            <div className="card overflow-hidden h-48 relative">
                <img src={plan.exercises[0].imageUrl} alt={plan.name} className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${plan.color}40, rgba(0,0,0,0.8))` }} />
                <div className="absolute bottom-4 left-4 flex gap-4">
                    {[
                        { label: "Exercises", value: plan.exercises.length },
                        { label: "Est. time", value: `${plan.estimatedMinutes}m` },
                        { label: "Difficulty", value: ["", "Easy", "Med", "Hard"][plan.difficulty] },
                    ].map(({ label, value }) => (
                        <div key={label}>
                            <div className="text-xl font-bold text-[var(--text-primary)]">{value}</div>
                            <div className="text-xs text-[var(--text-muted)]">{label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Exercise list */}
            <div className="card divide-y divide-white/[0.06]">
                {plan.exercises.map((ex, i) => (
                    <div key={ex.id} className="flex items-center gap-3 p-3.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: `${plan.color}20`, color: plan.color }}>
                            {i + 1}
                        </div>
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                            <img src={ex.imageUrl} alt={ex.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-[var(--text-primary)]">{ex.name}</div>
                            <div className="text-xs text-[var(--text-muted)]">{ex.sets} sets · {ex.reps} reps · {ex.restSeconds}s rest</div>
                        </div>
                        <div className="text-xs text-[var(--text-muted)] capitalize">{ex.muscleGroup.replace("_", " ")}</div>
                    </div>
                ))}
            </div>

            <button
                onClick={onStart}
                className="btn btn-primary w-full text-base py-4"
                style={{ boxShadow: `0 12px 32px ${plan.color}50` }}
            >
                <Play className="w-5 h-5" fill="currentColor" /> Commence Operation
            </button>
        </div>
    );
}

// ── Active Exercise View ──────────────────────────────────────────────────────

function ActiveExercise({
    session,
    onSetComplete,
    onSkip,
    onEnd,
}: {
    session: SessionState;
    onSetComplete: (reps: number, weightKg: number) => void;
    onSkip: () => void;
    onEnd: (discard?: boolean) => void;
}) {
    const plan = session.plan;
    const ex: Exercise = plan.exercises[session.exerciseIndex];
    const currentLog = session.sessionLogs[session.exerciseIndex];
    const [reps, setReps] = useState(typeof ex.reps === "number" ? ex.reps : parseInt(ex.reps as string) || 12);
    const [showDiscardModal, setShowDiscardModal] = useState(false);
    const [weight, setWeight] = useState(ex.weightKg ?? 0);

    // Update when exercise changes
    useEffect(() => {
        setReps(typeof ex.reps === "number" ? ex.reps : parseInt(ex.reps as string) || 12);
        setWeight(ex.weightKg ?? 0);
    }, [ex]);

    const totalSets = ex.sets;
    const currentSet = session.setIndex + 1;
    const progressPct = ((session.exerciseIndex * ex.sets + session.setIndex) / (plan.exercises.reduce((a, e) => a + e.sets, 0))) * 100;

    return (
        <div className="flex flex-col h-full min-h-screen bg-black pb-safe">
            {/* ── Discard Confirmation Modal ── */}
            {showDiscardModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
                    <div className="card w-full max-w-sm p-6 space-y-4 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-[#FF453A]/15 flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-6 h-6 text-[#FF453A]" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[var(--text-primary)]">Discard Workout?</h3>
                            <p className="text-sm text-[var(--text-muted)] mt-1">Your progress won't be saved. This can't be undone.</p>
                        </div>
                        <div className="flex gap-3">
                            <button className="btn btn-ghost flex-1" onClick={() => setShowDiscardModal(false)}>Maintain Mission</button>
                            <button className="btn btn-danger flex-1" onClick={() => onEnd(true)}>Abort</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top bar */}
            <div className="flex items-center justify-between px-4 pt-6 pb-4">
                <button onClick={() => setShowDiscardModal(true)} className="w-9 h-9 rounded-full bg-white/[0.07] flex items-center justify-center">
                    <X className="w-4 h-4" />
                </button>
                <div className="text-center">
                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-semibold">{plan.name}</div>
                    <div className="text-[var(--text-primary)] text-sm font-semibold mt-0.5">
                        Exercise {session.exerciseIndex + 1}/{plan.exercises.length}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-[var(--text-muted)]">Elapsed</div>
                    <div className="text-sm font-bold text-[var(--text-primary)] stat-num">{formatTime(session.elapsed)}</div>
                </div>
            </div>

            {/* Linear progress */}
            <div className="w-full h-1 bg-white/[0.06]">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%`, background: plan.color }}
                />
            </div>

            <div className="relative overflow-hidden" style={{ height: "240px" }}>
                <img src={ex.imageUrl} alt={ex.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: plan.color }}>
                        {ex.muscleGroup.replace("_", " ")}
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight leading-tight">{ex.name}</h2>
                    <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">{ex.instructions}</p>
                </div>
            </div>

            {/* Set tracker */}
            <div className="flex-1 px-4 pt-5 space-y-4">
                {/* Set dots */}
                <div className="flex items-center justify-center gap-2">
                    {Array.from({ length: totalSets }).map((_, i) => {
                        const completed = currentLog?.sets[i]?.completed;
                        const isCurrent = i === session.setIndex;
                        return (
                            <div
                                key={i}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                                style={
                                    completed
                                        ? { background: plan.color, color: "white" }
                                        : isCurrent
                                            ? { border: `2px solid ${plan.color}`, color: plan.color }
                                            : { background: "rgba(255,255,255,0.07)", color: "#52525b" }
                                }
                            >
                                {completed ? <CheckCircle className="w-4 h-4" /> : i + 1}
                            </div>
                        );
                    })}
                </div>

                <div className="text-center text-[var(--text-muted)] text-sm font-medium">
                    Set <span className="text-[var(--text-primary)] font-bold">{currentSet}</span> of {totalSets} · Target <span className="text-[var(--text-primary)] font-bold">{ex.reps}</span> reps
                </div>

                {/* Reps + Weight controls */}
                <div className="card p-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Reps */}
                        <div className="text-center">
                            <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-2 font-semibold">Reps</div>
                            <div className="flex items-center justify-center gap-3">
                                <button
                                    onClick={() => setReps(r => Math.max(1, r - 1))}
                                    className="w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.14] flex items-center justify-center text-lg font-bold transition-colors"
                                >−</button>
                                <span className="text-3xl font-bold stat-num text-[var(--text-primary)] w-10 text-center">{reps}</span>
                                <button
                                    onClick={() => setReps(r => r + 1)}
                                    className="w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.14] flex items-center justify-center text-lg font-bold transition-colors"
                                >+</button>
                            </div>
                        </div>

                        {/* Weight */}
                        <div className="text-center">
                            <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-2 font-semibold">
                                Weight {ex.weightKg === 0 ? "(BW)" : "(kg)"}
                            </div>
                            <div className="flex items-center justify-center gap-3">
                                <button
                                    onClick={() => setWeight(w => Math.max(0, parseFloat((w - 2.5).toFixed(1))))}
                                    disabled={ex.weightKg === 0}
                                    className="w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.14] flex items-center justify-center text-lg font-bold transition-colors disabled:opacity-30"
                                >−</button>
                                <span className="text-3xl font-bold stat-num text-[var(--text-primary)] w-14 text-center">
                                    {ex.weightKg === 0 ? "BW" : weight}
                                </span>
                                <button
                                    onClick={() => setWeight(w => parseFloat((w + 2.5).toFixed(1)))}
                                    disabled={ex.weightKg === 0}
                                    className="w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.14] flex items-center justify-center text-lg font-bold transition-colors disabled:opacity-30"
                                >+</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Previous sets in this exercise */}
                {currentLog?.sets.filter(s => s.completed).length > 0 && (
                    <div className="space-y-1.5">
                        <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-semibold">Completed Sets</div>
                        {currentLog.sets.filter(s => s.completed).map((s, i) => (
                            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-2xl bg-white/[0.04] text-sm">
                                <span className="text-[var(--text-muted)]">Set {i + 1}</span>
                                <span className="text-[var(--text-primary)] font-semibold stat-num">
                                    {s.reps} reps {s.weightKg > 0 ? `× ${s.weightKg}kg` : "(BW)"}
                                    <span className="text-[var(--text-muted)] ml-2">= {(s.reps * s.weightKg).toFixed(0)}kg vol</span>
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom action buttons */}
            <div className="px-4 pb-8 pt-4 space-y-3">
                <button
                    onClick={() => onSetComplete(reps, weight)}
                    className="btn w-full text-base py-4 font-bold"
                    style={{ background: plan.color, boxShadow: `0 8px 28px ${plan.color}50` }}
                >
                    <CheckCircle className="w-5 h-5" />
                    Complete Set {currentSet}
                </button>
                <button
                    onClick={onSkip}
                    className="btn btn-ghost w-full py-3 text-sm"
                >
                    <SkipForward className="w-4 h-4" /> Skip Exercise
                </button>
            </div>
        </div>
    );
}

// ── Rest View ─────────────────────────────────────────────────────────────────

function RestView({
    restSeconds,
    nextExercise,
    nextSetNum,
    planColor,
    onDone,
    onSkip,
}: {
    restSeconds: number;
    nextExercise: Exercise;
    nextSetNum: number | null;
    planColor: string;
    onDone: () => void;
    onSkip: () => void;
}) {
    const [remaining, setRemaining] = useState(restSeconds);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        setRemaining(restSeconds);
    }, [restSeconds]);

    useEffect(() => {
        if (isPaused) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }
        timerRef.current = setInterval(() => {
            setRemaining(r => {
                if (r <= 1) { clearInterval(timerRef.current!); onDone(); return 0; }
                return r - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isPaused, onDone]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black px-6 pb-safe text-center">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-semibold mb-6">Tactical Recovery</div>

            {/* Countdown ring */}
            <div className="relative mb-6">
                <RestRing remaining={remaining} total={restSeconds} color={planColor} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold stat-num text-[var(--text-primary)]">{remaining}</span>
                    <span className="text-xs text-[var(--text-muted)]">seconds</span>
                </div>
            </div>

            {/* Next up */}
            <div className="card p-4 w-full max-w-xs mb-8 text-left">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-semibold mb-2">
                    {nextSetNum ? `Next — Set ${nextSetNum}` : "Up Next"}
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={nextExercise.imageUrl} alt={nextExercise.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <div className="text-[var(--text-primary)] font-semibold text-sm">{nextExercise.name}</div>
                        <div className="text-xs text-[var(--text-muted)]">{nextExercise.reps} reps</div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex gap-3 w-full max-w-xs">
                <button
                    onClick={() => setIsPaused(p => !p)}
                    className="btn btn-ghost flex-1"
                >
                    {isPaused ? <><Play className="w-4 h-4" fill="currentColor" /> Resume</> : <><Pause className="w-4 h-4" /> Pause</>}
                </button>
                <button onClick={onSkip} className="btn btn-primary flex-1">
                    Skip Rest <SkipForward className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

// ── Complete View ─────────────────────────────────────────────────────────────

function CompleteView({
    session,
    onClose,
}: {
    session: SessionState;
    onClose: () => void;
}) {
    const totalVolume = calcTotalVolume(session.sessionLogs);
    const completedSets = session.sessionLogs.reduce((a, ex) => a + ex.sets.filter(s => s.completed).length, 0);
    const totalSets = session.plan.exercises.reduce((a, ex) => a + ex.sets, 0);
    const { user } = useAuth();
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!user || saved) return;
        setSaving(true);
        try {
            await addWorkoutLog(user.uid, {
                name: session.plan.name,
                duration_min: Math.round(session.elapsed / 60),
                exercises: session.sessionLogs.map(log => ({
                    name: log.name,
                    sets: log.sets.filter(s => s.completed).map(s => ({ reps: s.reps, weight_kg: s.weightKg })),
                })),
                total_volume_kg: totalVolume,
                notes: `Completed via Axiosync Workout Engine`,
            });
            setSaved(true);
        } catch (e) {
            console.error("Failed to save workout", e);
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => { handleSave(); }, []); // auto-save on mount

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 pb-safe text-center">
            {/* Trophy */}
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 relative" style={{ background: `${session.plan.color}20`, border: `2px solid ${session.plan.color}40` }}>
                <Trophy className="w-10 h-10" style={{ color: session.plan.color }} />
                <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: session.plan.color }} />
            </div>

            <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-1">Mission Accomplished</h1>
            <p className="text-[var(--text-muted)] text-sm mb-8">{session.plan.name} · {formatTime(session.elapsed)}</p>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-xs mb-8">
                {[
                    { label: "Volume", value: `${totalVolume.toFixed(0)}`, unit: "kg" },
                    { label: "Sets Done", value: `${completedSets}/${totalSets}`, unit: "sets" },
                    { label: "Duration", value: formatTime(session.elapsed), unit: "" },
                ].map(({ label, value, unit }) => (
                    <div key={label} className="card p-3 text-center">
                        <div className="text-xl font-bold stat-num text-[var(--text-primary)]">{value}</div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{unit || label}</div>
                        {unit && <div className="text-[9px] text-[var(--text-muted)]">{label}</div>}
                    </div>
                ))}
            </div>

            {/* Per-exercise summary */}
            <div className="card divide-y divide-white/[0.06] text-left w-full max-w-xs mb-6">
                {session.sessionLogs.filter(l => l.sets.some(s => s.completed)).map(log => {
                    const completedSets = log.sets.filter(s => s.completed);
                    const vol = completedSets.reduce((a, s) => a + s.reps * s.weightKg, 0);
                    return (
                        <div key={log.exerciseId} className="flex items-center justify-between p-3">
                            <div className="text-sm font-medium text-[var(--text-primary)]">{log.name}</div>
                            <div className="text-xs text-[var(--text-muted)] stat-num">
                                {completedSets.length} sets{vol > 0 ? ` · ${vol.toFixed(0)}kg` : ""}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="text-xs text-[var(--text-muted)] mb-4">
                {saved ? "✓ Saved to your health log" : saving ? "Saving…" : ""}
            </div>

            <button onClick={onClose} className="btn btn-primary w-full max-w-xs">
                <CheckCircle className="w-4 h-4" /> Done
            </button>
        </div>
    );
}

// ── Generator UI ────────────────────────────────────────────────────────────

const DURATION_LABELS: Record<number, string> = { 15: "15m", 30: "30m", 45: "45m", 60: "60m" };
const INTENSITY_LABELS: Record<string, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };
const INTENSITY_EMOJIS: Record<string, string> = { beginner: "🌱", intermediate: "🔥", advanced: "⚡" };
const STYLE_LABELS: Record<string, string> = {
    strength_hypertrophy: "Strength & Hyp",
    hiit: "HIIT",
    mobility_flow: "Mobility & Flow",
    isometrics: "Isometrics",
};
const STYLE_EMOJIS: Record<string, string> = {
    strength_hypertrophy: "🏋️",
    hiit: "⚡",
    mobility_flow: "🧘",
    isometrics: "🎯",
};

function WorkoutGenerator({ onStart }: { onStart: (plan: WorkoutPlan) => void }) {
    const [focus, setFocus] = useState(FOCUS_OPTIONS[0]);
    const [goal, setGoal] = useState<Goal>("hypertrophy");
    const [equipment, setEquipment] = useState<Equipment[]>(["bodyweight", "bench", "pull_up_bar"]);
    const [difficulty, setDifficulty] = useState<1 | 2 | 3>(2);
    const [duration, setDuration] = useState<Duration>(45);
    const [intensity, setIntensity] = useState<Intensity>("intermediate");
    const [style, setStyle] = useState<WorkoutStyle>("strength_hypertrophy");
    const [generated, setGenerated] = useState<GeneratedWorkout | null>(null);
    const [generating, setGenerating] = useState(false);

    const GOAL_LABELS: Record<Goal, string> = {
        hypertrophy: "Hypertrophy", strength: "Strength", powerbuilding: "Powerbuilding",
        endurance: "Endurance", fat_loss: "Fat Loss", mobility: "Mobility",
    };
    const GOAL_EMOJIS: Record<Goal, string> = {
        hypertrophy: "💪", strength: "🏋️", powerbuilding: "⚡",
        endurance: "🏃", fat_loss: "🔥", mobility: "🧘",
    };
    const EQ_LABELS: Record<Equipment, string> = {
        bodyweight: "Bodyweight", bench: "Bench", pull_up_bar: "Pull-up",
        wall: "Wall", chair: "Chair", resistance_band: "Res. Bands",
        backpack: "Backpack", towel: "Towel", floor: "Floor",
        barbell: "Barbell", dumbbell: "Dumbbell", cable: "Cable",
        machine: "Machine", kettlebell: "Kettlebell", bands: "Bands"
    };

    const toggleEquipment = (eq: Equipment) => {
        setEquipment(prev =>
            prev.includes(eq)
                ? prev.length > 1 ? prev.filter(e => e !== eq) : prev
                : [...prev, eq]
        );
        setGenerated(null);
    };

    const handleGenerate = () => {
        setGenerating(true);
        setTimeout(() => {
            const result = generateWorkout({
                focus, goal, availableEquipment: equipment, difficulty,
                duration, intensity, style,
            });
            setGenerated(result);
            setGenerating(false);
        }, 600);
    };

    // Convert GeneratedWorkout → WorkoutPlan for the existing session engine
    const handleStart = () => {
        if (!generated) return;
        const plan: WorkoutPlan = {
            id: generated.id,
            name: generated.name,
            category: "strength",
            difficulty: 2,
            estimatedMinutes: generated.estimatedMinutes,
            targetMuscles: generated.focus as any[],
            color: generated.color,
            emoji: generated.emoji,
            description: `Auto-generated ${goal} workout targeting ${generated.focus.join(", ")}.`,
            exercises: generated.working.map(ge => ({
                id: ge.exercise.id,
                name: ge.exercise.name,
                sets: ge.sets.filter(s => !s.isWarmup).length,
                reps: ge.sets.filter(s => !s.isWarmup)[0]?.reps || "8-12",
                muscleGroup: ge.exercise.muscleGroup as any,
                equipment: (ge.exercise.equipment[0] as any) || "bodyweight",
                instructions: ge.exercise.instructions,
                imageUrl: ge.exercise.imageUrl,
                weightKg: ge.sets.filter(s => !s.isWarmup)[0]?.weightKg || 0,
                restSeconds: ge.sets.filter(s => !s.isWarmup)[0]?.restSeconds || 90,
            })),
        };
        onStart(plan);
    };

    const chipStyle = (active: boolean, color = "#3B82F6") => active
        ? { background: `${color}18`, border: `1px solid ${color}45`, color }
        : { background: "var(--bg-elevated)", border: "1px solid rgba(255,255,255,0.06)", color: "var(--text-muted)" };

    return (
        <div className="space-y-5 pb-4">

            {/* ── Duration ── */}
            <div>
                <p className="section-header">Duration</p>
                <div className="grid grid-cols-4 gap-1.5">
                    {DURATION_OPTIONS.map(d => (
                        <motion.button key={d} whileTap={{ scale: 0.93 }}
                            onClick={() => { setDuration(d); setGenerated(null); }}
                            className="py-2.5 rounded-xl text-sm font-bold text-center transition-all duration-200"
                            style={chipStyle(duration === d, "#06B6D4")}
                        >{DURATION_LABELS[d]}</motion.button>
                    ))}
                </div>
            </div>

            {/* ── Intensity ── */}
            <div>
                <p className="section-header">Intensity</p>
                <div className="grid grid-cols-3 gap-1.5">
                    {INTENSITY_OPTIONS.map(i => (
                        <motion.button key={i} whileTap={{ scale: 0.93 }}
                            onClick={() => { setIntensity(i); setGenerated(null); }}
                            className="py-2.5 rounded-xl text-xs font-semibold text-center transition-all duration-200"
                            style={chipStyle(intensity === i, "#EF4444")}
                        >{INTENSITY_EMOJIS[i]} {INTENSITY_LABELS[i]}</motion.button>
                    ))}
                </div>
                {intensity !== "intermediate" && (
                    <p className="text-[10px] text-[var(--text-muted)] mt-1.5 px-0.5">
                        {intensity === "beginner" ? "🌱 Longer rests, fewer sets. Great for building consistency." : "⚡ Short rests, high volume. Bring your game."}
                    </p>
                )}
            </div>

            {/* ── Style ── */}
            <div>
                <p className="section-header">Training Style</p>
                <div className="grid grid-cols-2 gap-1.5">
                    {STYLE_OPTIONS.map(s => (
                        <motion.button key={s} whileTap={{ scale: 0.93 }}
                            onClick={() => { setStyle(s); setGenerated(null); }}
                            className="py-2.5 rounded-xl text-xs font-semibold text-center transition-all duration-200"
                            style={chipStyle(style === s, "#A855F7")}
                        >{STYLE_EMOJIS[s]} {STYLE_LABELS[s]}</motion.button>
                    ))}
                </div>
            </div>

            {/* ── Target muscle / Focus ── */}
            <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-[var(--text-primary)]/90">Target Muscle Group</p>
                <motion.button whileTap={{ scale: 0.96 }}
                    onClick={() => { setFocus("full body"); setGenerated(null); }}
                    className="w-full py-3 rounded-xl text-sm font-bold tracking-tight transition-all duration-200 flex items-center justify-center gap-2"
                    style={chipStyle(focus === "full body", "#3B82F6")}
                >
                    <Zap className="w-4 h-4" /> All Muscles (Full Body)
                </motion.button>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {FOCUS_OPTIONS.slice(1, 13).map(f => (
                        <motion.button key={f} whileTap={{ scale: 0.94 }}
                            onClick={() => { setFocus(f); setGenerated(null); }}
                            className="py-2.5 px-1 rounded-xl text-xs font-semibold text-center capitalize transition-all duration-200"
                            style={chipStyle(focus === f, "#3B82F6")}
                        >{f}</motion.button>
                    ))}
                </div>
            </div>

            {/* ── Goal ── */}
            <div>
                <p className="section-header">Training Goal</p>
                <div className="grid grid-cols-3 gap-1.5">
                    {GOAL_OPTIONS.map(g => (
                        <motion.button key={g} whileTap={{ scale: 0.94 }}
                            onClick={() => { setGoal(g); setGenerated(null); }}
                            className="py-2.5 rounded-xl text-xs font-semibold text-center transition-all duration-200"
                            style={chipStyle(goal === g, "#A855F7")}
                        >{GOAL_EMOJIS[g]} {GOAL_LABELS[g]}</motion.button>
                    ))}
                </div>
            </div>

            {/* ── Equipment ── */}
            <div>
                <p className="section-header">Available Equipment</p>
                <div className="flex flex-wrap gap-1.5">
                    {(["barbell", "dumbbell", "cable", "machine", "bodyweight", "bench", "pull_up_bar", "kettlebell", "bands"] as Equipment[]).map(eq => (
                        <button key={eq} onClick={() => toggleEquipment(eq)}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                            style={equipment.includes(eq)
                                ? { background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.35)", color: "#22C55E" }
                                : { background: "var(--bg-elevated)", border: "1px solid rgba(255,255,255,0.06)", color: "var(--text-muted)" }
                            }
                        >{EQ_LABELS[eq]}</button>
                    ))}
                </div>
            </div>

            {/* ── Generate button ── */}
            <motion.button
                onClick={handleGenerate}
                disabled={generating}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                className="btn w-full py-4 text-sm font-semibold"
                style={{
                    background: "linear-gradient(135deg, #7C3AED 0%, #A855F7 50%, #6D28D9 100%)",
                    boxShadow: "0 6px 24px rgba(139,92,246,0.35), 0 1px 0 rgba(255,255,255,0.1) inset",
                    color: "white",
                }}
            >
                {generating
                    ? <><Zap className="w-4 h-4 animate-bounce" /> Generating…</>
                    : <><Sparkles className="w-4 h-4" /> Generate {DURATION_LABELS[duration]} {INTENSITY_LABELS[intensity]} Workout</>}
            </motion.button>

            {/* ── Preview ── */}
            <AnimatePresence>
                {generated && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-[var(--text-primary)] text-base">{generated.emoji} {generated.name}</h3>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                    {generated.working.length} exercises · ~{generated.estimatedMinutes} min · {generated.rpeLabel}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-[11px] text-[var(--text-muted)]">Rest between sets</div>
                                <div className="text-sm font-bold stat-num" style={{ color: generated.color }}>{generated.restSeconds}s</div>
                            </div>
                        </div>

                        {/* Anatomy preview + exercise list */}
                        <div className="flex gap-3">
                            {/* SVG anatomy mini-map */}
                            <div className="shrink-0 w-24">
                                <AnatomyMap activeMuscles={generated.musclesWorked} className="scale-90 origin-top" />
                            </div>

                            {/* Exercise list */}
                            <div className="flex-1 rounded-2xl overflow-hidden divide-y divide-white/[0.05]"
                                style={{ background: "var(--bg-elevated)", border: "1px solid rgba(255,255,255,0.07)" }}
                            >
                                {/* Warmup */}
                                {generated.warmup.length > 0 && (
                                    <div className="px-3 py-2">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Warmup</span>
                                        {generated.warmup.map(ge => (
                                            <div key={ge.exercise.id} className="text-xs text-[var(--text-muted)] py-0.5">{ge.exercise.name}</div>
                                        ))}
                                    </div>
                                )}
                                {/* Working sets */}
                                {generated.working.map((ge, i) => {
                                    const workSets = ge.sets.filter(s => !s.isWarmup);
                                    return (
                                        <div key={ge.exercise.id} className="flex items-center gap-2 px-3 py-2">
                                            <div className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                                                style={{ background: `${generated.color}20`, color: generated.color }}>{i + 1}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-semibold text-[var(--text-primary)] truncate">{ge.exercise.name}</div>
                                                <div className="text-[10px] text-[var(--text-muted)]">
                                                    {workSets.length} × {workSets[0]?.reps} · {workSets[0]?.restSeconds}s rest
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <button
                            onClick={handleStart}
                            className="btn w-full py-4 text-base font-semibold"
                            style={{
                                background: `linear-gradient(135deg, ${generated.color} 0%, ${generated.color}cc 100%)`,
                                boxShadow: `0 8px 28px ${generated.color}40, 0 1px 0 rgba(255,255,255,0.1) inset`,
                                color: "white",
                            }}
                        >
                            <Play className="w-5 h-5" fill="currentColor" /> Start {generated.name}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}



// ── Main WorkoutTracker ───────────────────────────────────────────────────────

export default function WorkoutTracker() {
    const [engineState, setEngineState] = useState<EngineState>("browse");
    const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
    const [session, setSession] = useState<SessionState | null>(null);
    const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [activeTab, setActiveTab] = useState<"generate" | "strength" | "hiit" | "core" | "cardio" | "all">("all");

    // ── Elapsed session timer ──
    useEffect(() => {
        if (engineState === "active" || engineState === "rest") {
            elapsedRef.current = setInterval(() => {
                setSession(s => s ? { ...s, elapsed: s.elapsed + 1 } : s);
            }, 1000);
        } else {
            if (elapsedRef.current) clearInterval(elapsedRef.current);
        }
        return () => { if (elapsedRef.current) clearInterval(elapsedRef.current); };
    }, [engineState]);

    // ── Start workout ──
    const startWorkout = useCallback((plan: WorkoutPlan) => {
        const logs: ExerciseLog[] = plan.exercises.map(ex => ({
            exerciseId: ex.id,
            name: ex.name,
            sets: Array.from({ length: ex.sets }, () => ({ reps: typeof ex.reps === "number" ? ex.reps : 12, weightKg: ex.weightKg ?? 0, completed: false })),
        }));
        setSession({
            plan,
            exerciseIndex: 0,
            setIndex: 0,
            sessionLogs: logs,
            startedAt: new Date(),
            elapsed: 0,
        });
        setEngineState("active");
    }, []);

    // ── Complete a set ──
    const handleSetComplete = useCallback((reps: number, weightKg: number) => {
        if (!session) return;
        const newLogs = session.sessionLogs.map((log, ei) => {
            if (ei !== session.exerciseIndex) return log;
            return {
                ...log,
                sets: log.sets.map((s, si) =>
                    si === session.setIndex ? { reps, weightKg, completed: true } : s
                ),
            };
        });

        const ex = session.plan.exercises[session.exerciseIndex];
        const isLastSet = session.setIndex >= ex.sets - 1;
        const isLastExercise = session.exerciseIndex >= session.plan.exercises.length - 1;

        if (isLastSet && isLastExercise) {
            setSession(s => s ? { ...s, sessionLogs: newLogs } : s);
            setEngineState("complete");
            return;
        }

        if (isLastSet) {
            // Move to next exercise via rest
            setSession(s => s ? {
                ...s,
                sessionLogs: newLogs,
                exerciseIndex: s.exerciseIndex + 1,
                setIndex: 0,
            } : s);
        } else {
            // Next set via rest
            setSession(s => s ? {
                ...s,
                sessionLogs: newLogs,
                setIndex: s.setIndex + 1,
            } : s);
        }
        setEngineState("rest");
    }, [session]);

    // ── Skip exercise ──
    const handleSkip = useCallback(() => {
        if (!session) return;
        const isLastExercise = session.exerciseIndex >= session.plan.exercises.length - 1;
        if (isLastExercise) {
            setEngineState("complete");
        } else {
            setSession(s => s ? { ...s, exerciseIndex: s.exerciseIndex + 1, setIndex: 0 } : s);
            setEngineState("rest");
        }
    }, [session]);

    // ── Rest done ──
    const handleRestDone = useCallback(() => {
        setEngineState("active");
    }, []);

    // ── End / close ──
    const handleEnd = useCallback((discard = false) => {
        if (discard) {
            setSession(null);
            setSelectedPlan(null);
            setEngineState("browse");
        } else {
            setEngineState("complete");
        }
    }, []);

    const handleClose = useCallback(() => {
        setSession(null);
        setSelectedPlan(null);
        setEngineState("browse");
    }, []);

    // ── Browse view ──
    const filteredPlans = WORKOUT_PLANS.filter(p => activeTab === "all" || p.category === activeTab);
    const TABS = [
        { id: "generate", label: "✨ Generate" },
        { id: "all", label: "All" },
        { id: "strength", label: "Strength" },
        { id: "hiit", label: "HIIT" },
    ] as const;

    // ── Render ──
    if (engineState === "active" && session) {
        return (
            <ActiveExercise
                session={session}
                onSetComplete={handleSetComplete}
                onSkip={handleSkip}
                onEnd={handleEnd}
            />
        );
    }

    if (engineState === "rest" && session) {
        const ex = session.plan.exercises[session.exerciseIndex];
        const isNewExercise = session.setIndex === 0 && session.exerciseIndex > 0;
        const prevEx = isNewExercise ? session.plan.exercises[session.exerciseIndex - 1] : null;
        const restSecs = (prevEx || ex).restSeconds;

        return (
            <RestView
                restSeconds={restSecs}
                nextExercise={ex}
                nextSetNum={session.setIndex === 0 ? null : session.setIndex + 1}
                planColor={session.plan.color}
                onDone={handleRestDone}
                onSkip={handleRestDone}
            />
        );
    }

    if (engineState === "complete" && session) {
        return <CompleteView session={session} onClose={handleClose} />;
    }

    if (engineState === "preview" && selectedPlan) {
        return (
            <PreviewSheet
                plan={selectedPlan}
                onStart={() => startWorkout(selectedPlan)}
                onBack={() => setEngineState("browse")}
            />
        );
    }

    // Browse
    return (
        <div className="space-y-5 pb-32">
            <div className="flex items-center justify-between px-1 pt-2">
                <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Strength</h1>
                <Flame className="w-6 h-6" style={{ color: "#EF4444" }} fill="currentColor" />
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {TABS.map(tab => (
                    <motion.button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all duration-200 border shrink-0"
                        style={activeTab === tab.id
                            ? { borderColor: "rgba(59,130,246,0.45)", color: "#3B82F6", background: "rgba(59,130,246,0.1)" }
                            : { borderColor: "rgba(255,255,255,0.07)", color: "var(--text-muted)", background: "var(--bg-elevated)" }
                        }
                    >
                        {tab.label}
                    </motion.button>
                ))}
            </div>

            {/* Generator or plan grid */}
            <AnimatePresence mode="wait">
                {activeTab === "generate" ? (
                    <motion.div
                        key="generator"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                    >
                        <div className="card p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="w-4 h-4 text-[#A855F7]" />
                                <span className="font-semibold text-[var(--text-primary)]">AI Workout Generator</span>
                                <span className="text-[10px] text-[var(--text-muted)] bg-[#A855F7]/10 text-[#A855F7] px-2 py-0.5 rounded-full font-semibold uppercase tracking-widest border border-[#A855F7]/20">New</span>
                            </div>
                            <WorkoutGenerator onStart={plan => { setSelectedPlan(plan); setEngineState("preview"); }} />
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="plans"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-4"
                    >
                        {filteredPlans.map(plan => (
                            <PlanCard
                                key={plan.id}
                                plan={plan}
                                onSelect={() => { setSelectedPlan(plan); setEngineState("preview"); }}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
