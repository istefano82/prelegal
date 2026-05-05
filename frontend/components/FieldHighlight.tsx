"use client";

import { ReactNode } from "react";

interface FieldHighlightProps {
  highlighted: boolean;
  children: ReactNode;
}

export function FieldHighlight({ highlighted, children }: FieldHighlightProps) {
  return (
    <div
      className={`transition-all duration-300 ${
        highlighted ? "ring-2 ring-blue-400 rounded-lg p-2" : ""
      }`}
    >
      {children}
    </div>
  );
}
