"use client";

import { useState, useEffect } from "react";
import { NDAFormData } from "@/utils/nda";
import { NDAPreview } from "@/components/NDAPreview";
import { PDFDownloadButton } from "@/components/PDFDownloadButton";
import { ChatPanel } from "@/components/ChatPanel";
import { AuthButton } from "@/components/AuthButton";

const initialFormData: NDAFormData = {
  purpose: "",
  effectiveDate: new Date().toISOString().split("T")[0],
  mndaTerm: "1year",
  confidentialityTerm: "1year",
  governingLaw: "",
  jurisdiction: "",
  party1Name: "",
  party1Title: "",
  party1Company: "",
  party1Address: "",
  party1Email: "",
  party1Date: "",
  party2Name: "",
  party2Title: "",
  party2Company: "",
  party2Address: "",
  party2Email: "",
  party2Date: "",
};

export default function Home() {
  const [formData, setFormData] = useState<NDAFormData>(initialFormData);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatHighlights, setChatHighlights] = useState<Set<keyof NDAFormData>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedConversationId = localStorage.getItem("conversationId");
    if (savedConversationId) {
      setConversationId(savedConversationId);
    }
  }, []);

  const handleFieldUpdates = (updates: Partial<NDAFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setChatHighlights(new Set(Object.keys(updates) as (keyof NDAFormData)[]));
    setTimeout(() => setChatHighlights(new Set()), 1500);
  };

  const handleConversationStart = (id: string) => {
    setConversationId(id);
  };

  const handleConversationReset = () => {
    setConversationId(null);
  };

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto h-screen flex flex-col">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Mutual NDA Creator</h1>
            <p className="text-gray-600">Create a professional Mutual Non-Disclosure Agreement with AI guidance</p>
          </div>
          <div className="flex items-center gap-3">
            <PDFDownloadButton data={formData} />
            <AuthButton />
          </div>
        </div>

        {/* Main Content - 2 Panel Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
          {/* Chat Panel - Left */}
          <div className="lg:col-span-1">
            <ChatPanel
              conversationId={conversationId}
              onConversationStart={handleConversationStart}
              onConversationReset={handleConversationReset}
              formData={formData}
              onFieldUpdates={handleFieldUpdates}
            />
          </div>

          {/* Preview Panel - Right */}
          <div className="lg:col-span-1">
            <NDAPreview data={formData} />
          </div>
        </div>
      </div>
    </main>
  );
}
