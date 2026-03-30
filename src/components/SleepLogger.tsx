"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { addSleepLog, getTodaySleepLogs, deleteSleepLog, SleepLog } from "@/lib/firestore";
import { Timestamp } from "firebase/firestore";
import { Moon, CheckCircle, Plus, Trash2, Loader2, Clock, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SleepLogger({ onRefresh }: { onRefresh?: () => Promise<void> }) {
    const { user } = useAuth();
    const [wakeTime, setWakeTime] = useState("07:00");
    const [sleepTime, setSleepTime] = useState("23:00");
    const [quality, setQuality] = useState(7);
    const [logged, setLogged] = useState(false);
    const [logs, setLogs] = useState<SleepLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchLogs = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getTodaySleepLogs(user.uid);
            setLogs(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const durationHours = (() => {
        const [wH, wM] = wakeTime.split(":").map(Number);
        const [sH, sM] = sleepTime.split(":").map(Number);
        let dur = (wH * 60 + wM) - (sH * 60 + sM);
        if (dur < 0) dur += 24 * 60;
        return +(dur / 60).toFixed(1);
    })();

    const handleLog = async () => {
        if (!user || saving) return;
        setSaving(true);
        const today = new Date();
        const [wH, wM] = wakeTime.split(":").map(Number);
        const [sH, sM] = sleepTime.split(":").map(Number);
        const wake = new Date(today); wake.setHours(wH, wM, 0, 0);
        const sleep = new Date(today); 
        if (durationHours > 0) {
            // If duration calculation assumes it started yesterday
            sleep.setDate(sleep.getDate() - ( (wH * 60 + wM) < (sH * 60 + sM) ? 1 : 0 ));
        }
        sleep.setHours(sH, sM, 0, 0);
        
        try {
            const logData = {
                sleep_start: Timestamp.fromDate(sleep),
                sleep_end: Timestamp.fromDate(wake),
                duration_hours: durationHours,
                quality_score: quality,
                wake_time: wakeTime,
                sleep_time: sleepTime,
            };
            await addSleepLog(user.uid, logData);
            setLogged(true);
            if (onRefresh) await onRefresh();
            fetchLogs();
            setTimeout(() => setLogged(false), 2000);
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!user) return;
        try {
            await deleteSleepLog(user.uid, id);
            setLogs(prev => prev.filter(l => l.id !== id));
            if (onRefresh) await onRefresh();
        } catch (e) {
            console.error(e);
        }
    };

    const qualityMap = ["", "Terrible", "Bad", "Poor", "Below avg", "Average", "Okay", "Good", "Great", "Excellent", "Perfect"];
    const getQualityColor = (q: number) => q >= 8 ? "#10b981" : q >= 6 ? "#f59e0b" : "#ef4444";

    return (
        <div className="space-y-4">
            {/* Input Form */}
            <div className="grid grid-cols-2 gap-3">
                <div className="card p-3">
                    <label className="label">Fell asleep</label>
                    <input type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} className="field mt-1 text-base font-semibold" />
                </div>
                <div className="card p-3">
                    <label className="label">Woke up</label>
                    <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} className="field mt-1 text-base font-semibold" />
                </div>
            </div>

            <div className="card p-3">
                <div className="flex justify-between mb-2">
                    <span className="label">Sleep Quality</span>
                    <span className="text-sm font-semibold" style={{ color: getQualityColor(quality) }}>
                        {qualityMap[quality]} ({quality}/10)
                    </span>
                </div>
                <input type="range" min={1} max={10} value={quality} onChange={(e) => setQuality(parseInt(e.target.value))} className="w-full" />
            </div>

            <div className="card p-3 flex items-center justify-center gap-3">
                <Moon className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-[var(--text-primary)] stat-num">{durationHours}h</span>
                <span className="text-[var(--text-muted)] text-sm">of recovery</span>
                <span className={`badge text-xs ${durationHours >= 7.5 ? "badge-green" : durationHours >= 6 ? "badge-amber" : "badge-red"}`}>
                    {durationHours >= 7.5 ? "Optimal" : durationHours >= 6 ? "Fair" : "Insufficient"}
                </span>
            </div>

            <button onClick={handleLog} disabled={saving} className={`btn w-full ${logged ? "btn-ghost text-emerald-400" : "btn-primary"}`}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : logged ? <><CheckCircle className="w-4 h-4" /> Logged!</> : <><Plus className="w-4 h-4" /> Log Sleep</>}
            </button>

            {/* Logs List */}
            <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Recent Sleep</h3>
                    {loading && <Loader2 className="w-3 h-3 animate-spin text-[var(--text-muted)]" />}
                </div>
                
                <AnimatePresence initial={false}>
                    {logs.map((log) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="card p-3 flex items-center justify-between group overflow-hidden"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                    <Moon className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-[var(--text-primary)]">{log.duration_hours}h Sleep</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase" style={{ background: `${getQualityColor(log.quality_score)}20`, color: getQualityColor(log.quality_score) }}>
                                            {log.quality_score}/10
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                                        <Clock className="w-2.5 h-2.5" />
                                        {log.sleep_time} – {log.wake_time}
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => log.id && handleDelete(log.id)}
                                className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {!loading && logs.length === 0 && (
                    <div className="text-center py-6 border border-dashed border-white/10 rounded-2xl text-[var(--text-muted)] text-xs">
                        No sleep logs for this period.
                    </div>
                )}
            </div>
        </div>
    );
}
