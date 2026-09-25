import { useCallback, useEffect, useState } from "react";
import { Inbox, Loader2, Mail, MailOpen, Reply } from "lucide-react";
import { toast } from "sonner";
import { supabase, type ContactMessage } from "@/lib/supabase";
import { DeleteButton } from "./FormParts";

const formatDateTime = (ts: string) =>
  new Date(ts).toLocaleString("es-419", {
    timeZone: "America/Costa_Rica",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function MessagesTab({ onUnreadChange }: { onUnreadChange: (count: number) => void }) {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("contacts").select("*").order("created_at", { ascending: false });
    if (error) toast.error("No se pudieron cargar los mensajes.");
    setMessages(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    onUnreadChange(messages.filter((m) => !m.read).length);
  }, [messages, onUnreadChange]);

  async function setRead(message: ContactMessage, read: boolean) {
    setMessages((list) => list.map((m) => (m.id === message.id ? { ...m, read } : m)));
    const { error } = await supabase.from("contacts").update({ read }).eq("id", message.id);
    if (error) {
      toast.error("No se pudo actualizar el mensaje.");
      load();
    }
  }

  async function remove(message: ContactMessage) {
    const { error } = await supabase.from("contacts").delete().eq("id", message.id);
    if (error) {
      toast.error(`No se pudo eliminar: ${error.message}`);
      return;
    }
    setMessages((list) => list.filter((m) => m.id !== message.id));
    toast.success("Mensaje eliminado");
  }

  function toggleOpen(message: ContactMessage) {
    setOpenId(openId === message.id ? null : message.id);
    if (!message.read) setRead(message, true);
  }

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-2xl border border-border">
        <h1 className="text-2xl font-bold">Mensajes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Lo que la gente envía desde el formulario de la página de Contacto. Hacé clic en un mensaje para leerlo.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Todavía no llegaron mensajes.</p>
        </div>
      ) : (
        <ul className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {messages.map((m) => (
            <li key={m.id} className={m.read ? "" : "bg-primary/[0.03]"}>
              <button onClick={() => toggleOpen(m)} className="w-full text-left p-4 flex items-start gap-3 hover:bg-muted/40">
                {m.read ? (
                  <MailOpen className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                ) : (
                  <Mail className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <span className={m.read ? "font-medium" : "font-bold"}>{m.name}</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(m.created_at)}</span>
                  </div>
                  <div className="text-sm truncate">{m.subject || "(sin asunto)"}</div>
                  {openId !== m.id && <div className="text-sm text-muted-foreground truncate">{m.message}</div>}
                </div>
              </button>
              {openId === m.id && (
                <div className="px-4 pb-4 pl-12 space-y-4">
                  <div className="text-sm text-muted-foreground">
                    De: <span className="text-foreground">{m.email}</span>
                  </div>
                  <p className="whitespace-pre-line leading-relaxed">{m.message}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || "Tu mensaje a Imagen Auditiva"}`)}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                    >
                      <Reply className="w-4 h-4" /> Responder por correo
                    </a>
                    <button
                      onClick={() => setRead(m, false)}
                      className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted"
                    >
                      Marcar como no leído
                    </button>
                    <DeleteButton
                      label="Eliminar"
                      title="¿Eliminar este mensaje?"
                      description={`El mensaje de ${m.name} se va a borrar y no se puede recuperar.`}
                      onConfirm={() => remove(m)}
                    />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
