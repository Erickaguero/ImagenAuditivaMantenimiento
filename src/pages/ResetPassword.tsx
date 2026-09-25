import { useEffect, useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { usePageMeta } from "@/hooks/usePageMeta";
import { inputClass } from "@/components/FormParts";

/** Destino del enlace de "¿Olvidaste tu contraseña?": permite elegir una contraseña nueva. */
export default function ResetPassword() {
  usePageMeta("Nueva contraseña - Imagen Auditiva");
  const [, setLocation] = useLocation();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Supabase inicia la sesión de recuperación a partir del enlace del correo.
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("La contraseña tiene que tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("Las dos contraseñas no coinciden.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast.error(`No se pudo cambiar la contraseña: ${error.message}`);
      return;
    }
    toast.success("Contraseña actualizada ✓");
    setLocation("/");
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm w-full max-w-md">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center mb-6">Elegí una contraseña nueva</h1>
        {!ready ? (
          <p className="text-center text-muted-foreground text-sm">
            Abrí esta página desde el enlace que te llegó por correo. Si el enlace venció, pedí uno nuevo desde la
            pantalla de ingreso.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="Contraseña nueva (mínimo 8 caracteres)"
              autoComplete="new-password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Repetí la contraseña"
              autoComplete="new-password"
              className={inputClass}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg flex justify-center disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
