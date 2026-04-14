import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDemo } from "./DemoContext";
import imageCompression from "browser-image-compression";
function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getDemoPublicUrl(slug: string) {
  return `${window.location.origin}/demo/${slug}`;
}

function getDemoQrUrl(slug: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    getDemoPublicUrl(slug)
  )}`;
}

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
 const { demoPage, setDemoPage, setDemoMessages, clearDemo, demoMessages } = useDemo();

  const [fullNameInput, setFullNameInput] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [themeInput, setThemeInput] = useState<"classic" | "photo" | "minimal">("classic");
const [photoPreview, setPhotoPreview] = useState("");
const [, setPhotoFile] = useState<File | null>(null);

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

          <div
  style={{
    display: "grid",
    gap: 12,
    width: "100%",
    minWidth: 0,
  }}
>
           <input
  value={fullNameInput}
  onChange={(e) => setFullNameInput(e.target.value)}
  placeholder="Nombre del difunto"
  style={{
    width: "100%",
    boxSizing: "border-box",
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
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid #dbe3ee",
    fontSize: 15,
    minHeight: 80,
    resize: "vertical",
  }}
/>

<select
  value={themeInput}
  onChange={(e) =>
    setThemeInput(e.target.value as "classic" | "photo" | "minimal")
  }
  style={{
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid #dbe3ee",
    fontSize: 15,
    background: "white",
  }}
>
  <option value="classic">Clásico (Foto pequeña)</option>
  <option value="photo">Foto grande</option>
  <option value="minimal">Minimalista (Sin foto)</option>
</select>

<input
  type="file"
  accept="image/*"
  onChange={async (e) => {
    const file = e.target.files?.[0] || null;

    if (!file) {
      setPhotoFile(null);
      setPhotoPreview("");
      return;
    }

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1.2,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        initialQuality: 0.85,
      });

      setPhotoFile(compressed as File);
      setPhotoPreview(URL.createObjectURL(compressed));
    } catch {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }}
  style={{
   width: "100%",
    boxSizing: "border-box",
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid #dbe3ee",
    fontSize: 15,
    background: "white",
  }}
/>

{photoPreview ? (
  <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    minWidth: 0,
  }}
>
   <img
  src={photoPreview}
  alt="Vista previa"
  style={{
    width: 88,
    height: 88,
    objectFit: "cover",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.08)",
    maxWidth: "100%",
  }}
/>

    <button
      type="button"
      onClick={() => {
        setPhotoFile(null);
        setPhotoPreview("");
      }}
      style={{
        border: "1px solid #dbe3ee",
        background: "white",
        color: "#0f172a",
        borderRadius: 12,
        padding: "10px 14px",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      Quitar foto
    </button>
  </div>
) : null}

            <button
              type="button"
              onClick={() => {
                if (!fullNameInput.trim()) return;

                const slug = slugify(fullNameInput);

setDemoMessages([]);

const createdAt = new Date();
const closesAt = new Date();
closesAt.setDate(closesAt.getDate() + 7);

setDemoPage({
  slug,
  fullName: fullNameInput.trim(),
  message: messageInput.trim(),
  status: "open",
  theme: themeInput,
  createdAt: createdAt.toISOString(),
  closesAt: closesAt.toISOString(),
  isSearchable: true,
  photoUrl: themeInput === "minimal" ? null : photoPreview || null,
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
          {demoPage && (
  <div
    style={{
      marginTop: 24,
      padding: 20,
      background: "rgba(255,255,255,0.96)",
      borderRadius: 24,
      border: "1px solid rgba(0,0,0,0.06)",
      boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 6,
        borderTopLeftRadius: 24,
        borderBottomLeftRadius: 24,
        background: "#10b981",
      }}
    />

    <div style={{ position: "relative", zIndex: 1, paddingLeft: 8 }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          borderRadius: 999,
          padding: "6px 10px",
          fontSize: 12,
          fontWeight: 700,
          background: "rgba(16,185,129,0.12)",
          color: "#047857",
          marginBottom: 12,
        }}
      >
        Activa
      </div>

      <h3
        style={{
          margin: 0,
          fontSize: 23,
          lineHeight: 1.2,
          fontWeight: 800,
          letterSpacing: "-0.02em",
        }}
      >
        {demoPage.fullName}
      </h3>

      <div
        style={{
          marginTop: 2,
          marginBottom: 12,
          fontSize: 13,
          color: "#64748b",
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <span style={{ fontWeight: 600 }}>
          {demoPage.isSearchable ? "🔍 Visible en buscador" : "🚫 Oculta del buscador"}
        </span>

        <span
          style={{
            background: "#e2e8f0",
            color: "#0f172a",
            padding: "3px 9px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          Demo
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginTop: 18,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: 12,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#64748b",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Creada
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
            {formatDate(demoPage.createdAt)}
          </div>
        </div>

        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: 12,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#64748b",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Mensajes
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
            {demoMessages.length}
          </div>
        </div>

        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: 12,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#64748b",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Cierre
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
            {formatDate(demoPage.closesAt)}
          </div>
        </div>

        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: 12,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#64748b",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Tema
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
            {demoPage.theme}
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: 12,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#64748b",
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Enlace público demo
        </div>
        <div
          style={{
            fontSize: 13,
            color: "#0f172a",
            lineHeight: 1.5,
            wordBreak: "break-all",
          }}
        >
          {getDemoPublicUrl(demoPage.slug)}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(getDemoPublicUrl(demoPage.slug));
            alert("Enlace demo copiado.");
          }}
          style={{
            border: "1px solid #dbe3ee",
            background: "rgba(255,255,255,0.9)",
            color: "#0f172a",
            borderRadius: 14,
            padding: "12px 14px",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Copiar enlace
        </button>

       <button
  type="button"
  onClick={() => window.open(getDemoQrUrl(demoPage.slug), "_blank")}
  style={{
    border: "1px solid #dbe3ee",
    background: "rgba(255,255,255,0.9)",
    color: "#0f172a",
    borderRadius: 14,
    padding: "12px 14px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  }}
>
  QR
</button>

        <button
          type="button"
          onClick={() => navigate(`/demo/${demoPage.slug}`)}
          style={{
            border: "none",
            background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
            color: "white",
            borderRadius: 14,
            padding: "12px 14px",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Ver página
        </button>

        <button
          type="button"
          style={{
            border: "1px solid #dbe3ee",
            background: "rgba(255,255,255,0.9)",
            color: "#0f172a",
            borderRadius: 14,
            padding: "12px 14px",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Moderar mensajes
        </button>

        <button
          type="button"
          style={{
            border: "1px solid rgba(239,68,68,0.22)",
            background: "rgba(254,242,242,0.9)",
            color: "#b91c1c",
            borderRadius: 14,
            padding: "12px 14px",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Eliminar página
        </button>

        <button
          type="button"
          style={{
            border: "1px solid rgba(239,68,68,0.22)",
            background: "rgba(254,242,242,0.9)",
            color: "#b91c1c",
            borderRadius: 14,
            padding: "12px 14px",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Cerrar página
        </button>
      </div>
    </div>
  </div>
)}
        </div>
      </div>
    </div>
  );
}