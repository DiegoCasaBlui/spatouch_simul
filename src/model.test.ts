import { describe, it, expect } from 'vitest';
import { advance, bounds, cycleDuration, defaults, fromC, inCycle, initialState, reducer, restore, serialize, setTarget, status, toC } from './model';

describe('Rev. A temperatures',()=>{
  it('uses the four documented ranges and clamps each set point',()=>{
    expect(bounds('High','F')).toEqual([80,104]);expect(bounds('Low','F')).toEqual([50,99]);
    expect(bounds('High','C')).toEqual([26.5,40]);expect(bounds('Low','C')).toEqual([10,37]);
    for(const units of ['F','C'] as const)for(const range of ['High','Low'] as const){const s={...defaults(),units,range};const [lo,hi]=bounds(range,units);expect(fromC(setTarget(s,-10).targetC,units)).toBeCloseTo(lo);expect(fromC(setTarget(s,200).targetC,units)).toBeCloseTo(hi);}
  });
  it('preserves the physical set point through unit changes and clamps a lower range',()=>{
    let s=initialState();s=reducer(s,{type:'target',value:104});s=reducer(s,{type:'settings',patch:{units:'C'}});expect(s.settings.targetC).toBeCloseTo(40);
    s=reducer(s,{type:'settings',patch:{range:'Low'}});expect(s.settings.targetC).toBe(37);
  });
  it('requires a minute of uninterrupted circulation and expires after an hour',()=>{
    let s=initialState({...defaults(),heatMode:'Rest'});expect(status(s).validTemperature).toBe(false);
    s=advance(s,59);expect(status(s).validTemperature).toBe(false);s=advance(s,1);expect(status(s).validTemperature).toBe(true);
    s=advance(s,3600);expect(status(s).validTemperature).toBe(false);
    s=reducer(s,{type:'pump',index:0});s=advance(s,60);expect(status(s).validTemperature).toBe(true);
  });
  it('heats in Ready but only heats Rest during a filter cycle',()=>{
    let s=advance(initialState(),60);expect(status(s).heating).toBe(true);expect(advance(s,3600).waterC).toBeGreaterThan(s.waterC);
    s=reducer(s,{type:'settings',patch:{heatMode:'Rest',timeSet:true}});expect(status(s).heating).toBe(false);
    s=reducer(s,{type:'clock',minute:300});expect(status(s).heating).toBe(true);
  });
});
describe('filter scheduling',()=>{
  it('handles midnight, boundaries, 24-hour cycles and disabled cycles',()=>{
    const c={enabled:true,start:1380,end:60};expect(inCycle(c,23*3600)).toBe(true);expect(inCycle(c,30*60)).toBe(true);expect(inCycle(c,3600)).toBe(false);expect(cycleDuration(c)).toBe(120);
    expect(inCycle({...c,enabled:false},0)).toBe(false);expect(cycleDuration({...c,end:1380})).toBe(1440);
  });
  it('reports overlap and does not skip a short cycle during time acceleration',()=>{
    let s=initialState({...defaults(),timeSet:true,heatMode:'Rest',filters:[{enabled:true,start:1,end:3},{enabled:true,start:2,end:4}]},0);
    s={...s,startup:false,waterC:20};const after=advance(s,300);expect(after.lastSample).not.toBeNull();expect(after.waterC).toBeGreaterThan(s.waterC);
    s={...s,clock:150};expect(status(s).filterIds).toEqual([1,2]);
  });
  it('keeps relative timers and sample ages intact when setting the clock',()=>{
    let s=advance(initialState(),60);s={...s,holdUntil:s.clock+3600,cleanupDue:s.clock+1800};const n=reducer(s,{type:'clock',minute:10});
    expect(n.holdUntil-n.clock).toBe(3600);expect(n.cleanupDue!-n.clock).toBe(1800);expect(n.clock-n.lastSample!).toBe(s.clock-s.lastSample!);
  });
});
describe('equipment and persistence',()=>{
  it('cycles pump speeds and enables circulation control only during Priming',()=>{
    let s=initialState();for(const value of [1,0]){s=reducer(s,{type:'pump',index:0});expect(s.manualPumps[0]).toBe(value);}
    s=reducer(s,{type:'prime',on:true});expect(status(s).heating).toBe(false);expect(status(s).circulation).toBe(false);
    s=reducer(s,{type:'state',patch:{primeCirculation:true}});expect(status(s).circulation).toBe(true);
    s=reducer(s,{type:'prime',on:false});expect(s.startup).toBe(true);
  });
  it('Hold stops output and cleanup starts after the final manually used device stops',()=>{
    let s=initialState();s={...s,holdUntil:s.clock+3600};expect(status(s).flow).toBe(false);expect(reducer(s,{type:'pump',index:0}).manualPumps[0]).toBe(0);
    s={...s,holdUntil:0,settings:{...s.settings,heatMode:'Rest'},startup:false};for(let i=0;i<2;i++)s=reducer(s,{type:'pump',index:0});
    expect(s.cleanupDue).toBe(s.clock+1800);s=advance(s,1800);expect(status(s).cleanup).toBe(true);
  });
  it('saves settings and clock but restarts transient state',()=>{
    let s=initialState({...defaults(),units:'C',timeSet:true});s={...s,priming:true,connection:'Cloud',wifiNetwork:'Spa Home',cmsCode:'WNZ-69070',manualPumps:[2,1,0,0,0,0,0,0]};
    const r=restore(serialize(s));expect(r.settings).toEqual(s.settings);expect(r.clock).toBe(s.clock);expect(r.priming).toBe(false);expect(r.manualPumps.every(n=>n===0)).toBe(true);expect(r.lastSample).toBeNull();expect(r.wifiNetwork).toBeNull();expect(r.cmsCode).toBe('');
  });
  it('migrates the old equipment profile without losing user settings',()=>{
    const old=initialState({...defaults(),language:'es',brightness:45});
    old.settings.capabilities={...old.settings.capabilities,pumps:8,speeds:2,blower:true,circulation:false};
    const restored=restore(serialize(old));
    expect(restored.settings.capabilities).toMatchObject({pumps:2,speeds:1,blower:false,circulation:true});
    expect(restored.settings.language).toBe('es');expect(restored.settings.brightness).toBe(45);
    expect(restored.manualPumps).toEqual([0,0]);
  });
  it('recovers safely from broken or invalid browser storage',()=>{
    expect(restore('{')).toEqual(initialState());const p=JSON.parse(serialize(initialState()));p.settings.filters=[];expect(restore(JSON.stringify(p))).toEqual(initialState());
  });
  it('makes unit conversions reversible',()=>{expect(toC(fromC(31.25,'F'),'F')).toBeCloseTo(31.25);});
});
