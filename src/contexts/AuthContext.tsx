"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, User } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { upsertProfile } from "@/lib/firestore";

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    loading: true,
    signIn: async () => { },
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth || typeof auth.onAuthStateChanged !== "function") {
            // DEMO MODE: No Firebase credentials, provide mock user
            setUser({
                uid: "demo-user-123",
                displayName: "Aadithya Vimal",
                email: "demo@axiosync.app",
                photoURL: "https://images.unsplash.com/photo-1594381898411-846e7d193883?w=100&q=80",
            } as User);
            setLoading(false);
            return () => { };
        }

        const unsub = onAuthStateChanged(auth, async (u) => {
            setUser(u);
            if (u) {
                // Upsert profile on every login (only if not in demo mode)
                try {
                    await upsertProfile({
                        uid: u.uid,
                        name: u.displayName || "User",
                        email: u.email || "",
                        photoURL: u.photoURL || undefined,
                        goals: { calories: 2200, protein_g: 150, carbs_g: 220, fat_g: 70 },
                    });
                } catch (e) { console.error("Firestore upsert failed", e); }
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    const signIn = async () => {
        await signInWithPopup(auth, googleProvider);
    };

    const signOut = async () => {
        await fbSignOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
