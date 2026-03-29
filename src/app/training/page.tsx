"use client";

import InfoPageWrapper from "@/components/InfoPageWrapper";
import { Brain, Zap, Target, TrendingUp } from "lucide-react";

export default function TrainingPage() {
    return (
        <InfoPageWrapper 
            title="AI Training" 
            subtitle="Hyper-personalized workout routines engineered by artificial intelligence to match your specific biomechanics and goals."
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                {[
                    { icon: Brain, title: "Adaptive Logic", text: "Our AI analyzes your performance in real-time, adjusting weight, reps, and rest periods for your next set." },
                    { icon: Zap, title: "Dynamic Intensity", text: "Never plateau again. Axiosync calculates your optimal RPE (Rate of Perceived Exertion) to keep you in the growth zone." },
                    { icon: Target, title: "Goal-Oriented", text: "Whether it's hypertrophy, strength, or endurance, the engine crafts a roadmap tailored to your timeline." },
                    { icon: TrendingUp, title: "Volume Tracking", text: "Deep-dive into your training volume and frequency with high-fidelity charts and automated progression logs." }
                ].map((item, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all group">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <item.icon className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                        <p className="text-zinc-500 text-sm leading-relaxed">{item.text}</p>
                    </div>
                ))}
            </div>

            <section className="space-y-8">
                <h2 className="text-3xl font-black italic uppercase tracking-tight">The Science of Sync</h2>
                <p className="text-zinc-400 leading-relaxed">
                    Traditional training programs are static. They don't know if you slept poorly, if your nutrition was off, or if you're feeling exceptionally strong today. Axiosync's AI Training engine bridges this gap by integrating with your health data to suggest the perfect workout for your current physiological state.
                </p>
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-10 text-center">
                    <h3 className="text-2xl font-bold mb-4">Ready to upgrade your training?</h3>
                    <p className="text-blue-100 mb-8 max-w-lg mx-auto">Join thousands of athletes using Axiosync to optimize every rep.</p>
                    <button className="bg-white text-black px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95">
                        Start Training
                    </button>
                </div>
            </section>
        </InfoPageWrapper>
    );
}
