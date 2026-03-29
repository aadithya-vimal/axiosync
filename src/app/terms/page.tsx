"use client";

import InfoPageWrapper from "@/components/InfoPageWrapper";

export default function TermsPage() {
    return (
        <InfoPageWrapper title="Terms of Service" subtitle="Agreement for using the Axiosync ecosystem.">
            <div className="space-y-8 text-zinc-400">
                <section>
                    <h2 className="text-xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                    <p>By accessing or using the Axiosync platform, you agree to be bound by these terms and conditions. If you do not agree, please do not use the platform.</p>
                </section>
                <section>
                    <h2 className="text-xl font-bold text-white mb-4">2. Medical Disclaimer</h2>
                    <p className="font-bold text-blue-400">AXIOSYNC IS NOT A MEDICAL PROVIDER. THE SERVICES DO NOT CONSTITUTE MEDICAL ADVICE. YOU SHOULD CONSULT A PHYSICIAN BEFORE BEGINNING ANY FITNESS PROGRAM.</p>
                    <p className="mt-4">You assume all risks associated with your physical activities. Axiosync is not responsible for any injuries or health complications resulting from the use of its training or nutrition plans.</p>
                </section>
                <section>
                    <h2 className="text-xl font-bold text-white mb-4">3. User Accounts</h2>
                    <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
                </section>
            </div>
        </InfoPageWrapper>
    );
}
