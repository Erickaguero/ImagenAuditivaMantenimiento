import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { SiteSettingsProvider } from "@/hooks/useSiteSettings";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import ResetPassword from "@/pages/ResetPassword";

export default function App() {
  return (
    <SiteSettingsProvider>
      <Toaster position="top-center" richColors />
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/restablecer" component={ResetPassword} />
        <Route component={Dashboard} />
      </Switch>
    </SiteSettingsProvider>
  );
}
