"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function MarketingHeader() {
    const { signIn } = useAuth();

    return (
        <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-30 relative">
            <Link href="/" className="flex items-center gap-3">
                <Image src="/icon.png" alt="Axiosync" width={32} height={32} className="rounded-xl border border-white/10" priority />
                <span className="text-xl font-bold tracking-tight text-white">Axiosync</span>
            </Link>
            <div className="hidden sm:flex items-center gap-8">
                <Link href="/anatomy" className="text-zinc-400 hover:text-white transition-colors text-sm font-medium">
                    Exercise Library
                </Link>
                <Link href="/help" className="text-zinc-400 hover:text-white transition-colors text-sm font-medium">
                    Help
                </Link>
                <button
                    onClick={signIn}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 rounded-full font-semibold text-sm shadow-lg shadow-blue-500/20 hover:opacity-90 active:scale-95 transition-all text-white"
                >
                    Sign In
                </button>
            </div>
        </header>
    );
}
