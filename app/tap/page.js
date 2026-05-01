'use client';

import { useMemo, useState, useEffect } from 'react';
import { attachEventLogging, buildDebugReport, clearLogs, copyReport, detectEnvironment, downloadReport, readLogs, writeLog } from '../debugUtils';

export default function TapPage() {
  const [logs, setLogs] = useState([]);
  const [attemptId] = useState(() => Math.random().toString(36).slice(2, 10));
  const finalBase = useMemo(() => (typeof window === 'undefined' ? '/final' : `${window.location.origin}/final`), []);

  useEffect(() => {
    const off = attachEventLogging();
    writeLog({ type: 'page_loaded', page: '/tap' });
    writeLog({ type: 'env', env: detectEnvironment() });
    const poll = setInterval(() => setLogs(readLogs()), 300);
    return () => { off(); clearInterval(poll); };
  }, []);

  const buildTargets = (method, mode = 'x-safari') => {
    const env = detectEnvironment();
    const u = new URL(finalBase, typeof window === 'undefined' ? 'https://debug.local' : window.location.origin);
    u.searchParams.set('method', method);
    u.searchParams.set('mode', mode);
    u.searchParams.set('from', 'tap');
    u.searchParams.set('attemptId', attemptId);
    u.searchParams.set('t', String(Date.now()));
    u.searchParams.set('uaIg', String(Boolean(env?.detected?.instagram)));
    u.searchParams.set('ios', String(Boolean(env?.detected?.ios)));
    return {
      finalUrl: u.href,
      target: mode === 'x-safari' ? `x-safari-https://${u.href.replace(/^https?:\/\//, '')}` : u.href,
      env,
    };
  };

  const persistBeforeNav = () => {
    const snapshot = readLogs();
    sessionStorage.setItem('ig_debug_logs_v1', JSON.stringify(snapshot));
  };

  const runStrategy = (method, behavior = 'href', mode = 'x-safari') => {
    const { target, finalUrl, env } = buildTargets(method, mode);
    const userActivation = navigator.userActivation ? { hasBeenActive: navigator.userActivation.hasBeenActive, isActive: navigator.userActivation.isActive } : null;
    writeLog({ type: 'advanced_redirect_attempt', from: 'tap', method, behavior, mode, target, finalUrl, userActivation, uaIg: Boolean(env?.detected?.instagram), ios: Boolean(env?.detected?.ios) });
    persistBeforeNav();

    if (behavior === 'assign') window.location.assign(target);
    else if (behavior === 'replace') window.location.replace(target);
    else if (behavior === 'hidden-anchor') {
      const a = document.createElement('a');
      a.href = target;
      a.rel = 'noopener';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else if (behavior === 'form-get') {
      const form = document.createElement('form');
      form.method = 'GET';
      form.action = finalUrl;
      form.style.display = 'none';
      document.body.appendChild(form);
      form.submit();
      form.remove();
    } else if (behavior === 'open-self') window.open(target, '_self');
    else if (behavior === 'iframe') {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = target;
      document.body.appendChild(iframe);
      writeLog({ type: 'iframe_append_result', from: 'tap', method, appended: document.body.contains(iframe), target });
      setTimeout(() => iframe.remove(), 1500);
    } else window.location.href = target;
  };

  const delayedAfterTouch = () => {
    const baseMethod = 'delayed-after-touch';
    const activationAtDown = navigator.userActivation ? { hasBeenActive: navigator.userActivation.hasBeenActive, isActive: navigator.userActivation.isActive } : null;
    writeLog({ type: 'delayed_touch_start', from: 'tap', method: baseMethod, activationAtDown });
    [50, 100, 300].forEach((delayMs) => {
      setTimeout(() => {
        const beforeAttempt = navigator.userActivation ? { hasBeenActive: navigator.userActivation.hasBeenActive, isActive: navigator.userActivation.isActive } : null;
        writeLog({ type: 'delayed_touch_probe', from: 'tap', method: `${baseMethod}-${delayMs}ms`, delayMs, userActivation: beforeAttempt });
        runStrategy(`${baseMethod}-${delayMs}ms`, 'href', 'x-safari');
      }, delayMs);
    });
  };

  const report = buildDebugReport({ pageRole: 'tap' });
  const { target: realAnchorHref } = buildTargets('advanced-direct-anchor', 'x-safari');

  return <main style={{padding:20}}><h1>/tap (user gesture only)</h1>
    <button onClick={() => runStrategy('tap-basic-x-safari','href','x-safari')}>Tap → x-safari</button>
    <button onClick={() => runStrategy('tap-basic-normal','href','https')} style={{marginLeft:8}}>Tap → normal https</button>

    <h2 style={{marginTop:20}}>Advanced scheme tests</h2>
    <div style={{display:'grid',gap:8,maxWidth:540}}>
      <button onClick={() => runStrategy('advanced-href-x-safari', 'href', 'x-safari')}>1) location.href x-safari</button>
      <button onClick={() => runStrategy('advanced-assign-x-safari', 'assign', 'x-safari')}>2) location.assign x-safari</button>
      <button onClick={() => runStrategy('advanced-replace-x-safari', 'replace', 'x-safari')}>3) location.replace x-safari</button>
      <button onClick={() => runStrategy('advanced-hidden-anchor-x-safari', 'hidden-anchor', 'x-safari')}>4) hidden anchor click x-safari</button>
      <a href={realAnchorHref} style={{display:'inline-block',padding:'10px 12px',background:'#eef6ff',border:'1px solid #93c5fd',borderRadius:8}}>5) Open via real anchor</a>
      <button onClick={() => runStrategy('advanced-form-get-https', 'form-get', 'https')}>6) form submit GET https (control)</button>
      <button onClick={() => runStrategy('advanced-window-open-self-x-safari', 'open-self', 'x-safari')}>7) window.open _self x-safari</button>
      <button onClick={() => runStrategy('advanced-window-open-self-https', 'open-self', 'https')}>8) window.open _self https (control)</button>
      <button onClick={() => runStrategy('advanced-iframe-x-safari', 'iframe', 'x-safari')}>9) iframe attempt x-safari</button>
      <button onPointerDown={delayedAfterTouch}>10) delayed-after-touch x-safari probes</button>
    </div>

    <div style={{display:'flex',gap:8,margin:'12px 0'}}>
      <button onClick={() => copyReport(report)}>Copy Debug Report</button>
      <button onClick={() => downloadReport(report, 'tap-debug.json')}>Download Debug JSON</button>
      <button onClick={() => { clearLogs(); setLogs([]); }}>Clear Debug Logs</button>
    </div>
    <pre>{JSON.stringify(logs,null,2)}</pre>
  </main>;
}
