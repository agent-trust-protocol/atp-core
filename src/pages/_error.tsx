// Custom error page - no imports needed
function Error({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '4rem', color: statusCode === 404 ? '#6c757d' : '#dc3545' }}>
          {statusCode || 'Error'}
        </h1>
        <p style={{ color: '#6c757d' }}>
          {statusCode === 404 ? 'Page not found' : 'An error occurred'}
        </p>
        <a href="/" style={{
          display: 'inline-block',
          padding: '0.5rem 1rem',
          backgroundColor: '#0d6efd',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px'
        }}>Go Home</a>
      </div>
    </div>
  )
}

Error.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error
