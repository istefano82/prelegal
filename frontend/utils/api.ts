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
  conversationId: string
): Promise<Message[]> {
  const response = await fetch(`${BASE_URL}/chat/${conversationId}/history`);

  if (!response.ok) {
    throw new Error(`History API error: ${response.statusText}`);
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
