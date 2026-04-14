import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDemo } from "./DemoContext";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function DemoDashboard() {
  const navigate = useNavigate();
 const { setDemoPage, setDemoMessages, clearDemo } = useDemo();

  const [fullNameInput, setFullNameInput] = useState("");
  const [messageInput, setMessageInput] = useState("");

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f8fafc 0%, #eef2f7 55%, #e8edf5 100%)",
        padding: 24,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: "#0f172a",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            marginBottom: 24,
            padding: 28,
            borderRadius: 30,
            background:
              "linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #334155 100%)",
            color: "#fff",
            boxShadow: "0 30px 80px rgba(15,23,42,0.22)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.16)",
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            Demo efímera
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 36,
              lineHeight: 1.05,
              fontWeight: 800,
              letterSpacing: "-0.03em",
            }}
          >
            Funeraria Demo
          </h1>

          <p
            style={{
              marginTop: 12,
              marginBottom: 0,
              maxWidth: 760,
              color: "rgba(255,255,255,0.82)",
              fontSize: 16,
              lineHeight: 1.6,
            }}
          >
            Este entorno no guarda datos reales. Todo desaparecerá al salir o
            refrescar la página.
          </p>

          <button
            type="button"
            onClick={() => {
              clearDemo();
              navigate("/demo-login");
            }}
            style={{
              marginTop: 18,
              border: "1px solid rgba(255,255,255,0.3)",
              background: "rgba(255,255,255,0.15)",
              color: "#fff",
              borderRadius: 12,
              padding: "10px 14px",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Salir de demo
          </button>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.88)",
            border: "1px solid rgba(255,255,255,0.75)",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              marginBottom: 16,
            }}
          >
            Crear página demo
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <input
              value={fullNameInput}
              onChange={(e) => setFullNameInput(e.target.value)}
              placeholder="Nombre del difunto"
              style={{
                padding: "14px 16px",
                borderRadius: 14,
                border: "1px solid #dbe3ee",
                fontSize: 15,
              }}
            />

            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Mensaje inicial (opcional)"
              style={{
                padding: "14px 16px",
                borderRadius: 14,
                border: "1px solid #dbe3ee",
                fontSize: 15,
                minHeight: 80,
              }}
            />

            <button
              type="button"
              onClick={() => {
                if (!fullNameInput.trim()) return;

                const slug = slugify(fullNameInput);

setDemoMessages([]);

                setDemoPage({
                  slug,
                  fullName: fullNameInput.trim(),
                  message: messageInput.trim(),
                });

                navigate(`/demo/${slug}`);
              }}
              style={{
                border: "none",
                borderRadius: 14,
                padding: "14px",
                background: "#0f172a",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Ver página demo
            </button>
          </div>

          <div
            style={{
              marginTop: 20,
              fontSize: 13,
              color: "#64748b",
            }}
          >
            Vista previa demo efímera. No guarda datos y desaparece al salir o
            refrescar.
          </div>
        </div>
      </div>
    </div>
  );
}