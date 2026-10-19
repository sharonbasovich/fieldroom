import {items,fresh,transition} from './model.mjs';
import {key,readSnapshot} from './storage.mjs';
let state=fresh(),persistent=Boolean(navigator.locks),message='',snapshot=null,busy=false;
try{const saved=readSnapshot(localStorage);state=saved.state;snapshot=saved.raw;message=saved.warning;}catch{persistent=false;message='Browser storage is unreadable. This session will not survive reload.';}
if(!navigator.locks)message='Coordinated browser storage is unavailable. This is a session-only demo; changes will not survive reload.';
const $=s=>document.querySelector(s);const format=t=>new Date(t).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'});
const art={headphones:'<path d="M15 53V40a27 27 0 0 1 54 0v13M20 48V40a22 22 0 0 1 44 0v8"/><rect x="10" y="45" width="17" height="32" rx="8"/><rect x="57" y="45" width="17" height="32" rx="8"/><path d="M18 52v18m47-18v18"/>',calculator:'<rect x="20" y="8" width="45" height="74" rx="5"/><path d="M27 17h31v17H27zM28 45h5m9 0h5m9 0h2M28 55h5m9 0h5m9 0h2M28 65h5m9 0h5m9 0h2M28 74h5m9 0h5m9 0h2"/>',charger:'<path d="M13 33 40 18l28 15v27L41 76 13 61zM13 33l28 15 27-15M41 48v28M22 47l10 5v8l-10-5zM69 46c22-4 20 31-1 31H57m0-4v8h-9v-8z"/>'};
function sync(focus=false){
 if(!persistent)return false;
 try{const saved=readSnapshot(localStorage);if(saved.raw===snapshot)return false;state=saved.state;snapshot=saved.raw;message=saved.warning||(saved.raw===null?'Saved demo was removed in another tab. Started a fresh slip; the old receipt is no longer saved.':'Demo changed in another tab or browser history. Review this slip before continuing.');render(focus);return true;}
 catch{persistent=false;message='Storage became unreadable. Continuing in this tab only; reload may lose these changes.';render(focus);return true;}
}
async function act(type,id){
 if(busy)return;busy=true;$('#main').setAttribute('aria-busy','true');const expectedSnapshot=snapshot;
 const perform=()=>{
  // Never apply a click from an old slip to a newly restored transaction.
  if(sync(true))return;
  if(snapshot!==expectedSnapshot){message='Demo changed while this action was waiting. Review this slip before continuing.';render(true);return;}
  const token=crypto.getRandomValues(new Uint32Array(1))[0].toString(16).padStart(8,'0').toUpperCase();
  const result=transition(state,{type,id,token});state=result.state;
  const labels={select:'Item selected. Review it before confirming.',review:'Review the selection and acknowledge the policy.',back:'Back to selection. No hold is confirmed.',cancel:'Selection or hold cancelled. Nothing borrowed.',confirm:'Simulated hold confirmed. Nothing borrowed yet.',pickup:'Simulated pickup recorded. Your three-hour loan is active.',return:'Simulated return recorded. Your loan is closed.',restart:'Ready for a new selection.',reset:'Local demo reset.',stale:'Demo stock changed. Confirm this selection to see the availability check.'};
  message=result.message||labels[type]||'';
  if(persistent){try{snapshot=JSON.stringify(state);localStorage.setItem(key,snapshot);}catch{persistent=false;message+=' Storage could not be saved. Continuing in this tab only; reload may lose these changes.';}}
  render(true);
 };
 try{if(persistent)await navigator.locks.request(key,perform);else perform();}catch{persistent=false;message='Coordinated storage became unavailable. No action was recorded. Continue in this tab only; changes will not survive reload.';render(true);}finally{busy=false;$('#main').removeAttribute('aria-busy');}
}
function render(focus=false){
 const active=document.activeElement;
 const restore=active?.closest('#slip,#inventory')?{id:active.id,item:active.dataset.select}:null;
 const chosen=items.find(i=>i.id===state.item),locked=state.phase!=='select';
 $('#inventory').innerHTML=items.map(i=>{const available=i.stock>0&&!state.unavailable.includes(i.id),selected=i.id===state.item;return `<article class="item ${selected?'selected':''}"><svg viewBox="0 0 90 90" aria-hidden="true">${art[i.shape]}</svg><div><h3>${i.name}</h3><p>${i.detail}</p></div><div><div class="availability ${!available?'out':''}">${selected&&state.phase==='confirmed'?'Held for you':selected&&state.phase==='borrowed'?'On your loan':available?i.stock+' available':'Unavailable'}</div><button data-select="${i.id}" ${!available||locked?'disabled':''} aria-pressed="${selected}" aria-label="${selected?(state.phase==='select'?'Selected:':state.phase==='confirmed'?'Confirmed:':state.phase==='borrowed'?'Borrowed:':'Returned:'):'Select'} ${i.name}">${selected?(state.phase==='confirmed'?'Confirmed':state.phase==='borrowed'?'Borrowed':state.phase==='returned'?'Returned':'Selected ✓'):'Select'}</button></div></article>`;}).join('');
 let body='';
 if(state.phase==='select'&&!chosen)body='<div class="empty"><span aria-hidden="true">▱</span><h3>Nothing selected yet.</h3><p>Choose one item from the desk. Selecting does not confirm a hold or start a loan.</p></div><button disabled>Review selection</button>';
 else if(state.phase==='select')body=`<div class="state">${state.review?'Review before confirming':'Selected · not confirmed'}</div><h3>${chosen.name}</h3><p>3-hour loan · Studio desk<br>Indoor use only</p><p>${state.review?'Confirm a simulated hold. Your loan starts only when you record pickup.':'This is just your selection. Availability is checked again when you confirm.'}</p>${state.review?'<label class="check"><input id="agree" type="checkbox">I understand the 3-hour loan and indoor-use restriction.</label>':''}<div class="actions">${state.review?'<button id="confirm" disabled>Confirm simulated hold</button><button class="secondary" id="back">Back to selection</button>':'<button id="review">Review selection →</button>'}<button class="secondary" id="cancel">Clear selection</button></div>`;
 else {const phase=state.phase;body=`<div class="state success">${phase==='confirmed'?'Confirmed · awaiting pickup':phase==='borrowed'?'Borrowed · loan active':'Returned · loan closed'}</div><h3>${phase==='confirmed'?'Your hold is confirmed.':phase==='borrowed'?'It’s yours for a while.':'Back where it belongs.'}</h3><p>${phase==='confirmed'?'Nothing borrowed yet. Record pickup at the fictional desk to start your loan.':phase==='borrowed'?'Bring the item back to Studio desk. Record its return below.':'Your simulated return is complete. Thanks for making room for the next person.'}</p><dl class="receipt"><div><dt>Receipt</dt><dd>${state.receipt.id}</dd></div><div><dt>Item · quantity 1</dt><dd>${chosen.name}</dd></div><div><dt>Collect & return</dt><dd>Studio desk · Indoor use only</dd></div><div><dt>${phase==='confirmed'?'Loan duration':phase==='returned'?'Returned at':'Return by'}</dt><dd>${phase==='confirmed'?'3 hours from pickup':format(phase==='returned'?state.receipt.returned:state.receipt.due)}</dd></div></dl><div class="actions">${phase==='confirmed'?'<button id="pickup">Record simulated pickup →</button><button class="secondary" id="cancel">Cancel hold</button>':phase==='borrowed'?'<button id="return">Record simulated return</button>':'<button id="restart">Borrow something else →</button>'}</div>`;}
 $('#slip').innerHTML=`<h2 tabindex="-1" id="slip-title">Your borrowing slip</h2>${body}`;if(focus){$('#slip').classList.remove('enter');void $('#slip').offsetWidth;$('#slip').classList.add('enter');$('#slip-title').focus();$('#slip').scrollIntoView({block:'start'});}
 const current=state.phase==='select'&&!state.item?-1:['select','confirmed','borrowed','returned'].indexOf(state.phase);$('#steps').innerHTML=['Selected','Confirmed','Borrowed','Returned'].map((x,n)=>`<li ${n===current?'aria-current="step"':''}><span class="number">${n+1}</span><b>${x}</b>${['Choose & review.','Hold, before pickup.','Pickup starts the clock.','Close the loan.'][n]}</li>`).join('');
 $('#notice').textContent=message;$('#storage').textContent=persistent?'Browser-local saving enabled':'Session only · storage unavailable';$('#stale').disabled=locked||!chosen;$('#reset').disabled=state.phase==='borrowed';
 document.querySelectorAll('[data-select]').forEach(b=>b.onclick=()=>act('select',b.dataset.select));for(const type of ['review','back','cancel','confirm','pickup','return','restart']){const b=$('#'+type);if(b)b.onclick=()=>act(type);}
 if($('#agree'))$('#agree').onchange=e=>{$('#confirm').disabled=!e.target.checked;};
 if(!focus&&restore){const replacement=restore.id?document.getElementById(restore.id):document.querySelector(`[data-select="${restore.item}"]`);if(replacement&&!replacement.disabled)replacement.focus();else{$('#slip-title').focus();$('#slip').scrollIntoView({block:'start'});}}
}
$('#stale').onclick=()=>act('stale');$('#reset').onclick=()=>act('reset');
window.addEventListener('storage',e=>{if(e.key===key||e.key===null)sync(false);});
window.addEventListener('pageshow',event=>{
 sync(false);
 if(!event.persisted&&state.item)requestAnimationFrame(()=>{
  if(state.item){$('#slip-title').focus();$('#slip').scrollIntoView({block:'start'});}
 });
});
window.addEventListener('popstate',()=>sync(false));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync(false);});
if(state.item&&!message)message='Saved demo restored. Review your borrowing slip before continuing.';
render();
