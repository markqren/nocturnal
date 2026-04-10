import { supabase } from "./supabase";
import { AgentMessage, AgentModel, AgentResponse } from "./types";

const EDGE_FUNCTION_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/ai-proxy`;

async function callAiProxy(payload: {
  messages: AgentMessage[];
  model?: AgentModel;
  system?: string;
}): Promise<AgentResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI proxy error ${response.status}: ${err}`);
  }

  return response.json();
}

// ─── Agent ────────────────────────────────────────────────────────────────────

const BASE_SYSTEM_PROMPT = `You are a journaling companion embedded in nocturnal, a personal journal app.

Your role is to help the user reflect and write journal entries in their own voice. You:
- Ask grounding questions to draw out specific memories and feelings
- Steer toward concrete details ("what actually happened?") when the user spirals into abstraction
- Validate that their thoughts have substance — combat the inner critic, not with flattery but with genuine engagement
- Draft reflections using the user's own words as raw material
- Never rewrite for them — help them find their thread

When asked to draft an entry, write in first person in a natural, unpolished voice. Avoid journalistic or literary flourishes.`;

export async function sendAgentMessage(
  messages: AgentMessage[],
  customSystem?: string
): Promise<AgentResponse> {
  return callAiProxy({
    messages,
    model: "sonnet",
    system: customSystem ?? BASE_SYSTEM_PROMPT,
  });
}

// ─── Classification ───────────────────────────────────────────────────────────

export async function suggestTags(body: string, availableTags: string[]): Promise<string[]> {
  const response = await callAiProxy({
    messages: [
      {
        role: "user",
        content: `Given this journal entry, suggest which tags apply. Respond with only a JSON array of tag names from the provided list. Available tags: ${availableTags.join(", ")}\n\nEntry:\n${body.slice(0, 500)}`,
      },
    ],
    model: "haiku",
    system: "You are a journal entry classifier. Respond only with valid JSON.",
  });

  try {
    const parsed = JSON.parse(response.content);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ─── Draft Generation ─────────────────────────────────────────────────────────

export async function draftEntryFromConversation(
  messages: AgentMessage[]
): Promise<string> {
  const response = await callAiProxy({
    messages: [
      ...messages,
      {
        role: "user",
        content:
          "Based on our conversation, please draft a journal entry in my voice. Use my words and phrases as raw material. Write in first person, naturally, without literary polish.",
      },
    ],
    model: "sonnet",
    system: BASE_SYSTEM_PROMPT,
  });
  return response.content;
}
