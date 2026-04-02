"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import StreakCalendar from "@/components/StreakCalendar";
import NutritionLogger from "@/components/NutritionLogger";
import SupplementLogger from "@/components/SupplementLogger";
import SleepLogger from "@/components/SleepLogger";
import { X, Calendar as CalendarIcon } from "lucide-react";

const pageVariants = {
    initial: { opacity: 0, y: 16 },
    enter: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 320, damping: 30, mass: 0.8 } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.18 } },
};

export default function LogSection({
    recentWorkouts,
    recentActivities,
    onDelete,
    onRefresh,
    selectedDate,
    onDateChange
}: {
    recentWorkouts: any[];
    recentActivities: any[];
    onDelete?: (id: string, type: 'workout' | 'activity') => Promise<void>;
    onRefresh?: () => Promise<void>;
    selectedDate: Date | undefined;
    onDateChange: (date: Date | undefined) => void;
}) {
    const isToday = !selectedDate || selectedDate.toDateString() === new Date().toDateString();

    return (
        <motion.div key="log" variants={pageVariants} initial="initial" animate="enter" exit="exit" className="space-y-5 pb-32">
            {/* Activity Calendar */}
            <StreakCalendar 
                workouts={recentWorkouts} 
                activities={recentActivities} 
                onDelete={onDelete} 
                onSelectDate={onDateChange}
            />

            {/* Nutrition Logger */}
            <div className="card p-5">
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">Nutrition</h3>
                <NutritionLogger onRefresh={onRefresh} selectedDate={selectedDate} />
            </div>

            {/* Toxins + Sleep */}
            <div className="card divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                <div className="p-5">
                    <SupplementLogger onRefresh={onRefresh} selectedDate={selectedDate} />
                </div>
                <div className="p-5">
                    <SleepLogger onRefresh={onRefresh} selectedDate={selectedDate} />
                </div>
            </div>
        </motion.div>
    );
}
