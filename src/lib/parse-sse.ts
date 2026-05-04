// ============================================================
// Shared SSE Stream Parser for Anthropic API responses
// Used by recipe-store, feed-store, and calendar feed preview
// ============================================================

/**
 * Parse an SSE stream from the Anthropic API and extract the full text content.
 * Returns the raw text string (typically JSON from Claude).
 */
export async function parseSSEStreamText(response: Response): Promise<string> {
  if (!response.ok) {
    let errMsg = "Rezepterkennung fehlgeschlagen";
    try {
      const errData = await response.json();
      errMsg = errData.error || errMsg;
    } catch {}
    throw new Error(`API ${response.status}: ${errMsg}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("Kein Response-Stream");

  const decoder = new TextDecoder();
  let fullText = "";
  let sseBuffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    sseBuffer += decoder.decode(value, { stream: true });
    const lines = sseBuffer.split("\n");
    sseBuffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const event = JSON.parse(jsonStr);
        if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
          fullText += event.delta.text;
        }
      } catch { /* skip malformed SSE lines */ }
    }
  }

  if (!fullText) throw new Error("Keine Antwort von der KI erhalten");
  return fullText;
}

/**
 * Parse an SSE stream and extract a JSON recipe object.
 * Handles Claude's occasional markdown code fences around JSON.
 */
export async function parseRecipeJsonFromSSE(response: Response): Promise<any> {
  const fullText = await parseSSEStreamText(response);

  // JSON extrahieren (Claude wrappet manchmal in ```json...```)
  let jsonString = fullText.trim();
  const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonString = jsonMatch[1].trim();

  return JSON.parse(jsonString);
}
