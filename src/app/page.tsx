"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  getTodayToxins, getTodayNutrition, getOnboarding,
  getRecentWorkouts, getRecentActivities, getTodayReadiness,
} from "@/lib/firestore";

// Analytics
import AnalyticsHub from "@/components/AnalyticsHub";
import OnboardingFlow from "@/components/OnboardingFlow";

// New Standalone Sections
import TrainingSection from "@/components/sections/TrainingSection";
import LogSection from "@/components/sections/LogSection";
import SettingsSection from "@/components/sections/SettingsSection";
import DiscoverSection from "@/components/sections/DiscoverSection";
import LibrarySection from "@/components/sections/LibrarySection";

import {
  Timer, BarChart3, BookOpen, User, Accessibility, Compass, Library
} from "lucide-react";

const BodyAnalytics = dynamic(() => import("@/components/BodyAnalytics"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center min-h-[300px]">
      <div className="text-zinc-500 text-sm flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#0A84FF]/40 animate-spin" style={{ borderTopColor: "transparent" }} />
        Loading Body Analytics…
      </div>
    </div>
  ),
});

type Section = "training" | "discover" | "body" | "library" | "analytics" | "log" | "settings";

const NAV_ITEMS: { id: Section; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "training", label: "Training", icon: Timer },
  { id: "discover", label: "Discover", icon: Compass },
  { id: "body", label: "Body Analytics", icon: Accessibility },
  { id: "library", label: "Library", icon: Library },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "log", label: "Log", icon: BookOpen },
  { id: "settings", label: "Settings", icon: User },
];

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  enter: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 320, damping: 30, mass: 0.8 } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.18 } },
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [section, setSection] = useState<Section>("training");
  const [nutrientAura, setNutrientAura] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [readinessPct, setReadinessPct] = useState(70);
  const [lastSleepHours, setLastSleepHours] = useState(7.5);
  const [sleepQuality, setSleepQuality] = useState(7);
  const [streakDays, setStreakDays] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const refreshBodyState = useCallback(async () => {
    if (!user) return;
    const n = await getTodayNutrition(user.uid);
    setNutrientAura(n.reduce((a, b) => a + b.calories, 0) >= 1000);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [onboarding, workouts, activities, readiness] = await Promise.all([
        getOnboarding(user.uid),
        getRecentWorkouts(user.uid, 50),
        getRecentActivities(user.uid, 50),
        getTodayReadiness(user.uid),
      ]);
      if (!onboarding?.completed) setShowOnboarding(true);
      setOnboardingData(onboarding);
      setRecentWorkouts(workouts);
      setRecentActivities(activities);
      if (readiness) setReadinessPct(readiness.readiness_pct);

      // Streak calc
      const allDays = new Set([
        ...workouts.map((w: any) => w.timestamp?.toDate?.()?.toISOString().split("T")[0] || ""),
        ...activities.map((a: any) => a.timestamp?.toDate?.()?.toISOString().split("T")[0] || ""),
      ]);
      let s = 0;
      const today = new Date();
      for (let i = 0; i < 90; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toISOString().split("T")[0];
        if (allDays.has(key)) s++;
        else if (i > 0) break;
      }
      setStreakDays(s);
      setDataLoaded(true);
      refreshBodyState();
    })();
  }, [user, refreshBodyState]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-blue-500/40 animate-spin" style={{ borderTopColor: "transparent" }} />
      </div>
    );
  }

  function SectionContent() {
    return (
      <AnimatePresence mode="wait">
        {section === "training" && (
          <TrainingSection
            recentWorkouts={recentWorkouts}
            recentActivities={recentActivities}
            readinessPct={readinessPct}
            lastSleepHours={lastSleepHours}
            sleepQuality={sleepQuality}
            streakDays={streakDays}
            dataLoaded={dataLoaded}
          />
        )}

        {section === "discover" && <DiscoverSection />}
        {section === "library" && <LibrarySection />}

        {section === "analytics" && (
          <motion.div key="analytics" variants={pageVariants} initial="initial" animate="enter" exit="exit">
            <AnalyticsHub />
          </motion.div>
        )}

        {section === "body" && (
          <motion.div key="body" variants={pageVariants} initial="initial" animate="enter" exit="exit" className="absolute inset-0 z-0">
            <BodyAnalytics
              nutrientAura={nutrientAura}
              recentWorkouts={recentWorkouts}
            />
          </motion.div>
        )}

        {section === "log" && (
          <LogSection
            recentWorkouts={recentWorkouts}
            recentActivities={recentActivities}
          />
        )}

        {section === "settings" && (
          <SettingsSection
            user={user}
            onboardingData={onboardingData}
            setShowOnboarding={setShowOnboarding}
            signOut={signOut}
          />
        )}
      </AnimatePresence>
    );
  }

  return (
    <>
      {showOnboarding && <OnboardingFlow onComplete={() => setShowOnboarding(false)} />}

      <div className="flex flex-col sm:flex-row h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
        {/* ── Desktop Sidebar ── */}
        <nav className="hidden sm:flex flex-col w-60 shrink-0 h-screen sticky top-0 p-4" style={{ background: "rgba(10,10,12,0.6)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-3 px-2 mb-8 mt-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-lg" style={{ background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)", boxShadow: "0 0 20px rgba(59,130,246,0.3)" }}>
              A
            </div>
            <span className="font-bold text-lg tracking-tight text-white">Axiosync</span>
          </div>

          <div className="flex-1 space-y-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const isActive = section === id;
              return (
                <motion.button
                  key={id}
                  onClick={() => setSection(id)}
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                  whileTap={{ scale: 0.97 }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-medium transition-colors duration-200 text-left relative overflow-hidden ${isActive ? "bg-white/10 text-white" : "text-zinc-400"}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-[#3B82F6]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-5 h-5 ${isActive ? "text-[#3B82F6]" : ""}`} />
                  {label}
                </motion.button>
              );
            })}
          </div>

          {user && (
            <div className="mt-auto pt-4 border-t border-white/[0.06]">
              <div className="flex items-center gap-3 px-2">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full ring-1 ring-white/10" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                    <User className="w-4 h-4 text-zinc-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{user.displayName?.split(" ")[0] || "User"}</div>
                  <div className="text-[11px] text-zinc-500 truncate">{user.email}</div>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* ── Main Content ── */}
        <main className={`flex-1 overflow-y-auto no-scrollbar relative z-10 w-full ${section === "body" ? "p-0 max-w-none h-screen" : "px-4 sm:px-8 pt-6 pb-28 sm:pb-8 max-w-[1000px] mx-auto"}`}>
          <SectionContent />
        </main>

        {/* ── Mobile Bottom Nav ── */}
        <div className="mobile-nav sm:hidden">
          <div
            className="mx-2 mb-3 px-2 pt-3 pb-2 rounded-[28px] border border-white/10 flex items-center justify-around overflow-x-auto no-scrollbar gap-2"
            style={{
              background: "rgba(15,16,20,0.88)",
              backdropFilter: "blur(32px) saturate(180%)",
              WebkitBackdropFilter: "blur(32px) saturate(180%)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.06) inset",
            }}
          >
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const isActive = section === id;
              return (
                <motion.button
                  key={id}
                  onClick={() => setSection(id)}
                  whileTap={{ scale: 0.88 }}
                  className={`flex flex-col items-center justify-center gap-1 min-w-[60px] py-1 transition-colors ${isActive ? "text-[#3B82F6]" : "text-zinc-500"}`}
                >
                  <div className="relative">
                    {isActive && (
                      <motion.div
                        layoutId="mobile-indicator"
                        className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#3B82F6]"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon className={`w-6 h-6 mt-1 ${isActive ? "stroke-[2.5px]" : "stroke-[1.8px]"}`} />
                  </div>
                  <span className={`text-[10px] ${isActive ? "font-semibold" : "font-medium"}`}>{label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
