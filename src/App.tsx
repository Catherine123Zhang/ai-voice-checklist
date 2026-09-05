import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  CheckCircle, 
  Circle, 
  Trash2, 
  Sparkles, 
  Calendar, 
  Clock, 
  Smartphone, 
  ChevronLeft,
  Filter,
  Plus,
  ExternalLink
} from "lucide-react";
import { Task } from "./types";
import VoiceTaskInput from "./components/VoiceTaskInput";
import TaskCalendar from "./components/TaskCalendar";
import PhoneGuideModal from "./components/PhoneGuideModal";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [showWeekView, setShowWeekView] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>("");
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [appUrl, setAppUrl] = useState("https://ais-pre-x5l5oy72xhbio7ewjj25jm-114587010738.asia-southeast1.run.app");

  // Format today's date
  const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, "0");
    const date = d.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${date}`;
  };

  const todayStr = getTodayStr();

  // Retrieve origin URL on mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.origin) {
      setAppUrl(window.location.origin);
    }
  }, []);

  // Load saved tasks or seed initial tasks
  useEffect(() => {
    const saved = localStorage.getItem("ai_voice_checklist_tasks");
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved tasks", e);
      }
    } else {
      const seedTasks: Task[] = [
        {
          id: "seed-1",
          title: "去机场接老李",
          time: `${todayStr} 15:00`,
          note: "记得带上那份合同（大模型智能提取）",
          completed: false,
          createdAt: new Date().toISOString(),
          priority: "high",
          category: "出行 ✈️",
        },
        {
          id: "seed-2",
          title: "与团队开周会并同步进度",
          time: `${todayStr} 10:00`,
          note: "提前准备好周报与候选人简历",
          completed: true,
          createdAt: new Date().toISOString(),
          priority: "medium",
          category: "会议 💻",
        },
        {
          id: "seed-3",
          title: "去菜鸟驿站拿快递",
          time: `${todayStr} 18:30`,
          note: "顺路买一箱纯牛奶",
          completed: false,
          createdAt: new Date().toISOString(),
          priority: "low",
          category: "备忘 📦",
        },
      ];
      setTasks(seedTasks);
      localStorage.setItem("ai_voice_checklist_tasks", JSON.stringify(seedTasks));
    }
  }, [todayStr]);

  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem("ai_voice_checklist_tasks", JSON.stringify(newTasks));
  };

  // Add tasks parsed from AI (DeepSeek V3)
  const handleAddTasks = (
    newParsedTasks: { task: string; time: string; note: string }[],
    modelUsed?: string
  ) => {
    const freshTasks: Task[] = newParsedTasks.map((t, index) => {
      let category = "一般 📝";
      if (t.task.includes("会") || t.task.includes("工作") || t.task.includes("沟通")) category = "工作 💻";
      else if (t.task.includes("机") || t.task.includes("车") || t.task.includes("接")) category = "出行 ✈️";
      else if (t.task.includes("吃") || t.task.includes("买") || t.task.includes("聚")) category = "生活 🍽️";
      else if (t.task.includes("递") || t.task.includes("邮") || t.task.includes("拿")) category = "日常 📦";

      let priority: "high" | "medium" | "low" = "medium";
      if (t.note.includes("记得") || t.note.includes("合同") || t.task.includes("重要")) {
        priority = "high";
      } else if (t.task.includes("顺路") || t.note.includes("顺便")) {
        priority = "low";
      }

      // If time didn't specify date, default to today
      let taskTime = t.time;
      if (!taskTime || !taskTime.includes("-")) {
        taskTime = `${todayStr} ${taskTime || "12:00"}`.trim();
      }

      return {
        id: `task-${Date.now()}-${index}`,
        title: t.task,
        time: taskTime,
        note: t.note,
        completed: false,
        createdAt: new Date().toISOString(),
        priority,
        category,
        modelUsed: modelUsed || "DeepSeek V3",
      };
    });

    saveTasks([...freshTasks, ...tasks]);
  };

  // Toggle complete
  const handleToggleTask = (id: string) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    saveTasks(updated);
  };

  // Delete task
  const handleDeleteTask = (id: string) => {
    const filtered = tasks.filter((t) => t.id !== id);
    saveTasks(filtered);
  };

  // Cycle priority
  const handleCyclePriority = (id: string) => {
    const nextMap: Record<"high" | "medium" | "low", "high" | "medium" | "low"> = {
      high: "medium",
      medium: "low",
      low: "high",
    };
    const updated = tasks.map((t) => (t.id === id ? { ...t, priority: nextMap[t.priority] } : t));
    saveTasks(updated);
  };

  // Filter tasks for Today vs Calendar date
  const activeDate = showWeekView && selectedCalendarDate ? selectedCalendarDate : todayStr;
  const displayTasks = tasks.filter((t) => {
    if (!t.time) return true;
    return t.time.startsWith(activeDate);
  });

  const todayTotalCount = displayTasks.length;
  const todayCompletedCount = displayTasks.filter((t) => t.completed).length;

  return (
    <div className="min-h-screen bg-[#07080b] text-[#e0e0e0] font-sans antialiased selection:bg-cyan-500 selection:text-black flex flex-col justify-between">
      {/* Background soft ambient glow */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[45%] h-[45%] rounded-full bg-cyan-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] rounded-full bg-blue-600/5 blur-[120px]" />
      </div>

      {/* Header Bar */}
      <header className="relative z-10 border-b border-white/5 bg-[#090b10]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-4 h-4 text-black" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center space-x-2">
              <span>AI 语音智能清单</span>
              <span className="text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-md py-0.5 px-1.5 font-mono">
                DeepSeek V3
              </span>
            </h1>
            <p className="text-[11px] text-white/40 hidden sm:block">
              语音直出日程 • 大模型智能拆解 • 极简聚焦模式
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Open in full tab / independent browser window */}
          <a
            href={appUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden md:flex items-center space-x-1.5 py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition text-xs font-semibold cursor-pointer"
            title="在新标签页中全屏运行，获得完整麦克风权限"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span>新窗口全屏打开</span>
          </a>

          {/* Guide & Export Modal button */}
          <button
            id="open-phone-guide-btn"
            onClick={() => setShowPhoneModal(true)}
            className="flex items-center space-x-1.5 py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition text-xs font-semibold cursor-pointer"
            title="查看手机/微信试用、Google Play发布及GitHub导出教程"
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">试用与发布指南</span>
            <span className="sm:hidden">试用/发布</span>
          </button>

          {/* Toggle Week View */}
          <button
            id="toggle-week-view-btn"
            onClick={() => {
              setShowWeekView(!showWeekView);
              if (!showWeekView) {
                setSelectedCalendarDate(todayStr);
              }
            }}
            className={`flex items-center space-x-1.5 py-1.5 px-3 rounded-xl border text-xs font-bold transition duration-200 cursor-pointer ${
              showWeekView
                ? "bg-cyan-500 text-black border-cyan-500 shadow-lg shadow-cyan-500/20"
                : "bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{showWeekView ? "返回今日清单" : "周视图"}</span>
          </button>
        </div>
      </header>

      {/* Main Single-Screen Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 z-10 relative flex flex-col space-y-6">
        
        {/* VIEW 1: Week View (when user specifically toggles it) */}
        {showWeekView ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>周日程概览与效率统计</span>
                </h2>
                <p className="text-xs text-white/40 mt-0.5">
                  点击下方星期切换查看对应日期的任务安排
                </p>
              </div>

              <button
                onClick={() => setShowWeekView(false)}
                className="flex items-center space-x-1 text-xs text-cyan-400 hover:text-cyan-300 font-bold bg-cyan-500/10 border border-cyan-500/20 py-1.5 px-3 rounded-xl transition cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>返回今日聚焦</span>
              </button>
            </div>

            {/* Task Calendar component */}
            <TaskCalendar
              tasks={tasks}
              selectedDate={selectedCalendarDate}
              onSelectDate={(date) => setSelectedCalendarDate(date || todayStr)}
            />
          </motion.div>
        ) : (
          /* VIEW 2: Primary Ultra-Focused Screen (Voice Input + Today's Checklist) */
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* 1. Core Voice Input (Voice to Text + LLM Parse) */}
            <VoiceTaskInput
              onTasksAdded={handleAddTasks}
              isParsing={isParsing}
              setIsParsing={setIsParsing}
            />

            {/* 2. Today's Checklist (当天的清单 - 核心焦点) */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
              
              {/* Header of Today's Checklist */}
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center space-x-2">
                    <span>📅 今日待办清单</span>
                    <span className="text-[10px] bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 py-0.5 px-2 rounded-full font-mono font-bold tracking-wider uppercase">
                      Today
                    </span>
                  </h3>
                  <p className="text-xs text-white/40 mt-0.5">
                    {todayStr} • 仅展示今日事项，专注高效执行
                  </p>
                </div>

                {/* Counter Badge */}
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {todayCompletedCount} / {todayTotalCount} 已完成
                  </span>
                  {todayTotalCount > 0 && (
                    <div className="w-24 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 transition-all duration-300 rounded-full"
                        style={{ width: `${(todayCompletedCount / todayTotalCount) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Task Cards List */}
              <div className="space-y-3">
                {displayTasks.length > 0 ? (
                  displayTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-2xl border transition-all duration-200 flex items-start space-x-3.5 ${
                        task.completed
                          ? "bg-white/[0.02] border-white/5 opacity-60"
                          : "bg-white/[0.06] hover:bg-white/[0.08] border-white/10 hover:border-cyan-500/30 shadow-md"
                      }`}
                    >
                      {/* Checkbox button */}
                      <button
                        id={`toggle-task-${task.id}`}
                        onClick={() => handleToggleTask(task.id)}
                        className="mt-0.5 text-white/40 hover:text-cyan-400 transition cursor-pointer shrink-0"
                      >
                        {task.completed ? (
                          <CheckCircle className="w-5 h-5 text-cyan-400" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`font-semibold text-sm sm:text-base leading-snug break-words ${
                              task.completed
                                ? "line-through text-white/40 font-normal"
                                : "text-white"
                            }`}
                          >
                            {task.title}
                          </span>

                          {/* Priority badge */}
                          <button
                            id={`priority-cycle-${task.id}`}
                            onClick={() => handleCyclePriority(task.id)}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold transition cursor-pointer ${
                              task.priority === "high"
                                ? "bg-red-500/20 border border-red-500/30 text-red-300"
                                : task.priority === "medium"
                                ? "bg-amber-500/20 border border-amber-500/30 text-amber-300"
                                : "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                            }`}
                            title="点击切换重要度"
                          >
                            {task.priority === "high"
                              ? "重要"
                              : task.priority === "medium"
                              ? "普通"
                              : "顺延"}
                          </button>
                        </div>

                        {/* Metadata row: Time, Note & AI Badge */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-xs text-white/50">
                          {task.time && (
                            <div className="flex items-center space-x-1 text-cyan-400/90 font-mono font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{task.time.includes(" ") ? task.time.split(" ")[1] : task.time}</span>
                            </div>
                          )}

                          {task.note && (
                            <div className="text-white/60 truncate max-w-md">
                              📌 {task.note}
                            </div>
                          )}

                          {task.modelUsed && (
                            <div className="flex items-center space-x-1 text-[10px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded-md font-mono">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>{task.modelUsed}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        id={`delete-task-${task.id}`}
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-white/20 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 transition cursor-pointer shrink-0"
                        title="删除该事项"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl text-white/40 text-xs">
                    <p className="text-sm font-semibold text-white/60">🍃 今日暂无待办日程</p>
                    <p className="mt-1">点击上方麦克风直接说出你的安排，或点击下方的快捷示例体验！</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-3 px-6 text-center text-[11px] text-white/30">
        AI Voice Checklist • Powered by DeepSeek V3 大模型 • 专为手机与微信语音转文字定制
      </footer>

      {/* Phone WeChat Guide Modal */}
      <PhoneGuideModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        appUrl={appUrl}
      />
    </div>
  );
}
