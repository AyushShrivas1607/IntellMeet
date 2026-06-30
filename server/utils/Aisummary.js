const { GoogleGenAI } = require("@google/genai");

// New SDK — picks up GEMINI_API_KEY from env automatically, but we
// pass it explicitly to be safe and explicit.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Current (non-deprecated) model names, tried in order.
// gemini-1.5-* family is sunset — do not use it.
const MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-001",
];

function buildPrompt(transcript, meetingTitle) {
  return `You are an AI meeting assistant. Below is a chat transcript from a meeting titled "${meetingTitle}".

Transcript:
${transcript}

Respond ONLY with valid JSON (no markdown, no code fences, no preamble) in exactly this shape:
{
  "summary": "A concise 3-5 sentence summary of what was discussed.",
  "actionItems": [
    { "text": "Specific actionable task", "assignee": "Name if mentioned, otherwise Unassigned" }
  ]
}

If there are no clear action items, return an empty array for actionItems.`;
}

function parseModelResponse(raw) {
  let cleaned = raw.trim().replace(/```json|```/g, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

/**
 * Generates a meeting summary + action items from a chat transcript
 * using Google's Gemini API (new @google/genai SDK).
 */
async function generateMeetingSummary(messages, meetingTitle = "Meeting") {
  if (!messages || messages.length === 0) {
    return {
      summary: "No conversation was recorded during this meeting.",
      actionItems: [],
    };
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error("[aiSummary] GEMINI_API_KEY is not set in environment variables!");
    return {
      summary: "AI summary unavailable: missing API key configuration.",
      actionItems: [],
    };
  }

  const transcript = messages.map((m) => `${m.sender}: ${m.message}`).join("\n");
  const prompt = buildPrompt(transcript, meetingTitle);

  let lastError = null;

  for (const modelName of MODEL_CANDIDATES) {
    try {
      console.log(`[aiSummary] Trying model: ${modelName}...`);

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });

      const raw = response.text;
      const parsed = parseModelResponse(raw);

      console.log(`[aiSummary] Success with model: ${modelName}`);
      return {
        summary: parsed.summary || "Summary unavailable.",
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
      };
    } catch (err) {
      lastError = err;
      console.error(`[aiSummary] Model "${modelName}" failed:`, err.message);
    }
  }

  console.error("[aiSummary] All model attempts failed. Last error:", lastError);
  return {
    summary:
      "AI summary could not be generated at this time. Please review the chat transcript manually.",
    actionItems: [],
  };
}

module.exports = { generateMeetingSummary };