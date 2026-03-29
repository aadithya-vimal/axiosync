"use client";

import Image from "next/image";
import Link from "next/link";
import { Linkedin, Globe } from "lucide-react";

export default function MarketingFooter() {
    return (
        <footer className="w-full border-t border-white/5 bg-[#05070A] pt-20 pb-10 relative z-10">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20">
                <div className="col-span-2 lg:col-span-2">
                    <div className="flex items-center gap-3 mb-6">
                        <Image src="/icon.png" alt="Axiosync" width={40} height={40} className="rounded-xl" />
                        <span className="text-2xl font-black tracking-tight text-white">Axiosync</span>
                    </div>
                    <p className="text-zinc-500 max-w-sm mb-8 font-medium leading-relaxed">
                        The ultimate AI-powered fitness ecosystem designed to transform your performance with data-driven insights.
                    </p>
                    
                    {/* Medical Disclaimer */}
                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 mb-8 max-w-sm">
                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Medical Disclaimer</p>
                        <p className="text-xs text-zinc-500 leading-relaxed italic">
                            Axiosync provides fitness information for educational purposes only. This is not medical or health advice. Always consult a physician or healthcare professional before starting any new exercise or nutrition program.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <a href="https://www.linkedin.com/in/aadithyavimal/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer group">
                            <Linkedin className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition-colors" />
                        </a>
                        <a href="https://aadithyavimal.pages.dev" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer group">
                            <Globe className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                        </a>
                    </div>
                </div>
                
                <div>
                    <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Product</h4>
                    <ul className="space-y-4 text-zinc-500 text-sm font-medium">
                        <li><Link href="/training" className="hover:text-blue-500 transition-colors">AI Training</Link></li>
                        <li><Link href="/nutrition" className="hover:text-blue-500 transition-colors">Nutrition</Link></li>
                        <li><Link href="/anatomy" className="hover:text-blue-500 transition-colors">Anatomy</Link></li>
                        <li><Link href="/analytics" className="hover:text-blue-500 transition-colors">Analytics</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Company</h4>
                    <ul className="space-y-4 text-zinc-500 text-sm font-medium">
                        <li><Link href="/about" className="hover:text-blue-500 transition-colors">About</Link></li>
                        <li><Link href="/careers" className="hover:text-blue-500 transition-colors">Careers</Link></li>
                        <li><Link href="/privacy" className="hover:text-blue-500 transition-colors">Privacy</Link></li>
                        <li><Link href="/terms" className="hover:text-blue-500 transition-colors">Terms</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Support</h4>
                    <ul className="space-y-4 text-zinc-500 text-sm font-medium">
                        <li><Link href="/help" className="hover:text-blue-500 transition-colors">Help Center</Link></li>
                        <li><Link href="/contact" className="hover:text-blue-500 transition-colors">Contact</Link></li>
                        <li><Link href="/docs" className="hover:text-blue-500 transition-colors">API Docs</Link></li>
                        <li><Link href="/community" className="hover:text-blue-500 transition-colors">Community</Link></li>
                    </ul>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/5 pt-10">
                <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest">© 2026 AXIOSYNC TECHNOLOGIES INC. ALL RIGHTS RESERVED.</p>
                <div className="flex gap-8">
                    <Link href="/cookies" className="text-zinc-600 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors cursor-pointer">Cookie Policy</Link>
                    <Link href="/security" className="text-zinc-600 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors cursor-pointer">Security</Link>
                </div>
            </div>
        </footer>
    );
}
