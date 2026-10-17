import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readSnapshot} from './storage.mjs';
import {fresh} from './model.mjs';
test('snapshot distinguishes removal, corrupt JSON, invalid state, and unavailable storage',()=>{
 assert.deepEqual(readSnapshot({getItem:()=>null}),{raw:null,state:fresh(),warning:''});
 for(const raw of ['{bad','{"version":1}', 'x'.repeat(10001)]){const result=readSnapshot({getItem:()=>raw});assert.equal(result.raw,raw);assert.match(result.warning,/invalid/);assert.deepEqual(result.state,fresh());}
 assert.throws(()=>readSnapshot({getItem:()=>{throw new Error('blocked');}}),/blocked/);
});
