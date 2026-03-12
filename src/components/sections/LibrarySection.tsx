"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Library, Search, Filter, ChevronDown, ChevronUp, Dumbbell, Plus, Trash2, Play, Edit3, X, BookOpen, Layers, Eye } from "lucide-react";
import { EXERCISE_DATABASE, type Exercise, type MuscleGroup } from "@/lib/WorkoutEngine";
import { getCustomWorkouts, deleteCustomWorkout, type CustomWorkout } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import CustomWorkoutBuilder from "@/components/CustomWorkoutBuilder";
import WorkoutDetailView from "../WorkoutDetailView";

const pageVariants = {
    initial: { opacity: 0, y: 16 },
    enter: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 320, damping: 30, mass: 0.8 } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.18 } },
};

// ── Muscle & Equipment filter options ─────────────────────────────────────────

const MUSCLE_OPTIONS = ["all", "chest", "back", "shoulders", "core", "quads", "glutes", "hamstrings", "calves", "biceps", "triceps", "cardio", "full_body"] as const;
const EQUIPMENT_OPTIONS = ["all", "bodyweight", "pull_up_bar", "bench", "wall", "chair", "towel", "floor"] as const;
const DIFFICULTY_OPTIONS = ["all", "beginner", "intermediate", "advanced"] as const;

const MUSCLE_LABELS: Record<string, string> = {
    all: "All Muscles", chest: "Chest", back: "Back", shoulders: "Shoulders",
    core: "Core", quads: "Legs / Quads", glutes: "Glutes", hamstrings: "Hamstrings",
    calves: "Calves", biceps: "Biceps", triceps: "Triceps", cardio: "Cardio", full_body: "Full Body",
};
const EQ_LABELS: Record<string, string> = {
    all: "Any Equipment", bodyweight: "Bodyweight", pull_up_bar: "Pull-up Bar",
    bench: "Bench", wall: "Wall", chair: "Chair", towel: "Towel", floor: "Floor",
};
const DIFF_NUM: Record<string, number | null> = { all: null, beginner: 1, intermediate: 2, advanced: 3 };
const DIFF_LABELS: Record<string, string> = { all: "Any Level", beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };

// ── Exercise card with expandable drawer ──────────────────────────────────────

function ExerciseCard({ ex }: { ex: Exercise }) {
    const [open, setOpen] = useState(false);
    const MUSCLE_COLORS: Record<string, string> = {
        chest: "#3B82F6", back: "#A855F7", shoulders: "#06B6D4", core: "#F59E0B",
        quads: "#22C55E", glutes: "#EF4444", hamstrings: "#10B981", calves: "#14B8A6",
        biceps: "#F97316", triceps: "#EAB308", full_body: "#8B5CF6", cardio: "#EF4444",
    };
    const color = MUSCLE_COLORS[ex.muscleGroup] ?? "#3B82F6";
    const diffDots = "⬤".repeat(ex.difficulty) + "○".repeat(3 - ex.difficulty);

    return (
        <motion.div
            layout
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)" }}
        >
            <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 p-4 text-left">
                {/* Color indicator */}
                <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center"
                    style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                    <Dumbbell className="w-4 h-4" style={{ color }} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[var(--text-primary)] truncate">{ex.name}</div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5 capitalize flex items-center gap-2">
                        <span style={{ color }} className="font-semibold">{ex.muscleGroup.replace("_", " ")}</span>
                        <span>·</span>
                        <span>{ex.modality}</span>
                        <span>·</span>
                        <span className="tracking-tight text-[var(--text-muted)]">{diffDots}</span>
                    </div>
                </div>

                <div className="shrink-0 text-[var(--text-muted)]">
                    {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-3 space-y-3">

                            {/* Instructions */}
                            <div>
                                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold mb-1">Instructions</div>
                                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{ex.instructions}</p>
                            </div>

                            {/* Coaching cue */}
                            {ex.cue && (
                                <div className="px-3 py-2 rounded-xl"
                                    style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
                                    <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color }}>Key Cue</div>
                                    <p className="text-xs text-[var(--text-secondary)]">{ex.cue}</p>
                                </div>
                            )}

                            {/* Secondary muscles */}
                            {ex.secondaryMuscles.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold self-center mr-1">Also:</span>
                                    {ex.secondaryMuscles.map(m => (
                                        <span key={m} className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                                            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                                            {m.replace("_", " ")}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ── My Routines sub-tab ───────────────────────────────────────────────────────

function MyRoutinesTab({ onStartWorkout, onViewDetail }: { onStartWorkout?: (w: CustomWorkout) => void, onViewDetail: (w: any) => void }) {
    const { user } = useAuth();
    const [routines, setRoutines] = useState<CustomWorkout[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showBuilder, setShowBuilder] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchRoutines = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const data = await getCustomWorkouts(user.uid);
        setRoutines(data);
        setLoading(false);
    }, [user]);

    useEffect(() => { fetchRoutines(); }, [fetchRoutines]);

    const handleDelete = async (id: string) => {
        if (!user) return;
        await deleteCustomWorkout(user.uid, id);
        setDeletingId(null);
        fetchRoutines();
    };

    const editingRoutine = routines.find(r => r.id === editingId);

    if (showBuilder || editingId) {
        return (
            <div className="card p-5">
                <CustomWorkoutBuilder
                    initialWorkout={editingRoutine}
                    onSaved={() => { setShowBuilder(false); setEditingId(null); fetchRoutines(); }}
                    onCancel={() => { setShowBuilder(false); setEditingId(null); }}
                />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col gap-3">
                {[1, 2].map(i => (
                    <div key={i} className="card p-5 h-20 animate-pulse" style={{ background: "var(--bg-elevated)" }} />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowBuilder(true)}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold"
                style={{
                    background: "linear-gradient(135deg,#6D28D9,#A855F7)",
                    boxShadow: "0 6px 20px rgba(139,92,246,0.3)",
                    color: "white",
                }}
            >
                <Plus className="w-4 h-4" /> Initialize Protocol
            </motion.button>

            {routines.length === 0 ? (
                <div className="card p-8 text-center flex flex-col items-center gap-3">
                    <Layers className="w-8 h-8 text-[var(--text-secondary)]" />
                    <p className="text-sm text-[var(--text-muted)]">No saved routines yet. Create your first custom workout above.</p>
                </div>
            ) : (
                routines.map(r => (
                    <motion.div key={r.id} layout
                        className="card p-4"
                        style={{ border: "1px solid var(--border-subtle)" }}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-[var(--text-primary)] truncate">{r.emoji ?? "🏋️"} {r.name}</div>
                                <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                                    {r.exercises.length} exercises · {r.exercises.reduce((a, e) => a + e.sets.length, 0)} sets
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button onClick={() => onViewDetail(r)}
                                    className="p-2 rounded-xl text-[var(--text-muted)] hover:text-blue-400 transition-colors"
                                    style={{ background: "var(--bg-overlay)" }}>
                                    <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setEditingId(r.id!)}
                                    className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                                    style={{ background: "var(--bg-overlay)" }}>
                                    <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setDeletingId(r.id!)}
                                    className="p-2 rounded-xl text-[var(--text-muted)] hover:text-red-400 transition-colors"
                                    style={{ background: "rgba(255,255,255,0.05)" }}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Delete confirm */}
                        <AnimatePresence>
                            {deletingId === r.id && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center gap-2 pt-2 border-t border-[var(--border-subtle)]">
                                    <span className="text-xs text-[var(--text-muted)] flex-1">Delete "{r.name}"?</span>
                                    <button onClick={() => handleDelete(r.id!)}
                                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 border border-red-500/30 bg-red-500/10">Delete</button>
                                    <button onClick={() => setDeletingId(null)}
                                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-[var(--text-muted)] border border-[var(--border-subtle)]">Cancel</button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button onClick={() => onStartWorkout?.(r)}
                            className="w-full mt-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                            style={{ background: `${r.color ?? "#3B82F6"}18`, border: `1px solid ${r.color ?? "#3B82F6"}35`, color: r.color ?? "#3B82F6" }}>
                            <Play className="w-3.5 h-3.5" /> Start Routine
                        </button>
                    </motion.div>
                ))
            )}
        </div>
    );
}

// ── Main LibrarySection ───────────────────────────────────────────────────────

export default function LibrarySection() {
    const [tab, setTab] = useState<"directory" | "routines">("directory");
    const [searchQuery, setSearchQuery] = useState("");
    const [muscleFilter, setMuscleFilter] = useState<string>("all");
    const [equipFilter, setEquipFilter] = useState<string>("all");
    const [diffFilter, setDiffFilter] = useState<string>("all");
    const [showFilters, setShowFilters] = useState(false);
    const [viewingWorkout, setViewingWorkout] = useState<any | null>(null);

    const filtered = useMemo(() => {
        return EXERCISE_DATABASE.filter(ex => {
            const matchMuscle = muscleFilter === "all" || ex.muscleGroup === muscleFilter;
            const matchEquip = equipFilter === "all" || ex.equipment.includes(equipFilter as any);
            const matchDiff = diffFilter === "all" || ex.difficulty === DIFF_NUM[diffFilter];
            const matchSearch = !searchQuery || ex.name.toLowerCase().includes(searchQuery.toLowerCase())
                || ex.muscleGroup.includes(searchQuery.toLowerCase());
            return matchMuscle && matchEquip && matchDiff && matchSearch;
        });
    }, [searchQuery, muscleFilter, equipFilter, diffFilter]);

    const activeFilterCount = [muscleFilter, equipFilter, diffFilter].filter(f => f !== "all").length;

    return (
        <motion.div key="library" variants={pageVariants} initial="initial" animate="enter" exit="exit" className="space-y-4 pb-32">
            {/* Header */}
            <div className="flex items-center gap-3 px-1 pt-2">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 flex items-center justify-center">
                    <Library className="w-5 h-5 text-teal-400" />
                </div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Arsenal</h1>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {[
                    { id: "directory", label: "Field Manual", icon: BookOpen },
                    { id: "routines", label: "Assigned Protocols", icon: Layers },
                ].map(t => (
                    <button key={t.id}
                        onClick={() => setTab(t.id as any)}
                        className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                        style={tab === t.id
                            ? { background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.35)", color: "#14B8A6" }
                            : { background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }
                        }>
                        <t.icon className="w-3.5 h-3.5" />{t.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {tab === "directory" ? (
                    <motion.div key="dir" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                            <input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder={`Search ${EXERCISE_DATABASE.length}+ exercises…`}
                                className="w-full pl-9 pr-10 py-3 rounded-2xl text-sm text-[var(--text-primary)] placeholder-zinc-600 outline-none"
                                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                            />
                            <button onClick={() => setShowFilters(o => !o)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1"
                                style={{ color: activeFilterCount > 0 ? "#14B8A6" : "var(--text-muted)" }}>
                                <Filter className="w-4 h-4" />
                                {activeFilterCount > 0 && (
                                    <span className="text-[10px] font-bold">{activeFilterCount}</span>
                                )}
                            </button>
                        </div>

                        {/* Filters panel */}
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden card p-4 space-y-3">
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Muscle Group</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {MUSCLE_OPTIONS.map(m => (
                                                <button key={m} onClick={() => setMuscleFilter(m)}
                                                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize transition-all"
                                                    style={muscleFilter === m
                                                        ? { background: "rgba(20,184,166,0.18)", border: "1px solid rgba(20,184,166,0.4)", color: "#14B8A6" }
                                                        : { background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }
                                                    }>{MUSCLE_LABELS[m] ?? m}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Equipment</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {EQUIPMENT_OPTIONS.map(e => (
                                                <button key={e} onClick={() => setEquipFilter(e)}
                                                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize transition-all"
                                                    style={equipFilter === e
                                                        ? { background: "rgba(20,184,166,0.18)", border: "1px solid rgba(20,184,166,0.4)", color: "#14B8A6" }
                                                        : { background: "var(--bg-elevated)", border: "1px solid rgba(255,255,255,0.07)", color: "var(--text-muted)" }
                                                    }>{EQ_LABELS[e] ?? e}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Difficulty</div>
                                        <div className="flex gap-1.5">
                                            {DIFFICULTY_OPTIONS.map(d => (
                                                <button key={d} onClick={() => setDiffFilter(d)}
                                                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize transition-all"
                                                    style={diffFilter === d
                                                        ? { background: "rgba(20,184,166,0.18)", border: "1px solid rgba(20,184,166,0.4)", color: "#14B8A6" }
                                                        : { background: "var(--bg-elevated)", border: "1px solid rgba(255,255,255,0.07)", color: "var(--text-muted)" }
                                                    }>{DIFF_LABELS[d]}</button>
                                            ))}
                                        </div>
                                    </div>
                                    {activeFilterCount > 0 && (
                                        <button onClick={() => { setMuscleFilter("all"); setEquipFilter("all"); setDiffFilter("all"); }}
                                            className="text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors flex items-center gap-1">
                                            <X className="w-3 h-3" /> Clear filters
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Result count */}
                        <div className="text-xs text-[var(--text-muted)]">
                            {filtered.length} of {EXERCISE_DATABASE.length} exercises
                        </div>

                        {/* Exercise cards */}
                        <div className="space-y-2">
                            {filtered.map(ex => <ExerciseCard key={ex.id} ex={ex} />)}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="routines" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <MyRoutinesTab onViewDetail={setViewingWorkout} />
                    </motion.div>
                )}
            </AnimatePresence>

            <WorkoutDetailView 
                workout={viewingWorkout} 
                onClose={() => setViewingWorkout(null)} 
            />
        </motion.div>
    );
}
