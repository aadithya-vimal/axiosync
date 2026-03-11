"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import {
  getTodayToxins, getTodayNutrition, getOnboarding,
  getRecentWorkouts, getRecentActivities, getTodayReadiness, getBodyMetrics,
  deleteWorkoutLog, deleteActivityLog,
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
  Timer, BarChart3, BookOpen, User, Accessibility, Compass, Library, Moon, Sun
} from "lucide-react";

const BodyAnalytics = dynamic(() => import("@/components/BodyAnalytics"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center min-h-[300px]">
      <div className="text-[var(--text-muted)] text-sm flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-blue)]/40 border-t-transparent animate-spin" />
        Loading Body Analytics…
      </div>
    </div>
  ),
});

type Section = "training" | "discover" | "body" | "library" | "analytics" | "log" | "settings";

const NAV_ITEMS: { id: Section; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "training", label: "Operations", icon: Timer },
  { id: "discover", label: "Intelligence", icon: Compass },
  { id: "body", label: "Biometrics", icon: Accessibility },
  { id: "library", label: "Arsenal", icon: Library },
  { id: "analytics", label: "Briefing", icon: BarChart3 },
  { id: "log", label: "Archive", icon: BookOpen },
  { id: "settings", label: "Protocols", icon: User },
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
  const { theme, setTheme } = useTheme();
  const [section, setSection] = useState<Section>("training");
  const [nutrientAura, setNutrientAura] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [readinessPct, setReadinessPct] = useState(70);
  const [streakDays, setStreakDays] = useState(0);
  const [latestMetric, setLatestMetric] = useState<any>(null);
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
      const [onboarding, workouts, activities, readiness, metrics] = await Promise.all([
        getOnboarding(user.uid),
        getRecentWorkouts(user.uid, 50),
        getRecentActivities(user.uid, 50),
        getTodayReadiness(user.uid),
        getBodyMetrics(user.uid, 1),
      ]);
      if (!onboarding?.completed) setShowOnboarding(true);
      setOnboardingData(onboarding);
      setRecentWorkouts(workouts);
      setRecentActivities(activities);
      if (readiness) setReadinessPct(readiness.readiness_pct);
      if (metrics.length > 0) setLatestMetric(metrics[0]);

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
            streakDays={streakDays}
            latestMetric={latestMetric}
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
          <motion.div key="body" variants={pageVariants} initial="initial" animate="enter" exit="exit" className="w-full">
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
            onDelete={handleDelete}
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
        <nav className="hidden sm:flex flex-col w-60 shrink-0 h-screen sticky top-0 p-4 bg-[var(--bg-elevated)] border-r border-[var(--border-subtle)]">
          <div className="flex items-center justify-between px-2 mb-8 mt-2">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-2xl tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">Axio</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">sync</span>
              </span>
            </div>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-[var(--border-subtle)] text-[var(--text-muted)] transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex-1 space-y-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const isActive = section === id;
              return (
                <motion.button
                  key={id}
                  onClick={() => setSection(id)}
                  whileHover={{ backgroundColor: "var(--border-subtle)" }}
                  whileTap={{ scale: 0.97 }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-medium transition-colors duration-200 text-left relative overflow-hidden ${isActive ? "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]" : "text-[var(--text-muted)]"}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-[var(--accent-blue)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-5 h-5 ${isActive ? "text-[var(--accent-blue)]" : ""}`} />
                  {label}
                </motion.button>
              );
            })}
          </div>

          {user && (
            <div className="mt-auto pt-4 border-t border-[var(--border-subtle)]">
              <div className="flex items-center gap-3 px-2">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full ring-1 ring-[var(--border-subtle)]" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[var(--border-subtle)] flex items-center justify-center">
                    <User className="w-4 h-4 text-[var(--text-muted)]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--text-primary)] truncate">{user.displayName?.split(" ")[0] || "User"}</div>
                  <div className="text-[11px] text-[var(--text-muted)] truncate">{user.email}</div>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* ── Mobile Top Nav (For Theme Toggle) ── */}
        <div className="sm:hidden fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-center bg-gradient-to-b from-[var(--bg-base)] to-transparent pointer-events-none">
          <span className="font-extrabold text-xl tracking-tight pointer-events-auto">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">Axio</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">sync</span>
          </span>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] shadow-sm pointer-events-auto"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto no-scrollbar relative z-10 w-full px-4 sm:px-8 pt-24 sm:pt-6 pb-28 sm:pb-8 max-w-[1000px] mx-auto overflow-x-hidden">
          <SectionContent />
        </main>

        {/* ── Mobile Bottom Nav ── */}
        <div className="mobile-nav sm:hidden">
          <div
            className="mx-1 mb-2 px-1 pt-2 pb-1.5 rounded-[24px] border border-[var(--border-strong)] flex items-center justify-between overflow-hidden gap-0.5 shadow-lg bg-[var(--bg-overlay)]/90 backdrop-blur-xl"
          >
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const isActive = section === id;
              return (
                <motion.button
                  key={id}
                  onClick={() => setSection(id)}
                  whileTap={{ scale: 0.88 }}
                  className={`flex flex-1 flex-col items-center justify-center gap-1 min-w-0 py-1 transition-colors ${isActive ? "text-[var(--accent-blue)]" : "text-[var(--text-muted)]"}`}
                >
                  <div className="relative flex justify-center w-full">
                    {isActive && (
                      <motion.div
                        layoutId="mobile-indicator"
                        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)]"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon className={`w-5 h-5 mt-1 shrink-0 ${isActive ? "stroke-[2.5px]" : "stroke-[1.8px]"}`} />
                  </div>
                  <span className={`text-[9px] w-full text-center truncate px-0.5 ${isActive ? "font-semibold" : "font-medium"}`}>{label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
