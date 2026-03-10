'use client';

import { useEffect } from 'react';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const RELOAD_KEY = '__chunk_reload_attempt_ts';
const RELOAD_WINDOW_MS = 5 * 60 * 1000;

function isChunkLoadError(error: Error | null | undefined): boolean {
  const text = String(error?.message || '').toLowerCase();
  return (
    text.includes('chunkloaderror') ||
    text.includes('failed to load chunk') ||
    text.includes('loading chunk') ||
    text.includes('dynamically imported module')
  );
}

function trySingleAutoReload(): boolean {
  if (typeof window === 'undefined') return false;

  const now = Date.now();
  const previous = Number(sessionStorage.getItem(RELOAD_KEY) || '0');
  const recentlyRetried = Number.isFinite(previous) && now - previous < RELOAD_WINDOW_MS;

  if (recentlyRetried) {
    return false;
  }

  sessionStorage.setItem(RELOAD_KEY, String(now));

  const url = new URL(window.location.href);
  url.searchParams.set('__r', String(now));
  window.location.replace(url.toString());
  return true;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    if (isChunkLoadError(error)) {
      trySingleAutoReload();
    }
  }, [error]);

  return (
    <html lang="ar">
      <body>
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', padding: 16 }}>
          <div
            style={{
              width: '100%',
              maxWidth: 560,
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: 20,
              boxShadow: '0 10px 24px rgba(2, 8, 23, 0.08)',
              direction: 'rtl',
            }}
          >
            <h2 style={{ margin: 0, marginBottom: 10, fontSize: 24, color: '#0f172a' }}>حدث خطأ أثناء تحميل الصفحة</h2>
            <p style={{ margin: 0, marginBottom: 14, color: '#475569', fontSize: 14, lineHeight: 1.7 }}>
              غالبًا هذا بسبب تحديث جديد على السيرفر مع كاش قديم في المتصفح. جرّب إعادة التحميل.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                onClick={reset}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: 10,
                  background: '#fff',
                  color: '#334155',
                  padding: '9px 14px',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                محاولة مرة أخرى
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  border: 0,
                  borderRadius: 10,
                  background: '#0f766e',
                  color: '#fff',
                  padding: '9px 14px',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                إعادة تحميل
              </button>
            </div>
            {process.env.NODE_ENV !== 'production' && (
              <pre
                style={{
                  marginTop: 14,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: 10,
                  whiteSpace: 'pre-wrap',
                  direction: 'ltr',
                  textAlign: 'left',
                  fontSize: 12,
                  color: '#991b1b',
                }}
              >
                {error?.message}
              </pre>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}

