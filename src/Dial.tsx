import type React from 'react';
export function TemperatureDial({ water, target, units, heating, editing, min, max, inverted, onOpen, onChange }: { water: string; target: number; units: string; heating: boolean; editing: boolean; min: number; max: number; inverted: boolean; onOpen: () => void; onChange: (n: number) => void }) {
  const arc = (n: number, radius: number) => { const a = (135 + n * 270) * Math.PI / 180; return [160 + radius * Math.cos(a), 160 + radius * Math.sin(a)]; };
  const fraction = (target - min) / (max - min); const handle = arc(fraction, 149);
  const measured = Math.max(0, Math.min(1, (Number(water) - min) / (max - min)));
  const drag = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    let x = (e.clientX - r.left) / r.width * 320 - 160; let y = (e.clientY - r.top) / r.height * 320 - 160;
    if (inverted) { x = -x; y = -y; }
    const angle = ((Math.atan2(y, x) * 180 / Math.PI - 135) + 360) % 360;
    onChange(min + Math.min(270, angle > 315 ? 0 : angle) / 270 * (max - min));
  };
  return <div className={`dial ${editing ? 'editing' : ''} ${heating ? 'heating' : ''}`}>
    <svg viewBox="0 0 320 320" onPointerDown={e => { if (editing && e.button === 0) { e.currentTarget.setPointerCapture(e.pointerId); drag(e); } }} onPointerMove={e => { if (editing && e.currentTarget.hasPointerCapture(e.pointerId)) drag(e); }} role={editing ? 'slider' : undefined} aria-label={editing ? 'Set temperature dial' : undefined} aria-valuemin={min} aria-valuemax={max} aria-valuenow={target} tabIndex={editing ? 0 : undefined} onKeyDown={e => { if (!editing) return; if(e.key==='Home'||e.key==='End'){e.preventDefault();onChange(e.key==='Home'?min:max);} if (['ArrowLeft','ArrowDown','ArrowRight','ArrowUp'].includes(e.key)) { e.preventDefault(); onChange(target + (e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 1) * (units === 'F' ? 1 : .5)); } }}>
      <defs><linearGradient id="temperatureArc"><stop stopColor="#111ea2"/><stop offset=".5" stopColor="#871064"/><stop offset="1" stopColor="#fc2c07"/></linearGradient><radialGradient id="dialFace" cx=".5" cy=".35" r=".9"><stop stopColor="#17191a"/><stop offset="1" stopColor="#0b0c0d"/></radialGradient></defs>
      <circle cx="160" cy="160" r="137" fill="url(#dialFace)"/>
      {heating && <path d="M65 237a125 125 0 0 0 190 0" fill="none" stroke="#e6330d" strokeWidth="12" opacity=".18"/>}
      {Array.from({ length: 57 }, (_, i) => { const [x1,y1] = arc(i/56, 122); const [x2,y2] = arc(i/56, i%7 === 0 ? 111 : 115); return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i>45 ? '#ce411e' : '#acb7bb'} strokeWidth="2"/>; })}
      {editing && <><path d="M54.64 265.36 A149 149 0 1 1 265.36 265.36" fill="none" stroke="url(#temperatureArc)" strokeWidth="5"/><circle cx={handle[0]} cy={handle[1]} r="10" fill="#e1edf1" stroke="#798f9a" strokeWidth="4"/></>}
      {Number.isFinite(measured) && <path d={`M${arc(measured,96).join(' ')} L${arc(measured-.007,123).join(' ')} L${arc(measured+.007,123).join(' ')}Z`} fill="white"/>}
      {!editing && <path d={`M${arc(fraction,120).join(' ')} L${arc(fraction-.01,133).join(' ')} L${arc(fraction+.01,133).join(' ')}Z`} fill="#f13e1b"/>}
    </svg>
    <button className="dial-center" aria-label={editing ? 'Back to Home' : 'Water temperature'} onClick={onOpen}>{heating && <span className="heat-chevron">⌃</span>}<span className="water-value">{water}</span>{editing && <span className="target-value">{units === 'F' ? Math.round(target) : target.toFixed(1)}</span>}</button>
    {editing && <><button className="temp-step minus" aria-label="Decrease temperature" onClick={() => onChange(target - (units === 'F' ? 1 : .5))}>−</button><button className="temp-step plus" aria-label="Increase temperature" onClick={() => onChange(target + (units === 'F' ? 1 : .5))}>+</button></>}
  </div>;
}

