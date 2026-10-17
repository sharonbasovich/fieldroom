import http from 'node:http';
import {readFile} from 'node:fs/promises';
const files={'/':'index.html','/index.html':'index.html','/app.mjs':'app.mjs','/model.mjs':'model.mjs','/storage.mjs':'storage.mjs','/style.css':'style.css'};
http.createServer(async(req,res)=>{try{const f=files[new URL(req.url,'http://localhost').pathname];if(!f){res.writeHead(404);return res.end('Not found');}res.setHeader('Content-Type',f.endsWith('css')?'text/css':f.endsWith('mjs')?'text/javascript':'text/html');res.setHeader('Cache-Control','no-store');res.end(await readFile(new URL(f,import.meta.url)));}catch{res.writeHead(500);res.end('Unable to load prototype');}}).listen(4173,'127.0.0.1',()=>console.log('Fieldroom: http://127.0.0.1:4173'));
