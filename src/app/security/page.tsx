"use client";

import InfoPageWrapper from "@/components/InfoPageWrapper";

export default function SecurityPage() {
    return (
        <InfoPageWrapper title="Security" subtitle="Protecting your health data with elite-level security.">
            <div className="space-y-8 text-zinc-400">
                <section>
                    <h2 className="text-xl font-bold text-white mb-4 italic uppercase tracking-widest">Data Encryption</h2>
                    <p>All sensitive user data is encrypted at rest using AES-256 and in transit via TLS 1.3. Your workout and health logs are stored securely with strict access controls.</p>
                </section>
                <section>
                    <h2 className="text-xl font-bold text-white mb-4 italic uppercase tracking-widest">Authentication</h2>
                    <p>We leverage industry-standard OAuth 2.0 and Firebase Authentication to ensure that only you can access your personal fitness data.</p>
                </section>
                <section>
                    <h2 className="text-xl font-bold text-white mb-4 italic uppercase tracking-widest">Vulnerability Scanning</h2>
                    <p>Regular security audits and automated vulnerability scans are conducted to maintain the highest levels of system integrity.</p>
                </section>
            </div>
        </InfoPageWrapper>
    );
}
