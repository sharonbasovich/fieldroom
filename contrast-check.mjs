import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const pairs=[['body','#0b1235','#ffffff',4.5],['muted','#505b7b','#ffffff',4.5],['slip muted','#505b7b','#eaf4ff',4.5],['status','#244b8b','#eaf4ff',4.5],['success','#086337','#eaf4ff',4.5],['button','#ffffff','#064bff',4.5],['focus','#e06b00','#ffffff',3],['focus slip','#e06b00','#eaf4ff',3]];
const luminance=h=>{const c=h.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
const results=pairs.map(([role,foreground,background,minimum])=>{const a=luminance(foreground),b=luminance(background),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);assert.ok(ratio>=minimum,role);return {role,foreground,background,ratio:Number(ratio.toFixed(2)),minimum};});
await writeFile('contrast-verification.json',JSON.stringify({method:'WCAG sRGB relative luminance, explicit static CSS pairs; not a full accessibility audit',results},null,2));console.log('8 static contrast pairs passed');
