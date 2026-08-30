import { getCurrentToken } from "./firebase";
import {
  ReflectionRequestPayload,
  ReflectionResponsePayload,
  WeeklyDigestRequestPayload,
  WeeklyDigest,
} from "../types";

export class ApiError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Call the multi-turn Gemini 3.6 Flash streaming reflection endpoint
 */
export async function streamReflectionPrompt(
  payload: ReflectionRequestPayload,
  onChunk: (chunkText: string) => void,
  onDone: (result: { reply: string; metadata: any }) => void,
  onError: (error: Error) => void
): Promise<void> {
  const token = await getCurrentToken();

  try {
    const response = await fetch("/api/chat/reflect/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok || !response.body) {
      // Fallback to non-streaming endpoint
      console.warn("Streaming response not available, falling back to standard endpoint...");
      const standardResult = await sendReflectionPrompt(payload);
      onChunk(standardResult.reply);
      onDone({
        reply: standardResult.reply,
        metadata: {
          mood: standardResult.mood,
          summary: standardResult.summary,
          takeaways: standardResult.takeaways,
          reflectionQuestions: standardResult.reflectionQuestions,
          suggestedTags: standardResult.suggestedTags,
        },
      });
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const block of lines) {
        if (!block.trim()) continue;
        const eventMatch = block.match(/^event:\s*(\w+)/m);
        const dataMatch = block.match(/^data:\s*(.*)$/m);

        const eventType = eventMatch ? eventMatch[1] : "chunk";
        const dataStr = dataMatch ? dataMatch[1] : "";

        if (eventType === "chunk" && dataStr) {
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.text) {
              onChunk(parsed.text);
            }
          } catch (e) {
            // ignore partial JSON parse error
          }
        } else if (eventType === "done" && dataStr) {
          try {
            const parsed = JSON.parse(dataStr);
            onDone(parsed);
          } catch (e) {
            onDone({ reply: "", metadata: {} });
          }
        } else if (eventType === "error" && dataStr) {
          try {
            const parsed = JSON.parse(dataStr);
            onError(new Error(parsed.error || "Streaming failed"));
          } catch {
            onError(new Error("Streaming reflection encountered an error."));
          }
          return;
        }
      }
    }
  } catch (err: any) {
    // If stream fails unexpectedly, try standard fallback
    try {
      const fallbackResult = await sendReflectionPrompt(payload);
      onChunk(fallbackResult.reply);
      onDone({
        reply: fallbackResult.reply,
        metadata: {
          mood: fallbackResult.mood,
          summary: fallbackResult.summary,
          takeaways: fallbackResult.takeaways,
          reflectionQuestions: fallbackResult.reflectionQuestions,
          suggestedTags: fallbackResult.suggestedTags,
        },
      });
    } catch (fallbackErr: any) {
      onError(fallbackErr instanceof Error ? fallbackErr : new Error(String(fallbackErr)));
    }
  }
}

/**
 * Call the multi-turn Gemini 3.6 Flash reflection endpoint (Non-streaming)
 */
export async function sendReflectionPrompt(
  payload: ReflectionRequestPayload
): Promise<ReflectionResponsePayload> {
  const token = await getCurrentToken();

  const response = await fetch("/api/chat/reflect", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data?.error || "Failed to process reflection with Gemini AI.",
      response.status,
      data?.code
    );
  }

  return data as ReflectionResponsePayload;
}

/**
 * Call the Weekly Growth Digest synthesis endpoint
 */
export async function generateWeeklyGrowthDigest(
  payload: WeeklyDigestRequestPayload
): Promise<Omit<WeeklyDigest, "id" | "userId" | "weekStartDate" | "weekEndDate" | "createdAt">> {
  const token = await getCurrentToken();

  const response = await fetch("/api/digest/weekly", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data?.error || "Failed to synthesize weekly growth digest.",
      response.status,
      data?.code
    );
  }

  return data;
}

