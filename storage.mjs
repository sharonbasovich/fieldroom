import {fresh, valid} from './model.mjs';
export const key = 'fieldroom-v1';

// Retain the exact snapshot: even invalid or deleted storage is a change that
// must be shown before a stale tab may perform another action.
export function readSnapshot(storage) {
  const raw = storage.getItem(key);
  if (raw === null) return {raw, state:fresh(), warning:''};
  try {
    if(raw.length>10000)throw new Error('Invalid demo record');
    const state = JSON.parse(raw);
    if (valid(state)) return {raw, state, warning:''};
  } catch { /* fall through to explicit recovery */ }
  return {raw, state:fresh(), warning:'Saved demo data was invalid. Started a fresh slip. No previous receipt could be recovered.'};
}
