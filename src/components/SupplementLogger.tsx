"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
    CheckCircle, Loader2, Plus, Pill, X, ChevronDown, ChevronUp,
    Zap, Droplets, Apple, Dumbbell, Moon, Heart, Activity,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type SupplementCategory = "protein" | "creatine" | "electrolyte" | "vitamin" | "preworkout" | "recovery" | "omega" | "other";

interface SupplementEntry {
    name: string;
    category: SupplementCategory;
    amount_g?: number;
    amount_ml?: number;
    notes?: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const CATEGORIES: { id: SupplementCategory; label: string; icon: React.ReactNode; color: string; emoji: string }[] = [
    { id: "protein", label: "Protein", icon: <Dumbbell className="w-3.5 h-3.5" />, color: "#3B82F6", emoji: "💪" },
    { id: "creatine", label: "Creatine", icon: <Zap className="w-3.5 h-3.5" />, color: "#A855F7", emoji: "⚡" },
    { id: "electrolyte", label: "Electrolyte", icon: <Droplets className="w-3.5 h-3.5" />, color: "#06B6D4", emoji: "💧" },
    { id: "vitamin", label: "Vitamin", icon: <Apple className="w-3.5 h-3.5" />, color: "#22C55E", emoji: "🍎" },
    { id: "preworkout", label: "Pre-Workout", icon: <Zap className="w-3.5 h-3.5" />, color: "#F59E0B", emoji: "🔥" },
    { id: "recovery", label: "Recovery", icon: <Moon className="w-3.5 h-3.5" />, color: "#8B5CF6", emoji: "🌙" },
    { id: "omega", label: "Omega-3", icon: <Heart className="w-3.5 h-3.5" />, color: "#EF4444", emoji: "❤️" },
    { id: "other", label: "Other", icon: <Pill className="w-3.5 h-3.5" />, color: "#6B7280", emoji: "💊" },
];

const QUICK_SUPPLEMENTS: SupplementEntry[] = [
    { name: "Whey Protein", category: "protein", amount_g: 30 },
    { name: "Casein Protein", category: "protein", amount_g: 35 },
    { name: "Creatine Monohydrate", category: "creatine", amount_g: 5 },
    { name: "Salt Tabs", category: "electrolyte", amount_g: 1 },
    { name: "LMNT Electrolytes", category: "electrolyte", amount_g: 8 },
    { name: "Vitamin D3", category: "vitamin", amount_g: 0.125 },
    { name: "Magnesium Glycinate", category: "vitamin", amount_g: 400 },
    { name: "Zinc", category: "vitamin", amount_g: 25 },
    { name: "Pre-Workout", category: "preworkout", amount_g: 20 },
    { name: "Fish Oil / Omega-3", category: "omega", amount_g: 2 },
    { name: "Collagen Peptides", category: "recovery", amount_g: 10 },
    { name: "Ashwagandha", category: "recovery", amount_g: 600 },
    { name: "Melatonin", category: "vitamin", amount_g: 0.5 },
    { name: "Vitamin C", category: "vitamin", amount_g: 1000 },
    { name: "L-Glutamine", category: "recovery", amount_g: 5 },
    { name: "BCAAs", category: "recovery", amount_g: 10 },
];

// ── Today's Log ───────────────────────────────────────────────────────────────

function TodayPills({ logs }: { logs: (SupplementEntry & { id: string })[] }) {
    if (logs.length === 0) return (
        <p className="text-xs text-[var(--text-secondary)] text-center py-2">No supplements logged today</p>
    );
    return (
        <div className="flex flex-wrap gap-1.5">
            {logs.map(log => {
                const cat = CATEGORIES.find(c => c.id === log.category)!;
                return (
                    <div
                        key={log.id}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: `${cat.color}14`, border: `1px solid ${cat.color}30`, color: cat.color }}
                    >
                        <span>{cat.emoji}</span>
                        <span>{log.name}</span>
                        {log.amount_g && <span className="opacity-60">{log.amount_g}g</span>}
                    </div>
                );
            })}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SupplementLogger() {
    const { user } = useAuth();
    const [todayLogs, setTodayLogs] = useState<(SupplementEntry & { id: string })[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<SupplementCategory>("protein");
    const [name, setName] = useState("");
    const [amountG, setAmountG] = useState("");
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState("");

    const handleQuickAdd = useCallback(async (s: SupplementEntry) => {
        if (!user) return;
        setSaved(s.name);
        // Optimistic update
        const id = `${Date.now()}`;
        setTodayLogs(prev => [...prev, { ...s, id }]);
        // Write to Firestore
        try {
            const { addSupplementLog } = await import("@/lib/firestore");
            await addSupplementLog(user.uid, s);
        } catch (e) {
            console.warn("Supplement save failed:", e);
        }
        setTimeout(() => setSaved(""), 2500);
    }, [user]);

    const handleManualSave = useCallback(async () => {
        if (!user || !name) return;
        setSaving(true);
        const entry: SupplementEntry = {
            name,
            category: selectedCategory,
            amount_g: amountG ? parseFloat(amountG) : undefined,
            notes: notes || undefined,
        };
        const id = `${Date.now()}`;
        setTodayLogs(prev => [...prev, { ...entry, id }]);
        try {
            const { addSupplementLog } = await import("@/lib/firestore");
            await addSupplementLog(user.uid, entry);
        } catch (e) {
            console.warn("Supplement save failed:", e);
        }
        setName(""); setAmountG(""); setNotes("");
        setSaving(false);
        setShowForm(false);
        setSaved(name);
        setTimeout(() => setSaved(""), 2500);
    }, [user, name, selectedCategory, amountG, notes]);

    const catGroups: Record<SupplementCategory, SupplementEntry[]> = {} as any;
    QUICK_SUPPLEMENTS.forEach(s => {
        if (!catGroups[s.category]) catGroups[s.category] = [];
        catGroups[s.category].push(s);
    });

    return (
        <div className="space-y-5">
            {/* Today's stack */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <p className="section-header">Today's Stack</p>
                    {saved && (
                        <motion.div
                            initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-1.5 text-xs text-[#22C55E] font-semibold"
                        >
                            <CheckCircle className="w-3.5 h-3.5" /> {saved} logged
                        </motion.div>
                    )}
                </div>
                <div className="p-3 rounded-2xl" style={{ background: "var(--bg-elevated)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <TodayPills logs={todayLogs} />
                </div>
            </div>

            {/* Category tabs */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {CATEGORIES.map(cat => (
                    <motion.button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        whileTap={{ scale: 0.93 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all duration-200"
                        style={selectedCategory === cat.id
                            ? { background: `${cat.color}18`, border: `1px solid ${cat.color}45`, color: cat.color }
                            : { background: "var(--bg-elevated)", border: "1px solid rgba(255,255,255,0.07)", color: "var(--text-muted)" }
                        }
                    >
                        {cat.icon} {cat.label}
                    </motion.button>
                ))}
            </div>

            {/* Quick-add grid for selected category */}
            <div>
                <p className="section-header">Quick Add</p>
                <div className="grid grid-cols-2 gap-1.5">
                    {(catGroups[selectedCategory] || []).map(s => {
                        const cat = CATEGORIES.find(c => c.id === s.category)!;
                        return (
                            <motion.button
                                key={s.name}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleQuickAdd(s)}
                                className="flex items-center gap-2.5 p-3 rounded-2xl text-left transition-all duration-200 hover:bg-white/[0.04]"
                                style={{ background: "var(--bg-elevated)", border: "1px solid rgba(255,255,255,0.06)" }}
                            >
                                <span className="text-lg shrink-0">{cat.emoji}</span>
                                <div className="min-w-0">
                                    <div className="text-xs font-semibold text-[var(--text-primary)] truncate">{s.name}</div>
                                    {s.amount_g && (
                                        <div className="text-[10px] text-[var(--text-muted)]">
                                            {s.amount_g < 1 ? `${s.amount_g * 1000}mcg` : `${s.amount_g}g`}
                                        </div>
                                    )}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Manual entry form */}
            <div>
                <button
                    onClick={() => setShowForm(v => !v)}
                    className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors font-semibold"
                >
                    {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {showForm ? "Cancel" : "Log Custom Supplement"}
                </button>
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-3 space-y-2.5"
                        >
                            <div>
                                <label className="label">Supplement Name</label>
                                <input type="text" placeholder="e.g. NAC, Berberine" value={name}
                                    onChange={e => setName(e.target.value)} className="field text-sm" />
                            </div>
                            <div>
                                <label className="label">Category</label>
                                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value as SupplementCategory)} className="field text-sm">
                                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="label">Amount (g/mg)</label>
                                    <input type="number" placeholder="5" value={amountG}
                                        onChange={e => setAmountG(e.target.value)} className="field text-sm" />
                                </div>
                                <div>
                                    <label className="label">Notes</label>
                                    <input type="text" placeholder="with food" value={notes}
                                        onChange={e => setNotes(e.target.value)} className="field text-sm" />
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
                                onClick={handleManualSave}
                                disabled={saving || !name}
                                className="btn w-full py-3 text-sm font-semibold"
                                style={{
                                    background: "linear-gradient(135deg, #6D28D9 0%, #A855F7 100%)",
                                    boxShadow: "0 4px 16px rgba(139,92,246,0.3)",
                                    color: "white",
                                }}
                            >
                                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Pill className="w-4 h-4" /> Log Supplement</>}
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Summary stats */}
            {todayLogs.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.filter(c => todayLogs.some(l => l.category === c.id)).map(cat => (
                        <div key={cat.id} className="p-2.5 rounded-xl text-center"
                            style={{ background: `${cat.color}0A`, border: `1px solid ${cat.color}20` }}>
                            <div className="text-lg">{cat.emoji}</div>
                            <div className="text-[10px] font-semibold mt-0.5" style={{ color: cat.color }}>
                                {todayLogs.filter(l => l.category === cat.id).length}× {cat.label}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
