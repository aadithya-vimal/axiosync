"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import {
    db,
    ensureDefaultProfile,
    getTodayToxins,
    getTodayNutrition,
    getWeekSleepLogs,
    ToxinLog,
    NutritionLog,
    SleepLog,
    UserProfile,
} from "@/lib/db";

interface ToxinState {
    hasSmoking: boolean;
    hasAlcohol: boolean;
    smokingCount: number;
    alcoholUnits: number;
}

interface NutritionState {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    vitamin_d: number;
    magnesium: number;
    iron: number;
    omega3: number;
}

interface HealthState {
    profile: UserProfile | null;
    toxins: ToxinState;
    nutrition: NutritionState;
    sleepLogs: SleepLog[];
    isLoaded: boolean;
    refreshTrigger: number;
}

type Action =
    | { type: "SET_PROFILE"; payload: UserProfile }
    | { type: "SET_TOXINS"; payload: ToxinState }
    | { type: "SET_NUTRITION"; payload: NutritionState }
    | { type: "SET_SLEEP"; payload: SleepLog[] }
    | { type: "SET_LOADED" }
    | { type: "TRIGGER_REFRESH" };

const initialState: HealthState = {
    profile: null,
    toxins: { hasSmoking: false, hasAlcohol: false, smokingCount: 0, alcoholUnits: 0 },
    nutrition: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, vitamin_d: 0, magnesium: 0, iron: 0, omega3: 0 },
    sleepLogs: [],
    isLoaded: false,
    refreshTrigger: 0,
};

function reducer(state: HealthState, action: Action): HealthState {
    switch (action.type) {
        case "SET_PROFILE": return { ...state, profile: action.payload };
        case "SET_TOXINS": return { ...state, toxins: action.payload };
        case "SET_NUTRITION": return { ...state, nutrition: action.payload };
        case "SET_SLEEP": return { ...state, sleepLogs: action.payload };
        case "SET_LOADED": return { ...state, isLoaded: true };
        case "TRIGGER_REFRESH": return { ...state, refreshTrigger: state.refreshTrigger + 1 };
        default: return state;
    }
}

interface HealthContextValue extends HealthState {
    logToxin: (log: Omit<ToxinLog, "id">) => Promise<void>;
    logNutrition: (log: Omit<NutritionLog, "id">) => Promise<void>;
    logSleep: (log: Omit<SleepLog, "id">) => Promise<void>;
    refresh: () => void;
}

const HealthContext = createContext<HealthContextValue | null>(null);

export function HealthProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    const loadData = useCallback(async () => {
        await ensureDefaultProfile();
        const profile = await db.user_profile.toCollection().first();
        const toxins = await getTodayToxins();
        const nutrition = await getTodayNutrition();
        const sleepLogs = await getWeekSleepLogs();
        if (profile) dispatch({ type: "SET_PROFILE", payload: profile });
        dispatch({ type: "SET_TOXINS", payload: toxins });
        dispatch({ type: "SET_NUTRITION", payload: nutrition });
        dispatch({ type: "SET_SLEEP", payload: sleepLogs });
        dispatch({ type: "SET_LOADED" });
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData, state.refreshTrigger]);

    const logToxin = async (log: Omit<ToxinLog, "id">) => {
        await db.logs_toxins.add(log);
        dispatch({ type: "TRIGGER_REFRESH" });
    };

    const logNutrition = async (log: Omit<NutritionLog, "id">) => {
        await db.logs_nutrition.add(log);
        dispatch({ type: "TRIGGER_REFRESH" });
    };

    const logSleep = async (log: Omit<SleepLog, "id">) => {
        await db.logs_sleep.add(log);
        dispatch({ type: "TRIGGER_REFRESH" });
    };

    const refresh = () => dispatch({ type: "TRIGGER_REFRESH" });

    return (
        <HealthContext.Provider value={{ ...state, logToxin, logNutrition, logSleep, refresh }}>
            {children}
        </HealthContext.Provider>
    );
}

export function useHealth() {
    const ctx = useContext(HealthContext);
    if (!ctx) throw new Error("useHealth must be used within HealthProvider");
    return ctx;
}
