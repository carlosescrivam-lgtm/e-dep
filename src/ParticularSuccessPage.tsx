import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

type SuccessData = {
  full_name: string;
  status: string;
  url: string;
  mail_sent?: boolean;
  mail_error?: string | null;
  family_email?: string | null;
};

export default function ParticularSuccessPage() {
  const [searchParams] = useSearchParams();
  const pageId = searchParams.get("page_id");

  const [data, setData] = useState<SuccessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copyOk, setCopyOk] = useState(false);

useEffect(() => {
  async function load() {
    if (!pageId) {
      setLoading(false);
      return;
    }

    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/.netlify/functions/confirmParticularPayment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page_id: pageId,
          session_id: sessionId,
        }),
      });

      const raw = await res.text();

      let json: any = {};
      try {
        json = raw ? JSON.parse(raw) : {};
      } catch {
        json = { error: raw || "Respuesta no válida del servidor" };
      }

      if (!res.ok) {
        throw new Error(json?.error || "No se pudo confirmar el pago.");
      }

      setData(json);
    } catch (err: any) {
      console.error("confirmParticularPayment:", err);
    } finally {
      setLoading(false);
    }
  }

  load();
}, [pageId, searchParams]);

  const qrUrl = useMemo(() => {
    if (!data?.url) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
      data.url
    )}`;
  }, [data]);

  async function handleCopy() {
    if (!data?.url) return;
    await navigator.clipboard.writeText(data.url);
    setCopyOk(true);
    setTimeout(() => setCopyOk(false), 2000);
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
          maxWidth: 760,
          background: "rgba(255,255,255,0.96)",
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
            background: "#dcfce7",
            color: "#166534",
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 14,
          }}
        >
          Compra realizada correctamente
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
          Tu página ya está lista
        </h1>

        <p
          style={{
            marginTop: 12,
            marginBottom: 24,
            color: "#475569",
            lineHeight: 1.7,
            fontSize: 15,
          }}
        >
          Ya puedes compartir el enlace y el código QR. También te enviaremos esta
          información por email junto con el comprobante de compra.
        </p>

        {loading ? (
          <p style={{ color: "#475569" }}>Cargando tu página...</p>
        ) : !data ? (
          <p style={{ color: "#b91c1c", fontWeight: 600 }}>
            No se pudo recuperar la información de la página.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 0.9fr",
              gap: 20,
              alignItems: "start",
            }}
          >
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 20,
                padding: 20,
              }}
            >
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700 }}>
                Página comprada
              </div>

              <div
                style={{
                  marginTop: 8,
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                {data.full_name}
              </div>

              <div
                style={{
                  marginTop: 18,
                  fontSize: 13,
                  color: "#64748b",
                  fontWeight: 700,
                }}
              >
                Enlace para compartir
              </div>

              <div
                style={{
                  marginTop: 8,
                  padding: 14,
                  borderRadius: 14,
                  background: "white",
                  border: "1px solid #dbe3ee",
                  wordBreak: "break-word",
                  color: "#0f172a",
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                {data.url}
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
                <a
                  href={data.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-block",
                    padding: "12px 18px",
                    borderRadius: 14,
                    background: "#0f172a",
                    color: "white",
                    textDecoration: "none",
                    fontWeight: 700,
                  }}
                >
                  Ver mi página
                </a>

                <button
                  type="button"
                  onClick={handleCopy}
                  style={{
                    padding: "12px 18px",
                    borderRadius: 14,
                    background: "white",
                    color: "#0f172a",
                    border: "1px solid #cbd5e1",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {copyOk ? "Enlace copiado" : "Copiar enlace"}
                </button>

                <button
  type="button"
  onClick={() => {
    const text = `Te comparto esta página de condolencias:\n${data.url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  }}
  style={{
    padding: "12px 18px",
    borderRadius: 14,
    background: "#25D366",
    color: "white",
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
  }}
>
  Compartir por WhatsApp
</button>
              </div>

              <div
                style={{
                  marginTop: 18,
                  fontSize: 14,
                  color: "#475569",
                  lineHeight: 1.6,
                }}
              >
                Guárdalo o compártelo ahora. Al cerrarse la página, recibirás también el PDF
                final con los mensajes recopilados.
              </div>
              <div
  style={{
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    background: data.mail_sent ? "#ecfdf5" : "#fef2f2",
    border: data.mail_sent
      ? "1px solid #bbf7d0"
      : "1px solid #fecaca",
    color: data.mail_sent ? "#166534" : "#991b1b",
    fontSize: 14,
    lineHeight: 1.6,
  }}
>
  {data.mail_sent ? (
    <>Email enviado correctamente a {data.family_email || "tu correo"}.</>
  ) : (
    <>
      No se ha podido enviar el email automáticamente.
      {data.mail_error ? ` Error: ${data.mail_error}` : ""}
    </>
  )}
</div>
            </div>

            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 20,
                padding: 20,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700, marginBottom: 12 }}>
                Código QR
              </div>

              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="QR de la página"
                  style={{
                    width: 240,
                    maxWidth: "100%",
                    borderRadius: 16,
                    background: "white",
                    padding: 10,
                    border: "1px solid #dbe3ee",
                  }}
                />
              ) : null}

              <div
                style={{
                  marginTop: 14,
                  fontSize: 13,
                  color: "#64748b",
                  lineHeight: 1.6,
                }}
              >
                Compártelo por WhatsApp, email o imprímelo si lo necesitas.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}