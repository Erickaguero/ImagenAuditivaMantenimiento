import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase, type NewsData } from "@/lib/supabase";
import { slugify, todayISO } from "@/lib/format";
import { useUploadedImages } from "@/lib/images";
import ImageUpload from "./ImageUpload";
import { Field, PrimaryButton, ToggleRow, inputClass } from "./FormParts";

interface FormState {
  title: string;
  date: string;
  summary: string;
  content: string;
  image_url: string;
  in_home: boolean;
  published: boolean;
}

const emptyForm = (): FormState => ({
  title: "",
  date: todayISO(),
  summary: "",
  content: "",
  image_url: "",
  in_home: true,
  published: true,
});

async function uniqueSlug(base: string): Promise<string> {
  const { data } = await supabase.from("news").select("slug").like("slug", `${base}%`);
  const taken = new Set((data ?? []).map((r) => r.slug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

// La fecha se guarda al mediodía de Costa Rica para que no "salte" de día por la zona horaria.
const dateToTimestamp = (date: string) => `${date}T12:00:00-06:00`;
const timestampToDate = (ts: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Costa_Rica" }).format(new Date(ts));

export default function NewsFormModal({
  open,
  news,
  onClose,
  onSaved,
}: {
  open: boolean;
  news: NewsData | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const images = useUploadedImages();

  useEffect(() => {
    if (!open) return;
    setForm(
      news
        ? {
            title: news.title,
            date: timestampToDate(news.published_at),
            summary: news.summary ?? "",
            content: news.content ?? "",
            image_url: news.image_url ?? "",
            in_home: news.in_home,
            published: news.published,
          }
        : emptyForm(),
    );
  }, [open, news]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Completá el título y el contenido.");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      published_at: dateToTimestamp(form.date || todayISO()),
      summary: form.summary.trim(),
      content: form.content.trim(),
      image_url: form.image_url,
      in_home: form.in_home,
      published: form.published,
    };
    const { error } = news
      ? await supabase.from("news").update(payload).eq("id", news.id)
      : await supabase
          .from("news")
          .insert({ ...payload, slug: await uniqueSlug(slugify(payload.title).slice(0, 80).replace(/-+$/, "")) });
    setSaving(false);
    if (error) {
      toast.error(`No se pudo guardar: ${error.message}`);
      return;
    }
    toast.success(news ? "Cambios guardados ✓" : "Noticia creada ✓");
    images.cleanup(form.image_url, news?.image_url);
    onSaved();
  }

  const cancel = () => {
    images.cleanup(news?.image_url ?? null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !saving && cancel()}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto p-0">
        <form onSubmit={onSubmit}>
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border sticky top-0 bg-background z-10">
            <DialogTitle className="text-xl">{news ? "Editar noticia" : "Nueva noticia"}</DialogTitle>
            <DialogDescription>Los campos con * son obligatorios.</DialogDescription>
          </DialogHeader>

          <div className="px-6 py-5 space-y-5">
            <Field label="Título" required htmlFor="title">
              <input
                id="title"
                className={inputClass}
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                required
              />
            </Field>

            <Field label="Fecha de publicación" htmlFor="date" help="Las noticias se ordenan por esta fecha, de la más nueva a la más vieja.">
              <input
                id="date"
                type="date"
                className={`${inputClass} sm:max-w-xs`}
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </Field>

            <Field label="Imagen" help="Idealmente horizontal (formato 16:9).">
              <ImageUpload
                bucket="news"
                value={form.image_url}
                onChange={(url) => {
                  images.track(url);
                  set("image_url", url);
                }}
                aspect="aspect-video"
              />
            </Field>

            <Field
              label="Resumen"
              htmlFor="summary"
              help="Opcional. Es el texto corto de la tarjeta. Si lo dejás vacío, se usan las primeras líneas del contenido."
            >
              <textarea
                id="summary"
                rows={2}
                className={inputClass}
                value={form.summary}
                onChange={(e) => set("summary", e.target.value)}
              />
            </Field>

            <Field label="Contenido" required htmlFor="content" help="Dejá una línea en blanco entre párrafos.">
              <textarea
                id="content"
                rows={12}
                className={inputClass}
                value={form.content}
                onChange={(e) => set("content", e.target.value)}
                required
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ToggleRow
                label="Mostrar en inicio"
                help="En la página de inicio se muestran las 3 más recientes que tengan esto activado."
                checked={form.in_home}
                onChange={(v) => set("in_home", v)}
              />
              <ToggleRow
                label="Publicada"
                help="Si la apagás, la noticia queda guardada pero no se ve en el sitio."
                checked={form.published}
                onChange={(v) => set("published", v)}
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-border flex justify-end gap-3 sticky bottom-0 bg-background">
            <button
              type="button"
              onClick={cancel}
              disabled={saving}
              className="px-5 py-2.5 rounded-lg border border-border hover:bg-muted font-medium"
            >
              Cancelar
            </button>
            <PrimaryButton type="submit" loading={saving}>
              {news ? "Guardar cambios" : "Crear noticia"}
            </PrimaryButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
