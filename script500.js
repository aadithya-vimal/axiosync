const fs = require('fs');
const path = require('path');

const baseExercises = [
    { id: "pushup", name: "Push-Up", mg: "chest", smg: ["triceps", "shoulders"], eq: ["bodyweight"], c: true, m: "strength", diff: 1 },
    { id: "pullup", name: "Pull-Up", mg: "back", smg: ["biceps", "forearms"], eq: ["pull_up_bar"], c: true, m: "strength", diff: 2 },
    { id: "squat", name: "Squat", mg: "quads", smg: ["glutes", "hamstrings", "calves"], eq: ["bodyweight"], c: true, m: "strength", diff: 1 },
    { id: "lunge", name: "Lunge", mg: "quads", smg: ["glutes", "hamstrings"], eq: ["bodyweight"], c: true, m: "strength", diff: 1 },
    { id: "glute_bridge", name: "Glute Bridge", mg: "glutes", smg: ["hamstrings", "lower_back"], eq: ["floor"], c: true, m: "strength", diff: 1 },
    { id: "plank", name: "Plank", mg: "core", smg: ["shoulders", "obliques"], eq: ["floor"], c: true, m: "isometric", diff: 1, dur: 45 },
    { id: "row", name: "Row", mg: "back", smg: ["biceps", "rear_delts"], eq: ["dumbbell"], c: true, m: "strength", diff: 1 },
    { id: "ohp", name: "Overhead Press", mg: "shoulders", smg: ["triceps"], eq: ["dumbbell"], c: true, m: "strength", diff: 1 },
    { id: "rdl", name: "Romanian Deadlift", mg: "hamstrings", smg: ["glutes", "lower_back", "grip"], eq: ["dumbbell"], c: true, m: "strength", diff: 1 },
    { id: "curl", name: "Bicep Curl", mg: "biceps", smg: ["forearms"], eq: ["dumbbell"], c: false, m: "strength", diff: 1 },
    { id: "extension", name: "Tricep Extension", mg: "triceps", smg: [], eq: ["dumbbell"], c: false, m: "strength", diff: 1 },
    { id: "crunch", name: "Crunch", mg: "core", smg: [], eq: ["floor"], c: false, m: "strength", diff: 1 },
    { id: "calf_raise", name: "Calf Raise", mg: "calves", smg: [], eq: ["bodyweight"], c: false, m: "strength", diff: 1 },
    { id: "lateral_raise", name: "Lateral Raise", mg: "shoulders", smg: ["traps"], eq: ["dumbbell"], c: false, m: "strength", diff: 1 },
    { id: "shrug", name: "Shrug", mg: "traps", smg: ["grip", "neck"], eq: ["dumbbell"], c: false, m: "strength", diff: 1 },
    { id: "fly", name: "Chest Fly", mg: "chest", smg: [], eq: ["dumbbell", "bench"], c: false, m: "strength", diff: 2 },
    { id: "pullover", name: "Pullover", mg: "back", smg: ["chest", "lats"], eq: ["dumbbell", "bench"], c: true, m: "strength", diff: 2 },
    { id: "dip", name: "Dip", mg: "chest", smg: ["triceps"], eq: ["chair", "bench"], c: true, m: "strength", diff: 2 },
    { id: "leg_raise", name: "Leg Raise", mg: "core", smg: ["hip_flexors"], eq: ["floor"], c: false, m: "strength", diff: 1 },
    { id: "russian_twist", name: "Russian Twist", mg: "obliques", smg: ["core"], eq: ["floor"], c: false, m: "strength", diff: 1 },
    { id: "mountain_climber", name: "Mountain Climber", mg: "cardio", smg: ["core", "shoulders"], eq: ["floor"], c: true, m: "cardio", diff: 1, dur: 30 },
    { id: "burpee", name: "Burpee", mg: "cardio", smg: ["chest", "quads", "core"], eq: ["bodyweight"], c: true, m: "plyometric", diff: 2 },
    { id: "jumping_jack", name: "Jumping Jack", mg: "cardio", smg: ["calves"], eq: ["bodyweight"], c: true, m: "cardio", diff: 1, dur: 45 },
    { id: "high_knees", name: "High Knees", mg: "cardio", smg: ["hip_flexors"], eq: ["bodyweight"], c: true, m: "cardio", diff: 1, dur: 30 },
    { id: "good_morning", name: "Good Morning", mg: "lower_back", smg: ["hamstrings"], eq: ["bodyweight"], c: true, m: "strength", diff: 1 },
];

const modifiers = [
    { prefix: "Standard", eq: [], diffMod: 0, durMod: 0, forceM: null },
    { prefix: "Tempo (3-1-3)", eq: [], diffMod: 1, durMod: 15, forceM: null },
    { prefix: "Explosive", eq: [], diffMod: 1, durMod: 0, forceM: "plyometric" },
    { prefix: "Isometric Hold", eq: [], diffMod: 1, durMod: 30, forceM: "isometric" },
    { prefix: "Dumbbell", eq: ["dumbbell"], diffMod: 1, durMod: 0, forceM: null },
    { prefix: "Banded", eq: ["resistance_band"], diffMod: 0, durMod: 0, forceM: null },
    { prefix: "Kettlebell", eq: ["kettlebell"], diffMod: 1, durMod: 0, forceM: null },
    { prefix: "Alternating", eq: [], diffMod: 0, durMod: 0, forceM: null },
    { prefix: "Single-Arm/Leg", eq: [], diffMod: 2, durMod: 0, forceM: null },
    { prefix: "Deficit/Deep", eq: ["chair", "bench"], diffMod: 1, durMod: 0, forceM: null },
    { prefix: "Pause", eq: [], diffMod: 1, durMod: 10, forceM: null },
    { prefix: "Weighted", eq: ["backpack"], diffMod: 1, durMod: 0, forceM: null },
    { prefix: "Decline", eq: ["bench", "chair"], diffMod: 1, durMod: 0, forceM: null },
    { prefix: "Incline", eq: ["bench", "chair"], diffMod: -1, durMod: 0, forceM: null },
    { prefix: "Negative/Eccentric", eq: [], diffMod: 1, durMod: 20, forceM: null },
    { prefix: "1.5 Rep", eq: [], diffMod: 2, durMod: 0, forceM: null },
    { prefix: "Plyo", eq: [], diffMod: 2, durMod: 0, forceM: "plyometric" },
    { prefix: "Pulse", eq: [], diffMod: 0, durMod: 0, forceM: null },
    { prefix: "Yoga/Flow", eq: [], diffMod: -1, durMod: 20, forceM: "mobility" },
    { prefix: "Close-Grip/Stance", eq: [], diffMod: 1, durMod: 0, forceM: null },
    { prefix: "Wide-Grip/Stance", eq: [], diffMod: 0, durMod: 0, forceM: null },
];

const pureMobility = [
    { id: "cat_cow", name: "Cat-Cow Stretch", muscleGroup: "lower_back", secondaryMuscles: ["core"], equipment: ["floor"], isCompound: true, modality: "mobility", difficulty: 1, duration_s: 45, instructions: "Arch and round back slowly.", imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&q=40" },
    { id: "world_greatest", name: "World's Greatest Stretch", muscleGroup: "hip_flexors", secondaryMuscles: ["chest", "quads", "lower_back"], equipment: ["floor"], isCompound: true, modality: "mobility", difficulty: 1, duration_s: 45, instructions: "Lunge and twist towards the front leg.", imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&q=40" },
    { id: "down_dog", name: "Downward Dog", muscleGroup: "calves", secondaryMuscles: ["hamstrings", "shoulders"], equipment: ["floor"], isCompound: true, modality: "mobility", difficulty: 1, duration_s: 45, instructions: "Inverted V shape, press heels to floor.", imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&q=40" },
    { id: "up_dog", name: "Upward Dog", muscleGroup: "core", secondaryMuscles: ["lower_back", "chest"], equipment: ["floor"], isCompound: true, modality: "mobility", difficulty: 1, duration_s: 30, instructions: "Hips to floor, chest up.", imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&q=40" },
    { id: "childs_pose", name: "Child's Pose", muscleGroup: "lats", secondaryMuscles: ["lower_back", "shoulders"], equipment: ["floor"], isCompound: true, modality: "mobility", difficulty: 1, duration_s: 45, instructions: "Sit back on heels, stretch arms forward.", imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&q=40" },
    { id: "thread_needle", name: "Thread the Needle", muscleGroup: "shoulders", secondaryMuscles: [], equipment: ["floor"], isCompound: false, modality: "mobility", difficulty: 1, duration_s: 45, instructions: "Reach under torso to stretch rear delt.", imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&q=40" },
    { id: "pigeon_pose", name: "Pigeon Pose", muscleGroup: "glutes", secondaryMuscles: ["hip_flexors"], equipment: ["floor"], isCompound: false, modality: "mobility", difficulty: 1, duration_s: 60, instructions: "Fold over front bent leg.", imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&q=40" },
    { id: "90_90", name: "90/90 Hip Stretch", muscleGroup: "hip_flexors", secondaryMuscles: ["glutes"], equipment: ["floor"], isCompound: false, modality: "mobility", difficulty: 1, duration_s: 45, instructions: "Both legs at 90 degrees on floor, rotate hips.", imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&q=40" },
    { id: "cossack_squat", name: "Cossack Squat", muscleGroup: "adductors", secondaryMuscles: ["quads", "glutes"], equipment: ["floor"], isCompound: true, modality: "mobility", difficulty: 2, instructions: "Deep lateral lunge.", imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&q=40" },
    { id: "scorpion", name: "Scorpion Stretch", muscleGroup: "chest", secondaryMuscles: ["lower_back"], equipment: ["floor"], isCompound: true, modality: "mobility", difficulty: 1, duration_s: 45, instructions: "Prone, reach leg over to opposite side.", imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&q=40" },
];

const database = [...pureMobility];
let counter = 1;

for (const ex of baseExercises) {
    for (const mod of modifiers) {
        if (mod.eq.includes("dumbbell") && ex.eq.includes("pull_up_bar")) continue;
        if (mod.prefix === "Decline" && ex.mg !== "chest" && ex.mg !== "core") continue;
        if (mod.prefix === "Incline" && ex.mg !== "chest" && ex.mg !== "core" && ex.mg !== "back") continue;
        if (mod.prefix === "Plyo" && ["curl", "extension", "lateral_raise", "shrug", "plank"].includes(ex.id)) continue;

        let finalDiff = ex.diff + mod.diffMod;
        if (finalDiff < 1) finalDiff = 1;
        if (finalDiff > 3) finalDiff = 3;
        let finalDur = (ex.dur || 0) + mod.durMod;

        const obj = {
            id: `${mod.prefix.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${ex.id}_${counter}`,
            name: mod.prefix === "Standard" ? ex.name : `${mod.prefix} ${ex.name}`,
            muscleGroup: ex.mg,
            secondaryMuscles: ex.smg,
            equipment: Array.from(new Set([...ex.eq, ...mod.eq])),
            difficulty: finalDiff,
            isCompound: ex.c,
            modality: mod.forceM || ex.m,
            instructions: `Perform the ${ex.name} using the ${mod.prefix} variation. Focus on full range of motion.`,
            imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&q=40"
        };

        if (finalDur > 0) obj.duration_s = finalDur;

        database.push(obj);
        counter++;
        if (database.length >= 505) break;
    }
    if (database.length >= 505) break;
}

const tsPath = path.join(__dirname, 'src', 'lib', 'WorkoutEngine.ts');
let content = fs.readFileSync(tsPath, 'utf8');

// Use Regex to find the EXERCISE_DATABASE array, ignoring whitespace/newlines
// The block starts with "export const EXERCISE_DATABASE: Exercise[] = ["
// And ends with "];" immediately followed by "// ── Workout Generation Config"
const regex = /export const EXERCISE_DATABASE:\s*Exercise\[\]\s*=\s*\[[\s\S]*?\];/;

if (!regex.test(content)) {
    console.error("Regex match failed, cannot find EXERCISE_DATABASE block in WorkoutEngine.ts.");
    process.exit(1);
}

const newArrayString = "export const EXERCISE_DATABASE: Exercise[] = [\n" +
    database.map(ex => {
        let str = `  { id: "${ex.id}", name: "${ex.name}", muscleGroup: "${ex.muscleGroup}", secondaryMuscles: ${JSON.stringify(ex.secondaryMuscles)}, equipment: ${JSON.stringify(ex.equipment)}, difficulty: ${ex.difficulty}, isCompound: ${ex.isCompound}, modality: "${ex.modality}", instructions: "${ex.instructions}", imageUrl: "${ex.imageUrl}"`;
        if (ex.duration_s) str += `, duration_s: ${ex.duration_s}`;
        str += " },\n";
        return str;
    }).join("") +
    "];";

const finalContent = content.replace(regex, newArrayString);
fs.writeFileSync(tsPath, finalContent, 'utf8');
console.log(`Successfully injected ${database.length} exercises into WorkoutEngine.ts!`);
