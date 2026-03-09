// ── GoogleFitMapper.ts ────────────────────────────────────────────────────────
// OAuth flow placeholders and data-mapping utilities for Google Fit / Health Connect
// These translate Google Fit REST API responses into the Axiosync Firestore schema

// ── OAuth Constants ───────────────────────────────────────────────────────────

const GOOGLE_FIT_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_FIT_CLIENT_ID || "YOUR_CLIENT_ID_HERE";
const REDIRECT_URI = typeof window !== "undefined"
    ? `${window.location.origin}/api/auth/google-fit/callback`
    : "http://localhost:3000/api/auth/google-fit/callback";

export const GOOGLE_FIT_SCOPES = [
    "https://www.googleapis.com/auth/fitness.activity.read",
    "https://www.googleapis.com/auth/fitness.heart_rate.read",
    "https://www.googleapis.com/auth/fitness.sleep.read",
    "https://www.googleapis.com/auth/fitness.body.read",
    "https://www.googleapis.com/auth/fitness.nutrition.read",
] as const;

// ── OAuth URL Builder ─────────────────────────────────────────────────────────

export function buildGoogleFitOAuthUrl(state?: string): string {
    const params = new URLSearchParams({
        client_id: GOOGLE_FIT_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: "code",
        scope: GOOGLE_FIT_SCOPES.join(" "),
        access_type: "offline",
        prompt: "consent",
        ...(state ? { state } : {}),
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// ── Google Fit API Types ──────────────────────────────────────────────────────

export interface GFitDataSource {
    dataSourceId: string;
    type: "raw" | "derived";
    application: { name: string };
    dataType: { name: string };
}

export interface GFitValue {
    intVal?: number;
    fpVal?: number;
    stringVal?: string;
    mapVal?: { key: string; value: GFitValue }[];
}

export interface GFitDataPoint {
    startTimeNanos: string;
    endTimeNanos: string;
    dataTypeName: string;
    value: GFitValue[];
}

export interface GFitSession {
    id: string;
    name: string;
    startTimeMillis: string;
    endTimeMillis: string;
    activityType: number;
    application: { name: string };
}

export interface GFitAggregateResponse {
    bucket: {
        startTimeMillis: string;
        endTimeMillis: string;
        dataset: {
            dataSourceId: string;
            point: GFitDataPoint[];
        }[];
    }[];
}

// ── Activity Type Mapping ─────────────────────────────────────────────────────

// Google Fit activity type numbers → Axiosync activity names
export const GFIT_ACTIVITY_MAP: Record<number, string> = {
    1: "bike",        // Biking
    7: "walk",        // Walking
    8: "run",         // Running
    9: "run",         // Jogging
    74: "swim",       // Swimming
    82: "yoga",       // Yoga
    119: "hiit",      // High intensity interval training
    110: "hike",      // Hiking
    17: "ski",        // Skiing
    115: "row",       // Rowing
};

// ── Axiosync Target Types (mirroring firestore.ts) ────────────────────────────

export interface AxioActivityLog {
    type: string;
    name: string;
    duration_min: number;
    distance_km?: number;
    avg_hr?: number;
    calories_burned?: number;
    source: "google_fit";
    source_session_id: string;
}

export interface AxioSleepLog {
    duration_hours: number;
    quality_score?: number;
    source: "google_fit";
}

export interface AxioReadinessPartial {
    resting_hr?: number;
    source: "google_fit";
}

// ── Mapper: Sessions → Activity Logs ─────────────────────────────────────────

export function mapGoogleFitSessions(sessions: GFitSession[]): AxioActivityLog[] {
    return sessions
        .filter(s => GFIT_ACTIVITY_MAP[parseInt(s.activityType as unknown as string)])
        .map(s => {
            const durationMs = parseInt(s.endTimeMillis) - parseInt(s.startTimeMillis);
            const durationMin = durationMs / 60000;
            return {
                type: GFIT_ACTIVITY_MAP[s.activityType] || "other",
                name: s.name || GFIT_ACTIVITY_MAP[s.activityType] || "Session",
                duration_min: Math.round(durationMin),
                source: "google_fit",
                source_session_id: s.id,
            };
        });
}

// ── Mapper: DataPoint (Heart Rate) → Readiness partial ───────────────────────

export function mapGoogleFitHeartRate(
    dataPoints: GFitDataPoint[]
): AxioReadinessPartial | null {
    if (dataPoints.length === 0) return null;
    // Take the lowest HR value as resting HR approximation
    const values = dataPoints
        .map(dp => dp.value[0]?.fpVal || dp.value[0]?.intVal || 0)
        .filter(v => v > 0);
    if (values.length === 0) return null;
    const restingHR = Math.round(Math.min(...values));
    return { resting_hr: restingHR, source: "google_fit" };
}

// ── Mapper: Sleep stages → Sleep log ────────────────────────────────────────

export function mapGoogleFitSleep(
    dataPoints: GFitDataPoint[]
): AxioSleepLog | null {
    const SLEEP_STAGES = { 1: "awake", 2: "sleep", 3: "out_of_bed", 4: "light_sleep", 5: "deep_sleep", 6: "rem" };
    let totalSleepMs = 0;
    dataPoints.forEach(dp => {
        const stage = dp.value[0]?.intVal;
        if (stage && [2, 4, 5, 6].includes(stage)) {
            const dur = parseInt(dp.endTimeNanos) / 1e6 - parseInt(dp.startTimeNanos) / 1e6;
            totalSleepMs += dur;
        }
    });
    if (totalSleepMs === 0) return null;
    return {
        duration_hours: parseFloat((totalSleepMs / 3600000).toFixed(2)),
        source: "google_fit",
    };
}

// ── Mapper: Aggregate Calories ─────────────────────────────────────────────────

export function mapGoogleFitCalories(
    bucket: GFitAggregateResponse["bucket"][0]
): number {
    const calDataset = bucket.dataset.find(d =>
        d.dataSourceId.includes("calories.expended")
    );
    if (!calDataset) return 0;
    return calDataset.point.reduce((a, p) => a + (p.value[0]?.fpVal || 0), 0);
}

// ── Mapper: Steps ──────────────────────────────────────────────────────────────

export function mapGoogleFitSteps(
    bucket: GFitAggregateResponse["bucket"][0]
): number {
    const stepsDataset = bucket.dataset.find(d =>
        d.dataSourceId.includes("step_count.delta")
    );
    if (!stepsDataset) return 0;
    return stepsDataset.point.reduce((a, p) => a + (p.value[0]?.intVal || 0), 0);
}

// ── Token Exchange Placeholder (server-side) ───────────────────────────────────

/**
 * IMPORTANT: Token exchange must happen server-side to avoid exposing client_secret.
 * This is a type-safe placeholder for the server action / API route.
 * Implement as a Next.js API route: /api/auth/google-fit/callback
 */
export interface TokenExchangeRequest {
    code: string;
    redirectUri: string;
}

export interface TokenExchangeResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: "Bearer";
}

export async function exchangeGoogleFitCode(
    _req: TokenExchangeRequest
): Promise<TokenExchangeResponse> {
    // TODO: Implement as server-side API route
    // POST https://oauth2.googleapis.com/token with:
    //   client_id, client_secret, code, redirect_uri, grant_type: "authorization_code"
    throw new Error(
        "exchangeGoogleFitCode must be called from a server-side API route. " +
        "Create /api/auth/google-fit/callback to handle the OAuth callback."
    );
}

// ── Data Fetch Helper ─────────────────────────────────────────────────────────

/**
 * Fetch Google Fit aggregate data for a date range.
 * Call from a server action or API route with a valid access token.
 */
export async function fetchGoogleFitAggregate(
    accessToken: string,
    startTimeMs: number,
    endTimeMs: number,
    dataTypes: string[]
): Promise<GFitAggregateResponse> {
    const body = {
        aggregateBy: dataTypes.map(dataTypeName => ({ dataTypeName })),
        bucketByTime: { durationMillis: 86400000 }, // daily buckets
        startTimeMillis: startTimeMs.toString(),
        endTimeMillis: endTimeMs.toString(),
    };

    const res = await fetch(
        "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        }
    );

    if (!res.ok) {
        throw new Error(`Google Fit API error: ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<GFitAggregateResponse>;
}

// ── Helper: Build date range timestamps ──────────────────────────────────────

export function getDateRangeMs(daysBack: number): { start: number; end: number } {
    const end = Date.now();
    const start = end - daysBack * 24 * 60 * 60 * 1000;
    return { start, end };
}

// ── Google Fit Data Type Names (for convenience) ───────────────────────────────

export const GFIT_DATA_TYPES = {
    STEPS: "com.google.step_count.delta",
    CALORIES: "com.google.calories.expended",
    HEART_RATE: "com.google.heart_rate.bpm",
    SLEEP: "com.google.sleep.segment",
    WEIGHT: "com.google.weight",
    ACTIVITY_SEGMENT: "com.google.activity.segment",
    DISTANCE: "com.google.distance.delta",
} as const;
