"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { addNutritionLog } from "@/lib/firestore";
import { Plus, Utensils, ChevronDown, ChevronUp, CheckCircle, Loader2, Flame, Beef, Wheat, Droplets } from "lucide-react";

// ── Quick-add templates ────────────────────────────────────────────────────────

const QUICK_TEMPLATES = [
    { name: "Chicken Breast (150g)", calories: 248, protein_g: 46, carbs_g: 0, fat_g: 5, emoji: "🍗" },
    { name: "Oats (80g)", calories: 291, protein_g: 10, carbs_g: 50, fat_g: 5, emoji: "🌾" },
    { name: "Protein Shake", calories: 150, protein_g: 30, carbs_g: 5, fat_g: 2, emoji: "🥛" },
    { name: "Brown Rice (200g)", calories: 218, protein_g: 5, carbs_g: 46, fat_g: 2, emoji: "🍚" },
    { name: "Eggs × 3", calories: 234, protein_g: 18, carbs_g: 1, fat_g: 17, emoji: "🥚" },
    { name: "Greek Yogurt (200g)", calories: 130, protein_g: 18, carbs_g: 8, fat_g: 2, emoji: "🫙" },
    { name: "Salmon (150g)", calories: 310, protein_g: 33, carbs_g: 0, fat_g: 19, emoji: "🐟" },
    { name: "Sweet Potato (200g)", calories: 172, protein_g: 3, carbs_g: 40, fat_g: 0, emoji: "🍠" },
    { name: "Banana", calories: 89, protein_g: 1, carbs_g: 23, fat_g: 0, emoji: "🍌" },
    { name: "Peanut Butter (2tbsp)", calories: 188, protein_g: 8, carbs_g: 6, fat_g: 16, emoji: "🥜" },
    { name: "Mixed Salad (300g)", calories: 80, protein_g: 4, carbs_g: 10, fat_g: 3, emoji: "🥗" },
    { name: "Pasta (150g dry)", calories: 525, protein_g: 18, carbs_g: 103, fat_g: 2, emoji: "🍝" },
];

// ── Macro Ring (SVG) ───────────────────────────────────────────────────────────

function MacroRing({ calories, target = 2500 }: { calories: number; target?: number }) {
    const pct = Math.min(1, calories / target);
    const r = 44;
    const circ = 2 * Math.PI * r;
    const strokeDash = pct * circ;
    const color = calories > target ? "#EF4444" : calories > target * 0.8 ? "#F59E0B" : "#22C55E";

    return (
        <div className="relative flex items-center justify-center" style={{ width: 108, height: 108 }}>
            <svg width="108" height="108" viewBox="0 0 108 108">
                <circle cx="54" cy="54" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle cx="54" cy="54" r={r} fill="none" stroke={color} strokeWidth="8"
                    strokeLinecap="round" strokeDasharray={`${strokeDash} ${circ - strokeDash}`}
                    transform="rotate(-90 54 54)"
                    style={{ transition: "stroke-dasharray 0.6s ease", filter: `drop-shadow(0 0 6px ${color}60)` }}
                />
            </svg>
            <div className="absolute text-center">
                <div className="text-xl font-bold stat-num text-white">{Math.round(calories)}</div>
                <div className="text-[9px] text-zinc-500 font-medium uppercase tracking-wider">kcal</div>
            </div>
        </div>
    );
}

// ── Macro Bar ─────────────────────────────────────────────────────────────────

function MacroBar({ label, grams, color, icon }: { label: string; grams: number; color: string; icon: React.ReactNode }) {
    return (
        <div className="flex items-center gap-2">
            <div className="text-zinc-500 shrink-0">{icon}</div>
            <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-400 font-medium">{label}</span>
                    <span className="stat-num font-bold" style={{ color }}>{grams}g</span>
                </div>
                <div className="progress-track">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (grams / 200) * 100)}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: color }}
                    />
                </div>
            </div>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function NutritionLogger({ calTarget = 2500 }: { calTarget?: number }) {
    const { user } = useAuth();

    const [meals, setMeals] = useState<{
        name: string; calories: number; protein_g: number; carbs_g: number; fat_g: number;
        fiber_g: number; sodium_mg: number; sugar_g: number;
    }[]>([]);

    const [formOpen, setFormOpen] = useState(false);
    const [name, setName] = useState("");
    const [calories, setCalories] = useState("");
    const [protein, setProtein] = useState("");
    const [carbs, setCarbs] = useState("");
    const [fat, setFat] = useState("");
    const [fiber, setFiber] = useState("");
    const [sodium, setSodium] = useState("");
    const [sugar, setSugar] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);

    // Totals
    const totals = meals.reduce(
        (acc, m) => ({
            calories: acc.calories + m.calories,
            protein_g: acc.protein_g + m.protein_g,
            carbs_g: acc.carbs_g + m.carbs_g,
            fat_g: acc.fat_g + m.fat_g,
        }),
        { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
    );

    const applyTemplate = (t: typeof QUICK_TEMPLATES[0]) => {
        setName(t.name);
        setCalories(String(t.calories));
        setProtein(String(t.protein_g));
        setCarbs(String(t.carbs_g));
        setFat(String(t.fat_g));
        setShowTemplates(false);
        setFormOpen(true);
    };

    const handleSave = useCallback(async () => {
        if (!user || !calories) return;
        setSaving(true);
        const meal = {
            name: name || "Meal",
            calories: parseFloat(calories) || 0,
            protein_g: parseFloat(protein) || 0,
            carbs_g: parseFloat(carbs) || 0,
            fat_g: parseFloat(fat) || 0,
            fiber_g: parseFloat(fiber) || 0,
            sodium_mg: parseFloat(sodium) || 0,
            sugar_g: parseFloat(sugar) || 0,
        };
        await addNutritionLog(user.uid, { meal_name: meal.name, ...meal });
        setMeals(prev => [...prev, meal]);
        setName(""); setCalories(""); setProtein(""); setCarbs("");
        setFat(""); setFiber(""); setSodium(""); setSugar("");
        setFormOpen(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        setSaving(false);
    }, [user, name, calories, protein, carbs, fat, fiber, sodium, sugar]);

    return (
        <div className="space-y-4">
            {/* Header + summary */}
            <div className="flex items-start gap-4">
                <MacroRing calories={totals.calories} target={calTarget} />
                <div className="flex-1 space-y-2.5 pt-1">
                    <MacroBar label="Protein" grams={Math.round(totals.protein_g)} color="#22C55E" icon={<Beef className="w-3.5 h-3.5" />} />
                    <MacroBar label="Carbs" grams={Math.round(totals.carbs_g)} color="#3B82F6" icon={<Wheat className="w-3.5 h-3.5" />} />
                    <MacroBar label="Fats" grams={Math.round(totals.fat_g)} color="#F59E0B" icon={<Droplets className="w-3.5 h-3.5" />} />
                </div>
            </div>

            {/* Today's meals list */}
            {meals.length > 0 && (
                <div className="space-y-1">
                    <p className="section-header">Today's Meals</p>
                    {meals.map((m, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-white/[0.05]"
                            style={{ background: "var(--bg-overlay)" }}
                        >
                            <div className="flex items-center gap-2.5">
                                <Utensils className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                                <span className="text-sm text-white font-medium">{m.name}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-zinc-500 tabular-nums">
                                <span className="text-[#22C55E] font-semibold">{m.protein_g}g P</span>
                                <span className="text-[#3B82F6] font-semibold">{m.carbs_g}g C</span>
                                <span className="text-[#F59E0B] font-semibold">{m.fat_g}g F</span>
                                <span className="text-zinc-400 font-bold">{m.calories}kcal</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Quick-add templates */}
            <div>
                <button
                    onClick={() => setShowTemplates(v => !v)}
                    className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-medium"
                >
                    {showTemplates ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    Quick-add foods
                </button>
                <AnimatePresence>
                    {showTemplates && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-2"
                        >
                            <div className="grid grid-cols-2 gap-1.5">
                                {QUICK_TEMPLATES.map(t => (
                                    <button
                                        key={t.name}
                                        onClick={() => applyTemplate(t)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-medium transition-colors"
                                        style={{ background: "var(--bg-overlay)", border: "1px solid rgba(255,255,255,0.05)" }}
                                        onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
                                        onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)")}
                                    >
                                        <span className="text-base shrink-0">{t.emoji}</span>
                                        <div className="min-w-0">
                                            <div className="text-white truncate">{t.name.split("(")[0].trim()}</div>
                                            <div className="text-zinc-600">{t.calories}kcal · {t.protein_g}g P</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Log meal form */}
            <AnimatePresence>
                {formOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-3 pt-2 border-t border-white/[0.05]">
                            <div>
                                <label className="label">Meal Name</label>
                                <input type="text" placeholder="e.g. Post-workout shake" value={name}
                                    onChange={e => setName(e.target.value)} className="field text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                                {[
                                    { label: "Calories (kcal) *", val: calories, set: setCalories, color: "#EF4444" },
                                    { label: "Protein (g)", val: protein, set: setProtein, color: "#22C55E" },
                                    { label: "Carbs (g)", val: carbs, set: setCarbs, color: "#3B82F6" },
                                    { label: "Fats (g)", val: fat, set: setFat, color: "#F59E0B" },
                                ].map(({ label, val, set, color }) => (
                                    <div key={label}>
                                        <label className="label" style={{ color }}>{label}</label>
                                        <input type="number" placeholder="0" value={val}
                                            onChange={e => set(e.target.value)} className="field text-sm" />
                                    </div>
                                ))}
                            </div>
                            {/* Micronutrients */}
                            <details>
                                <summary className="text-xs text-zinc-600 cursor-pointer hover:text-zinc-400 transition-colors">+ Micronutrients (optional)</summary>
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    {[
                                        { label: "Fiber (g)", val: fiber, set: setFiber },
                                        { label: "Sodium (mg)", val: sodium, set: setSodium },
                                        { label: "Sugar (g)", val: sugar, set: setSugar },
                                    ].map(({ label, val, set }) => (
                                        <div key={label}>
                                            <label className="label">{label}</label>
                                            <input type="number" placeholder="0" value={val}
                                                onChange={e => set(e.target.value)} className="field text-sm" />
                                        </div>
                                    ))}
                                </div>
                            </details>
                            <div className="flex gap-2">
                                <button className="btn btn-ghost flex-1 text-sm py-2.5" onClick={() => setFormOpen(false)}>Cancel</button>
                                <button className="btn btn-success flex-1 text-sm py-2.5" onClick={handleSave} disabled={saving || !calories}>
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Flame className="w-4 h-4" /> Log Meal</>}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main action button */}
            {!formOpen && (
                <button onClick={() => { setShowTemplates(false); setFormOpen(true); }}
                    className="btn btn-ghost w-full text-sm gap-2"
                >
                    {saved ? <><CheckCircle className="w-4 h-4 text-[#22C55E]" /> Meal Saved!</> : <><Plus className="w-4 h-4" /> Log a Meal</>}
                </button>
            )}
        </div>
    );
}
