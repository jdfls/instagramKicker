'use client';

import { useEffect, useMemo, useState } from 'react';

export default function OpenPage() {
  const [ua, setUa] = useState('');
  const [isInstagram, setIsInstagram] = useState(false);
  const [isIos, setIsIos] = useState(false);

  const finalUrl = useMemo(() => {
    if (typeof window === 'undefined') return '/final';
    return `${window.location.origin}/final`;
  }, []);

  const attemptSafariHandoff = () => {
    const finalUrlWithoutProtocol = finalUrl.replace(/^https?:\/\//, '');

    // Instagram in-app browser on iOS may honor the x-safari-https scheme,
    // which can hand off to Safari (or the default external browser setup).
    window.location.href = `x-safari-https://${finalUrlWithoutProtocol}`;
  };

  useEffect(() => {
    const currentUa = navigator.userAgent;
    const instagramDetected = navigator.userAgent.includes('Instagram');
    const iosDetected = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    setUa(currentUa);
    setIsInstagram(instagramDetected);
    setIsIos(iosDetected);

    if (instagramDetected && iosDetected) {
      // Delay slightly so the page can paint debug information
      // before attempting the handoff.
      const timer = setTimeout(() => {
        attemptSafariHandoff();
      }, 300);
      return () => clearTimeout(timer);
    }

    // If this is not Instagram on iOS, do a normal same-origin redirect.
    window.location.href = finalUrl;
  }, [finalUrl]);

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
        <h1 style={{ marginTop: 0 }}>Open Page</h1>
        <p>Debug info is shown below before redirect attempts.</p>

        <div style={{ fontSize: '14px', lineHeight: 1.6 }}>
          <p>
            <strong>isInstagram:</strong> {String(isInstagram)}
          </p>
          <p>
            <strong>isIos:</strong> {String(isIos)}
          </p>
          <p>
            <strong>finalUrl:</strong> {finalUrl}
          </p>
          <p>
            <strong>userAgent:</strong>
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

        <button
          onClick={attemptSafariHandoff}
          style={{
            width: '100%',
            marginTop: '12px',
            minHeight: '56px',
            border: 'none',
            borderRadius: '10px',
            background: '#2563eb',
            color: '#fff',
            fontSize: '18px',
            fontWeight: 700,
          }}
        >
          Try opening in external browser
        </button>

        <p style={{ marginTop: '12px' }}>
          If this does not open, tap the three dots in Instagram and choose Open in
          browser.
        </p>
      </div>
    </main>
  );
}
