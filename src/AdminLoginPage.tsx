import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkExistingSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("funeral_home_users")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data?.role === "admin") {
        window.location.href = "/dashboard";
      }
    }

    checkExistingSession();
  }, []);

  async function signInAdmin() {
    try {
      setLoading(true);
      setMsg("Comprobando acceso admin...");

      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError || !signInData.user) {
        setMsg("❌ " + (signInError?.message || "No se pudo iniciar sesión"));
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("funeral_home_users")
        .select("role")
        .eq("user_id", signInData.user.id)
        .maybeSingle();

      if (profileError) {
        await supabase.auth.signOut();
        setMsg("❌ No se pudo verificar el rol del usuario.");
        return;
      }

      if (!profile || profile.role !== "admin") {
        await supabase.auth.signOut();
        setMsg("❌ Este acceso está reservado solo a administradores.");
        return;
      }

      setMsg("✅ Acceso admin correcto");
      window.location.href = "/dashboard";
    } catch (err: any) {
      setMsg("❌ " + (err?.message || "No se pudo iniciar sesión"));
    } finally {
      setLoading(false);
    }
  }

  async function forgotPassword() {
    try {
      if (!email.trim()) {
        setMsg("❌ Introduce tu email para recuperar la contraseña.");
        return;
      }

      setLoading(true);
      setMsg("Enviando email de recuperación...");

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}`,
      });

      if (error) {
        setMsg("❌ " + error.message);
        return;
      }

      setMsg("✅ Te hemos enviado un email para restablecer tu contraseña.");
    } catch (err: any) {
      setMsg("❌ " + (err?.message || "No se pudo enviar el email de recuperación."));
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
          position: "relative",
          width: "100%",
          maxWidth: 460,
          background: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(255,255,255,0.75)",
          borderRadius: 28,
          boxShadow: "0 24px 60px rgba(15,23,42,0.12)",
          padding: 28,
        }}
      >
        <button
          type="button"
          onClick={() => {
            window.location.href = "/";
          }}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            padding: 0,
            color: "#334155",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          ← Volver
        </button>

   <div
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  }}
>
  <img
    src="/logo-blue.png"
    alt="E-Dep"
    style={{
      height: 150,
      objectFit: "contain",
    }}
  />

  <h1
    style={{
      marginTop: 10,
      marginBottom: 0,
      fontSize: 22,
      fontWeight: 700,
      color: "#334155",
      textAlign: "center",
    }}
  >
    Acceso administrador
  </h1>
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
          Panel de administración
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
          Acceso reservado solo a usuarios con rol de administrador.
        </p>

        <label style={labelStyle}>Email de acceso</label>
        <input
          style={inputStyle}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@e-dep.org"
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
          type="button"
          onClick={forgotPassword}
          style={{
            marginTop: 10,
            background: "none",
            border: "none",
            padding: 0,
            color: "#334155",
            textDecoration: "underline",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          ¿Olvidaste la contraseña?
        </button>

        <button
          onClick={signInAdmin}
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
          {loading ? "Entrando..." : "Entrar como admin"}
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