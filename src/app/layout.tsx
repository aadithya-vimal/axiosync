import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Axiosync — Proactive Health Companion",
  description: "AI-driven health companion with 3D body visualization, workout & activity tracking, and on-device AI insights. Developed by Aadithya Vimal.",
  keywords: ["health", "AI", "fitness", "3D body map", "workout tracker", "nutrition", "circadian", "offline"],
  authors: [{ name: "Aadithya Vimal" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased text-zinc-900 dark:text-[var(--text-primary)] selection:bg-fuchsia-500/30`} suppressHydrationWarning style={{ fontFamily: "Inter, system-ui, sans-serif", backgroundColor: "var(--bg-base)" }}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {/* Global Ambient Background */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1] opacity-50 dark:opacity-100">
            <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-[140px] mix-blend-screen bg-violet-900/10 dark:bg-violet-900/20" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[140px] mix-blend-screen bg-cyan-900/10 dark:bg-cyan-900/20" />
            <div className="absolute top-[30%] left-[40%] w-[40vw] h-[40vw] rounded-full blur-[120px] mix-blend-screen bg-emerald-900/5 dark:bg-emerald-900/10" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
          </div>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
