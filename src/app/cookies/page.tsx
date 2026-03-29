"use client";

import InfoPageWrapper from "@/components/InfoPageWrapper";

export default function CookiesPage() {
    return (
        <InfoPageWrapper title="Cookie Policy" subtitle="How we use cookies to improve your experience.">
            <div className="space-y-8 text-zinc-400">
                <p>Axiosync uses cookies and similar technologies to enhance your user experience, analyze site usage, and support our marketing efforts.</p>
                <section>
                    <h2 className="text-xl font-bold text-white mb-4 italic uppercase">Essential Cookies</h2>
                    <p>These are necessary for the website to function correctly, such as maintaining your session and security.</p>
                </section>
                <section>
                    <h2 className="text-xl font-bold text-white mb-4 italic uppercase">Performance Cookies</h2>
                    <p>We use these to understand how visitors interact with the site, helping us identify and fix issues.</p>
                </section>
            </div>
        </InfoPageWrapper>
    );
}
