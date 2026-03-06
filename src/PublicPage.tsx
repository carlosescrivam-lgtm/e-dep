import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import imageCompression from "browser-image-compression";
import logoEdep from "./assets/logo-edep.png";

type Page = {
  id: string;
  full_name: string;
  custom_text: string | null;
  theme: string;
  status: string;
  closes_at: string;
  funeral_home_name?: string | null;
};

type Condolence = {
  id: string;
  author_name: string | null;
  message: string;
  created_at: string;
  photo_url?: string | null;
};

export default function PublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [page, setPage] = useState<Page | null>(null);
  const [messages, setMessages] = useState<Condolence[]>([]);
  const [author, setAuthor] = useState("");
  const [message, setMessage] = useState("");
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
const [photoFile, setPhotoFile] = useState<File | null>(null);
const [photoPreview, setPhotoPreview] = useState<string>("");
const [showForm, setShowForm] = useState(false);
const fileInputRef = useRef<HTMLInputElement | null>(null);
  async function loadPage() {
    if (!slug || !token) {
      setLoading(false);
      return;
    }

    const res = await fetch(
      `/.netlify/functions/getPage?slug=${encodeURIComponent(slug)}&token=${encodeURIComponent(token)}`
    );

    if (!res.ok) {
      setLoading(false);
      return;
    }

    const json: { page: Page; messages: Condolence[] } = await res.json();
setPage(json.page);

const next = json.messages ?? [];
setMessages(next);


setLoading(false);
  }



 async function submitMessage() {
  if (!slug || !token) {
    alert("Enlace inválido (falta token).");
    return;
  }

  if (!message.trim()) {
    alert("Escribe un mensaje.");
    return;
  }

  let uploadedPath: string | null = null;

  // Si hay foto: pedimos URL firmada y subimos por PUT (sin base64)
  if (photoFile) {
    const prep = await fetch("/.netlify/functions/createPhotoUpload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        token,
        fileName: photoFile.name,
        mimeType: photoFile.type || "application/octet-stream",
      }),
    });

    if (prep.ok) {
      const j = await prep.json();
      uploadedPath = j.photo_path;

      const putRes = await fetch(j.upload_url, {
        method: "PUT",
        headers: { "Content-Type": photoFile.type || "application/octet-stream" },
        body: photoFile,
      });

      if (!putRes.ok) {
        alert("No se pudo subir la imagen. Se enviará el mensaje sin foto.");
        uploadedPath = null;
      }
    } else {
      const j = await prep.json().catch(() => ({}));
      alert("Error preparando subida. Se enviará sin foto: " + (j.error ?? "desconocido"));
    }
  }

  const res = await fetch("/.netlify/functions/postCondolence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slug,
      token,
      author_name: author.trim() || null,
      message: message.trim(),
      photo_path: uploadedPath,
    }),
  });

  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    alert("Error enviando mensaje: " + (j.error ?? "desconocido"));
    return;
  }

  // limpiar formulario
    setAuthor("");
  setMessage("");
  setPhotoFile(null);
  setPhotoPreview("");
  if (fileInputRef.current) fileInputRef.current.value = "";
  setShowForm(false);

  await loadPage();
}


  useEffect(() => {
    loadPage();
    // recargar cuando cambia slug/token (por si abres otra página)
  }, [slug, token]);

  if (loading) return <div style={{ padding: 24, fontFamily: "system-ui" }}>Cargando...</div>;

  if (!page)
    return (
      <div style={{ padding: 24, fontFamily: "system-ui" }}>
        ❌ Página no encontrada o acceso inválido.
      </div>
    );

  // Si está cerrada o pasó la fecha, mostramos cerrado
  const isExpired = Date.now() > new Date(page.closes_at).getTime();
  if (page.status === "closed" || isExpired)
    return (
      <div style={{ padding: 24, fontFamily: "system-ui" }}>
        ⚠️ Esta página ya está cerrada.
      </div>
    );

return (
 <div
  style={{
    minHeight: "100vh",
    padding: 18,
    background: "#f3f4f6",
    fontFamily: "system-ui",
    position: "relative",
    overflow: "visible",
  }}
>
    <style>{`
      @keyframes msgIn {
        from { opacity: 0; transform: translateY(12px); filter: blur(2px); }
        to   { opacity: 1; transform: translateY(0);    filter: blur(0px); }
      }
    `}</style>

   
  

    {/* Contenido por encima del watermark */}
    <div style={{ maxWidth: 980, margin: "0 auto", position: "relative", zIndex: 1 }}>
      
      <div style={{ textAlign: "center", marginBottom: 8 }}>
  <img
    src={logoEdep}
    alt="E-Dep"
    style={{
      width: 130,
      maxWidth: "55vw",
      opacity: 0.9,
      display: "inline-block",
    }}
  />
</div>

{page.funeral_home_name && (
  <div
    style={{
      textAlign: "center",
      fontSize: 12,
      color: "var(--muted)",
      marginBottom: 14,
    }}
  >
    Gestionado por <strong>{page.funeral_home_name}</strong>
  </div>
)}

      {/* Tarjeta del difunto (más estrecha) */}

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
  <div
    style={{
      fontSize: 26,
      fontWeight: 900,
      letterSpacing: -0.3,
      marginBottom: 6,
      color: "#111827",
    }}
  >
    {page.full_name}
  </div>

  {page.custom_text && (
    <div style={{ marginTop: 8, fontSize: 14, color: "#555", lineHeight: 1.5 }}>
      {page.custom_text}
    </div>
  )}

  <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
    {!showForm ? (
      <button
        type="button"
        onClick={() => setShowForm(true)}
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
    ) : (
      <button
        type="button"
        onClick={() => setShowForm(false)}
        style={{
          padding: "10px 16px",
          borderRadius: 12,
          border: "1px solid rgba(17,24,39,0.14)",
          background: "white",
          fontWeight: 800,
          cursor: "pointer",
          minWidth: 180,
        }}
      >
        Cerrar
      </button>
    )}
  </div>
</div>

{showForm && (
  <div
  style={{
    maxWidth: 620,
    width: "100%",
    margin: "16px auto",
    padding: 16,
    background: "white",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 10px 28px rgba(0,0,0,0.10)",
  }}
>

  <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>Escribe tu mensaje</div>    

        <input
  placeholder="Tu nombre (opcional)"
  value={author}
  onChange={(e) => setAuthor(e.target.value)}
 style={{
  width: "100%",
  padding: 12,
  marginBottom: 12,
  borderRadius: 12,
  border: "1px solid rgba(17,24,39,0.12)",
  outline: "none",
}}
/>

    <textarea
  placeholder="Tu mensaje..."
  value={message}
  onChange={(e) => setMessage(e.target.value)}
  style={{
  width: "100%",
  padding: 12,
  minHeight: 120,
  borderRadius: 12,
  border: "1px solid rgba(17,24,39,0.12)",
  outline: "none",
  resize: "vertical",
}}
/>     

<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  
onChange={async (e) => {
  const f = e.target.files?.[0] ?? null;

  // Si cancelan selección
  if (!f) {
    setPhotoFile(null);
    setPhotoPreview("");
    return;
  }

  // 1) Validación de tipo
  if (!f.type.startsWith("image/")) {
    alert("El archivo debe ser una imagen.");
    setPhotoFile(null);
    setPhotoPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    return;
  }

  // 2) Validación de tamaño original (ej: máximo 8MB antes de comprimir)
  const maxOriginalMB = 8;
  if (f.size > maxOriginalMB * 1024 * 1024) {
    alert(`La imagen es demasiado grande (máx. ${maxOriginalMB}MB).`);
    setPhotoFile(null);
    setPhotoPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    return;
  }

  // 3) Compresión automática (objetivo ~1.2MB y máximo 1600px)
  try {
    const compressed = await imageCompression(f, {
      maxSizeMB: 1.2,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      initialQuality: 0.8,
    });

    setPhotoFile(compressed as File);
    setPhotoPreview(URL.createObjectURL(compressed));
  } catch (err) {
    alert("No se pudo comprimir la imagen. Prueba con otra.");
    setPhotoFile(null);
    setPhotoPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }
}}

/>



{photoPreview && (
  <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
    <img src={photoPreview} alt="preview" style={{ maxWidth: "70%", borderRadius: 8 }} />
    <button
  type="button"
  style={{
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(17,24,39,0.14)",
    background: "white",
    fontWeight: 700,
    cursor: "pointer",
  }}
  onClick={() => {
    setPhotoFile(null);
    setPhotoPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }}
>
  Quitar imagen
</button>
  </div>
)}
        
        <button
  type="button"
  onClick={submitMessage}
  style={{
    marginTop: 12,
    width: "100%",
    padding: "12px 16px",
    borderRadius: 14,
    border: "none",
    background: "#111827",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
  }}
>
  Publicar mensaje
</button>
        </div>
)}
      <div style={{ maxWidth: 980, margin: "0 auto", position: "relative", zIndex: 1 }}>

        <h3 style={{ margin: "0 0 10px 0", color: "var(--muted)", fontSize: 12, fontWeight: 800 }}>
  Mensajes de condolencia
</h3>

          {messages.length === 0 ? (
            <p style={{ color: "#666" }}>Aún no hay mensajes.</p>
          ) : (
           messages.map((m, index) => (
              
<div
  key={`${m.id}-${m.created_at}`}
  onMouseEnter={() => setHoveredMessage(m.id)}
  onMouseLeave={() => setHoveredMessage(null)}
  
  style={{
  marginTop: 14,
  padding: 16,
  paddingLeft: 26,
  background: "white",
  borderRadius: 14,

  border:
    hoveredMessage === m.id
      ? "1px solid rgba(17,24,39,0.16)"
      : "1px solid rgba(0,0,0,0.06)",

  boxShadow:
    hoveredMessage === m.id
      ? "0 16px 40px rgba(0,0,0,0.18)"
      : "0 10px 28px rgba(0,0,0,0.10)",

  // ✅ vuelve la elevación
  transform: hoveredMessage === m.id ? "translateY(-3px)" : "translateY(0)",
  transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",

  position: "relative",

  // ✅ animación visible (sin transform)
 
}}
>
  {/* Línea vertical */}
  <div
    style={{
      position: "absolute",
      left: 12,
      top: 14,
      bottom: 14,
      width: 3,
      borderRadius: 999,
      background: "rgba(17,24,39,0.18)",
    }}
  />

  {/* Punto (opcional pero queda genial) */}
  <div
    style={{
      position: "absolute",
      left: 9,
      top: 16,
      width: 9,
      height: 9,
      borderRadius: 999,
      background: "#111827",
      boxShadow: "0 6px 14px rgba(17,24,39,0.18)",
      
    }}
  />
<div
  style={{
    opacity: 0,
    animation: "msgIn 700ms cubic-bezier(.2,.8,.2,1) both",
    animationDelay: `${Math.min(index, 10) * 180}ms`,
    willChange: "transform, opacity, filter",
  }}
>
  <div style={{ fontWeight: 800 }}>{m.author_name || "Anónimo"}</div>
  <div style={{ fontSize: 12, color: "var(--muted)" }}>
    {new Date(m.created_at).toLocaleString()}
  </div>
  <p style={{ marginTop: 8, marginBottom: 0, lineHeight: 1.5 }}>{m.message}</p>

  {m.photo_url && (
  <img
    src={m.photo_url}
    alt="foto"
    style={{ marginTop: 10, maxWidth: "100%", borderRadius: 8 }}
  />
)}
</div>
</div>
            ))
          )}

        </div>
      </div>
    </div>
  );
}
