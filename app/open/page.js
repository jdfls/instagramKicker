'use client';

import { useEffect, useMemo, useState } from 'react';
import { attachEventLogging, buildDebugReport, clearLogs, copyReport, detectEnvironment, downloadReport, queryObject, readLogs, writeLog } from '../debugUtils';

export default function OpenPage() {
  const [env, setEnv] = useState({});
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('Starting automatic redirect sequence...');
  const [attemptId] = useState(() => Math.random().toString(36).slice(2, 10));

  const finalBase = useMemo(() => (typeof window === 'undefined' ? '/final' : `${window.location.origin}/final`), []);

  const buildTargets = (method, mode = 'x-safari', from = 'open') => {
    const e = detectEnvironment();
    const finalUrl = new URL(finalBase, typeof window === 'undefined' ? 'https://debug.local' : window.location.origin);
    finalUrl.searchParams.set('method', method);
    finalUrl.searchParams.set('mode', mode);
    finalUrl.searchParams.set('from', from);
    finalUrl.searchParams.set('attemptId', attemptId);
    finalUrl.searchParams.set('t', String(Date.now()));
    finalUrl.searchParams.set('uaIg', String(Boolean(e?.detected?.instagram)));
    finalUrl.searchParams.set('ios', String(Boolean(e?.detected?.ios)));
    return { finalUrl: finalUrl.href, target: mode === 'x-safari' ? `x-safari-https://${finalUrl.href.replace(/^https?:\/\//, '')}` : finalUrl.href, env: e };
  };

  const persistBeforeNav = () => sessionStorage.setItem('ig_debug_logs_v1', JSON.stringify(readLogs()));

  const redirectAttempt = (method, behavior = 'href', mode = 'x-safari') => {
    const { target, finalUrl, env: e } = buildTargets(method, mode);
    const userActivation = navigator.userActivation ? { hasBeenActive: navigator.userActivation.hasBeenActive, isActive: navigator.userActivation.isActive } : null;
    writeLog({ type: 'redirect_attempt', from: 'open', method, behavior, mode, target, finalUrl, userActivation, uaIg: Boolean(e?.detected?.instagram), ios: Boolean(e?.detected?.ios) });
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
      writeLog({ type: 'iframe_append_result', from: 'open', method, appended: document.body.contains(iframe), target });
      setTimeout(() => iframe.remove(), 1500);
    } else if (behavior === 'delayed') setTimeout(() => { window.location.href = target; }, 250);
    else window.location.href = target;
  };

  const delayedAfterTouch = () => {
    const baseMethod = 'advanced-delayed-after-touch';
    const activationAtDown = navigator.userActivation ? { hasBeenActive: navigator.userActivation.hasBeenActive, isActive: navigator.userActivation.isActive } : null;
    writeLog({ type: 'delayed_touch_start', from: 'open', method: baseMethod, activationAtDown });
    [50, 100, 300].forEach((delayMs) => {
      setTimeout(() => {
        const beforeAttempt = navigator.userActivation ? { hasBeenActive: navigator.userActivation.hasBeenActive, isActive: navigator.userActivation.isActive } : null;
        writeLog({ type: 'delayed_touch_probe', from: 'open', method: `${baseMethod}-${delayMs}ms`, delayMs, userActivation: beforeAttempt });
        redirectAttempt(`${baseMethod}-${delayMs}ms`, 'href', 'x-safari');
      }, delayMs);
    });
  };

  useEffect(() => {
    const teardown = attachEventLogging();
    writeLog({ type: 'page_loaded', page: '/open' });
    const snapshot = detectEnvironment();
    setEnv(snapshot);
    writeLog({ type: 'env', env: snapshot });

    const timers = [];
    const schedule = (ms, fn) => timers.push(setTimeout(fn, ms));

    schedule(0, () => redirectAttempt('auto-0'));
    schedule(100, () => { writeLog({ type: 'auto_check', note: 'auto-0 did not leave by 100ms' }); redirectAttempt('auto-100'); });
    schedule(300, () => { writeLog({ type: 'auto_check', note: 'auto-100 did not leave by 300ms' }); redirectAttempt('auto-300'); });
    schedule(800, () => { writeLog({ type: 'auto_check', note: 'auto-300 did not leave by 800ms' }); redirectAttempt('auto-800'); });
    schedule(1500, () => { writeLog({ type: 'auto_check', note: 'auto-800 did not leave by 1500ms' }); setStatus('Automatic redirect likely failed/was blocked'); setLogs(readLogs()); });

    const poll = setInterval(() => setLogs(readLogs()), 300);
    return () => { teardown(); timers.forEach(clearTimeout); clearInterval(poll); };
  }, []);

  const report = buildDebugReport({ pageRole: 'open', status, env, query: queryObject() });
  const { target: realAnchorHref } = buildTargets('advanced-direct-anchor', 'x-safari', 'open');

  return (<main style={{minHeight:'100vh',padding:20,fontFamily:'system-ui',background:'#f8fafc'}}>
    <div style={{maxWidth:760,margin:'0 auto',background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:16}}>
      <h1>/open diagnostics</h1><p>{status}</p>
      <p><strong>attemptId:</strong> {attemptId}</p>
      <div style={{display:'grid',gap:8}}>
        <button onClick={() => redirectAttempt('button','href','x-safari')} style={{minHeight:52,fontSize:18}}>Try x-safari redirect</button>
        <button onClick={() => redirectAttempt('normal','href','https')} style={{minHeight:52,fontSize:18}}>Try normal https redirect</button>
        <button onClick={() => redirectAttempt('button','replace','x-safari')} style={{minHeight:52,fontSize:18}}>Try location.replace x-safari</button>
        <button onClick={() => redirectAttempt('button','hidden-anchor','x-safari')} style={{minHeight:52,fontSize:18}}>Try anchor click x-safari</button>
        <button onClick={() => redirectAttempt('button','open-self','x-safari')} style={{minHeight:52,fontSize:18}}>Try window.open x-safari</button>
        <button onClick={() => redirectAttempt('tap','delayed','x-safari')} style={{minHeight:52,fontSize:18}}>Try delayed redirect after tap</button>
      </div>

      <h2 style={{marginTop:20}}>Advanced scheme tests</h2>
      <div style={{display:'grid',gap:8}}>
        <button onClick={() => redirectAttempt('advanced-href-x-safari', 'href', 'x-safari')}>1) location.href x-safari</button>
        <button onClick={() => redirectAttempt('advanced-assign-x-safari', 'assign', 'x-safari')}>2) location.assign x-safari</button>
        <button onClick={() => redirectAttempt('advanced-replace-x-safari', 'replace', 'x-safari')}>3) location.replace x-safari</button>
        <button onClick={() => redirectAttempt('advanced-hidden-anchor-x-safari', 'hidden-anchor', 'x-safari')}>4) hidden anchor click x-safari</button>
        <a href={realAnchorHref} style={{display:'inline-block',padding:'10px 12px',background:'#eef6ff',border:'1px solid #93c5fd',borderRadius:8}}>5) Open via real anchor</a>
        <button onClick={() => redirectAttempt('advanced-form-get-https', 'form-get', 'https')}>6) form submit GET https (control)</button>
        <button onClick={() => redirectAttempt('advanced-window-open-self-x-safari', 'open-self', 'x-safari')}>7) window.open _self x-safari</button>
        <button onClick={() => redirectAttempt('advanced-window-open-self-https', 'open-self', 'https')}>8) window.open _self https (control)</button>
        <button onClick={() => redirectAttempt('advanced-iframe-x-safari', 'iframe', 'x-safari')}>9) iframe attempt x-safari</button>
        <button onPointerDown={delayedAfterTouch}>10) delayed-after-touch x-safari probes</button>
      </div>

      <p><a href="/tap">Go to /tap for gesture-only testing</a></p>
      <div style={{display:'flex',gap:8,margin:'12px 0'}}>
        <button onClick={() => copyReport(report)}>Copy Debug Report</button>
        <button onClick={() => downloadReport(report, 'open-debug.json')}>Download Debug JSON</button>
        <button onClick={() => { clearLogs(); setLogs([]); }}>Clear Debug Logs</button>
      </div>
      <pre style={{whiteSpace:'pre-wrap',background:'#f1f5f9',padding:10,borderRadius:8}}>{JSON.stringify(env,null,2)}</pre>
      <h3>Session logs</h3>
      <pre style={{whiteSpace:'pre-wrap',background:'#f8fafc',padding:10,borderRadius:8,maxHeight:260,overflow:'auto'}}>{JSON.stringify(logs,null,2)}</pre>
    </div>
  </main>);
}
