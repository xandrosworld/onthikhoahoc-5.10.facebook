import fs from 'node:fs/promises';
import {request,headers} from './production-client.mjs';
import {questionPoints,templateTypes,DEFAULT_POINTS} from '../../src/lib/exam-config.js';
const source='https://onthikhoahoc-510-demo.netlify.app';
const file=new URL('../.runtime/demo-content.json',import.meta.url);
const content=JSON.parse(await fs.readFile(file,'utf8'));
const apply=process.argv.includes('--apply');
const manifestFile=new URL('../.runtime/import-manifest.json',import.meta.url);
const manifest=JSON.parse(await fs.readFile(manifestFile,'utf8').catch(()=>'{}'));
async function saveManifest(){await fs.writeFile(manifestFile,JSON.stringify(manifest,null,2));}
async function api(path,body) {
  const r=await request('/wp-json/sonclass/v1/'+path,{method:body?'POST':'GET',headers:{...headers,...(body instanceof FormData?{}:{'Content-Type':'application/json'})},...(body?{body:body instanceof FormData?body:JSON.stringify(body)}:{})});
  const d=await r.json(); if(!r.ok)throw new Error(path+': '+d.message);return d;
}
const all=JSON.stringify(content);
const paths=[...new Set([...all.matchAll(/\/api\/files\/[^\s"\\)]+/g)].map(m=>m[0]))];
if(!apply){console.log({exams:content.exams.map(x=>x.title),courses:content.courses.length,posts:content.posts.length,files:paths.length});process.exit();}
for(const path of paths){
  if(manifest[path])continue;
  const r=await fetch(source+path);if(!r.ok)throw new Error('Source file unavailable: '+path);
  const bytes=await r.arrayBuffer(); if(bytes.byteLength>2*1024*1024)throw new Error('File exceeds hosting limit: '+path);
  const form=new FormData();form.set('file',new Blob([bytes],{type:r.headers.get('content-type')}),path.split('/').pop());
  manifest[path]=(await api('admin/upload',form)).url;await saveManifest();console.log('Transferred',path);
}
function replaceFiles(value){if(typeof value==='string'){if(value.startsWith('$D'))return value.slice(2);if(value==='$undefined')return null;for(const path of paths)value=value.replaceAll(path,manifest[path]);return value;}if(Array.isArray(value))return value.map(replaceFiles);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,replaceFiles(v)]));return value;}
for(const kind of ['courses','posts','exams']){
  const existing=await api('admin/'+kind);
  // Oldest first preserves demo's ordering on lists with new creation timestamps.
  for(const raw of [...content[kind]].reverse()){
    if(existing.some(e=>e.demoSourceId===raw.id)){console.log('Already imported',raw.title);continue;}
    if(existing.some(e=>e.title.replace(/[–—-]/g,'-')===raw.title.replace(/[–—-]/g,'-') || (kind==='courses' && raw.title==='Luyện đề THPT Quốc gia' && e.title==='Luyện đề THPT- ĐGNL - ĐGTD'))){console.log('Preserved existing content',raw.title);continue;}
    const e=replaceFiles(raw);e.demoSourceId=raw.id;delete e.id;delete e.createdAt;delete e.updatedAt;
    if(kind==='exams'){
      const sections=templateTypes(e.template).map(type=>({type,...e.sectionSettings[type],questions:e.sections[type]}));
      for(const s of sections){for(const q of s.questions)q.points=questionPoints(sections,s,q);e.sectionSettings[s.type].pointsPerQuestion ||= DEFAULT_POINTS[s.type];}
    }
    const out=await api('admin/'+kind,e);manifest[raw.id]=out.id;await saveManifest();
    const saved=await api('admin/'+kind+'/'+out.id);
    for(const k of ['title','sections','sectionSettings','content','description','syllabus'])if(e[k]!==undefined&&JSON.stringify(saved[k])!==JSON.stringify(e[k]))throw new Error('Import verification failed: '+k);
    console.log('Imported and verified',kind,e.title);
  }
}
