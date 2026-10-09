import { useState } from 'react';
import { DragScroll, SwipeZone } from './gestures';
import { DeviceSymbol, Icon } from './icons';
import { clockText, cycleDuration, fromC, status, tempText, type Cycle, type Settings } from './model';
import { menus, RangeSlider, RoundButton, Row, Switch, Toggle, useUI, Wheel, type Editor } from './ui';

export function visibleMenus(s: Settings) { return menus.filter(([id]) => !(id === 'chroma' && !s.capabilities.chromazone) && !(id === 'clim' && !s.capabilities.clim8zone)); }
export function SettingsMenu() {
  const {s,go,t,patch}=useUI();
  return <><DragScroll className="settings-list" inverted={s.settings.inverted}>{visibleMenus(s.settings).map(([id,label,icon])=><button key={id} onClick={()=>go(id)}><Icon name={icon} size={30}/><span>{t(label)}</span></button>)}</DragScroll><div className="brightness"><Icon name="moon" size={19}/><RangeSlider min={15} value={s.settings.brightness} onChange={brightness=>patch({brightness})} label="Brightness"/><Icon name="sun" size={19}/></div></>;
}
export function SideNav({ screen }: { screen:string }) { const {s,go,t}=useUI(); return <DragScroll className="side-nav" inverted={s.settings.inverted}>{visibleMenus(s.settings).map(([id,label,icon])=><button key={id} aria-label={t(label)} title={t(label)} className={id===screen?'active':''} onClick={()=>go(id)}><Icon name={icon} size={31}/></button>)}</DragScroll>; }
export function SettingsScreen({screen}:{screen:string}) {
  const {s,patch,go,edit,t,dispatch}=useUI(); const cfg=s.settings; const st=status(s);
  const [expanded,setExpanded]=useState(true);
  switch(screen) {
    case 'general': return <><Row label="Time"><button className="value-button time-value" onClick={()=>edit({kind:'clock',returnTo:'general'})}>{clockText(s.clock,cfg.format24)}<small>{cfg.format24?'24 HR':`${s.clock%86400<43200?'AM':'PM'} · 12 HR`}</small></button></Row><Row label="Units"><Toggle label="Units" value={cfg.units} values={['F','C']} onChange={units=>patch({units})}/></Row><Row label="Language"><button className="text-button" onClick={()=>go('language')}>{cfg.language==='en'?'English':'Español'}</button></Row><Row label="Reminders"><Switch label="Reminders" value={cfg.reminders} onChange={reminders=>patch({reminders})}/></Row></>;
    case 'language': return <div className="language-list">{(['en','es'] as const).map(lang=><button className={`language-choice ${cfg.language===lang?'selected':''}`} onClick={()=>patch({language:lang})} key={lang}>{lang==='en'?'English':'Español'}{cfg.language===lang&&<Icon name="check"/>}</button>)}</div>;
    case 'heat': return <><Row label="Heat Mode"><Toggle label="Heat Mode" value={cfg.heatMode} values={['Ready','Rest']} onChange={heatMode=>patch({heatMode})}/></Row><Row label="Temperature"><Toggle label="Temperature range" value={cfg.range} values={['Low','High']} onChange={range=>patch({range})}/></Row>{cfg.capabilities.m8&&<Row label="M8"><Switch label="M8" value={cfg.m8} onChange={m8=>patch({m8})}/></Row>}</>;
    case 'sleep': return <><Row label="Screen Sleeps After"><button className="value-button" onClick={()=>edit({kind:'sleep',returnTo:'sleep'})}>{cfg.sleepAfter<60?`${cfg.sleepAfter} sec`:`${cfg.sleepAfter/60} min`}</button></Row><Row label="Tap to Wake"><Switch label="Tap to Wake" value={cfg.tapToWake} onChange={tapToWake=>patch({tapToWake})}/></Row></>;
    case 'filters': return <div className="cycles">{cfg.filters.map((c,i)=><CycleRow key={i} cycle={c} index={i} onToggle={()=>{if(i===1)patch({filters:[cfg.filters[0],{...c,enabled:!c.enabled}]});}} start={()=>edit({kind:'filter-start',index:i,returnTo:'filters'})} end={()=>edit({kind:'filter-end',index:i,returnTo:'filters'})}/>)}</div>;
    case 'lightcycles': return <><Row label="Light scheduling"><Switch label="Light scheduling" value={cfg.lightCycle.enabled} onChange={enabled=>patch({lightCycle:{...cfg.lightCycle,enabled}})}/></Row><CycleRow cycle={cfg.lightCycle} index={0} onToggle={()=>patch({lightCycle:{...cfg.lightCycle,enabled:!cfg.lightCycle.enabled}})} start={()=>edit({kind:'light-start',returnTo:'lightcycles'})} end={()=>edit({kind:'light-end',returnTo:'lightcycles'})}/></>;
    case 'clim': return <><Row label="Mode"><Toggle label="Mode" value={cfg.climMode} values={['Off','Heat','Auto']} onChange={climMode=>patch({climMode})}/></Row><Row label="Set temperature"><span>{tempText(cfg.targetC,cfg.units)}°{cfg.units}</span></Row><Row label="Status"><span>{t(st.heatPump?'Heating':'Idle')}</span></Row><Row label="Water temperature"><span>{tempText(s.waterC,cfg.units)}°{cfg.units}</span></Row></>;
    case 'chroma': return <><Row label="Light"><Switch value={cfg.lightOn} label="Light" onChange={lightOn=>patch({lightOn})}/></Row><Row label="Color"><div className="swatches">{['#ffffff','#39baf2','#7e65ed','#f25192','#ee4a32','#ffc85c','#4bddad'].map(c=><button key={c} aria-label={`Color ${c}`} aria-pressed={cfg.color===c} className={cfg.color===c?'selected':''} style={{background:c}} onClick={()=>patch({color:c})}/>)}</div></Row><Row label="Intensity"><RangeSlider value={cfg.lightIntensity} label="Intensity" onChange={lightIntensity=>patch({lightIntensity})}/></Row><div className="light-preview" style={{'--light-color':cfg.color,opacity:st.light?cfg.lightIntensity/100:.15} as React.CSSProperties}><Icon name="sun" size={48}/></div></>;
    case 'hold': return <div className="center-screen"><Icon name="hold" size={72}/><h3>{st.hold?`${Math.ceil((s.holdUntil-s.clock)/60)} min`:t('Hold')}</h3><button className="action-button" onClick={()=>dispatch({type:'state',patch:{holdUntil:st.hold?0:s.clock+3600}})}>{t(st.hold?'Exit Hold':'Start Hold')}</button></div>;
    case 'cleanup': return <><Row label="Duration"><Toggle value={cfg.cleanupMinutes} values={[0,15,30,60]} label="Duration" onChange={cleanupMinutes=>patch({cleanupMinutes})}/><small>min</small></Row><Row label="Status"><span>{st.cleanup?`${Math.ceil((s.cleanupUntil-s.clock)/60)} min`:s.cleanupDue?`${Math.ceil((s.cleanupDue-s.clock)/60)} min →`:t('No active cycle')}</span></Row><div className="center-action"><button className="action-button" disabled={!cfg.cleanupMinutes&&!st.cleanup} onClick={()=>dispatch({type:'state',patch:{cleanupUntil:st.cleanup?0:s.clock+cfg.cleanupMinutes*60,cleanupDue:null}})}>{t(st.cleanup?'Stop Cleanup':'Start Cleanup')}</button></div></>;
    case 'security': return <><Row label="Panel Lock"><Switch value={cfg.panelLocked} label="Panel Lock" onChange={panelLocked=>patch({panelLocked})}/></Row><Row label="Settings Lock"><Switch value={cfg.settingsLocked} label="Settings Lock" onChange={settingsLocked=>patch({settingsLocked})}/></Row><div className="lock-note"><Icon name="lock" size={48}/><p>{t('Press 1 then 2 to unlock')}</p></div></>;
    case 'diagnostics': return <><button className="diagnostic-title" onClick={()=>setExpanded(!expanded)}>{t('System Information')}<span>{expanded?'⌃':'⌄'}</span></button>{expanded&&<div className="diagnostic-rows">{[
      ['Heater Voltage','120 V'],['Heater Type',t('Standard')],['M8 Cycle Time',`${cfg.m8?60:30} min`],['Temperature',`${tempText(s.waterC,cfg.units)}°${cfg.units}`],['Temp A',`${tempText(s.waterC,cfg.units)}°${cfg.units}`],['Temp B',`${tempText(s.waterC,cfg.units)}°${cfg.units}`],['Set temperature',`${tempText(cfg.targetC,cfg.units)}°${cfg.units}`],['Flow',t(st.flow?'On':'Off')],['Heating',t(st.heating?'On':'Off')],['Filter',st.filterIds.join(' + ')||'—'],['Software Version','1 · Simulator'],['Control system','BP · 9.0+ (demo)'],
    ].map(([k,v])=><Row key={k} label={k}><span>{v}</span></Row>)}</div>}</>;
    case 'update': return <div className="center-screen"><Icon name="download" size={62}/><h3>{t(s.updating?'Updating…':s.updateInstalled?'Up to date':'Demo update available')}</h3>{s.updating?<><progress max={10} value={10-s.updating}/><p>{Math.round((10-s.updating)*10)}%</p></>:<button className="action-button" disabled={s.updateInstalled} onClick={()=>dispatch({type:'state',patch:{updating:10}})}>{t(s.updateInstalled?'Up to date':'Install demo update')}</button>}</div>;
    case 'about': return <div className="about-screen"><h3>SPA TOUCH 4™</h3><p>Document No. 42410 Rev. A</p><p>MVP Release · English</p><hr/><p>Software Version 1 · Simulator</p><small>BP 9.0+ · Clim8zone / Clim8zone II<br/>bba 3 · Chromazone</small></div>;
    default: return null;
  }
}
function CycleRow({cycle,index,onToggle,start,end}:{cycle:Cycle;index:number;onToggle:()=>void;start:()=>void;end:()=>void}) {
  const {s,t}=useUI();const duration=cycleDuration(cycle);
  return <div className="cycle-row"><button className={`cycle-number ${cycle.enabled?'enabled':''}`} aria-label={`Cycle ${index+1}`} aria-pressed={cycle.enabled} onClick={onToggle}>{index+1}</button><div><label>{t('Start Time')}</label><button className="value-button" aria-label={`Start Time ${index+1}`} onClick={start}>{clockText(cycle.start*60,s.settings.format24)}{!s.settings.format24&&<small>{cycle.start<720?'AM':'PM'}</small>}</button></div><div><label>{t('End Time')}</label><button className="value-button" aria-label={`End Time ${index+1}`} onClick={end}>{clockText(cycle.end*60,s.settings.format24)}{!s.settings.format24&&<small>{cycle.end<720?'AM':'PM'}</small>}</button></div><div><label>{t('Duration')}</label><span className="duration">{String(Math.floor(duration/60)).padStart(2,'0')}:{String(duration%60).padStart(2,'0')}</span></div></div>;
}
export function ValueEditor({editor,close}:{editor:Editor;close:()=>void}) {
  const {s,dispatch,patch,t}=useUI();const cfg=s.settings;
  const cycle=editor.kind.startsWith('filter')?cfg.filters[editor.index||0]:cfg.lightCycle;
  const init=editor.kind==='clock'?Math.floor(s.clock%86400/60):editor.kind.endsWith('start')?cycle.start:cycle.end;
  const [minute,setMinute]=useState(init);const [format24,setFormat24]=useState(cfg.format24);const [sleep,setSleep]=useState(cfg.sleepAfter);
  const hours=Math.floor(minute/60); const mins=minute%60; const isSleep=editor.kind==='sleep';
  const save=()=>{
    if(isSleep)patch({sleepAfter:sleep});
    else if(editor.kind==='clock') {dispatch({type:'clock',minute});patch({format24});}
    else if(editor.kind.startsWith('filter')) {const filters=[...cfg.filters] as [Cycle,Cycle]; filters[editor.index||0]={...cycle,[editor.kind.endsWith('start')?'start':'end']:minute};patch({filters});}
    else patch({lightCycle:{...cycle,[editor.kind.endsWith('start')?'start':'end']:minute}});
    close();
  };
  const minuteValues=Array.from({length:editor.kind==='clock'?60:4},(_,i)=>i*(editor.kind==='clock'?1:15));
  return <div className="value-editor"><span className="editor-label">{t(isSleep?'Screen Sleeps After':editor.kind==='clock'?'Time':editor.kind.endsWith('start')?'Start Time':'End Time')}</span><div className="wheel-group">
    {isSleep?<><Wheel label="Sleep duration" value={sleep} values={[10,15,30,60,120,180,240,300,600]} format={v=>String(v<60?v:v/60)} onChange={setSleep}/><span className="wheel-unit">{sleep<60?'sec':'min'}</span></>:<>
      <Wheel label="Hours" value={format24?hours:hours%12||12} values={Array.from({length:format24?24:12},(_,i)=>format24?i:i+1)} format={v=>String(v).padStart(2,'0')} onChange={v=>setMinute((format24?v:v%12+(hours>=12?12:0))*60+mins)}/>
      <Wheel label="Minutes" value={mins} values={minuteValues} format={v=>String(v).padStart(2,'0')} onChange={v=>setMinute(hours*60+v)}/>
      <div className="time-toggles">{!format24&&<Toggle label="AM PM" value={hours<12?'AM':'PM'} values={['AM','PM']} onChange={v=>setMinute((hours%12+(v==='PM'?12:0))*60+mins)}/>} {editor.kind==='clock'&&<Toggle label="Time format" value={format24?'24 HR':'12 HR'} values={['12 HR','24 HR']} onChange={v=>setFormat24(v==='24 HR')}/>}</div>
    </>}
  </div><div className="editor-actions"><RoundButton icon="close" label="Cancel" onClick={close}/><RoundButton icon="check" label="Save" onClick={save}/></div></div>;
}
export function SpaDevices() {
  const {s,dispatch,go,patch,t}=useUI(); const st=status(s);const cfg=s.settings;
  const devices = [
    ...[0, 1].map(i => ({ id: `pump-${i}`, label: `${t('Pump')} ${i+1}`, level: st.pumps[i], kind: 'pump' as const, number: String(i+1), click: () => dispatch({type:'pump', index:i}), disabled: st.hold })),
    { id: 'circ', label: t('Circulation'), level: Number(st.circulation), kind: 'circulation' as const, number: '', click: () => dispatch({type:'state',patch:{primeCirculation:!s.primeCirculation}}), disabled: !s.priming || st.hold },
    { id: 'light', label: t('Light'), level: Number(st.light), kind: 'light' as const, number: '', click: () => patch({lightOn:!cfg.lightOn}), disabled: false },
  ];
  return <><SwipeZone className="spa-return" inverted={cfg.inverted} label="Return Home gesture" onSwipe={d=>d==='down'&&go('home')}><button aria-label={t('Set Temperature')} onClick={()=>go('temperature')}>{st.validTemperature?tempText(s.sampledC!,cfg.units):'----'}</button></SwipeZone>
    {s.priming&&<div className="priming-label">{t('Priming…')}<button className="text-button" onClick={()=>dispatch({type:'prime',on:false})}>{t('Exit Priming')}</button></div>}
    <div className="device-grid four-devices">{devices.map(d=><button key={d.id} className={`spa-device ${d.level?'running':''}`} aria-label={`${d.label}: ${d.level}`} disabled={d.disabled} onClick={d.click}><DeviceSymbol kind={d.kind} number={d.number} running={!!d.level}/><small>{d.label}</small></button>)}</div>
    <SwipeZone className="side-handle left" inverted={cfg.inverted} label="Lights gesture" onSwipe={()=>go('chroma')}><Icon name="sun" size={34}/></SwipeZone>
  </>;
}
