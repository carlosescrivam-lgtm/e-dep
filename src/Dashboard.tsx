import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import QRCode from "qrcode";

type FuneralHome = {
  id: string;
  name: string;
  owner_user_id: string;
};

type DeceasedPage = {
  id: string;
  full_name: string;
  slug: string;
  access_token: string;
  status: string;
  closes_at: string;
  created_at: string;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita tildes
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function randomToken(len = 32) {
  const bytes = new Uint8Array(len);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export default function Dashboard() {
  const [home, setHome] = useState<FuneralHome | null>(null);
  const [homeName, setHomeName] = useState("");

  const [pages, setPages] = useState<DeceasedPage[]>([]);
  const [newFullName, setNewFullName] = useState("");
  const [newCustomText, setNewCustomText] = useState("");
  const [newTheme, setNewTheme] = useState("simple_gray");
  const [newPublicSearch, setNewPublicSearch] = useState(false);
  const [newFamilyEmail, setNewFamilyEmail] = useState("");
  const [selected, setSelected] = useState<DeceasedPage | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const baseUrl = useMemo(() => window.location.origin, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function loadOrCreateFuneralHome() {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return;

    const { data: existing, error } = await supabase
      .from("funeral_homes")
      .select("*")
      .eq("owner_user_id", userId)
      .maybeSingle();

    if (error) {
      alert("Error cargando funeraria: " + error.message);
      return;
    }

    if (existing) {
      setHome(existing as FuneralHome);
      setHomeName((existing as FuneralHome).name ?? "");
      return;
    }
  }

  async function createFuneralHome() {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from("funeral_homes")
      .insert({ name: homeName.trim(), owner_user_id: userId })
      .select("*")
      .single();

    if (error) {
      alert("Error creando funeraria: " + error.message);
      return;
    }

    setHome(data as FuneralHome);
  }

  async function loadPages(funeralHomeId: string) {
    const { data, error } = await supabase
      .from("deceased_pages")
      .select("id, full_name, slug, access_token, status, closes_at, created_at")
      .eq("funeral_home_id", funeralHomeId)
      .order("created_at", { ascending: false });

    if (error) {
      alert("Error cargando difuntos: " + error.message);
      return;
    }
    setPages((data ?? []) as DeceasedPage[]);
  }

  async function createDeceasedPage() {
    if (!home) return;
    const fullName = newFullName.trim();
    if (!fullName) {
      alert("Escribe el nombre del difunto.");
      return;
    }


    const slugBase = slugify(fullName);
    const slug = `${slugBase}-${Math.floor(Date.now() / 1000)}`; // evita colisiones
    const access_token = randomToken(24);

    const closesAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("deceased_pages")
      .insert({
        funeral_home_id: home.id,
        full_name: fullName,
        slug,
        access_token,
        custom_text: newCustomText.trim() || null,
        family_email: newFamilyEmail.trim() || null,
        theme: newTheme,
        is_public_searchable: newPublicSearch,
        status: "open",
        closes_at: closesAt,
      })
      .select("id, full_name, slug, access_token, status, closes_at, created_at")
      .single();

    if (error) {
      alert("Error creando difunto: " + error.message);
      return;
    }

    setNewFullName("");
    setNewCustomText("");
    setNewTheme("simple_gray");
    setNewPublicSearch(false);
    setNewFamilyEmail("");
    
    // refrescar lista y seleccionar el recién creado
    await loadPages(home.id);
    setSelected(data as DeceasedPage);
  }

  async function buildQr(page: DeceasedPage) {
    const link = `${baseUrl}/p/${page.slug}?token=${page.access_token}`;
    const url = await QRCode.toDataURL(link, { width: 512, margin: 1 });
    setQrDataUrl(url);
  }

  useEffect(() => {
    loadOrCreateFuneralHome();
  }, []);

  useEffect(() => {
    if (home?.id) {
      loadPages(home.id);
    }
  }, [home?.id]);

  useEffect(() => {
    if (selected) {
      buildQr(selected).catch(() => setQrDataUrl(""));
    } else {
      setQrDataUrl("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui", maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Dashboard funeraria</h1>
        <button onClick={signOut}>Salir</button>
      </div>

      {!home ? (
        <div style={{ marginTop: 20, border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
          <h3>Primera vez: crea tu funeraria</h3>
          <p>Nombre comercial:</p>
          <input
            style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}
            value={homeName}
            onChange={(e) => setHomeName(e.target.value)}
            placeholder="Funeraria Ejemplo S.L."
          />
          <button onClick={createFuneralHome} style={{ padding: 10 }}>
            Crear funeraria
          </button>
        </div>
      ) : (
        <>
          <div style={{ marginTop: 20, border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
            <h2>{home.name}</h2>
            <p style={{ color: "#555" }}>ID: {home.id}</p>
          </div>

          <div
            style={{
              marginTop: 20,
              border: "1px solid #ddd",
              padding: 16,
              borderRadius: 8,
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 12,
            }}
          >
            <h3>Crear difunto (nuevo libro)</h3>

            <label>Nombre del difunto</label>
            <input
              style={{ width: "100%", padding: 10 }}
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              placeholder="María García López"
            />

            <label>Texto de cabecera (opcional)</label>
            <textarea
              style={{ width: "100%", padding: 10, minHeight: 80 }}
              value={newCustomText}
              onChange={(e) => setNewCustomText(e.target.value)}
              placeholder="Siempre estarás en nuestros corazones..."
            />

            <label>Tema</label>
            <select style={{ width: "100%", padding: 10 }} value={newTheme} onChange={(e) => setNewTheme(e.target.value)}>
              <option value="simple_gray">Sencilla (fondo gris claro)</option>
              <option value="photo_transparent">Foto (transparente) + texto</option>
            </select>

            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={newPublicSearch}
                onChange={(e) => setNewPublicSearch(e.target.checked)}
              />
              <label>Email de la familia (para enviar PDF)</label>
<input
  style={{ width: "100%", padding: 10 }}
  value={newFamilyEmail}
  onChange={(e) => setNewFamilyEmail(e.target.value)}
  placeholder="familia@email.com"
/>
              Visible en buscador público (más adelante haremos el buscador)
            </label>

            <button onClick={createDeceasedPage} style={{ padding: 10 }}>
              Crear difunto
            </button>
          </div>

          <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
              <h3>Difuntos</h3>

              {pages.length === 0 ? (
                <p style={{ color: "#666" }}>Aún no has creado ninguno.</p>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {pages.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelected(p)}
                      style={{
                        textAlign: "left",
                        padding: 12,
                        borderRadius: 8,
                        border: selected?.id === p.id ? "2px solid #111" : "1px solid #ddd",
                        background: "white",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{p.full_name}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>
                        Estado: {p.status} · Cierra: {new Date(p.closes_at).toLocaleString()}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
              <h3>Enlace y QR</h3>

              {!selected ? (
                <p style={{ color: "#666" }}>Selecciona un difunto para ver su enlace.</p>
              ) : (
                <>
                  <p style={{ marginBottom: 8 }}>
                    <strong>{selected.full_name}</strong>
                  </p>

                  <p style={{ fontSize: 12, color: "#666", marginTop: 0 }}>Comparte este enlace con la familia:</p>

                  <input
                    style={{ width: "100%", padding: 10 }}
                    readOnly
                    value={`${baseUrl}/p/${selected.slug}?token=${selected.access_token}`}
                    onFocus={(e) => e.currentTarget.select()}
                  />

                  <div style={{ marginTop: 12 }}>
                    {qrDataUrl ? <img src={qrDataUrl} alt="QR" style={{ width: 220, height: 220 }} /> : <p>Generando QR...</p>}
                  </div>

<button
  style={{ marginTop: 12, padding: 10 }}
  onClick={async () => {
    if (!selected) return;

    const res = await fetch(`/.netlify/functions/getPdfLink?pageId=${encodeURIComponent(selected.id)}`);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert("No hay PDF todavía: " + (j.error ?? "desconocido"));
      return;
    }

    const j = await res.json();
    window.open(j.url, "_blank");
  }}
>
  Descargar PDF
</button>

<button
  style={{ marginTop: 12, padding: 10 }}
  onClick={async () => {
    if (!selected) return;

    const res = await fetch("/.netlify/functions/generatePdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: selected.id }),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert("Error generando PDF: " + (j.error ?? "desconocido"));
      return;
    }

    
    alert("PDF generado correctamente");
  }}
>
  Generar PDF y cerrar página (prueba)
</button>

                  <p style={{ fontSize: 12, color: "#666" }}>
                    (Todavía no existe la página pública /p/:slug; la creamos en el siguiente paso.)
                  </p>


                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}