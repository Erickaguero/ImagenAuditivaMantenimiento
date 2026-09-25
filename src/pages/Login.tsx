import { useEffect, useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { SITE_URL, supabase } from "@/lib/supabase";
import { DEFAULT_LOGO } from "@/hooks/useSiteSettings";
import { usePageMeta } from "@/hooks/usePageMeta";
import { inputClass } from "@/components/FormParts";

export default function Login() {
  usePageMeta("Ingresar - Imagen Auditiva");
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setLocation("/");
    });
  }, [setLocation]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setError("El correo o la contraseña no son correctos. Revisalos e intentá de nuevo.");
      setLoading(false);
    } else {
      setLocation("/");
    }
  }

  async function onForgot() {
    if (!email.trim()) {
      setError("Escribí tu correo arriba y después tocá “¿Olvidaste tu contraseña?”.");
      return;
    }
    setResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/restablecer`,
    });
    setResetting(false);
    if (error) toast.error("No se pudo enviar el correo. Intentá de nuevo en unos minutos.");
    else toast.success("Te enviamos un correo con un enlace para crear una contraseña nueva.");
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <img src={DEFAULT_LOGO} alt="Imagen Auditiva" className="h-12 mx-auto mb-6" />
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-1">Panel de administración</h1>
          <p className="text-muted-foreground text-center mb-8 text-sm">
            Ingresá con tu correo y contraseña para editar el sitio
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-1.5">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-1.5">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg transition-colors flex justify-center items-center disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Ingresar"}
            </button>
            <button
              type="button"
              onClick={onForgot}
              disabled={resetting}
              className="w-full text-sm text-muted-foreground hover:text-primary"
            >
              {resetting ? "Enviando..." : "¿Olvidaste tu contraseña?"}
            </button>
          </form>
        </div>
        <a href={SITE_URL} className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="w-4 h-4" /> Volver al sitio
        </a>
      </div>
    </div>
  );
}
