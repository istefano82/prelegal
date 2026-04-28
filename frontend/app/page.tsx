"use client";

import { useState } from "react";
import { NDAFormData } from "@/utils/nda";
import { NDAForm } from "@/components/NDAForm";
import { NDAPreview } from "@/components/NDAPreview";
import { PDFDownloadButton } from "@/components/PDFDownloadButton";

const initialFormData: NDAFormData = {
  purpose: "Evaluating whether to enter into a business relationship with the other party.",
  effectiveDate: new Date().toISOString().split("T")[0],
  mndaTerm: "1year",
  confidentialityTerm: "1year",
  governingLaw: "California",
  jurisdiction: "San Francisco, CA",
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Mutual NDA Creator</h1>
          <p className="text-lg text-gray-600">Create a professional Mutual Non-Disclosure Agreement</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Form Section */}
          <div>
            <NDAForm data={formData} onChange={setFormData} />
          </div>

          {/* Preview Section */}
          <div>
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
