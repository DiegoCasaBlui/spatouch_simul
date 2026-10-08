import { test, expect, type Page } from '@playwright/test';

async function swipe(page:Page, selector:string, dx:number, dy:number) {
  const box=await page.locator(selector).boundingBox();if(!box)throw Error(`Missing ${selector}`);
  const x=box.x+box.width/2,y=box.y+box.height/2;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y+dy,{steps:12});await page.mouse.up();
}
async function settings(page:Page){await swipe(page,'[aria-label="Settings gesture"]',0,90);await expect(page.locator('.panel')).toHaveAttribute('data-screen','settings');}
async function menu(page:Page,name:string){await page.locator('.settings-list').getByRole('button',{name,exact:true}).click();}
async function tools(page:Page){if(!await page.locator('.sim-tools').getAttribute('open'))await page.locator('.sim-tools summary').click();}
test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload();});

test('home, startup reading, temperature buttons and radial drag',async({page})=>{
  await expect(page.locator('.water-value')).toHaveText('----');
  await tools(page);await page.getByRole('button',{name:'+1 min',exact:true}).click();await expect(page.locator('.water-value')).not.toHaveText('----');
  await page.getByRole('button',{name:'Water temperature',exact:true}).click();await expect(page.locator('.target-value')).toHaveText('100');
  await page.getByRole('button',{name:'Increase temperature'}).click();await expect(page.locator('.target-value')).toHaveText('101');
  await page.getByRole('button',{name:'Decrease temperature'}).click();await expect(page.locator('.target-value')).toHaveText('100');
  const dial=page.getByRole('slider',{name:'Set temperature dial'});await dial.focus();await page.keyboard.press('End');await expect(page.locator('.target-value')).toHaveText('104');await dial.scrollIntoViewIfNeeded();
  const b=await dial.boundingBox();if(!b)throw Error('no dial');await page.mouse.move(b.x+b.width*.84,b.y+b.height*.84);await page.mouse.down();await page.mouse.move(b.x+b.width*.5,b.y+b.height*.05,{steps:10});await page.mouse.up();await expect(page.locator('.target-value')).not.toHaveText('100');
  await page.getByRole('button',{name:'Back to Home',exact:true}).click();await expect(page.locator('.panel')).toHaveAttribute('data-screen','home');
  await page.locator('.sim-tools summary').click();await page.locator('.panel-host').scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/home-desktop.png',fullPage:true});
});
test('settings drag, time cancel/save and language persist',async({page})=>{
  await settings(page);await menu(page,'General');await page.locator('.time-value').click();
  await page.getByRole('spinbutton',{name:'Hours'}).focus();await page.keyboard.press('ArrowDown');await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.locator('.time-value')).toContainText('12:00');
  await page.locator('.time-value').click();await page.getByRole('spinbutton',{name:'Hours'}).focus();await page.keyboard.press('ArrowDown');await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.locator('.time-value')).toContainText('1:00');
  await page.getByRole('group',{name:'Units',exact:true}).getByRole('button',{name:'C',exact:true}).click();
  await page.getByRole('button',{name:'English',exact:true}).click();await page.getByRole('button',{name:'Español',exact:true}).click();await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang','es');await expect(page.locator('.clock')).toHaveText('1:00');
});
test('dragging the menu does not activate rows and all settings open',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await settings(page);await swipe(page,'.settings-list',0,-190);await expect(page.locator('.panel')).toHaveAttribute('data-screen','settings');
  const names=['General','Audio','Connections','Heat Mode','Clim8zone','Light Cycles','CHROMAZON3','Filter Cycles','Hold','Cleanup Cycle','Sleep','Security','Diagnostics','Software Update','About'];
  for(const name of names){await menu(page,name);await expect(page.locator('.settings-header h2')).toHaveText(name);await page.getByRole('button',{name:'Back',exact:true}).click();}
  await menu(page,'General');await page.screenshot({path:'test-results/general.png'});expect(errors).toEqual([]);
});
test('filter draft, cycle two and midnight duration',async({page})=>{
  await settings(page);await menu(page,'Filter Cycles');await page.getByRole('button',{name:'Cycle 2',exact:true}).click();await expect(page.getByRole('button',{name:'Cycle 2',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Start Time 1',exact:true}).click();await swipe(page,'[aria-label="Hours"]',0,-65);await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.getByRole('button',{name:'Start Time 1',exact:true})).toContainText('5:30');
  await page.screenshot({path:'test-results/filters.png'});
});
test('devices, single-speed pumps, circulation and Priming',async({page})=>{
  await swipe(page,'[aria-label="Spa gesture"]',-90,0);await page.getByRole('button',{name:'Pump 1: 0',exact:true}).click();await expect(page.getByRole('button',{name:'Pump 1: 1',exact:true})).toBeVisible();
  await expect(page.locator('.spa-device')).toHaveCount(4);
  await expect(page.getByRole('button',{name:'Device page 2'})).toHaveCount(0);
  await page.screenshot({path:'test-results/devices-updated.png'});
  await page.getByRole('button',{name:'Pump 1: 1',exact:true}).click();
  await expect(page.getByRole('button',{name:'Pump 1: 0',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:/^Circulation:/})).toBeDisabled();
  await tools(page);await page.getByRole('button',{name:'Iniciar Priming',exact:true}).click();await expect(page.getByRole('button',{name:'Circulation: 0',exact:true})).toBeEnabled();await page.getByRole('button',{name:'Circulation: 0',exact:true}).click();await expect(page.getByRole('button',{name:'Circulation: 1',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Exit Priming',exact:true}).click();await swipe(page,'[aria-label="Return Home gesture"]',0,100);await expect(page.locator('.panel')).toHaveAttribute('data-screen','home');
});
test('lights distinguish click from swipe, audio changes tracks',async({page})=>{
  await page.getByRole('button',{name:'Light',exact:true}).click();await swipe(page,'[aria-label="Lights gesture"]',90,0);await expect(page.locator('.panel')).toHaveAttribute('data-screen','chroma');await expect(page.getByRole('group',{name:'Light',exact:true}).getByRole('button',{name:'On',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Color #f25192'}).click();await page.getByRole('button',{name:'Back',exact:true}).click();await page.getByRole('button',{name:'Home',exact:true}).click();await page.getByRole('button',{name:'Next track',exact:true}).click();await expect(page.locator('.music-handle strong')).toHaveText('Water Garden');
  await swipe(page,'[aria-label="Music gesture"]',0,-110);await expect(page.locator('.panel')).toHaveAttribute('data-screen','music');await page.getByRole('button',{name:'Play',exact:true}).click();await expect(page.locator('.record')).toHaveClass(/playing/);
});
test('sleep uses real time and requires 1 then 2',async({page})=>{
  await page.clock.install();await settings(page);await menu(page,'Sleep');await page.getByRole('button',{name:'1 min',exact:true}).click();await page.getByRole('spinbutton',{name:'Sleep duration'}).focus();await page.keyboard.press('ArrowUp');await page.keyboard.press('ArrowUp');await page.keyboard.press('ArrowUp');await page.getByRole('button',{name:'Save',exact:true}).click();
  await page.clock.fastForward(11000);await page.getByRole('button',{name:'Wake screen'}).click();await page.getByRole('button',{name:'Unlock 2'}).click();await expect(page.locator('.unlock-overlay')).toBeVisible();await page.getByRole('button',{name:'Unlock 1'}).click();await page.getByRole('button',{name:'Unlock 2'}).click();await expect(page.locator('.unlock-overlay')).toHaveCount(0);
});
test('settings and panel security cannot be changed without unlocking',async({page})=>{
  await settings(page);await menu(page,'Security');await page.getByRole('group',{name:'Settings Lock'}).getByRole('button',{name:'On',exact:true}).click();await page.getByRole('group',{name:'Settings Lock'}).getByRole('button',{name:'Off',exact:true}).click();await expect(page.locator('.lock-overlay')).toBeVisible();await page.getByRole('button',{name:'Unlock 1'}).click();await page.getByRole('button',{name:'Unlock 2'}).click();
  await page.getByRole('group',{name:'Panel Lock'}).getByRole('button',{name:'On',exact:true}).click();await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page.locator('.lock-overlay')).toBeVisible();await page.getByRole('button',{name:'Unlock 1'}).click();await page.getByRole('button',{name:'Unlock 2'}).click();await expect(page.locator('.lock-overlay')).toHaveCount(0);
});
test('inversion preserves geometry and reverses gesture coordinates',async({page})=>{
  const before=await page.locator('.panel').boundingBox();await page.getByRole('button',{name:'Invert display'}).click();const after=await page.locator('.panel').boundingBox();expect(after!.x).toBeCloseTo(before!.x);expect(after!.y).toBeCloseTo(before!.y);
  await swipe(page,'[aria-label="Settings gesture"]',0,-90);await expect(page.locator('.panel')).toHaveAttribute('data-screen','settings');await menu(page,'General');await page.locator('.time-value').click();await swipe(page,'[aria-label="Hours"]',0,65);await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.locator('.time-value')).toContainText('1:00');
});
test('mobile viewport fits panel and supports pointer navigation',async({page})=>{
  await page.setViewportSize({width:390,height:844});await expect(page.locator('.panel-host')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await swipe(page,'[aria-label="Settings gesture"]',0,50);await menu(page,'General');await page.screenshot({path:'test-results/mobile.png',fullPage:true});
});

test('optional cycles, heat, connections and update act on simulator state',async({page})=>{
  await settings(page);await menu(page,'Hold');await page.getByRole('button',{name:'Start Hold',exact:true}).click();await expect(page.getByRole('button',{name:'Exit Hold',exact:true})).toBeVisible();await page.getByRole('button',{name:'Exit Hold',exact:true}).click();await page.getByRole('button',{name:'Back',exact:true}).click();
  await menu(page,'Cleanup Cycle');await page.getByRole('button',{name:'Start Cleanup',exact:true}).click();await expect(page.getByRole('button',{name:'Stop Cleanup',exact:true})).toBeVisible();await page.getByRole('button',{name:'Stop Cleanup',exact:true}).click();await page.getByRole('button',{name:'Back',exact:true}).click();
  await menu(page,'Heat Mode');await page.getByRole('group',{name:'Heat Mode',exact:true}).getByRole('button',{name:'Rest',exact:true}).click();await page.getByRole('group',{name:'Temperature range',exact:true}).getByRole('button',{name:'Low',exact:true}).click();await page.getByRole('group',{name:'M8',exact:true}).getByRole('button',{name:'On',exact:true}).click();await page.screenshot({path:'test-results/heat.png'});await page.getByRole('button',{name:'Back',exact:true}).click();
  await menu(page,'Connections');await page.getByRole('group',{name:'Connection',exact:true}).getByRole('button',{name:'Cloud',exact:true}).click();await expect(page.locator('.connection-illustration')).toContainText('Cloud');await page.getByRole('button',{name:'Back',exact:true}).click();
  await menu(page,'Software Update');await page.getByRole('button',{name:'Install demo update',exact:true}).click();await expect(page.getByRole('progressbar')).toBeVisible();await tools(page);await page.getByRole('button',{name:'+1 min',exact:true}).click();await expect(page.getByRole('button',{name:'Up to date',exact:true})).toBeDisabled();
});
test('touchscreen swipes and tap-to-wake work on mobile',async({playwright})=>{
  // Isolate Chromium's native touch clock from earlier tests that advance virtual time.
  const mobileBrowser=await playwright.chromium.launch({channel:'msedge'});
  const context=await mobileBrowser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();await page.goto('http://127.0.0.1:5173/');
  const box=await page.locator('[aria-label="Settings gesture"]').boundingBox();if(!box)throw Error('no gesture');
  const session=await context.newCDPSession(page);const x=box.x+box.width/2,y=box.y+box.height/2;
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+55}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect(page.locator('.panel')).toHaveAttribute('data-screen','settings');
  await menu(page,'Sleep');
  await page.getByRole('group',{name:'Tap to Wake',exact:true}).getByRole('button',{name:'On',exact:true}).tap();
  await expect(page.getByRole('group',{name:'Tap to Wake',exact:true}).getByRole('button',{name:'On',exact:true})).toHaveAttribute('aria-pressed','true');await page.clock.install();await page.clock.fastForward(61000);await expect(page.locator('.unlock-overlay')).toBeVisible();await page.getByRole('button',{name:'Wake screen'}).tap();await expect(page.locator('.unlock-overlay')).toHaveCount(0);await mobileBrowser.close();
});
