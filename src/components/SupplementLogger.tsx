"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
    getTodaySupplements, addSupplementLog, deleteSupplementLog, SupplementLog
} from "@/lib/firestore";
import { Timestamp } from "firebase/firestore";
import {
    CheckCircle, Loader2, Plus, Pill, X, ChevronDown, ChevronUp,
    Zap, Droplets, Apple, Dumbbell, Moon, Heart, Trash2, Edit2, Info
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
    { name: "Creatine Monohydrate", category: "creatine", amount_g: 5 },
    { name: "Vitamin D3", category: "vitamin", amount_g: 0.125 },
    { name: "Magnesium Glycinate", category: "vitamin", amount_g: 0.4 },
    { name: "LMNT Electrolytes", category: "electrolyte", amount_g: 8 },
    { name: "Fish Oil / Omega-3", category: "omega", amount_g: 2 },
    { name: "Pre-Workout", category: "preworkout", amount_g: 20 },
    { name: "Ashwagandha", category: "recovery", amount_g: 0.6 },
];

// ── Main Component ────────────────────────────────────────────────────────────

export default function SupplementLogger({ onRefresh, selectedDate }: { onRefresh?: () => Promise<void>; selectedDate?: Date }) {
    const { user } = useAuth();
    const [todayLogs, setTodayLogs] = useState<SupplementLog[]>([]);
    const [fetching, setFetching] = useState(true);
    
    const [showForm, setShowForm] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<SupplementCategory>("protein");
    const [name, setName] = useState("");
    const [amountG, setAmountG] = useState("");
    const [notes, setNotes] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState("");

    const fetchLogs = useCallback(async () => {
        if (!user) return;
        setFetching(true);
        try {
            const data = await getTodaySupplements(user.uid, selectedDate);
            setTodayLogs(data);
        } catch (e) {
            console.error("Failed to fetch supplements:", e);
        } finally {
            setFetching(false);
        }
    }, [user, selectedDate]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleQuickAdd = useCallback(async (s: SupplementEntry) => {
        if (!user || saving) return;
        setSaving(true);
        try {
            const ref = await addSupplementLog(user.uid, s, selectedDate);
            if (ref) {
                setTodayLogs(prev => [{ id: ref.id, uid: user.uid, timestamp: (selectedDate ? Timestamp.fromDate(selectedDate) : new Date()) as any, ...s }, ...prev]);
                setSaved(s.name);
                if (onRefresh) await onRefresh();
                setTimeout(() => setSaved(""), 2500);
            }
        } catch (e) {
            console.warn("Supplement save failed:", e);
        } finally {
            setSaving(false);
        }
    }, [user, saving, onRefresh, selectedDate]);

    const handleSave = useCallback(async () => {
        if (!user || !name || saving) return;
        setSaving(true);
        
        // If editing, we delete the old one first
        if (editingId) {
            try {
                await deleteSupplementLog(user.uid, editingId);
            } catch (e) {
                console.error("Failed to delete old log while editing:", e);
            }
        }

        const entry: Omit<SupplementLog, "id" | "uid" | "timestamp"> = {
            name,
            category: selectedCategory,
            amount_g: amountG ? parseFloat(amountG) : undefined,
            notes: notes || undefined,
        };

        try {
            const ref = await addSupplementLog(user.uid, entry, selectedDate);
            if (ref) {
                if (editingId) {
                    setTodayLogs(prev => prev.filter(l => l.id !== editingId));
                }
                setTodayLogs(prev => [{ id: ref.id, uid: user.uid, timestamp: (selectedDate ? Timestamp.fromDate(selectedDate) : new Date()) as any, ...entry }, ...prev]);
                setSaved(name);
                if (onRefresh) await onRefresh();
                setTimeout(() => setSaved(""), 2500);
            }
        } catch (e) {
            console.warn("Supplement save failed:", e);
        } finally {
            setSaving(false);
            setShowForm(false);
            setName(""); setAmountG(""); setNotes(""); setEditingId(null);
        }
    }, [user, name, selectedCategory, amountG, notes, editingId, onRefresh, selectedDate]);

    const handleDelete = async (id: string) => {
        if (!user) return;
        try {
            await deleteSupplementLog(user.uid, id);
            setTodayLogs(prev => prev.filter(l => l.id !== id));
            if (onRefresh) await onRefresh();
        } catch (e) {
            console.error("Delete failed:", e);
        }
    };

    const startEdit = (log: SupplementLog) => {
        setName(log.name);
        setSelectedCategory(log.category);
        setAmountG(log.amount_g ? String(log.amount_g) : "");
        setNotes(log.notes || "");
        setEditingId(log.id || null);
        setShowForm(true);
    };

    const catGroups: Record<string, SupplementEntry[]> = {};
    QUICK_SUPPLEMENTS.forEach(s => {
        if (!catGroups[s.category]) catGroups[s.category] = [];
        catGroups[s.category].push(s);
    });

    const isToday = !selectedDate || new Date(selectedDate).toDateString() === new Date().toDateString();

    return (
        <div className="space-y-6">
            {/* Today's Stack List */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="section-header border-none mb-0">{isToday ? "Today's Stack" : `Stack for ${selectedDate?.toLocaleDateString()}`}</p>
                    {fetching && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--text-muted)]" />}
                    {saved && (
                        <motion.div
                            initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-1.5 text-xs text-[#22C55E] font-semibold"
                        >
                            <CheckCircle className="w-3.5 h-3.5" /> {saved} logged
                        </motion.div>
                    )}
                </div>

                <div className="space-y-1.5">
                    {!fetching && todayLogs.length === 0 && (
                        <div className="text-center py-6 border border-dashed border-white/10 rounded-2xl text-[var(--text-muted)] text-sm">
                            No supplements logged for this day.
                        </div>
                    )}
                    {todayLogs.map((log) => {
                        const cat = CATEGORIES.find(c => c.id === log.category)!;
                        return (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-between p-3 rounded-xl border border-white/[0.05] group"
                                style={{ background: "var(--bg-overlay)" }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" 
                                         style={{ background: `${cat.color}15`, color: cat.color }}>
                                        {cat.icon}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-[var(--text-primary)] truncate flex items-center gap-2">
                                            {log.name}
                                            {log.notes && (
                                                <div className="group/note relative inline-block">
                                                    <Info className="w-3 h-3 text-[var(--text-muted)]" />
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 rounded-lg bg-black text-[10px] text-white opacity-0 group-hover/note:opacity-100 transition-opacity pointer-events-none z-10 border border-white/10">
                                                        {log.notes}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider">
                                            {cat.label} {log.amount_g ? `• ${log.amount_g >= 1 ? `${log.amount_g}g` : `${log.amount_g * 1000}mg`}` : ""}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => startEdit(log)}
                                        className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(log.id!)}
                                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-500/50 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Quick Add Section */}
            <div className="space-y-3">
                <p className="section-header border-none mb-0">Quick Add</p>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                                selectedCategory === cat.id 
                                ? "bg-white/[0.08] text-[var(--text-primary)] border border-white/10" 
                                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                            }`}
                        >
                            {cat.emoji} {cat.label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {(catGroups[selectedCategory] || []).map(s => (
                        <button
                            key={s.name}
                            onClick={() => handleQuickAdd(s)}
                            disabled={saving}
                            className="flex flex-col gap-1 p-3 rounded-2xl text-left transition-all border border-white/[0.05] hover:border-white/10 hover:bg-white/[0.02]"
                            style={{ background: "var(--bg-elevated)" }}
                        >
                            <div className="text-xs font-semibold text-[var(--text-primary)] truncate">{s.name}</div>
                            {s.amount_g && (
                                <div className="text-[10px] text-[var(--text-muted)]">
                                    {s.amount_g < 1 ? `${s.amount_g * 1000}mg` : `${s.amount_g}g`}
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Manual Entry Toggle */}
            <div>
                <button
                    onClick={() => { setShowForm(!showForm); if(!showForm) setEditingId(null); }}
                    className="btn btn-ghost w-full text-sm gap-2"
                >
                    {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Log Custom Supplement</>}
                </button>

                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-4 space-y-4 pt-4 border-t border-white/5"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="label">Supplement Name</label>
                                    <input type="text" placeholder="e.g. Magnesium Glycinate" value={name}
                                        onChange={e => setName(e.target.value)} className="field text-sm" />
                                </div>
                                <div>
                                    <label className="label">Category</label>
                                    <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value as SupplementCategory)} className="field text-sm">
                                        {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Amount (grams)</label>
                                    <input type="number" step="0.01" placeholder="0.5" value={amountG}
                                        onChange={e => setAmountG(e.target.value)} className="field text-sm" />
                                </div>
                                <div className="col-span-2">
                                    <label className="label">Notes (optional)</label>
                                    <input type="text" placeholder="Take with dinner" value={notes}
                                        onChange={e => setNotes(e.target.value)} className="field text-sm" />
                                </div>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={saving || !name}
                                className="btn btn-primary w-full py-3 text-sm font-semibold"
                                style={{
                                    background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                                    color: "white"
                                }}
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Update Log" : "Log Supplement"}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
