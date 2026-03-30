"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { MuscleGroup } from "@/lib/WorkoutEngine";

// Dynamically import to prevent SSR issues with SVG window refs
const BodyModel = dynamic(() => import("react-body-highlighter"), { ssr: false });

export default function BodyMap2D({
    targetMuscles = [],
    activeMuscle,
    onSelect
}: {
    targetMuscles?: MuscleGroup[];
    activeMuscle?: MuscleGroup | null;
    onSelect?: (m: MuscleGroup) => void;
}) {
    // Map our local MuscleGroup system to react-body-highlighter strings
    const MUSCLE_MAP: Record<string, string[]> = {
        chest: ["chest"],
        upper_chest: ["chest"],
        back: ["upper-back", "lower-back", "trapezius"],
        lats: ["upper-back"],
        rhomboids: ["upper-back"],
        traps: ["trapezius"],
        lower_back: ["lower-back"],
        shoulders: ["front-deltoids", "back-deltoids"],
        front_delts: ["front-deltoids"],
        rear_delts: ["back-deltoids"],
        core: ["abs", "obliques"],
        obliques: ["obliques"],
        lower_abs: ["abs"],
        upper_abs: ["abs"],
        quads: ["quadriceps"],
        adductors: ["adductor"],
        hip_flexors: ["quadriceps"],
        glutes: ["gluteal"],
        hamstrings: ["hamstring"],
        calves: ["calves"],
        biceps: ["biceps"],
        triceps: ["triceps"],
        forearms: ["forearm"],
        grip: ["forearm"],
        arms: ["biceps", "triceps", "forearm"],
        neck: ["trapezius"],
        cardio: ["chest"], // Cardio doesn't have a distinct muscle, highlight chest (heart)
        full_body: ["chest", "upper-back", "lower-back", "trapezius", "front-deltoids", "back-deltoids", "abs", "obliques", "quadriceps", "gluteal", "hamstring", "calves", "biceps", "triceps"]
    };

    const REVERSE_MAP: Record<string, MuscleGroup> = {
        "chest": "chest",
        "upper-back": "back",
        "lower-back": "back",
        "trapezius": "back",
        "front-deltoids": "shoulders",
        "back-deltoids": "shoulders",
        "abs": "core",
        "obliques": "core",
        "quadriceps": "quads",
        "gluteal": "glutes",
        "hamstring": "hamstrings",
        "calves": "calves",
        "biceps": "biceps",
        "triceps": "triceps",
        "forearm": "forearms",
        "adductor": "adductors",
    };

    const exerciseData: any[] = useMemo(() => {
        let allMuscles: string[] = [];
        
        targetMuscles.forEach(tm => {
            if (MUSCLE_MAP[tm]) allMuscles.push(...MUSCLE_MAP[tm]);
        });
        
        if (activeMuscle && MUSCLE_MAP[activeMuscle]) {
            allMuscles.push(...MUSCLE_MAP[activeMuscle]);
        }
        
        return [{ name: "Target Focus", muscles: Array.from(new Set(allMuscles)) }];
    }, [targetMuscles, activeMuscle]);

    const handleClick = ({ muscle }: { muscle: string }) => {
        if (!onSelect) return;
        const mapped = REVERSE_MAP[muscle];
        if (mapped) onSelect(mapped);
    };

    return (
        <div className="w-full flex justify-center gap-4 py-8 pointer-events-auto">
            <div className="w-[140px] sm:w-[160px] cursor-pointer">
                <BodyModel
                    data={exerciseData}
                    style={{ width: "100%", height: "auto" }}
                    bodyColor="var(--bg-elevated)"
                    highlightedColors={["#3B82F6", "#8B5CF6"]} // Use blue and purple highlights
                    type="anterior"
                    onClick={handleClick}
                />
            </div>
            <div className="w-[140px] sm:w-[160px] cursor-pointer">
                <BodyModel
                    data={exerciseData}
                    style={{ width: "100%", height: "auto" }}
                    bodyColor="var(--bg-elevated)"
                    highlightedColors={["#3B82F6", "#8B5CF6"]}
                    type="posterior"
                    onClick={handleClick}
                />
            </div>
            {/* Note: In future versions, female SVGs will need to be provided as a custom render map since the base package defaults to standard anatomic */}
        </div>
    );
}
