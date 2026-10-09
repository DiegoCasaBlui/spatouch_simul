export type Units = 'F' | 'C';
export type HeatMode = 'Ready' | 'Rest';
export type Range = 'High' | 'Low';
export type Cycle = { enabled: boolean; start: number; end: number };
export type Capabilities = { pumps: number; speeds: 1 | 2; blower: boolean; circulation: boolean; chromazone: boolean; clim8zone: boolean; ozone: boolean; m8: boolean };
export type Settings = {
  units: Units; language: 'en' | 'es'; format24: boolean; timeSet: boolean;
  targetC: number; range: Range; heatMode: HeatMode; m8: boolean;
  brightness: number; inverted: boolean; reminders: boolean;
  sleepAfter: number; tapToWake: boolean; panelLocked: boolean; settingsLocked: boolean;
  filters: [Cycle, Cycle]; lightCycle: Cycle; cleanupMinutes: number;
  lightOn: boolean; color: string; lightIntensity: number;
  climMode: 'Off' | 'Heat' | 'Auto';
  capabilities: Capabilities;
};
export type SpaState = {
  settings: Settings; clock: number; waterC: number; ambientC: number;
  manualPumps: number[]; blowerOn: boolean; primeCirculation: boolean; priming: boolean;
  startup: boolean; sampleSeconds: number; lastSample: number | null; sampledC: number | null;
  holdUntil: number; cleanupUntil: number; cleanupDue: number | null;
  connection: 'Offline' | 'Local' | 'Cloud';
  wifiNetwork: string | null; cmsCode: string;
  updating: number; updateInstalled: boolean; reminderDismissed: boolean;
};
export const STORAGE_KEY = 'spatouch4-rev-a-v1';
export const toC = (n: number, units: Units) => units === 'C' ? n : (n - 32) * 5 / 9;
export const fromC = (n: number, units: Units) => units === 'C' ? n : n * 9 / 5 + 32;
export const bounds = (range: Range, units: Units): [number, number] => units === 'F' ? (range === 'High' ? [80, 104] : [50, 99]) : (range === 'High' ? [26.5, 40] : [10, 37]);
export const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
export function setTarget(settings: Settings, display: number): Settings {
  const [lo, hi] = bounds(settings.range, settings.units);
  const step = settings.units === 'F' ? 1 : .5;
  return { ...settings, targetC: toC(clamp(Math.round(display / step) * step, lo, hi), settings.units) };
}
export function normalizeSettings(s: Settings): Settings {
  const [lo, hi] = bounds(s.range, s.units);
  return { ...s, targetC: clamp(s.targetC, toC(lo, s.units), toC(hi, s.units)), capabilities: { ...s.capabilities, pumps: 2, speeds: 1, blower: false, circulation: true } };
}
export function defaults(): Settings {
  return {
    units: 'F', language: 'en', format24: false, timeSet: false, targetC: 100 / 1.8 - 32 / 1.8,
    range: 'High', heatMode: 'Ready', m8: false, brightness: 82, inverted: false, reminders: false,
    sleepAfter: 60, tapToWake: false, panelLocked: false, settingsLocked: false,
    filters: [{ enabled: true, start: 270, end: 570 }, { enabled: false, start: 990, end: 1290 }],
    lightCycle: { enabled: false, start: 1080, end: 1320 }, cleanupMinutes: 30,
    lightOn: false, color: '#39baf2', lightIntensity: 80, climMode: 'Off',
    capabilities: { pumps: 2, speeds: 1, blower: false, circulation: true, chromazone: true, clim8zone: true, ozone: true, m8: true },
  };
}
export function initialState(settings = defaults(), clock = 12 * 3600): SpaState {
  return { settings: normalizeSettings(settings), clock, waterC: toC(90, 'F'), ambientC: 22, manualPumps: [0, 0], blowerOn: false,
    primeCirculation: false, priming: false, startup: true, sampleSeconds: 0, lastSample: null, sampledC: null,
    holdUntil: 0, cleanupUntil: 0, cleanupDue: null,
    connection: 'Offline', wifiNetwork: null, cmsCode: '', updating: 0, updateInstalled: false, reminderDismissed: false };
}
export function inCycle(c: Cycle, seconds: number): boolean {
  if (!c.enabled) return false;
  const m = ((seconds / 60) % 1440 + 1440) % 1440;
  if (c.start === c.end) return true; // A 24-hour cycle, displayed explicitly in the UI.
  return c.start < c.end ? m >= c.start && m < c.end : m >= c.start || m < c.end;
}
export const cycleDuration = (c: Cycle) => (c.end - c.start + 1440) % 1440 || 1440;
export function status(s: SpaState) {
  const cfg = s.settings;
  const hold = s.holdUntil > s.clock;
  const filterIds = cfg.timeSet ? cfg.filters.flatMap((f, i) => inCycle(f, s.clock) ? [i + 1] : []) : [];
  const cleanup = s.cleanupUntil > s.clock;
  const manual = s.manualPumps.slice(0, cfg.capabilities.pumps).some(Boolean);
  const demand = cfg.targetC - s.waterC > .06;
  const pollInterval = cfg.m8 && cfg.capabilities.m8 && Math.abs(s.waterC - cfg.targetC) < .5 ? 3600 : 1800;
  const poll = cfg.heatMode === 'Ready' && (s.lastSample === null || s.clock - s.lastSample >= pollInterval);
  const automatic = !s.priming && (s.startup || filterIds.length > 0 || cleanup || poll || (cfg.heatMode === 'Ready' && demand));
  const flow = !hold && (s.priming ? (manual || s.primeCirculation) : (manual || automatic));
  const heating = !hold && !s.priming && !s.startup && flow && demand && (cfg.heatMode === 'Ready' || filterIds.length > 0);
  const circulation = cfg.capabilities.circulation && !hold && (s.priming ? s.primeCirculation : automatic);
  const pumps = s.manualPumps.slice(0, cfg.capabilities.pumps).map((n, i) => hold ? 0 : Math.max(n, i === 0 && !cfg.capabilities.circulation && automatic ? 1 : 0));
  const validTemperature = s.lastSample !== null && s.clock - s.lastSample < 3600;
  const light = cfg.lightOn || (cfg.timeSet && inCycle(cfg.lightCycle, s.clock));
  return { hold, filterIds: hold || s.priming ? [] : filterIds, cleanup: !hold && !s.priming && cleanup, flow, heating, circulation, pumps,
    validTemperature, light, ozone: cfg.capabilities.ozone && flow && !s.priming && !manual,
    blower: cfg.capabilities.blower && s.blowerOn && !hold,
    heatPump: cfg.capabilities.clim8zone && cfg.climMode !== 'Off' && heating };
}
/** Advance at one-second boundaries so accelerated time cannot skip schedules. */
export function advance(state: SpaState, seconds: number): SpaState {
  let s = { ...state };
  const total = clamp(seconds, 0, 86400);
  for (let elapsed = 0; elapsed < total;) {
    const dt = Math.min(1, total - elapsed);
    const st = status(s);
    const heatingRate = st.heating ? (st.heatPump ? 4 : 2) / 3600 : 0;
    const coolingRate = (s.waterC - s.ambientC) * .025 / 3600;
    s.waterC = clamp(s.waterC + (heatingRate - coolingRate) * dt, 0, 50);
    s.clock += dt;
    if (st.flow && !s.priming) {
      s.sampleSeconds += dt;
      if (s.sampleSeconds >= 60) {
        s.lastSample = s.clock; s.sampledC = s.waterC; s.startup = false;
      }
    } else s.sampleSeconds = 0;
    if (s.cleanupDue !== null && s.clock >= s.cleanupDue) {
      s.cleanupUntil = s.clock + s.settings.cleanupMinutes * 60; s.cleanupDue = null;
    }
    if (s.updating > 0) { s.updating = Math.max(0, s.updating - dt); if (!s.updating) s.updateInstalled = true; }
    elapsed += dt;
  }
  return s;
}
export type Action =
  | { type: 'tick'; seconds: number }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'target'; value: number }
  | { type: 'pump'; index: number }
  | { type: 'blower' }
  | { type: 'clock'; minute: number }
  | { type: 'prime'; on: boolean }
  | { type: 'state'; patch: Partial<SpaState> }
  | { type: 'reset' };
export function reducer(s: SpaState, action: Action): SpaState {
  switch (action.type) {
    case 'tick': return advance(s, action.seconds);
    case 'settings': return { ...s, settings: normalizeSettings({ ...s.settings, ...action.patch }) };
    case 'target': return { ...s, settings: setTarget(s.settings, action.value) };
    case 'pump': {
      if (s.settings.panelLocked || status(s).hold || !Number.isInteger(action.index) || action.index < 0 || action.index >= s.settings.capabilities.pumps) return s;
      const manualPumps = [...s.manualPumps];
      manualPumps[action.index] = (manualPumps[action.index] + 1) % (s.settings.capabilities.speeds + 1);
      const allOff = !manualPumps.slice(0, s.settings.capabilities.pumps).some(Boolean) && !s.blowerOn;
      return { ...s, manualPumps, cleanupDue: allOff && s.settings.cleanupMinutes ? s.clock + 1800 : null };
    }
    case 'blower': return !s.settings.capabilities.blower || s.settings.panelLocked || status(s).hold ? s : { ...s, blowerOn: !s.blowerOn,
      cleanupDue: s.blowerOn && !s.manualPumps.some(Boolean) && s.settings.cleanupMinutes ? s.clock + 1800 : null };
    case 'clock': {
      const clock = Math.floor(s.clock / 86400) * 86400 + action.minute * 60;
      const shift = clock - s.clock;
      return { ...s, clock, settings: { ...s.settings, timeSet: true },
        lastSample: s.lastSample === null ? null : s.lastSample + shift,
        holdUntil: s.holdUntil > s.clock ? s.holdUntil + shift : 0,
        cleanupUntil: s.cleanupUntil > s.clock ? s.cleanupUntil + shift : 0,
        cleanupDue: s.cleanupDue === null ? null : s.cleanupDue + shift };
    }
    case 'prime': return { ...s, priming: action.on, startup: !action.on, sampleSeconds: 0, sampledC: null,
      lastSample: null, primeCirculation: false, manualPumps: [0, 0], blowerOn: false, holdUntil: 0 };
    case 'state': return { ...s, ...action.patch };
    case 'reset': return initialState();
  }
}
export function serialize(s: SpaState) { return JSON.stringify({ version: 1, settings: s.settings, clock: s.clock % 86400 }); }
export function restore(raw: string | null): SpaState {
  if (!raw) return initialState();
  try {
    const p = JSON.parse(raw);
    if (p.version !== 1 || !p.settings || !Number.isFinite(p.clock)) return initialState();
    const d = defaults(); const n = p.settings;
    // Validate the persisted shape before it can reach the simulation loop.
    if (Object.keys(d).some(k => typeof n[k] !== typeof d[k as keyof Settings])) return initialState();
    if (!['F','C'].includes(n.units) || !['en','es'].includes(n.language) || !['High','Low'].includes(n.range) || !['Ready','Rest'].includes(n.heatMode)) return initialState();
    const cycles = [...(Array.isArray(n.filters) ? n.filters : []), n.lightCycle];
    if (n.filters.length !== 2 || cycles.length !== 3 || cycles.some(c => !c || typeof c.enabled !== 'boolean' || !Number.isInteger(c.start) || !Number.isInteger(c.end) || c.start < 0 || c.start > 1439 || c.end < 0 || c.end > 1439)) return initialState();
    if (!n.capabilities || !Number.isInteger(n.capabilities.pumps) || n.capabilities.pumps < 1 || n.capabilities.pumps > 8 || ![1,2].includes(n.capabilities.speeds)) return initialState();
    if (Object.keys(d.capabilities).some(k => typeof n.capabilities[k] !== typeof d.capabilities[k as keyof Capabilities])) return initialState();
    if (['targetC','brightness','sleepAfter','cleanupMinutes','lightIntensity'].some(k => !Number.isFinite(n[k]))) return initialState();
    if (!/^#[0-9a-f]{6}$/i.test(n.color) || !['Off','Heat','Auto'].includes(n.climMode)) return initialState();
    return initialState(normalizeSettings({ ...d, ...n, brightness: clamp(n.brightness, 15, 100), sleepAfter: clamp(n.sleepAfter, 10, 600), cleanupMinutes: clamp(n.cleanupMinutes, 0, 120), filters: [{ ...n.filters[0], enabled: true }, n.filters[1]] }), clamp(p.clock, 0, 86399));
  } catch { return initialState(); }
}
export function clockText(seconds: number, format24: boolean) {
  const mins = Math.floor(((seconds % 86400) + 86400) % 86400 / 60);
  const hour = Math.floor(mins / 60);
  return `${format24 ? String(hour).padStart(2,'0') : hour % 12 || 12}:${String(mins % 60).padStart(2,'0')}`;
}
export function tempText(c: number, u: Units) { return u === 'F' ? Math.round(fromC(c, u)).toString() : fromC(c, u).toFixed(1); }
