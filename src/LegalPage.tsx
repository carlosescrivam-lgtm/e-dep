type LegalPageProps = {
  title: string;
  children: React.ReactNode;
};

export default function LegalPage({ title, children }: LegalPageProps) {
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
      <div
        style={{
          maxWidth: 880,
          margin: "0 auto",
          background: "rgba(255,255,255,0.94)",
          border: "1px solid rgba(255,255,255,0.75)",
          borderRadius: 28,
          boxShadow: "0 24px 60px rgba(15,23,42,0.10)",
          padding: 32,
        }}
      >
        <h1
          style={{
            marginTop: 0,
            marginBottom: 24,
            fontSize: 34,
            lineHeight: 1.1,
            fontWeight: 800,
            letterSpacing: "-0.03em",
          }}
        >
          {title}
        </h1>

        <div
          style={{
            fontSize: 15,
            lineHeight: 1.8,
            color: "#334155",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}