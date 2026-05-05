"use client";

import { useContext } from "react";
import { DocumentContext, DocumentContextType } from "@/contexts/DocumentContext";

export function useDocuments(): DocumentContextType {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error("useDocuments must be used within a DocumentProvider");
  }
  return context;
}
