/**
 * EXHIBIT SHIM — shared placeholder for the auth screens.
 * Guards always pass in the exhibit, so these are unreachable in practice;
 * they exist so the auth routes still compile.
 */
import React from 'react';

export default function AuthNotice({ title = 'Authentication' }: { title?: string }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#0b0d12',
        color: '#e6e8ee',
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div>
        <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{title}</p>
        <p style={{ fontSize: 13, opacity: 0.6, marginTop: 8 }}>
          Not part of this demo — the exhibit runs signed in.
        </p>
      </div>
    </div>
  );
}
