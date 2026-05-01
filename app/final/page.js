'use client';

import { useEffect, useMemo, useState } from 'react';
import { attachEventLogging, buildDebugReport, clearLogs, copyReport, detectEnvironment, downloadReport, queryObject, readLogs, writeLog } from '../debugUtils';

export default function FinalPage() {
  const [env, setEnv] = useState({});
  const [logs, setLogs] = useState([]);
  const params = useMemo(() => (typeof window === 'undefined' ? {} : queryObject()), []);

  useEffect(() => {
    const off = attachEventLogging();
    writeLog({ type: 'page_loaded', page: '/final' });
    const e = detectEnvironment();
    setEnv(e);
    setLogs(readLogs());
    return () => off();
  }, []);

  const method = params.method || 'manual-unknown';
  const start = Number(params.t || 0);
  const elapsed = start ? Date.now() - start : null;
  const browser = env?.detected?.instagram ? 'Instagram WebView' : env?.detected?.brave ? 'Brave' : env?.detected?.safari ? 'Safari' : env?.detected?.chrome || env?.detected?.chromeIos ? 'Chrome' : 'Unknown';
  const externalLikely = env?.detected?.instagram ? 'No' : 'Yes';
  const report = buildDebugReport({ pageRole: 'final', method, elapsedMs: elapsed });

  return <main style={{padding:20,background:'#f8fafc',minHeight:'100vh'}}><div style={{maxWidth:900,margin:'0 auto',background:'#fff',padding:16,borderRadius:12,border:'1px solid #e5e7eb'}}>
    <h1>/final diagnostics</h1>
    <div style={{background:'#eef6ff',padding:12,borderRadius:8}}>
      <p><strong>Inside Instagram browser:</strong> {env?.detected?.instagram ? 'Yes' : 'No'}</p>
      <p><strong>Opened in external browser:</strong> Likely {externalLikely}</p>
      <p><strong>Detected browser:</strong> {browser}</p>
      <p><strong>Method param:</strong> {method}</p>
      <p><strong>Attempt ID:</strong> {params.attemptId || 'n/a'}</p>
      <p><strong>Time from attempt to final load:</strong> {elapsed !== null ? `${elapsed}ms` : 'n/a'}</p>
      {!params.method && <p><strong>Method missing.</strong> This likely means the user manually opened the page externally or navigation did not preserve the test params.</p>}
    </div>
    <div style={{display:'flex',gap:8,margin:'12px 0'}}>
      <button onClick={() => copyReport(report)}>Copy Debug Report</button>
      <button onClick={() => downloadReport(report, 'final-debug.json')}>Download Debug JSON</button>
      <button onClick={() => { clearLogs(); setLogs([]); }}>Clear Debug Logs</button>
    </div>
    <h3>Current URL</h3><pre>{typeof window !== 'undefined' ? window.location.href : ''}</pre>
    <h3>Referrer</h3><pre>{env?.referrer || ''}</pre>
    <h3>User agent</h3><pre>{env?.userAgent || ''}</pre>
    <h3>Query params</h3><pre>{JSON.stringify(params,null,2)}</pre>
    <h3>Environment data</h3><pre>{JSON.stringify(env,null,2)}</pre>
    <h3>Session logs from previous page</h3><pre>{JSON.stringify(logs,null,2)}</pre>
  </div></main>;
}
