"use client";

import InfoPageWrapper from "@/components/InfoPageWrapper";
import { Linkedin, Globe } from "lucide-react";

export default function AboutPage() {
    return (
        <InfoPageWrapper 
            title="About Axiosync" 
            subtitle="The intersection of human performance and artificial intelligence."
        >
            <div className="space-y-12 text-zinc-400">
                <section>
                    <h2 className="text-3xl font-black italic uppercase tracking-tight text-white mb-6">Our Mission</h2>
                    <p className="leading-relaxed text-lg">
                        Axiosync was founded on a single principle: that high-performance training shouldn't be reserved for elite athletes with dedicated coaching staffs. We believe that by leveraging the power of AI, we can provide every individual with a hyper-personalized roadmap to their physical potential.
                    </p>
                </section>

                <section>
                    <h2 className="text-3xl font-black italic uppercase tracking-tight text-white mb-6">The Architect</h2>
                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-8">
                        <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                            <span className="text-4xl font-black text-white italic">AV</span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white mb-2">Aadithya Vimal</h3>
                            <p className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-4">Lead Developer & Visionary</p>
                            <p className="mb-6 leading-relaxed">
                                Built with a passion for fitness and cutting-edge technology, Aadithya envisioned a system where data doesn't just record the past, but predicts and optimizes the future of training.
                            </p>
                            <div className="flex gap-4">
                                <a href="https://www.linkedin.com/in/aadithyavimal/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all font-bold text-xs uppercase tracking-widest">
                                    <Linkedin className="w-4 h-4" />
                                    LinkedIn
                                </a>
                                <a href="https://aadithyavimal.pages.dev" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all font-bold text-xs uppercase tracking-widest">
                                    <Globe className="w-4 h-4" />
                                    Website
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-3xl font-black italic uppercase tracking-tight text-white mb-6">The Ecosystem</h2>
                    <p className="leading-relaxed">
                        Axiosync isn't just an app; it's a living ecosystem. By integrating AI-powered training, computer-vision nutrition tracking, and deep-learning analytics, we provide a 360-degree view of your health. Our goal is to make science-backed fitness accessible, intuitive, and effective.
                    </p>
                </section>
            </div>
        </InfoPageWrapper>
    );
}
