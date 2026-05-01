'use client';

import { useEffect, useState } from 'react';

export default function FinalPage() {
  const [ua, setUa] = useState('');
  const [stillInInstagram, setStillInInstagram] = useState(false);

  useEffect(() => {
    const currentUa = navigator.userAgent;
    setUa(currentUa);
    setStillInInstagram(currentUa.includes('Instagram'));
  }, []);

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        background: '#f8fafc',
      }}
    >
      <div
        style={{
          maxWidth: '680px',
          margin: '0 auto',
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '16px',
        }}
      >
        <h1 style={{ marginTop: 0 }}>Final Page</h1>
        <p>
          <strong>Inside Instagram browser:</strong> {stillInInstagram ? 'Yes' : 'No'}
        </p>
        <p>
          <strong>Current user agent:</strong>
        </p>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            background: '#f1f5f9',
            padding: '10px',
            borderRadius: '8px',
            marginTop: 0,
          }}
        >
          {ua || 'Loading...'}
        </pre>
      </div>
    </main>
  );
}
