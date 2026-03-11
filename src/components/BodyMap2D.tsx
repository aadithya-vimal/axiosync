"use client";

import { useTheme } from "next-themes";
import { BodyComponent } from "reactjs-human-body";
import type { MuscleGroup } from "@/lib/WorkoutEngine";

// ── Props ─────────────────────────────────────────────────────────────────────
interface AnatomyMapProps {
    activeMuscles?: MuscleGroup[];
    onMuscleClick?: (muscle: MuscleGroup) => void;
    className?: string;
}

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
};

export default function AnatomyMap({ activeMuscles = [], onMuscleClick, className = "" }: AnatomyMapProps) {
    const { theme, systemTheme } = useTheme();
    const isDark = (theme === "system" ? systemTheme : theme) === "dark";

    // Build partsInput for reactjs-human-body
    const partsInput: Record<string, { show: boolean; selected: boolean }> = {
        head: { show: true, selected: false },
        leftShoulder: { show: true, selected: false },
        rightShoulder: { show: true, selected: false },
        leftArm: { show: true, selected: false },
        rightArm: { show: true, selected: false },
        chest: { show: true, selected: false },
        stomach: { show: true, selected: false },
        leftLeg: { show: true, selected: false },
        rightLeg: { show: true, selected: false },
        leftHand: { show: true, selected: false },
        rightHand: { show: true, selected: false },
        leftFoot: { show: true, selected: false },
        rightFoot: { show: true, selected: false },
    };

    // Convert Axiosync muscle names to reactjs-human-body part IDs
    const mapping: Record<string, string[]> = {
        chest: ["chest"],
        back: ["chest", "stomach"],
        shoulders: ["leftShoulder", "rightShoulder"],
        biceps: ["leftArm", "rightArm"],
        triceps: ["leftArm", "rightArm"],
        forearms: ["leftHand", "rightHand"],
        core: ["stomach"],
        glutes: ["leftLeg", "rightLeg"],
        quads: ["leftLeg", "rightLeg"],
        hamstrings: ["leftLeg", "rightLeg"],
        calves: ["leftFoot", "rightFoot"],
        full_body: ["leftShoulder", "rightShoulder", "leftArm", "rightArm", "chest", "stomach", "leftLeg", "rightLeg", "leftHand", "rightHand", "leftFoot", "rightFoot"]
    };

    activeMuscles.forEach(muscle => {
        const parts = mapping[muscle] || [];
        parts.forEach(p => {
            if (partsInput[p]) {
                partsInput[p] = { show: true, selected: true };
            }
        });
    });

    return (
        <div className={`relative flex flex-col items-center w-full md:w-full md:max-w-[500px] ${className}`}>
            <style>{`
                .human-body svg.leftShoulder.selected path, .human-body svg.rightShoulder.selected path { fill: ${MUSCLE_COLORS.shoulders} !important; opacity: 1 !important; }
                .human-body svg.chest.selected path { fill: ${MUSCLE_COLORS.chest} !important; opacity: 1 !important; }
                .human-body svg.leftArm.selected path, .human-body svg.rightArm.selected path { 
                    fill: ${activeMuscles.includes('biceps') ? MUSCLE_COLORS.biceps : activeMuscles.includes('triceps') ? MUSCLE_COLORS.triceps : "#d68a80"} !important; 
                    opacity: 1 !important; 
                }
                .human-body svg.stomach.selected path { fill: ${MUSCLE_COLORS.core} !important; opacity: 1 !important; }
                .human-body svg.leftLeg.selected path, .human-body svg.rightLeg.selected path { 
                    fill: ${activeMuscles.includes('quads') ? MUSCLE_COLORS.quads : activeMuscles.includes('hamstrings') ? MUSCLE_COLORS.hamstrings : activeMuscles.includes('glutes') ? MUSCLE_COLORS.glutes : "#d68a80"} !important; 
                    opacity: 1 !important; 
                }
                .human-body svg.leftFoot.selected path, .human-body svg.rightFoot.selected path { fill: ${MUSCLE_COLORS.calves} !important; opacity: 1 !important; }
                .human-body svg.leftHand.selected path, .human-body svg.rightHand.selected path { fill: ${MUSCLE_COLORS.forearms} !important; opacity: 1 !important; }
                .human-body svg:not(.selected) path { fill: var(--border-strong) !important; opacity: 0.5 !important; }
                .human-body svg.head path { fill: var(--border-strong) !important; opacity: 0.3 !important; }
                
                /* BodyMap 207x500 box constraints */
                .map-scaler {
                    width: 207px;
                    height: 500px;
                    display: block;
                    margin: 0 auto;
                }
            `}</style>
            <div className="relative w-full aspect-[2/3] md:aspect-auto md:h-[650px] rounded-[2rem] overflow-hidden bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-sm flex items-center justify-center p-2">
                <div className="map-scaler origin-center scale-[1.0] sm:scale-[1.1] md:scale-[1.1] lg:scale-[1.3] [&_.human-body]:!m-0">
                    <BodyComponent
                        key={JSON.stringify(activeMuscles)}
                        partsInput={partsInput as any}
                    />
                </div>
            </div>

            {activeMuscles.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-1.5 max-w-[280px]">
                    {activeMuscles.slice(0, 6).map(m => (
                        <span
                            key={m}
                            className="text-[10px] px-2.5 py-1 rounded-full font-bold capitalize"
                            style={{
                                background: `${MUSCLE_COLORS[m] ?? "#3B82F6"}15`,
                                color: MUSCLE_COLORS[m] ?? "#3B82F6",
                            }}
                        >
                            {m.replace(/_/g, " ")}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
