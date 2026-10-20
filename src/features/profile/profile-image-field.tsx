"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/features/photos/image-upload";
import { publicMediaUrl } from "@/lib/storage";
import { cn } from "@/lib/utils/cn";
import { setProfileImage } from "./actions";

type Props = {
  kind: "avatar" | "cover";
  label: string;
  professionalId: string;
  currentPath: string | null;
};

export function ProfileImageField({ kind, label, professionalId, currentPath }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [path, setPath] = useState(currentPath);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const url = publicMediaUrl(path);

  function handleFile(file: File) {
    setError(null);
    startTransition(async () => {
      try {
        const newPath = await uploadImage(file, professionalId, kind);
        const result = await setProfileImage({ kind, path: newPath });
        if (!result.ok) throw new Error(result.message);
        setPath(newPath);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha no envio.");
      }
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await setProfileImage({ kind, path: null });
      if (result.ok) setPath(null);
      else setError(result.message ?? "Falha ao remover.");
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-ink-800">{label}</p>
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "relative overflow-hidden bg-ink-100 ring-1 ring-ink-200",
            kind === "avatar" ? "size-20 rounded-full" : "h-20 w-36 rounded-lg",
          )}
        >
          {url ? <Image src={url} alt="" fill sizes="144px" className="object-cover" /> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            {pending ? "Enviando…" : path ? "Trocar" : "Enviar imagem"}
          </Button>
          {path ? (
            <Button variant="ghost" size="sm" disabled={pending} onClick={handleRemove}>
              Remover
            </Button>
          ) : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label={label}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
