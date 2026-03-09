"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Compass, Flame, TrendingUp, Newspaper, BookmarkPlus, Play,
    CheckCircle2, ExternalLink, ChevronRight, Zap, RefreshCw,
    Calendar,
} from "lucide-react";
import { EXERCISE_DATABASE, type Exercise } from "@/lib/WorkoutEngine";
import { saveCustomWorkout, type CustomExerciseBlock } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";

const pageVariants = {
    initial: { opacity: 0, y: 16 },
    enter: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 320, damping: 30, mass: 0.8 } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.18 } },
};

// ── Seeded RNG for date-stable WOD ───────────────────────────────────────────
function seededRandom(seed: number) {
    let x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom(seed + i) * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function getDayOfYear(): number {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    return Math.floor((now.getTime() - start.getTime()) / 86400000);
}

function generateWOD(): { exercises: Exercise[]; focus: string; emoji: string } {
    const dayNum = getDayOfYear();
    const seed = dayNum * 31337;

    const FOCUSES = ["full body", "upper", "lower", "core & cardio", "push", "pull"];
    const focusIdx = Math.floor(seededRandom(seed) * FOCUSES.length);
    const focus = FOCUSES[focusIdx];

    let pool: Exercise[] = EXERCISE_DATABASE;
    if (focus === "upper" || focus === "push")
        pool = EXERCISE_DATABASE.filter(e => ["chest", "shoulders", "triceps"].includes(e.muscleGroup));
    else if (focus === "pull")
        pool = EXERCISE_DATABASE.filter(e => ["back", "biceps"].includes(e.muscleGroup));
    else if (focus === "lower")
        pool = EXERCISE_DATABASE.filter(e => ["quads", "hamstrings", "glutes", "calves"].includes(e.muscleGroup));
    else if (focus === "core & cardio")
        pool = EXERCISE_DATABASE.filter(e => ["core", "cardio"].includes(e.muscleGroup));
    else
        pool = EXERCISE_DATABASE.filter(e => e.isCompound);

    const shuffled = seededShuffle(pool, seed);
    const EMOJI_MAP: Record<string, string> = {
        "full body": "⚡", upper: "💪", lower: "🦵", "core & cardio": "🔥", push: "🏋️", pull: "🤸",
    };
    return { exercises: shuffled.slice(0, 6), focus, emoji: EMOJI_MAP[focus] ?? "🏋️" };
}

// ── WOD Component ─────────────────────────────────────────────────────────────
function WorkoutOfTheDay({ onSave }: { onSave: (exercises: Exercise[], name: string) => Promise<void> }) {
    const wod = useMemo(() => generateWOD(), []);
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

    const handleSave = async () => {
        setSaving(true);
        await onSave(wod.exercises, `WOD — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`);
        setSaved(true);
        setSaving(false);
    };

    return (
        <div className="card overflow-hidden" style={{ border: "1px solid rgba(239,68,68,0.2)" }}>
            {/* Banner */}
            <div className="px-5 py-4 flex items-center justify-between"
                style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(234,179,8,0.08) 100%)" }}>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Flame className="w-4 h-4 text-red-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Workout of the Day</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">{wod.emoji} {wod.focus.charAt(0).toUpperCase() + wod.focus.slice(1)} Blast</h3>
                    <div className="flex items-center gap-1.5 mt-0.5 text-zinc-500 text-xs">
                        <Calendar className="w-3 h-3" />{dateStr}
                    </div>
                </div>
                <div className="text-4xl opacity-20">{wod.emoji}</div>
            </div>

            {/* Exercise list */}
            <div className="divide-y divide-white/[0.05]">
                {wod.exercises.map((ex, i) => (
                    <div key={ex.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 text-red-400"
                            style={{ background: "rgba(239,68,68,0.12)" }}>{i + 1}</div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white truncate">{ex.name}</div>
                            <div className="text-[10px] text-zinc-600 capitalize">{ex.muscleGroup.replace("_", " ")}</div>
                        </div>
                        <div className="text-[10px] font-bold text-zinc-600">
                            {ex.duration_s ? `${ex.duration_s}s` : `3×12`}
                        </div>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 pt-3 flex gap-2">
                <motion.button whileTap={{ scale: 0.96 }} onClick={handleSave} disabled={saved || saving}
                    className="flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    style={saved
                        ? { background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#22C55E" }
                        : { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444" }
                    }>
                    {saved ? <><CheckCircle2 className="w-3.5 h-3.5" /> Saved!</> : <><BookmarkPlus className="w-3.5 h-3.5" /> Save to Library</>}
                </motion.button>
            </div>
        </div>
    );
}

// ── Trending Routines ─────────────────────────────────────────────────────────

interface TrendingRoutine {
    id: string;
    name: string;
    emoji: string;
    color: string;
    tag: string;
    exercises: string[];  // exercise IDs
    description: string;
}

const TRENDING: TrendingRoutine[] = [
    {
        id: "tr_push",
        name: "Push Day Power",
        emoji: "🏋️",
        color: "#3B82F6",
        tag: "Strength",
        description: "Classic push session targeting chest, shoulders, and triceps for maximum upper-body development.",
        exercises: ["push_up", "pike_push_up", "diamond_push_up", "tricep_dip", "incline_push_up", "lateral_raise_band"],
    },
    {
        id: "tr_pull",
        name: "Pull & Posture",
        emoji: "🤸",
        color: "#A855F7",
        tag: "Hypertrophy",
        description: "Pull-focused session to build a wide, strong back and powerful biceps.",
        exercises: ["pull_up", "archer_pull_up", "bodyweight_row", "chin_up", "bicep_curl_band", "face_pull_band"],
    },
    {
        id: "tr_glute",
        name: "Glute Builder",
        emoji: "🦵",
        color: "#EC4899",
        tag: "Hypertrophy",
        description: "High-volume glute and hamstring protocol designed to maximize posterior chain development.",
        exercises: ["glute_bridge", "single_leg_glute_bridge", "sumo_squat_bw", "romanian_deadlift_bw", "fire_hydrant", "donkey_kick"],
    },
    {
        id: "tr_hiit",
        name: "HIIT Finisher",
        emoji: "⚡",
        color: "#EF4444",
        tag: "HIIT",
        description: "10-minute calorie incinerator. Go hard, short rests, maximum output.",
        exercises: ["burpee", "jump_squat", "mountain_climber", "high_knees", "plank_to_downward_dog", "lateral_hop"],
    },
    {
        id: "tr_core",
        name: "Core Cathedral",
        emoji: "💎",
        color: "#F59E0B",
        tag: "Core",
        description: "Comprehensive core session from bracing basics to advanced isometric holds.",
        exercises: ["plank", "side_plank", "dead_bug", "ab_wheel", "hollow_body_hold", "v_up"],
    },
    {
        id: "tr_mobility",
        name: "Flow & Flex",
        emoji: "🧘",
        color: "#10B981",
        tag: "Mobility",
        description: "Dynamic mobility flow to open hips, thoracic spine, and shoulders. Great as warmup or cooldown.",
        exercises: ["world_greatest_stretch", "downward_dog", "pigeon_pose", "cat_cow", "thoracic_rotation", "90_90_hip"],
    },
];

function TrendingRoutineCard({
    routine,
    onSave,
}: {
    routine: TrendingRoutine;
    onSave: () => Promise<void>;
}) {
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await onSave();
        setSaved(true);
        setSaving(false);
    };

    // Look up exercises from our DB (fallback to name-only)
    const exs = routine.exercises.slice(0, 4)
        .map(id => EXERCISE_DATABASE.find(e => e.id === id)?.name ?? id.replace(/_/g, " "))
        .filter(Boolean);

    return (
        <motion.div whileTap={{ scale: 0.98 }} layout
            className="rounded-2xl overflow-hidden shrink-0 w-[260px] sm:w-auto flex flex-col"
            style={{ border: `1px solid ${routine.color}22`, background: "var(--bg-elevated)" }}
        >
            {/* Header */}
            <div className="px-4 py-3.5 flex items-start gap-3"
                style={{ background: `${routine.color}0D` }}>
                <span className="text-3xl mt-0.5">{routine.emoji}</span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-bold text-white truncate">{routine.name}</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: `${routine.color}20`, color: routine.color, border: `1px solid ${routine.color}35` }}>
                            {routine.tag}
                        </span>
                        <span className="text-[10px] text-zinc-600">{routine.exercises.length} exercises</span>
                    </div>
                </div>
            </div>

            <div className="px-4 py-3 flex-1">
                <p className="text-xs text-zinc-500 leading-relaxed">{routine.description}</p>
                <div className="mt-2.5 space-y-0.5">
                    {exs.map((name, i) => (
                        <div key={i} className="text-[11px] text-zinc-600 flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full shrink-0" style={{ background: routine.color }} />{name}
                        </div>
                    ))}
                    {routine.exercises.length > 4 && (
                        <div className="text-[11px] text-zinc-700">+{routine.exercises.length - 4} more…</div>
                    )}
                </div>
            </div>

            <div className="px-4 pb-4">
                <button onClick={handleSave} disabled={saved || saving}
                    className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    style={saved
                        ? { background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#22C55E" }
                        : { background: `${routine.color}14`, border: `1px solid ${routine.color}30`, color: routine.color }
                    }>
                    {saved
                        ? <><CheckCircle2 className="w-3.5 h-3.5" /> Saved!</>
                        : saving ? "Saving…"
                            : <><BookmarkPlus className="w-3.5 h-3.5" /> Save to Library</>
                    }
                </button>
            </div>
        </motion.div>
    );
}

// ── News Feed ─────────────────────────────────────────────────────────────────
interface Article { title: string; url: string; source: string; thumbnail?: string; pubDate: string; summary: string; }

const NEWS_COLORS = ["#3B82F6", "#A855F7", "#EF4444", "#F59E0B", "#10B981", "#06B6D4", "#EC4899", "#14B8A6"];

function NewsCard({ article, index }: { article: Article; index: number }) {
    const color = NEWS_COLORS[index % NEWS_COLORS.length];
    return (
        <a href={article.url === "#" ? undefined : article.url} target="_blank" rel="noopener noreferrer"
            className="card p-4 flex gap-3 items-start transition-all hover:bg-white/[0.04] cursor-pointer"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
            {/* Color indicator strip */}
            <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: color }} />
            <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color }}>{article.source}</div>
                <div className="text-sm font-semibold text-white leading-snug line-clamp-2">{article.title}</div>
                {article.summary && (
                    <p className="text-xs text-zinc-600 mt-1.5 line-clamp-2 leading-relaxed">{article.summary}</p>
                )}
                <div className="text-[10px] text-zinc-700 mt-2">{article.pubDate}</div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-700 shrink-0 mt-0.5" />
        </a>
    );
}

function NewsSection() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchNews = async () => {
        setLoading(true);
        setError(false);
        try {
            const res = await fetch("/api/news");
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            setArticles(data.articles ?? []);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchNews(); }, []);

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm font-bold text-white">Fitness News</span>
                    <span className="text-[10px] text-zinc-600 px-2 py-0.5 rounded-full border border-white/10">Live</span>
                </div>
                {!loading && (
                    <button onClick={fetchNews} className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors">
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="card p-4 h-20 animate-pulse" style={{ background: "var(--bg-elevated)" }} />
                    ))}
                </div>
            ) : error ? (
                <div className="card p-5 text-center">
                    <p className="text-sm text-zinc-600">Could not load news. <button onClick={fetchNews} className="text-blue-400 underline">Retry</button></p>
                </div>
            ) : (
                <div className="space-y-2">
                    {articles.map((article, i) => <NewsCard key={i} article={article} index={i} />)}
                </div>
            )}
        </div>
    );
}

// ── Main DiscoverSection ──────────────────────────────────────────────────────

export default function DiscoverSection() {
    const { user } = useAuth();
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

    const exercisesToBlocks = (exercises: Exercise[]) =>
        exercises.map<CustomExerciseBlock>(ex => ({
            exerciseId: ex.id,
            name: ex.name,
            muscleGroup: ex.muscleGroup,
            modality: ex.modality,
            sets: [
                { reps: 10, restSeconds: 60 },
                { reps: 10, restSeconds: 60 },
                { reps: 10, restSeconds: 60 },
            ],
        }));

    const saveRoutine = async (exercises: Exercise[], name: string, id?: string) => {
        if (!user) return;
        await saveCustomWorkout(user.uid, {
            name,
            exercises: exercisesToBlocks(exercises),
            emoji: "⭐",
            color: "#3B82F6",
        });
        if (id) setSavedIds(prev => new Set(prev).add(id));
    };

    const saveTrending = async (routine: TrendingRoutine) => {
        if (!user) return;
        const exercises = routine.exercises
            .map(id => EXERCISE_DATABASE.find(e => e.id === id))
            .filter(Boolean) as Exercise[];
        await saveCustomWorkout(user.uid, {
            name: routine.name,
            emoji: routine.emoji,
            color: routine.color,
            description: routine.description,
            exercises: exercisesToBlocks(exercises),
            isTrending: true,
        });
        setSavedIds(prev => new Set(prev).add(routine.id));
    };

    return (
        <motion.div key="discover" variants={pageVariants} initial="initial" animate="enter" exit="exit" className="space-y-6 pb-32">
            {/* Header */}
            <div className="flex items-center gap-3 px-1 pt-2">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                    <Compass className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Discover</h1>
                    <p className="text-xs text-zinc-600">Today&apos;s workout, trending plans & news</p>
                </div>
            </div>

            {/* WOD */}
            <WorkoutOfTheDay onSave={(exs, name) => saveRoutine(exs, name)} />

            {/* Trending */}
            <div>
                <div className="flex items-center gap-2 mb-3 px-0.5">
                    <TrendingUp className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-bold text-white">Trending Routines</span>
                    <span className="ml-auto text-[10px] text-zinc-600">Tap to save →</span>
                </div>

                {/* Horizontal scroll on mobile, 2-col grid on wider */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {TRENDING.map(r => (
                        <TrendingRoutineCard
                            key={r.id}
                            routine={r}
                            onSave={() => saveTrending(r)}
                        />
                    ))}
                </div>
            </div>

            {/* News */}
            <NewsSection />
        </motion.div>
    );
}
