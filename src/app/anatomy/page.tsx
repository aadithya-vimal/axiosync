"use client";

import InfoPageWrapper from "@/components/InfoPageWrapper";
import { Accessibility, BookOpen, Layers, ShieldCheck } from "lucide-react";

export default function AnatomyPage() {
    return (
        <InfoPageWrapper 
            title="Anatomy" 
            subtitle="Understand every muscle fiber with our interactive 3D and 2D anatomical library."
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                {[
                    { icon: Accessibility, title: "Interactive Models", text: "Tap on individual muscle groups to view their function and exercises targeting them specifically." },
                    { icon: Layers, title: "Muscle Depth", text: "Visualize primary and secondary muscle recruitment for any exercise in our extensive database." },
                    { icon: BookOpen, title: "Form Guides", text: "Step-by-step instructions ensure you execute every movement with anatomical precision." },
                    { icon: ShieldCheck, title: "Injury Prevention", text: "AI-identified imbalances and suggestions help you avoid overtraining specific muscle groups." }
                ].map((item, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all group">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <item.icon className="w-6 h-6 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                        <p className="text-zinc-500 text-sm leading-relaxed">{item.text}</p>
                    </div>
                ))}
            </div>

            <section className="space-y-8">
                <h2 className="text-3xl font-black italic uppercase tracking-tight">Visualize Your Potential</h2>
                <p className="text-zinc-400 leading-relaxed">
                    Most lifters don't understand the anatomy of the movement. Axiosync brings science into the gym by providing clear visualizations of how your body moves. Our interactive anatomy map allows you to deep-dive into muscle recruitment patterns, helping you build a stronger mind-muscle connection and optimize your training efficiency.
                </p>
            </section>
        </InfoPageWrapper>
    );
}
