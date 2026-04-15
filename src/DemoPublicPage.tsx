import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDemo } from "./DemoContext";

export default function DemoPublicPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { demoPage, demoMessages, setDemoMessages } = useDemo();

  const [authorName, setAuthorName] = useState("");
  const [messageText, setMessageText] = useState("");

  if (!demoPage || demoPage.slug !== slug) {
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
            maxWidth: 560,
            background: "rgba(255,255,255,0.92)",
            boxSizing: "border-box",
overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.75)",
            borderRadius: 28,
            boxShadow: "0 24px 60px rgba(15,23,42,0.12)",
            padding: 32,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: 12,
            }}
          >
            Demo no disponible
          </div>

          <div
            style={{
              fontSize: 15,
              color: "#475569",
              lineHeight: 1.7,
              marginBottom: 18,
            }}
          >
            La demo ha desaparecido porque era efímera o la página se ha refrescado.
          </div>

          <button
            type="button"
            onClick={() => navigate("/demo-dashboard")}
            style={{
              border: "none",
              borderRadius: 14,
              padding: "12px 16px",
              background: "#0f172a",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Volver al dashboard demo
          </button>
        </div>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!authorName.trim() || !messageText.trim()) return;

    setDemoMessages((prev) => [
      {
        id: `${Date.now()}`,
        authorName: authorName.trim(),
        message: messageText.trim(),
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);

    setAuthorName("");
    setMessageText("");
  }

  return (
  <div
    style={{
      minHeight: "100vh",
      padding: 18,
      background: "#f3f4f6",
      fontFamily: "system-ui",
    }}
  >
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      
      {/* CABECERA */}
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div
          style={{
            fontSize: 12,
            color: "#64748b",
            marginBottom: 6,
          }}
        >
          Página demo (no real)
        </div>
      </div>

      {/* TARJETA DIFUNTO */}
    <div
  style={{
    maxWidth: 620,
    width: "100%",
    margin: "0 auto 18px auto",
    padding: 16,
    background: "linear-gradient(180deg, rgba(17,24,39,0.06), white)",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 12px 35px rgba(0,0,0,0.12)",
    textAlign: "center",
    boxSizing: "border-box",
    overflow: "hidden",
  }}
>
  <div
    style={{
      height: 6,
      borderRadius: 999,
      background: "#111827",
      marginBottom: 12,
      opacity: 0.85,
    }}
  />

  {demoPage.photoUrl && demoPage.theme !== "minimal" && (
    <div style={{ marginBottom: 12 }}>
      <img
  src={demoPage.photoUrl}
  alt={demoPage.fullName}
  style={{
    width: demoPage.theme === "photo" ? "100%" : (window.innerWidth < 640 ? 120 : 160),
    height: demoPage.theme === "photo" ? "auto" : (window.innerWidth < 640 ? 120 : 160),
    objectFit: "cover",
    borderRadius: demoPage.theme === "photo" ? 12 : "50%",
    border: demoPage.theme === "photo" ? "none" : "4px solid white",
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
    display: "block",
    margin: "0 auto",
    maxWidth: "100%",
  }}
/>
    </div>
  )}

  <div
    style={{
      fontSize: 26,
      fontWeight: 900,
      letterSpacing: -0.3,
      marginBottom: 6,
      color: "#111827",
    }}
  >
    {demoPage.fullName}
  </div>

  {demoPage.message && (
    <div
      style={{
        marginTop: 8,
        fontSize: 14,
        color: "#555",
        lineHeight: 1.5,
      }}
    >
      {demoPage.message}
    </div>
  )}

  <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
    <button
      onClick={() =>
        document.getElementById("demo-form")?.scrollIntoView({ behavior: "smooth" })
      }
      style={{
        padding: "10px 16px",
        borderRadius: 12,
        border: "none",
        background: "#111827",
        color: "white",
        fontWeight: 800,
        cursor: "pointer",
        minWidth: 180,
      }}
    >
      Deja un mensaje
    </button>
  </div>
</div>

      {/* FORMULARIO */}
      <div
  id="demo-form"
  style={{
    maxWidth: 620,
    margin: "16px auto",
    padding: 16,
    background: "white",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 10px 28px rgba(0,0,0,0.10)",
    boxSizing: "border-box",
    overflow: "hidden",
  }}
>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>
          Escribe tu mensaje
        </div>

        <form
  onSubmit={handleSubmit}
  style={{
    display: "grid",
    gap: 12,
    width: "100%",
    minWidth: 0,
  }}
>
          <input
  value={authorName}
  onChange={(e) => setAuthorName(e.target.value)}
  placeholder="Tu nombre"
  style={{
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 16px",
    borderRadius: 16,
    border: "1px solid #dbe3ee",
    background: "rgba(255,255,255,0.95)",
    fontSize: 15,
    outline: "none",
    color: "#0f172a",
  }}
/>

    <textarea
  value={messageText}
  onChange={(e) => setMessageText(e.target.value)}
  placeholder="Escribe tu mensaje de condolencia"
  rows={5}
  style={{
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 16px",
    borderRadius: 16,
    border: "1px solid #dbe3ee",
    background: "rgba(255,255,255,0.95)",
    fontSize: 15,
    outline: "none",
    color: "#0f172a",
    resize: "vertical",
  }}
/>

          <button
            type="submit"
            style={{
              padding: "12px 16px",
              borderRadius: 14,
              border: "none",
              background: "#111827",
              color: "white",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Publicar mensaje demo
          </button>
        </form>
      </div>

      {/* LISTA MENSAJES */}
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <h3 style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>
          Mensajes de condolencia
        </h3>

        {demoMessages.length === 0 ? (
          <p style={{ color: "#666" }}>Aún no hay mensajes.</p>
        ) : (
          demoMessages.map((m) => (
            <div
              key={m.id}
              style={{
                marginTop: 14,
                padding: 16,
                background: "white",
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 10px 28px rgba(0,0,0,0.10)",
              }}
            >
              <div style={{ fontWeight: 800 }}>
                {m.authorName || "Anónimo"}
              </div>

              <div style={{ fontSize: 12, color: "#64748b" }}>
                {new Date(m.createdAt).toLocaleString("es-ES")}
              </div>

              <p style={{ marginTop: 8 }}>{m.message}</p>
            </div>
          ))
        )}
      </div>

      {/* VOLVER */}
      <div style={{ textAlign: "center", marginTop: 24 }}>
        <button
          onClick={() => navigate("/demo-dashboard")}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #dbe3ee",
            background: "white",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Volver al dashboard demo
        </button>
      </div>
      <div
  style={{
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 16,
    justifyContent: "center",
  }}
>
  <button
    type="button"
    onClick={async () => {
      await navigator.clipboard.writeText(window.location.href);
      alert("Enlace demo copiado.");
    }}
    style={{
      border: "1px solid #dbe3ee",
      borderRadius: 12,
      padding: "10px 14px",
      background: "white",
      color: "#0f172a",
      fontWeight: 700,
      cursor: "pointer",
    }}
  >
    Copiar enlace
  </button>

  <button
    type="button"
    onClick={() =>
      window.open(
        `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
          window.location.href
        )}`,
        "_blank"
      )
    }
    style={{
      border: "1px solid #dbe3ee",
      borderRadius: 12,
      padding: "10px 14px",
      background: "white",
      color: "#0f172a",
      fontWeight: 700,
      cursor: "pointer",
    }}
  >
    QR demo
  </button>
</div>
    </div>
  </div>
);
}