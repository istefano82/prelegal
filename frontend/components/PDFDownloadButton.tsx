"use client";

import { NDAFormData, generateNDADocument, validateFormData } from "@/utils/nda";
import { useState } from "react";
import { marked } from "marked";

interface PDFDownloadButtonProps {
  data: NDAFormData;
}

export function PDFDownloadButton({ data }: PDFDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleDownloadPDF = async () => {
    setErrors([]);
    const validationErrors = validateFormData(data);

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Dynamically import html2pdf to avoid server-side rendering issues
      const html2pdf = await import("html2pdf.js").then((mod) => mod.default);

      // Generate markdown document (single source of truth)
      const markdownContent = generateNDADocument(data);

      // Convert markdown to HTML
      const htmlContent = await marked(markdownContent);

      // Create container with styling
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6;">
          ${htmlContent}
        </div>
      `;

      const filename = `Mutual-NDA-${new Date().toISOString().split("T")[0]}.pdf`;

      const options = {
        margin: 10,
        filename: filename,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: "portrait" as const, unit: "mm", format: "a4" },
      };

      // Await the PDF generation and save
      await html2pdf().set(options).from(tempDiv).save();
    } catch (err) {
      setErrors(["Failed to generate PDF. Please try again."]);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleDownloadPDF}
        disabled={isLoading}
        className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors text-sm whitespace-nowrap"
      >
        {isLoading ? "Generating..." : "⬇ Download PDF"}
      </button>
      {errors.length > 0 && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-red-50 border border-red-200 rounded-lg p-3 z-10 shadow-lg">
          <p className="text-red-700 font-semibold text-sm mb-2">Cannot generate PDF:</p>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-red-700 text-sm">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
