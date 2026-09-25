import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase, type EventData } from "@/lib/supabase";
import { slugify } from "@/lib/format";
import { useUploadedImages } from "@/lib/images";
import ImageUpload from "./ImageUpload";
import { Field, PrimaryButton, ToggleRow, inputClass } from "./FormParts";

export type EventFormMode = "create" | "edit" | "duplicate";

interface FormState {
  artist: string;
  date_short: string;
  time: string;
  venue: string;
  city: string;
  tour_name: string;
  bio: string;
  poster: string;
  in_slider: boolean;
  published: boolean;
}

const EMPTY: FormState = {
  artist: "",
  date_short: "",
  time: "",
  venue: "",
  city: "",
  tour_name: "",
  bio: "",
  poster: "",
  in_slider: false,
  published: true,
};

function fromEvent(e: EventData): FormState {
  return {
    artist: e.artist ?? "",
    date_short: e.date_short ?? "",
    time: e.time ?? "",
    venue: e.venue ?? "",
    city: e.city ?? "",
    tour_name: e.tour_name ?? "",
    bio: e.bio ?? "",
    poster: e.poster ?? "",
    in_slider: e.in_slider,
    published: e.published,
  };
}

/** Genera un slug libre: "karol-g-2026-11-27", y si ya existe "karol-g-2026-11-27-2", etc. */
async function uniqueSlug(base: string): Promise<string> {
  const { data } = await supabase.from("events").select("slug").like("slug", `${base}%`);
  const taken = new Set((data ?? []).map((r) => r.slug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export default function EventFormModal({
  open,
  mode,
  event,
  venues,
  cities,
  onClose,
  onSaved,
}: {
  open: boolean;
  mode: EventFormMode;
  event: EventData | null;
  venues: string[];
  cities: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const images = useUploadedImages();

  useEffect(() => {
    if (!open) return;
    if (event && mode === "duplicate") {
      // Copia todo menos la fecha y la hora, que son lo que cambia entre funciones de una gira.
      setForm({ ...fromEvent(event), date_short: "", time: "", in_slider: false });
    } else if (event) {
      setForm(fromEvent(event));
    } else {
      setForm(EMPTY);
    }
  }, [open, event, mode]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.artist.trim() || !form.date_short) {
      toast.error("Completá al menos el nombre del artista y la fecha.");
      return;
    }
    setSaving(true);
    const payload = {
      artist: form.artist.trim(),
      date_short: form.date_short,
      time: form.time,
      venue: form.venue.trim(),
      city: form.city.trim(),
      tour_name: form.tour_name.trim(),
      bio: form.bio.trim(),
      poster: form.poster,
      in_slider: form.in_slider,
      published: form.published,
    };

    const { error } =
      mode === "edit" && event
        ? await supabase.from("events").update(payload).eq("id", event.id)
        : await supabase
            .from("events")
            .insert({ ...payload, slug: await uniqueSlug(slugify(`${payload.artist} ${payload.date_short}`)) });

    setSaving(false);
    if (error) {
      toast.error(`No se pudo guardar: ${error.message}`);
      return;
    }
    toast.success(mode === "edit" ? "Cambios guardados ✓" : "Evento creado ✓");
    images.cleanup(form.poster, mode === "edit" ? event?.poster : null);
    onSaved();
  }

  const cancel = () => {
    images.cleanup(event?.poster ?? null);
    onClose();
  };

  const title = { create: "Nuevo evento", edit: "Editar evento", duplicate: "Duplicar evento" }[mode];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !saving && cancel()}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto p-0">
        <form onSubmit={onSubmit}>
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border sticky top-0 bg-background z-10">
            <DialogTitle className="text-xl">{title}</DialogTitle>
            <DialogDescription>
              {mode === "duplicate"
                ? "Se copió toda la información. Solo elegí la nueva fecha y hora."
                : "Los campos con * son obligatorios."}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-5 space-y-5">
            <Field label="Artista o nombre del evento" required htmlFor="artist">
              <input
                id="artist"
                className={inputClass}
                value={form.artist}
                onChange={(e) => set("artist", e.target.value)}
                placeholder="Ej.: Karol G"
                required
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Fecha" required htmlFor="date">
                <input
                  id="date"
                  type="date"
                  className={inputClass}
                  value={form.date_short}
                  onChange={(e) => set("date_short", e.target.value)}
                  required
                />
              </Field>
              <Field label="Hora" htmlFor="time" help='Si todavía no se sabe, dejala vacía: se mostrará "Por confirmar".'>
                <input
                  id="time"
                  type="time"
                  className={inputClass}
                  value={form.time}
                  onChange={(e) => set("time", e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Recinto" htmlFor="venue" help="Empezá a escribir y elegí uno de la lista, o escribí uno nuevo.">
                <input
                  id="venue"
                  list="venue-options"
                  className={inputClass}
                  value={form.venue}
                  onChange={(e) => set("venue", e.target.value)}
                  placeholder="Ej.: Estadio Nacional"
                />
                <datalist id="venue-options">
                  {venues.map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
              </Field>
              <Field label="Ciudad" htmlFor="city">
                <input
                  id="city"
                  list="city-options"
                  className={inputClass}
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="Ej.: San José"
                />
                <datalist id="city-options">
                  {cities.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
            </div>

            <Field label="Póster" help="Idealmente vertical (formato 3:4), como los afiches oficiales.">
              <ImageUpload bucket="posters" value={form.poster} onChange={(url) => {
                  images.track(url);
                  set("poster", url);
                }} />
            </Field>

            <Field label="Acerca del evento" htmlFor="about" help="Nombre de la gira o una descripción corta. Se muestra en la página del evento.">
              <textarea
                id="about"
                rows={3}
                className={inputClass}
                value={form.tour_name}
                onChange={(e) => set("tour_name", e.target.value)}
                placeholder="Ej.: Viajando por el Mundo - Tropitour"
              />
            </Field>

            <Field label="Biografía del artista" htmlFor="bio" help="Podés dejar líneas en blanco para separar párrafos.">
              <textarea
                id="bio"
                rows={6}
                className={inputClass}
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ToggleRow
                label="Destacar en el carrusel"
                help="Aparece en el carrusel grande del inicio (solo mientras no haya pasado)."
                checked={form.in_slider}
                onChange={(v) => set("in_slider", v)}
              />
              <ToggleRow
                label="Publicado"
                help="Si lo apagás, el evento queda guardado pero no se ve en el sitio."
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
              {mode === "edit" ? "Guardar cambios" : "Crear evento"}
            </PrimaryButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
