import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialize Gemini client to avoid crashing if GEMINI_API_KEY is not initially set
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ Warning: GEMINI_API_KEY is not set. The app will fall back to rule-based mock parsing.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Endpoint to parse text into structured tasks using DeepSeek or Gemini
app.post("/api/parse-task", async (req, res) => {
  const { text, clientTime } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Text prompt is required" });
  }

  // Smartly resolve DeepSeek API Key and Base URL (in case keys are swapped in environment variables)
  const envKey = (process.env.DEEPSEEK_API_KEY || "").trim();
  const envBase = (process.env.DEEPSEEK_API_BASE || "").trim();

  let deepseekApiKey = "";
  let deepseekApiBase = "https://api.deepseek.com";

  if (envKey.startsWith("sk-")) {
    deepseekApiKey = envKey;
  } else if (envBase.startsWith("sk-")) {
    deepseekApiKey = envBase;
  }

  if (envBase.startsWith("http://") || envBase.startsWith("https://")) {
    deepseekApiBase = envBase.replace(/\/+$/, "");
  } else if (envKey.startsWith("http://") || envKey.startsWith("https://")) {
    deepseekApiBase = envKey.replace(/\/+$/, "");
  }

  const currentTimeStr = clientTime || new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });

  const systemInstruction = `你是一个专业的日程与待办事项智能拆解助手。
当前系统参考时间是：${currentTimeStr}。
请从用户输入的自然语言中，智能分析并提取待办日程任务。
必须仅输出合法的 JSON 格式（可以直接是 JSON 数组，或者包含 tasks 数组的 JSON 对象）。
每个任务项包含字段：
- task: 核心任务动作与标题（如"去机场接老李"、"开部门周会"）
- time: 规范化的高精度时间字符串（格式："YYYY-MM-DD HH:mm"）。对于“明天下午三点”、“后天早上十点”等相对时间描述，请严格结合当前参考时间计算出准确的公历日期与时间。如未提及具体时间，结合语境合理规划，不要为空。
- note: 随带备忘、重要提醒、地点或注意事项（如"记得带上那份合同"、"地点：3号会议室"），若无则为空字符串 ""。
示例输出：[{"task": "去机场接老李", "time": "2026-09-06 15:00", "note": "记得带上那份合同"}]`;

  // Use DeepSeek V3 exclusively as requested by user
  if (deepseekApiKey) {
    try {
      console.log(`Calling DeepSeek V3 API at ${deepseekApiBase}/v1/chat/completions ...`);
      const response = await fetch(`${deepseekApiBase}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${deepseekApiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat", // DeepSeek V3
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: `用户输入："${text}"` }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`DeepSeek API error status: ${response.status} - ${errorBody}`);
        throw new Error(`DeepSeek API 接口返回异常 (${response.status})`);
      }

      const data = await response.json();
      const contentStr = data.choices?.[0]?.message?.content || "{}";
      const cleaned = contentStr
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      let parsedJson = JSON.parse(cleaned);
      let tasksArray: any[] = [];
      if (Array.isArray(parsedJson)) {
        tasksArray = parsedJson;
      } else if (parsedJson.tasks && Array.isArray(parsedJson.tasks)) {
        tasksArray = parsedJson.tasks;
      } else {
        tasksArray = [parsedJson];
      }

      console.log("DeepSeek V3 extracted tasks successfully:", tasksArray);
      return res.json({ tasks: tasksArray, isMock: false, modelUsed: "DeepSeek V3" });
    } catch (deepseekError: any) {
      console.error("DeepSeek API execution failed:", deepseekError);
      return res.status(500).json({
        error: `DeepSeek V3 解析失败: ${deepseekError.message || "请求超时"}`,
        isMock: false
      });
    }
  }

  // DeepSeek API key not found
  console.warn("DeepSeek API Key is not configured in environment.");
  return res.status(400).json({
    error: "未配置有效的 DeepSeek API Key，请在设置中配置 DEEPSEEK_API_KEY",
    isMock: false
  });
});

// Endpoint to inspect AI engine status
app.get("/api/ai-status", (req, res) => {
  const envKey = (process.env.DEEPSEEK_API_KEY || "").trim();
  const envBase = (process.env.DEEPSEEK_API_BASE || "").trim();
  const hasDeepSeekKey = envKey.startsWith("sk-") || envBase.startsWith("sk-");

  res.json({
    activeModel: "DeepSeek V3",
    provider: "DeepSeek",
    modelName: "deepseek-chat",
    isConfigured: hasDeepSeekKey,
  });
});

// Setup static and Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
