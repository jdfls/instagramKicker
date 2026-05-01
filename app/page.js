export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          border: '1px solid #ddd',
          borderRadius: '12px',
          padding: '20px',
          background: '#fff',
        }}
      >
        <h1 style={{ marginTop: 0 }}>Instagram Browser Handoff Debug</h1>
        <p style={{ lineHeight: 1.5 }}>
          This test app checks whether Instagram&apos;s in-app browser on iOS can be handed
          off to the external/default browser.
        </p>
        <a
          href="/open"
          style={{
            display: 'inline-block',
            marginTop: '8px',
            padding: '12px 18px',
            borderRadius: '10px',
            textDecoration: 'none',
            background: '#111827',
            color: '#fff',
            fontWeight: 600,
          }}
        >
          Go to /open test
        </a>
      </div>
    </main>
  );
}
