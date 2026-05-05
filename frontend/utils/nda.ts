// NDA template content with placeholders
export const ndaStandardTerms = `# Standard Terms

1. **Introduction**. This Mutual Non-Disclosure Agreement (which incorporates these Standard Terms and the Cover Page (defined below)) ("**MNDA**") allows each party ("**Disclosing Party**") to disclose or make available information in connection with the {{PURPOSE}} which (1) the Disclosing Party identifies to the receiving party ("**Receiving Party**") as "confidential", "proprietary", or the like or (2) should be reasonably understood as confidential or proprietary due to its nature and the circumstances of its disclosure ("**Confidential Information**"). Each party's Confidential Information also includes the existence and status of the parties' discussions and information on the Cover Page. Confidential Information includes technical or business information, product designs or roadmaps, requirements, pricing, security and compliance documentation, technology, inventions and know-how. To use this MNDA, the parties must complete and sign a cover page incorporating these Standard Terms ("**Cover Page**"). Each party is identified on the Cover Page and capitalized terms have the meanings given herein or on the Cover Page.

2. **Use and Protection of Confidential Information**. The Receiving Party shall: (a) use Confidential Information solely for the {{PURPOSE}}; (b) not disclose Confidential Information to third parties without the Disclosing Party's prior written approval, except that the Receiving Party may disclose Confidential Information to its employees, agents, advisors, contractors and other representatives having a reasonable need to know for the {{PURPOSE}}, provided these representatives are bound by confidentiality obligations no less protective of the Disclosing Party than the applicable terms in this MNDA and the Receiving Party remains responsible for their compliance with this MNDA; and (c) protect Confidential Information using at least the same protections the Receiving Party uses for its own similar information but no less than a reasonable standard of care.

3. **Exceptions**. The Receiving Party's obligations in this MNDA do not apply to information that it can demonstrate: (a) is or becomes publicly available through no fault of the Receiving Party; (b) it rightfully knew or possessed prior to receipt from the Disclosing Party without confidentiality restrictions; (c) it rightfully obtained from a third party without confidentiality restrictions; or (d) it independently developed without using or referencing the Confidential Information.

4. **Disclosures Required by Law**. The Receiving Party may disclose Confidential Information to the extent required by law, regulation or regulatory authority, subpoena or court order, provided (to the extent legally permitted) it provides the Disclosing Party reasonable advance notice of the required disclosure and reasonably cooperates, at the Disclosing Party's expense, with the Disclosing Party's efforts to obtain confidential treatment for the Confidential Information.

5. **Term and Termination**. This MNDA commences on the {{EFFECTIVE_DATE}} and expires at the end of the {{MNDA_TERM}}. Either party may terminate this MNDA for any or no reason upon written notice to the other party. The Receiving Party's obligations relating to Confidential Information will survive for the {{CONFIDENTIALITY_TERM}}, despite any expiration or termination of this MNDA.

6. **Return or Destruction of Confidential Information**. Upon expiration or termination of this MNDA or upon the Disclosing Party's earlier request, the Receiving Party will: (a) cease using Confidential Information; (b) promptly after the Disclosing Party's written request, destroy all Confidential Information in the Receiving Party's possession or control or return it to the Disclosing Party; and (c) if requested by the Disclosing Party, confirm its compliance with these obligations in writing. As an exception to subsection (b), the Receiving Party may retain Confidential Information in accordance with its standard backup or record retention policies or as required by law, but the terms of this MNDA will continue to apply to the retained Confidential Information.

7. **Proprietary Rights**. The Disclosing Party retains all of its intellectual property and other rights in its Confidential Information and its disclosure to the Receiving Party grants no license under such rights.

8. **Disclaimer**. ALL CONFIDENTIAL INFORMATION IS PROVIDED "AS IS", WITH ALL FAULTS, AND WITHOUT WARRANTIES, INCLUDING THE IMPLIED WARRANTIES OF TITLE, MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.

9. **Governing Law and Jurisdiction**. This MNDA and all matters relating hereto are governed by, and construed in accordance with, the laws of the State of {{GOVERNING_LAW}}, without regard to the conflict of laws provisions of such {{GOVERNING_LAW}}. Any legal suit, action, or proceeding relating to this MNDA must be instituted in the federal or state courts located in {{JURISDICTION}}. Each party irrevocably submits to the exclusive jurisdiction of such {{JURISDICTION}} in any such suit, action, or proceeding.

10. **Equitable Relief**. A breach of this MNDA may cause irreparable harm for which monetary damages are an insufficient remedy. Upon a breach of this MNDA, the Disclosing Party is entitled to seek appropriate equitable relief, including an injunction, in addition to its other remedies.

11. **General**. Neither party has an obligation under this MNDA to disclose Confidential Information to the other or proceed with any proposed transaction. Neither party may assign this MNDA without the prior written consent of the other party, except that either party may assign this MNDA in connection with a merger, reorganization, acquisition or other transfer of all or substantially all its assets or voting securities. Any assignment in violation of this Section is null and void. This MNDA will bind and inure to the benefit of each party's permitted successors and assigns. Waivers must be signed by the waiving party's authorized representative and cannot be implied from conduct. If any provision of this MNDA is held unenforceable, it will be limited to the minimum extent necessary so the rest of this MNDA remains in effect. This MNDA (including the Cover Page) constitutes the entire agreement of the parties with respect to its subject matter, and supersedes all prior and contemporaneous understandings, agreements, representations, and warranties, whether written or oral, regarding such subject matter. This MNDA may only be amended, modified, waived, or supplemented by an agreement in writing signed by both parties. Notices, requests and approvals under this MNDA must be sent in writing to the email or postal addresses on the Cover Page and are deemed delivered on receipt. This MNDA may be executed in counterparts, including electronic copies, each of which is deemed an original and which together form the same agreement.

---

Common Paper Mutual Non-Disclosure Agreement [Version 1.0](https://commonpaper.com/standards/mutual-nda/1.0/) free to use under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
`;

export interface NDAFormData {
  purpose: string;
  effectiveDate: string;
  mndaTerm: "1year" | "continues";
  confidentialityTerm: "1year" | "perpetual";
  governingLaw: string;
  jurisdiction: string;
  party1Name: string;
  party1Title: string;
  party1Company: string;
  party1Address: string;
  party1Email: string;
  party1Date: string;
  party2Name: string;
  party2Title: string;
  party2Company: string;
  party2Address: string;
  party2Email: string;
  party2Date: string;
}

export function generateNDADocument(data: NDAFormData): string {
  const mndaTermText = data.mndaTerm === "1year" ? "1 year(s)" : "continues until terminated in accordance with the terms of the MNDA";
  const confidentialityTermText = data.confidentialityTerm === "1year" ? "1 year(s) from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws" : "In perpetuity";

  const rawDocument = `# Mutual Non-Disclosure Agreement

## COVER PAGE

### Purpose
${data.purpose}

### Effective Date
${data.effectiveDate}

### MNDA Term
${data.mndaTerm === "1year" ? "Expires 1 year(s) from Effective Date." : "Continues until terminated in accordance with the terms of the MNDA."}

### Term of Confidentiality
${data.confidentialityTerm === "1year" ? "1 year(s) from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws." : "In perpetuity."}

### Governing Law & Jurisdiction
**Governing Law:** ${data.governingLaw}

**Jurisdiction:** ${data.jurisdiction}

---

## SIGNATURE PAGE

| | PARTY 1 | PARTY 2 |
|:---|:---|:---|
| **Signature** | _____________________ | _____________________ |
| **Print Name** | ${data.party1Name} | ${data.party2Name} |
| **Title** | ${data.party1Title} | ${data.party2Title} |
| **Company** | ${data.party1Company} | ${data.party2Company} |
| **Notice Address** | ${data.party1Address} | ${data.party2Address} |
| **Email** | ${data.party1Email} | ${data.party2Email} |
| **Date** | ${data.party1Date} | ${data.party2Date} |

---

${ndaStandardTerms}`;

  return rawDocument
    .replace(/{{PURPOSE}}/g, data.purpose)
    .replace(/{{EFFECTIVE_DATE}}/g, data.effectiveDate)
    .replace(/{{MNDA_TERM}}/g, mndaTermText)
    .replace(/{{CONFIDENTIALITY_TERM}}/g, confidentialityTermText)
    .replace(/{{GOVERNING_LAW}}/g, data.governingLaw)
    .replace(/{{JURISDICTION}}/g, data.jurisdiction);
}

export const NDA_FIELD_LABELS: Record<keyof NDAFormData, string> = {
  purpose: "Purpose",
  effectiveDate: "Effective Date",
  mndaTerm: "MNDA Term",
  confidentialityTerm: "Confidentiality Term",
  governingLaw: "Governing Law",
  jurisdiction: "Jurisdiction",
  party1Name: "Party 1 Name",
  party1Title: "Party 1 Title",
  party1Company: "Party 1 Company",
  party1Address: "Party 1 Address",
  party1Email: "Party 1 Email",
  party1Date: "Party 1 Date",
  party2Name: "Party 2 Name",
  party2Title: "Party 2 Title",
  party2Company: "Party 2 Company",
  party2Address: "Party 2 Address",
  party2Email: "Party 2 Email",
  party2Date: "Party 2 Date",
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateFormData(data: NDAFormData): string[] {
  const errors: string[] = [];

  if (!data.purpose.trim()) errors.push("Purpose is required");
  if (!data.effectiveDate.trim()) errors.push("Effective Date is required");
  if (!data.governingLaw.trim()) errors.push("Governing Law is required");
  if (!data.jurisdiction.trim()) errors.push("Jurisdiction is required");
  if (!data.party1Name.trim()) errors.push("Party 1 Name is required");
  if (!data.party1Title.trim()) errors.push("Party 1 Title is required");
  if (!data.party1Company.trim()) errors.push("Party 1 Company is required");
  if (!data.party1Address.trim()) errors.push("Party 1 Address is required");
  if (!data.party1Email.trim()) errors.push("Party 1 Email is required");
  else if (!emailRegex.test(data.party1Email)) errors.push("Party 1 Email is not valid");
  if (!data.party1Date.trim()) errors.push("Party 1 Date is required");
  if (!data.party2Name.trim()) errors.push("Party 2 Name is required");
  if (!data.party2Title.trim()) errors.push("Party 2 Title is required");
  if (!data.party2Company.trim()) errors.push("Party 2 Company is required");
  if (!data.party2Address.trim()) errors.push("Party 2 Address is required");
  if (!data.party2Email.trim()) errors.push("Party 2 Email is required");
  else if (!emailRegex.test(data.party2Email)) errors.push("Party 2 Email is not valid");
  if (!data.party2Date.trim()) errors.push("Party 2 Date is required");

  return errors;
}
