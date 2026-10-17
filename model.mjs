export const items = [
 {id:'headphones',name:'Over-ear headphones',detail:'A little space to concentrate.',stock:2,shape:'headphones'},
 {id:'calculator',name:'Scientific calculator',detail:'For working things out.',stock:1,shape:'calculator'},
 {id:'charger',name:'USB-C charging kit',detail:'Keep a good idea going.',stock:0,shape:'charger'}
];
export const fresh=()=>({version:1,phase:'select',item:null,review:false,unavailable:[],receipt:null});
export function valid(s){
 const date=n=>Number.isFinite(n)&&n>=0&&n<8640000000000000;
 if (!(s?.version===1 && ['select','confirmed','borrowed','returned'].includes(s.phase) && Array.isArray(s.unavailable) && new Set(s.unavailable).size===s.unavailable.length && s.unavailable.every(x=>items.some(i=>i.id===x)) && (s.item===null||items.some(i=>i.id===s.item&&i.stock>0)) && typeof s.review==='boolean')) return false;
 if(s.phase==='select') return s.receipt===null&&(!s.review||s.item!==null);
 const r=s.receipt;
 if(!s.item||s.review||s.unavailable.includes(s.item)||!/^FR-[A-Z0-9]+(?:-[A-Z0-9]{8})?$/.test(r?.id)||!date(r?.confirmed))return false;
 if(s.phase==='confirmed')return r.pickedUp===undefined&&r.due===undefined&&r.returned===undefined;
 if(!date(r.pickedUp)||r.pickedUp<r.confirmed||!date(r.due)||r.due!==r.pickedUp+10800000)return false;
 return s.phase==='borrowed'?r.returned===undefined:date(r.returned)&&r.returned>=r.pickedUp;
}
export function transition(state,event,now=Date.now()){
 let s=structuredClone(state); const item=items.find(i=>i.id===s.item);
 switch(event.type){
 case 'select': if(s.phase==='select'&&items.some(i=>i.id===event.id&&i.stock>0)&&!s.unavailable.includes(event.id)){s.item=event.id;s.review=false;} break;
 case 'review': if(s.phase==='select'&&item)s.review=true;break;
 case 'back': if(s.phase==='select')s.review=false;break;
 case 'cancel': if(['select','confirmed'].includes(s.phase))s={...fresh(),unavailable:s.unavailable};break;
 case 'stale': if(s.phase==='select'&&s.item&&!s.unavailable.includes(s.item))s.unavailable.push(s.item);break;
 case 'confirm': if(s.phase==='select'&&s.review&&item){if(!item.stock||s.unavailable.includes(s.item)){s.review=false;s.item=null;return {state:s,message:'Availability changed. That item is no longer available. Choose another item.'};}s.phase='confirmed';s.review=false;s.receipt={id:'FR-'+now.toString(36).toUpperCase()+(/^[A-Z0-9]{8}$/.test(event.token)?'-'+event.token:''),confirmed:now};}break;
 case 'pickup': if(s.phase==='confirmed'){s.phase='borrowed';s.receipt.pickedUp=Math.max(now,s.receipt.confirmed);s.receipt.due=s.receipt.pickedUp+3*60*60*1000;}break;
 case 'return': if(s.phase==='borrowed'){s.phase='returned';s.receipt.returned=Math.max(now,s.receipt.pickedUp);}break;
 case 'restart': if(s.phase==='returned')s={...fresh(),unavailable:s.unavailable};break;
 case 'reset': if(s.phase!=='borrowed')s=fresh();break;
 }
 return {state:s,message:''};
}
