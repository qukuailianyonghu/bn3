import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatMessage {
  role: string;
  content: string;
}

interface LifeEvent {
  year: string;
  title: string;
  description: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { messages, action, userId } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "chat") {
      return handleChat(messages, supabase);
    }

    if (action === "generate") {
      return generateMemoir(messages, userId, supabase);
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleChat(messages: ChatMessage[], supabase: any) {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");

  if (!lastUserMsg) {
    return new Response(JSON.stringify({ error: "No user message found" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const reply = generateContextualReply(lastUserMsg.content, messages);

  return new Response(JSON.stringify({ reply }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function generateContextualReply(userInput: string, history: ChatMessage[]): string {
  const input = userInput.trim();
  const msgCount = history.filter((m) => m.role === "user").length;

  if (msgCount <= 1) {
    return "很高兴和你聊天！我是伴伴，专门陪你回忆人生中的美好时光。请告诉我，你是在哪里出生的？小时候有什么难忘的记忆吗？";
  }

  const lower = input.toLowerCase();

  if (input.includes("出生") || input.includes("老家") || input.includes("家乡")) {
    return "听起来是个很有故事的地方呢！能告诉我你出生的年份吗？小时候在那里的生活是什么样的？有没有什么特别开心的回忆？";
  }

  if (input.includes("上学") || input.includes("学校") || input.includes("读书") || input.includes("毕业")) {
    return "求学时光总是令人怀念！你最喜欢哪门课呢？有没有特别难忘的老师或者同学？毕业后你的第一份工作是什么？";
  }

  if (input.includes("工作") || input.includes("上班") || input.includes("职业") || input.includes("单位")) {
    return "工作经历是人生中很重要的一部分！你在工作中有什么特别的成就或者难忘的事情吗？后来是怎么退休的呢？";
  }

  if (input.includes("结婚") || input.includes("婚姻") || input.includes("老伴") || input.includes("爱人")) {
    return "能遇到相伴一生的人真幸福！你们是怎么认识的？婚礼是什么样的？有没有孩子呢？";
  }

  if (input.includes("孩子") || input.includes("儿子") || input.includes("女儿") || input.includes("家庭")) {
    return "孩子是人生中最珍贵的礼物！看着他们长大一定有很多温馨的回忆吧。有没有什么特别难忘的家庭时光？";
  }

  if (input.includes("退休")) {
    return "退休是人生新篇章的开始！退休后你都做些什么呢？有没有去旅行或者培养什么新的爱好？";
  }

  if (input.includes("旅行") || input.includes("旅游") || input.includes("去过")) {
    return "旅行总是充满惊喜！你去过最难忘的地方是哪里？有没有什么特别的经历想分享？";
  }

  if (input.includes("爱好") || input.includes("喜欢") || input.includes("兴趣")) {
    return "有爱好真好，生活更加丰富！这个爱好坚持多久了？有没有因为这个爱好认识什么有趣的人？";
  }

  if (input.includes("遗憾") || input.includes("后悔") || input.includes("可惜")) {
    return "人生总有些许遗憾，但每段经历都塑造了今天的你。如果有机会重来，你会做出不同的选择吗？现在有什么想完成的心愿吗？";
  }

  if (input.includes("感谢") || input.includes("幸福") || input.includes("满足") || input.includes("开心")) {
    return "听到你感到幸福，我由衷地为你高兴！人生中你最感谢的人是谁？有没有什么话想对年轻时的自己说？";
  }

  if (msgCount >= 6) {
    return '谢谢你分享了这么多珍贵的故事！我觉得可以为你整理一篇人生回忆录了。你可以点击下方的「生成回忆录」按钮，我会根据我们的对话为你生成一篇专属的人生回忆录。当然，如果你想继续聊也可以，我很乐意继续倾听！';
  }

  return "谢谢你和我分享这些！这段经历很珍贵。能再告诉我一些吗？比如后来发生了什么？或者有什么人对你影响特别大？";
}

async function generateMemoir(messages: ChatMessage[], userId: string, supabase: any) {
  const userMessages = messages.filter((m) => m.role === "user");

  if (userMessages.length < 2) {
    return new Response(JSON.stringify({ error: "对话内容太少，至少需要2条消息才能生成回忆录" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const events = extractEvents(messages);
  const title = generateTitle(messages);
  const summary = generateSummary(messages);

  const { data, error } = await supabase
    .from("life_memoirs")
    .insert({
      user_id: userId,
      title,
      summary,
      events: JSON.stringify(events),
      chat_messages: JSON.stringify(messages),
    })
    .select("*")
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ memoir: data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractEvents(messages: ChatMessage[]): LifeEvent[] {
  const events: LifeEvent[] = [];
  const userText = messages.filter((m) => m.role === "user").map((m) => m.content).join("\n");

  const yearRegex = /(\d{4})\s*年?/g;
  const yearMatches: { year: string; index: number }[] = [];
  let match;
  while ((match = yearRegex.exec(userText)) !== null) {
    const year = match[1];
    const yearNum = parseInt(year);
    if (yearNum >= 1920 && yearNum <= 2030) {
      yearMatches.push({ year, index: match.index });
    }
  }

  const topicPatterns: { pattern: RegExp; title: string }[] = [
    { pattern: /出生|老家|家乡|生在|生下/, title: "出生" },
    { pattern: /上学|学校|读书|毕业|求学|小学|中学|大学/, title: "求学时光" },
    { pattern: /工作|上班|职业|单位|入职|第一份工作/, title: "工作经历" },
    { pattern: /结婚|婚姻|老伴|爱人|婚礼|成家/, title: "步入婚姻" },
    { pattern: /孩子|儿子|女儿|出生|为人父母|生.*\s*孩子/, title: "家庭生活" },
    { pattern: /退休|退休后|光荣退休/, title: "光荣退休" },
    { pattern: /旅行|旅游|去过|出游|旅程/, title: "旅行记忆" },
    { pattern: /爱好|喜欢|兴趣|养花|钓鱼|书法|唱歌|跳舞/, title: "兴趣爱好" },
  ];

  for (const { year, index } of yearMatches) {
    const context = userText.substring(index, Math.min(index + 200, userText.length));
    let title = "人生时刻";
    for (const tp of topicPatterns) {
      if (tp.pattern.test(context)) {
        title = tp.title;
        break;
      }
    }
    const description = context.substring(0, 80).replace(/\n/g, " ").trim();
    events.push({ year, title, description });
  }

  if (events.length === 0) {
    for (const tp of topicPatterns) {
      const idx = userText.search(tp.pattern);
      if (idx >= 0) {
        const context = userText.substring(idx, Math.min(idx + 100, userText.length));
        events.push({
          year: "—",
          title: tp.title,
          description: context.substring(0, 80).replace(/\n/g, " ").trim(),
        });
      }
    }
  }

  if (events.length === 0) {
    events.push({
      year: "—",
      title: "人生故事",
      description: userMessages[0]?.content.substring(0, 80) || "一段珍贵的人生回忆。",
    });
  }

  return events;
}

function generateTitle(messages: ChatMessage[]): string {
  const userText = messages.filter((m) => m.role === "user").map((m) => m.content).join("");
  if (/退休/.test(userText)) return "岁月如歌 · 退休时光";
  if (/旅行|旅游/.test(userText)) return "行万里路 · 人生旅途";
  if (/结婚|婚姻/.test(userText)) return "相伴一生 · 爱与人生";
  if (/工作|奋斗/.test(userText)) return "奋斗岁月 · 人生华章";
  return "岁月留痕 · 人生回忆";
}

function generateSummary(messages: ChatMessage[]): string {
  const userMessages = messages.filter((m) => m.role === "user");
  const totalChars = userMessages.reduce((sum, m) => sum + m.content.length, 0);
  const topics: string[] = [];
  const allText = userMessages.map((m) => m.content).join("");

  if (/出生|老家|家乡/.test(allText)) topics.push("出生与成长");
  if (/上学|学校|毕业/.test(allText)) topics.push("求学时光");
  if (/工作|上班|职业/.test(allText)) topics.push("工作经历");
  if (/结婚|婚姻|老伴/.test(allText)) topics.push("婚姻生活");
  if (/孩子|家庭/.test(allText)) topics.push("家庭故事");
  if (/退休/.test(allText)) topics.push("退休生活");
  if (/旅行|旅游/.test(allText)) topics.push("旅行记忆");
  if (/爱好|兴趣/.test(allText)) topics.push("兴趣爱好");

  const topicStr = topics.length > 0 ? topics.join("、") : "人生故事";
  return `本次对话共分享了 ${userMessages.length} 段回忆，涵盖了${topicStr}等方面。每一段经历都是时光的馈赠，让我们将这些珍贵的记忆永远珍藏。`;
}
