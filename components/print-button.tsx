"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      className="button button-primary compact print-button"
      type="button"
      onClick={() => window.print()}
    >
      <Printer /> Imprimir / PDF
    </button>
  );
}

