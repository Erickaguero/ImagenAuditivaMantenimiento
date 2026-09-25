import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, EyeOff, Loader2, Music, Pencil, Plus, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { removeUnusedImage } from "@/lib/images";
import { supabase, type EventData } from "@/lib/supabase";
import { formatShortDate, todayISO } from "@/lib/format";
import EventFormModal, { type EventFormMode } from "./EventFormModal";
import { DeleteButton, PrimaryButton, inputClass } from "./FormParts";

const unique = (values: (string | null)[]) =>
  [...new Set(values.map((v) => v?.trim()).filter(Boolean) as string[])].sort((a, b) =>
    a.localeCompare(b, "es"),
  );

export default function EventsTab() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");
  const [modal, setModal] = useState<{ mode: EventFormMode; event: EventData | null } | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("date_short", { ascending: true })
      .order("time", { ascending: true });
    if (error) toast.error("No se pudieron cargar los eventos.");
    setEvents(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const today = todayISO();
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = events.filter((e) => {
      if (filter === "upcoming" && e.date_short < today) return false;
      if (filter === "past" && e.date_short >= today) return false;
      if (!term) return true;
      return [e.artist, e.venue, e.city].some((v) => v?.toLowerCase().includes(term));
    });
    return filter === "past" ? list.reverse() : list;
  }, [events, search, filter, today]);

  async function toggle(event: EventData, field: "in_slider" | "published") {
    const value = !event[field];
    setEvents((list) => list.map((e) => (e.id === event.id ? { ...e, [field]: value } : e)));
    const { error } = await supabase.from("events").update({ [field]: value }).eq("id", event.id);
    if (error) {
      toast.error("No se pudo guardar el cambio.");
      load();
    } else {
      toast.success("Guardado ✓");
    }
  }

  async function remove(event: EventData) {
    const { error } = await supabase.from("events").delete().eq("id", event.id);
    if (error) {
      toast.error(`No se pudo eliminar: ${error.message}`);
      return;
    }
    setEvents((list) => list.filter((e) => e.id !== event.id));
    toast.success("Evento eliminado");
    removeUnusedImage(event.poster);
  }

  const featuredCount = events.filter((e) => e.in_slider && e.published && e.date_short >= today).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border">
        <div>
          <h1 className="text-2xl font-bold">Eventos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Creá, editá o eliminá los conciertos de la cartelera. Con la ★ elegís cuáles salen en el carrusel del
            inicio ({featuredCount} {featuredCount === 1 ? "destacado" : "destacados"} ahora).
          </p>
        </div>
        <PrimaryButton onClick={() => setModal({ mode: "create", event: null })} className="shrink-0">
          <Plus className="w-5 h-5" /> Nuevo evento
        </PrimaryButton>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por artista, recinto o ciudad..."
            className={`${inputClass} pl-10 bg-card`}
          />
        </div>
        <div className="flex bg-card border border-border rounded-lg p-1 gap-1">
          {(
            [
              ["upcoming", "Próximos"],
              ["past", "Pasados"],
              ["all", "Todos"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border text-muted-foreground">
          No hay eventos para mostrar.
        </div>
      ) : (
        <ul className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {visible.map((event) => (
            <li key={event.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-muted/40">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-14 h-[74px] rounded-lg overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                  {event.poster ? (
                    <img src={event.poster} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <Music className="w-6 h-6 text-muted-foreground/50" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold truncate flex items-center gap-2">
                    {event.artist}
                    {!event.published && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        <EyeOff className="w-3 h-3" /> Oculto
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatShortDate(event.date_short)}
                    {event.time ? ` · ${event.time}` : " · Hora por confirmar"}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {[event.venue, event.city].filter(Boolean).join(", ")}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:shrink-0 self-end sm:self-auto">
                <button
                  onClick={() => toggle(event, "in_slider")}
                  title={event.in_slider ? "Quitar del carrusel" : "Destacar en el carrusel"}
                  className={`p-2 rounded-lg transition-colors ${
                    event.in_slider ? "text-amber-500 hover:bg-amber-50" : "text-muted-foreground/50 hover:bg-muted"
                  }`}
                >
                  <Star className="w-5 h-5" fill={event.in_slider ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={() => setModal({ mode: "duplicate", event })}
                  title="Duplicar (para otra fecha de la misma gira)"
                  className="p-2 rounded-lg text-muted-foreground hover:bg-muted"
                >
                  <Copy className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setModal({ mode: "edit", event })}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-blue-700 hover:bg-blue-50 text-sm font-medium"
                >
                  <Pencil className="w-4 h-4" /> Editar
                </button>
                <DeleteButton
                  title={`¿Eliminar "${event.artist}"?`}
                  description={`Se va a borrar el evento del ${formatShortDate(event.date_short)}. Esta acción no se puede deshacer. Si solo querés esconderlo, editalo y apagá "Publicado".`}
                  onConfirm={() => remove(event)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <EventFormModal
        open={modal !== null}
        mode={modal?.mode ?? "create"}
        event={modal?.event ?? null}
        venues={unique(events.map((e) => e.venue))}
        cities={unique(events.map((e) => e.city))}
        onClose={() => setModal(null)}
        onSaved={() => {
          setModal(null);
          load();
        }}
      />
    </div>
  );
}
