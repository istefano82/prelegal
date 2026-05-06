import { DocumentGrid } from "@/components/DocumentGrid";

export default function DocumentsPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My NDA Documents</h1>
        <p className="text-gray-600 mt-2">
          View, manage, and organize your NDA documents
        </p>
      </div>
      <DocumentGrid />
    </main>
  );
}
