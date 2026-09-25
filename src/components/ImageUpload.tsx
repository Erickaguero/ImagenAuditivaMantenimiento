import { useRef, useState, type DragEvent } from "react";
import { ImagePlus, Loader2, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/images";

const MAX_MB = 10;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

/**
 * Subida de imagen con vista previa: se puede hacer clic o arrastrar el archivo.
 * La imagen se sube apenas se elige y el componente devuelve su URL pública.
 */
export default function ImageUpload({
  bucket,
  value,
  onChange,
  aspect = "aspect-[3/4]",
  accept = ACCEPTED,
}: {
  bucket: "posters" | "news" | "site";
  value: string;
  onChange: (url: string) => void;
  aspect?: string;
  accept?: string[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function upload(original: File) {
    if (!accept.includes(original.type)) {
      toast.error("Ese archivo no es una imagen compatible. Usá JPG, PNG o WEBP.");
      return;
    }
    setUploading(true);
    // Los logos (bucket "site") se suben tal cual; pósters y fotos se achican y pasan a WebP.
    const file = bucket === "site" ? original : await compressImage(original);
    if (file.size > MAX_MB * 1024 * 1024) {
      setUploading(false);
      toast.error(`La imagen pesa más de ${MAX_MB} MB. Probá con una más liviana.`);
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      contentType: file.type,
      cacheControl: "31536000",
    });
    setUploading(false);
    if (error) {
      toast.error(`No se pudo subir la imagen: ${error.message}`);
      return;
    }
    onChange(supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl);
    toast.success("Imagen cargada ✓");
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
      {value ? (
        <div className="flex items-start gap-4">
          <div className={`relative w-36 ${aspect} rounded-xl overflow-hidden border border-border bg-muted shrink-0`}>
            <img src={value} alt="Vista previa" className="w-full h-full object-cover" />
            {uploading && (
              <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border hover:bg-muted text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" /> Cambiar imagen
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-red-600 hover:bg-red-50 text-sm font-medium"
            >
              <X className="w-4 h-4" /> Quitar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          disabled={uploading}
          className={`w-full rounded-xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-2 text-center transition-colors ${
            dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/60 hover:bg-muted/50"
          }`}
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          ) : (
            <ImagePlus className="w-8 h-8 text-muted-foreground" />
          )}
          <span className="text-sm font-semibold">
            {uploading ? "Subiendo imagen..." : "Hacé clic o arrastrá una imagen aquí"}
          </span>
          <span className="text-xs text-muted-foreground">JPG, PNG o WEBP · máximo {MAX_MB} MB</span>
        </button>
      )}
    </div>
  );
}
