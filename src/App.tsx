import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { supabase } from "./lib/supabaseClient";
import Auth from "./Auth";
import Dashboard from "./Dashboard";
import PublicPage from "./PublicPage";

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
    <Routes>
      <Route path="/p/:slug" element={<PublicPage />} />
      <Route path="/*" element={loggedIn ? <Dashboard /> : <Auth />} />
    </Routes>
  );
}