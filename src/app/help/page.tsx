"use client";

import InfoPageWrapper from "@/components/InfoPageWrapper";
import { Search } from "lucide-react";

export default function HelpPage() {
    const faqs = [
        { q: "How does the AI generate workouts?", a: "Our AI analyzes your goal, equipment, and recent performance to calculate optimal volume and intensity for each session." },
        { q: "Can I sync with Apple Health or Google Fit?", a: "Yes, Axiosync supports bidirectional syncing with major health platforms via our integration settings." },
        { q: "What is the Readiness Score?", a: "It's a daily metric from 0-100% that tells you how prepared your body is for high-intensity training based on recent recovery data." },
        { q: "How do I log custom foods?", a: "If our AI can't identify a food, you can manually enter macros or search our extensive verified database." }
    ];

    return (
        <InfoPageWrapper title="Help Center" subtitle="Find answers and get the most out of Axiosync.">
            <div className="relative mb-16">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input type="text" placeholder="Search for articles..." className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-5 text-lg focus:border-blue-500 outline-none transition-all" />
            </div>

            <div className="space-y-6">
                <h2 className="text-2xl font-black italic uppercase tracking-tight mb-8">Frequently Asked Questions</h2>
                {faqs.map((faq, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors">
                        <h3 className="text-lg font-bold mb-3 text-white">{faq.q}</h3>
                        <p className="text-zinc-500 leading-relaxed text-sm">{faq.a}</p>
                    </div>
                ))}
            </div>
        </InfoPageWrapper>
    );
}
