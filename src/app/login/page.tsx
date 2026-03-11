"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Activity, Shield, Zap, Sparkles, HeartPulse } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
    const { user, loading, signIn } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) router.push("/");
    }, [user, loading, router]);

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center overflow-hidden relative selection:bg-purple-500/30">
            {/* Animated Mesh Gradient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.3, 0.4, 0.3],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full blur-[120px] mix-blend-screen"
                    style={{ background: "radial-gradient(circle, rgba(139,92,246,0.6) 0%, transparent 70%)" }}
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        rotate: [0, -90, 0],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full blur-[100px] mix-blend-screen"
                    style={{ background: "radial-gradient(circle, rgba(14,165,233,0.5) 0%, transparent 70%)" }}
                />
                <motion.div
                    animate={{
                        scale: [1, 1.4, 1],
                        y: [0, -50, 0],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -bottom-[20%] left-[20%] w-[80vw] h-[60vw] rounded-full blur-[140px] mix-blend-screen"
                    style={{ background: "radial-gradient(ellipse, rgba(16,185,129,0.4) 0%, transparent 70%)" }}
                />
            </div>

            {/* Grid Overlay */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

            <div className="w-full max-w-6xl mx-auto px-6 py-12 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-16 relative z-10">

                {/* Left Side: Branding & Hero Text */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left"
                >
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.5)] border border-[var(--border-subtle)] ring-1 ring-white/5 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent translate-y-[-100%] animate-[shimmer_2s_infinite]"></div>
                            {/* We use the custom Logo if available, otherwise fallback to an abstract icon */}
                            <Image src="/icon.png" alt="Logo" width={48} height={48} className="object-cover rounded-2xl" />
                        </div>
                        <span className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Axiosync</span>
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-extrabold text-[var(--text-primary)] leading-[1.1] mb-6 tracking-tighter">
                        Experience <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 animate-gradient-x">
                            Ultra-Fitness.
                        </span>
                    </h1>

                    <p className="text-[var(--text-muted)] text-lg lg:text-xl leading-relaxed max-w-xl mb-10 font-medium">
                        The world's most premium AI health companion. Real-time 3D tracking, 500+ dynamic exercises, and flawless analytics.
                    </p>

                    {/* Features Row */}
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                        {[
                            { icon: HeartPulse, label: "Live Analytics", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
                            { icon: Zap, label: "Smart Generation", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
                            { icon: Shield, label: "Cloud Secure", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                        ].map(({ icon: Icon, label, color, bg, border }) => (
                            <div key={label} className={`flex items-center gap-2 px-4 py-2 rounded-full ${bg} ${border} border backdrop-blur-md`}>
                                <Icon className={`w-4 h-4 ${color}`} />
                                <span className="text-sm font-semibold text-[var(--text-primary)]/90">{label}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Right Side: Auth Card Glassmorphism */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="w-full max-w-md"
                >
                    <div className="relative group">
                        {/* Glow effect behind card */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

                        <div className="relative bg-[#1A1A24]/60 backdrop-blur-2xl border border-[var(--border-subtle)] rounded-[2rem] p-8 lg:p-10 shadow-2xl overflow-hidden">
                            {/* Inner shine */}
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

                            <div className="text-center mb-10">
                                <Sparkles className="w-8 h-8 text-fuchsia-400 mx-auto mb-4" />
                                <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2 tracking-tight">Access Portal</h2>
                                <p className="text-[var(--text-muted)] text-base">Enter the next generation of fitness</p>
                            </div>

                            <button
                                onClick={signIn}
                                disabled={loading}
                                className="relative w-full overflow-hidden group/btn bg-white hover:bg-zinc-100 active:scale-[0.98] text-black font-semibold rounded-2xl py-4 px-6 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <svg className="w-6 h-6 z-10 relative" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span className="z-10 relative text-lg whitespace-nowrap">Continue with Google</span>
                            </button>

                            <div className="mt-8 flex flex-col items-center gap-4">
                                <p className="text-[var(--text-muted)] text-xs text-center leading-relaxed">
                                    By continuing, you agree to our Terms of Service and securely link your anonymized health data.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
