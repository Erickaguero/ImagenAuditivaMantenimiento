import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export interface SiteSettings {
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  facebook_url: string;
  instagram_url: string;
  x_url: string;
  youtube_url: string;
  tiktok_url: string;
  whatsapp_url: string;
  footer_text: string;
  hero_title: string;
  hero_subtitle: string;
  hero_cta: string;
  news_label: string;
  news_title: string;
  news_subtitle: string;
  events_label: string;
  events_title: string;
  events_subtitle: string;
  events_page_title: string;
  events_page_subtitle: string;
  news_page_title: string;
  news_page_subtitle: string;
  contact_page_title: string;
  contact_page_subtitle: string;
  seo_title: string;
  seo_description: string;
  logo_url: string;
  logo_white_url: string;
  privacy_text: string;
  terms_text: string;
}

// Mismos valores que los "default" de la tabla site_settings: el sitio se ve bien
// aunque la base de datos todavía no haya respondido.
export const DEFAULT_SETTINGS: SiteSettings = {
  email: "info@imagenauditiva.com",
  phone: "+506 7032 9701",
  address_line1: "San Antonio de Belén",
  address_line2: "Heredia, Costa Rica",
  facebook_url: "",
  instagram_url: "",
  x_url: "",
  youtube_url: "",
  tiktok_url: "",
  whatsapp_url: "",
  footer_text:
    "Tu destino principal para descubrir eventos de música en vivo. Viví los mejores conciertos y festivales con Imagen Auditiva.",
  hero_title: "Próximos Eventos",
  hero_subtitle: "Descubre nuestros próximos eventos",
  hero_cta: "Descubre Eventos",
  news_label: "Últimas Novedades",
  news_title: "Noticias",
  news_subtitle: "Mantente al día con lo último de la escena musical",
  events_label: "Cartelera",
  events_title: "Top 5 Próximos eventos",
  events_subtitle: "No te pierdas los shows en vivo más esperados de la temporada",
  events_page_title: "Descubre la música en vivo",
  events_page_subtitle:
    "Explora nuestra cartelera de conciertos, festivales y presentaciones exclusivas. Encuentra tu próxima experiencia inolvidable.",
  news_page_title: "Noticias",
  news_page_subtitle: "Las últimas noticias de los mejores conciertos en Costa Rica",
  contact_page_title: "Contáctanos",
  contact_page_subtitle: "Tenés preguntas? Nos encantaría escucharte",
  seo_title: "Imagen Auditiva - Descubrí Eventos de Música en Vivo",
  seo_description:
    "Tu destino principal para descubrir eventos de música en vivo, conciertos y festivales. Encuentra los mejores shows y artistas cerca de ti con Imagen Auditiva.",
  logo_url: "",
  logo_white_url: "",
  privacy_text: "",
  terms_text: "",
};

export const DEFAULT_LOGO = "/logo-color.png";
export const DEFAULT_LOGO_WHITE = "/logo-white.png";

interface SiteSettingsContextValue {
  settings: SiteSettings;
  loaded: boolean;
  reload: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  loaded: false,
  reload: async () => {},
});

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
    if (!error && data) setSettings({ ...DEFAULT_SETTINGS, ...data });
    setLoaded(true);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <SiteSettingsContext.Provider value={{ settings, loaded, reload }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
