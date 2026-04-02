"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RotateCcw, X } from "lucide-react";
import { format, addDays, subDays, isSameDay } from "date-fns";

interface Props {
    selectedDate: Date | undefined;
    onDateChange: (date: Date | undefined) => void;
}

export default function GlobalDatePicker({ selectedDate, onDateChange }: Props) {
    const isToday = !selectedDate || isSameDay(selectedDate, new Date());
    const displayDate = selectedDate || new Date();

    const handlePrev = () => onDateChange(subDays(displayDate, 1));
    const handleNext = () => onDateChange(addDays(displayDate, 1));
    const handleReset = () => onDateChange(undefined);

    return (
        <div className="flex flex-col gap-2">
            <div className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                isToday 
                ? "bg-white/[0.03] border-white/10" 
                : "bg-blue-500/10 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
            }`}>
                {/* Historical Indicator Pulse */}
                {!isToday && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.05, 0.15, 0.05] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-blue-500 pointer-events-none"
                    />
                )}

                <div className="relative z-10 p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${isToday ? "bg-white/5 text-[var(--text-muted)]" : "bg-blue-500 text-white"}`}>
                                <CalendarIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? "text-[var(--text-muted)]" : "text-blue-400"}`}>
                                {isToday ? "Current Day" : "Historical View"}
                            </span>
                        </div>
                        
                        {!isToday && (
                            <button 
                                onClick={handleReset}
                                className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-[9px] font-black uppercase tracking-tighter"
                            >
                                <RotateCcw className="w-2.5 h-2.5" /> Reset
                            </button>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-1">
                        <button 
                            onClick={handlePrev}
                            className="p-1.5 rounded-xl hover:bg-white/5 text-[var(--text-muted)] transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <div className="flex-1 text-center">
                            <div className={`text-sm font-bold tracking-tight ${isToday ? "text-[var(--text-primary)]" : "text-white"}`}>
                                {isSameDay(displayDate, new Date()) ? "Today" : format(displayDate, "EEEE")}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] font-medium">
                                {format(displayDate, "MMM dd, yyyy")}
                            </div>
                        </div>

                        <button 
                            onClick={handleNext}
                            className="p-1.5 rounded-xl hover:bg-white/5 text-[var(--text-muted)] transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
            
            <AnimatePresence>
                {!isToday && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="px-2 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">
                            Updates will log to this day
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
