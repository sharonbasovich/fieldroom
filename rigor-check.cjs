// Uses no network: secure loopback-origin requests are fulfilled from local files.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('node:fs/promises');const assert=require('node:assert/strict');
const origin='http://localhost:4173';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {})});
 const context=await browser.newContext({viewport:{width:1280,height:900}});const errors=[],passed=[];
 const serve=async context=>context.route(origin+'/**',async route=>{const name=new URL(route.request().url()).pathname.slice(1)||'index.html';if(!['index.html','style.css','app.mjs','model.mjs','storage.mjs'].includes(name))return route.fulfill({status:404,body:''});return route.fulfill({contentType:name.endsWith('mjs')?'text/javascript':name.endsWith('css')?'text/css':'text/html',body:await fs.readFile(name)});});
 await serve(context);
 const make=async()=>{const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(origin);return p;};
 const p=await make();const q=await make();
 const settle=p=>p.waitForFunction(()=>!document.querySelector('#main').hasAttribute('aria-busy'));
 const click=async(p,name)=>{await p.getByRole('button',{name,exact:true}).click();await settle(p);};
 const phase=(p,phase)=>p.waitForFunction(phase=>document.querySelector('#slip').innerText.toLowerCase().includes(phase),phase);
 const read=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('fieldroom-v1')));
 const report=async(name,fn)=>{console.log('Checking: '+name);await fn();passed.push(name);};
 const reset=async()=>{await p.evaluate(()=>localStorage.clear());await p.reload();await q.reload();};
 const select=async()=>click(p,'Select Over-ear headphones');
 const confirm=async()=>{await click(p,'Review selection →');await p.locator('#agree').check();await click(p,'Confirm simulated hold');};
 const capture=async(name,page=p)=>{await settle(page);await page.screenshot({path:'demo/'+name+'.png',fullPage:true,animations:'disabled'});};
 await fs.mkdir('demo',{recursive:true});
 await report('Empty progress does not claim selection',async()=>assert.equal(await p.locator('[aria-current="step"]').count(),0));
 await select();await phase(q,'selected · not confirmed');
 await report('Native same-origin storage event synchronizes selected state',async()=>assert.equal((await read(q)).item,'headphones'));
 await capture('02-selected');
 await click(p,'Review selection →');await p.locator('#agree').check();await p.reload();
 await report('Review reload requires a fresh policy acknowledgment',async()=>{assert.equal(await p.locator('#agree').isChecked(),false);assert.equal(await p.locator('#confirm').isDisabled(),true);});
 await p.locator('#agree').check();
 await report('Two immediate confirmation clicks create one hold and no pickup',async()=>{await p.locator('#confirm').evaluate(b=>{b.click();b.click();});await settle(p);await phase(p,'confirmed · awaiting pickup');const s=await read(p);assert.equal(s.phase,'confirmed');assert.equal(s.receipt.pickedUp,undefined);});
 await capture('03-confirmed');const receipt=(await read(p)).receipt.id;
 await p.reload();await phase(p,'confirmed · awaiting pickup');assert.equal((await read(p)).receipt.id,receipt);
 await click(p,'Record simulated pickup →');await capture('04-borrowed');
 await report('Borrowed reload preserves due time and prevents cancellation/reset',async()=>{const s=await read(p);await p.reload();await phase(p,'borrowed · loan active');assert.equal((await read(p)).receipt.due,s.receipt.due);assert.equal(await p.locator('#cancel').count(),0);assert.equal(await p.locator('#reset').isDisabled(),true);});
 await click(p,'Record simulated return');await capture('01-result');
 await report('Returned reload retains receipt and closure',async()=>{await p.reload();await phase(p,'returned · loan closed');assert.equal((await read(p)).receipt.id,receipt);});
 await click(p,'Borrow something else →');await select();await confirm();await click(p,'Cancel hold');
 await report('Cancelled confirmed hold stays cancelled after reload',async()=>{await p.reload();await phase(p,'nothing selected');assert.equal((await read(p)).receipt,null);});
 await select();await click(p,'Review selection →');await p.locator('#agree').check();
 await report('Confirm rereads stale availability even without a storage event',async()=>{await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('fieldroom-v1'));s.unavailable.push('headphones');localStorage.setItem('fieldroom-v1',JSON.stringify(s));});await click(p,'Confirm simulated hold');assert.equal((await read(p)).phase,'select');assert.match(await p.locator('#notice').innerText(),/changed/);assert.equal(await p.locator('#agree').isChecked(),false);await p.locator('#agree').check();await click(p,'Confirm simulated hold');await phase(p,'nothing selected');assert.match(await p.locator('#notice').innerText(),/Availability changed/);});
 await reset();await select();await click(p,'Review selection →');await p.locator('#agree').check();
 await report('Queued confirmation rejects context changed while awaiting lock',async()=>{
  await q.evaluate(()=>{window.releaseLock=null;window.lockReady=new Promise(ready=>{navigator.locks.request('fieldroom-v1',()=>{ready();return new Promise(resolve=>window.releaseLock=resolve);});});return window.lockReady;});
  await p.locator('#confirm').click(); // action queued behind other tab
  await q.evaluate(()=>{const s=JSON.parse(localStorage.getItem('fieldroom-v1'));s.item='calculator';s.review=false;localStorage.setItem('fieldroom-v1',JSON.stringify(s));window.releaseLock();});
  await settle(p);assert.equal((await read(p)).phase,'select');assert.equal((await read(p)).item,'calculator');assert.match(await p.locator('#notice').innerText(),/changed/);
 });
 await report('Storage key removal clears stale controls',async()=>{await q.evaluate(()=>localStorage.removeItem('fieldroom-v1'));await phase(p,'nothing selected');assert.equal(await p.locator('#confirm').count(),0);});
 await select();
 await report('Storage clear synchronizes without silently rewriting cleared data',async()=>{await q.evaluate(()=>localStorage.clear());await phase(p,'nothing selected');assert.equal(await p.evaluate(()=>localStorage.getItem('fieldroom-v1')),null);});
 await select();
 await report('Malformed cross-tab data resets safely and warns',async()=>{await q.evaluate(()=>localStorage.setItem('fieldroom-v1','{broken'));await phase(p,'nothing selected');assert.match(await p.locator('#notice').innerText(),/invalid/);});
 await reset();await select();await confirm();
 await report('Browser back and forward never undo a confirmed transaction',async()=>{await p.evaluate(()=>{history.pushState({},'', '#equipment');history.pushState({},'', '#slip');});await p.goBack();await phase(p,'confirmed · awaiting pickup');await p.goForward();await phase(p,'confirmed · awaiting pickup');assert.equal((await read(p)).phase,'confirmed');});
 await report('Returning from a different document restores latest stored state',async()=>{await p.goto('about:blank');await click(q,'Record simulated pickup →');await p.goBack();await phase(p,'borrowed · loan active');});
 await click(p,'Record simulated return');await click(p,'Borrow something else →');
 await p.setViewportSize({width:320,height:720});
 await report('Mobile selection moves focus into the visible slip',async()=>{await select();const box=await p.locator('#slip-title').boundingBox();assert.ok(box.y>=0&&box.y+box.height<=720);assert.equal(await p.evaluate(()=>document.activeElement.id),'slip-title');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);});
 await capture('05-mobile-selected');await click(p,'Review selection →');await p.locator('#agree').check();await click(p,'Confirm simulated hold');
 await report('Mobile confirm/cancel focus remains visible',async()=>{await click(p,'Cancel hold');const box=await p.locator('#slip-title').boundingBox();assert.ok(box.y>=0&&box.y+box.height<=720);});
 await report('Reduced motion disables both animation and button transitions',async()=>{await p.emulateMedia({reducedMotion:'reduce'});await select();assert.equal(await p.locator('#slip').evaluate(e=>getComputedStyle(e).animationName),'none');assert.equal(await p.locator('#review').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');});
 // Storage failures are tested in separate contexts so prototype state is isolated.
 for(const mode of ['read','write','locks']){
  const c=await browser.newContext();await serve(c);await c.addInitScript(mode=>{if(mode==='read')Storage.prototype.getItem=()=>{throw Error('blocked read')};if(mode==='write')Storage.prototype.setItem=()=>{throw Error('blocked write')};if(mode==='locks')Object.defineProperty(navigator,'locks',{value:undefined});},mode);
  const r=await c.newPage();r.on('pageerror',e=>errors.push(e.message));await r.goto(origin);await click(r,'Select Over-ear headphones');
  await report(`${mode} unavailable: session-only full journey remains usable`,async()=>{await click(r,'Review selection →');await r.locator('#agree').check();await click(r,'Confirm simulated hold');await click(r,'Record simulated pickup →');await click(r,'Record simulated return');await phase(r,'returned · loan closed');assert.match(await r.locator('#storage').innerText(),/Session only/);});await c.close();
 }
 await report('No uncaught browser errors',async()=>assert.deepEqual(errors,[]));
 const payload=(await Promise.all(['index.html','style.css','app.mjs','model.mjs','storage.mjs'].map(n=>fs.stat(n)))).reduce((n,s)=>n+s.size,0);
 await fs.writeFile('rigor-verification.json',JSON.stringify({date:new Date().toISOString(),transport:'Intercepted local files at loopback origin; no genuine HTTP browser serving claim',browser:await browser.version(),checks:passed.length,passed,errors,payloadBytes:payload},null,2));console.log(`${passed.length} targeted browser checks passed; ${payload} core bytes`);await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
