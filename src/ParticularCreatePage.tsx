import React, { useMemo, useRef, useState } from "react";
import { supabase } from "./lib/supabaseClient";

export default function ParticularCreatePage() {
  const [fullName, setFullName] = useState("");
  const [memorialText, setMemorialText] = useState("");
  const MAX_TEXT_LENGTH = 280;
  const [contactEmail, setContactEmail] = useState("");
  const [durationDays, setDurationDays] = useState("3");
  const [theme, setTheme] = useState("classic");
  const [isSearchable, setIsSearchable] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
const [photoPreview, setPhotoPreview] = useState("");
const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const previewTitle = useMemo(() => {
    return fullName.trim() || "Nombre del ser querido";
  }, [fullName]);
const isMobile = typeof window !== "undefined" && window.innerWidth < 900;
const isPhotoTheme = theme === "photo";
const isMinimalTheme = theme === "minimal";
  const previewText = useMemo(() => {
    return (
      memorialText.trim() ||
      "Aquí se mostrará el texto de homenaje o presentación de la página."
    );
  }, [memorialText]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f8fafc 0%, #eef2f7 55%, #e8edf5 100%)",
        padding: isMobile ? 12 : 20,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <button
          type="button"
          onClick={() => {
            window.location.href = "/";
          }}
          style={{
            marginBottom: 16,
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
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1.05fr 0.95fr",
    gap: 20,
    alignItems: "start",
  }}
>
         <div
  style={{
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(255,255,255,0.75)",
    borderRadius: 28,
    boxShadow: "0 24px 60px rgba(15,23,42,0.12)",
    padding: isMobile ? 16 : 24,
  }}
>
           
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
      fontSize: 22,
      fontWeight: 700,
      textAlign: "center",
      color: "#0f172a",
    }}
  >
    Crear página de condolencias
  </h1>
</div>
           
<div
  style={{
    background: "rgba(15,23,42,0.04)",
    border: "1px solid rgba(15,23,42,0.08)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 22,
  }}
>
  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>
    Preguntas frecuentes
  </div>

  <FaqItem
    id="faq1"
    openFaq={openFaq}
    setOpenFaq={setOpenFaq}
    question="¿Para quién es este servicio?"
    answer="Para familias, amigos, compañeros de trabajo, clubes deportivos, asociaciones o cualquier grupo cercano que quiera hacerle un último homenaje a su amigo o familiar, pudiendo dejarle mensajes y/o fotos. Nosotros lo llamamos 'su ultima red social'"
  />

  <FaqItem
    id="faq2"
    openFaq={openFaq}
    setOpenFaq={setOpenFaq}
    question="¿Qué recibiré?"
    answer="Tras el pago recibirás el enlace y el código QR de la página para compartirlo fácilmente en grupos de mensajería instantánea, estados, stories o en cualquier lugar que de acceso a todos sus conocidos, amigos y familiares."
  />

  <FaqItem
    id="faq3"
    openFaq={openFaq}
    setOpenFaq={setOpenFaq}
    question="¿Qué pasa al finalizar?"
    answer="Cuando la página se cierre, tras el período decidido, recibirás un e-mail con un PDF con todos los mensajes recopilados listo para imprimir como un libro de condolencias si lo deseas."
  />

  <FaqItem
    id="faq4"
    openFaq={openFaq}
    setOpenFaq={setOpenFaq}
    question="¿Los mensajes se publican directamente?"
    answer="Todos los mensajes pasan primero por un filtro de IA que descarta los claramente inapropiados. Los no descartados se publican al instante. Algunos quedan como dudosos y nuestro equipo de E-Dep los revisa uno a uno y los acepta o descarta segun la conveniencia. Todos los mensajes con foto pasan a pendientes de revision siempre, para evitar publicidad etc en la página"
  />

  <FaqItem
    id="faq5"
    openFaq={openFaq}
    setOpenFaq={setOpenFaq}
    question="¿Dónde recibiré el PDF final con todos los mensajes?"
    answer="El PDF que se crea automáticamente al concluir el período elegido de 3, 5 o 7 días, se envía al e-mail de contacto que dejaste al crear la página"
  />
</div>

           

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Nombre del ser querido</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. María López García"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Texto de homenaje</label>
              <textarea
              maxLength={MAX_TEXT_LENGTH}
  value={memorialText}
  onChange={(e) => {
    const value = e.target.value;

    if (value.length <= MAX_TEXT_LENGTH) {
      setMemorialText(value);
    }
  }}
  placeholder="Escribe unas palabras para presentar la página..."
  style={{
    ...inputStyle,
    minHeight: 120,
    resize: "vertical",
    fontFamily: "inherit",
  }}
/>
<div
  style={{
    textAlign: "right",
    fontSize: 12,
    marginTop: 6,
    color:
      memorialText.length > MAX_TEXT_LENGTH * 0.9
        ? "#b91c1c"
        : "#64748b",
    fontWeight: 600,
  }}
>
  {memorialText.length} / {MAX_TEXT_LENGTH}
</div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Email de contacto</label>
              <input
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="tuemail@ejemplo.com"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Duración de la página</label>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                style={inputStyle}
              >
                <option value="3">3 días</option>
                <option value="7">7 días</option>
                <option value="10">10 días</option>
              </select>
            </div>

<div style={{ marginBottom: 12 }}>
  <label style={labelStyle}>Tema visual</label>
  <select
    value={theme}
    onChange={(e) => setTheme(e.target.value)}
    style={inputStyle}
  >
    <option value="classic">Clásico</option>
    <option value="photo">Foto destacada</option>
    <option value="minimal">Minimalista</option>
  </select>
</div>

           <div style={{ marginBottom: 12 }}>
  <label style={labelStyle}>Foto (opcional)</label>

  <input
    ref={fileInputRef}
    type="file"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files?.[0] ?? null;

      if (!file) {
        setPhotoFile(null);
        setPhotoPreview("");
        return;
      }

      if (!file.type.startsWith("image/")) {
        alert("El archivo debe ser una imagen.");
        setPhotoFile(null);
        setPhotoPreview("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }}
    style={{
      ...inputStyle,
      padding: 12,
    }}
  />

  {photoPreview && (
    <div style={{ marginTop: 12 }}>
      <img
        src={photoPreview}
        alt="Vista previa"
        style={{
          width: "100%",
          maxHeight: 260,
          objectFit: "cover",
          borderRadius: 16,
          border: "1px solid #dbe3ee",
          display: "block",
        }}
      />

      <button
        type="button"
        onClick={() => {
          setPhotoFile(null);
          setPhotoPreview("");
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
        style={{
          marginTop: 10,
          padding: "10px 14px",
          borderRadius: 12,
          border: "1px solid #cbd5e1",
          background: "white",
          color: "#0f172a",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Quitar imagen
      </button>
    </div>
  )}
</div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 14,
                marginBottom: 20,
                fontSize: 14,
                color: "#334155",
                fontWeight: 600,
              }}
            >
              <input
                type="checkbox"
                checked={isSearchable}
                onChange={(e) => setIsSearchable(e.target.checked)}
              />
              Mostrar esta página en el buscador público
            </label>

           <button
  type="button"
  onClick={async () => {
    try {
      if (!fullName.trim()) {
        alert("Escribe el nombre del ser querido.");
        return;
      }

      if (!contactEmail.trim()) {
        alert("Escribe un email de contacto.");
        return;
      }

      setSaving(true);

let uploadedPhotoUrl: string | null = null;
console.log("PHOTO FILE:", photoFile);
if (photoFile) {
  const prepRes = await fetch("/.netlify/functions/createParticularPhotoUpload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName: photoFile.name,
    }),
  });

  const prepData = await prepRes.json();

  if (!prepRes.ok) {
    throw new Error(prepData?.error || "No se pudo preparar la subida de la foto.");
  }

console.log("PREP DATA FOTO:", prepData);
console.log("PHOTO FILE JUST BEFORE UPLOAD:", photoFile);

let uploadError: any = null;

try {
  const uploadResult = await supabase.storage
    .from("deceased-photos")
    .uploadToSignedUrl(prepData.path, prepData.token, photoFile);

  uploadError = uploadResult.error;

  console.log("UPLOAD RESULT FOTO:", uploadResult);
} catch (e) {
  console.error("UPLOAD THROW FOTO:", e);
  throw e;
}

if (uploadError) {
  console.error("ERROR STORAGE FOTO PARTICULAR:", uploadError);
  throw new Error(uploadError.message || "No se pudo subir la foto.");
}

console.log("PUBLIC URL FOTO:", prepData.publicUrl);

  uploadedPhotoUrl = prepData.publicUrl;
}
console.log("UPLOADED PHOTO URL FINAL:", uploadedPhotoUrl);
const res = await fetch("/.netlify/functions/createParticularPage", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    full_name: fullName,
    custom_text: memorialText,
    contact_email: contactEmail,
    duration_days: Number(durationDays),
    theme,
    is_searchable: isSearchable,
    photo_url: uploadedPhotoUrl,
  }),
});

      const data = await res.json();
      console.log("CREATE PARTICULAR PAGE RESPONSE:", data);

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo preparar la página.");
      }

const checkoutRes = await fetch("/.netlify/functions/createParticularCheckout", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    page_id: data.pageId,
  }),
});

const checkoutRaw = await checkoutRes.text();

let checkoutData: any = {};
try {
  checkoutData = checkoutRaw ? JSON.parse(checkoutRaw) : {};
} catch {
  checkoutData = { error: checkoutRaw || "Respuesta no válida del servidor" };
}

if (!checkoutRes.ok) {
  throw new Error(checkoutData?.error || "No se pudo iniciar el pago.");
}

if (!checkoutData?.url) {
  throw new Error("Stripe no devolvió la URL de pago.");
}

window.location.href = checkoutData.url;


    } catch (err: any) {
      alert(err?.message || "No se pudo crear la página.");
    } finally {
      setSaving(false);
    }
  }}
  disabled={saving}
  style={{
    width: "100%",
    border: "none",
    borderRadius: 16,
    padding: "15px 18px",
    background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
    color: "white",
    fontWeight: 700,
    fontSize: 15,
    cursor: saving ? "not-allowed" : "pointer",
    opacity: saving ? 0.7 : 1,
  }}
>
  {saving ? "Preparando página..." : "Obtener enlace y QR por 12 €"}
</button>
          </div>

          <div
  style={{
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(255,255,255,0.75)",
    borderRadius: 28,
    boxShadow: "0 24px 60px rgba(15,23,42,0.12)",
    padding: isMobile ? 16 : 24,
    position: isMobile ? "static" : "sticky",
    top: isMobile ? undefined : 20,
  }}
>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: "#64748b",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              Vista previa
            </div>

            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 22,
                padding: 22,
                overflow: "hidden",
              }}
            >
              {photoPreview && !isMinimalTheme ? (
                <img
                  src={photoPreview}
                  alt={previewTitle}
                  style={{
  width: isPhotoTheme ? "100%" : 180,
  maxWidth: "100%",
  height: isPhotoTheme ? 260 : 180,
  objectFit: "cover",
  borderRadius: isPhotoTheme ? 18 : isMinimalTheme ? 12 : "50%",
  marginBottom: 18,
  display: "block",
  marginLeft: "auto",
  marginRight: "auto",
}}
                />
              ) : (
                <div
                  style={{
                    height: 240,
                    borderRadius: 18,
                    marginBottom: 18,
                    background:
                      "linear-gradient(135deg, rgba(15,23,42,0.08) 0%, rgba(100,116,139,0.16) 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#475569",
                    fontWeight: 700,
                  }}
                >
                  Aquí se verá la fotografía
                </div>
              )}

              <h2
                style={{
  margin: 0,
  fontSize: isMinimalTheme ? 24 : 28,
  lineHeight: 1.15,
  fontWeight: isMinimalTheme ? 700 : 800,
  color: "#0f172a",
  textAlign: isMinimalTheme ? "left" : "center",
}}
              >
                {previewTitle}
              </h2>

             <p
  style={{
  marginTop: 18,
  marginBottom: 0,
  color: "#334155",
  lineHeight: 1.75,
  fontSize: 15,
  whiteSpace: "pre-wrap",
  overflowWrap: "break-word",
  wordBreak: "break-word",
  textAlign: isMinimalTheme ? "left" : "center",
}}
>
  {previewText}
</p>

              <div
                style={{
                  marginTop: 22,
                  padding: 14,
                  borderRadius: 16,
                  background: "white",
                  border: "1px dashed #cbd5e1",
                  color: "#64748b",
                  fontSize: 14,
                }}
              >
                Aquí se irán publicando los mensajes de condolencias que reciba la página.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
type FaqItemProps = {
  id: string;
  question: string;
  answer: string;
  openFaq: string | null;
  setOpenFaq: React.Dispatch<React.SetStateAction<string | null>>;
};

function FaqItem({
  id,
  question,
  answer,
  openFaq,
  setOpenFaq,
}: FaqItemProps) {
  const isOpen = openFaq === id;

  return (
    <div
      style={{
        borderTop: "1px solid rgba(15,23,42,0.08)",
        paddingTop: 10,
        paddingBottom: 10,
      }}
    >
      <button
        type="button"
        onClick={() => setOpenFaq(isOpen ? null : id)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          padding: 0,
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>
          {question}
        </span>

        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#475569",
            lineHeight: 1,
          }}
        >
          {isOpen ? "−" : "+"}
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            color: "#475569",
            lineHeight: 1.6,
            fontSize: 14,
            marginTop: 10,
            paddingRight: 24,
          }}
        >
          {answer}
        </div>
      )}
    </div>
  );
}
const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 8,
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