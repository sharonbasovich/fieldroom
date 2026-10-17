import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh,transition as t,valid} from './model.mjs';
const run=(s,type,id)=>t(s,{type,id},1000).state;
test('full journey and idempotency',()=>{let s=run(fresh(),'select','headphones');assert.equal(s.phase,'select');s=run(s,'review');s=run(s,'confirm');assert.equal(s.phase,'confirmed');assert.deepEqual(run(s,'confirm'),s);s=run(s,'pickup');assert.equal(s.receipt.due,10801000);assert.deepEqual(run(s,'pickup'),s);s=run(s,'return');assert.equal(s.phase,'returned');assert.deepEqual(run(s,'return'),s);assert.ok(valid(s));});
test('stale stock is rechecked',()=>{let s=run(run(fresh(),'select','calculator'),'review');s=run(s,'stale');let r=t(s,{type:'confirm'});assert.equal(r.state.item,null);assert.match(r.message,/Availability changed/);assert.equal(run(r.state,'select','calculator').item,null);});
test('unavailable stock and illegal transitions',()=>{for(const type of ['pickup','return','confirm','restart'])assert.deepEqual(run(fresh(),type),fresh());assert.equal(run(fresh(),'select','charger').item,null);});
test('backtracking and cancellation',()=>{let s=run(run(fresh(),'select','headphones'),'review');s=run(s,'back');assert.equal(s.item,'headphones');assert.equal(s.review,false);assert.deepEqual(run(s,'cancel'),fresh());s=run(run(s,'review'),'confirm');assert.equal(s.phase,'confirmed');assert.deepEqual(run(s,'cancel'),fresh());});
test('reload representation and invalid data',()=>{let s=run(run(run(fresh(),'select','calculator'),'review'),'confirm');assert.ok(valid(JSON.parse(JSON.stringify(s))));assert.equal(valid({}),false);assert.equal(valid({...s,item:'nope'}),false);});
test('receipt and lifecycle validation rejects impossible restored transactions',()=>{
 const confirmed=run(run(run(fresh(),'select','calculator'),'review'),'confirm');
 const borrowed=run(confirmed,'pickup');
 for(const bad of [{...fresh(),item:'charger'},{...confirmed,review:true},{...confirmed,unavailable:['calculator']},{...borrowed,receipt:{...borrowed.receipt,pickedUp:undefined}},{...borrowed,receipt:{...borrowed.receipt,due:0}},{...confirmed,receipt:{...confirmed.receipt,id:'<img src=x onerror=alert(1)>'}},{...borrowed,phase:'returned',receipt:{...borrowed.receipt,returned:999}}])assert.equal(valid(bad),false);
});
test('active loan cannot be reset; backwards clock cannot corrupt dates',()=>{let s=run(run(run(fresh(),'select','headphones'),'review'),'confirm');s=t(s,{type:'pickup'},900).state;assert.ok(valid(s));assert.deepEqual(run(s,'reset'),s);s=t(s,{type:'return'},800).state;assert.ok(valid(s));assert.equal(s.receipt.returned,1000);});
