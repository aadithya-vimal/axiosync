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
        <div className="flex flex-col w-full">
            <div className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${
                isToday 
                ? "bg-white/[0.03] border-white/5 shadow-sm" 
                : "bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
            }`}>
                {/* Historical Indicator Pulse */}
                {!isToday && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.03, 0.08, 0.03] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-0 bg-blue-500 pointer-events-none"
                    />
                )}

                <div className="relative z-10 p-2 flex flex-col gap-1">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5">
                            <CalendarIcon className={`w-3 h-3 ${isToday ? "text-[var(--text-muted)]" : "text-blue-400"}`} />
                            <span className={`text-[9px] font-black uppercase tracking-widest ${isToday ? "text-[var(--text-muted)]" : "text-blue-400"}`}>
                                {isToday ? "Live" : "Historical"}
                            </span>
                        </div>
                        
                        {!isToday && (
                            <button 
                                onClick={handleReset}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-[8px] font-black uppercase tracking-tighter"
                            >
                                <RotateCcw className="w-2 h-2" /> Reset
                            </button>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-1">
                        <button 
                            onClick={handlePrev}
                            className="p-1 rounded-lg hover:bg-white/5 text-[var(--text-muted)] transition-colors"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        
                        <div className="flex-1 text-center min-w-0">
                            <div className={`text-[13px] font-bold tracking-tight truncate ${isToday ? "text-[var(--text-primary)]" : "text-white"}`}>
                                {isSameDay(displayDate, new Date()) ? "Today" : format(displayDate, "EEEE")}
                            </div>
                            <div className="text-[9px] text-[var(--text-muted)] font-medium truncate">
                                {format(displayDate, "MMM dd, yyyy")}
                            </div>
                        </div>

                        <button 
                            onClick={handleNext}
                            className="p-1 rounded-lg hover:bg-white/5 text-[var(--text-muted)] transition-colors"
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
            
            <AnimatePresence>
                {!isToday && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">
                                Logging to historical day
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
