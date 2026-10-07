import { useRef, type PointerEvent, type ReactNode } from 'react';
export type Direction = 'up' | 'down' | 'left' | 'right';
export function SwipeZone({ children, className = '', inverted = false, onSwipe, label }: { children?: ReactNode; className?: string; inverted?: boolean; onSwipe: (d: Direction) => void; label?: string }) {
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const suppress = useRef(false);
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    suppress.current = false;
    ((e.target as Element).closest('button') || e.currentTarget).setPointerCapture(e.pointerId);
  };
  return <div className={`swipe-zone ${className}`} aria-label={label} onPointerDown={down} onClickCapture={e => {if(suppress.current){e.preventDefault();e.stopPropagation();suppress.current=false;}}} onPointerUp={e => {
    if (!start.current) return;
    const sign = inverted ? -1 : 1;
    const dx = (e.clientX - start.current.x) * sign; const dy = (e.clientY - start.current.y) * sign;
    start.current = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
    suppress.current = true;
    onSwipe(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  }} onPointerCancel={() => { start.current = null; }}>{children}</div>;
}
export function DragScroll({ children, className = '', inverted = false }: { children: ReactNode; className?: string; inverted?: boolean }) {
  const start = useRef<{ y: number; scroll: number; moved: boolean; target: HTMLElement } | null>(null);
  const suppress = useRef(false);
  return <div className={`drag-scroll ${className}`} onPointerDown={e => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('input')) return;
    suppress.current = false;
    start.current = { y: e.clientY, scroll: e.currentTarget.scrollTop, moved: false, target: e.target as HTMLElement };
  }} onPointerMove={e => {
    const s = start.current; if (!s) return;
    const scale = e.currentTarget.getBoundingClientRect().height / e.currentTarget.offsetHeight || 1;
    const dy = (e.clientY - s.y) * (inverted ? -1 : 1) / scale;
    if (Math.abs(dy) > 8) {
      s.moved = true; suppress.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.scrollTop = s.scroll - dy;
    }
  }} onPointerUp={() => { start.current = null; }} onPointerCancel={() => { start.current = null; }} onClickCapture={e => { if (suppress.current) { e.preventDefault(); e.stopPropagation(); suppress.current = false; } }}>{children}</div>;
}
