import { useCallback, useEffect, useState } from "react";
import { EyeOff, Info, Loader2, Music } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { supabase, type EventData } from "@/lib/supabase";
import { formatShortDate, todayISO } from "@/lib/format";

/** Cuántos eventos muestra el sitio en el carrusel cuando no hay ninguno destacado. */
const AUTO_COUNT = 3;

function Thumb({ event, className }: { event: EventData; className: string }) {
  return (
    <div className={`rounded-lg overflow-hidden bg-muted shrink-0 flex items-center justify-center ${className}`}>
      {event.poster ? (
        <img src={event.poster} alt="" className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <Music className="w-6 h-6 text-muted-foreground/50" />
      )}
    </div>
  );
}

/**
 * Elegir qué eventos salen en el carrusel grande del inicio. Replica la regla del sitio:
 * los destacados que todavía no pasaron; si no hay ninguno, los 3 próximos.
 */
export default function CarouselTab() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .gte("date_short", todayISO())
      .order("date_short", { ascending: true })
      .order("time", { ascending: true });
    if (error) toast.error("No se pudieron cargar los eventos.");
    setEvents(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setFeatured(event: EventData, value: boolean) {
    setEvents((list) => list.map((e) => (e.id === event.id ? { ...e, in_slider: value } : e)));
    const { error } = await supabase.from("events").update({ in_slider: value }).eq("id", event.id);
    if (error) {
      toast.error("No se pudo guardar el cambio.");
      load();
    } else {
      toast.success(value ? "Agregado al carrusel ✓" : "Quitado del carrusel ✓");
    }
  }

  const published = events.filter((e) => e.published);
  const featured = published.filter((e) => e.in_slider);
  const automatic = featured.length === 0;
  // El sitio no muestra en el carrusel los eventos sin póster.
  const showing = (automatic ? published.slice(0, AUTO_COUNT) : featured).filter((e) => e.poster);

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-2xl border border-border">
        <h1 className="text-2xl font-bold">Carrusel del inicio</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Elegí qué eventos aparecen en el carrusel grande de la página de inicio. Cuando la fecha de un evento pasa,
          sale solo del carrusel.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <section className="bg-card p-6 rounded-2xl border border-border">
            <h2 className="font-semibold mb-1">Así se ve ahora</h2>
            {automatic ? (
              <p className="text-sm text-muted-foreground mb-4 flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                No hay ningún evento elegido, así que el sitio muestra automáticamente los {AUTO_COUNT} próximos.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mb-4">
                {showing.length} {showing.length === 1 ? "evento elegido" : "eventos elegidos"}, en orden de fecha.
              </p>
            )}
            {showing.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay eventos próximos publicados.</p>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {showing.map((e) => (
                  <div key={e.id} className="w-28 shrink-0">
                    <Thumb event={e} className="w-28 h-[150px] border border-border" />
                    <div className="text-sm font-semibold mt-2 truncate">{e.artist}</div>
                    <div className="text-xs text-muted-foreground">{formatShortDate(e.date_short)}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="font-semibold mb-3">Próximos eventos</h2>
            {events.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-2xl border border-border text-muted-foreground">
                No hay eventos próximos. Crealos en la pestaña Eventos.
              </div>
            ) : (
              <ul className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
                {events.map((event) => (
                  <li key={event.id} className="flex items-center gap-4 p-4">
                    <Thumb event={event} className="w-12 h-16" />
                    <div className="min-w-0 flex-1">
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
                        {event.city ? ` · ${event.city}` : ""}
                      </div>
                      {!event.published && event.in_slider && (
                        <div className="text-xs text-amber-700 mt-0.5">
                          Está elegido, pero no se ve porque el evento está oculto.
                        </div>
                      )}
                      {!event.poster && (
                        <div className="text-xs text-amber-700 mt-0.5">Sin póster: no aparece en el carrusel.</div>
                      )}
                    </div>
                    <label className="flex items-center gap-3 shrink-0 cursor-pointer">
                      <span className="hidden sm:inline text-sm text-muted-foreground">En el carrusel</span>
                      <Switch
                        checked={event.in_slider}
                        onCheckedChange={(v) => setFeatured(event, v)}
                        aria-label={`Mostrar ${event.artist} en el carrusel`}
                      />
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
