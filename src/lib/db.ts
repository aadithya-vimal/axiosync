import Dexie, { Table } from "dexie";

export interface UserProfile {
    id?: number;
    name: string;
    age: number;
    weight_kg: number;
    height_cm: number;
    gender: "male" | "female";
    goals: {
        calories: number;
        protein_g: number;
        carbs_g: number;
        fat_g: number;
        vitamins: Record<string, number>;
    };
    createdAt: number;
}

export interface NutritionLog {
    id?: number;
    timestamp: number;
    meal_name: string;
    photo_blob?: string; // base64 data URL
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    micros: {
        vitamin_d?: number;
        magnesium?: number;
        iron?: number;
        omega3?: number;
        vitamin_c?: number;
        calcium?: number;
    };
    ingredients: string[];
    ai_analysis?: string;
}

export interface ToxinLog {
    id?: number;
    timestamp: number;
    type: "smoking" | "alcohol" | "processed_food" | "sugar";
    quantity: number;
    unit: string; // "cigarettes" | "units" | "g"
    notes?: string;
}

export interface SleepLog {
    id?: number;
    sleep_start: number; // unix timestamp
    sleep_end: number;
    quality_score: number; // 1-10
    circadian_anchor: {
        wake_time: string; // "HH:MM"
        sleep_time: string;
    };
    notes?: string;
}

export interface AIInsight {
    id?: number;
    timestamp: number;
    query_hash: string;
    query: string;
    response: string;
    context_snapshot: string; // JSON stringified context
}

class AxiosyncDB extends Dexie {
    user_profile!: Table<UserProfile>;
    logs_nutrition!: Table<NutritionLog>;
    logs_toxins!: Table<ToxinLog>;
    logs_sleep!: Table<SleepLog>;
    ai_insights!: Table<AIInsight>;

    constructor() {
        super("AxiosyncDB");
        this.version(1).stores({
            user_profile: "++id, gender, createdAt",
            logs_nutrition: "++id, timestamp",
            logs_toxins: "++id, timestamp, type",
            logs_sleep: "++id, sleep_start, sleep_end",
            ai_insights: "++id, timestamp, query_hash",
        });
    }
}

export const db = new AxiosyncDB();

// Seed default profile if none exists
export async function ensureDefaultProfile() {
    const count = await db.user_profile.count();
    if (count === 0) {
        await db.user_profile.add({
            name: "User",
            age: 28,
            weight_kg: 70,
            height_cm: 175,
            gender: "male",
            goals: {
                calories: 2200,
                protein_g: 150,
                carbs_g: 220,
                fat_g: 70,
                vitamins: {
                    vitamin_d: 20,
                    magnesium: 400,
                    iron: 18,
                    omega3: 1500,
                    vitamin_c: 90,
                    calcium: 1000,
                },
            },
            createdAt: Date.now(),
        });
    }
}

// Helper: get today's toxin summary
export async function getTodayToxins() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const logs = await db.logs_toxins
        .where("timestamp")
        .aboveOrEqual(start.getTime())
        .toArray();
    return {
        hasSmoking: logs.some((l) => l.type === "smoking"),
        hasAlcohol: logs.some((l) => l.type === "alcohol"),
        smokingCount: logs.filter((l) => l.type === "smoking").reduce((a, b) => a + b.quantity, 0),
        alcoholUnits: logs.filter((l) => l.type === "alcohol").reduce((a, b) => a + b.quantity, 0),
    };
}

// Helper: get today's nutrition totals
export async function getTodayNutrition() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const logs = await db.logs_nutrition
        .where("timestamp")
        .aboveOrEqual(start.getTime())
        .toArray();

    return logs.reduce(
        (acc, log) => ({
            calories: acc.calories + log.calories,
            protein_g: acc.protein_g + log.protein_g,
            carbs_g: acc.carbs_g + log.carbs_g,
            fat_g: acc.fat_g + log.fat_g,
            vitamin_d: acc.vitamin_d + (log.micros.vitamin_d || 0),
            magnesium: acc.magnesium + (log.micros.magnesium || 0),
            iron: acc.iron + (log.micros.iron || 0),
            omega3: acc.omega3 + (log.micros.omega3 || 0),
        }),
        { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, vitamin_d: 0, magnesium: 0, iron: 0, omega3: 0 }
    );
}

// Helper: get last 7 days sleep logs
export async function getWeekSleepLogs() {
    const start = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return db.logs_sleep.where("sleep_start").aboveOrEqual(start).toArray();
}
