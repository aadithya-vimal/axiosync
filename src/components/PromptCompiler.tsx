"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
    getWorkoutLogs, getActivityLogs, getNutritionLogs, getSleepLogs, getReadinessLogs,
    type WorkoutLog, type ActivityLog, type NutritionLog, type SleepLog, type ReadinessLog,
} from "@/lib/firestore";
import { Brain, Copy, CheckCircle, Download, Loader2, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

type DateRange = 7 | 14 | 30;

// ── Prompt builder ─────────────────────────────────────────────────────────────

function buildPrompt(opts: {
    range: DateRange;
    workouts: WorkoutLog[];
    activities: ActivityLog[];
    nutrition: NutritionLog[];
    sleep: SleepLog[];
    readiness: ReadinessLog[];
    userName?: string;
}): string {
    const { range, workouts, activities, nutrition, sleep, readiness, userName } = opts;

    // Aggregate stats
    const totalVolume = workouts.reduce((a, w) => a + (w.total_volume_kg || 0), 0);
    const avgSleep = sleep.length ?
        sleep.reduce((a, s) => a + (s.duration_hours || 0), 0) / sleep.length : 0;
    const avgCalories = nutrition.length ?
        nutrition.reduce((a, n) => a + (n.calories || 0), 0) / nutrition.length : 0;
    const avgProtein = nutrition.length ?
        nutrition.reduce((a, n) => a + (n.protein_g || 0), 0) / nutrition.length : 0;
    const avgReadiness = readiness.length ?
        readiness.reduce((a, r) => a + r.readiness_pct, 0) / readiness.length : 0;
    const latestHRV = readiness[0]?.hrv_ms;
    const latestRestHR = readiness[0]?.resting_hr;
    const totalCardioKm = activities.reduce((a, b) => a + (b.distance_km || 0), 0);
    const totalCardioMin = activities.reduce((a, b) => a + b.duration_min, 0);

    // Muscle group frequency
    const muscleFreq: Record<string, number> = {};
    workouts.forEach(w => {
        w.exercises?.forEach((ex: any) => {
            const mg = ex.muscleGroup || "unknown";
            muscleFreq[mg] = (muscleFreq[mg] || 0) + (ex.sets?.length || 0);
        });
    });
    const topMuscles = Object.entries(muscleFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Activity modalities
    const modalityFreq: Record<string, number> = {};
    activities.forEach(a => { modalityFreq[a.type] = (modalityFreq[a.type] || 0) + 1; });

    // Sleep quality trend
    const avgSleepQuality = sleep.length ?
        sleep.reduce((a, s) => a + (s.quality_score || 0), 0) / sleep.length : 0;

    // Session dates for spacing analysis
    const workoutDates = workouts.map(w => w.timestamp?.toDate?.()?.toISOString().split("T")[0] || "").filter(Boolean);

    const lines: string[] = [
        `═══════════════════════════════════════════════════`,
        `  AXIOSYNC HEALTH DATA — COACHING ANALYSIS BRIEF`,
        `  Period: Last ${range} Days`,
        `  Athlete: ${userName || "User"}`,
        `═══════════════════════════════════════════════════`,
        ``,
        `ROLE: You are an expert strength & conditioning coach and sports nutritionist. Analyze the following ${range}-day health data and provide specific, actionable coaching insights. Be direct, data-driven, and prescriptive.`,
        ``,
        `────────────────────────────────────────────────────`,
        `SECTION 1: TRAINING DATA`,
        `────────────────────────────────────────────────────`,
        `Total Strength Sessions: ${workouts.length}`,
        `Total Volume Lifted: ${Math.round(totalVolume).toLocaleString()} kg`,
        `Average Session Volume: ${workouts.length ? Math.round(totalVolume / workouts.length) : 0} kg`,
        `Training Frequency: ${(workouts.length / (range / 7)).toFixed(1)} sessions/week`,
        workoutDates.length > 0 ? `Session Dates: ${workoutDates.slice(0, 10).join(", ")}${workoutDates.length > 10 ? "..." : ""}` : "No sessions logged.",
        ``,
        `Top Muscle Groups (by sets):`,
        ...topMuscles.map(([mg, sets]) => `  • ${mg.charAt(0).toUpperCase() + mg.slice(1)}: ${sets} sets`),
        topMuscles.length === 0 ? "  No muscle data logged." : "",
        ``,
        `────────────────────────────────────────────────────`,
        `SECTION 2: CARDIO & ENDURANCE`,
        `────────────────────────────────────────────────────`,
        `Cardio Sessions: ${activities.length}`,
        `Total Distance: ${totalCardioKm.toFixed(1)} km`,
        `Total Cardio Time: ${Math.round(totalCardioMin)} min`,
        `Modalities Used:`,
        ...Object.entries(modalityFreq).map(([type, count]) => `  • ${type.charAt(0).toUpperCase() + type.slice(1)}: ${count} sessions`),
        activities.length === 0 ? "  No cardio logged." : "",
        ``,
        `────────────────────────────────────────────────────`,
        `SECTION 3: NUTRITION DATA`,
        `────────────────────────────────────────────────────`,
        `Days Logged: ${nutrition.length}`,
        `Average Daily Calories: ${Math.round(avgCalories)} kcal`,
        `Average Daily Protein: ${Math.round(avgProtein)}g`,
        nutrition.length > 0 ? `Average Daily Carbs: ${Math.round(nutrition.reduce((a, n) => a + (n.carbs_g || 0), 0) / nutrition.length)}g` : "",
        nutrition.length > 0 ? `Average Daily Fat: ${Math.round(nutrition.reduce((a, n) => a + (n.fat_g || 0), 0) / nutrition.length)}g` : "",
        nutrition.length === 0 ? "  No nutrition data logged." : "",
        ``,
        `────────────────────────────────────────────────────`,
        `SECTION 4: SLEEP DATA`,
        `────────────────────────────────────────────────────`,
        `Nights Logged: ${sleep.length}`,
        `Average Duration: ${avgSleep.toFixed(1)} hours`,
        `Average Quality Score: ${avgSleepQuality.toFixed(1)}/10`,
        sleep.length === 0 ? "  No sleep data logged." : "",
        ``,
        `────────────────────────────────────────────────────`,
        `SECTION 5: READINESS & HRV`,
        `────────────────────────────────────────────────────`,
        `Days Logged: ${readiness.length}`,
        `Average Readiness: ${Math.round(avgReadiness)}%`,
        latestHRV ? `Latest HRV: ${latestHRV}ms` : "HRV: Not logged",
        latestRestHR ? `Latest Resting HR: ${latestRestHR} bpm` : "Resting HR: Not logged",
        readiness.length === 0 ? "  No readiness data logged." : "",
        ``,
        `══════════════════════════════════════════════════`,
        `COACHING QUESTIONS — Please Answer:`,
        `══════════════════════════════════════════════════`,
        `1. Based on the training volume and frequency, am I in an optimal range for my goal, or am I overtraining/undertraining?`,
        `2. Are there any muscle group imbalances I should address based on my training distribution?`,
        `3. Is my nutrition (calories + protein) adequate to support my training load? What adjustments should I make?`,
        `4. What does my sleep data suggest about recovery quality, and how is it impacting my readiness scores?`,
        `5. If my readiness is frequently below 70%, what are the most likely causes and solutions?`,
        `6. Give me a specific, structured recommendation for the next 7 days (training split + nutrition target + sleep goal).`,
        ``,
        `════════════════════════════════════════════════════`,
        `[END OF AXIOSYNC DATA BRIEF]`,
        `════════════════════════════════════════════════════`,
    ];

    return lines.filter(l => l !== null && l !== undefined).join("\n");
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function PromptCompiler() {
    const { user } = useAuth();
    const [range, setRange] = useState<DateRange>(14);
    const [loading, setLoading] = useState(false);
    const [prompt, setPrompt] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const compile = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const [workouts, activities, nutrition, sleep, readiness] = await Promise.all([
            getWorkoutLogs(user.uid, range),
            getActivityLogs(user.uid, range),
            getNutritionLogs(user.uid, range),
            getSleepLogs(user.uid, range),
            getReadinessLogs(user.uid, range),
        ]);
        const text = buildPrompt({
            range, workouts, activities, nutrition, sleep, readiness,
            userName: user.displayName || undefined,
        });
        setPrompt(text);
        setShowPreview(true);
        setLoading(false);
    }, [user, range]);

    const handleCopy = async () => {
        if (!prompt) return;
        await navigator.clipboard.writeText(prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleDownload = () => {
        if (!prompt) return;
        const blob = new Blob([prompt], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `axiosync-coaching-brief-${range}d-${new Date().toISOString().split("T")[0]}.txt`;
        a.click(); URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.25)" }}>
                    <Brain className="w-5 h-5 text-[#A855F7]" />
                </div>
                <div>
                    <h3 className="font-semibold text-white">AI Coaching Brief Compiler</h3>
                    <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                        Aggregates your Firebase data into a structured prompt — paste it into ChatGPT, Claude, or Gemini for personalized coaching.
                    </p>
                </div>
            </div>

            {/* Range selector */}
            <div>
                <p className="section-header">Time Range</p>
                <div className="flex gap-2">
                    {([7, 14, 30] as DateRange[]).map(r => (
                        <button
                            key={r}
                            onClick={() => { setRange(r); setPrompt(null); }}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                            style={range === r
                                ? { background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.35)", color: "#A855F7" }
                                : { background: "var(--bg-overlay)", border: "1px solid rgba(255,255,255,0.07)", color: "var(--text-muted)" }
                            }
                        >
                            {r} days
                        </button>
                    ))}
                </div>
            </div>

            {/* Generate button */}
            <motion.button
                onClick={compile}
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="btn w-full py-3.5 font-semibold text-sm"
                style={{
                    background: "linear-gradient(135deg, #7C3AED 0%, #A855F7 50%, #7C3AED 100%)",
                    backgroundSize: "200% 100%",
                    boxShadow: "0 4px 20px rgba(168,85,247,0.3), 0 1px 0 rgba(255,255,255,0.1) inset",
                    color: "white",
                }}
            >
                {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Compiling…</>
                    : <><Sparkles className="w-4 h-4" /> Generate {range}-Day Coaching Brief</>
                }
            </motion.button>

            {/* Preview pane */}
            <AnimatePresence>
                {prompt && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                    >
                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowPreview(v => !v)}
                                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-medium"
                            >
                                {showPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                {showPreview ? "Hide" : "Show"} Preview
                            </button>
                            <div className="flex-1" />
                            <motion.button
                                onClick={handleCopy}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                                style={copied
                                    ? { background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#22C55E" }
                                    : { background: "var(--bg-elevated)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)" }
                                }
                            >
                                {copied ? <><CheckCircle className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                            </motion.button>
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                                style={{ background: "var(--bg-elevated)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)" }}
                            >
                                <Download className="w-3.5 h-3.5" /> Save
                            </button>
                        </div>

                        {/* Char count */}
                        <div className="text-[10px] text-zinc-700 text-right">{prompt.length.toLocaleString()} characters · ready to paste into any AI</div>

                        {/* Prompt preview */}
                        <AnimatePresence>
                            {showPreview && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 240, opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <textarea
                                        readOnly
                                        value={prompt}
                                        className="w-full h-60 font-mono text-[10px] leading-relaxed text-zinc-400 resize-none focus:outline-none thin-scrollbar"
                                        style={{ background: "var(--bg-base)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 14px" }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* CTA links */}
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { name: "ChatGPT", url: "https://chat.openai.com", emoji: "🤖" },
                                { name: "Claude", url: "https://claude.ai", emoji: "🧠" },
                                { name: "Gemini", url: "https://gemini.google.com", emoji: "✨" },
                            ].map(({ name, url, emoji }) => (
                                <a
                                    key={name}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 transition-all hover:text-white"
                                    style={{ background: "var(--bg-overlay)", border: "1px solid rgba(255,255,255,0.06)" }}
                                >
                                    {emoji} {name}
                                </a>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
