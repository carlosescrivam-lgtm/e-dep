import { useState, useEffect } from "react";
import { supabase } from "./lib/supabaseClient";

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
    position: "absolute",
    top: 16,
    right: 16,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 6,
  }}
>
  <button
    type="button"
    onClick={() => {
      window.location.href = "/admin-login";
    }}
    style={{
      background: "none",
      border: "none",
      padding: 0,
      color: "#334155",
      cursor: "pointer",
      fontSize: 13,
      fontWeight: 700,
    }}
  >
    Acceso admin
  </button>

  <button
    type="button"
    onClick={() => {
      window.location.href = "/demo-login";
    }}
    style={{
      background: "none",
      border: "none",
      padding: 0,
      color: "#334155",
      cursor: "pointer",
      fontSize: 13,
      fontWeight: 700,
    }}
  >
    Acceso demo
  </button>
</div>

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

        <div
          style={{
            display: "inline-flex",
            padding: "8px 12px",
            borderRadius: 999,
            background: "#e2e8f0",
            color: "#0f172a",
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 14,
          }}
        >
          E-Dep
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
          Bienvenido a E-Dep
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
          Elige cómo quieres acceder o busca directamente una página de condolencias.
        </p>

        <button
          onClick={() => {
            setEntryView("funeral");
            setMsg("");
          }}
          style={{
            width: "100%",
            border: "none",
            borderRadius: 16,
            padding: "15px 18px",
            background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
            color: "white",
            fontWeight: 700,
            fontSize: 15,
            cursor: "pointer",
            marginBottom: 12,
          }}
        >
          Soy empresa funeraria
        </button>

        <button
          onClick={() => {
            window.location.href = "/particular";
          }}
          style={{
            width: "100%",
            border: "1px solid #dbe3ee",
            borderRadius: 16,
            padding: "13px 18px",
            background: "white",
            color: "#0f172a",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            marginBottom: 28,
          }}
        >
          Soy particular
        </button>

        <div style={{ marginTop: 10 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            Buscar página de condolencias
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              maxWidth: 420,
              margin: "0 auto",
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

          <div style={{ marginTop: 18, maxWidth: 420, marginInline: "auto" }}>
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
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
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
      </div>
    </div>
  );
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
            display: "inline-flex",
            padding: "8px 12px",
            borderRadius: 999,
            background: "#e2e8f0",
            color: "#0f172a",
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 14,
          }}
        >
          E-Dep · Acceso funerarias
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
  );
}



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