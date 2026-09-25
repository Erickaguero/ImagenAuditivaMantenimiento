import { useEffect, useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  DEFAULT_LOGO,
  DEFAULT_LOGO_WHITE,
  DEFAULT_SETTINGS,
  useSiteSettings,
  type SiteSettings,
} from "@/hooks/useSiteSettings";
import ImageUpload from "./ImageUpload";
import { Field, PrimaryButton, inputClass } from "./FormParts";

type Key = keyof SiteSettings;
interface FieldDef {
  key: Key;
  label: string;
  help?: string;
  multiline?: number;
  placeholder?: string;
}

const SECTIONS: { title: string; description: string; fields: FieldDef[] }[] = [
  {
    title: "Datos de contacto",
    description: "Se muestran en la página de Contacto.",
    fields: [
      { key: "email", label: "Correo electrónico", placeholder: "info@imagenauditiva.com" },
      { key: "phone", label: "Teléfono", placeholder: "+506 7032 9701" },
      { key: "address_line1", label: "Dirección (línea 1)", placeholder: "San Antonio de Belén" },
      { key: "address_line2", label: "Dirección (línea 2)", placeholder: "Heredia, Costa Rica" },
    ],
  },
  {
    title: "Redes sociales",
    description:
      "Pegá el enlace completo de cada perfil (empieza con https://). Si dejás una vacía, su ícono no aparece en el pie de página.",
    fields: [
      { key: "facebook_url", label: "Facebook", placeholder: "https://www.facebook.com/..." },
      { key: "instagram_url", label: "Instagram", placeholder: "https://www.instagram.com/..." },
      { key: "x_url", label: "X (Twitter)", placeholder: "https://x.com/..." },
      { key: "youtube_url", label: "YouTube", placeholder: "https://www.youtube.com/@..." },
      { key: "tiktok_url", label: "TikTok", placeholder: "https://www.tiktok.com/@..." },
      {
        key: "whatsapp_url",
        label: "WhatsApp",
        placeholder: "https://wa.me/50670329701",
        help: "Formato: https://wa.me/ seguido del número con código de país, sin espacios ni +.",
      },
    ],
  },
  {
    title: "Textos de la página de inicio",
    description: "Los títulos del carrusel y de las secciones de Noticias y Cartelera.",
    fields: [
      { key: "hero_title", label: "Carrusel: título" },
      { key: "hero_subtitle", label: "Carrusel: bajada" },
      { key: "hero_cta", label: "Carrusel: texto del botón" },
      { key: "news_label", label: "Noticias: etiqueta roja" },
      { key: "news_title", label: "Noticias: título" },
      { key: "news_subtitle", label: "Noticias: bajada" },
      { key: "events_label", label: "Cartelera: etiqueta roja" },
      { key: "events_title", label: "Cartelera: título" },
      { key: "events_subtitle", label: "Cartelera: bajada" },
      { key: "footer_text", label: "Texto del pie de página", multiline: 3 },
    ],
  },
  {
    title: "Textos de las otras páginas",
    description: "El título grande y la bajada de cada página.",
    fields: [
      { key: "events_page_title", label: "Eventos: título" },
      { key: "events_page_subtitle", label: "Eventos: bajada", multiline: 2 },
      { key: "news_page_title", label: "Noticias: título" },
      { key: "news_page_subtitle", label: "Noticias: bajada", multiline: 2 },
      { key: "contact_page_title", label: "Contacto: título" },
      { key: "contact_page_subtitle", label: "Contacto: bajada", multiline: 2 },
    ],
  },
  {
    title: "Google y redes (SEO)",
    description: "Cómo aparece el sitio en los resultados de Google y al compartir el enlace.",
    fields: [
      { key: "seo_title", label: "Título del sitio" },
      { key: "seo_description", label: "Descripción", multiline: 3 },
    ],
  },
  {
    title: "Textos legales",
    description: "Si los dejás vacíos se muestra un texto básico. Conviene que los revise un profesional.",
    fields: [
      { key: "privacy_text", label: "Política de privacidad", multiline: 8 },
      { key: "terms_text", label: "Términos de servicio", multiline: 8 },
    ],
  },
];

export default function SettingsForm() {
  const { settings, loaded, reload } = useSiteSettings();
  const [form, setForm] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loaded) setForm(settings);
  }, [loaded, settings]);

  const set = (key: Key, value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = Object.fromEntries(
      Object.keys(DEFAULT_SETTINGS).map((k) => [k, (form[k as Key] ?? "").trim()]),
    );
    const { error } = await supabase.from("site_settings").update(payload).eq("id", 1);
    setSaving(false);
    if (error) {
      toast.error(`No se pudo guardar: ${error.message}`);
      return;
    }
    await reload();
    toast.success("Configuración guardada ✓ Los cambios ya se ven en el sitio.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="bg-card p-6 rounded-2xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Configuración del sitio</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Datos de contacto, redes sociales, textos y logos. Al terminar, tocá "Guardar cambios".
          </p>
        </div>
        <PrimaryButton type="submit" loading={saving} className="shrink-0">
          <Save className="w-4 h-4" /> Guardar cambios
        </PrimaryButton>
      </div>

      <section className="bg-card p-6 rounded-2xl border border-border space-y-5">
        <div>
          <h2 className="text-lg font-bold">Logos</h2>
          <p className="text-sm text-muted-foreground">
            Si no subís ninguno se usan los logos actuales. Preferiblemente PNG con fondo transparente.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Logo a color (barra superior)">
            <ImageUpload
              bucket="site"
              value={form.logo_url}
              onChange={(url) => set("logo_url", url)}
              aspect="aspect-[4/1] !w-56 bg-white [&_img]:!object-contain"
              accept={["image/png", "image/jpeg", "image/webp", "image/svg+xml"]}
            />
            {!form.logo_url && <img src={DEFAULT_LOGO} alt="Logo actual" className="h-10 mt-3" />}
          </Field>
          <Field label="Logo blanco (pie de página)">
            <ImageUpload
              bucket="site"
              value={form.logo_white_url}
              onChange={(url) => set("logo_white_url", url)}
              aspect="aspect-[4/1] !w-56 bg-zinc-900 [&_img]:!object-contain"
              accept={["image/png", "image/jpeg", "image/webp", "image/svg+xml"]}
            />
            {!form.logo_white_url && (
              <div className="bg-zinc-950 rounded-lg p-2 mt-3 inline-block">
                <img src={DEFAULT_LOGO_WHITE} alt="Logo blanco actual" className="h-10" />
              </div>
            )}
          </Field>
        </div>
      </section>

      {SECTIONS.map((section) => (
        <section key={section.title} className="bg-card p-6 rounded-2xl border border-border space-y-5">
          <div>
            <h2 className="text-lg font-bold">{section.title}</h2>
            <p className="text-sm text-muted-foreground">{section.description}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {section.fields.map((f) => (
              <div key={f.key} className={f.multiline && f.multiline > 2 ? "md:col-span-2" : ""}>
                <Field label={f.label} help={f.help} htmlFor={f.key}>
                  {f.multiline ? (
                    <textarea
                      id={f.key}
                      rows={f.multiline}
                      className={inputClass}
                      value={form[f.key]}
                      placeholder={f.placeholder}
                      onChange={(e) => set(f.key, e.target.value)}
                    />
                  ) : (
                    <input
                      id={f.key}
                      className={inputClass}
                      value={form[f.key]}
                      placeholder={f.placeholder}
                      onChange={(e) => set(f.key, e.target.value)}
                    />
                  )}
                </Field>
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="flex justify-end">
        <PrimaryButton type="submit" loading={saving}>
          <Save className="w-4 h-4" /> Guardar cambios
        </PrimaryButton>
      </div>
    </form>
  );
}
