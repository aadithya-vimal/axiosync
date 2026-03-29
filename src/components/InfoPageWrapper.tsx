"use client";

import { motion } from "framer-motion";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";

interface InfoPageWrapperProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}

export default function InfoPageWrapper({ title, subtitle, children }: InfoPageWrapperProps) {
    return (
        <div className="min-h-screen bg-[#0A0E17] text-white flex flex-col overflow-x-hidden">
            <MarketingHeader />
            
            <main className="flex-1 relative z-10">
                {/* Background Decor */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:60px_60px] opacity-20" />
                    <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[140px] bg-blue-600/5" />
                    <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full blur-[120px] bg-indigo-600/5" />
                </div>

                <div className="max-w-4xl mx-auto px-6 pt-20 pb-32">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-4 text-white uppercase italic">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-xl text-zinc-400 font-medium mb-12 max-w-2xl leading-relaxed">
                                {subtitle}
                            </p>
                        )}
                        
                        {/* Health Disclaimer Banner */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-12 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                                <span className="text-blue-400 font-bold">!</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-1">Health & Medical Disclaimer</p>
                                <p className="text-sm text-zinc-400 leading-relaxed">
                                    The content on Axiosync is for informational purposes only and is not intended as medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
                                </p>
                            </div>
                        </div>

                        <div className="prose prose-invert max-w-none">
                            {children}
                        </div>
                    </motion.div>
                </div>
            </main>

            <MarketingFooter />
        </div>
    );
}
