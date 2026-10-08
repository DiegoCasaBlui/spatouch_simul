import type { CSSProperties } from 'react';
export function HeatModeSymbol({ rest = false }: { rest?: boolean }) {
  return <span className={`heat-mode-symbol${rest ? ' resting' : ''}`} aria-hidden="true">R</span>;
}

/** Filled vanes and six bubble trails follow the Rev. A pump artwork. */
export function DeviceSymbol({ kind, number, running }: { kind: 'pump' | 'circulation' | 'light'; number?: string; running: boolean }) {
  const bubbles = [[83,19,1.5],[89,20,1.7],[96,23,2],[79,24,1.7],[86,26,2.2],[94,29,2.4],[103,30,2],[84,33,2.7],[92,37,3.1],[102,38,2.3],[89,44,3.6],[100,46,3],[98,55,4.1]];
  return <svg className={`device-art ${running ? 'is-running' : ''}`} viewBox="0 0 160 160" aria-hidden="true">
    <circle cx="80" cy="80" r="77" fill="#080e11" stroke="#14232b" strokeWidth="3"/>
    <circle cx="80" cy="80" r="73" fill="#111516" stroke="#202426" strokeWidth="3"/>
    <circle cx="80" cy="80" r="68" fill="none" stroke="currentColor" strokeWidth="2"/>
    {kind === 'pump' ? <>
      <g className={running ? 'pump-vane-motion' : ''}>
        {Array.from({ length: 6 }, (_, i) => <g key={i} transform={`rotate(${i * 60} 80 80)`}>
          <path d="M74 56 L69 45 Q79 43 85 51 L91 63 L81 66 Z" fill="currentColor"/>
          {bubbles.map(([cx,cy,r],j) => <circle key={j} cx={cx} cy={cy} r={r} fill="currentColor" opacity={.4+j*.045}/>)}
        </g>)}
      </g>
      <circle cx="80" cy="80" r="23" fill={running ? '#319fbd' : '#22697e'} stroke="#000b12" strokeWidth="3"/>
      <text x="80" y="80" dy=".36em" textAnchor="middle" fill="#dcf6ff" fontFamily="Arial, sans-serif" fontSize="30">{number}</text>
    </> : kind === 'circulation' ? <g className={running ? 'pump-vane-motion' : ''}>
      <circle cx="80" cy="80" r="32" fill="none" stroke="currentColor" strokeWidth="3"/>
      <circle cx="80" cy="80" r="22" fill="none" stroke="currentColor" strokeWidth="3"/>
      {Array.from({length:16},(_,i)=><path key={i} d="M80 47 L88 35" transform={`rotate(${i*22.5} 80 80)`} fill="none" stroke="currentColor" strokeWidth="3"/>)}
    </g> : <g stroke="currentColor" strokeWidth="3" fill="none">
      <circle cx="80" cy="80" r="22"/>
      {Array.from({length:12},(_,i)=><path key={i} d="M80 45 V31" transform={`rotate(${i*30} 80 80)`}/>)}
    </g>}
  </svg>;
}
export function Icon({ name, size = 28, style }: { name: string; size?: number; style?: CSSProperties }) {
  const paths: Record<string, React.ReactNode> = {
    settings: <><path d="m10 3 1-2h2l1 2 3 1 2-1 2 2-1 2 1 3 2 1v2l-2 1-1 3 1 2-2 2-2-1-3 1-1 2h-2l-1-2-3-1-2 1-2-2 1-2-1-3-2-1v-2l2-1 1-3-1-2 2-2 2 1z"/><circle cx="12" cy="12" r="4"/></>,
    home: <><path d="m2 11 10-9 10 9M5 9v12h5v-7h4v7h5V9"/></>,
    back: <path d="m12 4-8 8 8 8M4 12h17"/>,
    sun: <><circle cx="12" cy="12" r="5"/><path d="M12 0v4m0 16v4M0 12h4m16 0h4M3 3l3 3m12 12 3 3M3 21l3-3M18 6l3-3"/></>,
    pump: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M12 9c-9-9 7-11 3-2M15 12c9-9 11 7 2 3M12 15c9 9-7 11-3 2M9 12c-9 9-11-7-2-3"/></>,
    filter: <><rect x="4" y="2" width="13" height="20" rx="3"/><path d="M7 3v18M10 3v18M13 3v18M16 3v18"/><circle cx="18" cy="18" r="5"/></>,
    audio: <><path d="M3 9h5l6-6v18l-6-6H3zM17 7q7 5 0 10M20 3q11 9 0 18"/></>,
    wifi: <><path d="M1 7q11-10 22 0M5 11q7-7 14 0M8 15q4-4 8 0"/><circle cx="12" cy="19" r="1"/></>,
    heat: <><path d="M9 15V5a3 3 0 0 1 6 0v10a5 5 0 1 1-6 0M12 8v10M15 6h3m-3 4h3"/></>,
    moon: <><path d="M19 17A10 10 0 0 1 7 3a10 10 0 1 0 12 14z"/><path d="M15 2h6l-6 6h6"/></>,
    lock: <><rect x="5" y="10" width="14" height="12" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v4"/></>,
    info: <><circle cx="12" cy="12" r="10"/><path d="M12 10v8M12 6v1"/></>,
    download: <><path d="M12 1v15m-5-5 5 5 5-5M3 16v6h18v-6"/></>,
    clean: <><path d="m16 2-5 10M8 10l8 4-4 8-10-5 6-7M5 15l7 4"/></>,
    hold: <><path d="M8 13V5a2 2 0 0 1 4 0v7-2a2 2 0 0 1 4 0v1a2 2 0 0 1 4 0v6l-4 6H9L3 13q1-3 5 0"/></>,
    check: <path d="m3 12 6 7L21 4"/>,
    close: <path d="m5 5 14 14M19 5 5 19"/>,
    play: <path d="m7 3 14 9-14 9z"/>,
    pause: <><path d="M8 3v18M16 3v18" strokeWidth="5"/></>,
    next: <><path d="m3 4 13 8-13 8zM20 4v16"/></>,
    prev: <><path d="m21 4-13 8 13 8zM4 4v16"/></>,
    search: <><circle cx="10" cy="10" r="8"/><path d="m16 16 7 7M10 5v10M5 10h10"/></>,
    invert: <><path d="M2 17 7 3l5 14M4 12h6M13 7l5 14 5-14M15 12h6"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">{paths[name] || paths.settings}</svg>;
}
