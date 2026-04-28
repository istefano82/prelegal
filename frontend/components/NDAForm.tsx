"use client";

import { NDAFormData } from "@/utils/nda";
import { ChangeEvent } from "react";

interface NDAFormProps {
  data: NDAFormData;
  onChange: (data: NDAFormData) => void;
}

export function NDAForm({ data, onChange }: NDAFormProps) {
  const handleInputChange = (
    field: keyof NDAFormData,
    value: string
  ) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 overflow-y-auto max-h-[calc(100vh-2rem)]">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Mutual NDA Creator</h2>

      {/* Purpose Section */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Purpose
        </label>
        <textarea
          value={data.purpose}
          onChange={(e) => handleInputChange("purpose", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={2}
          placeholder="How Confidential Information may be used"
        />
      </div>

      {/* Effective Date */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Effective Date
        </label>
        <input
          type="date"
          value={data.effectiveDate}
          onChange={(e) => handleInputChange("effectiveDate", e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* MNDA Term */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          MNDA Term
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="mndaTerm"
              value="1year"
              checked={data.mndaTerm === "1year"}
              onChange={(e) => handleInputChange("mndaTerm", e.target.value)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="ml-2 text-gray-700">Expires 1 year(s) from Effective Date</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="mndaTerm"
              value="continues"
              checked={data.mndaTerm === "continues"}
              onChange={(e) => handleInputChange("mndaTerm", e.target.value)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="ml-2 text-gray-700">Continues until terminated in accordance with the terms</span>
          </label>
        </div>
      </div>

      {/* Confidentiality Term */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Term of Confidentiality
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="confidentialityTerm"
              value="1year"
              checked={data.confidentialityTerm === "1year"}
              onChange={(e) => handleInputChange("confidentialityTerm", e.target.value)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="ml-2 text-gray-700">1 year(s) from Effective Date</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="confidentialityTerm"
              value="perpetual"
              checked={data.confidentialityTerm === "perpetual"}
              onChange={(e) => handleInputChange("confidentialityTerm", e.target.value)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="ml-2 text-gray-700">In perpetuity</span>
          </label>
        </div>
      </div>

      {/* Governing Law & Jurisdiction */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Governing Law
          </label>
          <input
            type="text"
            value={data.governingLaw}
            onChange={(e) => handleInputChange("governingLaw", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., California"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Jurisdiction
          </label>
          <input
            type="text"
            value={data.jurisdiction}
            onChange={(e) => handleInputChange("jurisdiction", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., San Francisco, CA"
          />
        </div>
      </div>

      {/* Party 1 */}
      <div className="mb-8 pb-8 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Party 1</h3>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            value={data.party1Name}
            onChange={(e) => handleInputChange("party1Name", e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Name"
          />
          <input
            type="text"
            value={data.party1Title}
            onChange={(e) => handleInputChange("party1Title", e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Title"
          />
          <input
            type="text"
            value={data.party1Company}
            onChange={(e) => handleInputChange("party1Company", e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Company"
          />
          <input
            type="email"
            value={data.party1Email}
            onChange={(e) => handleInputChange("party1Email", e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Email"
          />
          <textarea
            value={data.party1Address}
            onChange={(e) => handleInputChange("party1Address", e.target.value)}
            className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={2}
            placeholder="Notice Address"
          />
          <input
            type="date"
            value={data.party1Date}
            onChange={(e) => handleInputChange("party1Date", e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Date"
          />
        </div>
      </div>

      {/* Party 2 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Party 2</h3>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            value={data.party2Name}
            onChange={(e) => handleInputChange("party2Name", e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Name"
          />
          <input
            type="text"
            value={data.party2Title}
            onChange={(e) => handleInputChange("party2Title", e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Title"
          />
          <input
            type="text"
            value={data.party2Company}
            onChange={(e) => handleInputChange("party2Company", e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Company"
          />
          <input
            type="email"
            value={data.party2Email}
            onChange={(e) => handleInputChange("party2Email", e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Email"
          />
          <textarea
            value={data.party2Address}
            onChange={(e) => handleInputChange("party2Address", e.target.value)}
            className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={2}
            placeholder="Notice Address"
          />
          <input
            type="date"
            value={data.party2Date}
            onChange={(e) => handleInputChange("party2Date", e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Date"
          />
        </div>
      </div>
    </div>
  );
}
