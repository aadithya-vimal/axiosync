"use client";

import InfoPageWrapper from "@/components/InfoPageWrapper";
import { Apple, Camera, BarChart3, Clock } from "lucide-react";

export default function NutritionPage() {
    return (
        <InfoPageWrapper 
            title="AI Nutrition" 
            subtitle="Smart nutrition tracking powered by computer vision and deep learning to simplify your fueling."
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                {[
                    { icon: Camera, title: "Photo Recognition", text: "Simply snap a photo of your meal. Our AI identifies ingredients and calculates macronutrients instantly." },
                    { icon: BarChart3, title: "Macro Precision", text: "Get detailed breakdowns of proteins, fats, and carbs. Track your micronutrients to ensure peak performance." },
                    { icon: Clock, title: "Nutrient Timing", text: "Receive AI-driven suggestions on when to fuel for your workouts to maximize energy and recovery." },
                    { icon: Apple, title: "Dynamic Goals", text: "Your calorie and macro targets adjust automatically based on your training intensity and daily activity levels." }
                ].map((item, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all group">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <item.icon className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                        <p className="text-zinc-500 text-sm leading-relaxed">{item.text}</p>
                    </div>
                ))}
            </div>

            <section className="space-y-8">
                <h2 className="text-3xl font-black italic uppercase tracking-tight">Fueling the Engine</h2>
                <p className="text-zinc-400 leading-relaxed">
                    Nutrition is 70% of the equation, but tracking it shouldn't be 70% of the work. Axiosync removes the friction of manual data entry with advanced food recognition technology. By understanding exactly what goes into your body, our engine can provide hyper-accurate feedback on how your diet is impacting your training results.
                </p>
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-10 text-center">
                    <h3 className="text-2xl font-bold mb-4">Start fueling with precision</h3>
                    <p className="text-emerald-100 mb-8 max-w-lg mx-auto">Transform your relationship with food through AI-powered tracking.</p>
                    <button className="bg-white text-black px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95">
                        Track Now
                    </button>
                </div>
            </section>
        </InfoPageWrapper>
    );
}
