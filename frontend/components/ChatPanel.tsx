"use client";

import { useEffect, useRef, useState } from "react";
import { NDAFormData } from "@/utils/nda";
import { NDAContextPayload, streamChatMessage } from "@/utils/api";
import { useSession } from "@/hooks/useSession";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  extractedFields?: Partial<NDAFormData>;
  error?: boolean;
}

interface ChatPanelProps {
  conversationId: string | null;
  onConversationStart: (id: string) => void;
  formData: NDAFormData;
  onFieldUpdates: (updates: Partial<NDAFormData>) => void;
}

export function ChatPanel({
  conversationId,
  onConversationStart,
  formData,
  onFieldUpdates,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sessionId, isAuthenticated, user } = useSession();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!conversationId && messages.length === 0 && sessionId) {
      const sendInitialGreeting = async () => {
        setIsLoading(true);
        try {
          const contextPayload = formDataToContext(formData);

          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };

          if (isAuthenticated && user?.id) {
            const token = await getAccessToken();
            if (token) {
              headers["Authorization"] = `Bearer ${token}`;
            }
          } else if (sessionId) {
            headers["X-Session-ID"] = sessionId;
          }

          let fullContent = "";
          let newConversationId = "";
          let messageId = "";
          let extractedUpdates: Partial<NDAFormData> = {};
          let answerText = "";

          const stream = streamChatMessage(
            "Hello, I'm ready to create my NDA.",
            null,
            contextPayload,
            headers
          );

          for await (const event of stream) {
            if (event.event === "token" && typeof event.data.text === "string") {
              fullContent += event.data.text;
            } else if (event.event === "field_updates") {
              extractedUpdates = (event.data.field_updates as Partial<NDAFormData>) || {};
              answerText = String(event.data.answer || "");
            } else if (event.event === "done") {
              newConversationId = String(event.data.conversation_id || "");
              messageId = String(event.data.message_id || "");
            } else if (event.event === "error") {
              throw new Error(String(event.data.message || "Stream error"));
            }
          }

          if (newConversationId && messageId) {
            onConversationStart(newConversationId);
            localStorage.setItem("conversationId", newConversationId);

            const newMessages: ChatMessage[] = [
              {
                id: messageId,
                role: "assistant",
                content: answerText,
                extractedFields: extractedUpdates,
              },
            ];

            setMessages(newMessages);

            if (Object.keys(extractedUpdates).length > 0) {
              onFieldUpdates(extractedUpdates);
            }
          }

          setError(null);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to start conversation. Please refresh and try again."
          );
          console.error("Initial greeting error:", err);
        } finally {
          setIsLoading(false);
        }
      };

      sendInitialGreeting();
    }
  }, [conversationId, messages.length, sessionId, isAuthenticated, user?.id, formData, onConversationStart, onFieldUpdates]);

  const formDataToContext = (data: NDAFormData): NDAContextPayload => {
    return {
      purpose: data.purpose || null,
      effectiveDate: data.effectiveDate || null,
      mndaTerm: data.mndaTerm || null,
      confidentialityTerm: data.confidentialityTerm || null,
      governingLaw: data.governingLaw || null,
      jurisdiction: data.jurisdiction || null,
      party1Name: data.party1Name || null,
      party1Title: data.party1Title || null,
      party1Company: data.party1Company || null,
      party1Address: data.party1Address || null,
      party1Email: data.party1Email || null,
      party1Date: data.party1Date || null,
      party2Name: data.party2Name || null,
      party2Title: data.party2Title || null,
      party2Company: data.party2Company || null,
      party2Address: data.party2Address || null,
      party2Email: data.party2Email || null,
      party2Date: data.party2Date || null,
    };
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !conversationId || !sessionId) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      const contextPayload = formDataToContext(formData);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (isAuthenticated && user?.id) {
        const token = await getAccessToken();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      } else {
        headers["X-Session-ID"] = sessionId;
      }

      const userChatMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: userMessage,
      };

      let fullContent = "";
      let extractedUpdates: Partial<NDAFormData> = {};
      let messageId = "";
      let answerText = "";

      const stream = streamChatMessage(
        userMessage,
        conversationId,
        contextPayload,
        headers
      );

      for await (const event of stream) {
        if (event.event === "token" && typeof event.data.text === "string") {
          fullContent += event.data.text;
        } else if (event.event === "field_updates") {
          extractedUpdates = (event.data.field_updates as Partial<NDAFormData>) || {};
          answerText = String(event.data.answer || "");
        } else if (event.event === "done") {
          messageId = String(event.data.message_id || "");
        } else if (event.event === "error") {
          throw new Error(String(event.data.message || "Stream error"));
        }
      }

      const assistantChatMessage: ChatMessage = {
        id: messageId || `assistant-${Date.now()}`,
        role: "assistant",
        content: answerText,
        extractedFields: extractedUpdates,
        error: answerText.includes("Unable to parse"),
      };

      setMessages((prev) => [...prev, userChatMessage, assistantChatMessage]);

      if (Object.keys(extractedUpdates).length > 0) {
        onFieldUpdates(extractedUpdates);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to send message";
      setError(errorMsg);
      console.error("Chat error:", err);

      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `Error: ${errorMsg}. Please try again.`,
          error: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        {messages.length === 0 && !error && (
          <div className="text-center text-gray-500 py-8">
            Starting chat session...
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.error
                  ? "bg-red-100 text-red-900"
                  : msg.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-900"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              {msg.extractedFields &&
                Object.keys(msg.extractedFields).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-300 text-xs">
                    <span className="font-semibold">
                      Set: {Object.keys(msg.extractedFields).join(", ")}
                    </span>
                  </div>
                )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Shift+Enter for new line)"
            disabled={isLoading || !conversationId}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500 disabled:opacity-50"
            rows={3}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim() || !conversationId}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed self-end"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

async function getAccessToken(): Promise<string> {
  return "";
}
