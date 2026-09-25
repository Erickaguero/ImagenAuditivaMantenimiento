import { useCallback, useEffect, useState } from "react";
import { CalendarDays, ExternalLink, GalleryHorizontal, LogOut, Mail, Newspaper, Settings } from "lucide-react";
import { SITE_URL, supabase } from "@/lib/supabase";
import { DEFAULT_LOGO, useSiteSettings } from "@/hooks/useSiteSettings";
import { usePageMeta } from "@/hooks/usePageMeta";
import RequireAuth from "@/components/RequireAuth";
import EventsTab from "@/components/EventsTab";
import CarouselTab from "@/components/CarouselTab";
import NewsTab from "@/components/NewsTab";
import MessagesTab from "@/components/MessagesTab";
import SettingsForm from "@/components/SettingsForm";

type Tab = "events" | "carousel" | "news" | "messages" | "settings";

const TABS: { id: Tab; label: string; icon: typeof Mail }[] = [
  { id: "events", label: "Eventos", icon: CalendarDays },
  { id: "carousel", label: "Carrusel", icon: GalleryHorizontal },
  { id: "news", label: "Noticias", icon: Newspaper },
  { id: "messages", label: "Mensajes", icon: Mail },
  { id: "settings", label: "Configuración", icon: Settings },
];

function readTab(): Tab {
  const hash = window.location.hash.replace("#", "");
  return TABS.some((t) => t.id === hash) ? (hash as Tab) : "events";
}

function DashboardContent({ email }: { email: string }) {
  const { settings } = useSiteSettings();
  const [tab, setTab] = useState<Tab>(readTab);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("read", false)
      .then(({ count }) => setUnread(count ?? 0));
  }, []);

  const selectTab = (id: Tab) => {
    setTab(id);
    history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: 0 });
  };

  const onUnreadChange = useCallback((n: number) => setUnread(n), []);

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img src={settings.logo_url || DEFAULT_LOGO} alt="Imagen Auditiva" className="h-9 w-auto" />
            <span className="hidden sm:inline text-sm font-semibold text-muted-foreground border-l border-border pl-3">
              Panel de administración
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <a
              href={SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted"
            >
              <ExternalLink className="w-4 h-4" /> <span className="hidden sm:inline">Ver sitio</span>
            </a>
            <button
              onClick={() => supabase.auth.signOut()}
              title={`Cerrar sesión (${email})`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted"
            >
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-2 sm:px-6 flex overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => selectTab(id)}
              className={`relative flex items-center gap-2 px-4 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                tab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
              {id === "messages" && unread > 0 && (
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {unread}
                </span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {tab === "events" && <EventsTab />}
        {tab === "carousel" && <CarouselTab />}
        {tab === "news" && <NewsTab />}
        {tab === "messages" && <MessagesTab onUnreadChange={onUnreadChange} />}
        {tab === "settings" && <SettingsForm />}
      </main>
    </div>
  );
}

export default function Dashboard() {
  usePageMeta("Mantenimiento - Imagen Auditiva");
  return <RequireAuth>{(session) => <DashboardContent email={session.user.email ?? ""} />}</RequireAuth>;
}
