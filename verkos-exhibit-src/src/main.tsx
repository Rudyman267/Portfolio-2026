import App from './App';
import './index.scss';
import { createRoot } from 'react-dom/client';

/**
 * Permanent cleanup for stale Service Workers from previous deployments
 * (e.g. old `/verkos-reports/` Cloudflare-proxied build).
 *
 * A leftover SW can intercept requests, serve cached `index.html` referencing
 * deleted hashed bundles, and produce a white screen. Unregister all SWs and
 * purge their caches on every load. This is safe: the app does not register
 * any Service Worker itself.
 */
async function purgeStaleServiceWorkers() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (registrations.length === 0) return;

    await Promise.all(registrations.map((r) => r.unregister().catch(() => false)));

    if (typeof caches !== 'undefined') {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
    }

    // One-shot reload so the next request bypasses the killed SW entirely.
    const FLAG = '__sw_purged__';
    if (!sessionStorage.getItem(FLAG)) {
      sessionStorage.setItem(FLAG, '1');
      window.location.reload();
    }
  } catch (err) {
    console.warn('[sw-purge] failed:', err);
  }
}

purgeStaleServiceWorkers();

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
