import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      style={{
        marginTop: 48,
        background: "#0f172a",
        color: "rgba(255,255,255,0.9)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "28px 20px 24px 20px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 24,
            alignItems: "start",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                marginBottom: 10,
                color: "#fff",
              }}
            >
              E-Dep
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.72)",
              }}
            >
              Plataforma de páginas de condolencias digitales para funerarias y
              particulares.
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                marginBottom: 10,
                color: "#fff",
              }}
            >
              Enlaces legales
            </div>

            <div
              style={{
                display: "grid",
                gap: 8,
                fontSize: 14,
              }}
            >
              <Link style={linkStyle} to="/aviso-legal">
                Aviso legal
              </Link>
              <Link style={linkStyle} to="/privacidad">
                Política de privacidad
              </Link>
              <Link style={linkStyle} to="/cookies">
                Política de cookies
              </Link>
              <Link style={linkStyle} to="/condiciones">
                Términos y condiciones
              </Link>
              <Link style={linkStyle} to="/contacto">
                Contacto
              </Link>
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                marginBottom: 10,
                color: "#fff",
              }}
            >
              Titular
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.8,
                color: "rgba(255,255,255,0.72)",
              }}
            >
              Carlos Escrivá Masip
              <br />
              NIF: 20820547G
              <br />
              C/ Cronista Carreres 5
              <br />
              46003 - Valencia - España
              <br />
              <a href="mailto:Carlosescriva@e-dep.org" style={linkStyle}>
                Carlosescriva@e-dep.org
              </a>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 24,
            paddingTop: 18,
            borderTop: "1px solid rgba(255,255,255,0.10)",
            fontSize: 13,
            color: "rgba(255,255,255,0.58)",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span>© {new Date().getFullYear()} E-Dep. Todos los derechos reservados.</span>
          <span>Hecho en Valencia</span>
        </div>
      </div>
    </footer>
  );
}

const linkStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.82)",
  textDecoration: "none",
};