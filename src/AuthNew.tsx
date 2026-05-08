import { useState, useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import Footer from "./components/Footer";
export default function Auth() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [funeralHomeName, setFuneralHomeName] = useState("");
const [address, setAddress] = useState("");
const [city, setCity] = useState("");
const [country, setCountry] = useState("");
const [postalCode, setPostalCode] = useState("");
const [phone, setPhone] = useState("");
const [contactEmail, setContactEmail] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [msg, setMsg] = useState<string>("");
const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
const [searchResults, setSearchResults] = useState<any[]>([]);
const [searching, setSearching] = useState(false);
const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
const [showInstall, setShowInstall] = useState(false);
const [isIOS, setIsIOS] = useState(false);
const [entryView, setEntryView] = useState<"chooser" | "funeral">("chooser");
  async function signIn() {
    try {
      setLoading(true);
      setMsg("Iniciando sesión...");

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setMsg(error ? "❌ " + error.message : "✅ Sesión iniciada");
    } catch (err: any) {
      setMsg("❌ " + (err?.message || "No se pudo iniciar sesión"));
    } finally {
      setLoading(false);
    }
  }

  async function forgotPassword() {
  try {
    if (!email.trim()) {
      setMsg("❌ Introduce tu email para recuperar la contraseña.");
      return;
    }

    setLoading(true);
    setMsg("Enviando email de recuperación...");

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}`,
    });

    if (error) {
      setMsg("❌ " + error.message);
      return;
    }

    setMsg("✅ Te hemos enviado un email para restablecer tu contraseña.");
  } catch (err: any) {
    setMsg("❌ " + (err?.message || "No se pudo enviar el email de recuperación."));
  } finally {
    setLoading(false);
  }
}

async function handlePublicSearch() {
  if (!searchQuery.trim()) {
    setSearchResults([]);
    return;
  }

  try {
    setSearching(true);

    const res = await fetch(
      `/.netlify/functions/searchPages?q=${encodeURIComponent(searchQuery)}`
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "No se pudo realizar la búsqueda.");
    }

    setSearchResults(data.items || []);
  } catch (err: any) {
    console.error(err);
    alert(err?.message || "No se pudo buscar.");
  } finally {
    setSearching(false);
  }
}

useEffect(() => {
  if (searchQuery.trim().length < 2) {
    setSearchResults([]);
    return;
  }

  const timeout = setTimeout(() => {
    handlePublicSearch();
  }, 350);

  return () => clearTimeout(timeout);
}, [searchQuery]);

useEffect(() => {
  const ua = window.navigator.userAgent.toLowerCase();

  const isIosDevice =
    /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;

  const isAndroidDevice = /android/.test(ua);
  const isMobileDevice = isIosDevice || isAndroidDevice;

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true;

  setIsIOS(isIosDevice);

  if (isIosDevice && !isStandalone) {
    setShowInstall(true);
  }

  const handleBeforeInstallPrompt = (e: any) => {
    e.preventDefault();

    if (!isMobileDevice || isIosDevice || isStandalone) return;

    setDeferredPrompt(e);
    setShowInstall(true);
  };

  window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

  return () => {
    window.removeEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );
  };
}, []);

  async function signUp() {
    try {
      setLoading(true);
      setMsg("Creando cuenta de funeraria...");
      if (!country) {
  setMsg("❌ Debes seleccionar un país.");
  setLoading(false);
  return;
}

      const res = await fetch("/.netlify/functions/registerFuneralHome", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  name: funeralHomeName,
  address,
  city,
  postal_code: postalCode,
  phone,
  contact_email: contactEmail,
  country,
  email,
  password,
  
}),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg("❌ " + (data?.error || "No se pudo crear la cuenta"));
        return;
      }

      setMsg(
  "✅ Cuenta creada. Ahora puedes iniciar sesión con tu email y contraseña."
);
setMode("login");
setFuneralHomeName("");
setAddress("");
setCity("");
setPostalCode("");
setPhone("");
setContactEmail("");
setCountry("");
setPassword("");
    } catch (err: any) {
      setMsg("❌ " + (err?.message || "No se pudo crear la cuenta"));
    } finally {
      setLoading(false);
    }
  }

async function handleInstallClick() {
  if (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  ) {
    setShowInstall(false);
    return;
  }

  if (isIOS) {
    alert(
      "Para instalar la app en iPhone:\n\n1. Pulsa el botón Compartir\n2. Pulsa 'Añadir a pantalla de inicio'"
    );
    return;
  }

  if (!deferredPrompt) return;

  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;

  if (choice.outcome === "accepted") {
    setShowInstall(false);
  }
}

if (entryView === "chooser") {
  return (
    <>
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(180deg, #f8fafc 0%, #eef2f7 55%, #e8edf5 100%)",
          padding: isMobile ? 16 : 24,
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 18,
              flexWrap: "wrap",
              marginBottom: 24,
            }}
          >
            <button
              type="button"
              onClick={() => {
                window.location.href = "/admin-login";
              }}
              style={topLinkStyle}
            >
              Acceso admin
            </button>

            <button
              type="button"
              onClick={() => {
                window.location.href = "/demo-login";
              }}
              style={topLinkStyle}
            >
              Acceso demo
            </button>
          </div>

          {showInstall && (
            <div
              style={{
                marginBottom: 20,
                padding: "12px 14px",
                borderRadius: 14,
                background: "rgba(15,23,42,0.06)",
                border: "1px solid rgba(15,23,42,0.15)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                Instala E-Dep para acceso rápido
              </div>

              <button
                onClick={handleInstallClick}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: "#0f172a",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                {isIOS ? "Cómo instalar" : "Instalar"}
              </button>
            </div>
          )}

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 32,
              alignItems: "center",
              padding: "34px 0 28px",
            }}
          >
            <div>
              <img
                src="/logo-blue.png"
                alt="E-Dep"
                style={{
                  height: isMobile ? 84 : 110,
                  objectFit: "contain",
                  marginBottom: 18,
                }}
              />

              <div
                style={{
                  display: "inline-flex",
                  padding: "8px 12px",
                  borderRadius: 999,
                  background: "rgba(15,23,42,0.06)",
                  color: "#334155",
                  fontSize: 13,
                  fontWeight: 800,
                  marginBottom: 18,
                }}
              >
                Para funerarias y familias
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: isMobile ? 34 : 44,
                  lineHeight: 1.05,
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  color: "#0f172a",
                }}
              >
                El espacio digital de condolencias para funerarias y familias
              </h1>

              <p
                style={{
                  marginTop: 18,
                  marginBottom: 26,
                  color: "#475569",
                  lineHeight: 1.7,
                  fontSize: 17,
                  maxWidth: 620,
                }}
              >
                E-Dep permite crear páginas conmemorativas digitales donde
                familiares y amigos pueden dejar mensajes, compartir recuerdos y
                acompañar a la familia desde cualquier lugar.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  marginBottom: 22,
                }}
              >
                <button
  onClick={() => {
    setEntryView("funeral");
    setMsg("");
  }}
  style={primaryButtonStyle}
>
  Soy empresa funeraria
</button>

                <button
                  onClick={() => {
                    window.location.href = "/particular";
                  }}
                  style={secondaryButtonStyle}
                >
                  Soy particular
                </button>
              </div>

              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                Páginas con enlace limpio, código QR, mensajes, fotos y
                moderación por IA para ofrecer una experiencia cuidada y respetuosa.
              </p>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.94)",
                border: "1px solid rgba(255,255,255,0.8)",
                borderRadius: 28,
                boxShadow: "0 24px 60px rgba(15,23,42,0.12)",
                padding: 26,
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: "#0f172a",
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                Buscar página de condolencias
              </div>

              <p
                style={{
                  marginTop: 0,
                  marginBottom: 18,
                  color: "#64748b",
                  fontSize: 14,
                  lineHeight: 1.5,
                  textAlign: "center",
                }}
              >
                Introduce el nombre del difunto para acceder a su página.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                }}
              >
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nombre del difunto"
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid #cbd5e1",
                  }}
                />

                <button
                  type="button"
                  onClick={handlePublicSearch}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: "none",
                    background: "#0f172a",
                    color: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Buscar
                </button>
              </div>

              <div style={{ marginTop: 18 }}>
                {searching ? (
                  <div style={{ textAlign: "center" }}>Buscando...</div>
                ) : (
                  searchResults.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: 14,
                        borderRadius: 14,
                        background: "white",
                        border: "1px solid #e2e8f0",
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ fontWeight: 800 }}>{item.full_name}</div>

                      {item.funeral_home_name && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#64748b",
                            marginTop: 4,
                          }}
                        >
                          Gestionado por {item.funeral_home_name}
                        </div>
                      )}

                      <div style={{ marginTop: 10 }}>
                        <a
                          href={`/p/${item.slug}?token=${item.access_token}`}
                          style={{
                            color: "#0f172a",
                            fontWeight: 700,
                            textDecoration: "none",
                          }}
                        >
                          Ver página
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section
            style={{
              marginTop: 18,
              padding: "34px 0 10px",
            }}
          >

          <section
            style={{
              margin: "26px 0 18px",
              padding: 28,
              borderRadius: 32,
              background: "rgba(255,255,255,0.78)",
              border: "1px solid rgba(226,232,240,0.95)",
              boxShadow: "0 24px 60px rgba(15,23,42,0.10)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 24,
                alignItems: "center",
              }}
            >
              <div>
                <div style={eyebrowStyle}>Vista real del servicio</div>

                <h2
                  style={{
                    margin: 0,
                    color: "#0f172a",
                    fontSize: isMobile ? 28 : 34,
                    lineHeight: 1.15,
                    letterSpacing: "-0.035em",
                    fontWeight: 900,
                  }}
                >
                  Una página conmemorativa lista para compartir
                </h2>

                <p
                  style={{
                    marginTop: 14,
                    color: "#64748b",
                    fontSize: 16,
                    lineHeight: 1.7,
                  }}
                >
                  Cada página E-Dep reúne la información esencial, los mensajes
                  de apoyo y los recuerdos de familiares y amigos en un espacio
                  sencillo, cuidado y accesible desde móvil.
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    marginTop: 18,
                  }}
                >
                  <span style={pillStyle}>Enlace limpio</span>
                  <span style={pillStyle}>Código QR</span>
                  <span style={pillStyle}>Mensajes moderados por IA</span>
                  <span style={pillStyle}>Fotos y recuerdos</span>
                </div>
              </div>

              <div style={mockupWrapperStyle}>
                <div style={phoneMockupStyle}>
                  <div style={phoneTopBarStyle}></div>

                  <div
                    style={{
                      textAlign: "center",
                      padding: "18px 14px 14px",
                    }}
                  >
                    <img
  src="/logo-blue.png"
  alt="E-Dep"
  style={{
    width: 74,
    height: 74,
    objectFit: "contain",
    margin: "0 auto 12px",
    display: "block",
  }}
/>

                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 900,
                        color: "#0f172a",
                      }}
                    >
                      María García
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color: "#64748b",
                        marginTop: 4,
                      }}
                    >
                      1948 — 2026
                    </div>

                    <div
                      style={{
                        margin: "14px auto 0",
                        width: 120,
                        height: 120,
                        borderRadius: 18,
                        background:
                          "repeating-linear-gradient(45deg, #0f172a 0 6px, #ffffff 6px 12px)",
                        border: "8px solid white",
                        boxShadow: "0 12px 28px rgba(15,23,42,0.12)",
                      }}
                    />
                  </div>

                  <div style={{ padding: "0 14px 16px" }}>
                    <div style={condolencePreviewStyle}>
                      <strong>Laura</strong>
                      <p>
                        Siempre recordaremos su cariño, su alegría y todo lo que
                        nos enseñó.
                      </p>
                    </div>

                    <div style={condolencePreviewStyle}>
                      <strong>Familia Romero</strong>
                      <p>
                        Os acompañamos en este momento con todo nuestro afecto.
                      </p>
                    </div>

                    <div
                      style={{
                        marginTop: 12,
                        padding: "11px 12px",
                        borderRadius: 14,
                        background: "#0f172a",
                        color: "white",
                        textAlign: "center",
                        fontSize: 13,
                        fontWeight: 800,
                      }}
                    >
                      Dejar condolencia
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

            <div style={sectionHeaderStyle}>
              <div style={eyebrowStyle}>Qué es E-Dep</div>
              <h2 style={sectionTitleStyle}>
                Una página digital de condolencias, sencilla y respetuosa
              </h2>
              <p style={sectionTextStyle}>
                E-Dep ayuda a funerarias y familias a crear un espacio privado
                y fácil de compartir donde reunir mensajes, recuerdos y muestras
                de apoyo en momentos difíciles.
              </p>
            </div>

            <div style={cardsGridStyle}>
              <div style={infoCardStyle}>
                <div style={cardIconStyle}>🕊️</div>
                <h3 style={cardTitleStyle}>Página conmemorativa</h3>
                <p style={cardTextStyle}>
                  Cada familia tiene una página clara, cuidada y accesible desde
                  móvil, ordenador o código QR.
                </p>
              </div>

              <div style={infoCardStyle}>
                <div style={cardIconStyle}>💬</div>
                <h3 style={cardTitleStyle}>Mensajes y fotos</h3>
                <p style={cardTextStyle}>
                  Familiares y amigos pueden dejar condolencias, recuerdos y
                  fotografías de forma sencilla.
                </p>
              </div>

              <div style={infoCardStyle}>
                <div style={cardIconStyle}>🔗</div>
                <h3 style={cardTitleStyle}>Enlace y QR</h3>
                <p style={cardTextStyle}>
                  La funeraria envía el enlace y el QR a la familia para que lo puedan compartir en sus redes, grupos de mensajería o estados 
                </p>
              </div>
            </div>
          </section>

          <section style={{ padding: "44px 0 10px" }}>
            <div style={sectionHeaderStyle}>
              <div style={eyebrowStyle}>Cómo funciona</div>
              <h2 style={sectionTitleStyle}>Tres pasos, sin complicaciones</h2>
            </div>

            <div style={cardsGridStyle}>
              <div style={stepCardStyle}>
                <div style={stepNumberStyle}>1</div>
                <h3 style={cardTitleStyle}>La funeraria crea la página</h3>
                <p style={cardTextStyle}>
                  Desde su panel, la empresa crea una página de condolencias en
                  pocos segundos.
                </p>
              </div>

              <div style={stepCardStyle}>
                <div style={stepNumberStyle}>2</div>
                <h3 style={cardTitleStyle}>Comparte enlace y QR</h3>
                <p style={cardTextStyle}>
                  El enlace a la página se puede enviar por WhatsApp, incluir en una esquela
                  o mostrar mediante código QR.
                </p>
              </div>

              <div style={stepCardStyle}>
                <div style={stepNumberStyle}>3</div>
                <h3 style={cardTitleStyle}>La familia recibe apoyo</h3>
                <p style={cardTextStyle}>
                  Los mensajes quedan reunidos en un espacio bonito, ordenado y
                  fácil de conservar, rebiendo un PDF con todos los mensajes recibidos al cerrarse la página de forma automática
                </p>
              </div>
            </div>
          </section>

          <section style={{ padding: "44px 0 10px" }}>
            <div style={sectionHeaderStyle}>
              <div style={eyebrowStyle}>Beneficios</div>
              <h2 style={sectionTitleStyle}>
                Más valor para la funeraria, más acompañamiento para la familia
              </h2>
            </div>

            <div style={twoColumnsStyle}>
              <div style={featurePanelStyle}>
                <h3 style={panelTitleStyle}>Para funerarias</h3>

                <ul style={benefitListStyle}>
                  <li>Ofrece un servicio moderno y diferencial.</li>
                  <li>Aporta valor añadido sin complicar el trabajo diario.</li>
                  <li>Mejora la imagen profesional de la empresa.</li>
                  <li>Facilita compartir la página con enlace, QR o WhatsApp.</li>
                  <li>Centraliza mensajes y recuerdos en un entorno cuidado.</li>
                </ul>
              </div>

              <div style={featurePanelStyle}>
                <h3 style={panelTitleStyle}>Para familias</h3>

                <ul style={benefitListStyle}>
                  <li>Reciben mensajes de apoyo desde cualquier lugar.</li>
                  <li>Pueden conservar condolencias y recuerdos.</li>
                  <li>Permite participar a personas que no pueden asistir.</li>
                  <li>El acceso es sencillo desde móvil u ordenador.</li>
                  <li>La experiencia es clara, respetuosa y fácil de usar.</li>
                </ul>
              </div>
            </div>
          </section>

          <section
            style={{
              padding: "12px 0 46px",
            }}
          >
            <div style={sectionHeaderStyle}>
              <div style={eyebrowStyle}>Presentación</div>

              <h2 style={sectionTitleStyle}>
                Descubre cómo funciona E-Dep
              </h2>

              <p style={sectionTextStyle}>
                Una breve presentación visual del servicio y de la experiencia
                que ofrece a funerarias y familias.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: 420,
                  borderRadius: 28,
                  overflow: "hidden",
                  boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
                  background: "#000",
                }}
              >
                <iframe
                  width="100%"
                  height="720"
                  src="https://www.youtube.com/embed/t0QIs9xg9Ek"
                  title="Presentación E-Dep"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    display: "block",
                    border: "none",
                  }}
                />
              </div>
            </div>
          </section>

          <section
            style={{
              margin: "46px 0 36px",
              padding: 32,
              borderRadius: 30,
              background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
              color: "white",
              textAlign: "center",
              boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#cbd5e1",
                marginBottom: 12,
              }}
            >
              Solicita una demo
            </div>

            <h2
              style={{
                margin: "0 auto",
                maxWidth: 720,
                fontSize: isMobile ? 28 : 34,
                lineHeight: 1.15,
                letterSpacing: "-0.03em",
              }}
            >
              Digitaliza las condolencias de tu funeraria con una solución
              sencilla, elegante y lista para usar
            </h2>

            <p
              style={{
                margin: "16px auto 24px",
                maxWidth: 680,
                color: "#e2e8f0",
                lineHeight: 1.7,
              }}
            >
              E-Dep está pensado para que puedas ofrecer un servicio más humano,
              moderno y útil desde el primer día.
            </p>

            <button
             onClick={() => {
  window.location.href = "/demo-login";
}}
              style={{
                border: "none",
                borderRadius: 16,
                padding: "15px 22px",
                background: "white",
                color: "#0f172a",
                fontWeight: 900,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              Ver demo de E-Dep
            </button>
          </section>
        </div>
      </div>

      <Footer />
          
    </>
  );
}

 return (
  <>
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f8fafc 0%, #eef2f7 55%, #e8edf5 100%)",
        padding: isMobile ? 16 : 24,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 460,
          background: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(255,255,255,0.75)",
          borderRadius: 28,
          boxShadow: "0 24px 60px rgba(15,23,42,0.12)",
          padding: 28,
        }}
      >

{showInstall && (
  <div
    style={{
      marginBottom: 16,
      padding: "12px 14px",
      borderRadius: 14,
      background: "rgba(15,23,42,0.06)",
      border: "1px solid rgba(15,23,42,0.15)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
    }}
  >
    <div style={{ fontSize: 13, fontWeight: 600 }}>
      Instala E-Dep para acceso rápido
    </div>

    <button
      onClick={handleInstallClick}
      style={{
        padding: "8px 12px",
        borderRadius: 10,
        border: "none",
        background: "#0f172a",
        color: "white",
        fontWeight: 700,
        fontSize: 12,
        cursor: "pointer",
      }}
    >
      {isIOS ? "Cómo instalar" : "Instalar"}
    </button>
  </div>
)}

<button
  type="button"
  onClick={() => {
    setEntryView("chooser");
    setMsg("");
  }}
style={{
  position: "absolute",
  top: 16,
  right: 16,
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
    display: "flex",
    justifyContent: "center",
    marginBottom: 12,
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
          {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </h1>

        <p
          style={{
            marginTop: 10,
            marginBottom: 22,
            color: "#475569",
            lineHeight: 1.6,
            fontSize: 14,
          }}
        >
          {mode === "login"
  ? "Accede a tu panel de funeraria."
  : "Registra tu funeraria para empezar a usar E-Dep."}
        </p>

        {mode === "register" ? (
  <>
    <label style={labelStyle}>Nombre de la funeraria</label>
    <input
      style={inputStyle}
      value={funeralHomeName}
      onChange={(e) => setFuneralHomeName(e.target.value)}
      placeholder="Ejemplo: Funeraria García"
    />

    <label style={labelStyle}>Dirección</label>
    <input
      style={inputStyle}
      value={address}
      onChange={(e) => setAddress(e.target.value)}
      placeholder="Calle, número..."
    />

    <label style={labelStyle}>Ciudad</label>
    <input
      style={inputStyle}
      value={city}
      onChange={(e) => setCity(e.target.value)}
      placeholder="Ciudad"
    />

    <label style={labelStyle}>Código postal</label>
    <input
      style={inputStyle}
      value={postalCode}
      onChange={(e) => setPostalCode(e.target.value)}
      placeholder="Código postal"
    />

    <label style={labelStyle}>Teléfono</label>
    <input
      style={inputStyle}
      value={phone}
      onChange={(e) => setPhone(e.target.value)}
      placeholder="Teléfono"
    />

    <label style={labelStyle}>Email de contacto</label>
 <input
      style={inputStyle}
      value={contactEmail}
      onChange={(e) => setContactEmail(e.target.value)}
      placeholder="contacto@funeraria.com"
      type="email"
    />

<label style={labelStyle}>País</label>
<select
  style={inputStyle}
  value={country}
  onChange={(e) => setCountry(e.target.value)}
  required
>
  <option value="">Selecciona un país</option>
  <option value="España">España</option>
  <option value="Argentina">Argentina</option>
  <option value="Chile">Chile</option>
  <option value="Colombia">Colombia</option>
  <option value="México">México</option>
</select>

  </>
) : null}

        <label style={labelStyle}>Email de acceso</label>
        <input
          style={inputStyle}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@funeraria.com"
          type="email"
        />

        <label style={labelStyle}>Contraseña</label>
        <input
          style={inputStyle}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="********"
        />

        {mode === "login" ? (
  <button
    type="button"
    onClick={forgotPassword}
    style={{
      marginTop: 10,
      background: "none",
      border: "none",
      padding: 0,
      color: "#334155",
      textDecoration: "underline",
      cursor: "pointer",
      fontSize: 14,
      fontWeight: 600,
    }}
  >
    ¿Olvidaste la contraseña?
  </button>
) : null}

        <button
          onClick={mode === "login" ? signIn : signUp}
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 18,
            border: "none",
            borderRadius: 16,
            padding: "15px 18px",
            background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
            color: "white",
            fontWeight: 700,
            fontSize: 15,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading
            ? mode === "login"
              ? "Entrando..."
              : "Creando cuenta..."
            : mode === "login"
            ? "Entrar"
            : "Crear cuenta"}
        </button>

        <button
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setMsg("");
          }}
          style={{
            width: "100%",
            marginTop: 12,
            border: "1px solid #dbe3ee",
            borderRadius: 16,
            padding: "13px 18px",
            background: "white",
            color: "#0f172a",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          {mode === "login"
            ? "Crear nueva cuenta de funeraria"
            : "Ya tengo cuenta, quiero entrar"}
        </button>

        {msg ? (
          <div
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 16,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              color: "#334155",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {msg}
          </div>
        ) : null}
     </div>
     </div>
     <Footer />
  </> 
  );
}

const isMobile =
  typeof window !== "undefined" && window.innerWidth < 700;
 
const pillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  padding: "8px 11px",
  background: "rgba(15,23,42,0.06)",
  color: "#334155",
  fontSize: 13,
  fontWeight: 800,
};

const mockupWrapperStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
};

const phoneMockupStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: isMobile ? 290 : 330,
  borderRadius: 34,
  background: "#f8fafc",
  border: "10px solid #0f172a",
  overflow: "hidden",
  boxShadow: "0 28px 70px rgba(15,23,42,0.24)",
};

const phoneTopBarStyle: React.CSSProperties = {
  width: 72,
  height: 6,
  borderRadius: 999,
  background: "#334155",
  margin: "12px auto 0",
};

const condolencePreviewStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 12,
  marginTop: 10,
  color: "#334155",
  fontSize: 13,
  lineHeight: 1.45,
};

const sectionHeaderStyle: React.CSSProperties = {
  maxWidth: 760,
  margin: "0 auto 24px",
  textAlign: "center",
};

const eyebrowStyle: React.CSSProperties = {
  display: "inline-flex",
  padding: "7px 11px",
  borderRadius: 999,
  background: "rgba(15,23,42,0.06)",
  color: "#334155",
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  marginBottom: 12,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: isMobile ? 28 : 34,
  lineHeight: 1.15,
  letterSpacing: "-0.035em",
  fontWeight: 900,
};

const sectionTextStyle: React.CSSProperties = {
  margin: "14px auto 0",
  maxWidth: 700,
  color: "#64748b",
  fontSize: 16,
  lineHeight: 1.7,
};

const cardsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 18,
};

const infoCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(226,232,240,0.9)",
  borderRadius: 24,
  padding: 22,
  boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
};

const stepCardStyle: React.CSSProperties = {
  ...infoCardStyle,
  position: "relative",
};

const cardIconStyle: React.CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: 16,
  background: "rgba(15,23,42,0.06)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 22,
  marginBottom: 16,
};

const stepNumberStyle: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 999,
  background: "#0f172a",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 900,
  marginBottom: 16,
};

const cardTitleStyle: React.CSSProperties = {
  margin: "0 0 8px",
  color: "#0f172a",
  fontSize: 18,
  fontWeight: 900,
};

const cardTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#64748b",
  fontSize: 14,
  lineHeight: 1.65,
};

const twoColumnsStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 18,
};

const featurePanelStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.94)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 26,
  padding: 26,
  boxShadow: "0 18px 44px rgba(15,23,42,0.09)",
};

const panelTitleStyle: React.CSSProperties = {
  margin: "0 0 16px",
  color: "#0f172a",
  fontSize: 22,
  fontWeight: 900,
};

const benefitListStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  color: "#475569",
  lineHeight: 1.9,
  fontSize: 15,
};

const topLinkStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  color: "#334155",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 800,
};

const primaryButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 16,
  padding: "15px 20px",
  background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
  color: "white",
  fontWeight: 800,
  fontSize: 15,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #dbe3ee",
  borderRadius: 16,
  padding: "14px 20px",
  background: "white",
  color: "#0f172a",
  fontWeight: 800,
  fontSize: 15,
  cursor: "pointer",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 8,
  marginTop: 14,
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