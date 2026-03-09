"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Watch, ChevronRight, CheckCircle, Clock, ExternalLink, Shield, RefreshCw } from "lucide-react";
import { buildGoogleFitOAuthUrl } from "@/lib/GoogleFitMapper";

const WEARABLE_SOURCES = [
    {
        id: "google_fit",
        name: "Google Fit / Health Connect",
        icon: "🏃",
        desc: "Steps, heart rate, workouts, sleep, calories, body measurements",
        color: "#22C55E",
        status: "oauth_ready",
        fields: ["Steps", "Heart Rate", "HRV", "Active Calories", "Workout Sessions", "Sleep Stages", "Weight"],
        badge: "Primary",
    },
    {
        id: "garmin",
        name: "Garmin Connect",
        icon: "⌚",
        desc: "Advanced training load, Body Battery, sleep score, VO2 max, stress",
        color: "#3B82F6",
        status: "planned",
        fields: ["Body Battery", "Training Load", "VO2 Max", "Stress Score", "Pulse Ox", "Race Predictor"],
    },
    {
        id: "oura",
        name: "Oura Ring Gen 4",
        icon: "💍",
        desc: "Precision sleep phases, HRV trends, readiness, skin temperature",
        color: "#A855F7",
        status: "planned",
        fields: ["Readiness Score", "Sleep Phases (REM/Deep/Light)", "HRV Trend", "Skin Temp", "Resilience"],
    },
    {
        id: "whoop",
        name: "WHOOP",
        icon: "⚡",
        desc: "Strain score, recovery percentage, sleep debt, respiratory rate",
        color: "#F59E0B",
        status: "planned",
        fields: ["Strain Score", "Recovery %", "Sleep Performance", "HRV", "Respiratory Rate", "Blood Oxygen"],
    },
    {
        id: "manual",
        name: "Manual Entry",
        icon: "✏️",
        desc: "Log HRV, resting HR, and sleep quality in the Readiness tab",
        color: "#06B6D4",
        status: "active",
        fields: ["HRV", "Resting HR", "Sleep Quality", "Readiness", "Exertion Level"],
    },
] as const;

const STATUS_CONFIG = {
    active: { label: "Active", color: "#22C55E" },
    oauth_ready: { label: "Connect", color: "#3B82F6" },
    coming_soon: { label: "Coming Soon", color: "#F59E0B" },
    planned: { label: "Planned", color: "#52525B" },
};

export default function WearableSync() {
    const [expanded, setExpanded] = useState<string | null>(null);
    const [connecting, setConnecting] = useState(false);

    const handleGoogleFitConnect = () => {
        setConnecting(true);
        const url = buildGoogleFitOAuthUrl(crypto.randomUUID());
        // In production this triggers the OAuth redirect; in demo just show intent
        setTimeout(() => {
            window.open(url, "_blank", "width=500,height=600,noopener");
            setConnecting(false);
        }, 400);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)" }}>
                    <Watch className="w-5 h-5 text-[#3B82F6]" />
                </div>
                <div>
                    <h3 className="font-semibold text-white">Wearable & Health Sync</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">All wearable data maps to the same Firestore schema as manual logs</p>
                </div>
            </div>

            {/* Schema badge */}
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-2xl"
                style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
                <Shield className="w-3.5 h-3.5 text-[#3B82F6] shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-500 leading-relaxed">
                    HRV, HR zones, sleep stages, and readiness are already modelled in Firestore — connecting any device instantly populates your Analytics hub.
                </p>
            </div>

            {/* Sources */}
            <div className="space-y-2">
                {WEARABLE_SOURCES.map((src, i) => {
                    const cfg = STATUS_CONFIG[src.status as keyof typeof STATUS_CONFIG];
                    const isOpen = expanded === src.id;
                    const isActive = src.status === "active";
                    const isOAuth = src.status === "oauth_ready";

                    return (
                        <motion.div
                            key={src.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 28 }}
                        >
                            {/* Card header */}
                            <div
                                className="rounded-2xl overflow-hidden"
                                style={{
                                    background: isActive || isOAuth ? `${src.color}0A` : "var(--bg-elevated)",
                                    border: `1px solid ${isActive || isOAuth ? `${src.color}25` : "rgba(255,255,255,0.06)"}`,
                                }}
                            >
                                <motion.button
                                    whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => setExpanded(isOpen ? null : src.id)}
                                    className="flex items-center gap-3 w-full p-4 text-left"
                                >
                                    <span className="text-xl shrink-0">{src.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                            <span className="text-sm font-semibold text-white">{src.name}</span>
                                            {(src as any).badge && (
                                                <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-[#22C55E]/15 text-[#22C55E]">
                                                    {(src as any).badge}
                                                </span>
                                            )}
                                            <span
                                                className="text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                                                style={{ background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}30` }}
                                            >
                                                {cfg.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-600">{src.desc}</p>
                                    </div>
                                    <motion.div
                                        animate={{ rotate: isOpen ? 90 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ChevronRight className="w-4 h-4 text-zinc-700 shrink-0" />
                                    </motion.div>
                                </motion.button>

                                {/* Expanded content */}
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-4 pb-4 pt-1 border-t border-white/[0.05] space-y-3">
                                                <div>
                                                    <p className="text-[10px] text-zinc-600 mb-1.5">Fields that will auto-populate in Axiosync:</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {src.fields.map(f => (
                                                            <span key={f} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                                                style={{ background: `${src.color}15`, color: src.color }}>
                                                                {f}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Google Fit connect button */}
                                                {isOAuth && (
                                                    <motion.button
                                                        onClick={handleGoogleFitConnect}
                                                        disabled={connecting}
                                                        whileHover={{ scale: 1.01 }}
                                                        whileTap={{ scale: 0.97 }}
                                                        className="btn w-full py-3 text-sm"
                                                        style={{
                                                            background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
                                                            boxShadow: "0 4px 16px rgba(34,197,94,0.25), 0 1px 0 rgba(255,255,255,0.12) inset",
                                                            color: "white",
                                                        }}
                                                    >
                                                        {connecting
                                                            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Connecting…</>
                                                            : <><ExternalLink className="w-4 h-4" /> Connect Google Fit</>
                                                        }
                                                    </motion.button>
                                                )}

                                                {/* Manual entry CTA */}
                                                {isActive && (
                                                    <p className="text-[10px] text-zinc-700">
                                                        💡 Log HRV, resting HR, and sleep in the <span className="text-zinc-500">Analytics → Readiness</span> tab.
                                                    </p>
                                                )}

                                                {/* Planned message */}
                                                {src.status === "planned" && (
                                                    <div className="flex items-start gap-2 text-[10px] text-zinc-700">
                                                        <Clock className="w-3 h-3 shrink-0 mt-0.5" />
                                                        Coming in a future release. Data schema is already modelled in Firestore.
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
