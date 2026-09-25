import { useRef } from "react";
import { supabase } from "@/lib/supabase";

/** Lado más largo con que se guardan pósters y fotos. Alcanza para verlas nítidas a pantalla completa. */
const MAX_SIDE = 1600;
const WEBP_QUALITY = 0.82;
const COMPRESSIBLE = ["image/png", "image/jpeg", "image/webp"];

/**
 * Achica la imagen a MAX_SIDE y la pasa a WebP en el navegador, antes de subirla.
 * Un póster PNG de 4-5 MB queda en unos 200-400 KB, lo que ahorra almacenamiento y
 * transferencia del plan gratuito de Supabase. Si no se puede (GIF, navegador viejo),
 * o el resultado pesa más, devuelve el archivo original.
 */
export async function compressImage(file: File): Promise<File> {
  if (!COMPRESSIBLE.includes(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
    );
    if (!blob || blob.type !== "image/webp" || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], name, { type: "image/webp" });
  } catch {
    return file;
  }
}

const STORAGE_PREFIX = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/`;

/**
 * Borra de Storage una imagen de póster o noticia si ya ningún evento ni noticia la usa.
 * Varios eventos pueden compartir el mismo póster (al duplicar una gira), por eso se revisa antes.
 * Las URLs externas y el bucket "site" (logos) no se tocan.
 */
export async function removeUnusedImage(url: string | null | undefined): Promise<void> {
  if (!url?.startsWith(STORAGE_PREFIX)) return;
  const [bucket, ...rest] = url.slice(STORAGE_PREFIX.length).split("/");
  const path = decodeURIComponent(rest.join("/"));
  if (!path || (bucket !== "posters" && bucket !== "news")) return;

  const [events, news] = await Promise.all([
    supabase.from("events").select("id", { count: "exact", head: true }).eq("poster", url),
    supabase.from("news").select("id", { count: "exact", head: true }).eq("image_url", url),
  ]);
  if (events.error || news.error || (events.count ?? 0) + (news.count ?? 0) > 0) return;
  await supabase.storage.from(bucket).remove([path]);
}

/**
 * Para los formularios: recuerda las imágenes subidas mientras está abierto y, al cerrar,
 * borra las que quedaron sin usar (se cambió la imagen varias veces o se canceló).
 */
export function useUploadedImages() {
  const uploaded = useRef<string[]>([]);
  return {
    track(url: string) {
      if (url) uploaded.current.push(url);
    },
    /** `keep` es la imagen que quedó guardada; `previous`, la que tenía antes el registro. */
    async cleanup(keep: string | null, previous?: string | null) {
      const candidates = [...uploaded.current, previous].filter((u) => u && u !== keep);
      uploaded.current = [];
      for (const url of new Set(candidates)) await removeUnusedImage(url);
    },
  };
}
