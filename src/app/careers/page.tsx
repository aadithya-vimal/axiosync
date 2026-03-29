"use client";

import InfoPageWrapper from "@/components/InfoPageWrapper";

export default function CareersPage() {
    return (
        <InfoPageWrapper title="Careers" subtitle="Help us build the future of human performance.">
            <div className="text-center py-20 bg-white/5 border border-white/10 rounded-[3rem]">
                <h2 className="text-3xl font-black italic uppercase mb-6 tracking-tight">We're Growing</h2>
                <p className="text-zinc-500 max-w-md mx-auto mb-10 leading-relaxed">
                    Axiosync is currently in early-access. We're looking for passionate engineers, data scientists, and fitness enthusiasts to join the mission.
                </p>
                <div className="flex justify-center gap-4">
                    <button className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-sm transition-all">View Openings</button>
                    <button className="bg-white/5 border border-white/10 hover:bg-white/10 px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-sm transition-all">Contact HR</button>
                </div>
            </div>
        </InfoPageWrapper>
    );
}
