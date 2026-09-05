import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Volume2, Sparkles, Flame, Mic } from "lucide-react";
import { Task } from "../types";

interface ActiveCountdownProps {
  tasks: Task[];
  isListening: boolean;
  onListeningToggle: () => void;
  voiceText: string;
}

export default function ActiveCountdown({
  tasks,
  isListening,
  onListeningToggle,
  voiceText,
}: ActiveCountdownProps) {
  const [time, setTime] = useState(new Date());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Find the next upcoming, incomplete task
  const upcomingTasks = tasks
    .filter((t) => !t.completed && t.time)
    .map((t) => ({ ...t, dateObj: new Date(t.time.replace(" ", "T")) }))
    .filter((t) => t.dateObj.getTime() > Date.now())
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  const nextTask = upcomingTasks[0] || null;

  const [timeLeft, setTimeLeft] = useState<string>("00:00:00");

  // Keep clock and countdown updated
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
      if (nextTask) {
        const diff = nextTask.dateObj.getTime() - Date.now();
        if (diff <= 0) {
          setTimeLeft("已到日程时间");
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
          const minutes = Math.floor((diff / (1000 * 60)) % 60);
          const seconds = Math.floor((diff / 1000) % 60);

          let str = "";
          if (days > 0) str += `${days}天 `;
          str += `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
          setTimeLeft(str);
        }
      } else {
        setTimeLeft("00:00:00");
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextTask]);

  // Audio wave animation (cyan theme)
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let count = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const barsCount = 35;
      const barWidth = width / barsCount - 2;

      for (let i = 0; i < barsCount; i++) {
        let value = 4;
        if (isListening) {
          value = Math.abs(
            Math.sin(i * 0.25 + count * 0.2) * (height * 0.75) +
              Math.cos(i * 0.12 - count * 0.15) * (height * 0.2)
          );
          value = Math.max(value, 6);
        } else {
          value = Math.abs(Math.sin(i * 0.15 + count * 0.03) * 5) + 3;
        }

        const x = i * (barWidth + 2);
        const y = height / 2 - value / 2;

        const gradient = ctx.createLinearGradient(x, y, x, y + value);
        if (isListening) {
          gradient.addColorStop(0, "#22d3ee"); // cyan-400
          gradient.addColorStop(0.5, "#06b6d4"); // cyan-500
          gradient.addColorStop(1, "#0891b2"); // cyan-600
        } else {
          gradient.addColorStop(0, "#4b5563");
          gradient.addColorStop(1, "#1f2937");
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, value, 2);
        ctx.fill();
      }

      count++;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isListening]);

  const daysOfWeek = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const formattedDate = `${time.getFullYear()}年${(time.getMonth() + 1)
    .toString()
    .padStart(2, "0")}月${time.getDate().toString().padStart(2, "0")}日`;
  const formattedDay = daysOfWeek[time.getDay()];
  const formattedClock = time.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <div className="bg-gradient-to-tr from-[#0a0a0a] to-[#12141a] border border-white/10 text-[#e0e0e0] rounded-3xl p-6 shadow-2xl h-full flex flex-col justify-between relative overflow-hidden">
      {/* Absolute Neon Glow background decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none" />

      {/* Header Info */}
      <div className="flex justify-between items-start z-10">
        <div>
          <h2 className="text-sm font-semibold text-white/50 flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{formattedDate} {formattedDay}</span>
          </h2>
          <p className="text-xs text-white/30 font-mono mt-0.5">VIVO FOLD 5 STAND ASSISTANT</p>
        </div>
        <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full py-1 px-3">
          <div className={`w-2 h-2 rounded-full ${isListening ? "bg-cyan-400 animate-ping" : "bg-emerald-400"}`} />
          <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
            {isListening ? "DEEPSEEK LISTENING" : "DEEPSEEK V3 READY"}
          </span>
        </div>
      </div>

      {/* Immersive Circular Countdown display */}
      <div className="flex items-center justify-center py-6 z-10 my-auto">
        <div className="w-60 h-60 rounded-full border border-cyan-500/20 flex items-center justify-center relative">
          {/* Pulsing ring outer */}
          <div className={`absolute w-52 h-52 rounded-full border border-cyan-500/40 ${isListening ? "animate-ping" : "animate-pulse"}`} />
          <div className="absolute w-44 h-44 rounded-full bg-cyan-500/5 blur-2xl" />
          
          <div className="text-center z-10 px-4">
            <p className="text-3xl font-light text-white tracking-wide mb-1 font-mono">{formattedClock}</p>
            {nextTask ? (
              <>
                <p className="text-cyan-400 font-bold tracking-tight text-sm line-clamp-2 max-w-[150px] mx-auto">
                  {nextTask.title}
                </p>
                <p className="text-[10px] text-white/40 mt-3 font-mono">
                  倒计时 {timeLeft}
                </p>
              </>
            ) : (
              <>
                <p className="text-white/60 text-xs font-semibold">今日全部结清</p>
                <p className="text-[10px] text-white/30 mt-2">点击麦克风输入新命令</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer: Voice soundwave and voice text display */}
      <div className="border-t border-white/5 pt-4 z-10 flex flex-col space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-white/40 font-mono tracking-widest uppercase">
            SPEECH SPECTRUM (DYNAMIC)
          </span>
          {isListening && (
            <span className="text-[10px] text-cyan-400 font-mono animate-pulse">
              TRANSCRIPTION ACTIVE
            </span>
          )}
        </div>

        <div className="relative bg-black/40 rounded-2xl p-2.5 h-12 flex items-center overflow-hidden border border-white/10">
          <canvas ref={canvasRef} width={450} height={30} className="w-full h-8 pointer-events-none opacity-80" />
          
          <button
            id="countdown-mic-btn"
            onClick={onListeningToggle}
            className={`absolute right-2 p-2 rounded-xl transition-all duration-300 shadow-md ${
              isListening
                ? "bg-cyan-400 text-black animate-bounce shadow-cyan-400/30"
                : "bg-white/10 text-white hover:bg-white/20 hover:text-cyan-400"
            }`}
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {voiceText ? (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white/5 rounded-xl p-2.5 border border-white/10"
            >
              <p className="text-xs text-cyan-200/90 italic font-mono font-medium line-clamp-1">
                🗣️ "{voiceText}"
              </p>
            </motion.div>
          ) : (
            <div className="h-4 flex items-center">
              <span className="text-[10px] text-white/30 tracking-tight">
                💡 输入：“明天下午三点去机场接老李，记得带上那份合同”
              </span>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
