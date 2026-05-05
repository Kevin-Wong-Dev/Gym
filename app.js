'use strict';

// Helpers originales
function daysFromNow(d){const x=new Date();x.setDate(x.getDate()+d);return x.toISOString().split('T')[0]}
function daysDiff(s){const n=new Date();n.setHours(0,0,0,0);const t=new Date(s);t.setHours(0,0,0,0);return Math.round((t-n)/86400000)}
function formatDate(s){if(!s)return'—';const[y,m,d]=s.split('-');return`${d}/${m}/${y}`}
function initials(n){return n.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()}
function nextId(a){return a.length?Math.max(...a.map(x=>x.id))+1:1}

// Validaciones Helpers
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function showError(inputId, message) {
    const input = document.getElementById(inputId);
    input.classList.add('input-error');
    let errorEl = input.parentElement.querySelector('.error-text');
    if (!errorEl) {
        errorEl = document.createElement('span');
        errorEl.className = 'error-text';
        input.parentElement.appendChild(errorEl);
    }
    errorEl.innerText = message;
}

function clearErrors() {
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    document.querySelectorAll('.error-text').forEach(el => el.remove());
}

// Limpiar error al escribir
document.addEventListener('input', function(e) {
    if(e.target.classList.contains('input-error')) {
        e.target.classList.remove('input-error');
        const err = e.target.parentElement.querySelector('.error-text');
        if(err) err.remove();
    }
});

// Data inicial
let members=[
  {id:1,name:'Carlos Ramírez',email:'carlos@email.com',phone:'33-1234-5678',plan:'Mensual',joined:'2024-01-15',expiry:daysFromNow(8),notes:'',autoRenew:true,medical:true},
  {id:2,name:'Sofía Mendoza',email:'sofia@email.com',phone:'33-2345-6789',plan:'Trimestral',joined:'2023-11-01',expiry:daysFromNow(-12),notes:'Clase de yoga',autoRenew:false,medical:true},
  {id:3,name:'Luis Torres',email:'luis@email.com',phone:'33-3456-7890',plan:'Semestral',joined:'2024-02-20',expiry:daysFromNow(45),notes:'',autoRenew:true,medical:false},
  {id:4,name:'Ana García',email:'ana@email.com',phone:'33-4567-8901',plan:'Anual',joined:'2023-06-10',expiry:daysFromNow(180),notes:'Entrenamiento personal',autoRenew:true,medical:true},
  {id:5,name:'Marco Reyes',email:'marco@email.com',phone:'33-5678-9012',plan:'Mensual',joined:'2024-03-01',expiry:daysFromNow(-3),notes:'',autoRenew:false,medical:false},
  {id:6,name:'Valeria López',email:'vale@email.com',phone:'33-6789-0123',plan:'Trimestral',joined:'2024-01-20',expiry:daysFromNow(22),notes:'',autoRenew:true,medical:true},
];

let staff=[
  {id:1,name:'Diego Herrera',email:'diego@irongym.com',phone:'33-1111-2222',role:'Entrenador',schedule:'Lun–Vie 6am–2pm',since:'2022-03-01',notes:''},
  {id:2,name:'Paola Fuentes',email:'paola@irongym.com',phone:'33-2222-3333',role:'Recepcionista',schedule:'Lun–Sáb 8am–4pm',since:'2023-01-15',notes:''},
  {id:3,name:'Rodrigo Vargas',email:'rodrigo@irongym.com',phone:'33-3333-4444',role:'Entrenador',schedule:'Mar–Sáb 2pm–10pm',since:'2021-07-20',notes:'Especialista CrossFit'},
];

let editingMemberId=null,editingStaffId=null,deleteTarget=null,memberFilter='all',memberSearch='',staffSearch='';

const activities=[
  {dot:'green',text:'<strong>Ana García</strong> renovó su membresía Anual',time:'Hace 2 horas'},
  {dot:'accent',text:'<strong>Marco Reyes</strong> fue registrado como nuevo miembro',time:'Hace 5 horas'},
  {dot:'red',text:'<strong>Sofía Mendoza</strong> – membresía expirada',time:'Hace 12 días'},
  {dot:'orange',text:'<strong>Carlos Ramírez</strong> – vence en 8 días',time:'Recordatorio automático'},
  {dot:'accent',text:'<strong>Rodrigo Vargas</strong> actualizó su horario',time:'Ayer'},
];

// Clock
function updateClock(){
  const now=new Date();
  const h=String(now.getHours()).padStart(2,'0');
  const m=String(now.getMinutes()).padStart(2,'0');
  const s=String(now.getSeconds()).padStart(2,'0');
  const el=document.getElementById('clock');
  if(el)el.textContent=`${h}:${m}:${s}`;
}
setInterval(updateClock,1000);updateClock();

// Toast
function toast(msg,type='success'){
  const icon=type==='success'?'✓':'✕';
  const el=document.createElement('div');
  el.className=`toast ${type}`;
  el.innerHTML=`<span class="toast-icon">${icon}</span><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(()=>el.remove(),3000);
}

// Navigation
function navigate(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  document.querySelector(`.nav-item[data-section="${id}"]`).classList.add('active');
  const labels={dashboard:'Dashboard',members:'Miembros',staff:'Personal'};
  document.getElementById('topbar-title').textContent=labels[id]||id;
  document.getElementById('topbar-breadcrumb').textContent='Iron Gym / '+(labels[id]||'');
  closeSidebar();
  if(id==='dashboard')renderDashboard();
  if(id==='members')renderMembers();
  if(id==='staff')renderStaff();
}
function openSidebar(){document.getElementById('sidebar').classList.add('open');document.getElementById('overlay-bg').classList.add('open')}
function closeSidebar(){document.getElementById('sidebar').classList.remove('open');document.getElementById('overlay-bg').classList.remove('open')}

// Gráficos
function drawDonut(data,colors){
  const svg=document.getElementById('donut-svg');
  const legend=document.getElementById('donut-legend');
  const total=data.reduce((s,d)=>s+d.v,0);
  if(!total){svg.innerHTML='';legend.innerHTML='';return}
  const cx=45,cy=45,r=34,ir=22;
  let angle=-Math.PI/2,paths='';
  data.forEach((d,i)=>{
    const sweep=2*Math.PI*(d.v/total);
    const x1=cx+r*Math.cos(angle),y1=cy+r*Math.sin(angle);
    const x2=cx+r*Math.cos(angle+sweep),y2=cy+r*Math.sin(angle+sweep);
    const laf=sweep>Math.PI?1:0;
    const ix1=cx+ir*Math.cos(angle),iy1=cy+ir*Math.sin(angle);
    const ix2=cx+ir*Math.cos(angle+sweep),iy2=cy+ir*Math.sin(angle+sweep);
    paths+=`<path d="M${x1},${y1} A${r},${r},0,${laf},1,${x2},${y2} L${ix2},${iy2} A${ir},${ir},0,${laf},0,${ix1},${iy1} Z" fill="${colors[i]}" opacity="0.9"/>`;
    angle+=sweep;
  });
  svg.innerHTML=paths+`<text x="45" y="42" text-anchor="middle" fill="#f0f0eb" font-family="Bebas Neue,sans-serif" font-size="16">${total}</text><text x="45" y="54" text-anchor="middle" fill="#50504a" font-size="8" font-family="DM Sans,sans-serif">TOTAL</text>`;
  legend.innerHTML=data.map((d,i)=>`<div class="legend-item"><div class="legend-dot" style="background:${colors[i]}"></div><span class="legend-label">${d.label}</span><span class="legend-val">${d.v}</span></div>`).join('');
}

function drawBarStatus(active,soon,expired){
  const max=active+soon+expired||1;
  document.getElementById('bar-chart-status').innerHTML=[
    {label:'Activos',val:active,color:'var(--green)'},
    {label:'Por vencer',val:soon,color:'var(--orange)'},
    {label:'Expirados',val:expired,color:'var(--red)'},
  ].map(b=>`<div class="bar-row"><span class="bar-label">${b.label}</span><div class="bar-track"><div class="bar-fill" style="width:${(b.val/max*100).toFixed(1)}%;background:${b.color}"></div></div><span class="bar-val">${b.val}</span></div>`).join('');
}

// Dashboard
function renderDashboard(){
  const total=members.length;
  const active=members.filter(m=>daysDiff(m.expiry)>=0).length;
  const expired=members.filter(m=>daysDiff(m.expiry)<0).length;
  const soon=members.filter(m=>{const d=daysDiff(m.expiry);return d>=0&&d<=7}).length;
  document.getElementById('stat-total').textContent=total;
  document.getElementById('stat-active').textContent=active;
  document.getElementById('stat-expired').textContent=expired;
  document.getElementById('stat-soon').textContent=soon;
  document.getElementById('stat-staff').textContent=staff.length;
  setTimeout(()=>{
    document.getElementById('bar-total').style.width='100%';
    document.getElementById('bar-active').style.width=(total?active/total*100:0)+'%';
    document.getElementById('bar-expired').style.width=(total?expired/total*100:0)+'%';
    document.getElementById('bar-soon').style.width=(total?soon/total*100:0)+'%';
  },80);

  const plans={};
  members.forEach(m=>plans[m.plan]=(plans[m.plan]||0)+1);
  const planColors={'Mensual':'#e8ff00','Trimestral':'#00e676','Semestral':'#ff9100','Anual':'#ff3b3b'};
  const planData=Object.entries(plans).map(([k,v])=>({label:k,v,color:planColors[k]||'#9a9a94'}));
  drawDonut(planData,planData.map(d=>d.color));
  drawBarStatus(active,soon,expired);

  const sorted=[...members].sort((a,b)=>new Date(a.expiry)-new Date(b.expiry)).slice(0,5);
  document.getElementById('dash-expiry-body').innerHTML=sorted.map(m=>{
    const diff=daysDiff(m.expiry);
    return`<tr><td class="td-name">${m.name}</td><td><span class="badge badge-role">${m.plan}</span></td><td>${formatDate(m.expiry)}</td><td>${expiryTag(diff)}</td></tr>`;
  }).join('');

  document.getElementById('activity-feed').innerHTML=activities.map(a=>`<div class="activity-item"><div class="activity-dot ${a.dot}"></div><div><div class="activity-text">${a.text}</div><div class="activity-time">${a.time}</div></div></div>`).join('');
}

function expiryTag(diff){
  if(diff<0)return`<span class="expiry-cell overdue">Venció hace ${Math.abs(diff)}d</span>`;
  if(diff===0)return`<span class="expiry-cell soon">Vence hoy</span>`;
  if(diff<=7)return`<span class="expiry-cell soon">En ${diff}d</span>`;
  return`<span class="expiry-cell ok">En ${diff}d</span>`;
}

// Members
function renderMembers(){
  let list=[...members];
  if(memberSearch.trim()){const q=memberSearch.toLowerCase();list=list.filter(m=>m.name.toLowerCase().includes(q)||m.email.toLowerCase().includes(q)||m.phone.includes(q))}
  if(memberFilter==='active')list=list.filter(m=>daysDiff(m.expiry)>=0);
  if(memberFilter==='expired')list=list.filter(m=>daysDiff(m.expiry)<0);
  if(memberFilter==='soon')list=list.filter(m=>{const d=daysDiff(m.expiry);return d>=0&&d<=7});
  
  const tbody=document.getElementById('members-tbody');
  if(!list.length){tbody.innerHTML=`<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">🏋️</div><p>No se encontraron miembros</p></div></td></tr>`;return}
  
  tbody.innerHTML=list.map(m=>{
    const diff=daysDiff(m.expiry);
    let sb=diff<0?`<span class="badge badge-expired">Expirado</span>`:diff<=7?`<span class="badge badge-warning">Por vencer</span>`:`<span class="badge badge-active">Activo</span>`;
    let medIcon = m.medical ? `<span style="color:var(--green)">✓ Médico</span>` : `<span style="color:var(--red)">✗ Sin médico</span>`;
    
    return`<tr>
      <td><div style="display:flex;align-items:center;gap:10px">
        <div class="admin-avatar" style="width:32px;height:32px;font-size:11px">${initials(m.name)}</div>
        <div>
            <div class="td-name">${m.name}</div>
            <div class="td-sub">${m.email} &nbsp;|&nbsp; ${medIcon}</div>
        </div>
      </div></td>
      <td>${m.phone}</td>
      <td><span class="badge badge-role">${m.plan}</span></td>
      <td>${formatDate(m.joined)}</td>
      <td><div>${formatDate(m.expiry)}</div><div>${expiryTag(diff)}</div></td>
      <td>${sb}</td>
      <td><div class="td-actions">
        <button class="btn btn-ghost btn-sm" onclick="openEditMember(${m.id})">✏️ Editar</button>
        <button class="btn btn-danger btn-sm" onclick="confirmDelete('member',${m.id})">🗑</button>
      </div></td>
    </tr>`;
  }).join('');
}

function updateExpiryDate() {
    const duration = parseInt(document.getElementById('m-duration').value) || 1;
    const expiryField = document.getElementById('m-expiry');
    const d = new Date();
    d.setMonth(d.getMonth() + duration);
    expiryField.value = d.toISOString().split('T')[0];
}

function openAddMember(){
    clearErrors(); // Limpia errores previos al abrir
    editingMemberId=null;
    document.getElementById('member-modal-title').textContent='Nuevo Miembro';
    ['m-name','m-email','m-phone','m-notes'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});
    document.getElementById('m-plan').value='Mensual';
    document.getElementById('m-duration').value=1;
    document.getElementById('m-auto-renew').checked=false;
    document.getElementById('m-medical').checked=false;
    updateExpiryDate();
    document.getElementById('member-modal').classList.add('open');
}

function openEditMember(id){
    clearErrors(); // Limpia errores previos al abrir
    const m=members.find(x=>x.id===id);if(!m)return;
    editingMemberId=id;
    document.getElementById('member-modal-title').textContent='Editar Miembro';
    document.getElementById('m-name').value=m.name;
    document.getElementById('m-email').value=m.email;
    document.getElementById('m-phone').value=m.phone;
    document.getElementById('m-plan').value=m.plan;
    document.getElementById('m-duration').value=1; 
    document.getElementById('m-expiry').value=m.expiry;
    document.getElementById('m-notes').value=m.notes;
    document.getElementById('m-auto-renew').checked=m.autoRenew||false;
    document.getElementById('m-medical').checked=m.medical||false;
    document.getElementById('member-modal').classList.add('open');
}

function closeMemberModal(){
    clearErrors();
    document.getElementById('member-modal').classList.remove('open');
}

// VALIDACIÓN AL GUARDAR MIEMBRO
function saveMember(){
  clearErrors();
  let hasError = false;

  const name=document.getElementById('m-name').value.trim();
  const email=document.getElementById('m-email').value.trim();
  const phone=document.getElementById('m-phone').value.trim();
  const plan=document.getElementById('m-plan').value;
  const expiry=document.getElementById('m-expiry').value;
  const notes=document.getElementById('m-notes').value.trim();
  const autoRenew=document.getElementById('m-auto-renew').checked;
  const medical=document.getElementById('m-medical').checked;
  const joined=new Date().toISOString().split('T')[0];

  // Reglas de validación
  if(!name) { showError('m-name', 'El nombre es obligatorio'); hasError = true; }
  else if(name.length < 3) { showError('m-name', 'Debe tener al menos 3 letras'); hasError = true; }

  if(!email) { showError('m-email', 'El correo es obligatorio'); hasError = true; }
  else if(!isValidEmail(email)) { showError('m-email', 'Ingresa un correo válido'); hasError = true; }

  // Si hay errores, detenemos el proceso
  if(hasError) {
      toast('Por favor corrige los errores resaltados', 'error');
      return;
  }
  
  // Guardado exitoso
  if(editingMemberId){
      const idx=members.findIndex(x=>x.id===editingMemberId);
      members[idx]={...members[idx],name,email,phone,plan,expiry,notes,autoRenew,medical};
      toast('Miembro actualizado ✓');
  } else {
      members.push({id:nextId(members),name,email,phone,plan,joined,expiry,notes,autoRenew,medical});
      toast('Miembro agregado ✓');
  }
  closeMemberModal();
  renderMembers();
  renderDashboard();
}

// Staff
function renderStaff(){
  let list=[...staff];
  if(staffSearch.trim()){const q=staffSearch.toLowerCase();list=list.filter(s=>s.name.toLowerCase().includes(q)||s.role.toLowerCase().includes(q)||s.email.toLowerCase().includes(q))}
  const grid=document.getElementById('staff-grid');
  if(!list.length){grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">👤</div><p>No se encontró personal</p></div>`;return}
  grid.innerHTML=list.map(s=>`
    <div class="staff-card">
      <div style="display:flex;align-items:center;gap:12px">
        <div class="staff-avatar-big">${initials(s.name)}</div>
        <div><div class="staff-name">${s.name}</div><div class="staff-role-badge" style="margin-top:4px">${s.role}</div></div>
      </div>
      <div class="staff-meta">
        <span>✉️ ${s.email}</span>
        <span>📞 ${s.phone}</span>
        <span>🕐 ${s.schedule}</span>
        <span>📅 Desde ${formatDate(s.since)}</span>
        ${s.notes?`<span>📝 ${s.notes}</span>`:''}
      </div>
      <div class="staff-card-actions">
        <button class="btn btn-ghost btn-sm" style="flex:1" onclick="openEditStaff(${s.id})">✏️ Editar</button>
        <button class="btn btn-danger btn-sm" onclick="confirmDelete('staff',${s.id})">🗑</button>
      </div>
    </div>`).join('');
}

function openAddStaff(){
    clearErrors();
    editingStaffId=null;
    document.getElementById('staff-modal-title').textContent='Nuevo Personal';
    ['s-name','s-email','s-phone','s-role','s-schedule','s-notes'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});
    document.getElementById('s-since').value='';
    document.getElementById('staff-modal').classList.add('open');
}

function openEditStaff(id){
    clearErrors();
    const s=staff.find(x=>x.id===id);if(!s)return;
    editingStaffId=id;
    document.getElementById('staff-modal-title').textContent='Editar Personal';
    document.getElementById('s-name').value=s.name;
    document.getElementById('s-email').value=s.email;
    document.getElementById('s-phone').value=s.phone;
    document.getElementById('s-role').value=s.role;
    document.getElementById('s-schedule').value=s.schedule;
    document.getElementById('s-since').value=s.since;
    document.getElementById('s-notes').value=s.notes;
    document.getElementById('staff-modal').classList.add('open');
}

function closeStaffModal(){
    clearErrors();
    document.getElementById('staff-modal').classList.remove('open');
}

// VALIDACIÓN AL GUARDAR PERSONAL
function saveStaff(){
  clearErrors();
  let hasError = false;

  const name=document.getElementById('s-name').value.trim();
  const email=document.getElementById('s-email').value.trim();
  const phone=document.getElementById('s-phone').value.trim();
  const role=document.getElementById('s-role').value.trim();
  const schedule=document.getElementById('s-schedule').value.trim();
  const since=document.getElementById('s-since').value;
  const notes=document.getElementById('s-notes').value.trim();
  
  // Reglas de validación
  if(!name) { showError('s-name', 'Obligatorio'); hasError = true; }
  if(!email) { showError('s-email', 'Obligatorio'); hasError = true; }
  else if(!isValidEmail(email)) { showError('s-email', 'Correo inválido'); hasError = true; }
  if(!role) { showError('s-role', 'Debes asignar un rol'); hasError = true; }

  if(hasError) {
      toast('Por favor corrige los errores resaltados', 'error');
      return;
  }

  // Guardado exitoso
  if(editingStaffId){
      const idx=staff.findIndex(x=>x.id===editingStaffId);
      staff[idx]={...staff[idx],name,email,phone,role,schedule,since,notes};
      toast('Personal actualizado ✓');
  } else {
      staff.push({id:nextId(staff),name,email,phone,role,schedule,since,notes});
      toast('Personal agregado ✓');
  }
  closeStaffModal();renderStaff();renderDashboard();
}

// Delete
function confirmDelete(type,id){deleteTarget={type,id};const name=type==='member'?members.find(x=>x.id===id)?.name:staff.find(x=>x.id===id)?.name;document.getElementById('confirm-name').textContent=name||'';document.getElementById('confirm-modal').classList.add('open')}
function closeConfirm(){document.getElementById('confirm-modal').classList.remove('open');deleteTarget=null}
function executeDelete(){
  if(!deleteTarget)return;
  const{type,id}=deleteTarget;
  if(type==='member'){members=members.filter(x=>x.id!==id);toast('Miembro eliminado');renderMembers()}
  else{staff=staff.filter(x=>x.id!==id);toast('Personal eliminado');renderStaff()}
  renderDashboard();closeConfirm();
}

// --- GIPHY API ---
const GIPHY_KEY='uhrX1pnROZEN6gb2TDu1FEEbr6O1JfOh';
const GIPHY_TRENDING=()=>`https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=6&rating=g`;
const GIPHY_SEARCH=q=>`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(q)}&limit=6&rating=g`;
let giphyDebounce=null;

async function fetchGiphy(url){
  const grid=document.getElementById('giphy-grid');
  grid.innerHTML='<div class="giphy-placeholder">Cargando...</div>';
  try{const res=await fetch(url);const json=await res.json();renderGiphyGrid(json.data||[])}
  catch{grid.innerHTML='<div class="giphy-placeholder">Sin conexión 😅</div>'}
}

function renderGiphyGrid(gifs){
  const grid=document.getElementById('giphy-grid');
  if(!gifs.length){grid.innerHTML='<div class="giphy-placeholder">Sin resultados</div>';return}
  grid.innerHTML=gifs.map(g=>{const src=g.images?.fixed_width_small?.url||g.images?.fixed_width?.url||'';return src?`<img src="${src}" loading="lazy" alt="${g.title||'gif'}" onclick="selectGif('${src}')"/>`:''}).join('');
}

function selectGif(url){
    document.getElementById('giphy-preview').src=url;
    document.getElementById('giphy-selected').style.display='flex';
    document.getElementById('giphy-grid').style.display='none';
    document.getElementById('giphy-input').value='';
}

function clearGiphy(){
    document.getElementById('giphy-selected').style.display='none';
    document.getElementById('giphy-grid').style.display='grid';
    document.getElementById('giphy-preview').src='';
    fetchGiphy(GIPHY_TRENDING());
}

// Events
document.querySelectorAll('.nav-item').forEach(el=>el.addEventListener('click',()=>navigate(el.dataset.section)));
document.getElementById('hamburger').addEventListener('click',openSidebar);
document.getElementById('overlay-bg').addEventListener('click',closeSidebar);
document.getElementById('member-search').addEventListener('input',e=>{memberSearch=e.target.value;renderMembers()});
document.getElementById('member-filter').addEventListener('change',e=>{memberFilter=e.target.value;renderMembers()});
document.getElementById('staff-search').addEventListener('input',e=>{staffSearch=e.target.value;renderStaff()});
document.querySelectorAll('.modal-overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o) { closeMemberModal(); closeStaffModal(); closeConfirm(); }}));

document.getElementById('giphy-input').addEventListener('input',e=>{
  clearTimeout(giphyDebounce);
  const q=e.target.value.trim();
  giphyDebounce=setTimeout(()=>fetchGiphy(q?GIPHY_SEARCH(q):GIPHY_TRENDING()),420);
});

const mq=window.matchMedia('(max-width:768px)');
function applyMobile(m){
  if(m.matches){
    const db=document.querySelector('.dash-bottom');
    if(db)db.style.gridTemplateColumns='1fr';
  } else {
    const db=document.querySelector('.dash-bottom');
    if(db)db.style.gridTemplateColumns='1fr 1fr';
  }
}
mq.addEventListener('change',applyMobile);applyMobile(mq);

// Init Final
fetchGiphy(GIPHY_TRENDING());
navigate('dashboard');
