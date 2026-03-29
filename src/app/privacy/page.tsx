"use client";

import InfoPageWrapper from "@/components/InfoPageWrapper";

export default function PrivacyPage() {
    return (
        <InfoPageWrapper title="Privacy Policy" subtitle="Your data privacy is our highest priority.">
            <div className="space-y-8 text-zinc-400">
                <section>
                    <h2 className="text-xl font-bold text-white mb-4">1. Data Collection</h2>
                    <p>We collect information that you provide directly to us when you create an account, log workouts, or track nutrition. This includes your name, email, and fitness-related data such as weight, exercise logs, and nutritional intake.</p>
                </section>
                <section>
                    <h2 className="text-xl font-bold text-white mb-4">2. Use of Information</h2>
                    <p>The data collected is primarily used to power our AI engine, providing you with personalized workout and nutrition suggestions. We do not sell your personal data to third parties.</p>
                </section>
                <section>
                    <h2 className="text-xl font-bold text-white mb-4">3. Data Security</h2>
                    <p>We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, or destruction.</p>
                </section>
            </div>
        </InfoPageWrapper>
    );
}
