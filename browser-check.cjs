const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('node:fs/promises');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {})});const page=await browser.newPage({viewport:{width:1280,height:1000}});let count=0;const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('http://localhost:4173/**',async route=>{const name=new URL(route.request().url()).pathname.slice(1)||'index.html';if(!['index.html','style.css','app.mjs','model.mjs','storage.mjs'].includes(name))return route.fulfill({status:404,body:''});await route.fulfill({contentType:name.endsWith('mjs')?'text/javascript':name.endsWith('css')?'text/css':'text/html',body:await fs.readFile(name)});});
const settled=()=>page.waitForFunction(()=>!document.querySelector('#main').hasAttribute('aria-busy'));const check=async(fn)=>{await settled();await fn();count++;};const text=()=>page.locator('#slip').innerText();const click=async n=>{await page.getByRole('button',{name:n,exact:true}).click();await settled();};
await page.goto('http://localhost:4173/');await page.screenshot({path:'desktop.png',fullPage:true,animations:'disabled'});
await check(async()=>assert.equal(await page.getByRole('button',{name:'Select USB-C charging kit',exact:true}).isDisabled(),true));
// Complete using real keyboard navigation only, including review agreement.
await page.keyboard.press('Tab');await page.keyboard.press('Enter');await page.keyboard.press('Tab');await page.keyboard.press('Enter');
await check(async()=>assert.match(await text(),/Selected · not confirmed/i));
await page.keyboard.press('Tab');await page.keyboard.press('Enter'); // review
await check(async()=>assert.match(await text(),/Review before confirming/i));
await page.keyboard.press('Tab');await page.keyboard.press('Space');await page.keyboard.press('Tab');await page.keyboard.press('Enter');
await check(async()=>assert.match(await text(),/Confirmed · awaiting pickup/i));
await page.reload();await check(async()=>assert.match(await text(),/Confirmed · awaiting pickup/i));
await page.keyboard.press('Tab');await page.keyboard.press('Enter');await check(async()=>assert.match(await text(),/Borrowed · loan active/i));
await page.reload();await check(async()=>assert.match(await text(),/Borrowed · loan active/i));await page.locator('#pickup').count().then(n=>assert.equal(n,0));
await page.locator('#slip-title').focus();await page.keyboard.press('Tab');await page.keyboard.press('Enter');await check(async()=>assert.match(await text(),/Returned · loan closed/i));await page.screenshot({path:'returned.png',fullPage:true,animations:'disabled'});
await click('Borrow something else →');await click('Select Scientific calculator');await click('Review selection →');await click('Back to selection');await check(async()=>assert.match(await text(),/Selected · not confirmed/i));await click('Clear selection');
await click('Select Scientific calculator');await page.locator('summary').click();await click('Simulate selected item becoming unavailable');await click('Review selection →');await page.locator('#agree').check();await click('Confirm simulated hold');await check(async()=>assert.match(await page.locator('#notice').innerText(),/Availability changed/));
await click('Select Over-ear headphones');await click('Review selection →');await page.locator('#agree').check();await click('Confirm simulated hold');await click('Cancel hold');await check(async()=>assert.match(await text(),/Nothing selected/));
await page.setViewportSize({width:320,height:720});await page.screenshot({path:'mobile.png',fullPage:true,animations:'disabled'});await check(async()=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true));
await page.emulateMedia({reducedMotion:'reduce'});await click('Select Over-ear headphones');await check(async()=>assert.equal(await page.locator('#slip').evaluate(el=>getComputedStyle(el).animationName),'none'));
await page.reload();await check(async()=>assert.match(await text(),/Selected · not confirmed/i));
await page.evaluate(()=>localStorage.setItem('fieldroom-v1','{"version":1,"phase":"borrowed"}'));await page.reload();await check(async()=>assert.match(await page.locator('#notice').innerText(),/invalid/));
await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new Error('Storage blocked')};});await page.reload();await click('Select Over-ear headphones');await check(async()=>assert.match(await page.locator('#storage').innerText(),/Session only/));
await check(async()=>assert.deepEqual(errors,[]));
await fs.writeFile('verification.json',JSON.stringify({browser:'Installed Chrome via Playwright',transport:'Request interception serves unchanged local files; localhost denied by sandbox',checks:count,errors,viewport:[1280,1000],narrowViewport:[320,720],date:new Date().toISOString()},null,2));console.log(`${count} browser checks passed`);await browser.close();})().catch(e=>{console.error(e);process.exit(1)});

