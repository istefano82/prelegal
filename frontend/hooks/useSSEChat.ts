"use client";

import { useCallback, useState } from "react";
import { useSession } from "./useSession";
import { NDAContextPayload, ChatAnalysis } from "@/utils/api";

export interface StreamingMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  tokens: string[];
  analysis?: ChatAnalysis;
  isComplete: boolean;
  error?: string;
}

export function useSSEChat() {
  const { sessionId, isAuthenticated, user } = useSession();
  const [isStreaming, setIsStreaming] = useState(false);

  const streamMessage = useCallback(
    async (
      message: string,
      conversationId: string | null,
      documentContext: NDAContextPayload | null,
      onToken: (token: string) => void,
      onFieldUpdates: (updates: Record<string, string>) => void,
      onComplete: (messageId: string, conversationId: string) => void,
      onError: (error: string) => void
    ) => {
      if (!sessionId && !isAuthenticated) {
        onError("No session or authentication");
        return;
      }

      setIsStreaming(true);

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (isAuthenticated && user?.id) {
          headers["Authorization"] = `Bearer ${await getAccessToken()}`;
        } else {
          headers["X-Session-ID"] = sessionId || "";
        }

        const params = new URLSearchParams();
        params.append("message", message);
        if (conversationId) {
          params.append("conversation_id", conversationId);
        }

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const url = `${baseUrl}/chat/stream?${params.toString()}`;

        const response = await fetch(url, {
          method: "POST",
          headers,
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
        let fullContent = "";
        let currentAnalysis: Partial<ChatAnalysis> = {};
        let newConversationId = conversationId;
        let messageId = "";

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

            if (!eventMatch || !dataMatch) continue;

            const event = eventMatch[1];
            const data = JSON.parse(dataMatch[1]);

            switch (event) {
              case "token":
                if (data.text) {
                  onToken(data.text);
                  fullContent += data.text;
                }
                break;

              case "field_updates":
                if (data.field_updates) {
                  onFieldUpdates(data.field_updates);
                  currentAnalysis = {
                    ...data,
                    answer: fullContent,
                  };
                }
                break;

              case "done":
                newConversationId = data.conversation_id;
                messageId = data.message_id;
                break;

              case "error":
                throw new Error(data.message || "Stream error");
            }
          }
        }

        if (newConversationId && messageId) {
          onComplete(messageId, newConversationId);
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Streaming failed";
        onError(errorMsg);
      } finally {
        setIsStreaming(false);
      }
    },
    [sessionId, isAuthenticated, user?.id]
  );

  return {
    streamMessage,
    isStreaming,
  };
}

async function getAccessToken(): Promise<string> {
  try {
    const response = await fetch("/auth/me", {
      credentials: "include",
    });
    if (response.ok) {
      const data = await response.json();
      return data.access_token || "";
    }
  } catch {
    // Fall through to return empty string
  }
  return "";
}
