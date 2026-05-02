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
  funeral_home_logo_url?: string | null;
  photo_url?: string | null;
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [author, setAuthor] = useState("");
  const [message, setMessage] = useState("");
  const [submissionNotice, setSubmissionNotice] = useState<string | null>(null);
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
const [photoFile, setPhotoFile] = useState<File | null>(null);
const [photoPreview, setPhotoPreview] = useState<string>("");
const [showForm, setShowForm] = useState(false);
const fileInputRef = useRef<HTMLInputElement | null>(null);
const noticeRef = useRef<HTMLDivElement | null>(null);


 async function loadPage() {
  try {
    if (!slug) {
      setLoading(false);
      return;
    }

    const url = token
      ? `/.netlify/functions/getPage?slug=${encodeURIComponent(
          slug
        )}&token=${encodeURIComponent(token)}`
      : `/.netlify/functions/getPage?slug=${encodeURIComponent(slug)}`;

    const res = await fetch(url);

    if (!res.ok) {
      setPage(null);
      setMessages([]);
      return;
    }

    const json: { page: Page; messages: Condolence[] } = await res.json();

    setPage(json.page);
    setMessages(json.messages ?? []);
  } catch (err) {
    console.error("Error cargando página pública:", err);
    setPage(null);
    setMessages([]);
  } finally {
    setLoading(false);
  }
}


async function submitMessage() {

  setIsAnalyzing(true);

  try {
  if (!slug) {
  alert("Enlace inválido.");
  return;
}

    if (!message.trim()) {
      alert("Escribe un mensaje.");
      return;
    }

    let uploadedPath: string | null = null;

    // Si hay foto: pedimos URL firmada y subimos por PUT
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
          headers: {
            "Content-Type": photoFile.type || "application/octet-stream",
          },
          body: photoFile,
        });

        if (!putRes.ok) {
          alert("No se pudo subir la imagen. Se enviará el mensaje sin foto.");
          uploadedPath = null;
        }
      } else {
        const j = await prep.json().catch(() => ({}));
        alert(
          "Error preparando subida. Se enviará sin foto: " +
            (j.error ?? "desconocido")
        );
      }
    }

    const res = await fetch("/.netlify/functions/postCondolence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        token,
        author_name: author,
        message,
        photo_path: uploadedPath,
      }),
    });

    const data = await res.json();
    const hadPhoto = !!photoFile;

    if (!res.ok) {
      throw new Error(data?.error || "Error enviando mensaje");
    }

    setAuthor("");
    setMessage("");
    setPhotoFile(null);
    setPhotoPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

if (data?.moderation_status === "pending") {
  setSubmissionNotice(
    hadPhoto
      ? "✔ Gracias por tu mensaje. Al incluir una imagen, quedará temporalmente pendiente de revisión por parte del equipo de E-Dep antes de publicarse."
      : "✔ Gracias por tu mensaje. Ha sido enviado correctamente y está pendiente de revisión antes de publicarse."
  );

  setAuthor("");
  setMessage("");
  setPhotoFile(null);
  setPhotoPreview("");
  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }

  setShowForm(false);
  return;
}

if (data?.moderation_status === "rejected") {
  setSubmissionNotice(
    "Tu mensaje no ha podido publicarse porque incumple las normas de respeto de esta página."
  );

  setAuthor("");
  setMessage("");
  setPhotoFile(null);
  setPhotoPreview("");
  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }

  setShowForm(false);
  return;
}

    await loadPage();
    setShowForm(false);
  } catch (err: any) {
  console.error("Error enviando mensaje:", err);
  alert(
    err?.message === "Failed to fetch"
      ? "No se pudo subir la imagen. Recuerda que el tamaño máximo recomendado es 3MB. Prueba con una foto más ligera."
      : err?.message || "No se pudo enviar el mensaje."
  );
}
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

if (page.status === "pending_payment") {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui", textAlign: "center" }}>
      ⚠️ Esta página todavía no está activa.
    </div>
  );
}

if (page.status === "closed" || isExpired)
  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      ⚠️ Esta página ya está cerrada.
    </div>
  );

const isPhotoTheme = page.theme === "photo";
const isMinimalTheme = page.theme === "minimal";


return (
 <div
  style={{
    minHeight: "100vh",
    padding: 18,
    background: "linear-gradient(180deg, #f8fafc 0%, #eef2f7 55%, #e8edf5 100%)",
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

  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
`}</style>

   
  

    {/* Contenido por encima del watermark */}
    <div style={{ maxWidth: 980, margin: "0 auto", position: "relative", zIndex: 1 }}>
      
      <div style={{ textAlign: "center", marginBottom: 8 }}>
  <img
    src={logoEdep}
    alt="E-Dep"
    style={{
      width: 88,
      maxWidth: "55vw",
      opacity: 0.72,
      display: "inline-block",
    }}
    />
    {page.funeral_home_logo_url && (
  <div style={{ textAlign: "center", marginBottom: 8 }}>
    <img
      src={page.funeral_home_logo_url}
      alt={page.funeral_home_name || "Funeraria"}
      style={{
        maxWidth: 90,
        maxHeight: 42,
        objectFit: "contain",
        opacity: 0.9,
        display: "inline-block",
      }}
    />
  </div>
)}
</div>

{page.funeral_home_name && (
  <div
    style={{
      textAlign: "center",
      fontSize: 11,
      color: "#7a7a7a",
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
  margin: "0 auto 20px auto",
  padding: window.innerWidth < 640 ? 16 : 20,
  background: "linear-gradient(180deg, rgba(17,24,39,0.05), rgba(255,255,255,0.98))",
  borderRadius: 20,
  border: "1px solid rgba(255,255,255,0.72)",
  boxShadow: "0 20px 50px rgba(15,23,42,0.10)",
  textAlign: "center",
  boxSizing: "border-box",
  backdropFilter: "blur(10px)",
}}
>
<div
  style={{
   height: 6,
borderRadius: 999,
background: "linear-gradient(90deg, #0f172a 0%, #334155 100%)",
marginBottom: 14,
opacity: 0.95,
  }}
  />

{page.photo_url && !isMinimalTheme && (
  <div style={{ marginBottom: 12 }}>

  <img
  src={page.photo_url}
  alt={page.full_name}
  style={{
    width: isPhotoTheme ? "100%" : (window.innerWidth < 640 ? 120 : 160),
    height: isPhotoTheme ? "auto" : (window.innerWidth < 640 ? 120 : 160),
    objectFit: "cover",
    borderRadius: isPhotoTheme ? 12 : "50%",
    border: isPhotoTheme ? "none" : "4px solid white",
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
    display: "block",
    margin: "0 auto",
  }}
/>
  </div>
)}

  <div
    style={{
    fontSize: window.innerWidth < 640 ? 24 : 30,
fontWeight: 900,
letterSpacing: "-0.03em",
marginBottom: 8,
color: "#0f172a",
lineHeight: 1.05,
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
  padding: "11px 18px",
  borderRadius: 14,
  border: "none",
  background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
  minWidth: 190,
  boxShadow: "0 14px 30px rgba(15,23,42,0.18)",
}}
      >
        Deja un mensaje
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setShowForm(false)}
        style={{
  padding: "11px 18px",
  borderRadius: 14,
  border: "1px solid rgba(15,23,42,0.12)",
  background: "rgba(255,255,255,0.94)",
  color: "#0f172a",
  fontWeight: 800,
  cursor: "pointer",
  minWidth: 190,
}}
      >
        Cerrar
      </button>
    )}
  </div>
</div>


{submissionNotice && (
  <div
    ref={noticeRef}
    style={{
      maxWidth: 620,
      margin: "12px auto",
      padding: 14,
      background: "rgba(16,185,129,0.08)",
      border: "1px solid rgba(16,185,129,0.25)",
      borderRadius: 12,
      color: "#065f46",
      fontWeight: 600,
      fontSize: 14,
      textAlign: "center",
    }}
  >
    {submissionNotice}
  </div>
)}


{showForm && (
<div
  style={{
    maxWidth: 620,
    width: "100%",
    margin: "16px auto",
    padding: window.innerWidth < 640 ? 14 : 16,
    background: "white",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 10px 28px rgba(0,0,0,0.10)",
    boxSizing: "border-box",
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
  console.error("No se pudo comprimir la imagen:", err);

  const maxFallbackSize = 4 * 1024 * 1024; // 4MB

  if (f.size > maxFallbackSize) {
    alert(
      "La imagen es demasiado grande. Tamaño máximo recomendado: 3MB. Prueba con una foto más ligera."
    );
    setPhotoFile(null);
    setPhotoPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    return;
  }

  setPhotoFile(f);
  setPhotoPreview(URL.createObjectURL(f));
}
}}

/>

<div
  style={{
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
    lineHeight: 1.5,
  }}
>
  Puedes añadir una foto al mensaje. Tamaño máximo recomendado: 3MB.
  Si la imagen es muy grande, prueba con una captura de pantalla o una foto más ligera.
</div>

<div
  style={{
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
    lineHeight: 1.4,
  }}
>
  Los mensajes con imagen se revisan antes de publicarse.
</div>

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
  disabled={isAnalyzing}
  style={{
    marginTop: 12,
    width: "100%",
    padding: "12px 16px",
    borderRadius: 14,
    border: "none",
    background: "#111827",
    color: "white",
    fontWeight: 800,
    cursor: isAnalyzing ? "not-allowed" : "pointer",
    opacity: isAnalyzing ? 0.7 : 1,
  }}
>
  {isAnalyzing ? "Analizando mensaje..." : "Publicar mensaje"}
</button>

{isAnalyzing && (
  <div
    style={{
      marginTop: 10,
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 14,
      color: "#92400e",
      fontWeight: 600,
      background: "rgba(245,158,11,0.1)",
      border: "1px solid rgba(245,158,11,0.25)",
      padding: "10px 12px",
      borderRadius: 10,
    }}
  >
    <div
      style={{
        width: 16,
        height: 16,
        borderRadius: "50%",
        border: "2px solid rgba(146,64,14,0.25)",
        borderTopColor: "#92400e",
        animation: "spin 0.8s linear infinite",
        flexShrink: 0,
      }}
    />
   <span>Tu mensaje está siendo revisado antes de publicarse. Gracias por tu paciencia.</span>
  </div>
)}
        </div>
)}
      <div style={{ maxWidth: 980, margin: "0 auto", position: "relative", zIndex: 1 }}>

        <h3
  style={{
    margin: "4px 0 12px 0",
    color: "#64748b",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  }}
>
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
  <p
  style={{
    marginTop: 10,
    marginBottom: 0,
    lineHeight: 1.7,
    color: "#334155",
    fontSize: 15,
  }}
>
  {m.message}
</p>

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
