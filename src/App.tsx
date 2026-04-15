import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { supabase } from "./lib/supabaseClient";
import Auth from "./Auth";
import Dashboard from "./Dashboard";
import PublicPage from "./PublicPage";
import ParticularCreatePage from "./ParticularCreatePage";
import ParticularSuccessPage from "./ParticularSuccessPage";
import AdminLoginPage from "./AdminLoginPage";
import DemoLoginPage from "./DemoLoginPage";
import DemoDashboard from "./DemoDashboard";
import { DemoProvider } from "./DemoContext";
import DemoPublicPage from "./DemoPublicPage";

import {
  AvisoLegalPage,
  PrivacidadPage,
  CookiesPage,
  CondicionesPage,
  ContactoPage,
} from "./LegalTexts";
export default function App() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Cargando...</div>;

  return (
    <DemoProvider>
      <Routes>
        <Route path="/p/:slug" element={<PublicPage />} />
        <Route path="/particular" element={<ParticularCreatePage />} />
        <Route path="/particular/success" element={<ParticularSuccessPage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />

        <Route path="/demo-login" element={<DemoLoginPage />} />
        <Route path="/demo-dashboard" element={<DemoDashboard />} />
        <Route path="/demo/:slug" element={<DemoPublicPage />} />
        <Route path="/aviso-legal" element={<AvisoLegalPage />} />
<Route path="/privacidad" element={<PrivacidadPage />} />
<Route path="/cookies" element={<CookiesPage />} />
<Route path="/condiciones" element={<CondicionesPage />} />
<Route path="/contacto" element={<ContactoPage />} />
        <Route path="/*" element={loggedIn ? <Dashboard /> : <Auth />} />
      </Routes>
    </DemoProvider>
  );
}