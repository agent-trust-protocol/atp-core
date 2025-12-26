// Explicit 404 page - prerendered at build time
export default function Custom404() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f8f9fa',
      padding: '1rem',
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}>
        <h1 style={{ fontSize: '4rem', color: '#6c757d', marginBottom: '0.5rem' }}>
          404
        </h1>
        <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
          Page not found
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            padding: '0.5rem 1rem',
            backgroundColor: '#0d6efd',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
          }}
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
