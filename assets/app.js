(()=>{
'use strict';
try{document.documentElement.classList.add('js-ready')}catch(e){return}
const $=id=>document.getElementById(id);

/* ================= THEME: single button cycle Dark -> Light -> Reading ================= */
const THEME_MODES=[
  {key:'dark',    label:'🌙 ডার্ক'},
  {key:'light',   label:'☀️ লাইট'},
  {key:'reading', label:'📖 রিডিং'}
];
function applyTheme(m){
  document.body.dataset.theme = (m==='light') ? '' : m;
  if(!document.body.dataset.theme) delete document.body.dataset.theme;
  localStorage.setItem('spTheme', m);
  const btn=$('themeBtn');
  if(btn){
    const idx=THEME_MODES.findIndex(x=>x.key===m);
    btn.textContent = THEME_MODES[idx>=0?idx:1].label;
    btn.dataset.idx = idx>=0?idx:1;
  }
}
function cycleTheme(){
  const btn=$('themeBtn'); if(!btn) return;
  const cur=parseInt(btn.dataset.idx||1,10);
  applyTheme(THEME_MODES[(cur+1)%THEME_MODES.length].key);
}
window.cycleTheme=cycleTheme;
applyTheme(localStorage.getItem('spTheme')||'light');

/* ================= themed floating page transition (enter + exit) ================= */
function initPageTransition(){
  const overlay=document.getElementById('pageTransition');
  if(!overlay) return;
  // ENTER: reveal current page shortly after it loads, themed overlay fades away
  requestAnimationFrame(()=>{ setTimeout(()=>overlay.classList.add('hide'), 260); });
  // EXIT: intercept clicks on internal .html links and play the overlay before navigating
  document.addEventListener('click', e=>{
    const a=e.target.closest('a');
    if(!a) return;
    const href=a.getAttribute('href')||'';
    if(!href.endsWith('.html')) return;
    if(a.target==='_blank'||e.metaKey||e.ctrlKey||e.shiftKey||e.button===1) return;
    e.preventDefault();
    overlay.classList.remove('hide');
    setTimeout(()=>{ window.location.href=href; }, 360);
  });
}
initPageTransition();

/* ================= toast ================= */
function toast(t){const x=$('toast');if(!x)return;x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),1800)}

/* ================= shared data ================= */
const subjects=[
 ['math3','Mathematics-3',1,0,0,1],['python','Python App Dev',1,1,1,1],['social','Social Science',1,0,0,1],
 ['phy2','Physics-2',1,1,1,1],['itss','IT Support Services',1,1,1,1],['dgtl','Digital Electronics',1,1,1,1],['gfx2','Graphics Design-2',0,1,1,0]
].map(x=>({id:x[0],name:x[1],theory:x[2],practical:x[3],job:x[4],sessional:x[5]}));
const byId=id=>subjects.find(s=>s.id===id);
const routine={
 Sunday:[['08:00','09:30','Mathematics-3','Theory','Room 308'],['09:30','10:15','Python App Dev','Theory','Room 302'],['10:15','11:00','IT Support Services','Theory','Room 302'],['11:00','13:15','Digital Electronics','Practical','Digital Electronics Lab']],
 Monday:[['08:00','10:15','IT Support Services','Practical','Hardware Lab'],['10:15','11:00','Social Science','Theory','Room 302'],['11:00','13:15','Physics-2','Practical','Chemistry Lab']],
 Tuesday:[['08:00','10:15','Graphics Design-2','Practical','Software Lab'],['10:15','11:00','Physics-2','Theory','Room 303'],['11:00','13:15','Python App Dev','Practical','Software Lab']],
 Wednesday:[['08:00','09:30','Mathematics-3','Theory','Room 308'],['09:30','10:15','Digital Electronics','Theory','Room 308'],['10:15','11:00','Python App Dev','Theory','Room 308'],['11:00','11:45','Social Science','Theory','Room 308'],['11:45','12:30','Physics-2','Theory','Room 308'],['12:30','13:15','IT Support Services','Theory','Room 308']],
 Thursday:[['08:00','10:15','IT Support Services','Practical','Hardware Lab'],['10:15','11:45','Mathematics-3','Theory','Room 308'],['11:45','12:30','Physics-2','Theory','Room 308'],['12:30','13:15','Digital Electronics','Theory','Room 308']]
};
const dayName=d=>['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d];

/* ================= state (shared via localStorage across all pages) ================= */
const storeKey='studyPlanProgressiveV1';
let state=JSON.parse(localStorage.getItem(storeKey)||'null')||{pending:[],history:[],draft:{today:{},tomorrow:{},studyHours:'',studyMinutes:'',studyNote:''},filesMeta:[]};
if(state.draft.studyHours===undefined) state.draft.studyHours='';
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const iso=()=>new Date().toISOString().slice(0,10);
const fmtDate=x=>x||'—';
function save(){try{localStorage.setItem(storeKey,JSON.stringify(state))}catch(e){toast('Browser storage is unavailable')}}

/* ================= Routine page ================= */
function bindRoutineTabs(){
  const tabs=document.querySelectorAll('[data-routine-day]');
  const dayEls=document.querySelectorAll('.routine-day');
  if(!tabs.length||!dayEls.length)return;
  const show=id=>{dayEls.forEach(d=>d.style.display=d.id===id?'block':'none');tabs.forEach(t=>t.classList.toggle('primary',t.dataset.routineDay===id));};
  tabs.forEach(t=>t.onclick=()=>show(t.dataset.routineDay));
  const today=dayName(new Date().getDay());
  const map={Sunday:'routine-sun',Monday:'routine-mon',Tuesday:'routine-tue',Wednesday:'routine-wed',Thursday:'routine-thu'};
  show(map[today]||'routine-sun');
}

/* ================= Pending Work page ================= */
function renderPending(){
  const box=$('pendingList'); if(!box) return;
  if(!state.pending.length){box.innerHTML='<div class="empty">এখনো কোনো পেন্ডিং কাজ যোগ করা হয়নি।</div>';return}
  box.innerHTML=state.pending.slice().sort((a,b)=>(a.deadline||'9999').localeCompare(b.deadline||'9999')).map((p,i)=>`<article class="pending-item"><div class="pending-head"><div><div class="pending-title">${esc(byId(p.subjectId)?.name||p.subjectId)}</div><div class="meta">${esc(p.type)} · ${esc(p.topic||'Chapter or Topic')}</div></div><button class="btn small danger" data-remove-pending="${i}" type="button">Remove</button></div><div class="pages"><span>Pages Written: ${esc(p.pagesWritten||0)}</span><span>Pages Left: ${esc(p.pagesLeft||0)}</span><span>Deadline: ${esc(fmtDate(p.deadline))}</span></div>${p.note?`<div class="meta note">Extra Note: ${esc(p.note)}</div>`:''}</article>`).join('');
  box.querySelectorAll('[data-remove-pending]').forEach(b=>b.onclick=()=>{state.pending.splice(+b.dataset.removePending,1);save();renderPending();toast('Pending Work Removed')});
}
function bindPendingForm(){
  const form=$('pendingForm'); if(!form) return;
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const p={id:uid(),type:$('pendingType').value,subjectId:$('pendingSubject').value,topic:$('pendingTopic').value.trim(),pagesWritten:+$('pagesWritten').value||0,pagesLeft:+$('pagesLeft').value||0,deadline:$('pendingDeadline').value,note:$('pendingNote').value.trim(),addedAt:new Date().toISOString()};
    if(!p.topic&&!p.pagesLeft&&!p.pagesWritten&&!p.note){toast('আগে একটা Chapter/Topic বা কাজের বিবরণ দাও');return}
    state.pending.push(p);save();renderPending();form.reset();
    const st=$('pendingStatus'); if(st){st.textContent='Added Successfully';setTimeout(()=>st.textContent='',1800)}
    toast('Added Successfully');
  });
  const rb=$('resetPending'); if(rb) rb.addEventListener('click',()=>setTimeout(()=>toast('Reset Successfully'),0));
}

/* ================= Today / Tomorrow classes ================= */
function classHTML(x,when){
  const [start,end,name,kind,room]=x;
  const s=subjects.find(q=>q.name===name);
  const saved=state.draft[when]?.[s?.id]||{};
  const id=`${when}_${s?.id}`;
  return `<article class="class-item"><div class="class-top"><div><div class="class-title">${esc(name)}</div><div class="meta">${start}–${end} · ${esc(kind)} · ${esc(room)}</div></div></div><div class="class-controls"><div class="type-toggle"><label><input type="radio" name="${id}" value="Theory" ${saved.type==='Theory'||(!saved.type&&kind==='Theory')?'checked':''}><span>Theory</span></label><label><input type="radio" name="${id}" value="Practical" ${saved.type==='Practical'||(!saved.type&&kind==='Practical')?'checked':''}><span>Practical</span></label></div> <label class="upload-label">Upload File <input type="file" data-subject="${s?.id||''}" data-when="${when}" multiple></label><div class="field note"><textarea data-note="${s?.id||''}" data-when="${when}" placeholder="Extra Note">${esc(saved.note||'')}</textarea></div></div></article>`;
}
function bindClassInputs(when){
  const box=$(when+'Classes'); if(!box) return;
  box.querySelectorAll('input[type=radio]').forEach(r=>r.onchange=()=>{const id=r.name.slice(when.length+1);state.draft[when][id]={...(state.draft[when][id]||{}),type:r.value};save()});
  box.querySelectorAll('textarea[data-note]').forEach(a=>a.oninput=()=>{const id=a.dataset.note;state.draft[when][id]={...(state.draft[when][id]||{}),note:a.value};save()});
  box.querySelectorAll('input[type=file][data-subject]').forEach(i=>i.onchange=()=>{if(i.files?.length)uploadFiles(i.dataset.subject,i.dataset.when,[...i.files])});
}
function renderTodayTomorrow(){
  const t=$('todayClasses'), tm=$('tomorrowClasses');
  if(!t && !tm) return;
  const today=new Date(), tomorrow=new Date(today); tomorrow.setDate(today.getDate()+1);
  const td=dayName(today.getDay()), tmn=dayName(tomorrow.getDay());
  if(t){
    const rows=routine[td]||[];
    t.innerHTML = rows.length ? rows.map(x=>classHTML(x,'today')).join('') : '<div class="empty">আজ কলেজে কোনো নির্ধারিত ক্লাস নেই।</div>';
    bindClassInputs('today');
  }
  if(tm){
    const rows=routine[tmn]||[];
    tm.innerHTML = rows.length ? rows.map(x=>classHTML(x,'tomorrow')).join('') : '<div class="empty">আগামীকাল কলেজে কোনো নির্ধারিত ক্লাস নেই।</div>';
    bindClassInputs('tomorrow');
  }
}

/* ================= Study Time (hours + minutes) ================= */
function bindStudyTime(){
  const mh=$('studyHours'), mm=$('studyMinutes'), noteEl=$('studyNote'), saveBtn=$('savePlan');
  if(!mh && !mm && !saveBtn) return;
  if(mh) mh.value = state.draft.studyHours || '';
  if(mm) mm.value = state.draft.studyMinutes || '';
  if(noteEl) noteEl.value = state.draft.studyNote || '';
  if(mh) mh.addEventListener('input',e=>{state.draft.studyHours=e.target.value;save()});
  if(mm) mm.addEventListener('input',e=>{state.draft.studyMinutes=e.target.value;save()});
  if(noteEl) noteEl.addEventListener('input',e=>{state.draft.studyNote=e.target.value;save()});
  function totalMinutes(){return (+state.draft.studyHours||0)*60 + (+state.draft.studyMinutes||0)}
  function planForNow(){
    let mins=totalMinutes(), out=[];
    for(const p of state.pending.slice().sort((a,b)=>(a.deadline||'9999').localeCompare(b.deadline||'9999'))){
      if(!mins)break; const m=Math.min(30,mins);
      out.push({label:`${byId(p.subjectId)?.name||p.subjectId} · ${p.type} · ${p.topic||'Pending Work'}`,minutes:m}); mins-=m;
    }
    return out;
  }
  if(saveBtn) saveBtn.onclick=()=>{
    const entry={id:uid(),date:iso(),today:structuredClone(state.draft.today),tomorrow:structuredClone(state.draft.tomorrow),studyHours:state.draft.studyHours,studyMinutes:state.draft.studyMinutes,studyNote:state.draft.studyNote,pending:structuredClone(state.pending),plan:planForNow()};
    state.history.push(entry); save();
    const st=$('planStatus'); if(st) st.textContent='Study Plan Saved Successfully';
    toast('Study Plan Saved Successfully');
  };
}

/* ================= History / export ================= */
function contextText(){
  let out=['STUDY PLAN',''];
  for(const h of state.history.slice().sort((a,b)=>b.date.localeCompare(a.date))){
    out.push(`DATE: ${h.date}`,'TODAY (CLASSES HELD):');
    Object.entries(h.today||{}).forEach(([id,x])=>out.push(`- ${byId(id)?.name||id} | ${x.type||'—'} | Extra Note: ${x.note||'—'}`));
    out.push('TOMORROW:');
    Object.entries(h.tomorrow||{}).forEach(([id,x])=>out.push(`- ${byId(id)?.name||id} | ${x.type||'—'} | Extra Note: ${x.note||'—'}`));
    out.push(`STUDY TIME: ${h.studyHours||0}h ${h.studyMinutes||0}m`,`EXTRA NOTE: ${h.studyNote||'—'}`,'PENDING WORK (জমে থাকা কাজ):');
    (h.pending||[]).forEach(p=>out.push(`- ${byId(p.subjectId)?.name||p.subjectId} | ${p.type} | ${p.topic||'—'} | Pages Written: ${p.pagesWritten||0} | Pages Left: ${p.pagesLeft||0} | Deadline: ${fmtDate(p.deadline)} | Extra Note: ${p.note||'—'}`));
    out.push('');
  }
  return out.join('\n');
}
function renderHistory(){
  const list=$('historyList'); if(!list) return;
  if(!state.history.length){list.innerHTML='<details class="history-day" open><summary>History Preview</summary><div class="history-body"><div class="empty">এখনো কোনো সেভ করা হিস্টোরি নেই।</div></div></details>';return}
  list.innerHTML=state.history.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(h=>{
    const t=Object.entries(h.today||{}).map(([id,x])=>`<div class="history-line">${esc(byId(id)?.name||id)} · ${esc(x.type||'—')} · ${esc(x.note||'—')}</div>`).join('')||'<div class="meta">None</div>';
    const tm=Object.entries(h.tomorrow||{}).map(([id,x])=>`<div class="history-line">${esc(byId(id)?.name||id)} · ${esc(x.type||'—')} · ${esc(x.note||'—')}</div>`).join('')||'<div class="meta">None</div>';
    const pend=(h.pending||[]).map(p=>`<div class="history-line">${esc(byId(p.subjectId)?.name||p.subjectId)} · ${esc(p.type)} · ${esc(p.topic||'—')} · Written ${esc(p.pagesWritten||0)} · Left ${esc(p.pagesLeft||0)} · Deadline ${esc(fmtDate(p.deadline))}</div>`).join('')||'<div class="meta">None</div>';
    return `<details class="history-day" open><summary>${esc(h.date)} · Study Plan</summary><div class="history-body selectable"><div class="history-section"><h4>Today (Classes Held)</h4>${t}</div><div class="history-section"><h4>Tomorrow</h4>${tm}</div><div class="history-section"><h4>Study Time</h4><div class="history-line">${esc(h.studyHours||0)}h ${esc(h.studyMinutes||0)}m · ${esc(h.studyNote||'—')}</div></div><div class="history-section"><h4>Pending Work (জমে থাকা কাজ)</h4>${pend}</div></div></details>`;
  }).join('');
}
function bindHistoryTools(){
  const fc=$('fullCopy'), cs=$('copySelected'), ep=$('exportPdf');
  if(fc) fc.onclick=async()=>{const txt=contextText();const ctx=$('manualContext');if(ctx)ctx.value=txt;try{await navigator.clipboard.writeText(txt);toast('Full History Copied')}catch(e){if(ctx){ctx.focus();ctx.select()}toast('Context Ready — Copy Manually')}};
  if(cs) cs.onclick=async()=>{const s=getSelection()?.toString().trim();if(!s){toast('আগে হিস্টোরির একটা অংশ সিলেক্ট করো');return}try{await navigator.clipboard.writeText(s);toast('Selected Text Copied')}catch(e){toast('Copy Manually')}};
  if(ep) ep.onclick=()=>window.print();
}

/* ================= Uploaded Files (IndexedDB) ================= */
let db=null;
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open('StudyPlanFilesDB',2);r.onupgradeneeded=e=>{const d=e.target.result;if(!d.objectStoreNames.contains('files'))d.createObjectStore('files',{keyPath:'id'})};r.onsuccess=e=>{db=e.target.result;resolve(db)};r.onerror=()=>reject(r.error)})}
const dbPut=o=>new Promise((res,rej)=>{const t=db.transaction('files','readwrite');t.objectStore('files').put(o);t.oncomplete=res;t.onerror=()=>rej(t.error)});
const dbGet=id=>new Promise((res,rej)=>{const r=db.transaction('files').objectStore('files').get(id);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const dbDelete=id=>new Promise((res,rej)=>{const t=db.transaction('files','readwrite');t.objectStore('files').delete(id);t.oncomplete=res;t.onerror=()=>rej(t.error)});
async function uploadFiles(subjectId,when,files){
  try{
    if(!db)await openDB();
    for(const f of files){const id=uid(),meta={id,name:f.name,type:f.type||'application/octet-stream',size:f.size,subjectId,category:when,addedAt:new Date().toISOString()};await dbPut({...meta,blob:f});state.filesMeta.push(meta)}
    save();renderFiles();toast('File Uploaded Successfully');
  }catch(e){toast('File upload failed')}
}
function fileSize(n){return n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(1)+' MB'}
async function previewFile(id){const f=await dbGet(id);const u=URL.createObjectURL(f.blob),w=window.open('','_blank');if(!w){toast('Allow pop-ups to preview');return}let content='';if(f.type.startsWith('image/'))content=`<img src="${u}" style="max-width:100%;height:auto">`;else if(f.type==='application/pdf')content=`<iframe src="${u}" style="width:100%;height:92vh;border:0"></iframe>`;else if(f.type.startsWith('text/'))content=`<pre style="white-space:pre-wrap">${esc(await f.blob.text())}</pre>`;else content=`<p>Preview is not available for this file type.</p><a href="${u}" download="${esc(f.name)}">Download File</a>`;w.document.write(`<title>${esc(f.name)}</title><body style="font-family:system-ui;padding:16px">${content}</body>`)}
async function downloadFile(id){const f=await dbGet(id),u=URL.createObjectURL(f.blob),a=document.createElement('a');a.href=u;a.download=f.name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
async function shareFile(id){const f=await dbGet(id),file=new File([f.blob],f.name,{type:f.type});if(navigator.canShare?.({files:[file]}))try{await navigator.share({files:[file],title:f.name});return}catch(e){}downloadFile(id)}
async function saveFile(id){const f=await dbGet(id);if(window.showSaveFilePicker)try{const h=await showSaveFilePicker({suggestedName:f.name}),w=await h.createWritable();await w.write(f.blob);await w.close();toast('Saved Successfully');return}catch(e){if(e.name==='AbortError')return}downloadFile(id);toast('Downloaded Successfully')}
async function renderFiles(){
  const list=$('filesList'); if(!list) return;
  const sfEl=$('fileFilterSubject'), tfEl=$('fileFilterType');
  const sf=sfEl?sfEl.value:'', tf=tfEl?tfEl.value:'';
  const a=state.filesMeta.filter(f=>(!sf||f.subjectId===sf)&&(!tf||f.category===tf)).sort((x,y)=>y.addedAt.localeCompare(x.addedAt));
  list.innerHTML=a.length?a.map(f=>`<article class="file-card"><div class="file-main"><div><div class="file-name">${esc(f.name)}</div><div class="meta">${esc(byId(f.subjectId)?.name||f.subjectId)} · ${esc(f.category)} · ${fileSize(f.size)}</div></div></div><div class="file-actions"><button class="btn small" data-preview="${f.id}" type="button">Preview</button><button class="btn small" data-save="${f.id}" type="button">Save</button><button class="btn small" data-share="${f.id}" type="button">Share</button><button class="btn small danger" data-delete="${f.id}" type="button">Delete</button></div></article>`).join(''):'<div class="empty">No uploaded files found.</div>';
  list.querySelectorAll('[data-preview]').forEach(b=>b.onclick=()=>previewFile(b.dataset.preview));
  list.querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>saveFile(b.dataset.save));
  list.querySelectorAll('[data-share]').forEach(b=>b.onclick=()=>shareFile(b.dataset.share));
  list.querySelectorAll('[data-delete]').forEach(b=>b.onclick=async()=>{if(db)await dbDelete(b.dataset.delete);state.filesMeta=state.filesMeta.filter(x=>x.id!==b.dataset.delete);save();renderFiles();toast('File Deleted')});
}
function bindFileFilters(){
  const sfEl=$('fileFilterSubject'), tfEl=$('fileFilterType');
  if(sfEl) sfEl.onchange=renderFiles;
  if(tfEl) tfEl.onchange=renderFiles;
}

/* ================= init (runs on every page; each fn no-ops if its elements are absent) ================= */
bindRoutineTabs();
bindPendingForm(); renderPending();
renderTodayTomorrow();
bindStudyTime();
bindHistoryTools(); renderHistory();
bindFileFilters();
openDB().then(renderFiles).catch(()=>{renderFiles()});
})();
