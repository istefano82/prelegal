"use client";

import { NDAFormData, generateNDADocument } from "@/utils/nda";
import ReactMarkdown from "react-markdown";

interface NDAPreviewProps {
  data: NDAFormData;
}

export function NDAPreview({ data }: NDAPreviewProps) {
  const documentContent = generateNDADocument(data);

  return (
    <div className="bg-gray-50 rounded-lg shadow p-6 overflow-y-auto max-h-[calc(100vh-2rem)]">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Document Preview</h2>
      <div className="bg-white rounded p-6 prose prose-sm max-w-none">
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>,
            h2: ({ children }) => <h2 className="text-xl font-bold mt-5 mb-3">{children}</h2>,
            h3: ({ children }) => <h3 className="text-lg font-bold mt-4 mb-2">{children}</h3>,
            p: ({ children }) => <p className="mb-3 leading-relaxed text-gray-700">{children}</p>,
            table: ({ children }) => (
              <table className="w-full border-collapse my-4 border border-gray-300">{children}</table>
            ),
            thead: ({ children }) => <thead className="bg-gray-100">{children}</thead>,
            tbody: ({ children }) => <tbody>{children}</tbody>,
            tr: ({ children }) => <tr className="border border-gray-300">{children}</tr>,
            th: ({ children }) => <th className="border border-gray-300 px-3 py-2 text-left font-semibold">{children}</th>,
            td: ({ children }) => <td className="border border-gray-300 px-3 py-2">{children}</td>,
            strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
            em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
            ul: ({ children }) => <ul className="list-disc list-inside my-3 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside my-3 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="text-gray-700">{children}</li>,
            a: ({ href, children }) => (
              <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
            hr: () => <hr className="my-6 border-gray-300" />,
          }}
        >
          {documentContent}
        </ReactMarkdown>
      </div>
    </div>
  );
}
