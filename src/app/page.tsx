"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import {
  getTodayToxins, getTodayNutrition, getOnboarding,
  getRecentWorkouts, getRecentActivities, getTodayReadiness, getBodyMetrics,
  deleteWorkoutLog, deleteActivityLog, formatLocalISO
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
import ToolsSection from "@/components/sections/ToolsSection";
import BodyMetrics from "@/components/BodyMetrics";
import GlobalDatePicker from "@/components/GlobalDatePicker";

import {
  Timer, BarChart3, BookOpen, User, Accessibility, Compass, Library, Moon, Sun, Wrench, CalendarIcon,
  Activity, LineChart
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

type Section = "training" | "discover" | "anatomy" | "library" | "metrics" | "analytics" | "log" | "settings" | "tools";

const NAV_ITEMS: { id: Section; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "training", label: "Workouts", icon: Timer },
  { id: "tools", label: "Tools", icon: Wrench },
  { id: "discover", label: "Discover", icon: Compass },
  { id: "anatomy", label: "Anatomy", icon: Accessibility },
  { id: "metrics", label: "Metrics", icon: Activity },
  { id: "library", label: "Library", icon: Library },
  { id: "analytics", label: "Analytics", icon: LineChart },
  { id: "log", label: "Log", icon: BookOpen },
  { id: "settings", label: "Profile", icon: User },
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [nutrientAura, setNutrientAura] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [readinessPct, setReadinessPct] = useState(70);
  const [streakDays, setStreakDays] = useState(0);
  const [latestMetric, setLatestMetric] = useState<any>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [todayCalories, setTodayCalories] = useState(0);
  const [todayProteinG, setTodayProteinG] = useState(0);
  const [activeWorkoutPlan, setActiveWorkoutPlan] = useState<any>(null);
  const [workoutActive, setWorkoutWorkoutActive] = useState(false);

  // Prevent accidental tab closure
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (workoutActive) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [workoutActive]);

  const confirmSwitch = useCallback((newSection: Section) => {
    if (workoutActive) {
      if (confirm("Workout in progress. Switching tabs will exit the session. Continue?")) {
        setSection(newSection);
      }
    } else {
      setSection(newSection);
    }
  }, [workoutActive]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const refreshBodyState = useCallback(async () => {
    if (!user) return;
    const [n, workouts, activities, readiness, metrics] = await Promise.all([
      getTodayNutrition(user.uid, selectedDate),
      getRecentWorkouts(user.uid, 50),
      getRecentActivities(user.uid, 50),
      getTodayReadiness(user.uid, selectedDate),
      getBodyMetrics(user.uid, 1),
    ]);

    // Nutrition
    const totalCal = n.reduce((a, b) => a + (b.calories || 0), 0);
    const totalProt = n.reduce((a, b) => a + (b.protein_g || 0), 0);
    setNutrientAura(totalCal >= 1000);
    setTodayCalories(Math.round(totalCal));
    setTodayProteinG(Math.round(totalProt));

    // Logs & Metrics
    setRecentWorkouts(workouts);
    setRecentActivities(activities);
    if (readiness) setReadinessPct(readiness.readiness_pct);
    if (metrics.length > 0) setLatestMetric(metrics[0]);

    // Streak calc
    const allDays = new Set([
      ...workouts.map((w: any) => {
        const d = w.timestamp?.toDate?.();
        return d ? formatLocalISO(d) : "";
      }),
      ...activities.map((a: any) => {
        const d = a.timestamp?.toDate?.();
        return d ? formatLocalISO(d) : "";
      }),
    ]);
    let s = 0;
    const today = new Date();
    for (let i = 0; i < 90; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = formatLocalISO(d);
      if (allDays.has(key)) s++;
      else if (i > 0) break;
    }
    setStreakDays(s);
    setDataLoaded(true);
  }, [user, selectedDate]);

  useEffect(() => {
    if (!user) return;
    refreshBodyState();
  }, [user, refreshBodyState]);

  const handleDelete = useCallback(async (id: string, type: 'workout' | 'activity') => {
    if (!user) return;
    try {
      if (type === 'workout') {
        await deleteWorkoutLog(user.uid, id);
        setRecentWorkouts(prev => prev.filter(w => w.id !== id));
      } else {
        await deleteActivityLog(user.uid, id);
        setRecentActivities(prev => prev.filter(a => a.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete log", e);
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: "var(--bg-base)" }}>
        {/* Animated App Icon */}
        <motion.div 
          className="relative w-20 h-20 rounded-[20px] overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.3)] ring-1 ring-white/10"
          animate={{ scale: [0.95, 1.05, 0.95], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image src="/icon.png" alt="Loading" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </motion.div>
        <div className="flex flex-col items-center gap-1">
          <span className="font-extrabold text-xl tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">Axio</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">sync</span>
          </span>
          <span className="text-xs text-[var(--text-muted)]">Loading your data…</span>
        </div>
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
            todayCalories={todayCalories}
            todayProteinG={todayProteinG}
            calTarget={onboardingData?.calorieTarget || 2500}
            initialWorkoutPlan={activeWorkoutPlan}
            onClearWorkoutPlan={() => setActiveWorkoutPlan(null)}
            onRefresh={refreshBodyState}
            onWorkoutStateChange={(s) => setWorkoutWorkoutActive(s === "active" || s === "rest")}
            selectedDate={selectedDate}
          />
        )}

        {section === "discover" && <DiscoverSection />}
        {section === "library" && (
          <LibrarySection onStartWorkout={(w: any) => {
            setActiveWorkoutPlan(w);
            setSection("training");
          }} />
        )}
        {section === "tools" && (
          <motion.div key="tools" variants={pageVariants} initial="initial" animate="enter" exit="exit">
            <ToolsSection />
          </motion.div>
        )}

        {section === "analytics" && (
          <motion.div key="analytics" variants={pageVariants} initial="initial" animate="enter" exit="exit">
            <AnalyticsHub />
          </motion.div>
        )}

        {section === "anatomy" && (
          <motion.div key="anatomy" variants={pageVariants} initial="initial" animate="enter" exit="exit" className="w-full">
            <BodyAnalytics
              nutrientAura={nutrientAura}
              recentWorkouts={recentWorkouts}
            />
          </motion.div>
        )}

        {section === "metrics" && (
          <motion.div key="metrics" variants={pageVariants} initial="initial" animate="enter" exit="exit" className="w-full">
            <BodyMetrics />
          </motion.div>
        )}

        {section === "log" && (
          <LogSection
            recentWorkouts={recentWorkouts}
            recentActivities={recentActivities}
            onDelete={handleDelete}
            onRefresh={refreshBodyState}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
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
        <nav className="hidden sm:flex flex-col w-64 shrink-0 h-screen sticky top-0 p-4 bg-[var(--bg-elevated)] border-r border-[var(--border-subtle)] overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between px-2 mb-6 mt-2">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8">
                <Image src="/icon.png" alt="Axiosync Logo" fill className="rounded-[10px] object-cover border border-[var(--border-subtle)]" />
              </div>
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

          {/* GLOBAL DATE PICKER - Sidebar */}
          <div className="mb-6 px-1">
             <GlobalDatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
          </div>

          <div className="flex-1 space-y-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const isActive = section === id;
              return (
                <motion.button
                  key={id}
                  onClick={() => confirmSwitch(id)}
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
            <div className="mt-8 pt-4 border-t border-[var(--border-subtle)]">
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

        {/* ── Mobile Top Bar ── */}
        <div className="sm:hidden fixed top-0 left-0 right-0 z-[1000]" style={{
          background: "rgba(8,8,12,0.72)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div className="flex flex-col p-3 gap-2">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                    {/* App Logo */}
                    <div className="relative w-8 h-8 rounded-[10px] flex-shrink-0 border border-white/10 overflow-hidden shadow-[0_0_12px_rgba(99,102,241,0.3)]">
                        <Image src="/icon.png" alt="Logo" fill className="object-cover" />
                    </div>
                    <span className="font-extrabold text-[17px] tracking-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Axio</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">sync</span>
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] transition-colors"
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                        {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    </button>
                    {user?.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full ring-1 ring-white/10" />
                    ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "linear-gradient(135deg,#3B82F6,#7C3AED)", color: "white" }}>
                            {user?.displayName?.[0]?.toUpperCase() || "A"}
                        </div>
                    )}
                </div>
            </div>

            {/* GLOBAL DATE PICKER - Mobile */}
            <GlobalDatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
          </div>
        </div>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto no-scrollbar relative z-10 w-full px-4 sm:px-8 pt-[140px] sm:pt-6 pb-[88px] sm:pb-12 max-w-[1000px] mx-auto overflow-x-hidden">
          <SectionContent />
        </main>

        {/* ── Mobile Bottom Nav ── */}
        <div className="mobile-nav sm:hidden">
          <div
            className="mx-3 mb-3 rounded-[28px] flex items-center overflow-hidden"
            style={{
              background: "rgba(12,12,18,0.88)",
              backdropFilter: "blur(40px) saturate(200%)",
              WebkitBackdropFilter: "blur(40px) saturate(200%)",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.06) inset",
            }}
          >
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const isActive = section === id;
              return (
                <motion.button
                  key={id}
                  onClick={() => confirmSwitch(id)}
                  whileTap={{ scale: 0.82 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="flex flex-1 flex-col items-center justify-center gap-1 py-3 min-w-0 relative"
                  style={{ minHeight: 56 }}
                >
                  {/* Active pill background */}
                  {isActive && (
                    <motion.div
                      layoutId="mobile-pill"
                      className="absolute inset-x-1.5 inset-y-1.5 rounded-[18px]"
                      style={{
                        background: "linear-gradient(135deg, rgba(59,130,246,0.22), rgba(124,58,237,0.18))",
                        border: "1px solid rgba(99,102,241,0.25)",
                        boxShadow: "0 0 20px rgba(59,130,246,0.15)",
                      }}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <div className="relative">
                    <Icon
                      className={`w-[22px] h-[22px] transition-all duration-200 ${
                        isActive ? "text-blue-400 stroke-[2.2]" : "text-zinc-500 stroke-[1.7]"
                      }`}
                    />
                  </div>
                  <span className={`text-[9.5px] tracking-tight transition-all duration-200 relative ${
                    isActive ? "text-blue-400 font-bold" : "text-zinc-600 font-medium"
                  }`}>{label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
