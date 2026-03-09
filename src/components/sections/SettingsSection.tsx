"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut, Save, Check, Scale, Activity, Target, ChevronDown, AlertTriangle } from "lucide-react";
import WearableSync from "@/components/WearableSync";
import PromptCompiler from "@/components/PromptCompiler";
import { upsertOnboarding, getOnboarding, deleteAllUserData } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";

const pageVariants = {
    initial: { opacity: 0, y: 16 },
    enter: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 320, damping: 30, mass: 0.8 } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.18 } },
};

// ── Inline number field with auto-save ────────────────────────────────────────
function EditableField({
    label,
    value,
    unit,
    onSave,
    type = "number",
    min,
    max,
}: {
    label: string;
    value: number | string | undefined | null;
    unit?: string;
    onSave: (v: string) => Promise<void>;
    type?: string;
    min?: number;
    max?: number;
}) {
    const [editing, setEditing] = useState(false);
    const [local, setLocal] = useState(String(value ?? ""));
    const [saved, setSaved] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLocal(String(value ?? ""));
    }, [value]);

    const commit = useCallback(async () => {
        if (local === String(value ?? "")) { setEditing(false); return; }
        await onSave(local);
        setSaved(true);
        setEditing(false);
        setTimeout(() => setSaved(false), 1800);
    }, [local, onSave, value]);

    return (
        <div
            className="flex flex-col gap-1 p-3 rounded-2xl cursor-pointer transition-all duration-200"
            style={{
                background: editing ? "rgba(59,130,246,0.06)" : "var(--bg-elevated)",
                border: editing ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.06)",
            }}
            onClick={() => { if (!editing) { setEditing(true); setTimeout(() => inputRef.current?.focus(), 50); } }}
        >
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{label}</span>
                <AnimatePresence>
                    {saved && (
                        <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1"
                        ><Check className="w-3 h-3" /> Saved</motion.span>
                    )}
                </AnimatePresence>
            </div>
            {editing ? (
                <div className="flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type={type}
                        min={min}
                        max={max}
                        value={local}
                        onChange={e => setLocal(e.target.value)}
                        onBlur={commit}
                        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
                        className="flex-1 bg-transparent text-xl font-bold text-white outline-none min-w-0"
                        style={{ caretColor: "#3B82F6" }}
                    />
                    {unit && <span className="text-sm text-zinc-500 shrink-0">{unit}</span>}
                    <button onClick={commit} className="px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-600/20 text-blue-400 border border-blue-500/30">
                        <Save className="w-3 h-3" />
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-1.5">
                    <span className="text-xl font-bold text-white stat-num">
                        {value != null && value !== "" ? value : <span className="text-zinc-600">—</span>}
                    </span>
                    {unit && value != null && value !== "" && <span className="text-sm text-zinc-500">{unit}</span>}
                    {!value && <span className="text-xs text-zinc-600 italic">tap to set</span>}
                </div>
            )}
        </div>
    );
}

// ── Gender / Goal Selector ────────────────────────────────────────────────────
function OptionsField<T extends string>({
    label,
    value,
    options,
    onSave,
}: {
    label: string;
    value: T | undefined;
    options: { value: T; label: string; emoji: string }[];
    onSave: (v: T) => Promise<void>;
}) {
    const [open, setOpen] = useState(false);
    const [saved, setSaved] = useState(false);

    const handlePick = async (v: T) => {
        await onSave(v);
        setSaved(true);
        setOpen(false);
        setTimeout(() => setSaved(false), 1800);
    };

    const selected = options.find(o => o.value === value);

    return (
        <div className="flex flex-col gap-1">
            <div
                className="flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all"
                style={{ background: "var(--bg-elevated)", border: "1px solid rgba(255,255,255,0.06)" }}
                onClick={() => setOpen(o => !o)}
            >
                <div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-0.5">{label}</div>
                    <div className="text-base font-bold text-white flex items-center gap-1.5">
                        {selected ? <>{selected.emoji} {selected.label}</> : <span className="text-zinc-600 text-sm italic">tap to set</span>}
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    {saved && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-emerald-400 flex items-center gap-0.5"><Check className="w-3 h-3" /> Saved</motion.span>}
                    <ChevronDown className={`w-4 h-4 text-zinc-600 transition-transform ${open ? "rotate-180" : ""}`} />
                </div>
            </div>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="flex flex-wrap gap-1.5 pt-1 pb-1">
                            {options.map(o => (
                                <button key={o.value} onClick={() => handlePick(o.value)}
                                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
                                    style={value === o.value
                                        ? { background: "rgba(59,130,246,0.18)", border: "1px solid rgba(59,130,246,0.4)", color: "#3B82F6" }
                                        : { background: "var(--bg-elevated)", border: "1px solid rgba(255,255,255,0.07)", color: "var(--text-muted)" }
                                    }
                                >{o.emoji} {o.label}</button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function SettingsSection({
    user,
    onboardingData: initialOnboarding,
    setShowOnboarding,
    signOut,
}: {
    user: any;
    onboardingData: any;
    setShowOnboarding: (show: boolean) => void;
    signOut: () => void;
}) {
    const { user: authUser } = useAuth();
    const [data, setData] = useState(initialOnboarding ?? {});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (authUser) {
            getOnboarding(authUser.uid).then(d => { if (d) setData(d); });
        }
    }, [authUser]);

    const save = useCallback(async (patch: Record<string, unknown>) => {
        if (!authUser) return;
        const updated = { ...data, ...patch };
        setData(updated);
        await upsertOnboarding(authUser.uid, patch);
    }, [authUser, data]);

    const bmi = data.weight_kg && data.height_cm
        ? (data.weight_kg / Math.pow(data.height_cm / 100, 2)).toFixed(1)
        : null;

    const bmiCategory = bmi
        ? Number(bmi) < 18.5 ? "Underweight"
            : Number(bmi) < 25 ? "Normal"
                : Number(bmi) < 30 ? "Overweight"
                    : "Obese"
        : null;

    return (
        <motion.div key="settings" variants={pageVariants} initial="initial" animate="enter" exit="exit" className="space-y-5 pb-32 px-1">
            <h1 className="text-3xl font-bold text-white pt-2 tracking-tight">Settings</h1>

            {/* ── Profile Card ── */}
            <div className="card p-5 flex items-center gap-4">
                {user?.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-14 h-14 rounded-full ring-2 ring-white/10" />
                ) : (
                    <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                        <User className="w-7 h-7 text-blue-400" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-white truncate">{user?.displayName || "Athlete"}</h2>
                    <p className="text-sm text-zinc-500 truncate">{user?.email}</p>
                </div>
                {bmi && (
                    <div className="text-center shrink-0">
                        <div className="text-2xl font-bold text-white stat-num">{bmi}</div>
                        <div className="text-[10px] text-zinc-500 font-semibold">{bmiCategory}</div>
                        <div className="text-[9px] text-zinc-600 uppercase tracking-widest">BMI</div>
                    </div>
                )}
            </div>

            {/* ── Body Metrics ── */}
            <div>
                <div className="flex items-center gap-2 mb-3 px-0.5">
                    <Scale className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm font-semibold text-zinc-400 uppercase tracking-widest text-[11px]">Body Metrics</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <EditableField label="Age" value={data.age} unit="y/o" min={10} max={100}
                        onSave={async v => save({ age: parseInt(v) || undefined })} />
                    <EditableField label="Height" value={data.height_cm} unit="cm" min={100} max={250}
                        onSave={async v => save({ height_cm: parseInt(v) || undefined })} />
                    <EditableField label="Weight" value={data.weight_kg} unit="kg" min={30} max={300}
                        onSave={async v => save({ weight_kg: parseFloat(v) || undefined })} />
                    <div />
                </div>
            </div>

            {/* ── Profile & Goals ── */}
            <div>
                <div className="flex items-center gap-2 mb-3 px-0.5">
                    <Target className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm font-semibold text-zinc-400 uppercase tracking-widest text-[11px]">Profile & Goals</span>
                </div>
                <div className="space-y-2">
                    <OptionsField
                        label="Biological Sex"
                        value={data.gender}
                        options={[
                            { value: "male", label: "Male", emoji: "♂️" },
                            { value: "female", label: "Female", emoji: "♀️" },
                            { value: "other", label: "Other", emoji: "⚧️" },
                        ]}
                        onSave={async v => save({ gender: v })}
                    />
                    <OptionsField
                        label="Primary Goal"
                        value={data.primaryGoal}
                        options={[
                            { value: "build_muscle", label: "Build Muscle", emoji: "💪" },
                            { value: "lose_fat", label: "Lose Fat", emoji: "🔥" },
                            { value: "improve_endurance", label: "Endurance", emoji: "🏃" },
                            { value: "general_health", label: "General Health", emoji: "🌿" },
                        ]}
                        onSave={async v => save({ primaryGoal: v })}
                    />
                </div>
            </div>

            {/* ── Nutrition Goals ── */}
            <div>
                <div className="flex items-center gap-2 mb-3 px-0.5">
                    <Activity className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm font-semibold text-zinc-400 uppercase tracking-widest text-[11px]">Daily Nutrition Targets</span>
                </div>
                <div className="card p-4 space-y-2">
                    <p className="text-xs text-zinc-600 mb-3">These targets power your progress bars in the Log section and the AI Prompt Compiler.</p>
                    <div className="grid grid-cols-2 gap-2">
                        <EditableField label="Calories" value={data.goals?.calories} unit="kcal"
                            onSave={async v => save({ goals: { ...data.goals, calories: parseInt(v) || 2000 } })} />
                        <EditableField label="Protein" value={data.goals?.protein_g} unit="g"
                            onSave={async v => save({ goals: { ...data.goals, protein_g: parseInt(v) || 150 } })} />
                        <EditableField label="Carbs" value={data.goals?.carbs_g} unit="g"
                            onSave={async v => save({ goals: { ...data.goals, carbs_g: parseInt(v) || 250 } })} />
                        <EditableField label="Fat" value={data.goals?.fat_g} unit="g"
                            onSave={async v => save({ goals: { ...data.goals, fat_g: parseInt(v) || 80 } })} />
                    </div>
                </div>
            </div>

            {/* ── Wearable Sync ── */}
            <div className="card p-5">
                <WearableSync />
            </div>

            {/* ── AI Coaching Brief ── */}
            <div className="card p-5">
                <PromptCompiler />
            </div>

            {/* ── Sign Out ── */}
            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={signOut}
                className="w-full card p-4 flex items-center justify-center gap-3 text-red-400 font-semibold hover:bg-red-500/[0.06] transition-colors"
            >
                <LogOut className="w-5 h-5" />
                Sign Out
            </motion.button>

            {/* ── Danger Zone ── */}
            <div className="pt-10">
                <div className="flex flex-col items-center justify-center text-center gap-3">
                    <p className="text-xs text-zinc-500">Need to start fresh or leave?</p>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-xs font-semibold text-zinc-400 hover:text-red-400 transition-colors uppercase tracking-widest"
                    >
                        Delete Account Data
                    </button>
                </div>
            </div>

            {/* ── Delete Confirmation Modal ── */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-[#12121a] border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.15)] rounded-3xl w-full max-w-sm overflow-hidden p-6 text-center"
                        >
                            <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                                <AlertTriangle className="w-7 h-7 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Delete Everything?</h3>
                            <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
                                This will permanently erase all your synced workouts, analytics, body metrics, and profile data from the cloud. This action <strong>cannot</strong> be undone.
                            </p>

                            <div className="space-y-3">
                                <button
                                    disabled={isDeleting}
                                    onClick={async () => {
                                        if (!authUser) return;
                                        setIsDeleting(true);
                                        await deleteAllUserData(authUser.uid);
                                        signOut(); // Data cleared, force them to login screen
                                    }}
                                    className="w-full py-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors disabled:opacity-50"
                                >
                                    {isDeleting ? "Erasing..." : "Yes, delete everything"}
                                </button>
                                <button
                                    disabled={isDeleting}
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="w-full py-3.5 rounded-xl bg-zinc-800 text-white font-semibold hover:bg-zinc-700 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </motion.div>
    );
}
