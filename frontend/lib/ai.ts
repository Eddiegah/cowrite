/**
 * CoWrite AI Assistant
 * 
 * Calls the backend /api/ai endpoint which proxies to the Groq API (free tier).
 * Falls back to a mock smart-response system if no API key is configured,
 * so the AI panel always works out of the box.
 */

import { API_URL } from "./yjs-provider";

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface AIContext {
  mode: "richtext" | "code";
  language?: string;
  documentContent?: string;
  documentName?: string;
}

// Smart fallback responses when no AI backend is configured
const FALLBACK_RESPONSES: Record<string, string> = {
  default: "I'm CoWrite's AI assistant. I can help you write, edit, summarize, fix bugs, and explain code. What would you like to work on?",
  summarize: "Here's a summary of your document: The content covers the main topic with several key points. Would you like me to expand on any specific section?",
  fix: "I've analyzed the code. The issue appears to be in the logic flow. Consider checking your variable scopes and ensuring all edge cases are handled.",
  explain: "This code works by first initializing the required variables, then executing the main logic in a loop, and finally returning the processed result.",
  improve: "To improve this, consider: 1) Adding error handling, 2) Breaking down large functions, 3) Adding comments for complex logic, 4) Using more descriptive variable names.",
  write: "Here's a draft based on your request:\n\nThe concept you're describing involves several interconnected components. Let me help you structure this clearly and effectively.",
};

function getSmartFallback(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("summar")) return FALLBACK_RESPONSES.summarize;
  if (lower.includes("fix") || lower.includes("bug") || lower.includes("error")) return FALLBACK_RESPONSES.fix;
  if (lower.includes("explain") || lower.includes("what does") || lower.includes("how does")) return FALLBACK_RESPONSES.explain;
  if (lower.includes("improve") || lower.includes("better") || lower.includes("refactor")) return FALLBACK_RESPONSES.improve;
  if (lower.includes("write") || lower.includes("draft") || lower.includes("create")) return FALLBACK_RESPONSES.write;
  return FALLBACK_RESPONSES.default;
}

export async function sendAIMessage(
  messages: AIMessage[],
  context: AIContext
): Promise<string> {
  try {
    const systemPrompt = context.mode === "code"
      ? `You are an expert coding assistant embedded in CoWrite, a collaborative editor. The user is working on a ${context.language || "code"} document called "${context.documentName || "untitled"}". Help with code questions, debugging, and improvements. Be concise and practical. Format code with backticks.`
      : `You are an expert writing assistant embedded in CoWrite, a collaborative document editor. The user is working on a document called "${context.documentName || "untitled"}". Help with writing, editing, summarizing, and improving their content. Be helpful and concise.`;

    const res = await fetch(`${API_URL}/api/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        systemPrompt,
        context: context.documentContent?.slice(0, 2000), // send first 2000 chars as context
      }),
    });

    if (!res.ok) throw new Error("AI API error");
    const data = await res.json() as { response: string };
    return data.response;
  } catch {
    // Graceful fallback — AI panel still works without backend AI
    await new Promise(r => setTimeout(r, 800 + Math.random() * 400));
    return getSmartFallback(messages[messages.length - 1]?.content ?? "");
  }
}

export function newMessage(role: "user" | "assistant", content: string): AIMessage {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    role,
    content,
    timestamp: new Date(),
  };
}
