interface Env {
  DEEPSEEK_API_KEY: string;
  DEEPSEEK_API_BASE: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === "/api/parse-task" && request.method === "POST") {
      return handleParseTask(request, env);
    }

    if (url.pathname === "/api/ai-status") {
      return Response.json(
        {
          activeModel: "DeepSeek V3",
          provider: "DeepSeek",
          modelName: "deepseek-chat",
          isConfigured: !!env.DEEPSEEK_API_KEY,
        },
        { headers: CORS_HEADERS }
      );
    }

    return Response.json({ error: "Not found" }, { status: 404, headers: CORS_HEADERS });
  },
};

async function handleParseTask(request: Request, env: Env): Promise<Response> {
  const { text, clientTime } = (await request.json()) as {
    text?: string;
    clientTime?: string;
  };

  if (!text || typeof text !== "string") {
    return Response.json({ error: "Text prompt is required" }, { status: 400, headers: CORS_HEADERS });
  }

  const apiKey = env.DEEPSEEK_API_KEY;
  const apiBase = (env.DEEPSEEK_API_BASE || "https://api.deepseek.com").replace(/\/+$/, "");

  if (!apiKey) {
    return Response.json(
      { error: "DEEPSEEK_API_KEY not configured" },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  const currentTimeStr =
    clientTime || new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });

  const systemInstruction = `你是一个专业的日程与待办事项智能拆解助手。
当前系统参考时间是：${currentTimeStr}。
请从用户输入的自然语言中，智能分析并提取待办日程任务。
必须仅输出合法的 JSON 格式（可以直接是 JSON 数组，或者包含 tasks 数组的 JSON 对象）。
每个任务项包含字段：
- task: 核心任务动作与标题（如"去机场接老李"、"开部门周会"）
- time: 规范化的高精度时间字符串（格式："YYYY-MM-DD HH:mm"）。对于"明天下午三点"、"后天早上十点"等相对时间描述，请严格结合当前参考时间计算出准确的公历日期与时间。如未提及具体时间，结合语境合理规划，不要为空。
- note: 随带备忘、重要提醒、地点或注意事项（如"记得带上那份合同"、"地点：3号会议室"），若无则为空字符串 ""。
示例输出：[{"task": "去机场接老李", "time": "2026-09-06 15:00", "note": "记得带上那份合同"}]`;

  try {
    const response = await fetch(`${apiBase}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: `用户输入："${text}"` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`DeepSeek API error: ${response.status} - ${errorBody}`);
      return Response.json(
        { error: `DeepSeek API error (${response.status})` },
        { status: 502, headers: CORS_HEADERS }
      );
    }

    const data = (await response.json()) as any;
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

    return Response.json(
      { tasks: tasksArray, isMock: false, modelUsed: "DeepSeek V3" },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error("DeepSeek API failed:", error);
    return Response.json(
      { error: `DeepSeek V3 parse failed: ${error.message || "timeout"}` },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
