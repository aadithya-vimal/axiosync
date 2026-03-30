import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { 
    addBodyMetric, getBodyMetrics, BodyMetric, 
    getRecentActivities, getRecentWorkouts, getOnboarding,
    getSleepLogs, getNutritionLogs, getSupplementLogs,
    SleepLog, NutritionLog, SupplementLog
} from "@/lib/firestore";
import { format, startOfWeek, addDays, isSameDay, subDays, startOfDay } from "date-fns";
import { Flame, Clock, Award, Edit2, Loader2, Moon, Utensils, Pill } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, BarChart, Bar } from "recharts";

export default function BodyMetrics() {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState<BodyMetric[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [workouts, setWorkouts] = useState<any[]>([]);
    const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
    const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
    const [supplementLogs, setSupplementLogs] = useState<SupplementLog[]>([]);
    const [loading, setLoading] = useState(true);

    const [loggingWeight, setLoggingWeight] = useState(false);
    const [weight, setWeight] = useState(70);
    const [height, setHeight] = useState(170);

    useEffect(() => {
        if (!user) return;
        
        const loadData = async () => {
            setLoading(true);
            try {
                const [metricsData, actData, workData, sleepData, nutritionData, supplementData] = await Promise.all([
                    getBodyMetrics(user.uid, 30),
                    getRecentActivities(user.uid, 50),
                    getRecentWorkouts(user.uid, 50),
                    getSleepLogs(user.uid, 7),
                    getNutritionLogs(user.uid, 7),
                    getSupplementLogs(user.uid, 7)
                ]);
                
                let finalMetrics = metricsData;
                if (finalMetrics.length === 0) {
                    const ob = await getOnboarding(user.uid);
                    if (ob?.weight_kg && ob?.height_cm) {
                        await addBodyMetric(user.uid, ob.weight_kg, ob.height_cm, false);
                        finalMetrics = await getBodyMetrics(user.uid, 1);
                    }
                }

                setMetrics(finalMetrics.reverse());
                if (finalMetrics.length > 0) {
                    const latest = finalMetrics[finalMetrics.length - 1];
                    setWeight(latest.weight_kg);
                    setHeight(latest.height_cm);
                }

                setActivities(actData);
                setWorkouts(workData);
                setSleepLogs(sleepData.reverse());
                setNutritionLogs(nutritionData.reverse());
                setSupplementLogs(supplementData.reverse());
            } catch (e) {
                console.error("Error loading metrics:", e);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user, loggingWeight]);

    const handleSaveMetric = async () => {
        if (!user) return;
        await addBodyMetric(user.uid, weight, height);
        setLoggingWeight(false);
    };

    const weightData = useMemo(() => {
        return metrics.map(m => ({
            date: format(m.timestamp.toDate(), "MMM dd"),
            weight: m.weight_kg,
            height: m.height_cm,
        }));
    }, [metrics]);

    const sleepData = useMemo(() => {
        return sleepLogs.map(s => ({
            date: format(s.sleep_start.toDate(), "MMM dd"),
            hours: s.duration_hours,
            quality: s.quality_score,
        }));
    }, [sleepLogs]);

    const nutritionData = useMemo(() => {
        const days: Record<string, { calories: number; protein: number }> = {};
        nutritionLogs.forEach(n => {
            const d = format(n.timestamp.toDate(), "MMM dd");
            if (!days[d]) days[d] = { calories: 0, protein: 0 };
            days[d].calories += n.calories;
            days[d].protein += n.protein_g;
        });
        return Object.entries(days).map(([date, vals]) => ({ date, ...vals }));
    }, [nutritionLogs]);

    const supplementData = useMemo(() => {
        const days: Record<string, number> = {};
        supplementLogs.forEach(s => {
            const d = format(s.timestamp.toDate(), "MMM dd");
            days[d] = (days[d] || 0) + 1;
        });
        return Object.entries(days).map(([date, count]) => ({ date, count }));
    }, [supplementLogs]);

    const currentWeight = metrics.length > 0 ? metrics[metrics.length - 1].weight_kg : 0;
    const bmi = height > 0 ? currentWeight / Math.pow(height / 100, 2) : 0;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-[#0A84FF]" />
                <p className="text-sm text-[var(--text-muted)]">Synchronizing biometrics…</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-32">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] px-2 tracking-tight">Metrics</h1>

            {/* Weight & BMI Quick View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card p-5">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-sm text-[var(--text-muted)] font-medium">Weight</span>
                        <button onClick={() => setLoggingWeight(true)} className="text-[#0A84FF] text-xs font-bold flex items-center gap-1">
                            <Edit2 className="w-3 h-3" /> Log
                        </button>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold stat-num text-[var(--text-primary)]">{currentWeight.toFixed(1)}</span>
                        <span className="text-lg font-bold text-[var(--text-muted)]">kg</span>
                    </div>
                    <div className="mt-4 h-28">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={weightData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                                <defs>
                                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0A84FF" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#0A84FF" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Tooltip 
                                    contentStyle={{ background: "#12121a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "10px" }}
                                    itemStyle={{ color: "#0A84FF" }}
                                    labelStyle={{ color: "var(--text-muted)" }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="weight" 
                                    stroke="#0A84FF" 
                                    fillOpacity={1} 
                                    fill="url(#colorWeight)" 
                                    strokeWidth={3} 
                                    dot={{ fill: '#0A84FF', stroke: '#000', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, stroke: '#000', strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card p-5">
                    <span className="text-sm text-[var(--text-muted)] font-medium">BMI</span>
                    <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-3xl font-bold stat-num text-[var(--text-primary)]">{bmi.toFixed(1)}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 font-bold ml-2">Normal</span>
                    </div>
                    <div className="mt-6">
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                            <div className="h-full bg-blue-400" style={{ width: '18%' }} />
                            <div className="h-full bg-green-400" style={{ width: '32%' }} />
                            <div className="h-full bg-yellow-400" style={{ width: '25%' }} />
                            <div className="h-full bg-red-400" style={{ width: '25%' }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1 font-bold">
                            <span>15</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sleep Chart */}
            <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <Moon className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">Sleep Duration</h3>
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Last 7 Sessions</p>
                    </div>
                </div>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sleepData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                            <Tooltip 
                                contentStyle={{ background: "#12121a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                                itemStyle={{ color: "#818cf8" }}
                            />
                            <Bar dataKey="hours" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Nutrition Chart */}
            <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Utensils className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">Calorie Intake</h3>
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Daily Trends</p>
                    </div>
                </div>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={nutritionData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                            <Tooltip 
                                contentStyle={{ background: "#12121a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                                itemStyle={{ color: "#10b981" }}
                            />
                            <Line type="monotone" dataKey="calories" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Supplement Chart */}
            <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                        <Pill className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">Supplement Consistency</h3>
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Daily Frequency</p>
                    </div>
                </div>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={supplementData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} allowDecimals={false} />
                            <Tooltip 
                                contentStyle={{ background: "#12121a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                                itemStyle={{ color: "#f97316" }}
                            />
                            <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Log Weight Modal/Section Overlay */}
            {loggingWeight && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card w-full max-w-md p-6 space-y-4">
                        <h3 className="text-xl font-bold text-[var(--text-primary)]">Log Metrics</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-1 block">Weight (kg)</label>
                                <input type="number" step="0.1" value={weight} onChange={e => setWeight(parseFloat(e.target.value))} className="field w-full" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-1 block">Height (cm)</label>
                                <input type="number" step="0.1" value={height} onChange={e => setHeight(parseFloat(e.target.value))} className="field w-full" />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setLoggingWeight(false)} className="btn btn-ghost flex-1">Cancel</button>
                            <button onClick={handleSaveMetric} className="btn btn-primary flex-1">Save Record</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
