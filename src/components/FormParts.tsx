import { useState, type ReactNode } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const inputClass =
  "w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";

/** Campo de formulario con etiqueta grande y texto de ayuda debajo. */
export function Field({
  label,
  help,
  required,
  htmlFor,
  children,
}: {
  label: string;
  help?: ReactNode;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-foreground mb-1.5">
        {label}
        {required && <span className="text-primary"> *</span>}
      </label>
      {children}
      {help && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{help}</p>}
    </div>
  );
}

/** Interruptor sí/no con explicación, pensado para que se entienda sin leer un manual. */
export function ToggleRow({
  label,
  help,
  checked,
  onChange,
}: {
  label: string;
  help: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border bg-muted/40 cursor-pointer">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-muted-foreground mt-0.5">{help}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} className="mt-0.5" />
    </label>
  );
}

/** Botón de borrar que siempre pide confirmación. */
export function DeleteButton({
  title,
  description,
  onConfirm,
  label,
}: {
  title: string;
  description: string;
  onConfirm: () => Promise<void> | void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
        title="Eliminar"
      >
        <Trash2 className="w-5 h-5" />
        {label && <span>{label}</span>}
      </button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={async (e) => {
                e.preventDefault();
                setBusy(true);
                await onConfirm();
                setBusy(false);
                setOpen(false);
              }}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sí, eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function PrimaryButton({
  children,
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg font-semibold shadow-sm transition-colors disabled:opacity-60 ${props.className ?? ""}`}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
