"use client";

import { useDocuments } from "@/hooks/useDocuments";
import { DocumentCard } from "./DocumentCard";

export function DocumentGrid() {
  const { state, loadDocuments } = useDocuments();

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading documents...</div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-red-800 text-sm">{state.error}</p>
        <button
          onClick={loadDocuments}
          className="mt-2 text-xs text-red-600 hover:text-red-700 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (state.documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-gray-400 mb-2">📄</div>
        <p className="text-gray-600 font-medium">No documents yet</p>
        <p className="text-gray-500 text-sm mt-1">
          Create your first NDA to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {state.documents.map((doc) => (
        <DocumentCard key={doc.id} document={doc} />
      ))}
    </div>
  );
}
