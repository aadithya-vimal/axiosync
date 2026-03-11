"use client";

import { useHealth } from "@/contexts/HealthContext";
import { Sun, Zap, Star } from "lucide-react";

interface NutrientGoal {
    key: keyof ReturnType<typeof useHealth>["nutrition"];
    label: string;
    unit: string;
    target: number;
    color: string;
    icon: string;
    bodyEffect: string;
}

const NUTRIENTS: NutrientGoal[] = [
    { key: "vitamin_d", label: "Vitamin D", unit: "mcg", target: 20, color: "#f59e0b", icon: "☀️", bodyEffect: "Bone & Immune system" },
    { key: "magnesium", label: "Magnesium", unit: "mg", target: 400, color: "#8b5cf6", icon: "⚡", bodyEffect: "Nervous system" },
    { key: "iron", label: "Iron", unit: "mg", target: 18, color: "#ef4444", icon: "🩸", bodyEffect: "Blood & Energy" },
    { key: "omega3", label: "Omega-3", unit: "mg", target: 1500, color: "#06b6d4", icon: "🧠", bodyEffect: "Brain & Heart" },
];

export default function NutrientTracker() {
    const { nutrition, profile } = useHealth();

    const goals = profile?.goals.vitamins ?? {
        vitamin_d: 20, magnesium: 400, iron: 18, omega3: 1500,
    };

    return (
        <div className="space-y-3">
            {NUTRIENTS.map((n) => {
                const current = nutrition[n.key] || 0;
                const target = (goals as Record<string, number>)[n.key] ?? n.target;
                const pct = Math.min(100, Math.round((current / target) * 100));
                const met = pct >= 80;

                return (
                    <div key={n.key} className={`rounded-xl p-3 border transition-all ${met ? "bg-emerald-500/10 border-emerald-500/30" : "bg-white/5 border-[var(--border-subtle)]"}`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-base">{n.icon}</span>
                                <div>
                                    <div className="text-sm font-medium text-[var(--text-primary)]">{n.label}</div>
                                    <div className="text-xs text-slate-500">{n.bodyEffect}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-sm font-bold ${met ? "text-emerald-400" : "text-[var(--text-primary)]"}`}>
                                    {current}
                                    <span className="text-xs text-slate-500 font-normal ml-0.5">{n.unit}</span>
                                </div>
                                <div className="text-xs text-slate-500">{pct}% of goal</div>
                            </div>
                        </div>

                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                    width: `${pct}%`,
                                    background: met
                                        ? "linear-gradient(90deg, #10b981, #22d3ee)"
                                        : `linear-gradient(90deg, ${n.color}88, ${n.color})`,
                                }}
                            />
                        </div>

                        {met && (
                            <div className="mt-1.5 text-xs text-emerald-400 flex items-center gap-1">
                                <Star className="w-3 h-3" /> Goal met — body aura activated
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
