"use client";

import { useState, useEffect } from "react";
import { NDAFormData } from "@/utils/nda";
import { NDAForm } from "@/components/NDAForm";
import { NDAPreview } from "@/components/NDAPreview";
import { PDFDownloadButton } from "@/components/PDFDownloadButton";
import { ChatPanel } from "@/components/ChatPanel";

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

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto h-screen flex flex-col">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Mutual NDA Creator</h1>
          <p className="text-lg text-gray-600">Create a professional Mutual Non-Disclosure Agreement with AI guidance</p>
        </div>

        {/* Main Content - 3 Panel Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 mb-6">
          {/* Chat Panel - Left */}
          <div className="lg:col-span-1">
            <ChatPanel
              conversationId={conversationId}
              onConversationStart={handleConversationStart}
              formData={formData}
              onFieldUpdates={handleFieldUpdates}
            />
          </div>

          {/* Form Panel - Center */}
          <div className="lg:col-span-1">
            <NDAForm data={formData} onChange={setFormData} highlightedFields={chatHighlights} />
          </div>

          {/* Preview Panel - Right */}
          <div className="lg:col-span-1">
            <NDAPreview data={formData} />
          </div>
        </div>

        {/* Download Button - Full Width */}
        <div className="bg-white rounded-lg shadow p-6">
          <PDFDownloadButton data={formData} />
        </div>
      </div>
    </main>
  );
}
