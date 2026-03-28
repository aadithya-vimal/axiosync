"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, Apple, Dumbbell, LineChart, Home, Smartphone } from "lucide-react";
import Image from "next/image";

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
            <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-30 relative">
                <div className="flex items-center gap-3">
                    <Image src="/icon.png" alt="Axiosync" width={32} height={32} className="rounded-xl border border-white/10" />
                    <span className="text-xl font-bold tracking-tight">Axiosync</span>
                </div>
                <div className="hidden sm:flex items-center gap-8">
                    <button onClick={signIn} className="text-zinc-400 hover:text-white transition-colors text-sm font-medium">
                        Exercise Library
                    </button>
                    <button onClick={signIn} className="text-zinc-400 hover:text-white transition-colors text-sm font-medium">
                        Tools
                    </button>
                    <button
                        onClick={signIn}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 rounded-full font-semibold text-sm shadow-lg shadow-blue-500/20 hover:opacity-90 active:scale-95 transition-all"
                    >
                        Sign In
                    </button>
                </div>
            </header>

            {/* ── HERO ── */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-6 pt-12 lg:pt-20 pb-24 flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">

                {/* Ambient Glows */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
                    <div className="absolute top-[10%] right-[5%] w-[500px] h-[500px] rounded-full blur-[140px] bg-blue-700/15" />
                    <div className="absolute bottom-[0%] left-[0%] w-[400px] h-[400px] rounded-full blur-[120px] bg-indigo-700/10" />
                </div>

                {/* Left — text */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.75 }}
                    className="flex-1 text-center lg:text-left"
                >
                    <h1 className="text-5xl sm:text-6xl xl:text-7xl font-bold leading-[1.12] tracking-tight mb-6">
                        Your AI<br className="hidden md:block" /> Personal Trainer
                    </h1>
                    <p className="text-zinc-400 text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 mb-10">
                        Get personalized workouts, AI-powered food tracking, and anatomical exercise demonstrations — all at a fraction of the cost of a human trainer.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                        <button
                            onClick={signIn}
                            disabled={loading}
                            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 px-8 py-4 rounded-2xl font-bold tracking-wide shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#ddd" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#eee" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#ccc" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </button>
                        <button
                            onClick={signIn}
                            className="w-full sm:w-auto border border-white/10 hover:border-white/25 hover:bg-white/5 px-8 py-4 rounded-2xl font-semibold text-zinc-300 transition-all active:scale-95"
                        >
                            View Exercise Library
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="mt-14 flex items-center justify-center lg:justify-start gap-10 border-t border-white/5 pt-8">
                        {[["4M+", "Sessions"], ["6M+", "Workouts Logged"], ["1M+", "Foods Tracked"]].map(([val, lbl]) => (
                            <div key={lbl}>
                                <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{val}</div>
                                <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mt-0.5">{lbl}</div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Right — phone mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: [0, -10, 0] }}
                    transition={{ opacity: { duration: 0.8 }, y: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
                    className="shrink-0 w-[280px] sm:w-[310px] lg:w-[320px] hidden sm:block"
                >
                    {/* Phone frame */}
                    <div className="w-full aspect-[9/19] bg-gradient-to-b from-zinc-700 to-zinc-900 rounded-[44px] p-[3px] shadow-2xl shadow-blue-500/10 ring-1 ring-white/10">
                        <div className="w-full h-full bg-[#0A0E17] rounded-[42px] overflow-hidden flex flex-col relative">
                            {/* Notch */}
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-30" />

                            {/* Screen header */}
                            <div className="flex items-center justify-between px-5 pt-14 pb-3 z-20">
                                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                    <span className="text-xs">↩</span>
                                </div>
                                <span className="text-sm font-semibold text-white/80">Generate Plan</span>
                                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10" />
                            </div>

                            {/* Muscle group pills */}
                            <div className="flex flex-wrap gap-1.5 px-4 pb-2">
                                {[
                                    { label: "Chest", color: "#3B82F6" },
                                    { label: "Back", color: "#A855F7" },
                                    { label: "Core", color: "#F59E0B" },
                                    { label: "Legs", color: "#22C55E" },
                                ].map(m => (
                                    <div key={m.label} className="px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${m.color}25`, color: m.color, border: `1px solid ${m.color}50` }}>
                                        {m.label}
                                    </div>
                                ))}
                            </div>

                            {/* Body map area */}
                            <div className="flex-1 relative flex items-center justify-center px-4 overflow-hidden">
                                {/* Decorative schematic figure */}
                                <svg viewBox="0 0 160 300" className="w-full max-h-[280px] opacity-70">
                                    {/* Head */}
                                    <ellipse cx="80" cy="22" rx="16" ry="20" fill="none" stroke="#3B82F6" strokeWidth="1.5" />
                                    {/* Neck */}
                                    <line x1="80" y1="42" x2="80" y2="55" stroke="#3B82F6" strokeWidth="1.5" />
                                    {/* Shoulders */}
                                    <path d="M40 70 Q80 55 120 70" fill="none" stroke="#3B82F6" strokeWidth="1.5" />
                                    {/* Chest/torso */}
                                    <path d="M48 75 L112 75 L106 140 Q80 158 54 140 Z" fill="#3B82F650" stroke="#3B82F6" strokeWidth="1.2" />
                                    {/* Core */}
                                    <rect x="58" y="140" width="44" height="38" rx="5" fill="#F59E0B40" stroke="#F59E0B" strokeWidth="1.2" />
                                    {/* Arms */}
                                    <line x1="48" y1="80" x2="28" y2="140" stroke="#A855F760" strokeWidth="5" strokeLinecap="round" />
                                    <line x1="112" y1="80" x2="132" y2="140" stroke="#A855F760" strokeWidth="5" strokeLinecap="round" />
                                    {/* Forearms */}
                                    <line x1="28" y1="140" x2="22" y2="195" stroke="#A855F640" strokeWidth="4" strokeLinecap="round" />
                                    <line x1="132" y1="140" x2="138" y2="195" stroke="#A855F640" strokeWidth="4" strokeLinecap="round" />
                                    {/* Legs */}
                                    <line x1="66" y1="178" x2="56" y2="258" stroke="#22C55E70" strokeWidth="6" strokeLinecap="round" />
                                    <line x1="94" y1="178" x2="104" y2="258" stroke="#22C55E70" strokeWidth="6" strokeLinecap="round" />
                                    {/* Calves */}
                                    <line x1="56" y1="260" x2="60" y2="295" stroke="#22C55E50" strokeWidth="5" strokeLinecap="round" />
                                    <line x1="104" y1="260" x2="100" y2="295" stroke="#22C55E50" strokeWidth="5" strokeLinecap="round" />
                                    {/* Joints */}
                                    {[[28,140],[132,140],[56,258],[104,258]].map(([x,y],i) => (
                                        <circle key={i} cx={x} cy={y} r="4" fill="#0A0E17" stroke="#3B82F6" strokeWidth="1.5" />
                                    ))}
                                </svg>
                            </div>

                            {/* CTA button */}
                            <div className="p-4">
                                <div className="w-full h-13 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center py-3.5 shadow-lg shadow-blue-600/30">
                                    <span className="text-sm font-bold">▶ Generate Routine</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>

            {/* ── FEATURES GRID ── */}
            <section className="w-full border-t border-white/5 bg-white/[0.015] py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 tracking-tight">
                        Axiosync Features: Your Complete Fitness Solution
                    </h2>
                    <p className="text-zinc-500 text-center mb-14 max-w-xl mx-auto text-sm">
                        Everything you need to train smarter, eat better, and track your progress — all in one platform.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                                className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-7 hover:bg-white/[0.04] transition-colors group"
                            >
                                <div className="w-11 h-11 bg-blue-500/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-blue-500/20 transition-colors">
                                    <f.icon className="w-5 h-5 text-blue-400" />
                                </div>
                                <h3 className="text-base font-bold text-zinc-100 mb-2">{f.title}</h3>
                                <p className="text-zinc-500 text-sm leading-relaxed">{f.text}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SIGN IN FOOTER ── */}
            <div className="w-full py-12 border-t border-white/5 text-center">
                <p className="text-zinc-500 text-sm mb-5">Ready to transform your fitness journey?</p>
                <button
                    onClick={signIn}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 px-10 py-4 rounded-2xl font-bold text-white shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                    {loading ? "Signing in…" : "Get Started Free"}
                </button>
                <p className="text-zinc-600 text-xs mt-4">No credit card required · Syncs in real time</p>
            </div>
        </div>
    );
}
