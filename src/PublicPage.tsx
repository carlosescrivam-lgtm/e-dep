import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import imageCompression from "browser-image-compression";
type Page = {
  id: string;
  full_name: string;
  custom_text: string | null;
  theme: string;
  status: string;
  closes_at: string;
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
  const [loading, setLoading] = useState(true);
const [photoFile, setPhotoFile] = useState<File | null>(null);
const [photoPreview, setPhotoPreview] = useState<string>("");
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
    setMessages(json.messages);
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
        padding: 24,
        background: page.theme === "simple_gray" ? "#f2f2f2" : "#ffffff",
        fontFamily: "system-ui",
      }}
    >
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <h1>{page.full_name}</h1>

        {page.custom_text && (
          <p style={{ fontStyle: "italic", color: "#555" }}>{page.custom_text}</p>
        )}

        <div style={{ marginTop: 24, padding: 16, background: "white", borderRadius: 8 }}>
          <h3>Escribe tu mensaje</h3>

          <input
            placeholder="Tu nombre (opcional)"
            style={{ width: "100%", padding: 10, marginBottom: 10 }}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />

          <textarea
            placeholder="Tu mensaje..."
            style={{ width: "100%", padding: 10, minHeight: 100 }}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            
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
  <div style={{ marginTop: 10 }}>
    <img src={photoPreview} alt="preview" style={{ maxWidth: "100%", borderRadius: 8 }} />
  </div>
)}

{photoPreview && (
  <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
    <img src={photoPreview} alt="preview" style={{ maxWidth: "70%", borderRadius: 8 }} />
    <button
      type="button"
      style={{ padding: 10 }}
      onClick={() => {
        setPhotoFile(null);
        setPhotoPreview("");
      }}
    >
      Quitar imagen
    </button>
  </div>
)}
          <button onClick={submitMessage} style={{ marginTop: 10, padding: 10 }}>
            Enviar mensaje
          </button>
        </div>

        <div style={{ marginTop: 30 }}>
          <h3>Mensajes</h3>

          {messages.length === 0 ? (
            <p style={{ color: "#666" }}>Aún no hay mensajes.</p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                style={{ marginTop: 12, padding: 12, background: "white", borderRadius: 8 }}
              >
                <div style={{ fontWeight: 600 }}>{m.author_name || "Anónimo"}</div>
                <div style={{ fontSize: 14, color: "#555" }}>
                  {new Date(m.created_at).toLocaleString()}
                </div>
                <p>{m.message}</p>
                {m.photo_url && (
  <img
    src={m.photo_url}
    alt="foto"
    style={{
      marginTop: 10,
      maxWidth: "100%",
      borderRadius: 8
    }}
  />
)}
              </div>
            ))
          )}

        </div>
      </div>
    </div>
  );
}