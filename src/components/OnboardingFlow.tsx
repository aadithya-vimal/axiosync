"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { upsertOnboarding } from "@/lib/firestore";
import { ChevronRight, Target, Dumbbell, Heart, Zap, Check } from "lucide-react";

const GOALS = [
    { id: "build_muscle", label: "Build Muscle", emoji: "💪", desc: "Hypertrophy & strength gains" },
    { id: "lose_fat", label: "Lose Fat", emoji: "🔥", desc: "Cut body fat, lean physique" },
    { id: "improve_endurance", label: "Endurance", emoji: "🏃", desc: "Cardio capacity & VO2 max" },
    { id: "general_health", label: "General Health", emoji: "🌿", desc: "Overall wellness & longevity" },
] as const;

const MUSCLE_GROUPS = [
    { id: "full_body", label: "Full Body", emoji: "⚡" },
    { id: "chest", label: "Chest", emoji: "🫁" },
    { id: "back", label: "Back", emoji: "🔙" },
    { id: "shoulders", label: "Shoulders", emoji: "🤷" },
    { id: "biceps", label: "Biceps", emoji: "💪" },
    { id: "triceps", label: "Triceps", emoji: "✊" },
    { id: "core", label: "Core", emoji: "🎯" },
    { id: "quads", label: "Quads", emoji: "🦵" },
    { id: "hamstrings", label: "Hamstrings", emoji: "⬇️" },
    { id: "glutes", label: "Glutes", emoji: "🍑" },
    { id: "calves", label: "Calves", emoji: "👟" },
];

interface Props {
    onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: Props) {
    const { user } = useAuth();
    const [step, setStep] = useState(0);
    const [age, setAge] = useState("");
    const [height, setHeight] = useState("");
    const [weight, setWeight] = useState("");
    const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
    const [goal, setGoal] = useState<string>("");
    const [muscles, setMuscles] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    const totalSteps = 4;

    const toggleMuscle = (id: string) => {
        setMuscles(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
    };

    const handleFinish = async () => {
        if (!user) return;
        setSaving(true);
        await upsertOnboarding(user.uid, {
            completed: true,
            age: age ? parseInt(age) : undefined,
            height_cm: height ? parseInt(height) : undefined,
            weight_kg: weight ? parseFloat(weight) : undefined,
            gender: gender || undefined,
            primaryGoal: (goal as any) || undefined,
            targetMuscles: muscles,
        });
        onComplete();
    };

    const StepDots = () => (
        <div className="flex justify-center gap-2 mb-8">
            {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                    key={i}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                        width: i === step ? "24px" : "8px",
                        background: i <= step ? "#0A84FF" : "rgba(255,255,255,0.15)",
                    }}
                />
            ))}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center px-6">
            {/* Ambient orbs */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, #0A84FF, transparent)" }} />
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-8 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, #30D158, transparent)" }} />

            <div className="w-full max-w-sm">
                <StepDots />

                {/* Step 0: Welcome */}
                {step === 0 && (
                    <div className="space-y-6 text-center">
                        <div className="w-20 h-20 rounded-3xl bg-[#0A84FF] mx-auto flex items-center justify-center text-3xl font-bold" style={{ boxShadow: "0 0 40px rgba(10,132,255,0.45)" }}>
                            A
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">Welcome to Axiosync</h1>
                            <p className="text-zinc-500 mt-2 leading-relaxed">
                                Hey {user?.displayName?.split(" ")[0] || "there"} 👋<br />
                                Let's personalize your experience. Takes 30 seconds.
                            </p>
                        </div>
                        <button className="btn btn-primary w-full" onClick={() => setStep(1)}>
                            Let's go <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Step 1: Age & Gender */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">About you</h2>
                            <p className="text-zinc-500 text-sm mt-1">Helps us calculate your optimal zones.</p>
                        </div>

                        <div>
                            <label className="label">Age</label>
                            <input
                                type="number"
                                placeholder="e.g. 24"
                                value={age}
                                onChange={e => setAge(e.target.value)}
                                className="field"
                                min="13" max="100"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Height (cm)</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 175"
                                    value={height}
                                    onChange={e => setHeight(e.target.value)}
                                    className="field"
                                    min="100" max="250"
                                />
                            </div>
                            <div>
                                <label className="label">Weight (kg)</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 70"
                                    value={weight}
                                    onChange={e => setWeight(e.target.value)}
                                    className="field"
                                    min="30" max="250"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">Biological Sex</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(["male", "female", "other"] as const).map(g => (
                                    <button
                                        key={g}
                                        onClick={() => setGender(g)}
                                        className="py-3 rounded-2xl border font-medium text-sm capitalize transition-all duration-200"
                                        style={
                                            gender === g
                                                ? { background: "#0A84FF20", borderColor: "#0A84FF60", color: "#0A84FF" }
                                                : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "#71717a" }
                                        }
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button className="btn btn-ghost flex-1" onClick={() => setStep(0)}>Back</button>
                            <button className="btn btn-primary flex-1" onClick={() => setStep(2)}>Next</button>
                        </div>
                    </div>
                )}

                {/* Step 2: Primary Goal */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Primary Goal</h2>
                            <p className="text-zinc-500 text-sm mt-1">This tailors your analytics dashboard.</p>
                        </div>

                        <div className="space-y-2">
                            {GOALS.map(g => (
                                <button
                                    key={g.id}
                                    onClick={() => setGoal(g.id)}
                                    className="w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 text-left"
                                    style={
                                        goal === g.id
                                            ? { background: "#0A84FF15", borderColor: "#0A84FF50" }
                                            : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }
                                    }
                                >
                                    <span className="text-2xl">{g.emoji}</span>
                                    <div className="flex-1">
                                        <div className="text-white font-semibold">{g.label}</div>
                                        <div className="text-zinc-500 text-xs">{g.desc}</div>
                                    </div>
                                    {goal === g.id && <Check className="w-4 h-4 text-[#0A84FF]" />}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button className="btn btn-ghost flex-1" onClick={() => setStep(1)}>Back</button>
                            <button className="btn btn-primary flex-1" onClick={() => setStep(3)} disabled={!goal}>Next</button>
                        </div>
                    </div>
                )}

                {/* Step 3: Target Muscles */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Target Areas</h2>
                            <p className="text-zinc-500 text-sm mt-1">Select the muscle groups you want to focus on.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {MUSCLE_GROUPS.map(m => {
                                const selected = muscles.includes(m.id);
                                return (
                                    <button
                                        key={m.id}
                                        onClick={() => toggleMuscle(m.id)}
                                        className="flex items-center gap-2.5 p-3 rounded-2xl border transition-all duration-200 text-sm font-medium"
                                        style={
                                            selected
                                                ? { background: "#0A84FF18", borderColor: "#0A84FF55", color: "#0A84FF" }
                                                : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)", color: "#71717a" }
                                        }
                                    >
                                        <span>{m.emoji}</span>
                                        <span>{m.label}</span>
                                        {selected && <Check className="w-3.5 h-3.5 ml-auto" />}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex gap-3">
                            <button className="btn btn-ghost flex-1" onClick={() => setStep(2)}>Back</button>
                            <button
                                className="btn btn-primary flex-1"
                                onClick={handleFinish}
                                disabled={saving}
                            >
                                {saving ? "Saving…" : "Start Training 🚀"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
