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

  const go = (method, mode = 'x-safari') => {
    const env = detectEnvironment();
    const u = new URL(finalBase);
    u.searchParams.set('method', method);
    u.searchParams.set('from', 'tap');
    u.searchParams.set('attemptId', attemptId);
    u.searchParams.set('t', String(Date.now()));
    u.searchParams.set('uaIg', String(Boolean(env?.detected?.instagram)));
    u.searchParams.set('ios', String(Boolean(env?.detected?.ios)));
    const target = mode === 'x-safari' ? `x-safari-https://${u.href.replace(/^https?:\/\//, '')}` : u.href;
    writeLog({ type: 'tap_redirect', method, mode, target });
    window.location.href = target;
  };

  const report = buildDebugReport({ pageRole: 'tap' });
  return <main style={{padding:20}}><h1>/tap (user gesture only)</h1>
    <button onClick={() => go('tap','x-safari')}>Tap → x-safari</button>
    <button onClick={() => go('normal','https')} style={{marginLeft:8}}>Tap → normal https</button>
    <div style={{display:'flex',gap:8,margin:'12px 0'}}>
      <button onClick={() => copyReport(report)}>Copy Debug Report</button>
      <button onClick={() => downloadReport(report, 'tap-debug.json')}>Download Debug JSON</button>
      <button onClick={() => { clearLogs(); setLogs([]); }}>Clear Debug Logs</button>
    </div>
    <pre>{JSON.stringify(logs,null,2)}</pre>
  </main>;
}
