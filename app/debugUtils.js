'use client';

export const DEBUG_STORAGE_KEY = 'ig_debug_logs_v1';

export function detectEnvironment() {
  if (typeof window === 'undefined') return {};
  const ua = navigator.userAgent || '';
  const vendor = navigator.vendor || '';
  const isInstagram = /Instagram/i.test(ua);
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  const isBrave = /Brave/i.test(ua) || (navigator.brave && typeof navigator.brave.isBrave === 'function');
  const isCriOS = /CriOS/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS|Instagram/i.test(ua);
  const isChrome = /Chrome|CriOS/i.test(ua) && !/Edg/i.test(ua);

  return {
    userAgent: ua,
    vendor,
    platform: navigator.platform,
    language: navigator.language,
    languages: navigator.languages,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    referrer: document.referrer,
    visibilityState: document.visibilityState,
    hasFocus: document.hasFocus(),
    historyLength: history.length,
    screen: { width: screen.width, height: screen.height },
    viewport: { width: window.innerWidth, height: window.innerHeight },
    visualViewport: window.visualViewport
      ? {
          width: window.visualViewport.width,
          height: window.visualViewport.height,
          scale: window.visualViewport.scale,
        }
      : null,
    devicePixelRatio: window.devicePixelRatio,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    userActivation: navigator.userActivation
      ? {
          hasBeenActive: navigator.userActivation.hasBeenActive,
          isActive: navigator.userActivation.isActive,
        }
      : null,
    detected: {
      instagram: isInstagram,
      ios: isIos,
      brave: Boolean(isBrave),
      safari: isSafari,
      chromeIos: isCriOS,
      chrome: isChrome,
    },
  };
}

export function readLogs() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(sessionStorage.getItem(DEBUG_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function writeLog(entry) {
  if (typeof window === 'undefined') return;
  const current = readLogs();
  current.push({ ...entry, ts: Date.now() });
  sessionStorage.setItem(DEBUG_STORAGE_KEY, JSON.stringify(current));
}

export function clearLogs() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(DEBUG_STORAGE_KEY);
}

export function queryObject() {
  if (typeof window === 'undefined') return {};
  const out = {};
  new URLSearchParams(window.location.search).forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

export function buildDebugReport(extra = {}) {
  if (typeof window === 'undefined') {
    return {
      page: null,
      url: null,
      query: {},
      env: {},
      logs: [],
      timing: {
        now: Date.now(),
        performanceNow: null,
      },
      ...extra,
    };
  }
  const env = detectEnvironment();
  return {
    page: window.location.pathname,
    url: window.location.href,
    query: queryObject(),
    env,
    logs: readLogs(),
    timing: {
      now: Date.now(),
      performanceNow: typeof performance !== 'undefined' ? performance.now() : null,
    },
    ...extra,
  };
}

export function downloadReport(report, name = 'ig-debug-report.json') {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyReport(report) {
  const text = JSON.stringify(report, null, 2);
  await navigator.clipboard.writeText(text);
}

export function attachEventLogging() {
  const eventTypes = [
    'visibilitychange','pagehide','pageshow','beforeunload','unload','focus','blur','popstate','hashchange','resize','orientationchange','pointerdown','touchstart','click',
  ];

  const listeners = eventTypes.map((type) => {
    const target = type === 'visibilitychange' ? document : window;
    const handler = () => writeLog({ type: 'event', event: type });
    target.addEventListener(type, handler);
    return { target, type, handler };
  });

  if (window.visualViewport) {
    const vvResize = () => writeLog({ type: 'event', event: 'visualViewport.resize' });
    const vvScroll = () => writeLog({ type: 'event', event: 'visualViewport.scroll' });
    window.visualViewport.addEventListener('resize', vvResize);
    window.visualViewport.addEventListener('scroll', vvScroll);
    listeners.push({ target: window.visualViewport, type: 'resize', handler: vvResize });
    listeners.push({ target: window.visualViewport, type: 'scroll', handler: vvScroll });
  }

  return () => listeners.forEach(({ target, type, handler }) => target.removeEventListener(type, handler));
}
