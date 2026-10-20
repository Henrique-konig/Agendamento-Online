"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { addPhoto, deletePhoto, updatePhotoCaption } from "./actions";
import { uploadImage } from "./image-upload";

type Photo = { id: string; image_url: string; caption: string | null };

export function GalleryManager({
  professionalId,
  initialPhotos,
  maxPhotos,
}: {
  professionalId: string;
  initialPhotos: Photo[];
  maxPhotos: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState(initialPhotos);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const remaining = maxPhotos - photos.length;

  function handleFiles(files: File[]) {
    setError(null);
    startTransition(async () => {
      for (const file of files.slice(0, remaining)) {
        try {
          const url = await uploadImage(file, professionalId, "foto");
          const result = await addPhoto(url);
          if (!result.ok || !result.id) throw new Error(result.message);
          const id = result.id;
          setPhotos((prev) => [...prev, { id, image_url: url, caption: null }]);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Falha no envio.");
          break;
        }
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deletePhoto(id);
      if (result.ok) setPhotos((prev) => prev.filter((p) => p.id !== id));
    });
  }

  return (
    <div className="space-y-6">
      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-ink-500">
          {photos.length} de {maxPhotos} fotos · JPG, PNG ou WebP até 5 MB
        </p>
        <Button disabled={pending || remaining <= 0} onClick={() => inputRef.current?.click()}>
          {pending ? "Enviando…" : "Adicionar fotos"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-label="Adicionar fotos"
          onChange={(e) => {
            handleFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      {photos.length ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {photos.map((photo) => (
            <li key={photo.id} className="overflow-hidden rounded-xl bg-white ring-1 ring-ink-200">
              <div className="relative aspect-square bg-ink-100">
                <Image
                  src={photo.image_url}
                  alt={photo.caption ?? ""}
                  fill
                  sizes="(min-width: 640px) 33vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="space-y-2 p-3">
                <input
                  defaultValue={photo.caption ?? ""}
                  maxLength={140}
                  placeholder="Legenda (opcional)"
                  aria-label="Legenda"
                  className="w-full rounded-md border-0 px-2 py-1 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-600"
                  onBlur={(e) => {
                    if (e.target.value !== (photo.caption ?? "")) {
                      void updatePhotoCaption(photo.id, e.target.value);
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleDelete(photo.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-ink-200 p-12 text-center text-sm text-ink-500">
          Mostre seu trabalho: ambiente, antes e depois, resultados.
        </div>
      )}
    </div>
  );
}
