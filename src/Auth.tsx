import { useState } from "react";
import { supabase } from "./lib/supabaseClient";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [funeralHomeName, setFuneralHomeName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function signIn() {
    try {
      setLoading(true);
      setMsg("Iniciando sesión...");

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setMsg(error ? "❌ " + error.message : "✅ Sesión iniciada");
    } catch (err: any) {
      setMsg("❌ " + (err?.message || "No se pudo iniciar sesión"));
    } finally {
      setLoading(false);
    }
  }

  async function signUp() {
    try {
      setLoading(true);
      setMsg("Creando cuenta de funeraria...");

      const res = await fetch("/.netlify/functions/registerFuneralHome", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: funeralHomeName,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg("❌ " + (data?.error || "No se pudo crear la cuenta"));
        return;
      }

      setMsg(
        "✅ Cuenta creada. Ahora puedes iniciar sesión con tu email y contraseña."
      );
      setMode("login");
      setPassword("");
    } catch (err: any) {
      setMsg("❌ " + (err?.message || "No se pudo crear la cuenta"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f8fafc 0%, #eef2f7 55%, #e8edf5 100%)",
        padding: 24,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          background: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(255,255,255,0.75)",
          borderRadius: 28,
          boxShadow: "0 24px 60px rgba(15,23,42,0.12)",
          padding: 28,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            padding: "8px 12px",
            borderRadius: 999,
            background: "#e2e8f0",
            color: "#0f172a",
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 14,
          }}
        >
          E-Dep · Acceso funerarias
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 30,
            lineHeight: 1.1,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "#0f172a",
          }}
        >
          {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </h1>

        <p
          style={{
            marginTop: 10,
            marginBottom: 22,
            color: "#475569",
            lineHeight: 1.6,
            fontSize: 14,
          }}
        >
          {mode === "login"
            ? "Accede a tu panel de funeraria o al panel de administración."
            : "Registra tu funeraria para empezar a usar E-Dep."}
        </p>

        {mode === "register" ? (
          <>
            <label style={labelStyle}>Nombre de la funeraria</label>
            <input
              style={inputStyle}
              value={funeralHomeName}
              onChange={(e) => setFuneralHomeName(e.target.value)}
              placeholder="Ejemplo: Funeraria García"
            />
          </>
        ) : null}

        <label style={labelStyle}>Email</label>
        <input
          style={inputStyle}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@funeraria.com"
          type="email"
        />

        <label style={labelStyle}>Contraseña</label>
        <input
          style={inputStyle}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="********"
        />

        <button
          onClick={mode === "login" ? signIn : signUp}
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 18,
            border: "none",
            borderRadius: 16,
            padding: "15px 18px",
            background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
            color: "white",
            fontWeight: 700,
            fontSize: 15,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading
            ? mode === "login"
              ? "Entrando..."
              : "Creando cuenta..."
            : mode === "login"
            ? "Entrar"
            : "Crear cuenta"}
        </button>

        <button
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setMsg("");
          }}
          style={{
            width: "100%",
            marginTop: 12,
            border: "1px solid #dbe3ee",
            borderRadius: 16,
            padding: "13px 18px",
            background: "white",
            color: "#0f172a",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          {mode === "login"
            ? "Crear nueva cuenta de funeraria"
            : "Ya tengo cuenta, quiero entrar"}
        </button>

        {msg ? (
          <div
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 16,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              color: "#334155",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {msg}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 8,
  marginTop: 14,
  color: "#0f172a",
  fontSize: 14,
  fontWeight: 700,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 16,
  border: "1px solid #dbe3ee",
  background: "rgba(255,255,255,0.95)",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
  color: "#0f172a",
};