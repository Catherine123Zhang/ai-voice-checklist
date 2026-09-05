import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, Square, Sparkles, AlertCircle, Volume2, MessageSquare, Smartphone, CheckCircle2, RotateCcw } from "lucide-react";
import { API_BASE_URL } from "../config";

interface VoiceTaskInputProps {
  onTasksAdded: (newTasks: { task: string; time: string; note: string }[], modelUsed?: string) => void;
  isParsing: boolean;
  setIsParsing: (val: boolean) => void;
}

export default function VoiceTaskInput({
  onTasksAdded,
  isParsing,
  setIsParsing,
}: VoiceTaskInputProps) {
  // Input method mode: 'wechat' (recommended on mobile) or 'webmic' (browser native mic)
  const [inputMode, setInputMode] = useState<"wechat" | "webmic">("wechat");
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);
  const [tipMessage, setTipMessage] = useState("");
  const [lastModelUsed, setLastModelUsed] = useState<string>("");

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const timerIntervalRef = useRef<any>(null);
  const textRef = useRef("");

  // Keep textRef updated for callbacks
  useEffect(() => {
    textRef.current = inputText;
  }, [inputText]);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = "zh-CN";
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsListening(true);
          setErrorMsg("");
          setTipMessage("正在持续倾听您的语音，说完后请再次点击按钮停止...");
        };

        recognition.onresult = (event: any) => {
          let finalTranscript = "";
          let interimTranscript = "";

          for (let i = 0; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          const combined = (finalTranscript + interimTranscript).trim();
          if (combined) {
            setInputText(combined);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          if (event.error === "not-allowed") {
            shouldListenRef.current = false;
            setIsListening(false);
            setErrorMsg("麦克风权限未开启。在手机上，推荐使用【微信输入法】直接语音转文字。");
          } else if (event.error === "no-speech") {
            console.log("No speech detected yet, continuing...");
          } else {
            setErrorMsg(`语音提示: ${event.error}`);
          }
        };

        recognition.onend = () => {
          if (shouldListenRef.current) {
            try {
              recognition.start();
            } catch (e) {
              console.warn("Restart recognition exception", e);
            }
          } else {
            setIsListening(false);
            clearInterval(timerIntervalRef.current);
            setRecordingSeconds(0);
          }
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.warn("Error initializing speech recognition", err);
      }
    }
  }, []);

  // Timer while listening
  useEffect(() => {
    if (isListening) {
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
      setRecordingSeconds(0);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isListening]);

  // Quick prompt templates
  const quickTemplates = [
    { label: "✈️ 机场接人", text: "明天下午三点去机场接老李，记得带上那份合同。" },
    { label: "💻 团队周会", text: "下周一上午十点在会议室和HR开会，记得带上候选人简历。" },
    { label: "🍽️ 晚间聚餐", text: "今晚八点去吃海底捞，记得提前半小时订桌。" },
    { label: "📦 取顺丰快递", text: "今天下班顺路去菜鸟驿站拿快递，顺便买一箱牛奶。" },
  ];

  // Trigger continuous speech recognition or stop
  const handleToggleListening = () => {
    if (isListening) {
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn("stop error", e);
        }
      }
      setIsListening(false);
      setTipMessage("录音已停止！");

      const currentText = textRef.current.trim();
      if (currentText) {
        setTipMessage("🎙️ 录音完成，正在由大模型深度拆解任务...");
        triggerAIParse(currentText);
      }
      return;
    }

    // Start recording
    if (speechSupported && recognitionRef.current) {
      try {
        shouldListenRef.current = true;
        recognitionRef.current.start();
        return;
      } catch (e) {
        console.warn("recognition start error, will focus textarea instead", e);
      }
    }

    // Fallback: focus textarea for WeChat input method on mobile
    if (textareaRef.current) {
      textareaRef.current.focus();
      setTipMessage("已为您聚焦输入框！在手机上按住微信输入法空格键说话即可。");
      setTimeout(() => setTipMessage(""), 5000);
    }
  };

  // Submit to LLM
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    triggerAIParse(inputText);
  };

  // Quick template insertion
  const handleQuickTemplateClick = (text: string) => {
    setInputText(text);
    triggerAIParse(text);
  };

  const triggerAIParse = async (textToParse: string) => {
    if (!textToParse.trim()) return;
    setIsParsing(true);
    setErrorMsg("");
    setTipMessage("🤖 DeepSeek V3 大模型正在深度解析时间、任务与备忘...");

    try {
      const response = await fetch(`${API_BASE_URL}/api/parse-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToParse,
          clientTime: new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "DeepSeek 大模型服务响应异常，请重试");
      }

      const data = await response.json();
      if (data.tasks && Array.isArray(data.tasks) && data.tasks.length > 0) {
        const modelName = data.modelUsed || "DeepSeek V3";
        setLastModelUsed(modelName);
        onTasksAdded(data.tasks, modelName);
        setInputText("");
        setTipMessage(`🎉 成功！已由【${modelName}】深度提取 ${data.tasks.length} 项日程并加入清单！`);
        setTimeout(() => setTipMessage(""), 5000);
      } else {
        setErrorMsg("DeepSeek 未能从语句中提取到具体安排，请尝试更清晰的时间描述。");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "连接 DeepSeek 服务失败，请重试");
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.03] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-md">
      {/* Mode Switcher: WeChat Input Method vs Web Microphone */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setInputMode("wechat")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              inputMode === "wechat"
                ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30"
                : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>微信输入法 (手机首选)</span>
          </button>

          <button
            type="button"
            onClick={() => setInputMode("webmic")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              inputMode === "webmic"
                ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/30"
                : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>网页麦克风 (长语音)</span>
          </button>
        </div>

        <div className="flex items-center space-x-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>引擎: {lastModelUsed || "DeepSeek V3"}</span>
        </div>
      </div>

      {/* Mode 1: WeChat Voice-to-Text Mode */}
      {inputMode === "wechat" && (
        <div className="space-y-3">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 text-xs text-emerald-300 flex items-start space-x-2.5">
            <MessageSquare className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">📱 微信输入法语音使用方式：</span>
              <span> 点击下方输入框唤起键盘，长按微信输入法【空格键】说话转文字，说完后点击下方绿色的【⚡ DeepSeek V3 智能拆解并加入待办】按钮即可！</span>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Web Microphone Continuous Mode */}
      {inputMode === "webmic" && (
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-2">
          <div className="relative flex items-center justify-center">
            {isListening && (
              <>
                <motion.div
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 1.6, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                  className="absolute w-24 h-24 rounded-full bg-rose-500/40 pointer-events-none"
                />
                <motion.div
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 1.3, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: 0.4, ease: "easeOut" }}
                  className="absolute w-24 h-24 rounded-full bg-amber-500/30 pointer-events-none"
                />
              </>
            )}

            <button
              id="main-voice-button"
              type="button"
              onClick={handleToggleListening}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer ${
                isListening
                  ? "bg-gradient-to-tr from-rose-500 to-amber-500 text-black scale-105 shadow-rose-500/50 ring-4 ring-rose-500/30"
                  : "bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black hover:scale-105 shadow-cyan-500/30"
              }`}
              title={isListening ? "点击停止录音并自动提交大模型" : "点击开始录音（说话不会中途截断）"}
            >
              {isListening ? (
                <div className="flex flex-col items-center justify-center">
                  <Square className="w-7 h-7 fill-black text-black" />
                  <span className="text-[9px] font-black tracking-tighter mt-0.5">停止</span>
                </div>
              ) : (
                <Mic className="w-8 h-8 text-black" />
              )}
            </button>
          </div>

          <div>
            {isListening ? (
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-2 bg-rose-500/20 border border-rose-500/40 text-rose-300 px-3.5 py-1 rounded-full text-xs font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span>正在收音 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}</span>
                </div>
                <p className="text-xs text-cyan-400 font-medium pt-1">
                  说完后，<strong>再次点击上方按钮即可停止</strong>，系统将自动送往大模型分析
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  点击麦克风开始说话（再次点击为停止）
                </h2>
                <p className="text-xs text-white/50 mt-1">
                  长语音不中断模式：适合在电脑浏览器或支持麦克风的独立窗口使用
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Form & Textarea */}
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div className="relative bg-black/40 border border-white/10 hover:border-emerald-500/30 focus-within:border-emerald-500 rounded-2xl p-3 transition duration-200">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={
              inputMode === "wechat"
                ? "轻触此处唤起微信输入法，按住空格说话转文字，如：“明天下午三点去机场接老李，记得带上那份合同”..."
                : "识别出的文字将显示在此处，亦可直接手动编辑或补充..."
            }
            className="w-full bg-transparent border-0 outline-none ring-0 focus:ring-0 text-sm sm:text-base text-white placeholder-white/30 min-h-[72px] max-h-[140px] resize-none p-1 font-sans"
            disabled={isParsing}
          />

          <div className="flex justify-between items-center border-t border-white/5 pt-2.5 mt-1">
            <div className="flex items-center space-x-2 text-xs text-white/40">
              {inputText.trim() && (
                <button
                  type="button"
                  onClick={() => setInputText("")}
                  className="flex items-center space-x-1 text-white/40 hover:text-white transition cursor-pointer"
                  title="清空输入"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>清空</span>
                </button>
              )}
              <span className="hidden sm:inline font-mono text-[11px] text-white/30">
                {inputText.length > 0 ? `${inputText.length} 字` : "支持自然语言模糊时间描述"}
              </span>
            </div>

            <button
              type="submit"
              id="submit-parse-btn"
              disabled={isParsing || !inputText.trim()}
              className={`py-2.5 px-5 rounded-full font-bold text-xs sm:text-sm flex items-center space-x-2 transition-all duration-200 cursor-pointer shadow-lg ${
                !inputText.trim() || isParsing
                  ? "bg-white/5 text-white/30 cursor-not-allowed"
                  : inputMode === "wechat"
                  ? "bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-500/30 hover:scale-[1.02]"
                  : "bg-cyan-500 text-black hover:bg-cyan-400 shadow-cyan-500/30 hover:scale-[1.02]"
              }`}
            >
              {isParsing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-1.5 h-4 w-4 text-black" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>DeepSeek V3 智能拆解中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>⚡ DeepSeek V3 智能提取并加入待办</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tip / Success Feedback */}
        <AnimatePresence>
          {tipMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2.5 text-xs text-emerald-300 flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{tipMessage}</span>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 text-xs text-red-400 flex items-center space-x-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Click-to-Test Templates */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-[11px] text-white/40 mb-2 font-mono">
            <span>💡 也可以点击以下常用语句一键体验大模型提取：</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {quickTemplates.map((item, idx) => (
              <button
                key={idx}
                type="button"
                id={`quick-template-${idx}`}
                onClick={() => handleQuickTemplateClick(item.text)}
                disabled={isParsing || isListening}
                className="bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/40 p-2.5 rounded-2xl text-left transition duration-200 cursor-pointer group flex flex-col justify-between"
              >
                <span className="text-xs font-bold text-white group-hover:text-emerald-400 truncate w-full">
                  {item.label}
                </span>
                <span className="text-[10px] text-white/40 group-hover:text-white/70 line-clamp-1 mt-1 leading-normal">
                  {item.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
