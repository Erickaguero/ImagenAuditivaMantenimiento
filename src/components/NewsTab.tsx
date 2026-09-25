import { useCallback, useEffect, useMemo, useState } from "react";
import { EyeOff, Home, Loader2, Newspaper, Pencil, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { removeUnusedImage } from "@/lib/images";
import { supabase, type NewsData } from "@/lib/supabase";
import { formatNewsDate } from "@/lib/format";
import NewsFormModal from "./NewsFormModal";
import { DeleteButton, PrimaryButton, inputClass } from "./FormParts";

export default function NewsTab() {
  const [news, setNews] = useState<NewsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ news: NewsData | null } | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("news").select("*").order("published_at", { ascending: false });
    if (error) toast.error("No se pudieron cargar las noticias.");
    setNews(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? news.filter((n) => n.title.toLowerCase().includes(term)) : news;
  }, [news, search]);

  async function toggleHome(item: NewsData) {
    const value = !item.in_home;
    setNews((list) => list.map((n) => (n.id === item.id ? { ...n, in_home: value } : n)));
    const { error } = await supabase.from("news").update({ in_home: value }).eq("id", item.id);
    if (error) {
      toast.error("No se pudo guardar el cambio.");
      load();
    } else {
      toast.success("Guardado ✓");
    }
  }

  async function remove(item: NewsData) {
    const { error } = await supabase.from("news").delete().eq("id", item.id);
    if (error) {
      toast.error(`No se pudo eliminar: ${error.message}`);
      return;
    }
    setNews((list) => list.filter((n) => n.id !== item.id));
    toast.success("Noticia eliminada");
    removeUnusedImage(item.image_url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border">
        <div>
          <h1 className="text-2xl font-bold">Noticias</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Con el ícono de la casita elegís cuáles pueden aparecer en el inicio (se muestran las 3 más recientes).
          </p>
        </div>
        <PrimaryButton onClick={() => setModal({ news: null })} className="shrink-0">
          <Plus className="w-5 h-5" /> Nueva noticia
        </PrimaryButton>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título..."
          className={`${inputClass} pl-10 bg-card`}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border text-muted-foreground">
          No hay noticias para mostrar.
        </div>
      ) : (
        <ul className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {visible.map((item) => (
            <li key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-muted/40">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-24 aspect-video rounded-lg overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <Newspaper className="w-6 h-6 text-muted-foreground/50" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold line-clamp-2">{item.title}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                    {formatNewsDate(item.published_at)}
                    {!item.published && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        <EyeOff className="w-3 h-3" /> Oculta
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:shrink-0 self-end sm:self-auto">
                <button
                  onClick={() => toggleHome(item)}
                  title={item.in_home ? "Quitar del inicio" : "Mostrar en inicio"}
                  className={`p-2 rounded-lg transition-colors ${
                    item.in_home ? "text-primary hover:bg-primary/10" : "text-muted-foreground/50 hover:bg-muted"
                  }`}
                >
                  <Home className="w-5 h-5" fill={item.in_home ? "currentColor" : "none"} fillOpacity={0.15} />
                </button>
                <button
                  onClick={() => setModal({ news: item })}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-blue-700 hover:bg-blue-50 text-sm font-medium"
                >
                  <Pencil className="w-4 h-4" /> Editar
                </button>
                <DeleteButton
                  title="¿Eliminar esta noticia?"
                  description={`"${item.title}" se va a borrar y no se puede deshacer. Si solo querés esconderla, editala y apagá "Publicada".`}
                  onConfirm={() => remove(item)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <NewsFormModal
        open={modal !== null}
        news={modal?.news ?? null}
        onClose={() => setModal(null)}
        onSaved={() => {
          setModal(null);
          load();
        }}
      />
    </div>
  );
}
