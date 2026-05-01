'use client';

import { useEffect, useMemo, useState } from 'react';
import { attachEventLogging, buildDebugReport, clearLogs, copyReport, detectEnvironment, downloadReport, queryObject, readLogs, writeLog } from '../debugUtils';

export default function OpenPage() {
  const [env, setEnv] = useState({});
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('Starting automatic redirect sequence...');
  const [attemptId] = useState(() => Math.random().toString(36).slice(2, 10));

  const finalBase = useMemo(() => (typeof window === 'undefined' ? '/final' : `${window.location.origin}/final`), []);

  const buildTarget = (method, mode = 'x-safari', from = 'open') => {
    const e = detectEnvironment();
    const finalUrl = new URL(finalBase);
    finalUrl.searchParams.set('method', method);
    finalUrl.searchParams.set('from', from);
    finalUrl.searchParams.set('attemptId', attemptId);
    finalUrl.searchParams.set('t', String(Date.now()));
    finalUrl.searchParams.set('uaIg', String(Boolean(e?.detected?.instagram)));
    finalUrl.searchParams.set('ios', String(Boolean(e?.detected?.ios)));
    return mode === 'x-safari' ? `x-safari-https://${finalUrl.href.replace(/^https?:\/\//, '')}` : finalUrl.href;
  };

  const redirectAttempt = (method, behavior = 'href', mode = 'x-safari') => {
    const url = buildTarget(method, mode);
    writeLog({ type: 'redirect_attempt', method, behavior, mode, url, userActivation: navigator.userActivation ? { hasBeenActive: navigator.userActivation.hasBeenActive, isActive: navigator.userActivation.isActive } : null });
    if (behavior === 'replace') window.location.replace(url);
    else if (behavior === 'anchor') {
      const a = document.createElement('a'); a.href = url; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
    } else if (behavior === 'open') window.open(url, '_blank');
    else if (behavior === 'delayed') setTimeout(() => { window.location.href = url; }, 250);
    else window.location.href = url;
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

  return (<main style={{minHeight:'100vh',padding:20,fontFamily:'system-ui',background:'#f8fafc'}}>
    <div style={{maxWidth:760,margin:'0 auto',background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:16}}>
      <h1>/open diagnostics</h1><p>{status}</p>
      <p><strong>attemptId:</strong> {attemptId}</p>
      <div style={{display:'grid',gap:8}}>
        <button onClick={() => redirectAttempt('button','href','x-safari')} style={{minHeight:52,fontSize:18}}>Try x-safari redirect</button>
        <button onClick={() => redirectAttempt('normal','href','https')} style={{minHeight:52,fontSize:18}}>Try normal https redirect</button>
        <button onClick={() => redirectAttempt('button','replace','x-safari')} style={{minHeight:52,fontSize:18}}>Try location.replace x-safari</button>
        <button onClick={() => redirectAttempt('button','anchor','x-safari')} style={{minHeight:52,fontSize:18}}>Try anchor click x-safari</button>
        <button onClick={() => redirectAttempt('button','open','x-safari')} style={{minHeight:52,fontSize:18}}>Try window.open x-safari</button>
        <button onClick={() => redirectAttempt('tap','delayed','x-safari')} style={{minHeight:52,fontSize:18}}>Try delayed redirect after tap</button>
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
