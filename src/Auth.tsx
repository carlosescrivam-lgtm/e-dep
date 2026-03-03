import { useState } from "react";
import { supabase } from "./lib/supabaseClient";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string>("");

  async function signUp() {
    setMsg("Creando usuario...");
    const { error } = await supabase.auth.signUp({ email, password });
    setMsg(error ? "❌ " + error.message : "✅ Usuario creado. Ahora inicia sesión.");
  }

  async function signIn() {
    setMsg("Iniciando sesión...");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMsg(error ? "❌ " + error.message : "✅ Sesión iniciada");
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>e-dep.com</h1>
      <h2>Acceso funerarias</h2>

      <label>Email</label>
      <input
        style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="correo@funeraria.com"
      />

      <label>Contraseña</label>
      <input
        style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="********"
      />

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={signIn} style={{ padding: 10, flex: 1 }}>
          Entrar
        </button>
        <button onClick={signUp} style={{ padding: 10, flex: 1 }}>
          Crear usuario
        </button>
      </div>

      <p style={{ marginTop: 12 }}>{msg}</p>
    </div>
  );
}