"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { addSleepLog } from "@/lib/firestore";
import { Timestamp } from "firebase/firestore";
import { Moon, CheckCircle, Plus } from "lucide-react";

export default function SleepLogger() {
    const { user } = useAuth();
    const [wakeTime, setWakeTime] = useState("07:00");
    const [sleepTime, setSleepTime] = useState("23:00");
    const [quality, setQuality] = useState(7);
    const [logged, setLogged] = useState(false);

    const durationHours = (() => {
        const [wH, wM] = wakeTime.split(":").map(Number);
        const [sH, sM] = sleepTime.split(":").map(Number);
        let dur = (wH * 60 + wM) - (sH * 60 + sM);
        if (dur < 0) dur += 24 * 60;
        return +(dur / 60).toFixed(1);
    })();

    const handleLog = async () => {
        if (!user) return;
        const today = new Date();
        const [wH, wM] = wakeTime.split(":").map(Number);
        const [sH, sM] = sleepTime.split(":").map(Number);
        const wake = new Date(today); wake.setHours(wH, wM, 0, 0);
        const sleep = new Date(today); sleep.setDate(sleep.getDate() - 1); sleep.setHours(sH, sM, 0, 0);
        await addSleepLog(user.uid, {
            sleep_start: Timestamp.fromDate(sleep),
            sleep_end: Timestamp.fromDate(wake),
            duration_hours: durationHours,
            quality_score: quality,
            wake_time: wakeTime,
            sleep_time: sleepTime,
        });
        setLogged(true);
        setTimeout(() => setLogged(false), 2000);
    };

    const qualityMap = ["", "Terrible", "Bad", "Poor", "Below avg", "Average", "Okay", "Good", "Great", "Excellent", "Perfect"];

    return (
        <div className="space-y-4">
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
                    <span className="text-sm font-semibold" style={{ color: quality >= 7 ? "#10b981" : quality >= 5 ? "#f59e0b" : "#ef4444" }}>
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

            <button onClick={handleLog} className={`btn w-full ${logged ? "btn-ghost text-emerald-400" : "btn-primary"}`}>
                {logged ? <><CheckCircle className="w-4 h-4" /> Logged!</> : <><Plus className="w-4 h-4" /> Log Sleep</>}
            </button>
        </div>
    );
}
