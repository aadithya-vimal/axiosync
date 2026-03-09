"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getOnboarding } from "@/lib/firestore";
import type { MuscleGroup } from "@/lib/WorkoutEngine";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

// ── Props ─────────────────────────────────────────────────────────────────────
interface AnatomyMapProps {
    activeMuscles?: MuscleGroup[];
    onMuscleClick?: (muscle: MuscleGroup) => void;
    className?: string;
}

// ── Muscle → color mapping ────────────────────────────────────────────────────
const MUSCLE_COLORS: Record<string, string> = {
    chest: "#3B82F6",
    back: "#A855F7",
    shoulders: "#06B6D4",
    biceps: "#F97316",
    triceps: "#EAB308",
    forearms: "#84CC16",
    core: "#F59E0B",
    glutes: "#EF4444",
    quads: "#22C55E",
    hamstrings: "#10B981",
    calves: "#14B8A6",
    obliques: "#F59E0B",
    full_body: "#8B5CF6",
    cardio: "#EF4444",
    adductors: "#EC4899",
    hip_flexors: "#F97316",
};

// ── Hotspot Coordinates (Percentages on Image 0-100%) ───────────────────────
// Assuming a vertically centered standard A-pose body in a square image
const MUSCLE_HOTSPOTS: Record<string, { x: number; y: number; size?: number }[]> = {
    chest: [{ x: 42, y: 30, size: 22 }, { x: 58, y: 30, size: 22 }],
    shoulders: [{ x: 28, y: 28, size: 20 }, { x: 72, y: 28, size: 20 }],
    biceps: [{ x: 24, y: 40, size: 18 }, { x: 76, y: 40, size: 18 }],
    triceps: [{ x: 20, y: 40, size: 15 }, { x: 80, y: 40, size: 15 }],
    forearms: [{ x: 16, y: 55, size: 15 }, { x: 84, y: 55, size: 15 }],
    core: [{ x: 50, y: 42, size: 25 }],
    obliques: [{ x: 38, y: 44, size: 18 }, { x: 62, y: 44, size: 18 }],
    quads: [{ x: 42, y: 65, size: 28 }, { x: 58, y: 65, size: 28 }],
    calves: [{ x: 38, y: 88, size: 20 }, { x: 62, y: 88, size: 20 }],
    // Back, Glutes, Hamstrings are posterior, but on a 2D map we show a broader, softer background glow
    back: [{ x: 50, y: 35, size: 40 }],
    glutes: [{ x: 50, y: 52, size: 30 }],
    hamstrings: [{ x: 42, y: 72, size: 25 }, { x: 58, y: 72, size: 25 }],
};

const MUSCLE_TO_REGION: Record<string, string[]> = {
    chest: ["chest"],
    back: ["back"],
    lower_back: ["core", "obliques"],
    shoulders: ["shoulders"],
    biceps: ["biceps"],
    triceps: ["triceps"],
    forearms: ["forearms"],
    core: ["core"],
    obliques: ["obliques"],
    abdominals: ["core"],
    glutes: ["glutes"],
    quads: ["quads"],
    hamstrings: ["hamstrings"],
    calves: ["calves"],
    full_body: ["chest", "shoulders", "core", "quads", "glutes", "biceps", "triceps", "calves", "back"],
    cardio: ["core", "quads", "calves"],
    adductors: ["quads"],
    hip_flexors: ["glutes", "quads"],
};

// ── Main export ───────────────────────────────────────────────────────────────
export default function AnatomyMap({ activeMuscles = [], onMuscleClick, className = "" }: AnatomyMapProps) {
    const { user } = useAuth();
    const [gender, setGender] = useState<"male" | "female" | "other">("male");

    useEffect(() => {
        if (!user) return;
        getOnboarding(user.uid).then(ob => {
            if (ob?.gender) setGender(ob.gender);
        });
    }, [user]);

    // Build set of highlighted regions
    const highlightedRegions = new Set<string>();
    const regionColors = new Map<string, string>();

    activeMuscles.forEach(muscle => {
        const regions = MUSCLE_TO_REGION[muscle] ?? [];
        regions.forEach(region => {
            highlightedRegions.add(region);
            regionColors.set(region, MUSCLE_COLORS[muscle] ?? "#3B82F6");
        });
    });

    return (
        <div className={`relative flex flex-col items-center w-full min-w-[280px] max-w-[400px] ${className}`}>
            {/* Gender badge */}
            <div className="mb-6 flex items-center gap-2 text-[11px] text-zinc-500 uppercase tracking-widest font-semibold bg-white/[0.02] px-3 py-1.5 rounded-full border border-white/[0.05]">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                Realistic {gender === "female" ? "Female" : "Male"} Engine
            </div>

            {/* Realistic Body Container */}
            <div className="relative w-full aspect-square rounded-[3rem] overflow-hidden bg-[#0A0A0F] border border-white/5 shadow-2xl flex items-center justify-center">

                {/* Fallback glow behind the image */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/10 to-transparent pointer-events-none" />

                <Image
                    src="/body-realistic.png"
                    alt="Realistic Anatomy"
                    fill
                    className="object-cover opacity-90 mix-blend-lighten pointer-events-none select-none transition-opacity duration-1000"
                    priority
                />

                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

                {/* Glowing Hotspots */}
                {Array.from(highlightedRegions).map(region => {
                    const spots = MUSCLE_HOTSPOTS[region] || [];
                    const color = regionColors.get(region) || "#3B82F6";
                    return spots.map((spot, i) => (
                        <motion.div
                            key={`${region}-${i}`}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{
                                opacity: [0.6, 1, 0.6],
                                scale: [1, 1.1, 1]
                            }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute rounded-full mix-blend-screen pointer-events-none"
                            style={{
                                left: `${spot.x}%`,
                                top: `${spot.y}%`,
                                transform: "translate(-50%, -50%)",
                                width: `${spot.size || 20}%`,
                                height: `${spot.size || 20}%`,
                                background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                                filter: "blur(12px)",
                            }}
                        />
                    ));
                })}
            </div>

            {/* Active muscle legend */}
            {activeMuscles.length > 0 && (
                <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-[280px]">
                    {activeMuscles.slice(0, 6).map(m => (
                        <span
                            key={m}
                            className="text-[10px] px-3 py-1 rounded-full font-bold capitalize"
                            style={{
                                background: `${MUSCLE_COLORS[m] ?? "#3B82F6"}25`,
                                color: MUSCLE_COLORS[m] ?? "#3B82F6",
                                border: `1px solid ${MUSCLE_COLORS[m] ?? "#3B82F6"}50`,
                                textShadow: `0 0 10px ${MUSCLE_COLORS[m]}80`
                            }}
                        >
                            {m.replace(/_/g, " ")}
                        </span>
                    ))}
                </div>
            )}

            {activeMuscles.length === 0 && (
                <p className="mt-6 text-[11px] text-zinc-600 text-center max-w-[200px] font-medium leading-relaxed">
                    Generate an AI routine to map targeted muscular exhaustion
                </p>
            )}
        </div>
    );
}

// Re-export for backward compat — old BodyAnalytics uses this
export { AnatomyMap };
