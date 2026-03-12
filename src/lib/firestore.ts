import {
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    updateDoc,
    deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";

// Firebase is always configured — this flag kept for backward compat, always false
const isDemoMode = false;

// ─── TYPE DEFINITIONS ────────────────────────────────────────────────────────

export interface UserProfile {
    uid: string;
    name: string;
    email: string;
    photoURL?: string;
    age?: number;
    gender?: "male" | "female" | "other";
    goals: {
        calories: number;
        protein_g: number;
        carbs_g: number;
        fat_g: number;
    };
    createdAt: Timestamp;
}

export interface UserOnboarding {
    uid: string;
    completed: boolean;
    age?: number;
    gender?: "male" | "female" | "other";
    height_cm?: number;
    weight_kg?: number;
    primaryGoal?: "build_muscle" | "lose_fat" | "improve_endurance" | "general_health";
    targetMuscles?: string[];
    completedAt?: Timestamp;
}

export interface BodyMetric {
    id?: string;
    uid: string;
    weight_kg: number;
    height_cm: number;
    bmi: number;
    bmi_category: string;
    body_fat_pct?: number;
    timestamp: Timestamp;
}

export interface NutritionLog {
    id?: string;
    uid: string;
    timestamp: Timestamp;
    meal_name: string;
    photo_url?: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    micros?: {
        vitamin_d?: number;
        magnesium?: number;
        iron?: number;
        omega3?: number;
        vitamin_c?: number;
        calcium?: number;
        zinc?: number;
        potassium?: number;
    };
    ingredients?: string[];
}

export interface SupplementLog {
    id?: string;
    uid: string;
    timestamp: Timestamp;
    name: string;           // e.g. "Creatine", "Whey Protein"
    category: "protein" | "creatine" | "electrolyte" | "vitamin" | "preworkout" | "recovery" | "omega" | "other";
    amount_g?: number;      // grams
    amount_ml?: number;     // ml for liquids
    notes?: string;
}

export interface ToxinLog {
    id?: string;
    uid: string;
    timestamp: Timestamp;
    type: "smoking" | "alcohol" | "processed_food" | "sugar";
    quantity: number;
    unit: string;
}

export interface SleepLog {
    id?: string;
    uid: string;
    sleep_start: Timestamp;
    sleep_end: Timestamp;
    duration_hours: number;
    quality_score: number; // 1-10
    wake_time: string;
    sleep_time: string;
    phases?: {
        core_min?: number;
        rem_min?: number;
        deep_min?: number;
        awake_min?: number;
    };
}

export type ActivityType =
    | "run" | "walk" | "cycle" | "swim" | "trek" | "hike"
    | "climb" | "hiit" | "rowing" | "skiing" | "yoga" | "other";

export interface HRZones {
    z1_min: number; // <50% HRmax
    z2_min: number; // 50-60%
    z3_min: number; // 60-70%
    z4_min: number; // 70-80%
    z5_min: number; // >80%
}

export interface ActivityLog {
    id?: string;
    uid: string;
    timestamp: Timestamp;
    type: ActivityType;
    name: string;
    duration_min: number;
    distance_km?: number;
    avg_hr?: number;
    max_hr?: number;
    calories_burned?: number;
    elevation_m?: number;
    pace_per_km?: number; // seconds
    hr_zones?: HRZones;
    cardiac_demand_pct?: number; // 0-100
    aerobic_pct?: number;
    anaerobic_pct?: number;
    notes?: string;
}

export interface WorkoutExercise {
    name: string;
    muscleGroup?: string;
    sets: { reps: number; weight_kg: number }[];
    notes?: string;
}

export interface WorkoutLog {
    id?: string;
    uid: string;
    timestamp: Timestamp;
    name: string;
    duration_min: number;
    exercises: WorkoutExercise[];
    total_volume_kg: number;
    muscle_groups?: string[];
    notes?: string;
}

export interface ReadinessLog {
    id?: string;
    uid: string;
    timestamp: Timestamp;
    date: string; // YYYY-MM-DD
    hrv_ms?: number;
    resting_hr?: number;
    sleep_score?: number; // 0-100
    exertion_score?: number; // 0-100 (higher = more fatigued)
    readiness_pct: number; // computed 0-100
}

export interface AIInsight {
    id?: string;
    uid: string;
    timestamp: Timestamp;
    query_hash: string;
    query: string;
    response: string;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function userCol(uid: string, col: string) {
    return collection(db, "users", uid, col);
}

export function calcBMI(weight_kg: number, height_cm: number) {
    const h = height_cm / 100;
    const bmi = parseFloat((weight_kg / (h * h)).toFixed(1));
    let category = "Normal";
    if (bmi < 18.5) category = "Underweight";
    else if (bmi >= 25 && bmi < 30) category = "Overweight";
    else if (bmi >= 30) category = "Obese";
    return { bmi, category };
}

export function calcReadiness(hrv_ms?: number, resting_hr?: number, sleep_score?: number, exertion_score?: number): number {
    let score = 100;
    // HRV contribution (higher = better, normalized to 80ms baseline)
    if (hrv_ms !== undefined) {
        const hrvScore = Math.min(100, (hrv_ms / 80) * 100);
        score = score * 0.7 + hrvScore * 0.3;
    }
    // Resting HR contribution (lower = better, 50bpm = ideal)
    if (resting_hr !== undefined) {
        const hrScore = Math.max(0, 100 - (resting_hr - 50) * 2);
        score = score * 0.7 + hrScore * 0.3;
    }
    // Sleep score contribution
    if (sleep_score !== undefined) {
        score = score * 0.7 + sleep_score * 0.3;
    }
    // Exertion penalty
    if (exertion_score !== undefined) {
        score = score - (exertion_score * 0.2);
    }
    return Math.round(Math.max(0, Math.min(100, score)));
}

export function calcCardiacDemand(hr_zones?: HRZones, duration_min?: number): { cardiac_demand_pct: number; aerobic_pct: number; anaerobic_pct: number } {
    if (!hr_zones || !duration_min || duration_min === 0) {
        return { cardiac_demand_pct: 0, aerobic_pct: 70, anaerobic_pct: 30 };
    }
    const total = hr_zones.z1_min + hr_zones.z2_min + hr_zones.z3_min + hr_zones.z4_min + hr_zones.z5_min;
    if (total === 0) return { cardiac_demand_pct: 0, aerobic_pct: 70, anaerobic_pct: 30 };

    // Weighted demand: Z1=1, Z2=2, Z3=3, Z4=4, Z5=5 out of 5
    const demand = (hr_zones.z1_min * 1 + hr_zones.z2_min * 2 + hr_zones.z3_min * 3 + hr_zones.z4_min * 4 + hr_zones.z5_min * 5) / (total * 5);
    // Aerobic = Z1-Z3, Anaerobic = Z4-Z5
    const aerobic_pct = Math.round(((hr_zones.z1_min + hr_zones.z2_min + hr_zones.z3_min) / total) * 100);
    return {
        cardiac_demand_pct: Math.round(demand * 100),
        aerobic_pct,
        anaerobic_pct: 100 - aerobic_pct,
    };
}

// ─── USER PROFILE ─────────────────────────────────────────────────────────────

export async function upsertProfile(profile: Omit<UserProfile, "createdAt">) {
    if (isDemoMode) return;
    const ref = doc(db, "users", profile.uid, "profile", "main");
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        await setDoc(ref, { ...profile, createdAt: Timestamp.now() });
    } else {
        await updateDoc(ref, { name: profile.name, email: profile.email, photoURL: profile.photoURL });
    }
}

export async function getProfile(uid: string): Promise<UserProfile | null> {
    if (isDemoMode) return null;
    const snap = await getDoc(doc(db, "users", uid, "profile", "main"));
    return snap.exists() ? (snap.data() as UserProfile) : null;
}

// ─── ONBOARDING ───────────────────────────────────────────────────────────────

export async function upsertOnboarding(uid: string, data: Partial<UserOnboarding>) {
    if (isDemoMode) return;
    const ref = doc(db, "users", uid, "onboarding", "main");
    await setDoc(ref, { uid, ...data }, { merge: true });

    // Also populate body metrics if height and weight are provided
    if (data.height_cm && data.weight_kg) {
        await addBodyMetric(uid, data.weight_kg, data.height_cm);
    }
}

export async function getOnboarding(uid: string): Promise<UserOnboarding | null> {
    if (isDemoMode) return null;
    const snap = await getDoc(doc(db, "users", uid, "onboarding", "main"));
    return snap.exists() ? (snap.data() as UserOnboarding) : null;
}

// ─── BODY METRICS ─────────────────────────────────────────────────────────────

export async function addBodyMetric(uid: string, weight_kg: number, height_cm: number) {
    if (isDemoMode) return;
    const { bmi, category } = calcBMI(weight_kg, height_cm);
    return addDoc(userCol(uid, "body_metrics"), {
        uid, weight_kg, height_cm, bmi, bmi_category: category, timestamp: Timestamp.now(),
    });
}

export async function getBodyMetrics(uid: string, count = 30): Promise<BodyMetric[]> {
    if (isDemoMode) return [];
    const q = query(userCol(uid, "body_metrics"), orderBy("timestamp", "desc"), limit(count));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BodyMetric));
}

// ─── NUTRITION ─────────────────────────────────────────────────────────────────

export async function addNutritionLog(uid: string, log: Omit<NutritionLog, "id" | "uid" | "timestamp">) {
    if (isDemoMode) return;
    return addDoc(userCol(uid, "logs_nutrition"), { uid, ...log, timestamp: Timestamp.now() });
}

export async function getTodayNutrition(uid: string): Promise<NutritionLog[]> {
    if (isDemoMode) return [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const q = query(userCol(uid, "logs_nutrition"), where("timestamp", ">=", Timestamp.fromDate(today)), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as NutritionLog));
}

export async function getNutritionLogs(uid: string, days = 30): Promise<NutritionLog[]> {
    if (isDemoMode) return [];
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const q = query(userCol(uid, "logs_nutrition"), where("timestamp", ">=", Timestamp.fromDate(since)), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as NutritionLog));
}

// ─── TOXINS ────────────────────────────────────────────────────────────────────

export async function addToxinLog(uid: string, log: Omit<ToxinLog, "id" | "uid" | "timestamp">) {
    if (isDemoMode) return;
    return addDoc(userCol(uid, "logs_toxins"), { uid, ...log, timestamp: Timestamp.now() });
}

export async function getToxinLogs(uid: string, days = 30): Promise<ToxinLog[]> {
    if (isDemoMode) return [];
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const q = query(userCol(uid, "logs_toxins"), where("timestamp", ">=", Timestamp.fromDate(since)), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ToxinLog));
}

export async function getTodayToxins(uid: string) {
    if (isDemoMode) return { hasSmoking: false, hasAlcohol: false, smokingCount: 0, alcoholUnits: 0 };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const q = query(userCol(uid, "logs_toxins"), where("timestamp", ">=", Timestamp.fromDate(today)));
    const snap = await getDocs(q);
    const logs = snap.docs.map((d) => d.data() as ToxinLog);
    return {
        hasSmoking: logs.some((l) => l.type === "smoking"),
        hasAlcohol: logs.some((l) => l.type === "alcohol"),
        smokingCount: logs.filter((l) => l.type === "smoking").reduce((a, b) => a + b.quantity, 0),
        alcoholUnits: logs.filter((l) => l.type === "alcohol").reduce((a, b) => a + b.quantity, 0),
    };
}

// ─── SLEEP ─────────────────────────────────────────────────────────────────────

export async function addSleepLog(uid: string, log: Omit<SleepLog, "id" | "uid">) {
    if (isDemoMode) return;
    return addDoc(userCol(uid, "logs_sleep"), { uid, ...log });
}

export async function getWeekSleepLogs(uid: string): Promise<SleepLog[]> {
    if (isDemoMode) return [];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const q = query(userCol(uid, "logs_sleep"), where("sleep_start", ">=", Timestamp.fromDate(weekAgo)), orderBy("sleep_start", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SleepLog));
}

export async function getSleepLogs(uid: string, days = 30): Promise<SleepLog[]> {
    if (isDemoMode) return [];
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const q = query(userCol(uid, "logs_sleep"), where("sleep_start", ">=", Timestamp.fromDate(since)), orderBy("sleep_start", "desc"), limit(days));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SleepLog));
}

// ─── ACTIVITY ─────────────────────────────────────────────────────────────────

export async function addActivityLog(uid: string, log: Omit<ActivityLog, "id" | "uid" | "timestamp">) {
    if (isDemoMode) return;
    return addDoc(userCol(uid, "logs_activity"), { uid, ...log, timestamp: Timestamp.now() });
}

export async function getRecentActivities(uid: string, count = 20): Promise<ActivityLog[]> {
    if (isDemoMode) return [];
    const q = query(userCol(uid, "logs_activity"), orderBy("timestamp", "desc"), limit(count));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ActivityLog));
}

export async function getActivityLogs(uid: string, days = 30): Promise<ActivityLog[]> {
    if (isDemoMode) return [];
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const q = query(userCol(uid, "logs_activity"), where("timestamp", ">=", Timestamp.fromDate(since)), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ActivityLog));
}

// ─── WORKOUT ──────────────────────────────────────────────────────────────────

export async function addWorkoutLog(uid: string, log: Omit<WorkoutLog, "id" | "uid" | "timestamp">) {
    if (isDemoMode) return;
    return addDoc(userCol(uid, "logs_workout"), { uid, ...log, timestamp: Timestamp.now() });
}

export async function getRecentWorkouts(uid: string, count = 20): Promise<WorkoutLog[]> {
    if (isDemoMode) return [];
    const q = query(userCol(uid, "logs_workout"), orderBy("timestamp", "desc"), limit(count));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as WorkoutLog));
}

export async function getWorkoutLogs(uid: string, days = 30): Promise<WorkoutLog[]> {
    if (isDemoMode) return [];
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const q = query(userCol(uid, "logs_workout"), where("timestamp", ">=", Timestamp.fromDate(since)), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as WorkoutLog));
}

export async function deleteWorkoutLog(uid: string, id: string): Promise<void> {
    if (isDemoMode) return;
    await deleteDoc(doc(db, "users", uid, "logs_workout", id));
}

export async function deleteActivityLog(uid: string, id: string): Promise<void> {
    if (isDemoMode) return;
    await deleteDoc(doc(db, "users", uid, "logs_activity", id));
}

// ─── READINESS ────────────────────────────────────────────────────────────────

export async function addReadinessLog(uid: string, log: Omit<ReadinessLog, "id" | "uid" | "timestamp">) {
    if (isDemoMode) return;
    return addDoc(userCol(uid, "logs_readiness"), { uid, ...log, timestamp: Timestamp.now() });
}

export async function getTodayReadiness(uid: string): Promise<ReadinessLog | null> {
    if (isDemoMode) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const q = query(userCol(uid, "logs_readiness"), where("timestamp", ">=", Timestamp.fromDate(today)), orderBy("timestamp", "desc"), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as ReadinessLog;
}

export async function getReadinessLogs(uid: string, days = 30): Promise<ReadinessLog[]> {
    if (isDemoMode) return [];
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const q = query(userCol(uid, "logs_readiness"), where("timestamp", ">=", Timestamp.fromDate(since)), orderBy("timestamp", "desc"), limit(days));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ReadinessLog));
}

// ─── SUPPLEMENTS ──────────────────────────────────────────────────────────────

export async function addSupplementLog(uid: string, log: Omit<SupplementLog, "id" | "uid" | "timestamp">) {
    return addDoc(userCol(uid, "logs_supplements"), { uid, ...log, timestamp: Timestamp.now() });
}

export async function getTodaySupplements(uid: string): Promise<SupplementLog[]> {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const q = query(userCol(uid, "logs_supplements"), where("timestamp", ">=", Timestamp.fromDate(today)), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SupplementLog));
}

export async function getSupplementLogs(uid: string, days = 30): Promise<SupplementLog[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const q = query(userCol(uid, "logs_supplements"), where("timestamp", ">=", Timestamp.fromDate(since)), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SupplementLog));
}

// ─── AI INSIGHTS ──────────────────────────────────────────────────────────────

export async function cacheInsight(uid: string, query_hash: string, query: string, response: string) {
    return addDoc(userCol(uid, "ai_insights"), { uid, query_hash, query, response, timestamp: Timestamp.now() });
}

// ─── AI EXPORT ───────────────────────────────────────────────────────────────

export async function exportAllData(uid: string): Promise<Record<string, unknown>> {
    const [profile, onboarding, workouts, activities, nutrition, sleep, readiness] = await Promise.all([
        getProfile(uid),
        getOnboarding(uid),
        getWorkoutLogs(uid, 365),
        getActivityLogs(uid, 365),
        getNutritionLogs(uid, 90),
        getSleepLogs(uid, 90),
        getReadinessLogs(uid, 90),
    ]);
    return {
        exportDate: new Date().toISOString(),
        profile,
        onboarding,
        workouts: workouts.map(w => ({ ...w, timestamp: w.timestamp?.toDate?.()?.toISOString() })),
        activities: activities.map(a => ({ ...a, timestamp: a.timestamp?.toDate?.()?.toISOString() })),
        nutrition: nutrition.map(n => ({ ...n, timestamp: n.timestamp?.toDate?.()?.toISOString() })),
        sleep: sleep.map(s => ({ ...s, sleep_start: s.sleep_start?.toDate?.()?.toISOString(), sleep_end: s.sleep_end?.toDate?.()?.toISOString() })),
        readiness: readiness.map(r => ({ ...r, timestamp: r.timestamp?.toDate?.()?.toISOString() })),
    };
}

// ─── CUSTOM WORKOUTS ──────────────────────────────────────────────────────────

export interface CustomSetBlock {
    reps?: number;          // target reps
    time_s?: number;        // target time (isometric / timed)
    restSeconds: number;
}

export interface CustomExerciseBlock {
    exerciseId: string;
    name: string;
    muscleGroup: string;
    modality: string;
    sets: CustomSetBlock[];
    notes?: string;
}

export interface CustomWorkout {
    id?: string;
    uid: string;
    name: string;
    emoji?: string;
    color?: string;
    description?: string;
    exercises: CustomExerciseBlock[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
    isTrending?: boolean;   // for Discover tab saves
}

export async function saveCustomWorkout(
    uid: string,
    workout: Omit<CustomWorkout, "id" | "uid" | "createdAt" | "updatedAt">
): Promise<string> {
    const ref = await addDoc(userCol(uid, "custom_workouts"), {
        uid, ...workout,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });
    return ref.id;
}

export async function updateCustomWorkout(
    uid: string,
    id: string,
    patch: Partial<CustomWorkout>
): Promise<void> {
    const ref = doc(db, "users", uid, "custom_workouts", id);
    await updateDoc(ref, { ...patch, updatedAt: Timestamp.now() });
}

export async function getCustomWorkouts(uid: string): Promise<CustomWorkout[]> {
    const q = query(userCol(uid, "custom_workouts"), orderBy("updatedAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CustomWorkout));
}

export async function deleteCustomWorkout(uid: string, id: string): Promise<void> {
    await deleteDoc(doc(db, "users", uid, "custom_workouts", id));
}

// ─── ACCOUNT DELETION ────────────────────────────────────────────────────────
export async function deleteAllUserData(uid: string) {
    if (isDemoMode) return;
    const cols = ["workouts", "activities", "nutrition", "supplements", "toxins", "sleep", "readiness", "body_metrics", "ai_insights", "custom_workouts"];
    for (const col of cols) {
        const q = query(userCol(uid, col));
        const snap = await getDocs(q);
        for (const d of snap.docs) {
            await deleteDoc(d.ref);
        }
    }
    // Delete base docs
    try { await deleteDoc(doc(db, "users", uid, "profile", "main")); } catch (e) { }
    try { await deleteDoc(doc(db, "users", uid, "onboarding", "main")); } catch (e) { }
}
