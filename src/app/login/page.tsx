"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, Apple, Dumbbell, LineChart, Home, Smartphone } from "lucide-react";
import Image from "next/image";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";

export default function LoginPage() {
    const { user, loading, signIn } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) router.push("/");
    }, [user, loading, router]);

    const features = [
        { title: "AI Powered Workout Plans", icon: Zap, text: "Get personalized workout routines that adapt to your progress and goals using advanced artificial intelligence technology." },
        { title: "Smart Food & Nutrition Tracking", icon: Apple, text: "Track meals effortlessly with AI-powered photo recognition — simply take a picture and get instant macro and calorie calculations." },
        { title: "Accurate Anatomical Library", icon: Dumbbell, text: "Learn proper form with our comprehensive library of front & back muscle visualizations and step-by-step instructions." },
        { title: "Progress Tracking & Analytics", icon: LineChart, text: "Monitor your fitness journey with detailed charts, progress metrics, and personalized insights to optimize your training." },
        { title: "Home & Gym Workout Programs", icon: Home, text: "Access customized workout routines optimized for any environment — whether training at home, the gym, or while travelling." },
        { title: "Cross-Platform Ecosystem", icon: Smartphone, text: "Track workouts seamlessly with PWA integration, offline support and instant data syncing across all your devices." },
    ];

    return (
        <div className="min-h-screen bg-[#0A0E17] text-white flex flex-col overflow-x-hidden">
            {/* ── NAV ── */}
            <MarketingHeader />

            {/* ── HERO ── */}
            <main className="flex-1 w-full relative z-10">
                {/* Full-width Background Elements */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)]" />
                    <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] rounded-full blur-[160px] bg-blue-600/10" />
                    <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full blur-[140px] bg-indigo-600/10" />
                    
                    {/* Floating blurred particles at the edges */}
                    <motion.div 
                        animate={{ y: [0, 40, 0], opacity: [0.1, 0.2, 0.1] }}
                        transition={{ duration: 8, repeat: Infinity }}
                        className="absolute left-[5%] top-[20%] w-32 h-32 bg-blue-500 rounded-full blur-[80px]" 
                    />
                    <motion.div 
                        animate={{ y: [0, -40, 0], opacity: [0.1, 0.2, 0.1] }}
                        transition={{ duration: 10, repeat: Infinity }}
                        className="absolute right-[8%] bottom-[30%] w-48 h-48 bg-purple-500 rounded-full blur-[100px]" 
                    />
                </div>

                {/* Left Side Label (Vertical) */}
                <div className="hidden xl:flex absolute left-8 top-1/2 -translate-y-1/2 flex-col items-center gap-6 opacity-20 hover:opacity-100 transition-opacity">
                    <div className="w-[1px] h-32 bg-gradient-to-b from-transparent via-white to-transparent" />
                    <span className="text-[10px] font-black tracking-[0.4em] uppercase text-white [writing-mode:vertical-lr] rotate-180">
                        AXIO ECOSYSTEM v2.0
                    </span>
                </div>

                {/* Right Side Indicator (Vertical) */}
                <div className="hidden xl:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col items-center gap-6 opacity-20 hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-black tracking-[0.4em] uppercase text-white [writing-mode:vertical-lr]">
                        SCROLL TO EXPLORE
                    </span>
                    <div className="w-[1px] h-32 bg-gradient-to-b from-transparent via-white to-transparent" />
                </div>

                <div className="max-w-7xl mx-auto px-6 pt-12 lg:pt-24 pb-32 flex flex-col lg:flex-row items-center justify-between gap-16">
                    {/* Left — text */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="flex-1 text-center lg:text-left relative"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-wide mb-8">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            POWERED BY ADVANCED AI
                        </div>
                        <h1 className="text-6xl sm:text-7xl xl:text-9xl font-black leading-[0.85] tracking-tighter mb-10">
                            TRAIN <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-400 to-violet-500">SMARTER</span><br /> 
                            NOT HARDER.
                        </h1>
                        <p className="text-zinc-400 text-lg sm:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0 mb-12 font-medium">
                            The ultimate AI-driven fitness ecosystem. Get hyper-personalized workouts, instant nutrition tracking, and real-time anatomical insights.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6">
                            <button
                                onClick={signIn}
                                disabled={loading}
                                className="group w-full sm:w-auto flex items-center justify-center gap-3 bg-white text-black hover:bg-zinc-200 px-12 py-5 rounded-2xl font-bold tracking-tight transition-all active:scale-95 disabled:opacity-50 shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
                            >
                                Get Started Free
                                <Zap className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
                            </button>
                            <button
                                onClick={signIn}
                                className="w-full sm:w-auto border border-white/10 hover:border-white/25 hover:bg-white/5 px-10 py-5 rounded-2xl font-bold text-white transition-all active:scale-95 flex items-center justify-center gap-3"
                            >
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                    <span className="ml-1 text-[10px]">▶</span>
                                </div>
                                Watch Demo
                            </button>
                        </div>

                        {/* Stats Floating Slightly Left */}
                        <div className="mt-20 flex items-center justify-center lg:justify-start gap-12 border-t border-white/5 pt-10">
                            {[["4M+", "Sessions"], ["6M+", "Workouts"], ["1M+", "Tracked"]].map(([val, lbl]) => (
                                <div key={lbl} className="group cursor-default">
                                    <div className="text-3xl font-black text-white group-hover:text-blue-500 transition-colors">{val}</div>
                                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mt-1">{lbl}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right — phone mockup */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, x: 40 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="shrink-0 w-[300px] sm:w-[360px] lg:w-[420px] hidden sm:block relative perspective-1000"
                    >
                        {/* More Floating elements pushed further out */}
                        <motion.div 
                            animate={{ y: [0, -15, 0], x: [-5, 5, -5] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -left-24 top-10 z-20 bg-white/5 backdrop-blur-2xl border border-white/10 p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex items-center gap-4 group hover:bg-white/10 transition-colors cursor-default"
                        >
                            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:rotate-12 transition-transform">
                                <Zap className="w-7 h-7 text-white fill-current" />
                            </div>
                            <div>
                                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Live Activity</div>
                                <div className="text-lg font-black text-white">+248 kcal</div>
                            </div>
                        </motion.div>

                        <motion.div 
                            animate={{ y: [0, 15, 0], x: [5, -5, 5] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                            className="absolute -right-28 top-1/2 z-20 bg-white/5 backdrop-blur-2xl border border-white/10 p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex items-center gap-4 group hover:bg-white/10 transition-colors cursor-default"
                        >
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:-rotate-12 transition-transform">
                                <Dumbbell className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">New Goal</div>
                                <div className="text-lg font-black text-white">120kg Squat</div>
                            </div>
                        </motion.div>

                        <motion.div 
                            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }}
                            transition={{ duration: 6, repeat: Infinity }}
                            className="absolute -left-10 bottom-10 z-20 bg-blue-500/10 backdrop-blur-md border border-blue-500/20 px-4 py-2 rounded-full flex items-center gap-2"
                        >
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">AI Engine Active</span>
                        </motion.div>

                        {/* Phone frame */}
                        <div className="w-full aspect-[9/18.5] bg-zinc-800 rounded-[3.5rem] p-3 shadow-[0_0_120px_rgba(59,130,246,0.2)] ring-1 ring-white/20 relative">
                            <div className="w-full h-full bg-[#05070A] rounded-[3rem] overflow-hidden flex flex-col relative border border-white/5">
                                {/* Notch */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-8 bg-black rounded-b-3xl z-30" />

                                {/* Screen content */}
                                <div className="flex-1 flex flex-col pt-14">
                                    <div className="px-8 mb-8">
                                        <div className="text-[11px] font-bold text-blue-500 uppercase tracking-[0.2em] mb-2">Workout in Progress</div>
                                        <div className="text-3xl font-black text-white tracking-tight">Full Body AI</div>
                                    </div>

                                    <div className="flex-1 px-5 space-y-5">
                                        {/* Exercise Card */}
                                        <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
                                            <div className="flex justify-between items-start mb-5">
                                                <div>
                                                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Current Exercise</div>
                                                    <div className="text-base font-bold text-white leading-tight tracking-tight">Incline Dumbbell<br />Bench Press</div>
                                                </div>
                                                <div className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-blue-500/30">SET 3/4</div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-black/40 rounded-2xl p-4 border border-white/5 text-center group-hover:bg-black/60 transition-colors">
                                                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Weight</div>
                                                    <div className="text-xl font-black text-white">32<span className="text-xs text-zinc-500 ml-1 font-bold">kg</span></div>
                                                </div>
                                                <div className="bg-black/40 rounded-2xl p-4 border border-white/5 text-center group-hover:bg-black/60 transition-colors">
                                                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Reps</div>
                                                    <div className="text-xl font-black text-white">12</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-3xl p-5">
                                                <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center mb-4">
                                                    <div className="w-5 h-5 text-pink-500">♥</div>
                                                </div>
                                                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Heart Rate</div>
                                                <div className="text-2xl font-black text-white tracking-tighter">142<span className="text-xs text-zinc-500 ml-1">bpm</span></div>
                                            </div>
                                            <div className="bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-3xl p-5">
                                                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center mb-4">
                                                    <div className="w-5 h-5 text-yellow-500">⚡</div>
                                                </div>
                                                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Intensity</div>
                                                <div className="text-2xl font-black text-white tracking-tighter">85<span className="text-xs text-zinc-500 ml-1">%</span></div>
                                            </div>
                                        </div>

                                        {/* Mini Chart */}
                                        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex-1 min-h-[120px] flex flex-col">
                                            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-6">Volume Progression</div>
                                            <div className="flex-1 flex items-end justify-between gap-1.5">
                                                {[40, 60, 45, 70, 55, 80, 65, 90, 75, 95].map((h, i) => (
                                                    <motion.div 
                                                        key={i}
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${h}%` }}
                                                        transition={{ delay: 1 + (i * 0.15), duration: 1.5, ease: "circOut" }}
                                                        className="flex-1 bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-sm"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Action */}
                                    <div className="p-5 bg-gradient-to-t from-black to-transparent">
                                        <div className="w-full py-5 bg-blue-600 rounded-2xl flex items-center justify-center gap-3 shadow-[0_15px_30px_rgba(37,99,235,0.4)]">
                                            <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                                            <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Complete Set</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>

            {/* ── FEATURES GRID ── */}
            <section className="w-full py-32 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)] pointer-events-none" />
                
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight">
                            ENGINEERED FOR <span className="text-blue-500">PERFORMANCE</span>
                        </h2>
                        <p className="text-zinc-500 max-w-2xl mx-auto text-lg font-medium">
                            Everything you need to train smarter, eat better, and track your progress — all in one unified platform.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -8 }}
                                className="group relative bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]" />
                                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <f.icon className="w-7 h-7 text-blue-400 relative z-10" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{f.title}</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed font-medium">{f.text}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <MarketingFooter />
        </div>
    );
}
