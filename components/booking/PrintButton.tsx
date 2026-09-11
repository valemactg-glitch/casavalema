"use client";

import { Button } from "@/components/ui/Button";

export function PrintButton() {
  return (
    <Button variant="primary" size="sm" onClick={() => window.print()} className="print:hidden">
      Imprimir o guardar como PDF
    </Button>
  );
}
