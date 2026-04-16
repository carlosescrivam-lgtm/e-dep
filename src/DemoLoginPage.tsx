import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function DemoLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (username === "demo" && password === "demo") {
      navigate("/demo-dashboard");
      return;
    }

    setError("Acceso demo incorrecto.");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(180deg, #f8fafc 0%, #eef2f7 55%, #e8edf5 100%)",
        padding: 24,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
          padding: 32,
        }}
      >
      
<div
  style={{
    position: "relative",
    marginBottom: 20,
  }}
>
  {/* Botón derecha */}
  <button
    type="button"
    onClick={() => {
      window.location.href = "/";
    }}
    style={{
      position: "absolute",
      top: 0,
      right: 0,
      background: "none",
      border: "none",
      padding: 0,
      color: "#334155",
      cursor: "pointer",
      fontSize: 14,
      fontWeight: 600,
    }}
  >
    ← Inicio
  </button>

  {/* Logo centrado */}
  <div
    style={{
      display: "flex",
      justifyContent: "center",
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
  </div>
</div>
       

        <p
          style={{
            marginTop: 12,
            marginBottom: 24,
            color: "#475569",
            fontSize: 15,
            lineHeight: 1.6,
          }}
        >
          Este acceso es efímero y no guarda datos reales. Todo lo que se haga
          en la demo desaparecerá al salir o refrescar.
        </p>

        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: "block",
              fontSize: 14,
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: 8,
            }}
          >
            Usuario
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="demo"
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 16,
              border: "1px solid #dbe3ee",
              background: "rgba(255,255,255,0.95)",
              fontSize: 15,
              outline: "none",
              boxSizing: "border-box",
              color: "#0f172a",
              marginBottom: 16,
            }}
          />

          <label
            style={{
              display: "block",
              fontSize: 14,
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: 8,
            }}
          >
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="demo"
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 16,
              border: "1px solid #dbe3ee",
              background: "rgba(255,255,255,0.95)",
              fontSize: 15,
              outline: "none",
              boxSizing: "border-box",
              color: "#0f172a",
            }}
          />

          {error ? (
            <div
              style={{
                marginTop: 14,
                padding: "10px 12px",
                borderRadius: 12,
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.18)",
                color: "#b91c1c",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          ) : null}

          <button
            type="submit"
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
              cursor: "pointer",
              boxShadow: "0 14px 30px rgba(15,23,42,0.18)",
            }}
          >
            Entrar en demo
          </button>
        </form>
      </div>
    </div>
  );
}