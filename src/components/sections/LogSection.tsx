"use client";

import { motion } from "framer-motion";
import StreakCalendar from "@/components/StreakCalendar";
import NutritionLogger from "@/components/NutritionLogger";
import SupplementLogger from "@/components/SupplementLogger";
import SleepLogger from "@/components/SleepLogger";

const pageVariants = {
    initial: { opacity: 0, y: 16 },
    enter: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 320, damping: 30, mass: 0.8 } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.18 } },
};

export default function LogSection({
    recentWorkouts,
    recentActivities,
}: {
    recentWorkouts: any[];
    recentActivities: any[];
}) {
    return (
        <motion.div key="log" variants={pageVariants} initial="initial" animate="enter" exit="exit" className="space-y-5 pb-32">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] px-1 pt-2 tracking-tight">Archive</h1>

            {/* Activity Calendar */}
            <StreakCalendar workouts={recentWorkouts} activities={recentActivities} />

            {/* Nutrition Logger */}
            <div className="card p-5">
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">Nutrition</h3>
                <NutritionLogger />
            </div>

            {/* Toxins + Sleep */}
            <div className="card divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                <div className="p-5">
                    <SupplementLogger />
                </div>
                <div className="p-5">
                    <SleepLogger />
                </div>
            </div>
        </motion.div>
    );
}
