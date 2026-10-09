import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { HeatModeSymbol, Icon } from './icons';
import { DragScroll, SwipeZone } from './gestures';
import { bounds, clockText, fromC, reducer, restore, serialize, status, STORAGE_KEY, tempText, type Settings } from './model';
import { TemperatureDial } from './Dial';
import { menus, translate, UIContext, type Editor } from './ui';
import { SettingsMenu, SettingsScreen, SideNav, SpaDevices, ValueEditor } from './Screens';
import { ConnectionsScreen } from './Connections';
import { SimulatorTools } from './SimulatorTools';

export default function App() {
  const [s, dispatch] = useReducer(reducer, undefined, () => { try { return restore(localStorage.getItem(STORAGE_KEY)); } catch { return restore(null); } });
  const [screen, setScreen] = useState('home'); const [editor,setEditor]=useState<Editor|null>(null);
  const host = useRef<HTMLDivElement>(null); const [scale,setScale]=useState(1);
  const [speed,setSpeed]=useState(1);const [paused,setPaused]=useState(false);
  const [sleeping,setSleeping]=useState(false);const [wakePrompt,setWakePrompt]=useState(false);
  const [lockPrompt,setLockPrompt]=useState<'panel'|'settings'|null>(null);const [unlockStep,setUnlockStep]=useState(0);
  const lastActivity=useRef(Date.now());const [storageError,setStorageError]=useState(false);const stateRef=useRef(s);stateRef.current=s;
  const cfg=s.settings; const st=status(s);const t=(v:string)=>translate(cfg.language,v);
  const activity=useCallback(()=>{lastActivity.current=Date.now();},[]);
  const patch=(p:Partial<Settings>)=>{
    if(cfg.settingsLocked&&!lockPrompt&&!('lightOn' in p)&&!('inverted' in p)){setLockPrompt('settings');setUnlockStep(0);return;}
    dispatch({type:'settings',patch:p});
  };
  const go=(to:string)=>{
    activity();
    if(cfg.panelLocked){setLockPrompt('panel');setUnlockStep(0);return;}
    if(cfg.settingsLocked&& !['home','spa','temperature','messages','settings'].includes(to)){setLockPrompt('settings');setUnlockStep(0);return;}
    if(to==='chroma'&&!cfg.capabilities.chromazone){patch({lightOn:!cfg.lightOn});return;}
    if(to==='clim'&&!cfg.capabilities.clim8zone)return;
    setEditor(null);setScreen(to);
  };
  const edit=(e:Editor)=>{if(cfg.settingsLocked){setLockPrompt('settings');return;}setEditor(e);};
  useEffect(()=>{const ro=new ResizeObserver(([e])=>setScale(e.contentRect.width/800));ro.observe(host.current!);return()=>ro.disconnect();},[]);
  useEffect(()=>{let last=performance.now();const id=setInterval(()=>{const now=performance.now();const dt=Math.min(5,(now-last)/1000);last=now;if(!paused)dispatch({type:'tick',seconds:dt*speed});if(Date.now()-lastActivity.current>=stateRef.current.settings.sleepAfter*1000)setSleeping(true);},250);return()=>clearInterval(id);},[paused,speed]);
  const save=useCallback(()=>{try{localStorage.setItem(STORAGE_KEY,serialize(stateRef.current));}catch{setStorageError(true);}},[]);
  useEffect(()=>{save();},[s.settings,save]);
  useEffect(()=>{const id=setInterval(save,5000);window.addEventListener('pagehide',save);return()=>{clearInterval(id);window.removeEventListener('pagehide',save);};},[save]);
  useEffect(()=>{document.documentElement.lang='en';},[]);
  const back=()=>{if(editor){setEditor(null);return;}go(screen==='language'?'general':['spa','temperature','messages','settings','home'].includes(screen)?'home':'settings');};
  const title=editor?(editor.kind==='clock'?'Time':editor.kind==='sleep'?'Sleep':editor.kind.startsWith('filter')?'Filter Cycles':'Light Cycles'):screen==='settings'?'Settings':screen==='language'?'Language':menus.find(m=>m[0]===screen)?.[1]||screen;
  const settingsLayout=!['home','temperature','spa','messages'].includes(screen);
  const hasReminder=cfg.reminders&&!s.reminderDismissed;
  const unlock=(number:number)=>{
    if(number===1){setUnlockStep(1);return;}
    if(unlockStep!==1){setUnlockStep(0);return;}
    if(lockPrompt){patch(lockPrompt==='panel'?{panelLocked:false}:{settingsLocked:false});setLockPrompt(null);}
    else{setSleeping(false);setWakePrompt(false);}
    setUnlockStep(0);activity();
  };
  const reset=()=>{dispatch({type:'reset'});setScreen('home');setEditor(null);setSleeping(false);setLockPrompt(null);setWakePrompt(false);setSpeed(1);setPaused(false);activity();};
  return <UIContext.Provider value={{s,dispatch,go,edit,t,patch}}><main className="workspace">
    <header className="site-heading"><div><span className="eyebrow">BALBOA · CONTROL PANEL SIMULATOR</span><h1>SpaTouch <b>4</b><span>Rev. A</span></h1></div><span className="local-tag"><i/> Browser simulation</span></header>
    <div className="device-shell"><div className="panel-host" ref={host} style={{height:480*scale}}><div className="panel" lang={cfg.language} data-screen={screen} style={{transform:`scale(${scale}) ${cfg.inverted?'translate(800px,480px) rotate(180deg)':''}`,filter:`brightness(${.3+cfg.brightness*.007})`}} onPointerDownCapture={e=>{
      activity();
      if(cfg.panelLocked&&!sleeping&&!lockPrompt&&!(e.target as HTMLElement).closest('.unlock-overlay')){e.preventDefault();e.stopPropagation();setUnlockStep(0);setLockPrompt('panel');}
    }} onPointerMoveCapture={e=>{if(e.buttons===1)activity();}} onWheelCapture={activity} onKeyDownCapture={e=>{activity();if(cfg.panelLocked&&!lockPrompt){e.preventDefault();e.stopPropagation();setLockPrompt('panel');setUnlockStep(0);}}}>
      <div className="panel-content" inert={sleeping||!!lockPrompt}>
      {(screen==='home'||screen==='temperature')&&<>
        <div className="home-status"><button aria-label="Invert display" onClick={()=>patch({inverted:!cfg.inverted})}><Icon name="invert" size={36}/></button><button className="clock" aria-label="Time" onClick={()=>{go('general');if(!cfg.settingsLocked)edit({kind:'clock',returnTo:'general'});}}>{clockText(s.clock,cfg.format24)}</button>
          <button aria-label="Messages" onClick={()=>go('messages')} className={!cfg.timeSet||hasReminder?'info-icon':'dim'}><Icon name="info" size={25}/></button><button aria-label="Software Update" className={s.updateInstalled?'dim':''} onClick={()=>go('update')}><Icon name="download" size={36}/></button>
          <SwipeZone inverted={cfg.inverted} className="settings-handle" label="Settings gesture" onSwipe={d=>d==='down'&&go('settings')}><Icon name="settings" size={25}/></SwipeZone>
          <span className={st.ozone?'active':'dim'} title="Ozone">O₃</span><span className={st.cleanup?'active':'dim'} title={t('Cleanup Cycle')}><Icon name="clean"/></span><span className={`filter-status ${st.filterIds.length?'active':'dim'}`} title={t('Filter Cycles')}><Icon name="filter"/><small>{st.filterIds.join('+')}</small></span><button className="heat-mode-status" aria-label={`${t('Heat Mode')}: ${t(cfg.heatMode)}`} title={t(cfg.heatMode)} onClick={()=>{if(cfg.panelLocked){setLockPrompt('panel');setUnlockStep(0);return;}patch({heatMode:cfg.heatMode==='Ready'?'Rest':'Ready'});}}><HeatModeSymbol rest={cfg.heatMode==='Rest'}/></button><span className="dim"><Icon name="moon"/></span><button aria-label="Wi-Fi" className={s.connection==='Offline'?'dim':'active'} title={t(s.connection)} onClick={()=>go('connections')}><Icon name="wifi"/></button><button aria-label="Security" onClick={()=>go('security')} className={cfg.panelLocked||cfg.settingsLocked?'active':'dim'}><Icon name="lock"/></button>
        </div>
        <div className="dial-wrap"><TemperatureDial water={st.validTemperature?tempText(s.sampledC!,cfg.units):'----'} target={fromC(cfg.targetC,cfg.units)} units={cfg.units} heating={st.heating} editing={screen==='temperature'} min={bounds(cfg.range,cfg.units)[0]} max={bounds(cfg.range,cfg.units)[1]} inverted={cfg.inverted} onOpen={()=>go(screen==='home'?'temperature':'home')} onChange={value=>{if(cfg.settingsLocked){setLockPrompt('settings');return;}dispatch({type:'target',value});}}/></div>
        <SwipeZone className="side-handle left" label="Lights gesture" inverted={cfg.inverted} onSwipe={()=>go('chroma')}><button aria-label={t('Light')} onClick={()=>patch({lightOn:!cfg.lightOn})} style={{color:st.light?cfg.color:undefined}}><Icon name="sun" size={42}/></button></SwipeZone>
        <SwipeZone className="side-handle right" label="Spa gesture" inverted={cfg.inverted} onSwipe={()=>go('spa')}><Icon name="pump" size={42}/></SwipeZone>
      </>}
      {screen==='spa'&&<SpaDevices/>}
      {screen==='messages'&&<><button className="corner-back" aria-label={t('Back')} onClick={()=>go('home')}><Icon name="close" size={36}/></button><div className="message-screen"><Icon name="info" size={36}/>{!cfg.timeSet?<><p>{t('Message Code 40')}</p><p>{t('Set the time')}</p><button className="action-button" onClick={()=>{go('general');edit({kind:'clock',returnTo:'general'});}}>{t('Time')}</button></>:hasReminder?<><p>{t('Check water')}</p><button className="action-button" onClick={()=>dispatch({type:'state',patch:{reminderDismissed:true}})}>{t('Dismiss')}</button></>:<p>{t('No messages')}</p>}</div></>}
      {settingsLayout&&(screen==='connections'?<ConnectionsScreen/>:<><div className="settings-header"><small>Software Version 1</small><h2>{t(title)}</h2><button aria-label={t(screen==='settings'?'Home':'Back')} onClick={back}><Icon name={screen==='settings'?'home':'back'} size={32}/></button></div>{screen==='settings'?<SettingsMenu/>:<><SideNav screen={screen}/>{editor?<div className="settings-content editor-content"><ValueEditor key={`${editor.kind}-${editor.index}`} editor={editor} close={()=>setEditor(null)}/></div>:<DragScroll className="settings-content" inverted={cfg.inverted}><SettingsScreen key={screen} screen={screen}/></DragScroll>}</>}</>)}
      </div>
      {(sleeping||lockPrompt)&&<div className={`unlock-overlay ${lockPrompt?'lock-overlay':''}`} onPointerDown={e=>e.stopPropagation()} onClick={()=>{if(sleeping&&!lockPrompt){if(cfg.tapToWake){setSleeping(false);setWakePrompt(false);activity();}else setWakePrompt(true);}}}>
        {lockPrompt?<><Icon name="lock" size={44}/><h3>{t(lockPrompt==='panel'?'Panel locked':'Settings locked')}</h3><p>{t('Press 1 then 2 to unlock')}</p></>:wakePrompt?<p>Tap to Wake.</p>:<button className="sleep-touch" aria-label="Wake screen" onClick={()=>setWakePrompt(true)}/>}
        {(lockPrompt||wakePrompt)&&<div className="unlock-buttons"><button className={unlockStep===1?'armed':''} aria-label="Unlock 1" onClick={e=>{e.stopPropagation();unlock(1);}}>1</button><button aria-label="Unlock 2" onClick={e=>{e.stopPropagation();unlock(2);}}>2</button></div>}
        {lockPrompt&&<button className="corner-back" aria-label={t('Cancel')} onClick={()=>setLockPrompt(null)}><Icon name="close"/></button>}
      </div>}
    </div></div><div className="device-brand"><span>BALBOA</span><span>SPA TOUCH 4™</span></div></div>
    <div className="gesture-help"><span>↕</span> Hold the left mouse button and drag to swipe <span>·</span> Tap the dial to adjust the temperature</div>
    <SimulatorTools s={s} dispatch={dispatch} speed={speed} setSpeed={setSpeed} paused={paused} setPaused={setPaused} reset={reset} wake={()=>{setSleeping(false);setWakePrompt(false);activity();}} navigate={to=>{setScreen(to);setEditor(null);activity();}}/>
    {storageError&&<p className="storage-warning">Your browser cannot save settings. The simulation will continue for this session.</p>}
    <footer className="site-footer"><span>Document 42410 · Rev. A · MVP Release</span><span>Independent simulator · No hardware connection</span></footer>
  </main></UIContext.Provider>;
}
