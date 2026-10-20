"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="primary"
      className="w-full"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? "Código copiado!" : "Copiar código Pix"}
    </Button>
  );
}
