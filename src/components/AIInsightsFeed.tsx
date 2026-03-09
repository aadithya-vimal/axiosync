"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, RefreshCw, ChevronRight } from "lucide-react";

interface Insight {
    id: string;
    category: "readiness" | "training" | "nutrition" | "sleep" | "motivation";
    text: string;
    emoji: string;
    color: string;
}

// Deterministic insight generation based on data snapshot
function generateInsights(opts: {
    readinessPct?: number;
    lastSleepHours?: number;
    lastSleepQuality?: number;
    daysSinceWorkout?: number;
    totalVolumeToday?: number;
    streakDays?: number;
    lastCardioKm?: number;
}): Insight[] {
    const {
        readinessPct = 70,
        lastSleepHours = 7,
        lastSleepQuality = 7,
        daysSinceWorkout = 1,
        totalVolumeToday = 0,
        streakDays = 0,
        lastCardioKm = 0,
    } = opts;

    const insights: Insight[] = [];

    // Readiness insight
    if (readinessPct >= 85) {
        insights.push({
            id: "readiness_high",
            category: "readiness",
            text: `Your readiness score is ${readinessPct}% — you're in peak condition. This is an ideal day for a high-intensity session or a new personal record attempt. Don't leave this window unused.`,
            emoji: "⚡",
            color: "#30D158",
        });
    } else if (readinessPct >= 65) {
        insights.push({
            id: "readiness_mid",
            category: "readiness",
            text: `Readiness at ${readinessPct}% — good enough for a solid workout, but not your peak. Prioritize quality reps over chasing new PRs today.`,
            emoji: "✅",
            color: "#0A84FF",
        });
    } else {
        insights.push({
            id: "readiness_low",
            category: "readiness",
            text: `Readiness is low at ${readinessPct}%. Your body's signaling it needs recovery. Active rest — a walk, yoga, or mobility work — will serve you better than pushing hard today.`,
            emoji: "🛌",
            color: "#FF9F0A",
        });
    }

    // Sleep insight
    if (lastSleepHours < 6) {
        insights.push({
            id: "sleep_poor",
            category: "sleep",
            text: `You got ${lastSleepHours.toFixed(1)}h of sleep — below the minimum needed for muscle protein synthesis to peak. Even a 20-minute nap this afternoon can meaningfully restore cognitive performance.`,
            emoji: "😴",
            color: "#5AC8FA",
        });
    } else if (lastSleepHours >= 8 && lastSleepQuality >= 7) {
        insights.push({
            id: "sleep_great",
            category: "sleep",
            text: `Excellent sleep last night — ${lastSleepHours.toFixed(1)}h with a quality score of ${lastSleepQuality}/10. Growth hormone secreted during deep sleep will directly support strength gains from yesterday's training.`,
            emoji: "🌙",
            color: "#BF5AF2",
        });
    }

    // Training insight
    if (daysSinceWorkout === 0 && totalVolumeToday > 0) {
        insights.push({
            id: "trained_today",
            category: "training",
            text: `You've already logged ${Math.round(totalVolumeToday).toLocaleString()}kg volume today. Remember: growth happens during recovery, not the session itself. Prioritize protein intake and sleep tonight.`,
            emoji: "💪",
            color: "#FF9F0A",
        });
    } else if (daysSinceWorkout >= 3) {
        insights.push({
            id: "overdue",
            category: "training",
            text: `It's been ${daysSinceWorkout} days since your last training session. Muscle protein turnover peaks at 48–72h post-workout — meaning you're in a window where a session today will be especially productive.`,
            emoji: "🔔",
            color: "#FF453A",
        });
    }

    // Streak/Motivation
    if (streakDays >= 5) {
        insights.push({
            id: "streak_motivation",
            category: "motivation",
            text: `${streakDays}-day streak — you're in the range where habits become automatic. Research shows that at 7 days, daily exercise becomes a self-sustaining behavior loop. Keep going.`,
            emoji: "🔥",
            color: "#FF9F0A",
        });
    } else if (streakDays === 0) {
        insights.push({
            id: "start_streak",
            category: "motivation",
            text: `Every streak starts with a single day. Just 20 minutes of movement today — a walk, a lift, a swim — resets the clock and starts compounding consistency.`,
            emoji: "🚀",
            color: "#0A84FF",
        });
    }

    // Cardio
    if (lastCardioKm >= 5) {
        insights.push({
            id: "cardio_great",
            category: "training",
            text: `Nice run — ${lastCardioKm.toFixed(1)}km logged. Zone 2 aerobic training at this distance stimulates mitochondrial biogenesis, giving long-term benefits to all other activities including strength training.`,
            emoji: "🏃",
            color: "#30D158",
        });
    }

    return insights.slice(0, 3);
}

const CATEGORY_CONFIG = {
    readiness: { label: "Readiness", color: "#30D158" },
    training: { label: "Training", color: "#0A84FF" },
    nutrition: { label: "Nutrition", color: "#FF9F0A" },
    sleep: { label: "Sleep", color: "#5AC8FA" },
    motivation: { label: "Motivation", color: "#BF5AF2" },
};

interface Props {
    readinessPct?: number;
    lastSleepHours?: number;
    lastSleepQuality?: number;
    daysSinceWorkout?: number;
    totalVolumeToday?: number;
    streakDays?: number;
    lastCardioKm?: number;
}

export default function AIInsightsFeed(props: Props) {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        setInsights(generateInsights(props));
    }, [
        props.readinessPct, props.lastSleepHours, props.lastSleepQuality,
        props.daysSinceWorkout, props.totalVolumeToday, props.streakDays, props.lastCardioKm
    ]);

    const handleRefresh = () => {
        setRefreshing(true);
        setTimeout(() => {
            setInsights(generateInsights(props));
            setRefreshing(false);
        }, 600);
    };

    if (insights.length === 0) return null;

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#BF5AF2]/20 flex items-center justify-center">
                        <Brain className="w-3.5 h-3.5 text-[#BF5AF2]" />
                    </div>
                    <span className="text-sm font-semibold text-white">AI Insights</span>
                    <span className="text-[10px] text-zinc-600 bg-white/[0.05] px-2 py-0.5 rounded-full">Today</span>
                </div>
                <motion.button
                    onClick={handleRefresh}
                    animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                </motion.button>
            </div>

            {/* Insight cards */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={refreshing ? "loading" : "content"}
                    className="space-y-2"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                >
                    {refreshing ? (
                        /* Skeleton loaders */
                        [0, 1, 2].map(i => (
                            <div key={i} className="h-20 rounded-2xl bg-white/[0.04] border border-white/[0.05] animate-pulse" />
                        ))
                    ) : (
                        insights.map((insight, i) => {
                            const cfg = CATEGORY_CONFIG[insight.category];
                            const isOpen = expanded === insight.id;
                            return (
                                <motion.div
                                    key={insight.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06, type: "spring", stiffness: 280, damping: 26 }}
                                    className="rounded-2xl border overflow-hidden cursor-pointer"
                                    style={{
                                        background: `${insight.color}08`,
                                        borderColor: `${insight.color}22`,
                                    }}
                                    onClick={() => setExpanded(isOpen ? null : insight.id)}
                                    whileTap={{ scale: 0.99 }}
                                >
                                    <div className="flex items-start gap-3 p-3.5">
                                        <span className="text-xl mt-0.5 shrink-0">{insight.emoji}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: cfg.color }}>
                                                    {cfg.label}
                                                </span>
                                            </div>
                                            <p className={`text-xs text-zinc-300 leading-relaxed ${isOpen ? "" : "line-clamp-2"}`}>
                                                {insight.text}
                                            </p>
                                        </div>
                                        <motion.div
                                            animate={{ rotate: isOpen ? 90 : 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="shrink-0 mt-1"
                                        >
                                            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                                        </motion.div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
