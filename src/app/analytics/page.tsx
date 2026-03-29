"use client";

import InfoPageWrapper from "@/components/InfoPageWrapper";
import { BarChart, LineChart, PieChart, Activity } from "lucide-react";

export default function AnalyticsPage() {
    return (
        <InfoPageWrapper 
            title="Analytics" 
            subtitle="Deep data insights that reveal the patterns in your progress."
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                {[
                    { icon: Activity, title: "Readiness Score", text: "AI-calculated score based on your recent activity, sleep, and nutrition logs." },
                    { icon: LineChart, title: "Progression Charts", text: "Track your strength gains across every lift with granular precision." },
                    { icon: BarChart, title: "Volume Distribution", text: "Visualize how your training volume is split across different muscle groups." },
                    { icon: PieChart, title: "Nutrition Correlation", text: "See exactly how your caloric intake impacts your performance in the gym." }
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
        </InfoPageWrapper>
    );
}
