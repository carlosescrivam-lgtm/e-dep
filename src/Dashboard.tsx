import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabaseClient";

type DbPage = {
  id: string;
  full_name: string | null;
  custom_text: string | null;
  theme: string | null;
  status: string | null;
  closes_at: string | null;
  slug: string | null;
  access_token: string | null;
  created_at: string | null;
  funeral_home_id?: string | null;
  funeral_homes?: { name?: string | null } | { name?: string | null }[] | null;
};

type Condolence = {
  id: string;
  page_id: string;
  created_at: string | null;
};

type PageCard = {
  id: string;
  full_name: string;
  custom_text: string;
  theme: string;
  status: string;
  closes_at: string | null;
  slug: string;
  access_token: string;
  created_at: string | null;
  funeral_home_name: string;
  condolences_count: number;
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<PageCard[]>([]);
  const [error, setError] = useState("");
  const [currentRole, setCurrentRole] = useState<"admin" | "funeral_home" | "">("");
  const [currentFuneralHomeId, setCurrentFuneralHomeId] = useState<string | null>(null);
  const [currentFuneralHomeName, setCurrentFuneralHomeName] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");

  const [fullName, setFullName] = useState("");
  const [customText, setCustomText] = useState("");
  const [familyEmail, setFamilyEmail] = useState("");

  const siteBase =
    typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
  async function init() {
    try {
      setLoading(true);
      await loadCurrentUserProfile();
      await loadData();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "No se pudo iniciar el dashboard.");
      setLoading(false);
    }
  }

  init();
}, []);

  async function loadCurrentUserProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("No hay sesión iniciada.");

  const { data, error } = await supabase
  .from("funeral_home_users")
  .select(`
    funeral_home_id,
    role,
    funeral_homes ( name )
  `)
  .eq("user_id", user.id)
  .maybeSingle();

  if (error) throw error;

  if (!data) {
    throw new Error("Este usuario no está vinculado a ninguna funeraria.");
  }

  const funeralHomeSource = Array.isArray((data as any).funeral_homes)
  ? (data as any).funeral_homes[0]
  : (data as any).funeral_homes;

setCurrentRole(data.role);
setCurrentFuneralHomeId(data.funeral_home_id);
setCurrentFuneralHomeName(funeralHomeSource?.name || "");

return data;
}

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const {
  data: { user },
  error: userError,
} = await supabase.auth.getUser();

if (userError) throw userError;
if (!user) throw new Error("No hay sesión iniciada.");

const { data: profile, error: profileError } = await supabase
  .from("funeral_home_users")
  .select("funeral_home_id, role")
  .eq("user_id", user.id)
  .maybeSingle();

if (profileError) throw profileError;
if (!profile) throw new Error("Usuario no vinculado a funeraria.");

let pagesQuery = supabase
  .from("deceased_pages")
  .select(`
    id,
    full_name,
    custom_text,
    theme,
    status,
    closes_at,
    slug,
    access_token,
    created_at,
    funeral_home_id,
    funeral_homes ( name )
  `)
  .order("created_at", { ascending: false });

if (profile.role !== "admin") {
  pagesQuery = pagesQuery.eq("funeral_home_id", profile.funeral_home_id);
}

const { data: pagesData, error: pagesError } = await pagesQuery;

if (pagesError) throw pagesError;

      const { data: condolencesData, error: condolencesError } = await supabase
        .from("condolences")
        .select("id, page_id, created_at");

      if (condolencesError) throw condolencesError;

      const pages = (pagesData ?? []) as DbPage[];
      const condolences = (condolencesData ?? []) as Condolence[];

      const countByPageId: Record<string, number> = {};

      for (const condolence of condolences) {
        if (!condolence.page_id) continue;
        countByPageId[condolence.page_id] =
          (countByPageId[condolence.page_id] || 0) + 1;
      }

      const normalized: PageCard[] = pages.map((page) => {
        const funeralHomeSource = Array.isArray(page.funeral_homes)
          ? page.funeral_homes[0]
          : page.funeral_homes;

        return {
          id: String(page.id),
          full_name: page.full_name || "Sin nombre",
          custom_text: page.custom_text || "",
          theme: page.theme || "default",
          status: page.status || "open",
          closes_at: page.closes_at || null,
          slug: page.slug || "",
          access_token: page.access_token || "",
          created_at: page.created_at || null,
          funeral_home_name: funeralHomeSource?.name || "",
          condolences_count: countByPageId[String(page.id)] || 0,
        };
      });

      setItems(normalized);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "No se pudo cargar el dashboard.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    if (!fullName.trim()) {
      alert("Debes escribir el nombre del difunto.");
      return;
    }

    try {
      setSaving(true);

      const slug =
        slugify(fullName) + "-" + Date.now().toString().slice(-6);

      const accessToken =
        Math.random().toString(36).slice(2) + Date.now().toString(36);

      const closesAt = new Date();
      closesAt.setDate(closesAt.getDate() + 10);

      const payload = {
  full_name: fullName.trim(),
  custom_text: customText.trim() || null,
  slug,
  access_token: accessToken,
  status: "open",
  closes_at: closesAt.toISOString(),
  theme: "default",
  family_email: familyEmail.trim() || null,
  funeral_home_id: currentFuneralHomeId,
};

      const { error } = await supabase.from("deceased_pages").insert(payload);

      if (error) throw error;

      setFullName("");
      setCustomText("");
      setFamilyEmail("");
      await loadData();
      alert("Página creada correctamente.");
    } catch (err: any) {
      console.error(err);
      alert(
        err?.message ||
          "No se pudo crear la página. Es posible que tu tabla necesite algún campo adicional del dashboard antiguo, como funeral_home_id."
      );
    } finally {
      setSaving(false);
    }
  }

  async function closePage(pageId: string, pageName: string) {
    const ok = window.confirm(
      `¿Seguro que quieres cerrar la página de ${pageName}?`
    );
    if (!ok) return;

    try {
      const { error } = await supabase
        .from("deceased_pages")
        .update({ status: "closed" })
        .eq("id", pageId);

      if (error) throw error;

      await loadData();
      alert("Página cerrada.");
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "No se pudo cerrar la página.");
    }
  }

  async function reopenPage(pageId: string, pageName: string) {
    const ok = window.confirm(
      `¿Quieres reabrir la página de ${pageName}?`
    );
    if (!ok) return;

    try {
      const { error } = await supabase
        .from("deceased_pages")
        .update({ status: "open" })
        .eq("id", pageId);

      if (error) throw error;

      await loadData();
      alert("Página reabierta.");
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "No se pudo reabrir la página.");
    }
  }

  function getPublicUrl(item: PageCard) {
    return `${siteBase}/p/${item.slug}?token=${item.access_token}`;
  }

  async function copyLink(item: PageCard) {
    try {
      await navigator.clipboard.writeText(getPublicUrl(item));
      alert("Enlace copiado.");
    } catch (err) {
      console.error(err);
      alert("No se pudo copiar el enlace.");
    }
  }

  function openPage(item: PageCard) {
    window.open(getPublicUrl(item), "_blank");
  }

  function openQr(item: PageCard) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      getPublicUrl(item)
    )}`;
    window.open(qrUrl, "_blank");
  }

async function handleLogout() {
  await supabase.auth.signOut();
  window.location.reload();
}

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.full_name.toLowerCase().includes(search.toLowerCase()) ||
        item.funeral_home_name.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === "all" ? true : item.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [items, search, filter]);

  const totalPages = items.length;
  const openPages = items.filter((x) => x.status === "open").length;
  const closedPages = items.filter((x) => x.status === "closed").length;
  const totalCondolences = items.reduce(
    (acc, item) => acc + item.condolences_count,
    0
  );

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
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div
          style={{
            marginBottom: 24,
            padding: 28,
            borderRadius: 30,
            background:
              "linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #334155 100%)",
            color: "#fff",
            boxShadow: "0 30px 80px rgba(15,23,42,0.22)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -60,
              top: -60,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 100,
              bottom: -80,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>

<div
  style={{
    position: "absolute",
    top: 24,
    right: 24,
  }}
>
  <button
    onClick={handleLogout}
    style={{
      border: "1px solid rgba(255,255,255,0.3)",
      background: "rgba(255,255,255,0.15)",
      color: "#fff",
      borderRadius: 10,
      padding: "8px 14px",
      fontWeight: 600,
      fontSize: 13,
      cursor: "pointer",
      backdropFilter: "blur(4px)",
    }}
  >
    Salir
  </button>
</div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.16)",
                borderRadius: 999,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 16,
              }}
            >
              E-Dep · Panel funeraria
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
              Dashboard profesional
            </h1>

<div
  style={{
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    marginBottom: 4,
    padding: "8px 12px",
    borderRadius: 999,
    background:
      currentRole === "admin"
        ? "rgba(59,130,246,0.18)"
        : "rgba(16,185,129,0.18)",
    border:
      currentRole === "admin"
        ? "1px solid rgba(96,165,250,0.35)"
        : "1px solid rgba(52,211,153,0.35)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
  }}
>
  {currentRole === "admin"
    ? "Modo administrador · viendo todas las funerarias"
    : currentFuneralHomeName
    ? `Panel de funeraria · ${currentFuneralHomeName}`
    : "Panel de funeraria · viendo solo tu cuenta"}
</div>

            <p
              style={{
                marginTop: 12,
                marginBottom: 0,
                maxWidth: 820,
                color: "rgba(255,255,255,0.82)",
                fontSize: 16,
                lineHeight: 1.6,
              }}
            >
              Gestiona páginas de condolencias con una imagen moderna, elegante
              y comercial. Crea nuevas páginas, comparte enlaces, genera QR y
              controla el estado de cada recuerdo.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <StatCard
            title="Total páginas"
            value={String(totalPages)}
            subtitle="Páginas registradas"
          />
          <StatCard
            title="Activas"
            value={String(openPages)}
            subtitle="Estado abierto"
          />
          <StatCard
            title="Cerradas"
            value={String(closedPages)}
            subtitle="Estado cerrado"
          />
          <StatCard
            title="Mensajes"
            value={String(totalCondolences)}
            subtitle="Condolencias recibidas"
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "380px 1fr",
            gap: 24,
            alignItems: "start",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.84)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.75)",
              borderRadius: 24,
              boxShadow: "0 18px 50px rgba(15,23,42,0.08)",
              padding: 22,
              position: "sticky",
              top: 20,
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: 8,
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: "-0.02em",
              }}
            >
              Crear nueva página
            </h2>

            <p
              style={{
                marginTop: 0,
                marginBottom: 20,
                color: "#475569",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              Rellena estos datos para generar una nueva página de condolencias.
            </p>

            <form onSubmit={handleCreate}>
              <FieldLabel>Nombre del difunto</FieldLabel>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ejemplo: Ricardo Borriquero"
                style={inputStyle}
              />

              <FieldLabel>Texto de la familia</FieldLabel>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Escribe una dedicatoria o mensaje inicial"
                rows={5}
                style={{ ...inputStyle, resize: "vertical", minHeight: 120 }}
              />

              <FieldLabel>Email de la familia</FieldLabel>
              <input
                value={familyEmail}
                onChange={(e) => setFamilyEmail(e.target.value)}
                placeholder="familia@ejemplo.com"
                type="email"
                style={inputStyle}
              />

              <button
                type="submit"
                disabled={saving}
                style={{
                  width: "100%",
                  marginTop: 16,
                  border: "none",
                  borderRadius: 16,
                  padding: "15px 18px",
                  background:
                    "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: saving ? "not-allowed" : "pointer",
                  boxShadow: "0 14px 30px rgba(15,23,42,0.18)",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Creando..." : "Crear página"}
              </button>
            </form>
          </div>

          <div>
            <div
              style={{
                background: "rgba(255,255,255,0.84)",
                backdropFilter: "blur(14px)",
                border: "1px solid rgba(255,255,255,0.75)",
                borderRadius: 24,
                boxShadow: "0 18px 50px rgba(15,23,42,0.08)",
                padding: 18,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto auto",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre o funeraria"
                  style={inputStyle}
                />

                <button
                  onClick={() => setFilter("all")}
                  style={filter === "all" ? activeFilterStyle : filterStyle}
                >
                  Todas
                </button>

                <button
                  onClick={() => setFilter("open")}
                  style={filter === "open" ? activeFilterStyle : filterStyle}
                >
                  Activas
                </button>

                <button
                  onClick={() => setFilter("closed")}
                  style={filter === "closed" ? activeFilterStyle : filterStyle}
                >
                  Cerradas
                </button>
              </div>
            </div>

            {loading ? (
              <div style={panelStyle}>Cargando dashboard...</div>
            ) : error ? (
              <div style={panelStyle}>
                <div style={{ color: "#b91c1c", fontWeight: 700 }}>{error}</div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div style={panelStyle}>No hay páginas para mostrar.</div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: 18,
                }}
              >
                {filteredItems.map((item) => {
                  const isOpen = item.status === "open";

                  return (
                    <div
                      key={item.id}
                      style={{
                        background: "rgba(255,255,255,0.88)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.75)",
                        borderRadius: 24,
                        padding: 20,
                        boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          right: -40,
                          top: -40,
                          width: 120,
                          height: 120,
                          borderRadius: "50%",
                          background: isOpen
                            ? "rgba(16,185,129,0.12)"
                            : "rgba(239,68,68,0.10)",
                        }}
                      />

                      <div style={{ position: "relative", zIndex: 1 }}>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            borderRadius: 999,
                            padding: "6px 10px",
                            fontSize: 12,
                            fontWeight: 700,
                            background: isOpen
                              ? "rgba(16,185,129,0.12)"
                              : "rgba(239,68,68,0.10)",
                            color: isOpen ? "#047857" : "#b91c1c",
                            marginBottom: 12,
                          }}
                        >
                          {isOpen ? "Activa" : "Cerrada"}
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
                          {item.full_name}
                        </h3>

                        {item.funeral_home_name ? (
                          <p
                            style={{
                              margin: "8px 0 0 0",
                              color: "#64748b",
                              fontSize: 14,
                            }}
                          >
                            Gestionado por {item.funeral_home_name}
                          </p>
                        ) : null}

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 12,
                            marginTop: 18,
                            marginBottom: 16,
                          }}
                        >
                          <MiniInfo
                            label="Creada"
                            value={formatDate(item.created_at)}
                          />
                          <MiniInfo
                            label="Mensajes"
                            value={String(item.condolences_count)}
                          />
                          <MiniInfo
                            label="Cierre"
                            value={formatDate(item.closes_at)}
                          />
                          <MiniInfo
                            label="Tema"
                            value={item.theme || "default"}
                          />
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
                            Enlace público
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              color: "#0f172a",
                              lineHeight: 1.5,
                              wordBreak: "break-all",
                            }}
                          >
                            {getPublicUrl(item)}
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
                            onClick={() => openPage(item)}
                            style={primarySmallButtonStyle}
                          >
                            Ver página
                          </button>

                          <button
                            onClick={() => copyLink(item)}
                            style={ghostButtonStyle}
                          >
                            Copiar enlace
                          </button>

                          <button
                            onClick={() => openQr(item)}
                            style={ghostButtonStyle}
                          >
                            QR
                          </button>

                          {isOpen ? (
                            <button
                              onClick={() =>
                                closePage(item.id, item.full_name)
                              }
                              style={dangerButtonStyle}
                            >
                              Cerrar página
                            </button>



                          ) : (
                            <button
                              onClick={() =>
                                reopenPage(item.id, item.full_name)
                              }
                              style={ghostButtonStyle}
                            >
                              Reabrir página
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
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

function formatDate(value: string | null) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.84)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.72)",
        borderRadius: 22,
        padding: 18,
        boxShadow: "0 14px 30px rgba(15,23,42,0.06)",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#64748b",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 32,
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          marginBottom: 8,
        }}
      >
        {value}
      </div>

      <div style={{ fontSize: 14, color: "#475569" }}>{subtitle}</div>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
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
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
        {value}
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: 14,
        fontWeight: 700,
        color: "#0f172a",
        marginBottom: 8,
        marginTop: 14,
      }}
    >
      {children}
    </label>
  );
}

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

const panelStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.84)",
  border: "1px solid rgba(255,255,255,0.72)",
  borderRadius: 24,
  padding: 20,
  boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
};

const filterStyle: React.CSSProperties = {
  border: "1px solid #dbe3ee",
  background: "rgba(255,255,255,0.9)",
  color: "#0f172a",
  borderRadius: 14,
  padding: "12px 16px",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

const activeFilterStyle: React.CSSProperties = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#fff",
  borderRadius: 14,
  padding: "12px 16px",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

const primarySmallButtonStyle: React.CSSProperties = {
  border: "none",
  background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
  color: "white",
  borderRadius: 14,
  padding: "12px 14px",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

const ghostButtonStyle: React.CSSProperties = {
  border: "1px solid #dbe3ee",
  background: "rgba(255,255,255,0.9)",
  color: "#0f172a",
  borderRadius: 14,
  padding: "12px 14px",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

const dangerButtonStyle: React.CSSProperties = {
  border: "1px solid rgba(239,68,68,0.22)",
  background: "rgba(254,242,242,0.9)",
  color: "#b91c1c",
  borderRadius: 14,
  padding: "12px 14px",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};