"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor,
    useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
    useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    Search, Plus, Trash2, ChevronDown, GripVertical,
    Timer, Repeat, Clock, Save, CheckCircle2, X, ChevronUp,
    Dumbbell, Sparkles,
} from "lucide-react";
import { EXERCISE_DATABASE, type Exercise, type MuscleGroup } from "@/lib/WorkoutEngine";
import { saveCustomWorkout, updateCustomWorkout, type CustomExerciseBlock, type CustomSetBlock, type CustomWorkout } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BuilderSet {
    reps?: number;
    time_s?: number;
    restSeconds: number;
}

interface BuilderExercise {
    uid: string;       // unique key for DnD (not the exercise id)
    exercise: Exercise;
    sets: BuilderSet[];
    expanded: boolean;
    notes: string;
}

function makeDefaultSet(ex: Exercise): BuilderSet {
    return {
        reps: ex.duration_s ? undefined : 10,
        time_s: ex.duration_s ?? undefined,
        restSeconds: 60,
    };
}

// ── Sortable Exercise Row ─────────────────────────────────────────────────────

function SortableExerciseRow({
    item,
    onUpdate,
    onRemove,
}: {
    item: BuilderExercise;
    onUpdate: (updated: BuilderExercise) => void;
    onRemove: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.uid });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : undefined,
    };

    const toggle = () => onUpdate({ ...item, expanded: !item.expanded });

    const updateSet = (i: number, patch: Partial<BuilderSet>) => {
        const sets = item.sets.map((s, idx) => idx === i ? { ...s, ...patch } : s);
        onUpdate({ ...item, sets });
    };

    const addSet = () => onUpdate({ ...item, sets: [...item.sets, makeDefaultSet(item.exercise)] });
    const removeSet = (i: number) => {
        if (item.sets.length <= 1) return;
        onUpdate({ ...item, sets: item.sets.filter((_, idx) => idx !== i) });
    };

    const isTimed = !!item.exercise.duration_s;
    const MUSCLE_COLOR: Record<string, string> = {
        chest: "#3B82F6", back: "#A855F7", shoulders: "#06B6D4", core: "#F59E0B",
        quads: "#22C55E", glutes: "#EF4444", hamstrings: "#10B981", calves: "#14B8A6",
        biceps: "#F97316", triceps: "#EAB308", full_body: "#8B5CF6", cardio: "#EF4444",
    };
    const color = MUSCLE_COLOR[item.exercise.muscleGroup] ?? "#3B82F6";

    return (
        <motion.div
            ref={setNodeRef}
            style={{ ...style, border: "1px solid rgba(255,255,255,0.07)", background: "var(--bg-elevated)" }}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden"
        >
            {/* Header row */}
            <div className="flex items-center gap-2 p-3">
                {/* Drag handle */}
                <div
                    className="p-1.5 rounded-lg cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 shrink-0 touch-none"
                    {...listeners}
                    {...attributes}
                >
                    <GripVertical className="w-4 h-4" />
                </div>

                {/* Muscle dot + name */}
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{item.exercise.name}</div>
                    <div className="text-[10px] text-zinc-600 capitalize">
                        {item.exercise.muscleGroup.replace("_", " ")} · {item.sets.length} sets
                    </div>
                </div>

                {/* Expand / remove */}
                <button onClick={toggle} className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors">
                    {item.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button onClick={onRemove} className="p-1.5 text-zinc-700 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Expanded set editor */}
            <AnimatePresence>
                {item.expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-2 sm:px-3 pb-3 space-y-2 border-t border-white/[0.05] pt-3">
                            {/* Column headers */}
                            <div className="grid gap-1 sm:gap-2" style={{ gridTemplateColumns: "1.5rem 1fr 1fr 1.5rem" }}>
                                <div />
                                <div className="text-[9px] text-zinc-600 uppercase text-center tracking-widest font-bold">
                                    {isTimed ? "Time" : "Reps"}
                                </div>
                                <div className="text-[9px] text-zinc-600 uppercase text-center tracking-widest font-bold">Rest</div>
                                <div />
                                <div />
                            </div>

                            {item.sets.map((s, i) => (
                                <div key={i} className="grid items-center gap-1 sm:gap-2" style={{ gridTemplateColumns: "1.5rem 1fr 1fr 1.5rem" }}>
                                    <div className="text-[10px] font-bold text-zinc-600 text-center">{i + 1}</div>

                                    {/* Reps or Time */}
                                    <div className="flex items-center rounded-xl overflow-hidden"
                                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                        <button onClick={() => updateSet(i, isTimed
                                            ? { time_s: Math.max(5, (s.time_s ?? 30) - 5) }
                                            : { reps: Math.max(1, (s.reps ?? 10) - 1) })}
                                            className="px-1.5 py-1.5 sm:px-2.5 sm:py-2 text-zinc-400 hover:text-white text-sm font-bold touch-manipulation">−</button>
                                        <div className="flex-1 text-center text-xs sm:text-sm font-bold text-white tabular-nums">
                                            {isTimed ? `${s.time_s ?? 30}s` : (s.reps ?? 10)}
                                        </div>
                                        <button onClick={() => updateSet(i, isTimed
                                            ? { time_s: (s.time_s ?? 30) + 5 }
                                            : { reps: (s.reps ?? 10) + 1 })}
                                            className="px-1.5 py-1.5 sm:px-2.5 sm:py-2 text-zinc-400 hover:text-white text-sm font-bold touch-manipulation">+</button>
                                    </div>

                                    {/* Rest */}
                                    <div className="flex items-center rounded-xl overflow-hidden"
                                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                        <button onClick={() => updateSet(i, { restSeconds: Math.max(10, s.restSeconds - 15) })}
                                            className="px-1.5 py-1.5 sm:px-2.5 sm:py-2 text-zinc-400 hover:text-white text-sm font-bold touch-manipulation">−</button>
                                        <div className="flex-1 text-center text-[11px] sm:text-xs font-bold text-white tabular-nums">{s.restSeconds}s</div>
                                        <button onClick={() => updateSet(i, { restSeconds: s.restSeconds + 15 })}
                                            className="px-1.5 py-1.5 sm:px-2.5 sm:py-2 text-zinc-400 hover:text-white text-sm font-bold touch-manipulation">+</button>
                                    </div>

                                    <button onClick={() => removeSet(i)}
                                        className="text-zinc-700 hover:text-red-400 p-1.5 transition-colors flex items-center justify-center">
                                        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                </div>
                            ))}

                            <button onClick={addSet}
                                className="w-full py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-300 border border-dashed border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-1.5">
                                <Plus className="w-3.5 h-3.5" /> Add Set
                            </button>

                            {/* Notes */}
                            <input
                                placeholder="Notes (optional)…"
                                value={item.notes}
                                onChange={e => onUpdate({ ...item, notes: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl text-xs text-zinc-400 placeholder-zinc-700 outline-none"
                                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ── Exercise Search Panel ─────────────────────────────────────────────────────

const MUSCLE_FILTERS: { id: MuscleGroup | "all"; label: string }[] = [
    { id: "all", label: "All" },
    { id: "chest", label: "Chest" },
    { id: "back", label: "Back" },
    { id: "shoulders", label: "Shoulders" },
    { id: "core", label: "Core" },
    { id: "quads", label: "Legs" },
    { id: "glutes", label: "Glutes" },
    { id: "biceps", label: "Arms" },
    { id: "cardio", label: "Cardio" },
    { id: "full_body", label: "Full Body" },
];

function ExerciseSearchPanel({
    addedIds,
    onAdd,
    onClose,
}: {
    addedIds: Set<string>;
    onAdd: (ex: Exercise) => void;
    onClose: () => void;
}) {
    const [query, setQuery] = useState("");
    const [muscleFilter, setMuscleFilter] = useState<string>("all");
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = EXERCISE_DATABASE.filter(ex => {
        const matchMuscle = muscleFilter === "all"
            || ex.muscleGroup === muscleFilter
            || (muscleFilter === "quads" && ["quads", "hamstrings", "calves"].includes(ex.muscleGroup))
            || (muscleFilter === "biceps" && ["biceps", "triceps", "forearms"].includes(ex.muscleGroup));
        const matchQuery = !query || ex.name.toLowerCase().includes(query.toLowerCase());
        return matchMuscle && matchQuery;
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-col h-full overflow-hidden"
            style={{ maxHeight: "85vh" }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-zinc-400" /> Exercise Library
                </h3>
                <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                    ref={inputRef}
                    autoFocus
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search exercises…"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-white placeholder-zinc-600 outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
            </div>

            {/* Muscle filter chips */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-2">
                {MUSCLE_FILTERS.map(f => (
                    <button key={f.id}
                        onClick={() => setMuscleFilter(f.id)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all duration-200"
                        style={muscleFilter === f.id
                            ? { background: "rgba(59,130,246,0.18)", border: "1px solid rgba(59,130,246,0.4)", color: "#3B82F6" }
                            : { background: "var(--bg-elevated)", border: "1px solid rgba(255,255,255,0.07)", color: "var(--text-muted)" }
                        }
                    >{f.label}</button>
                ))}
            </div>

            {/* Results list */}
            <div className="flex-1 overflow-y-auto space-y-1 no-scrollbar">
                {filtered.length === 0 && (
                    <div className="text-center py-8 text-zinc-600 text-sm">No exercises found</div>
                )}
                {filtered.map(ex => {
                    const added = addedIds.has(ex.id);
                    return (
                        <motion.button
                            key={ex.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onAdd(ex)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-150"
                            style={{
                                background: added ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)",
                                border: added ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(255,255,255,0.06)",
                            }}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-white truncate">{ex.name}</div>
                                <div className="text-[10px] text-zinc-600 capitalize mt-0.5">
                                    {ex.muscleGroup.replace("_", " ")} · {ex.modality} · {"⬤".repeat(ex.difficulty)}{"○".repeat(3 - ex.difficulty)}
                                </div>
                            </div>
                            <div className="shrink-0">
                                {added
                                    ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                    : <Plus className="w-5 h-5 text-zinc-600" />
                                }
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </motion.div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface CustomWorkoutBuilderProps {
    initialWorkout?: CustomWorkout;
    onSaved?: (id: string) => void;
    onCancel?: () => void;
}

let uidCounter = 0;
const genUid = () => `ex_${++uidCounter}_${Date.now()}`;

export default function CustomWorkoutBuilder({ initialWorkout, onSaved, onCancel }: CustomWorkoutBuilderProps) {
    const { user } = useAuth();

    const [name, setName] = useState(initialWorkout?.name ?? "My Custom Workout");
    const [exercises, setExercises] = useState<BuilderExercise[]>(() => {
        if (!initialWorkout) return [];
        return initialWorkout.exercises.map(ex => ({
            uid: genUid(),
            exercise: EXERCISE_DATABASE.find(e => e.id === ex.exerciseId) ?? {
                id: ex.exerciseId,
                name: ex.name,
                muscleGroup: ex.muscleGroup as MuscleGroup,
                secondaryMuscles: [],
                equipment: ["bodyweight"],
                difficulty: 2,
                isCompound: false,
                modality: ex.modality as any,
                instructions: "",
                imageUrl: "",
            },
            sets: ex.sets,
            expanded: false,
            notes: ex.notes ?? "",
        }));
    });

    const [showSearch, setShowSearch] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedId, setSavedId] = useState<string | null>(initialWorkout?.id ?? null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const addedIds = new Set(exercises.map(e => e.exercise.id));

    const addExercise = useCallback((ex: Exercise) => {
        if (addedIds.has(ex.id)) return; // prevent duplicates
        setExercises(prev => [...prev, {
            uid: genUid(),
            exercise: ex,
            sets: [makeDefaultSet(ex), makeDefaultSet(ex), makeDefaultSet(ex)],
            expanded: true,
            notes: "",
        }]);
    }, [addedIds]);

    const updateExercise = useCallback((uid: string, updated: BuilderExercise) => {
        setExercises(prev => prev.map(e => e.uid === uid ? updated : e));
    }, []);

    const removeExercise = useCallback((uid: string) => {
        setExercises(prev => prev.filter(e => e.uid !== uid));
    }, []);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setExercises(prev => {
                const oldIdx = prev.findIndex(e => e.uid === active.id);
                const newIdx = prev.findIndex(e => e.uid === over.id);
                return arrayMove(prev, oldIdx, newIdx);
            });
        }
    };

    const toFirestoreExercises = (): CustomExerciseBlock[] =>
        exercises.map(e => ({
            exerciseId: e.exercise.id,
            name: e.exercise.name,
            muscleGroup: e.exercise.muscleGroup,
            modality: e.exercise.modality,
            sets: e.sets,
            notes: e.notes || undefined,
        }));

    const handleSave = async () => {
        if (!user || exercises.length === 0) return;
        setSaving(true);
        try {
            const payload = {
                name,
                exercises: toFirestoreExercises(),
                emoji: "🏋️",
                color: "#3B82F6",
            };
            if (savedId) {
                await updateCustomWorkout(user.uid, savedId, payload);
            } else {
                const id = await saveCustomWorkout(user.uid, payload);
                setSavedId(id);
                onSaved?.(id);
            }
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4 pb-4">
            {/* ── Name ── */}
            <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />
                <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="flex-1 bg-transparent text-xl font-bold text-white outline-none placeholder-zinc-700"
                    placeholder="Workout name…"
                />
                {onCancel && (
                    <button onClick={onCancel} className="p-1.5 text-zinc-600 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* ── Stat pills ── */}
            <div className="flex gap-3 text-xs text-zinc-500">
                <div className="flex items-center gap-1"><Dumbbell className="w-3.5 h-3.5" />{exercises.length} exercises</div>
                <div className="flex items-center gap-1"><Repeat className="w-3.5 h-3.5" />{exercises.reduce((a, e) => a + e.sets.length, 0)} total sets</div>
                <div className="flex items-center gap-1">
                    <Timer className="w-3.5 h-3.5" />
                    ~{Math.round(exercises.reduce((a, e) => a + e.sets.reduce((sa, s) => sa + (s.restSeconds + 40), 0), 0) / 60)} min est.
                </div>
            </div>

            {/* ── DnD Exercise list ── */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext
                    items={exercises.map(e => e.uid)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2">
                        <AnimatePresence>
                            {exercises.map(item => (
                                <SortableExerciseRow
                                    key={item.uid}
                                    item={item}
                                    onUpdate={(updated) => updateExercise(item.uid, updated)}
                                    onRemove={() => removeExercise(item.uid)}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                </SortableContext>
            </DndContext>

            {/* Empty state */}
            {exercises.length === 0 && (
                <div className="border border-dashed border-white/10 rounded-2xl p-8 text-center">
                    <Dumbbell className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                    <p className="text-sm text-zinc-600">Tap "Add Exercise" to start building your routine</p>
                </div>
            )}

            {/* ── Add exercise button ── */}
            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSearch(true)}
                className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-200"
                style={{
                    background: "rgba(59,130,246,0.1)",
                    border: "1px dashed rgba(59,130,246,0.3)",
                    color: "#3B82F6",
                }}
            >
                <Plus className="w-4 h-4" /> Add Exercise
            </motion.button>

            {/* ── Search panel ── */}
            <AnimatePresence>
                {showSearch && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex flex-col justify-end"
                        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
                        onClick={(e) => { if (e.target === e.currentTarget) setShowSearch(false); }}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", stiffness: 380, damping: 38 }}
                            className="rounded-t-3xl p-4 sm:p-5 flex flex-col h-full overflow-hidden"
                            style={{
                                background: "#111113",
                                border: "1px solid rgba(255,255,255,0.08)",
                                maxHeight: "85vh",
                            }}
                        >
                            <ExerciseSearchPanel
                                addedIds={addedIds}
                                onAdd={(ex) => { addExercise(ex); }}
                                onClose={() => setShowSearch(false)}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Save button ── */}
            <motion.button
                onClick={handleSave}
                disabled={saving || exercises.length === 0 || !user}
                whileTap={{ scale: 0.97 }}
                className="btn w-full py-4 text-sm font-semibold flex items-center justify-center gap-2"
                style={{
                    background: saveSuccess
                        ? "linear-gradient(135deg,#059669,#10B981)"
                        : "linear-gradient(135deg,#6D28D9,#A855F7)",
                    boxShadow: saveSuccess
                        ? "0 8px 24px rgba(16,185,129,0.35)"
                        : "0 8px 24px rgba(139,92,246,0.35)",
                    color: "white",
                    opacity: exercises.length === 0 ? 0.4 : 1,
                }}
            >
                {saveSuccess
                    ? <><CheckCircle2 className="w-4 h-4" /> Saved!</>
                    : saving
                        ? <><Clock className="w-4 h-4 animate-spin" /> Saving…</>
                        : <><Save className="w-4 h-4" /> Save Routine</>
                }
            </motion.button>
        </div >
    );
}
