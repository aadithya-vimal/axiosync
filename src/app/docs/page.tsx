"use client";

import InfoPageWrapper from "@/components/InfoPageWrapper";

export default function DocsPage() {
    return (
        <InfoPageWrapper title="API Documentation" subtitle="Integrate with the Axiosync ecosystem.">
            <div className="bg-zinc-900 border border-white/5 rounded-3xl p-10 font-mono text-sm space-y-8">
                <section>
                    <h3 className="text-blue-400 font-bold mb-4 uppercase tracking-[0.2em]">Authentication</h3>
                    <code className="text-zinc-500 italic">GET /api/v1/auth?api_key=your_key</code>
                </section>
                <section>
                    <h3 className="text-blue-400 font-bold mb-4 uppercase tracking-[0.2em]">Retrieve Workouts</h3>
                    <code className="text-zinc-500 italic">GET /api/v1/workouts/recent</code>
                </section>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                    <p className="text-zinc-500">The full API documentation is currently restricted to early-access partners.</p>
                </div>
            </div>
        </InfoPageWrapper>
    );
}
