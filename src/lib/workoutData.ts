// ── Workout Data Library ──────────────────────────────────────────────────────
// Structured workout plans for the Active Workout Engine

export type MuscleGroup =
    | "chest" | "back" | "shoulders" | "biceps" | "triceps"
    | "quads" | "hamstrings" | "glutes" | "calves" | "core"
    | "full_body" | "cardio";

export interface Exercise {
    id: string;
    name: string;
    sets: number;
    reps: number | string; // "12-15" or 12
    restSeconds: number;
    durationSeconds?: number; // for timed exercises
    muscleGroup: MuscleGroup;
    equipment: string;
    instructions: string;
    imageUrl: string; // high-quality Unsplash fitness image
    weightKg?: number; // default starting weight
}

export interface WorkoutPlan {
    id: string;
    name: string;
    category: "strength" | "hiit" | "core" | "cardio";
    difficulty: 1 | 2 | 3; // 1=beginner, 2=intermediate, 3=advanced
    estimatedMinutes: number;
    targetMuscles: MuscleGroup[];
    color: string; // Apple system color for theming
    emoji: string;
    description: string;
    exercises: Exercise[];
}

// ── Workout Plans ─────────────────────────────────────────────────────────────

export const WORKOUT_PLANS: WorkoutPlan[] = [
    {
        id: "push-day",
        name: "Push Day",
        category: "strength",
        difficulty: 2,
        estimatedMinutes: 45,
        targetMuscles: ["chest", "shoulders", "triceps"],
        color: "#0A84FF",
        emoji: "💪",
        description: "Chest, shoulders & triceps — classic push pattern for upper body strength and size.",
        exercises: [
            {
                id: "bench-press",
                name: "Barbell Bench Press",
                sets: 4,
                reps: "6-8",
                restSeconds: 90,
                muscleGroup: "chest",
                equipment: "Barbell",
                instructions: "Lie flat, grip slightly wider than shoulders. Lower bar to mid-chest, drive up explosively.",
                imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",

                weightKg: 60,
            },
            {
                id: "incline-dumbbell",
                name: "Incline Dumbbell Press",
                sets: 3,
                reps: "10-12",
                restSeconds: 75,
                muscleGroup: "chest",
                equipment: "Dumbbells",
                instructions: "Set bench to 30-45°. Press dumbbells up and slightly together at the top.",
                imageUrl: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80",

                weightKg: 22,
            },
            {
                id: "overhead-press",
                name: "Seated Dumbbell OHP",
                sets: 3,
                reps: "10-12",
                restSeconds: 75,
                muscleGroup: "shoulders",
                equipment: "Dumbbells",
                instructions: "Sit upright, press dumbbells overhead until arms are fully extended.",
                imageUrl: "https://images.unsplash.com/photo-1581009137042-c552e485697a?w=800&q=80",

                weightKg: 18,
            },
            {
                id: "lateral-raise",
                name: "Lateral Raises",
                sets: 3,
                reps: "15-20",
                restSeconds: 60,
                muscleGroup: "shoulders",
                equipment: "Dumbbells",
                instructions: "Stand with dumbbells at sides. Raise arms to shoulder height with soft elbow bend.",
                imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",

                weightKg: 8,
            },
            {
                id: "cable-tricep",
                name: "Cable Tricep Pushdown",
                sets: 3,
                reps: "12-15",
                restSeconds: 60,
                muscleGroup: "triceps",
                equipment: "Cable Machine",
                instructions: "Keep elbows pinned to sides, extend forearms fully. Squeeze at the bottom.",
                imageUrl: "https://images.unsplash.com/photo-1526506119532-b6b8a70bac07?w=800&q=80",

                weightKg: 25,
            },
            {
                id: "chest-dips",
                name: "Chest Dips",
                sets: 3,
                reps: "10-15",
                restSeconds: 60,
                muscleGroup: "chest",
                equipment: "Parallel Bars",
                instructions: "Lean forward slightly to target chest. Lower until upper arms are parallel to floor.",
                imageUrl: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&q=80",

                weightKg: 0,
            },
        ],
    },

    {
        id: "pull-day",
        name: "Pull Day",
        category: "strength",
        difficulty: 2,
        estimatedMinutes: 40,
        targetMuscles: ["back", "biceps"],
        color: "#30D158",
        emoji: "🏋️",
        description: "Back & biceps — build a wide, powerful back with strong arms.",
        exercises: [
            {
                id: "deadlift",
                name: "Romanian Deadlift",
                sets: 4,
                reps: "8-10",
                restSeconds: 120,
                muscleGroup: "back",
                equipment: "Barbell",
                instructions: "Hinge at hips, keep bar close to legs, feel hamstring stretch at bottom.",
                imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",

                weightKg: 80,
            },
            {
                id: "pullups",
                name: "Wide-Grip Pull-Ups",
                sets: 4,
                reps: "6-10",
                restSeconds: 90,
                muscleGroup: "back",
                equipment: "Pull-up Bar",
                instructions: "Grip wider than shoulders, drive elbows down to engage lats. Full ROM.",
                imageUrl: "https://images.unsplash.com/photo-1598971639058-a48cda5f7d5e?w=800&q=80",

                weightKg: 0,
            },
            {
                id: "cable-row",
                name: "Seated Cable Row",
                sets: 3,
                reps: "12-15",
                restSeconds: 75,
                muscleGroup: "back",
                equipment: "Cable Machine",
                instructions: "Sit tall, pull handle to lower abdomen. Squeeze shoulder blades together.",
                imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80",

                weightKg: 40,
            },
            {
                id: "face-pull",
                name: "Face Pulls",
                sets: 3,
                reps: "15-20",
                restSeconds: 60,
                muscleGroup: "shoulders",
                equipment: "Cable Machine",
                instructions: "Pull rope to face level, elbows high and wide. Great for shoulder health.",
                imageUrl: "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800&q=80",

                weightKg: 15,
            },
            {
                id: "barbell-curl",
                name: "Barbell Bicep Curl",
                sets: 3,
                reps: "10-12",
                restSeconds: 60,
                muscleGroup: "biceps",
                equipment: "Barbell",
                instructions: "Keep elbows at sides, curl bar to chest. Squeeze at top, lower slowly.",
                imageUrl: "https://images.unsplash.com/photo-1526506190301-322209df8e0b?w=800&q=80",

                weightKg: 30,
            },
        ],
    },

    {
        id: "leg-day",
        name: "Leg Day",
        category: "strength",
        difficulty: 3,
        estimatedMinutes: 50,
        targetMuscles: ["quads", "hamstrings", "glutes", "calves"],
        color: "#FF9F0A",
        emoji: "🦵",
        description: "Full lower body — quads, hamstrings, glutes and calves for power and aesthetics.",
        exercises: [
            {
                id: "squat",
                name: "Barbell Back Squat",
                sets: 4,
                reps: "6-8",
                restSeconds: 120,
                muscleGroup: "quads",
                equipment: "Barbell",
                instructions: "Bar on upper traps, squat until thighs parallel. Drive through heels to stand.",
                imageUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80",

                weightKg: 80,
            },
            {
                id: "leg-press",
                name: "Leg Press",
                sets: 3,
                reps: "12-15",
                restSeconds: 90,
                muscleGroup: "quads",
                equipment: "Leg Press Machine",
                instructions: "Feet shoulder-width, lower platform until 90° knee angle. Drive up without locking.",
                imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",

                weightKg: 120,
            },
            {
                id: "romanian-dl",
                name: "Romanian Deadlift",
                sets: 3,
                reps: "10-12",
                restSeconds: 90,
                muscleGroup: "hamstrings",
                equipment: "Dumbbells",
                instructions: "Hinge forward, keep back straight. Feel hamstrings stretch, drive hips forward.",
                imageUrl: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80",

                weightKg: 30,
            },
            {
                id: "walking-lunges",
                name: "Walking Lunges",
                sets: 3,
                reps: "20 steps",
                restSeconds: 75,
                muscleGroup: "glutes",
                equipment: "Dumbbells",
                instructions: "Step forward, lower back knee toward floor. Alternate legs for full set.",
                imageUrl: "https://images.unsplash.com/photo-1518655048521-f130df041f66?w=800&q=80",

                weightKg: 12,
            },
            {
                id: "calf-raise",
                name: "Standing Calf Raises",
                sets: 4,
                reps: "20-25",
                restSeconds: 45,
                muscleGroup: "calves",
                equipment: "Machine",
                instructions: "Full stretch at bottom, full contraction at top. Hold for 1 second at peak.",
                imageUrl: "https://images.unsplash.com/photo-1526506190301-322209df8e0b?w=800&q=80",

                weightKg: 50,
            },
        ],
    },

    {
        id: "core-hiit",
        name: "Core & HIIT",
        category: "hiit",
        difficulty: 2,
        estimatedMinutes: 25,
        targetMuscles: ["core", "full_body", "cardio"],
        color: "#FF453A",
        emoji: "🔥",
        description: "High-intensity core circuit — burn fat and build a bulletproof midsection.",
        exercises: [
            {
                id: "plank",
                name: "Plank Hold",
                sets: 3,
                reps: "45s",
                restSeconds: 30,
                durationSeconds: 45,
                muscleGroup: "core",
                equipment: "Bodyweight",
                instructions: "Forearms on floor, body forms straight line. Brace abs and glutes hard.",
                imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",

                weightKg: 0,
            },
            {
                id: "burpees",
                name: "Burpees",
                sets: 4,
                reps: "12",
                restSeconds: 45,
                muscleGroup: "full_body",
                equipment: "Bodyweight",
                instructions: "Drop to push-up, chest to floor, jump up, clap overhead. Full power.",
                imageUrl: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&q=80",

                weightKg: 0,
            },
            {
                id: "bicycle-crunch",
                name: "Bicycle Crunches",
                sets: 3,
                reps: "20 each side",
                restSeconds: 30,
                muscleGroup: "core",
                equipment: "Bodyweight",
                instructions: "Elbow to opposite knee. Rotate fully, keep lower back pressed to floor.",
                imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",

                weightKg: 0,
            },
            {
                id: "mountain-climbers",
                name: "Mountain Climbers",
                sets: 3,
                reps: "40s",
                restSeconds: 30,
                durationSeconds: 40,
                muscleGroup: "cardio",
                equipment: "Bodyweight",
                instructions: "High plank position, drive knees to chest as fast as possible. Keep hips level.",
                imageUrl: "https://images.unsplash.com/photo-1594381898411-846e7d193883?w=800&q=80",

                weightKg: 0,
            },
            {
                id: "russian-twist",
                name: "Russian Twists",
                sets: 3,
                reps: "30s",
                restSeconds: 30,
                durationSeconds: 30,
                muscleGroup: "core",
                equipment: "Bodyweight / Plate",
                instructions: "Sit at 45°, lean back slightly. Rotate torso side to side with control.",
                imageUrl: "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800&q=80",

                weightKg: 0,
            },
        ],
    },
    {
        id: "full-body-dumbbells",
        name: "Full Body Dumbbells",
        category: "strength",
        difficulty: 2,
        estimatedMinutes: 45,
        targetMuscles: ["full_body", "chest", "back", "quads", "shoulders"],
        color: "#AF52DE",
        emoji: "🏋️‍♂️",
        description: "A complete full-body metabolic conditioning workout using only dumbbells.",
        exercises: [
            {
                id: "db-goblet-squat",
                name: "Goblet Squat",
                sets: 4,
                reps: 12,
                restSeconds: 90,
                muscleGroup: "quads",
                equipment: "Dumbbell",
                instructions: "Hold a single dumbbell vertically. Squat deep, keeping chest up.",
                imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80",

                weightKg: 20,
            },
            {
                id: "db-floor-press",
                name: "Dumbbell Floor Press",
                sets: 3,
                reps: 12,
                restSeconds: 60,
                muscleGroup: "chest",
                equipment: "Dumbbells",
                instructions: "Lie on floor, press dumbbells up until arms lock. Good for shoulder health.",
                imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",

                weightKg: 20,
            },
            {
                id: "db-row",
                name: "Single-Arm DB Row",
                sets: 3,
                reps: "10 per arm",
                restSeconds: 60,
                muscleGroup: "back",
                equipment: "Dumbbell",
                instructions: "Support one arm on a bench, row dumbbell to hip with the other arm.",
                imageUrl: "https://images.unsplash.com/photo-1526506190301-322209df8e0b?w=800&q=80",

                weightKg: 24,
            },
            {
                id: "db-rdl",
                name: "Dumbbell RDL",
                sets: 3,
                reps: 12,
                restSeconds: 60,
                muscleGroup: "hamstrings",
                equipment: "Dumbbells",
                instructions: "Hinge at hips holding dumbbells. Keep back straight and feel the hamstring stretch.",
                imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",

                weightKg: 24,
            },
            {
                id: "db-thruster",
                name: "Dumbbell Thrusters",
                sets: 3,
                reps: 10,
                restSeconds: 90,
                muscleGroup: "full_body",
                equipment: "Dumbbells",
                instructions: "Squat down with DBs at shoulders, then press them overhead as you stand.",
                imageUrl: "https://images.unsplash.com/photo-1598971639058-a48cda5f7d5e?w=800&q=80",

                weightKg: 12,
            }
        ],
    },
    {
        id: "upper-power",
        name: "Upper Body Power",
        category: "strength",
        difficulty: 3,
        estimatedMinutes: 55,
        targetMuscles: ["chest", "back", "shoulders", "biceps", "triceps"],
        color: "#5856D6",
        emoji: "⚡",
        description: "Heavy upper body compounds focused on explosive strength and low rep ranges.",
        exercises: [
            {
                id: "heavy-bench",
                name: "Heavy Bench Press",
                sets: 5,
                reps: 5,
                restSeconds: 180,
                muscleGroup: "chest",
                equipment: "Barbell",
                instructions: "Maximal effort pushing. Lower bar with control, explode up.",
                imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",

                weightKg: 85,
            },
            {
                id: "weighted-pullups",
                name: "Weighted Pull-Ups",
                sets: 5,
                reps: 5,
                restSeconds: 180,
                muscleGroup: "back",
                equipment: "Pull-up Bar",
                instructions: "Use a weight belt. Pull explosively until chin clears the bar.",
                imageUrl: "https://images.unsplash.com/photo-1598971639058-a48cda5f7d5e?w=800&q=80",

                weightKg: 20,
            },
            {
                id: "push-press",
                name: "Barbell Push Press",
                sets: 4,
                reps: 6,
                restSeconds: 120,
                muscleGroup: "shoulders",
                equipment: "Barbell",
                instructions: "Dip at the knees slightly, then use leg drive to help press weight overhead.",
                imageUrl: "https://images.unsplash.com/photo-1581009137042-c552e485697a?w=800&q=80",

                weightKg: 50,
            },
            {
                id: "pendlay-row",
                name: "Pendlay Rows",
                sets: 4,
                reps: 8,
                restSeconds: 120,
                muscleGroup: "back",
                equipment: "Barbell",
                instructions: "Row from a dead stop on the floor each rep. Explosive concentric.",
                imageUrl: "https://images.unsplash.com/photo-1526506190301-322209df8e0b?w=800&q=80",

                weightKg: 70,
            }
        ]
    },
    {
        id: "calisthenics-mastery",
        name: "Calisthenics Mastery",
        category: "strength",
        difficulty: 3,
        estimatedMinutes: 40,
        targetMuscles: ["core", "shoulders", "back", "full_body"],
        color: "#5E5CE6",
        emoji: "🤸",
        description: "Advanced bodyweight control focusing on relative strength and skill.",
        exercises: [
            {
                id: "muscle-up-prog",
                name: "Explosive Pull-Ups",
                sets: 4,
                reps: 6,
                restSeconds: 120,
                muscleGroup: "back",
                equipment: "Pull-up Bar",
                instructions: "Pull as high and fast as possible to build muscle-up power.",
                imageUrl: "https://images.unsplash.com/photo-1598971639058-a48cda5f7d5e?w=800&q=80",

                weightKg: 0,
            },
            {
                id: "archer-pushup",
                name: "Archer Push-Ups",
                sets: 3,
                reps: "8 per side",
                restSeconds: 90,
                muscleGroup: "chest",
                equipment: "Bodyweight",
                instructions: "Shift weight primarily to one arm while extending the other straight.",
                imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80",

                weightKg: 0,
            },
            {
                id: "lsit",
                name: "L-Sit Hold",
                sets: 4,
                reps: "15-20s",
                restSeconds: 60,
                durationSeconds: 20,
                muscleGroup: "core",
                equipment: "Floor",
                instructions: "Support body on hands, legs straight out in an L-shape.",
                imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",

                weightKg: 0,
            },
            {
                id: "pistol-squats",
                name: "Pistol Squats",
                sets: 3,
                reps: "5 per leg",
                restSeconds: 90,
                muscleGroup: "quads",
                equipment: "Bodyweight",
                instructions: "Single leg deep squat. Keep heel planted and other leg straight forward.",
                imageUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80",

                weightKg: 0,
            }
        ]
    },
    {
        id: "arms-shoulders-bro",
        name: "Shoulders & Arms",
        category: "strength",
        difficulty: 2,
        estimatedMinutes: 40,
        targetMuscles: ["shoulders", "biceps", "triceps"],
        color: "#E2820B",
        emoji: "🦍",
        description: "A classic isolation workout to build 3D shoulders and massive arms.",
        exercises: [
            {
                id: "arnold-press",
                name: "Arnold Press",
                sets: 4,
                reps: 10,
                restSeconds: 90,
                muscleGroup: "shoulders",
                equipment: "Dumbbells",
                instructions: "Start with palms facing you, rotate them outward as you press up.",
                imageUrl: "https://images.unsplash.com/photo-1581009137042-c552e485697a?w=800&q=80",

                weightKg: 16,
            },
            {
                id: "skull_crushers",
                name: "EZ Bar Skullcrushers",
                sets: 3,
                reps: 12,
                restSeconds: 60,
                muscleGroup: "triceps",
                equipment: "Barbell",
                instructions: "Lie flat, lower bar to forehead, extend using only triceps.",
                imageUrl: "https://images.unsplash.com/photo-1526506119532-b6b8a70bac07?w=800&q=80",

                weightKg: 25,
            },
            {
                id: "incline-curl",
                name: "Incline DB Curls",
                sets: 3,
                reps: 12,
                restSeconds: 60,
                muscleGroup: "biceps",
                equipment: "Dumbbells",
                instructions: "Bench at 45 degree angle. Get a deep stretch at bottom of curl.",
                imageUrl: "https://images.unsplash.com/photo-1526506190301-322209df8e0b?w=800&q=80",

                weightKg: 12,
            },
            {
                id: "lateral-raise-cable",
                name: "Cable Lateral Raises",
                sets: 4,
                reps: 15,
                restSeconds: 45,
                muscleGroup: "shoulders",
                equipment: "Cable Machine",
                instructions: "Constant tension throughout movement. Keep elbows slightly bent.",
                imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",

                weightKg: 5,
            },
            {
                id: "hammer-curls",
                name: "Hammer Curls",
                sets: 3,
                reps: 15,
                restSeconds: 60,
                muscleGroup: "biceps",
                equipment: "Dumbbells",
                instructions: "Neutral grip to target the brachialis and forearms.",
                imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80",

                weightKg: 14,
            }
        ]
    },
    {
        id: "lower-power",
        name: "Lower Body Power",
        category: "strength",
        difficulty: 3,
        estimatedMinutes: 50,
        targetMuscles: ["quads", "glutes", "hamstrings", "calves"],
        color: "#FF3B30",
        emoji: "🏋️‍♂️",
        description: "Heavy compound leg workout focused on maximal force production.",
        exercises: [
            {
                id: "heavy-squat",
                name: "Heavy Back Squat",
                sets: 5,
                reps: 5,
                restSeconds: 180,
                muscleGroup: "quads",
                equipment: "Barbell",
                instructions: "Maximal effort. Full depth, explosive concentric phase.",
                imageUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80",

                weightKg: 100,
            },
            {
                id: "heavy-deadlift",
                name: "Conventional Deadlift",
                sets: 4,
                reps: 5,
                restSeconds: 180,
                muscleGroup: "back",
                equipment: "Barbell",
                instructions: "Pull from dead stop. Keep spine neutral, drive through floor.",
                imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",

                weightKg: 120,
            },
            {
                id: "bulgarian-heavy",
                name: "Heavy Bulgarian Split Squats",
                sets: 3,
                reps: "8 per leg",
                restSeconds: 120,
                muscleGroup: "quads",
                equipment: "Dumbbells",
                instructions: "Rear foot elevated. Emphasize depth and stretch.",
                imageUrl: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80",

                weightKg: 24,
            },
            {
                id: "seated-calf",
                name: "Seated Calf Raise",
                sets: 4,
                reps: 15,
                restSeconds: 60,
                muscleGroup: "calves",
                equipment: "Machine",
                instructions: "Focus on the deep stretch at the bottom of the movement.",
                imageUrl: "https://images.unsplash.com/photo-1526506190301-322209df8e0b?w=800&q=80",

                weightKg: 60,
            }
        ]
    },
    {
        id: "mobility-flow",
        name: "Morning Mobility Flow",
        category: "core",
        difficulty: 1,
        estimatedMinutes: 15,
        targetMuscles: ["full_body", "core", "back", "shoulders"],
        color: "#34C759",
        emoji: "🧘",
        description: "15 minutes of dynamic stretching to wake up the spine and joints.",
        exercises: [
            {
                id: "cat_cow",
                name: "Cat-Cow",
                sets: 2,
                reps: "60s",
                restSeconds: 15,
                durationSeconds: 60,
                muscleGroup: "back",
                equipment: "Floor",
                instructions: "On all fours, transition slowly between arching and rounding back.",
                imageUrl: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&q=80",

                weightKg: 0,
            },
            {
                id: "worlds_greatest",
                name: "World's Greatest Stretch",
                sets: 2,
                reps: "5 per side",
                restSeconds: 30,
                muscleGroup: "full_body",
                equipment: "Bodyweight",
                instructions: "Deep lunge, rotate arm toward the sky. Hold each rep 3s.",
                imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80",

                weightKg: 0,
            },
            {
                id: "deep_squat_hold",
                name: "Asian Squat Hold",
                sets: 2,
                reps: "60s",
                restSeconds: 30,
                durationSeconds: 60,
                muscleGroup: "full_body",
                equipment: "Bodyweight",
                instructions: "Sit as low as possible while keeping heels on floor. Pry knees wide.",
                imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80",

                weightKg: 0,
            },
            {
                id: "band_dislocates",
                name: "Shoulder Dislocates",
                sets: 2,
                reps: 15,
                restSeconds: 30,
                muscleGroup: "shoulders",
                equipment: "Resistance Band",
                instructions: "Hold band wide, bring over head and behind back with straight arms.",
                imageUrl: "https://images.unsplash.com/photo-1598971639058-a48cda5f7d5e?w=800&q=80",

                weightKg: 0,
            }
        ]
    },
    {
        id: "runners-legs",
        name: "Endurance Runner's Legs",
        category: "strength",
        difficulty: 2,
        estimatedMinutes: 35,
        targetMuscles: ["quads", "glutes", "hamstrings", "calves"],
        color: "#5AC8FA",
        emoji: "🏃‍♂️",
        description: "Strength training targeted specifically to prevent injuries and improve speed for runners.",
        exercises: [
            {
                id: "step_ups",
                name: "Weighted Step-Ups",
                sets: 3,
                reps: "12 per leg",
                restSeconds: 60,
                muscleGroup: "glutes",
                equipment: "Box / DBs",
                instructions: "Drive through the heel of the elevated foot. Control the descent.",
                imageUrl: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80",

                weightKg: 10,
            },
            {
                id: "single_leg_rdl",
                name: "Single-Leg RDL",
                sets: 3,
                reps: "10 per leg",
                restSeconds: 60,
                muscleGroup: "hamstrings",
                equipment: "Dumbbell",
                instructions: "Hinge on one leg to build stability and hamstring strength.",
                imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",

                weightKg: 14,
            },
            {
                id: "calf_raises_high_rep",
                name: "High-Rep Calf Raises",
                sets: 3,
                reps: 30,
                restSeconds: 45,
                muscleGroup: "calves",
                equipment: "Bodyweight",
                instructions: "Pump blood into the calves to build endurance for long distances.",
                imageUrl: "https://images.unsplash.com/photo-1526506190301-322209df8e0b?w=800&q=80",

                weightKg: 0,
            },
            {
                id: "copenhagen_plank",
                name: "Copenhagen Plank",
                sets: 3,
                reps: "30s per side",
                restSeconds: 45,
                durationSeconds: 30,
                muscleGroup: "core",
                equipment: "Bench",
                instructions: "Top leg resting on a bench, lift body to train adductors and obliques.",
                imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",

                weightKg: 0,
            }
        ]
    }
];
