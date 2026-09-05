import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, Send, Sparkles, AlertCircle, HelpCircle } from "lucide-react";
import { Task } from "../types";

interface TaskFormProps {
  onTasksAdded: (newTasks: { task: string; time: string; note: string }[]) => void;
  isListening: boolean;
  setIsListening: (val: boolean) => void;
  voiceText: string;
  setVoiceText: (val: string) => void;
}

export default function TaskForm({
  onTasksAdded,
  isListening,
  setIsListening,
  voiceText,
  setVoiceText,
}: TaskFormProps) {
  const [inputText, setInputText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showTip, setShowTip] = useState(false);

  // Pre-configured voice prompt suggestions for easy one-click testing
  const suggestions = [
    {
      text: "明天下午三点去机场接老李，记得带上那份合同。",
      label: "✈️ 机场接人",
    },
    {
      text: "下周一上午十点和HR开会，提醒带上简历，在会议室进行。",
      label: "💻 团队周会",
    },
    {
      text: "今晚八点去吃西餐，记得提前半小时订桌，选靠窗位置。",
      label: "🍽️ 晚间约会",
    },
    {
      text: "今天下班顺路买一箱牛奶，还要记得拿菜鸟驿站的快递。",
      label: "📦 顺路取件",
    },
  ];

  // Simulated Speech-to-Text Typing Effect
  const handleSimulateVoice = (fullText: string) => {
    if (isListening || isParsing) return;
    setIsListening(true);
    setVoiceText("");
    setInputText("");

    let currentLength = 0;
    const interval = setInterval(() => {
      if (currentLength < fullText.length) {
        currentLength += Math.min(2, fullText.length - currentLength);
        const chunk = fullText.slice(0, currentLength);
        setVoiceText(chunk);
        setInputText(chunk);
      } else {
        clearInterval(interval);
        setIsListening(false);
        // Automatically trigger AI parse after vocalization simulation finishes
        triggerAIParse(fullText);
      }
    }, 80);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    triggerAIParse(inputText);
  };

  const triggerAIParse = async (textToParse: string) => {
    if (!textToParse.trim()) return;
    setIsParsing(true);
    setErrorMsg("");

    try {
      const response = await fetch("/api/parse-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToParse,
          clientTime: new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }),
        }),
      });

      if (!response.ok) {
        throw new Error("大模型服务响应异常，请重试");
      }

      const data = await response.json();
      if (data.tasks && Array.isArray(data.tasks) && data.tasks.length > 0) {
        onTasksAdded(data.tasks);
        setInputText("");
        setVoiceText("");
      } else {
        setErrorMsg("未能解析出具体日程，请提供明确的时间和内容词汇");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "连接大模型服务失败");
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-5 shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-white text-sm md:text-base flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
          <span>大模型一键生成清单</span>
        </h3>
        <button
          type="button"
          onClick={() => setShowTip(!showTip)}
          className="p-1 hover:bg-white/10 rounded-lg text-white/40 hover:text-white/80 transition cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="bg-cyan-950/20 border border-cyan-800/30 rounded-2xl p-3.5 text-xs text-cyan-200/90 leading-relaxed">
              <p className="font-bold flex items-center space-x-1 mb-1 text-cyan-400">
                <span>💡 使用窍门 / Prompt Secret:</span>
              </p>
              <p>
                直接输入自然语言或录入语音。大模型秘书（DeepSeek）将深度拆解
                <strong>日程主题</strong>、<strong>时间标准（标准化格式）</strong>及<strong>随带备忘</strong>。
              </p>
              <p className="mt-1 opacity-85">
                示例: "明天下午三点去机场接老李，记得带上那份合同。"
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input Wrapper */}
        <div className="relative bg-black/40 border border-white/10 hover:border-cyan-500/30 focus-within:border-cyan-500 rounded-2xl p-2.5 transition duration-300">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isListening
                ? "正在模拟聆听 Vivo 折叠屏手机麦克风录入..."
                : "“明天下午三点去机场接老李，记得带上那份合同”"
            }
            className="w-full bg-transparent border-0 outline-none ring-0 focus:ring-0 text-sm text-white placeholder-white/30 min-h-[60px] max-h-[120px] resize-y p-1 font-sans"
            disabled={isParsing || isListening}
          />

          <div className="flex justify-between items-center border-t border-white/5 pt-2 px-1">
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                id="mic-record-btn"
                onClick={() => handleSimulateVoice("明天下午三点去机场接老李，记得带上那份合同。")}
                className={`p-1.5 rounded-xl flex items-center space-x-1 transition text-xs font-semibold cursor-pointer ${
                  isListening
                    ? "bg-red-500/20 text-red-400 animate-pulse"
                    : "text-white/50 hover:bg-white/5 hover:text-cyan-400"
                }`}
                title="模拟折叠屏手机麦克风录音"
              >
                <Mic className="w-4 h-4" />
                <span>{isListening ? "收音中..." : "模拟录音"}</span>
              </button>
            </div>

            <button
              type="submit"
              id="ai-generate-btn"
              disabled={isParsing || isListening || !inputText.trim()}
              className={`py-1.5 px-4 rounded-full font-bold text-xs flex items-center space-x-1.5 transition-all duration-300 cursor-pointer ${
                !inputText.trim()
                  ? "bg-white/5 text-white/30 cursor-not-allowed"
                  : "bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              }`}
            >
              {isParsing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-1 h-3.5 w-3.5 text-black" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>大模型智能编排...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>生成清单</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Suggestion list */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-white/30 block uppercase tracking-widest font-mono">
            🎤 VOICE TEMPLATES / 语音输入快速模板
          </span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {suggestions.map((sug, idx) => (
              <button
                id={`voice-sug-btn-${idx}`}
                type="button"
                key={idx}
                onClick={() => handleSimulateVoice(sug.text)}
                className="bg-white/5 border border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/5 text-[#e0e0e0] p-2.5 rounded-2xl text-left transition duration-300 flex flex-col justify-between group cursor-pointer h-20"
              >
                <span className="text-xs font-bold text-white group-hover:text-cyan-400 truncate w-full transition duration-300">
                  {sug.label}
                </span>
                <span className="text-[10px] text-white/40 line-clamp-2 mt-1.5 w-full leading-normal">
                  {sug.text}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Error Feedback */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 flex items-center space-x-2 text-xs text-red-400"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
