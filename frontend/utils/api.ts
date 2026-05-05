"use client";

export interface FieldUpdates {
  [key: string]: string;
}

export interface ChatAnalysis {
  answer: string;
  confidence: "high" | "medium" | "low";
  field_updates: FieldUpdates;
  suggested_clauses: string[];
  warnings: string[];
  follow_up_questions: string[];
}

export interface SendMessageResponse {
  conversation_id: string;
  message_id: string;
  analysis: ChatAnalysis;
  created_at: string;
}

export interface NDAContextPayload {
  [key: string]: string | null;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export async function sendChatMessage(
  message: string,
  conversationId: string | null,
  documentContext: NDAContextPayload | null
): Promise<SendMessageResponse> {
  const payload = {
    message,
    conversation_id: conversationId,
    document_context: documentContext,
  };

  const response = await fetch(`${BASE_URL}/chat/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Chat API error: ${response.statusText}`);
  }

  return response.json();
}

export async function getConversationHistory(
  conversationId: string,
  headers: Record<string, string> = {}
): Promise<Message[]> {
  const response = await fetch(`${BASE_URL}/chat/${conversationId}/history`, {
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`History API error: ${response.status}`);
  }

  return response.json();
}

export interface Message {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const response = await fetch(`${BASE_URL}/auth/me`, {
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  await fetch(`${BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

export async function refreshToken(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    return response.ok;
  } catch {
    return false;
  }
}

export interface SSEStreamEvent {
  event: "token" | "field_updates" | "done" | "error";
  data: Record<string, unknown>;
}

export async function* streamChatMessage(
  message: string,
  conversationId: string | null,
  documentContext: NDAContextPayload | null,
  headers: Record<string, string>
): AsyncGenerator<SSEStreamEvent, void, unknown> {
  const params = new URLSearchParams();
  params.append("message", message);
  if (conversationId) {
    params.append("conversation_id", conversationId);
  }

  const response = await fetch(`${BASE_URL}/chat/stream?${params.toString()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Stream failed: ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error("No response body for streaming");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines[lines.length - 1];

    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i];
      if (!line.startsWith("event:")) continue;

      const eventMatch = line.match(/event: (\w+)/);
      const dataMatch = line.match(/data: ({.*})/);

      if (eventMatch && dataMatch) {
        const event = eventMatch[1];
        const data = JSON.parse(dataMatch[1]);
        yield {
          event: event as SSEStreamEvent["event"],
          data,
        };
      }
    }
  }
}
