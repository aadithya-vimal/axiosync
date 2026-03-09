"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { addToxinLog, getTodayToxins } from "@/lib/firestore";
import { Cigarette, Wine, Plus, CheckCircle } from "lucide-react";

type ToxinType = "smoking" | "alcohol";

export default function ToxinLogger({ onUpdate }: { onUpdate?: () => void }) {
    const { user } = useAuth();
    const [selected, setSelected] = useState<ToxinType>("smoking");
    const [quantity, setQuantity] = useState(1);
    const [logged, setLogged] = useState(false);
    const [todaySummary, setTodaySummary] = useState({ hasSmoking: false, hasAlcohol: false, smokingCount: 0, alcoholUnits: 0 });

    useEffect(() => {
        if (!user) return;
        getTodayToxins(user.uid).then(setTodaySummary);
    }, [user, logged]);

    const handleLog = async () => {
        if (!user) return;
        await addToxinLog(user.uid, {
            type: selected,
            quantity,
            unit: selected === "smoking" ? "cigarettes" : "units",
        });
        setLogged(true);
        onUpdate?.();
        setTimeout(() => setLogged(false), 1500);
    };

    const risk = (count: number, threshold: number) =>
        count === 0 ? { label: "None", color: "#10b981" } :
            count < threshold ? { label: "Moderate", color: "#f59e0b" } :
                { label: "High", color: "#ef4444" };

    const smokingRisk = risk(todaySummary.smokingCount, 10);
    const alcoholRisk = risk(todaySummary.alcoholUnits, 4);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                {[
                    { type: "smoking" as ToxinType, icon: Cigarette, count: todaySummary.smokingCount, unit: "cig", risk: smokingRisk },
                    { type: "alcohol" as ToxinType, icon: Wine, count: todaySummary.alcoholUnits, unit: "units", risk: alcoholRisk },
                ].map(({ type, icon: Icon, count, unit, risk: r }) => (
                    <div key={type} className={`card p-3 ${count > 0 ? "border-white/15" : ""}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-4 h-4 text-slate-400" />
                            <span className="text-xs text-slate-400 capitalize">{type}</span>
                        </div>
                        <div className="text-2xl font-bold text-white stat-num">{count}</div>
                        <div className="text-xs mt-0.5 font-medium" style={{ color: r.color }}>{r.label}</div>
                    </div>
                ))}
            </div>

            <div className="card p-4 space-y-3">
                <div className="flex gap-2">
                    {(["smoking", "alcohol"] as ToxinType[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setSelected(t)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all border ${selected === t ? "bg-white/8 border-white/20 text-white" : "border-white/6 text-slate-500 hover:text-white"
                                }`}
                        >
                            {t === "smoking" ? <Cigarette className="w-4 h-4" /> : <Wine className="w-4 h-4" />}
                            {t === "smoking" ? "Smoking" : "Alcohol"}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4 justify-center py-2">
                    <button onClick={() => setQuantity(Math.max(0.5, quantity - (selected === "alcohol" ? 0.5 : 1)))} className="w-9 h-9 rounded-lg bg-white/8 hover:bg-white/15 text-white transition-colors text-lg font-bold">−</button>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-white stat-num">{quantity}</div>
                        <div className="text-xs text-slate-500">{selected === "smoking" ? "cigarettes" : "units"}</div>
                    </div>
                    <button onClick={() => setQuantity(quantity + (selected === "alcohol" ? 0.5 : 1))} className="w-9 h-9 rounded-lg bg-white/8 hover:bg-white/15 text-white transition-colors text-lg font-bold">+</button>
                </div>

                <button onClick={handleLog} className={`btn w-full ${logged ? "btn-ghost text-emerald-400" : "btn-danger"}`}>
                    {logged ? <><CheckCircle className="w-4 h-4" /> Logged to body map</> : <><Plus className="w-4 h-4" /> Log Exposure</>}
                </button>
            </div>
        </div>
    );
}
