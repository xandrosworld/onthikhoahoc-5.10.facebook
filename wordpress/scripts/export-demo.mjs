// Read-only export of the authorized demo's teaching content. No users or results.
import fs from 'node:fs/promises';
const origin='https://onthikhoahoc-510-demo.netlify.app';
const jar=new Map();
async function get(path, options={}) {
  const r=await fetch(origin+path,{...options,redirect:'manual',headers:{Origin:origin,...options.headers,Cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; ')}});
  for(const c of r.headers.getSetCookie()){const [pair]=c.split(';'); const i=pair.indexOf('='); jar.set(pair.slice(0,i),pair.slice(i+1));}
  return r;
}
const login=await (await get('/dang-nhap')).text();
const fd=new FormData();
for(const input of login.matchAll(/<input[^>]*>/g)) {
  const name=input[0].match(/name="([^"]+)"/)?.[1];
  if(name?.startsWith('$ACTION')) fd.set(name,(input[0].match(/value="([^"]*)"/)?.[1]||'').replaceAll('&quot;','"').replaceAll('&amp;','&'));
}
// Published demo account from this repository's README, not production credentials.
fd.set('email','admin@demo.vn'); fd.set('password','Admin@1234'); fd.set('next','/admin');
const auth=await get('/dang-nhap',{method:'POST',body:fd});
if(![302,303].includes(auth.status)) throw new Error('Demo login failed');
function flight(html) {
  return [...html.matchAll(/self\.__next_f\.push\((\[.*?\])\)<\/script>/gs)].map(m=>{try{return JSON.parse(m[1])[1]||'';}catch{return '';}}).join('');
}
function prop(text,key) {
  const start=text.indexOf('"'+key+'":'); if(start<0) throw new Error('Missing '+key);
  const pos=start+key.length+3;
  for(let end=pos+1;end<=text.length;end++) {try{ const v=JSON.parse(text.slice(pos,end)); if(v && typeof v==='object')return v;}catch{}}
  throw new Error('Invalid '+key);
}
const out={exams:[],courses:[],posts:[]};
for(const [kind,path,key] of [['exams','de-thi','initial'],['courses','khoa-hoc','course'],['posts','bai-viet','post']]) {
  const list=await (await get('/admin/'+path)).text();
  const ids=[...new Set([...list.matchAll(new RegExp('/admin/'+path+'/(c[a-z0-9]{20,30})','g'))].map(m=>m[1]))].filter(x=>x!=='tao-moi'&&x!=='moi'&&x!=='new'&&x!=='tao');
  for(const id of ids){const page=await (await get('/admin/'+path+'/'+id)).text(); out[kind].push(prop(flight(page),key));}
  console.log(kind,out[kind].map(x=>({title:x.title,status:x.status})));
}
await fs.mkdir(new URL('../.runtime/',import.meta.url),{recursive:true});
await fs.writeFile(new URL('../.runtime/demo-content.json',import.meta.url),JSON.stringify(out,null,2));
