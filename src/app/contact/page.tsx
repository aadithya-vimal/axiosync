"use client";

import InfoPageWrapper from "@/components/InfoPageWrapper";
import { Mail, Linkedin, Globe } from "lucide-react";

export default function ContactPage() {
    return (
        <InfoPageWrapper title="Contact" subtitle="Get in touch with the team.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all">
                    <h2 className="text-xl font-bold mb-6 text-white uppercase italic">Direct Inquiries</h2>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <Mail className="w-5 h-5 text-blue-400" />
                            </div>
                            <span className="text-zinc-400 font-medium italic">support@axiosync.com</span>
                        </div>
                        <a href="https://www.linkedin.com/in/aadithyavimal/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                                <Linkedin className="w-5 h-5 text-blue-400" />
                            </div>
                            <span className="text-zinc-400 font-medium italic hover:text-white transition-colors">Aadithya Vimal (LinkedIn)</span>
                        </a>
                        <a href="https://aadithyavimal.pages.dev" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                <Globe className="w-5 h-5 text-zinc-400" />
                            </div>
                            <span className="text-zinc-400 font-medium italic hover:text-white transition-colors">Developer Portfolio</span>
                        </a>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                    <h2 className="text-xl font-bold mb-6 text-white uppercase italic">Send a Message</h2>
                    <div className="space-y-4">
                        <input type="text" placeholder="Your Name" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" />
                        <input type="email" placeholder="Email Address" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none" />
                        <textarea placeholder="Your Message" rows={4} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none resize-none"></textarea>
                        <button className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold uppercase tracking-widest text-sm transition-colors">Send Message</button>
                    </div>
                </div>
            </div>
        </InfoPageWrapper>
    );
}
