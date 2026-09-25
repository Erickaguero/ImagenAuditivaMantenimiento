import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { Loader2, ShieldAlert } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Status = "checking" | "admin" | "not-admin";

/**
 * Protege /admin: sin sesión manda al login; con sesión pero sin permisos de administrador
 * muestra un aviso. La seguridad real la dan las reglas (RLS) de Supabase.
 */
export default function RequireAuth({ children }: { children: (session: Session) => ReactNode }) {
  const [, setLocation] = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;

    async function check(current: Session | null) {
      if (!current) {
        setLocation("/login");
        return;
      }
      const { data } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", current.user.id)
        .maybeSingle();
      if (cancelled) return;
      setSession(current);
      setStatus(data ? "admin" : "not-admin");
    }

    supabase.auth.getSession().then(({ data }) => check(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((event, current) => {
      if (event === "SIGNED_OUT") setLocation("/login");
      else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") setSession(current);
    });
    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [setLocation]);

  if (status === "checking" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "not-admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-md text-center shadow-sm">
          <ShieldAlert className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Tu usuario no tiene permisos</h1>
          <p className="text-muted-foreground mb-6">
            Iniciaste sesión como <strong>{session.user.email}</strong>, pero ese usuario no es administrador.
            Pedile a quien administra el sitio que te agregue.
          </p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-lg font-medium"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return <>{children(session)}</>;
}
