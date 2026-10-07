import { createContext, useContext, useRef, type Dispatch, type ReactNode } from 'react';
import { Icon } from './icons';
import type { Action, Settings, SpaState } from './model';
export type Editor = { kind: 'clock' | 'filter-start' | 'filter-end' | 'light-start' | 'light-end' | 'sleep'; index?: number; returnTo: string };
export const menus = [
  ['general','General','settings'],['audio','Audio','audio'],['connections','Connections','wifi'],['heat','Heat Mode','heat'],
  ['clim','Clim8zone','heat'],['lightcycles','Light Cycles','sun'],['chroma','CHROMAZON3','sun'],['filters','Filter Cycles','filter'],
  ['hold','Hold','hold'],['cleanup','Cleanup Cycle','clean'],['sleep','Sleep','moon'],['security','Security','lock'],
  ['diagnostics','Diagnostics','search'],['update','Software Update','download'],['about','About','info'],
];
const es: Record<string,string> = {
  'General':'General','Connections':'Conexiones','Heat Mode':'Modo de calor','Light Cycles':'Ciclos de luz','Filter Cycles':'Filtración',
  'Hold':'Pausa','Cleanup Cycle':'Ciclo de limpieza','Sleep':'Suspensión','Security':'Seguridad','Diagnostics':'Diagnóstico','Software Update':'Actualizar software','About':'Acerca de',
  'Settings':'Ajustes','Time':'Hora','Units':'Unidades','Language':'Idioma','Reminders':'Recordatorios','Off':'No','On':'Sí','Temperature':'Temperatura',
  'Ready':'Preparado','Rest':'Reposo','High':'Alto','Low':'Bajo','Screen Sleeps After':'Suspender después de','Tap to Wake':'Toque para activar',
  'Start Time':'Inicio','End Time':'Fin','Duration':'Duración','Set the time':'Configure la hora','Message Code 40':'Código de mensaje 40',
  'No messages':'Sin mensajes','System Information':'Información del sistema','Heater Voltage':'Voltaje calentador','Heater Type':'Tipo de calentador','Standard':'Estándar',
  'Water temperature':'Temperatura del agua','Set temperature':'Temperatura deseada','Flow':'Circulación de agua','Heating':'Calentamiento','Software Version':'Versión de software',
  'Panel Lock':'Bloquear panel','Settings Lock':'Bloquear ajustes','Panel locked':'Panel bloqueado','Settings locked':'Ajustes bloqueados',
  'Press 1 then 2 to unlock':'Pulse 1 y luego 2 para desbloquear','Press 1 then 2 to wake':'Pulse 1 y luego 2 para activar',
  'Volume':'Volumen','Mute':'Silenciar','Playback':'Reproducción','Play':'Reproducir','Pause':'Pausar','Track':'Pista',
  'Connection':'Conexión','Offline':'Sin conexión','Local':'Local','Cloud':'Nube','Light':'Luz','Color':'Color','Intensity':'Intensidad',
  'Mode':'Modo','Heat':'Calor','Auto':'Auto','Status':'Estado','Idle':'Inactivo','Running':'Activo','Enabled':'Activado',
  'Exit Hold':'Salir de pausa','Start Hold':'Iniciar pausa','Start Cleanup':'Iniciar limpieza','Stop Cleanup':'Detener limpieza','No active cycle':'Sin ciclo activo',
  'Install demo update':'Instalar actualización demo','Up to date':'Actualizado','Demo update available':'Actualización demo disponible',
  'Updating…':'Actualizando…','Priming…':'Cebado…','Exit Priming':'Finalizar cebado','Circulation':'Circulación','Blower':'Soplador','Pump':'Bomba',
  'Light scheduling':'Programación de luz','Check water':'Revisar agua','Dismiss':'Descartar','Music':'Música','Messages':'Mensajes','Brightness':'Brillo',
  'Save':'Guardar','Cancel':'Cancelar','Back':'Volver','Home':'Inicio','Set Temperature':'Temperatura deseada','Filter':'Filtro',
};
type UI = { s: SpaState; dispatch: Dispatch<Action>; go: (screen: string) => void; edit: (e: Editor) => void; t: (v:string) => string; patch: (p:Partial<Settings>) => void };
export const UIContext = createContext<UI>(null!);
export const useUI = () => useContext(UIContext);
export const translate = (lang: string, text:string) => lang === 'es' ? es[text] || text : text;
export function Row({ label, children }: { label: string; children: ReactNode }) { const {t} = useUI(); return <div className="setting-row"><span>{t(label)}</span><div>{children}</div></div>; }
export function Toggle<T extends string | number>({ value, values, onChange, label }: { value: T; values: readonly T[]; onChange: (v:T)=>void; label: string }) {
  const {t} = useUI(); return <div className="toggle" role="group" aria-label={t(label)}>{values.map(v => <button key={v} aria-label={t(String(v))} aria-pressed={value === v} className={value === v ? 'selected' : ''} onClick={() => onChange(v)}>{label==='Units'?`${v}°`:label==='Heat Mode'?(v==='Ready'?'R':'ℝ'):label==='Temperature range'?(v==='High'?'H':'L'):t(String(v))}</button>)}</div>;
}
export function Switch({ value, onChange, label }: { value: boolean; onChange: (v:boolean)=>void; label: string }) { return <Toggle value={value ? 'On' : 'Off'} values={['Off','On']} label={label} onChange={v => onChange(v === 'On')}/>; }
export function RangeSlider({ value, min=0, max=100, onChange, label }: { value: number; min?:number; max?:number; onChange: (v:number)=>void; label:string }) {
  const {t} = useUI(); return <input type="range" aria-label={t(label)} min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))} style={{'--fill':`${(value-min)/(max-min)*100}%`} as React.CSSProperties}/>;
}
export function Wheel({ value, values, onChange, label, format = String }: { value:number; values:number[]; onChange:(v:number)=>void; label:string; format?:(v:number)=>string }) {
  const {s} = useUI(); const origin = useRef<{y:number;index:number} | null>(null); const moved = useRef(false);
  const index = Math.max(0, values.indexOf(value));
  const get = (i:number) => values[(i + values.length * 10) % values.length];
  return <div className="wheel" role="spinbutton" tabIndex={0} aria-label={label} aria-valuenow={value} aria-valuemin={values[0]} aria-valuemax={values.at(-1)} onPointerDown={e => {
    if (e.button !== 0) return; origin.current={y:e.clientY,index}; moved.current=false; e.currentTarget.setPointerCapture(e.pointerId);
  }} onPointerMove={e => {
    if (!origin.current) return;
    const scale = e.currentTarget.getBoundingClientRect().height/e.currentTarget.offsetHeight;
    const delta=(e.clientY-origin.current.y)*(s.settings.inverted?-1:1)/scale;
    if(Math.abs(delta)>8) { moved.current=true; onChange(get(origin.current.index-Math.round(delta/55))); }
  }} onPointerUp={e => {
    if (origin.current && !moved.current) { const r=e.currentTarget.getBoundingClientRect(); const pos=(e.clientY-r.top)/r.height; const offset=Math.round(((s.settings.inverted?1-pos:pos)*5)-2.5); onChange(get(index+offset)); }
    origin.current=null;
  }} onPointerCancel={()=>{origin.current=null;}} onWheel={e=>onChange(get(index+(e.deltaY>0?1:-1)))} onKeyDown={e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();onChange(get(index+(e.key==='ArrowDown'?1:-1)));}}}>
    {[-2,-1,0,1,2].map(offset=><div className={offset===0?'current':''} key={offset}>{format(get(index+offset))}</div>)}
  </div>;
}
export function RoundButton({ icon, label, onClick }: { icon:string;label:string;onClick:()=>void }) { const {t}=useUI();return <button className="round-button" aria-label={t(label)} onClick={onClick}><Icon name={icon} size={44}/></button>; }
