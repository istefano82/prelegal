"use client";

import { NDAFormData, generateNDADocument, validateFormData } from "@/utils/nda";
import { useState } from "react";

interface PDFDownloadButtonProps {
  data: NDAFormData;
}

export function PDFDownloadButton({ data }: PDFDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadPDF = async () => {
    setError(null);
    const validationErrors = validateFormData(data);

    if (validationErrors.length > 0) {
      setError(validationErrors.join(", "));
      return;
    }

    setIsLoading(true);

    try {
      // Dynamically import html2pdf to avoid server-side rendering issues
      const html2pdf = await import("html2pdf.js").then((mod) => mod.default);

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 40px; color: #333;">
          <h1>Mutual Non-Disclosure Agreement</h1>

          <h2>COVER PAGE</h2>

          <h3>Purpose</h3>
          <p>${escapeHtml(data.purpose)}</p>

          <h3>Effective Date</h3>
          <p>${escapeHtml(data.effectiveDate)}</p>

          <h3>MNDA Term</h3>
          <p>${data.mndaTerm === "1year" ? "Expires 1 year(s) from Effective Date." : "Continues until terminated in accordance with the terms of the MNDA."}</p>

          <h3>Term of Confidentiality</h3>
          <p>${data.confidentialityTerm === "1year" ? "1 year(s) from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws." : "In perpetuity."}</p>

          <h3>Governing Law & Jurisdiction</h3>
          <p><strong>Governing Law:</strong> ${escapeHtml(data.governingLaw)}</p>
          <p><strong>Jurisdiction:</strong> ${escapeHtml(data.jurisdiction)}</p>

          <h2>SIGNATURE PAGE</h2>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="border: 1px solid #ddd;">
              <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;"></td>
              <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">PARTY 1</td>
              <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">PARTY 2</td>
            </tr>
            <tr style="border: 1px solid #ddd;">
              <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">Signature</td>
              <td style="border: 1px solid #ddd; padding: 10px;">___________________</td>
              <td style="border: 1px solid #ddd; padding: 10px;">___________________</td>
            </tr>
            <tr style="border: 1px solid #ddd;">
              <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">Print Name</td>
              <td style="border: 1px solid #ddd; padding: 10px;">${escapeHtml(data.party1Name)}</td>
              <td style="border: 1px solid #ddd; padding: 10px;">${escapeHtml(data.party2Name)}</td>
            </tr>
            <tr style="border: 1px solid #ddd;">
              <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">Title</td>
              <td style="border: 1px solid #ddd; padding: 10px;">${escapeHtml(data.party1Title)}</td>
              <td style="border: 1px solid #ddd; padding: 10px;">${escapeHtml(data.party2Title)}</td>
            </tr>
            <tr style="border: 1px solid #ddd;">
              <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">Company</td>
              <td style="border: 1px solid #ddd; padding: 10px;">${escapeHtml(data.party1Company)}</td>
              <td style="border: 1px solid #ddd; padding: 10px;">${escapeHtml(data.party2Company)}</td>
            </tr>
            <tr style="border: 1px solid #ddd;">
              <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">Notice Address</td>
              <td style="border: 1px solid #ddd; padding: 10px;">${escapeHtml(data.party1Address)}</td>
              <td style="border: 1px solid #ddd; padding: 10px;">${escapeHtml(data.party2Address)}</td>
            </tr>
            <tr style="border: 1px solid #ddd;">
              <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">Email</td>
              <td style="border: 1px solid #ddd; padding: 10px;">${escapeHtml(data.party1Email)}</td>
              <td style="border: 1px solid #ddd; padding: 10px;">${escapeHtml(data.party2Email)}</td>
            </tr>
            <tr style="border: 1px solid #ddd;">
              <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">Date</td>
              <td style="border: 1px solid #ddd; padding: 10px;">${escapeHtml(data.party1Date)}</td>
              <td style="border: 1px solid #ddd; padding: 10px;">${escapeHtml(data.party2Date)}</td>
            </tr>
          </table>

          <h2 style="page-break-before: always; margin-top: 40px;">Standard Terms</h2>
          <p>1. <strong>Introduction</strong>. This Mutual Non-Disclosure Agreement (which incorporates these Standard Terms and the Cover Page (defined below)) ("MNDA") allows each party ("Disclosing Party") to disclose or make available information in connection with the ${escapeHtml(data.purpose)} which (1) the Disclosing Party identifies to the receiving party ("Receiving Party") as "confidential", "proprietary", or the like or (2) should be reasonably understood as confidential or proprietary due to its nature and the circumstances of its disclosure ("Confidential Information"). Each party's Confidential Information also includes the existence and status of the parties' discussions and information on the Cover Page. Confidential Information includes technical or business information, product designs or roadmaps, requirements, pricing, security and compliance documentation, technology, inventions and know-how. To use this MNDA, the parties must complete and sign a cover page incorporating these Standard Terms ("Cover Page"). Each party is identified on the Cover Page and capitalized terms have the meanings given herein or on the Cover Page.</p>

          <p>2. <strong>Use and Protection of Confidential Information</strong>. The Receiving Party shall: (a) use Confidential Information solely for the ${escapeHtml(data.purpose)}; (b) not disclose Confidential Information to third parties without the Disclosing Party's prior written approval, except that the Receiving Party may disclose Confidential Information to its employees, agents, advisors, contractors and other representatives having a reasonable need to know for the ${escapeHtml(data.purpose)}, provided these representatives are bound by confidentiality obligations no less protective of the Disclosing Party than the applicable terms in this MNDA and the Receiving Party remains responsible for their compliance with this MNDA; and (c) protect Confidential Information using at least the same protections the Receiving Party uses for its own similar information but no less than a reasonable standard of care.</p>

          <p style="page-break-before: always;">3. <strong>Exceptions</strong>. The Receiving Party's obligations in this MNDA do not apply to information that it can demonstrate: (a) is or becomes publicly available through no fault of the Receiving Party; (b) it rightfully knew or possessed prior to receipt from the Disclosing Party without confidentiality restrictions; (c) it rightfully obtained from a third party without confidentiality restrictions; or (d) it independently developed without using or referencing the Confidential Information.</p>

          <p>4. <strong>Disclosures Required by Law</strong>. The Receiving Party may disclose Confidential Information to the extent required by law, regulation or regulatory authority, subpoena or court order, provided (to the extent legally permitted) it provides the Disclosing Party reasonable advance notice of the required disclosure and reasonably cooperates, at the Disclosing Party's expense, with the Disclosing Party's efforts to obtain confidential treatment for the Confidential Information.</p>

          <p>5. <strong>Term and Termination</strong>. This MNDA commences on the ${escapeHtml(data.effectiveDate)} and expires at the end of the ${data.mndaTerm === "1year" ? "1 year(s)" : "continues until terminated in accordance with the terms of the MNDA"}. Either party may terminate this MNDA for any or no reason upon written notice to the other party. The Receiving Party's obligations relating to Confidential Information will survive for the ${data.confidentialityTerm === "1year" ? "1 year(s) from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws" : "In perpetuity"}, despite any expiration or termination of this MNDA.</p>

          <p>6. <strong>Return or Destruction of Confidential Information</strong>. Upon expiration or termination of this MNDA or upon the Disclosing Party's earlier request, the Receiving Party will: (a) cease using Confidential Information; (b) promptly after the Disclosing Party's written request, destroy all Confidential Information in the Receiving Party's possession or control or return it to the Disclosing Party; and (c) if requested by the Disclosing Party, confirm its compliance with these obligations in writing. As an exception to subsection (b), the Receiving Party may retain Confidential Information in accordance with its standard backup or record retention policies or as required by law, but the terms of this MNDA will continue to apply to the retained Confidential Information.</p>

          <p>7. <strong>Proprietary Rights</strong>. The Disclosing Party retains all of its intellectual property and other rights in its Confidential Information and its disclosure to the Receiving Party grants no license under such rights.</p>

          <p>8. <strong>Disclaimer</strong>. ALL CONFIDENTIAL INFORMATION IS PROVIDED "AS IS", WITH ALL FAULTS, AND WITHOUT WARRANTIES, INCLUDING THE IMPLIED WARRANTIES OF TITLE, MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.</p>

          <p>9. <strong>Governing Law and Jurisdiction</strong>. This MNDA and all matters relating hereto are governed by, and construed in accordance with, the laws of the State of ${escapeHtml(data.governingLaw)}, without regard to the conflict of laws provisions of such ${escapeHtml(data.governingLaw)}. Any legal suit, action, or proceeding relating to this MNDA must be instituted in the federal or state courts located in ${escapeHtml(data.jurisdiction)}. Each party irrevocably submits to the exclusive jurisdiction of such ${escapeHtml(data.jurisdiction)} in any such suit, action, or proceeding.</p>

          <p>10. <strong>Equitable Relief</strong>. A breach of this MNDA may cause irreparable harm for which monetary damages are an insufficient remedy. Upon a breach of this MNDA, the Disclosing Party is entitled to seek appropriate equitable relief, including an injunction, in addition to its other remedies.</p>

          <p>11. <strong>General</strong>. Neither party has an obligation under this MNDA to disclose Confidential Information to the other or proceed with any proposed transaction. Neither party may assign this MNDA without the prior written consent of the other party, except that either party may assign this MNDA in connection with a merger, reorganization, acquisition or other transfer of all or substantially all its assets or voting securities. Any assignment in violation of this Section is null and void. This MNDA will bind and inure to the benefit of each party's permitted successors and assigns. Waivers must be signed by the waiving party's authorized representative and cannot be implied from conduct. If any provision of this MNDA is held unenforceable, it will be limited to the minimum extent necessary so the rest of this MNDA remains in effect. This MNDA (including the Cover Page) constitutes the entire agreement of the parties with respect to its subject matter, and supersedes all prior and contemporaneous understandings, agreements, representations, and warranties, whether written or oral, regarding such subject matter. This MNDA may only be amended, modified, waived, or supplemented by an agreement in writing signed by both parties. Notices, requests and approvals under this MNDA must be sent in writing to the email or postal addresses on the Cover Page and are deemed delivered on receipt. This MNDA may be executed in counterparts, including electronic copies, each of which is deemed an original and which together form the same agreement.</p>

          <p style="margin-top: 40px; font-size: 12px; color: #666;">Common Paper Mutual Non-Disclosure Agreement (Version 1.0) free to use under CC BY 4.0.</p>
        </div>
      `;

      const filename = `Mutual-NDA-${new Date().toISOString().split("T")[0]}.pdf`;

      const options = {
        margin: [10, 10, 10, 10],
        filename: filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
      };

      html2pdf().set(options).from(tempDiv).save();
    } catch (err) {
      setError("Failed to generate PDF. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={handleDownloadPDF}
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
      >
        {isLoading ? "Generating PDF..." : "Download as PDF"}
      </button>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
