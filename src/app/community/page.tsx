"use client";

import InfoPageWrapper from "@/components/InfoPageWrapper";

export default function CommunityPage() {
    return (
        <InfoPageWrapper title="Community" subtitle="Join the conversation with thousands of Axiosync athletes.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {["Discord", "Subreddit", "Slack", "Forum"].map(comm => (
                    <div key={comm} className="bg-white/5 border border-white/10 rounded-3xl p-10 hover:bg-white/10 transition-all text-center group">
                        <h3 className="text-xl font-black italic uppercase tracking-widest text-white mb-4 group-hover:text-blue-400 transition-colors">{comm}</h3>
                        <p className="text-zinc-500 text-sm mb-8">Connect, share plans, and get feedback from the community.</p>
                        <button className="text-xs font-bold uppercase tracking-[0.2em] border-b border-white/20 pb-1 group-hover:border-blue-500/50 transition-all">Join Now</button>
                    </div>
                ))}
            </div>
        </InfoPageWrapper>
    );
}
