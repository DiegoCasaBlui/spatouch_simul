import type { CSSProperties } from 'react';
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
