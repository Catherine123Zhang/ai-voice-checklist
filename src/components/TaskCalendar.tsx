import React from "react";
import { motion } from "motion/react";
import { Calendar, TrendingUp } from "lucide-react";
import { Task, CalendarDay } from "../types";

interface TaskCalendarProps {
  tasks: Task[];
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
}

export default function TaskCalendar({
  tasks,
  selectedDate,
  onSelectDate,
}: TaskCalendarProps) {
  // Generate 7 rolling days starting from today
  const getRollingWeek = (): CalendarDay[] => {
    const days: CalendarDay[] = [];
    const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const today = new Date();

    for (let i = -2; i < 5; i++) {
      const current = new Date();
      current.setDate(today.getDate() + i);
      const year = current.getFullYear();
      const month = (current.getMonth() + 1).toString().padStart(2, "0");
      const dateStr = current.getDate().toString().padStart(2, "0");
      const formattedDate = `${year}-${month}-${dateStr}`;

      const filteredTasks = tasks.filter((task) => {
        if (!task.time) return false;
        return task.time.startsWith(formattedDate);
      });

      days.push({
        date: formattedDate,
        dayName: dayNames[current.getDay()],
        dayNum: current.getDate(),
        isToday: i === 0,
        tasks: filteredTasks,
      });
    }
    return days;
  };

  const rollingWeek = getRollingWeek();

  // Stats calculation
  const totalCompleted = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  // Breakdown by priority
  const highPriorityTasks = tasks.filter((t) => t.priority === "high");
  const highPriorityCompleted = highPriorityTasks.filter((t) => t.completed).length;
  const highPriorityRate = highPriorityTasks.length > 0
    ? Math.round((highPriorityCompleted / highPriorityTasks.length) * 100)
    : 100;

  // Category statistics for the SVG layout
  const categories = Array.from(new Set(tasks.map((t) => t.category || "其它")));
  const categoryStats = categories.map((cat) => {
    const total = tasks.filter((t) => t.category === cat).length;
    const completed = tasks.filter((t) => t.category === cat && t.completed).length;
    return { name: cat, total, completed };
  }).slice(0, 4); // Limit to top 4 for visual simplicity

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-5 shadow-2xl h-full flex flex-col space-y-5 text-[#e0e0e0]">
      {/* Calendar Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
            <Calendar className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm md:text-base tracking-tight">智能周视图日程</h3>
            <p className="text-xs text-white/40 font-mono">CALENDAR SCHEDULE OVERVIEW</p>
          </div>
        </div>
        <div className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase bg-cyan-500/15 border border-cyan-500/30 rounded-full py-0.5 px-2">
          WEEK VIEW
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-2">
        {rollingWeek.map((day) => {
          const isSelected = selectedDate === day.date;
          const completedCount = day.tasks.filter((t) => t.completed).length;
          const totalCount = day.tasks.length;

          return (
            <button
              id={`calendar-day-${day.date}`}
              key={day.date}
              onClick={() => onSelectDate(isSelected ? "" : day.date)}
              className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 relative border ${
                isSelected
                  ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)] transform scale-102"
                  : day.isToday
                  ? "bg-white/10 border-white/20 text-white font-bold"
                  : "bg-white/5 hover:bg-white/10 border-white/5 text-white/60"
              }`}
            >
              <span className={`text-[9px] font-bold uppercase tracking-wider ${isSelected ? "text-cyan-200" : "text-white/40"}`}>
                {day.dayName}
              </span>
              <span className="text-sm md:text-base font-extrabold font-mono mt-0.5">
                {day.dayNum}
              </span>

              {/* Task Indicator dots */}
              <div className="flex items-center justify-center space-x-0.5 mt-1 h-1">
                {totalCount > 0 ? (
                  <>
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected
                          ? "bg-cyan-300"
                          : completedCount === totalCount
                          ? "bg-emerald-400"
                          : "bg-orange-400"
                      }`}
                    />
                    {totalCount > 1 && (
                      <span className={`text-[8px] font-bold ${isSelected ? "text-cyan-200" : "text-white/40"}`}>
                        +{totalCount - 1}
                      </span>
                    )}
                  </>
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-transparent" />
                )}
              </div>

              {/* Today marker */}
              {day.isToday && !isSelected && (
                <div className="absolute top-1 right-1 w-1 h-1 bg-cyan-400 rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Task Filters helper info */}
      {selectedDate && (
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-3 py-2 flex items-center justify-between text-xs text-cyan-300">
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
            <span>过滤查看: <strong className="font-mono text-white">{selectedDate}</strong> 的日程</span>
          </div>
          <button
            onClick={() => onSelectDate("")}
            className="hover:underline font-bold text-cyan-400 cursor-pointer"
          >
            清除筛选
          </button>
        </div>
      )}

      {/* Productivity Chart (Pure SVG layout - beautiful and responsive) */}
      <div className="border-t border-white/10 pt-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-white/70 flex items-center space-x-1.5 uppercase tracking-wider font-mono">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>PROD INDEX 效能指数</span>
            </span>
            <span className="text-xs font-mono font-extrabold text-cyan-400">
              {completionRate}% COMPLETE
            </span>
          </div>

          {/* SVG Progress Arc Chart */}
          <div className="flex items-center justify-around py-1">
            <div className="relative w-20 h-20 flex items-center justify-center">
              {/* SVG Ring */}
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  className="stroke-white/5 stroke-[6px] fill-transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  className="stroke-cyan-500 stroke-[6px] fill-transparent transition-all duration-1000 ease-out"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - completionRate / 100)}`}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-base font-black font-mono text-white">{completionRate}%</span>
                <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Rate</span>
              </div>
            </div>

            <div className="flex flex-col space-y-1.5 text-xs text-white/70 w-1/2 font-mono">
              <div className="flex justify-between items-center">
                <span className="text-white/40 text-[10px]">🔥 HIGH PRIORITY:</span>
                <span className="font-bold text-orange-400">{highPriorityRate}%</span>
              </div>
              <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-orange-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${highPriorityRate}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] pt-1">
                <span className="text-white/40">📅 TOTAL:</span>
                <span className="font-bold text-white">{totalTasks} ITEMS</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-white/40">✅ FINISHED:</span>
                <span className="font-bold text-cyan-400">{totalCompleted} ITEMS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Categorized list mini-bars */}
        <div className="space-y-2 pt-2">
          <span className="text-[10px] font-bold text-white/30 block uppercase tracking-widest font-mono">
            CATEGORY DISTRIBUTION / 领域比重
          </span>
          <div className="grid grid-cols-2 gap-2">
            {categoryStats.length > 0 ? (
              categoryStats.map((cat) => {
                const percent = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0;
                return (
                  <div key={cat.name} className="bg-white/5 border border-white/5 rounded-xl p-2 flex flex-col justify-between">
                    <div className="flex justify-between items-center text-[11px] font-mono">
                      <span className="font-medium text-white/70 truncate">{cat.name}</span>
                      <span className="text-white/30">{cat.completed}/{cat.total}</span>
                    </div>
                    <div className="w-full bg-white/10 h-1 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-cyan-500 h-full rounded-full"
                        style={{ width: `${(cat.total / (totalTasks || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 text-center py-2 text-[10px] text-white/30 italic font-mono">
                NO CATEGORIZED METRICS YET
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
