import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder_key";

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error(
    "⚠️ FALTAN LAS VARIABLES DE ENTORNO: VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. " +
      "En Vercel se cargan en Settings → Environment Variables (y después hay que volver a desplegar).",
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/** Sitio público, para los enlaces "Ver sitio". */
export const SITE_URL = import.meta.env.VITE_SITE_URL || "https://www.imagenauditiva.com";

export interface EventData {
  id: number;
  slug: string;
  artist: string;
  /** "Acerca del evento" */
  tour_name: string | null;
  /** Fecha del evento, YYYY-MM-DD */
  date_short: string;
  /** "HH:MM" o vacío si no está confirmada */
  time: string | null;
  venue: string | null;
  city: string | null;
  poster: string | null;
  /** "Biografía del artista" */
  bio: string | null;
  in_slider: boolean;
  published: boolean;
}

export interface NewsData {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  content: string | null;
  image_url: string | null;
  published_at: string;
  in_home: boolean;
  published: boolean;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  created_at: string;
}
