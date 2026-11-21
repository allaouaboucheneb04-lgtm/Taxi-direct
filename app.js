const $ = (s) => document.querySelector(s);
const app = $('#app');
const storeKey = 'mon-taxi-direct-demo-v1';
const previousStoreKey = 'taxi-live-demo-v1';
const config = window.TAXI_FIREBASE_CONFIG;
const demo = !config?.apiKey;
const statusLabels = {pending:'À confirmer',confirmed:'Confirmée',completed:'Terminée',cancelled:'Annulée'};
const colors = ['#ffc247','#61d8c8','#e89aa7','#a7b7ff'];
const state = {page:'home',taxiId:null,tab:'reservations',filter:'all',me:null,profile:null,isAdmin:false,
  publicDriver:null,drivers:[],bookings:[],loading:false,unsubscribe:[],watchKey:null,previewImage:'',ready:false};
let firebase = null;
const escapeHtml = (v='') => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cleanPhone = (p='') => String(p).replace(/[^\d+]/g,'');
const safeColor = (s) => /^#[a-f\d]{6}$/i.test(s||'') ? s : '#ffc247';
const pick = (obj, keys) => Object.fromEntries(keys.map(k=>[k,obj[k]??'']));
const urlBase = () => location.href.split('?')[0].split('#')[0];
const taxiUrl = (id) => `${urlBase()}?taxi=${encodeURIComponent(id)}`;
const formatMoney = (n) => new Intl.NumberFormat('fr-CA',{style:'decimal',maximumFractionDigits:0}).format(n);
const formatDate = (date) => {try {return new Date(`${date}:00`).toLocaleString('fr-CA',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}catch{return date}};
const fmtDateOnly = v => {try{return new Date(v).toLocaleDateString('fr-CA',{day:'numeric',month:'short',year:'numeric'})}catch{return '—'}};
const currentLocal = () => {const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;};
const icon = (name,size=20) => {const paths={
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  check:'<path d="m4 12 5 5L20 6"/>',
  close:'<path d="M18 6 6 18M6 6l12 12"/>',
  car:'<path d="m5 11 2-5h10l2 5m-17 0h20v8H2zM6 19v2m12-2v2M2 14h20"/><circle cx="6" cy="15" r="1"/><circle cx="18" cy="15" r="1"/>',
  qr:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M17 14h4v4m-7-4v7h7m-4-4h1"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/><circle cx="9" cy="7" r="4"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pin:'<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.6 19.6 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.4 3a2 2 0 0 1-.6 1.7l-1.2 1a16 16 0 0 0 6.4 6.4l1-1.2a2 2 0 0 1 1.7-.6l3 .4a2 2 0 0 1 1.7 2Z"/>',
  share:'<rect x="4" y="8" width="16" height="13" rx="2"/><path d="M12 15V2m-5 5 5-5 5 5"/>',
  download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
  copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  dashboard:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19 13.5a2 2 0 0 0 0-3l1.5-2.6-2.4-2.4L15.5 7a2 2 0 0 0-3-1.2L12 3h-3l-.5 2.8a2 2 0 0 0-3 1.2L2.9 5.5.5 7.9 2 10.5a2 2 0 0 0 0 3L.5 16.1l2.4 2.4L5.5 17a2 2 0 0 0 3 1.2L9 21h3l.5-2.8a2 2 0 0 0 3-1.2l2.6 1.5 2.4-2.4-1.5-2.6"/>',
  logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9"/>',
  shield:'<path d="m12 22 7-4V6l-7-4-7 4v12l7 4Z"/><path d="m9 12 2 2 4-4"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  note:'<path d="M5 4h14v16H5zM8 9h8M8 13h8M8 17h5"/>',
  edit:'<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'};
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[name]||paths.arrow}</svg>`;
};
const toast = (text,bad=false) => {const node=document.createElement('div');node.className=`toast ${bad?'error':''}`; node.textContent=text; $('#toast-region').append(node);setTimeout(()=>node.remove(),4100);};
function demoSeed(){
  const existing = loadLocal(storeKey,null) || loadLocal(previousStoreKey,null);
  if(existing?.drivers?.length && existing?.bookings){saveLocal(storeKey,existing);return existing;}
  const now = Date.now();const data={drivers:[
    {id:'chauffeur-amine',displayName:'Amine B.',taxiName:'Taxi Amine',phone:'514 555-0134',city:'Montréal',vehicle:'Berline électrique',licensePlate:'',accent:'#ffc247',status:'approved',active:true,createdAt:now-86400000*25},
    {id:'chauffeur-sarah',displayName:'Sarah M.',taxiName:'Taxi Sarah',phone:'514 555-0168',city:'Laval',vehicle:'VUS hybride',licensePlate:'',accent:'#61d8c8',status:'approved',active:true,createdAt:now-86400000*12}
  ],bookings:[
    {id:'TL-1048',driverId:'chauffeur-amine',passengerName:'Nadia B.',passengerPhone:'514 555-1020',pickup:'1200, rue Saint-Antoine, Montréal',dropoff:'Aéroport Montréal-Trudeau (YUL)',datetime:todayAt(18,30),passengers:2,note:'2 bagages',status:'pending',createdAt:now-9800000},
    {id:'TL-1047',driverId:'chauffeur-amine',passengerName:'Marc L.',passengerPhone:'438 555-2390',pickup:'Place Ville Marie, Montréal',dropoff:'Vieux-Port, Montréal',datetime:todayAt(14,15),passengers:1,note:'',status:'confirmed',createdAt:now-86400000},
    {id:'TL-1032',driverId:'chauffeur-amine',passengerName:'Nadia B.',passengerPhone:'514 555-1020',pickup:'Aéroport Montréal-Trudeau (YUL)',dropoff:'Plateau-Mont-Royal, Montréal',datetime:todayAt(10,0),passengers:2,note:'',status:'completed',createdAt:now-86400000*5},
    {id:'TL-1021',driverId:'chauffeur-sarah',passengerName:'Pierre D.',passengerPhone:'514 555-4233',pickup:'Laval, Québec',dropoff:'Gare Centrale, Montréal',datetime:todayAt(16,0),passengers:1,note:'',status:'pending',createdAt:now-86400000}
  ]};saveLocal(storeKey,data);return data;
}
function todayAt(h,m){const d=new Date();d.setDate(d.getDate()+1);d.setHours(h,m,0,0);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;}
function loadLocal(k,fallback){try{const raw=localStorage.getItem(k);return raw?JSON.parse(raw):fallback}catch{return fallback}}
function saveLocal(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
let demoData = demo ? demoSeed() : null;
async function initFirebase(){
  if(demo) return;
  const v='11.10.0';
  const [appModule,authModule,dbModule] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${v}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${v}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${v}/firebase-firestore.js`)]);
  const fbApp=appModule.initializeApp(config), auth=authModule.getAuth(fbApp), db=dbModule.getFirestore(fbApp);
  firebase={auth,db,a:authModule,f:dbModule};
  authModule.onAuthStateChanged(auth,async user=>{
    state.me=user ? {uid:user.uid,email:user.email}:null;
    state.isAdmin=false;state.profile=null;stopWatching();
    if(user){
      try{
        const [adminSnap,profileSnap]=await Promise.all([dbModule.getDoc(dbModule.doc(db,'admins',user.uid)),dbModule.getDoc(dbModule.doc(db,'driversPublic',user.uid))]);
        state.isAdmin=adminSnap.exists();state.profile=profileSnap.exists()?{...profileSnap.data(),id:user.uid}:null;
      }catch(e){console.error(e);toast('Impossible de charger le compte.',true)}
      if(state.page==='login'||state.page==='signup'){state.page=state.isAdmin?'admin':'dashboard';state.tab=state.isAdmin?'drivers':'reservations';}
    }else if(['dashboard','admin'].includes(state.page))state.page='login';
    render();
  });
}
function stopWatching(){state.unsubscribe.forEach(fn=>{try{fn()}catch{}});state.unsubscribe=[];state.watchKey=null;}
function watchData(){
  if(demo){state.bookings=demoData.bookings.slice();state.drivers=demoData.drivers.slice();return}
  if(!state.me)return;
  const key=`${state.me.uid}:${state.isAdmin?'admin':'driver'}`;
  if(state.watchKey===key)return;
  stopWatching();state.watchKey=key;
  const {db,f}=firebase;
  const reservationQuery=state.isAdmin? f.collection(db,'reservations') : f.query(f.collection(db,'reservations'),f.where('driverId','==',state.me.uid));
  state.unsubscribe.push(f.onSnapshot(reservationQuery,s=>{state.bookings=s.docs.map(d=>({id:d.id,...d.data()}));if(['dashboard','admin'].includes(state.page))render();},e=>toast('Lecture des réservations refusée : '+e.message,true)));
  if(state.isAdmin) state.unsubscribe.push(f.onSnapshot(f.collection(db,'driversPublic'),s=>{state.drivers=s.docs.map(d=>({id:d.id,...d.data()}));if(state.page==='admin')render();},e=>toast('Lecture des chauffeurs refusée : '+e.message,true)));
}
async function findPublicDriver(id){
  if(demo) return demoData.drivers.find(d=>d.id===id)||null;
  const {db,f}=firebase;const s=await f.getDoc(f.doc(db,'driversPublic',id));return s.exists()?{id:s.id,...s.data()}:null;
}
async function createBooking(data){
  if(demo){const id=`TL-${Math.floor(1000+Math.random()*9000)}`;const row={...data,id,createdAt:Date.now()};demoData.bookings.unshift(row);saveLocal(storeKey,demoData);state.bookings=demoData.bookings.slice();return id;}
  const {db,f}=firebase;const ref=await f.addDoc(f.collection(db,'reservations'),{...data,createdAt:f.serverTimestamp()});return ref.id;
}
async function changeStatus(id,status){
  if(demo){const b=demoData.bookings.find(b=>b.id===id);if(b)b.status=status;saveLocal(storeKey,demoData);watchData();return;}
  const {db,f}=firebase;await f.updateDoc(f.doc(db,'reservations',id),{status,updatedAt:f.serverTimestamp()});
}
async function changeProfile(id,fields){
  if(demo){const p=demoData.drivers.find(p=>p.id===id);if(!p)throw Error('Profil introuvable');Object.assign(p,fields);saveLocal(storeKey,demoData);if(state.me?.uid===id)state.profile={...p};watchData();return;}
  const {db,f}=firebase;await f.updateDoc(f.doc(db,'driversPublic',id),{...fields,updatedAt:f.serverTimestamp()});
  if(state.profile?.id===id)state.profile={...state.profile,...fields};
}
async function registerDriver(fields,email,password){
  if(demo){
    const id=`chauffeur-${Date.now()}`;const p={id,...fields,status:'pending',active:false,createdAt:Date.now()};
    demoData.drivers.push(p);saveLocal(storeKey,demoData);loginDemo(id);return;
  }
  const {auth,a,db,f}=firebase;
  const cred=await a.createUserWithEmailAndPassword(auth,email,password);
  await f.setDoc(f.doc(db,'driversPublic',cred.user.uid),{...fields,status:'pending',active:false,createdAt:f.serverTimestamp()});
  state.profile={...fields,id:cred.user.uid,status:'pending',active:false};
  state.page='dashboard';render();
}
function loginDemo(id){
  state.me={uid:id,email:id==='admin'?'admin@demo.taxi':'chauffeur@demo.taxi'};
  state.isAdmin=id==='admin';
  state.profile=demoData.drivers.find(d=>d.id===id)||null;
  state.page=state.isAdmin?'admin':'dashboard';state.tab=state.isAdmin?'drivers':'reservations';watchData();navigate(state.page);
}
async function logOut(){stopWatching();if(!demo)await firebase.a.signOut(firebase.auth);state.me=null;state.profile=null;state.isAdmin=false;state.page='home';navigate('home');}
function readRoute(){const u=new URL(location.href);const taxiId=u.searchParams.get('taxi');state.taxiId=taxiId;state.page=taxiId?'booking':(['home','login','signup','dashboard','admin'].includes(u.searchParams.get('page'))?u.searchParams.get('page'):'home');}
function navigate(page,taxiId=null){
  stopWatching();state.page=page;state.taxiId=taxiId;state.publicDriver=null;
  const u=new URL(location.href);u.search='';if(page==='booking'&&taxiId)u.searchParams.set('taxi',taxiId);else if(page!=='home')u.searchParams.set('page',page);
  history.pushState(null,'',u);render();window.scrollTo(0,0);
}
const isValidName = s=>s.trim().length>=2;
const rolesHeader = () => `<header class="topnav"><div class="nav-inner">
  <a href="?page=home" class="brand" data-page="home" aria-label="MonTaxiDirect, accueil"><span class="brand-symbol"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MCA4MCIgcm9sZT0iaW1nIiBhcmlhLWxhYmVsPSJNb25UYXhpRGlyZWN0Ij4KICA8cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iODAiIHJ4PSIxOSIgZmlsbD0iIzE0MjEzOCIvPgogIDxyZWN0IHg9IjkiIHk9IjkiIHdpZHRoPSI2MiIgaGVpZ2h0PSI2MiIgcng9IjE1IiBmaWxsPSIjZmZjMjQ3Ii8+CiAgPHBhdGggZD0iTTIyIDU0VjI3bDEzIDE4IDEzLTE4djI3IiBmaWxsPSJub25lIiBzdHJva2U9IiMxNDIxMzgiIHN0cm9rZS13aWR0aD0iNi41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KICA8cGF0aCBkPSJNNDggNDFoMTNtLTctNyA3IDctNyA3IiBmaWxsPSJub25lIiBzdHJva2U9IiMxNDIxMzgiIHN0cm9rZS13aWR0aD0iNS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cg==" alt="" width="43" height="43" /></span><span class="brand-wordmark"><span class="brand-name">MonTaxi<span class="brand-accent">Direct</span></span><small>VOTRE TAXI. EN DIRECT.</small></span></a>
  <nav class="nav-links" aria-label="Navigation principale">
    <a href="?page=home" data-page="home" class="${state.page==='home'?'active':''}">Accueil</a>
    ${state.me ? `<a href="?page=${state.isAdmin?'admin':'dashboard'}" data-page="${state.isAdmin?'admin':'dashboard'}" class="${['dashboard','admin'].includes(state.page)?'active':''}">Mon espace</a>` : `<a href="?page=login" data-page="login" class="${state.page==='login'?'active':''}">Espace chauffeur</a>`}
  </nav>
  <div class="nav-actions">
    ${demo?'<span class="demo-tag">DÉMO</span>':''}
    ${state.me?`<button class="btn btn-outline btn-small" data-action="logout">${icon('logout',16)} Déconnexion</button>`:`<button class="btn btn-dark btn-small" data-page="signup">Affilier mon taxi ${icon('arrow',16)}</button>`}
  </div>
  </div></header>`;
const footer = () => `<footer class="footer"><div class="shell footer-inner"><span class="footer-brand">MonTaxi<span>Direct</span></span><p>La réservation personnalisée, de votre QR à votre clientèle.</p><small>© ${new Date().getFullYear()} MonTaxiDirect · Réservations individuelles pour chauffeurs</small></div></footer>`;
const topBanner = () => demo?`<div class="demo-banner">Version démonstration : les réservations sont enregistrées uniquement dans ce navigateur. Pour de vraies réservations partagées, configure Firebase et publie le site.</div>`:'';
function renderHome(){return `${rolesHeader()}<main>
  <section class="hero"><div class="shell hero-grid"><div class="hero-copy">
    <span class="eyebrow"><span class="pulse"></span> LA PLATEFORME DES CHAUFFEURS INDÉPENDANTS</span>
    <h1>Vos clients.<br/><em>Votre chauffeur.</em><br/>En direct.</h1>
    <p>Chaque chauffeur a sa propre clientèle, son code QR et sa carte de visite. Avec <strong>MonTaxiDirect</strong>, les clients réservent directement auprès de leur chauffeur préféré.</p>
    <div class="hero-actions"><button class="btn btn-lime" data-page="signup">Rejoindre la plateforme ${icon('arrow',18)}</button>
    <button class="btn btn-transparent" data-page="login">Accéder à mon espace ${icon('arrow',17)}</button></div>
    <div class="hero-proof"><span class="proof-dot">${icon('check',15)}</span> Aucune réservation envoyée à un autre chauffeur</div>
  </div><div class="hero-visual"><div class="visual-grid"></div><div class="mockup-outer">
    <div class="mockup-top"><span>MON ESPACE CHAUFFEUR</span><span class="live-indicator">● EN DIRECT</span></div>
    <div class="mockup-hello">Bonjour, Amine <span>✳</span></div><div class="mockup-sub">Voici votre activité du jour.</div>
    <div class="mockup-stats"><div><small>Réservations</small><b>08</b><span>↗ Cette semaine</span></div><div><small>Clients</small><b>24</b><span>↗ Votre réseau</span></div></div>
    <div class="mockup-res"><span class="mockup-avatar">NB</span><div><b>Nadia B.</b><small>Centre-ville → Aéroport YUL</small></div><span class="status-pill pending">À confirmer</span></div>
    <div class="mockup-res"><span class="mockup-avatar muted">ML</span><div><b>Marc L.</b><small>Place Ville Marie → Vieux-Port</small></div><span class="status-pill confirmed">Confirmée</span></div>
  </div><div class="qr-float"><span class="float-kicker">TON LIEN PERSONNEL</span><div class="qr-float-box" id="hero-qr"></div><strong>Scannez. Réservez.</strong><small>Réservation directe</small></div>
  <div class="accent-circle"></div></div></div></section>
  <section class="benefits"><div class="shell"><div class="section-heading"><div><span class="kicker">CONÇU POUR VOUS</span><h2>Un réseau. Des clients qui restent les vôtres.</h2></div><p>Tout ce dont un chauffeur indépendant a besoin pour développer sa clientèle sans perdre sa relation avec elle.</p></div>
  <div class="benefit-grid">
    <article class="benefit-card"><div class="benefit-icon">${icon('qr',27)}</div><span>01 / VISIBILITÉ</span><h3>Code QR unique</h3><p>Un QR personnel à poser dans le véhicule, sur tes cartes et dans tes messages.</p></article>
    <article class="benefit-card"><div class="benefit-icon">${icon('calendar',27)}</div><span>02 / RÉSERVATIONS</span><h3>Demandes centralisées</h3><p>Heure, trajet, téléphone et statut de chaque réservation, au même endroit.</p></article>
    <article class="benefit-card"><div class="benefit-icon">${icon('users',27)}</div><span>03 / CLIENTÈLE</span><h3>Ton carnet clients</h3><p>Retrouve les clients qui ont réservé avec toi, indépendamment des autres taxis.</p></article>
    <article class="benefit-card"><div class="benefit-icon">${icon('share',27)}</div><span>04 / IMAGE</span><h3>Carte de visite à ton nom</h3><p>Crée et télécharge une carte professionnelle avec ton QR et ton numéro.</p></article>
  </div></div></section>
  <section class="steps"><div class="shell step-layout"><div><span class="kicker">D'UN SIMPLE SCAN À LA COURSE</span><h2>La fidélité commence avec un QR.</h2><p>Plus besoin de demander au client de te chercher. Il garde ton lien et revient directement vers toi.</p>
    ${demo?`<button class="btn btn-dark" data-action="demo-booking">Tester une réservation ${icon('arrow',17)}</button>`:`<button class="btn btn-dark" data-page="signup">Inscrire un chauffeur ${icon('arrow',17)}</button>`}
  </div><div class="step-list"><div><b>01</b><span><strong>Le client scanne</strong><small>Ton QR ou ta carte de visite.</small></span></div><div><b>02</b><span><strong>Il demande sa course</strong><small>Adresse, destination, jour, heure et contact.</small></span></div><div><b>03</b><span><strong>Tu gères la réservation</strong><small>Tu confirmes ou annules dans ton espace.</small></span></div></div></div></section>
  </main>${footer()}`;}
function qrData(url,scale=7){
  const QR=window.TaxiQRCode;
  if(!QR)return '';
  const qr=new QR(0,window.TaxiQRErrorLevel.M);qr.addData(url);qr.make();
  const count=qr.getModuleCount(),border=4;
  const c=document.createElement('canvas');c.width=c.height=(count+border*2)*scale;
  const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#142138';
  for(let y=0;y<count;y++)for(let x=0;x<count;x++)if(qr.isDark(y,x))ctx.fillRect((x+border)*scale,(y+border)*scale,scale,scale);
  return c.toDataURL('image/png');
}
function qrMarkup(url,css=''){const data=qrData(url);return data?`<img class="qr-image ${css}" src="${data}" alt="Code QR vers la page personnelle de réservation" />`:`<span>QR indisponible</span>`;}
function reservationForm(driver){
  const active=!!driver.active && driver.status==='approved';
  return `${rolesHeader()}<main class="booking-page"><div class="shell">
   <div class="breadcrumbs"><button data-page="home">Accueil</button><span>/</span> Réserver un taxi</div>
   <div class="booking-layout">
    <div class="booking-info"><span class="kicker">VOTRE CHAUFFEUR ATTITRÉ</span><h1>Votre trajet.<br/><em>Votre chauffeur.</em></h1>
      <p>Faites votre demande directement auprès de ce chauffeur. Vous recevrez une référence après l'envoi.</p>
      <div class="driver-big-card"><div class="driver-image">${icon('car',44)}</div><div><span class="driver-label">CHAUFFEUR PARTENAIRE</span><h2>${escapeHtml(driver.displayName)}</h2><b>${escapeHtml(driver.taxiName||'Taxi indépendant')}</b><p>${icon('pin',17)} ${escapeHtml(driver.city||'Québec')}</p><p>${icon('car',17)} ${escapeHtml(driver.vehicle||'Transport privé')}</p>
      ${driver.phone?`<a href="tel:${cleanPhone(driver.phone)}" class="phone-link">${icon('phone',17)} ${escapeHtml(driver.phone)}</a>`:''}
      </div></div>
      <div class="booking-secure">${icon('shield',22)} <span><strong>Réservation personnelle</strong><small>Votre demande est attribuée uniquement à ce chauffeur et à l'administration du site.</small></span></div>
    </div>
    <div class="booking-card"><div class="form-head"><span class="form-icon">${icon('calendar',22)}</span><div><h2>Demander une course</h2><p>Remplissez les informations ci-dessous.</p></div></div>
      ${active?`<form id="booking-form" data-driver-id="${escapeHtml(driver.id)}" class="form-stack">
      <div class="field"><label for="pickup">Adresse de départ <span>*</span></label><div class="field-icon">${icon('pin',19)}<input id="pickup" name="pickup" placeholder="Adresse de prise en charge" required maxlength="180" minlength="3" autocomplete="street-address" /></div></div>
      <div class="field"><label for="dropoff">Destination <span>*</span></label><div class="field-icon">${icon('pin',19)}<input id="dropoff" name="dropoff" placeholder="Adresse de destination" required maxlength="180" minlength="3" /></div></div>
      <div class="field two-col"><div><label for="datetime">Date et heure (Québec) <span>*</span></label><input id="datetime" name="datetime" type="datetime-local" value="${todayAt(10,0)}" min="${currentLocal()}" required /></div><div><label for="passengers">Passagers <span>*</span></label><select id="passengers" name="passengers">${[1,2,3,4,5,6].map(x=>`<option value="${x}">${x} ${x===1?'passager':'passagers'}</option>`).join('')}</select></div></div>
      <div class="field two-col"><div><label for="passengerName">Votre nom <span>*</span></label><input id="passengerName" name="passengerName" placeholder="Prénom et nom" minlength="2" maxlength="100" required autocomplete="name" /></div><div><label for="passengerPhone">Téléphone <span>*</span></label><input id="passengerPhone" name="passengerPhone" type="tel" placeholder="514 123-4567" minlength="7" maxlength="30" required autocomplete="tel" /></div></div>
      <div class="field"><label for="note">Informations utiles <small>(facultatif)</small></label><textarea id="note" name="note" rows="3" placeholder="Bagages, accessibilité, indications…" maxlength="500"></textarea></div>
      <div class="honeypot"><label>Site web <input name="website" tabindex="-1" autocomplete="off" /></label></div>
      <p class="privacy-note">En envoyant, vous acceptez que vos coordonnées soient utilisées par ce chauffeur et l'administration pour traiter votre demande.</p>
      <button type="submit" class="btn btn-dark btn-full" id="booking-submit">Envoyer ma demande ${icon('arrow',18)}</button><p class="form-footnote">La course doit être confirmée par le chauffeur. Aucun paiement n'est prélevé en ligne.</p>
      </form>`:`<div class="empty-state"><h3>Les réservations sont temporairement indisponibles</h3><p>Ce chauffeur n'accepte pas de demandes pour le moment.</p>${driver.phone?`<a class="btn btn-dark" href="tel:${cleanPhone(driver.phone)}">Appeler le chauffeur</a>`:''}</div>`}
    </div>
   </div></div></main>${footer()}`;
}
function bookingComplete(driver,bookingId){
  return `${rolesHeader()}<main class="complete-page"><div class="complete-card"><span class="complete-icon">${icon('check',34)}</span><span class="kicker">DEMANDE TRANSMISE</span><h1>Merci pour votre réservation !</h1><p>Votre demande de course a bien été envoyée à <b>${escapeHtml(driver.displayName)}</b>. Elle est en attente de confirmation par le chauffeur.</p>
  <div class="reference"><small>RÉFÉRENCE DE LA DEMANDE</small><strong>${escapeHtml(bookingId)}</strong></div>
  ${driver.phone?`<a class="btn btn-dark" href="tel:${cleanPhone(driver.phone)}">${icon('phone',17)} Contacter le chauffeur</a>`:''}
  <button class="btn btn-outline" data-action="same-driver" data-id="${escapeHtml(driver.id)}">Nouvelle réservation ${icon('arrow',16)}</button>
  <p class="subtle">Conservez cette référence. Une demande ne garantit pas la disponibilité du chauffeur.</p></div></main>${footer()}`;
}
function renderLogin(){return `${rolesHeader()}<main class="account-page"><div class="shell account-grid"><div class="account-aside"><span class="kicker">ESPACE CHAUFFEUR</span><h1>Vos clients. Votre activité. <em>Un seul endroit.</em></h1><p>Gérez vos réservations et partagez votre carte de visite, depuis votre téléphone ou votre ordinateur.</p><div class="account-feature">${icon('shield',23)} Un espace réservé à chaque chauffeur</div></div>
  <div class="auth-card"><span class="auth-label">ACCÈS PARTENAIRE</span><h2>Se connecter</h2><p>Retrouvez votre espace personnel.</p>
  ${demo?`<div class="demo-signin"><p><b>Essayer les comptes de démonstration</b></p><button class="demo-account" data-demo-user="chauffeur-amine"><span class="person-bubble">AB</span><span><strong>Amine B.</strong><small>Chauffeur · 3 réservations</small></span>${icon('arrow',19)}</button>
  <button class="demo-account" data-demo-user="chauffeur-sarah"><span class="person-bubble teal">SM</span><span><strong>Sarah M.</strong><small>Chauffeuse · réservations distinctes</small></span>${icon('arrow',19)}</button>
  <button class="demo-account" data-demo-user="admin"><span class="person-bubble purple">AD</span><span><strong>Administration</strong><small>Gérer les chauffeurs affiliés</small></span>${icon('arrow',19)}</button></div>`:
  `<form id="login-form" class="form-stack"><div class="field"><label for="email">Adresse courriel</label><input id="email" name="email" type="email" required autocomplete="email" /></div><div class="field"><label for="password">Mot de passe</label><input id="password" name="password" type="password" minlength="6" required autocomplete="current-password" /></div><button class="btn btn-dark btn-full" type="submit">Se connecter ${icon('arrow',17)}</button></form>`}
  <div class="auth-bottom">Pas encore affilié ? <button class="text-button" data-page="signup">Créer mon compte chauffeur</button></div></div>
  </div></main>${footer()}`;}
function renderSignup(){return `${rolesHeader()}<main class="account-page"><div class="shell account-grid"><div class="account-aside"><span class="kicker">REJOINDRE LE RÉSEAU</span><h1>Développez votre clientèle. <em>Gardez votre identité.</em></h1><p>Créez votre profil personnel et obtenez votre carte et votre QR après validation par l'administrateur.</p><div class="account-feature">${icon('qr',23)} Votre QR personnalisé</div><div class="account-feature">${icon('users',23)} Votre propre clientèle</div></div>
  <div class="auth-card signup-card"><span class="auth-label">INSCRIPTION CHAUFFEUR</span><h2>Affilier mon taxi</h2><p>Les nouveaux comptes sont soumis à approbation.</p><form id="signup-form" class="form-stack">
  <div class="field"><label for="name">Nom du chauffeur *</label><input name="displayName" id="name" minlength="2" maxlength="80" placeholder="Prénom et nom" required /></div>
  <div class="field"><label for="taxiName">Nom commercial *</label><input name="taxiName" id="taxiName" maxlength="80" placeholder="Ex. Taxi Amine" required /></div>
  <div class="field two-col"><div><label for="city">Ville *</label><input name="city" id="city" maxlength="70" placeholder="Montréal" required /></div><div><label for="phone">Téléphone professionnel *</label><input name="phone" id="phone" type="tel" maxlength="30" required placeholder="514 123-4567" /></div></div>
  <div class="field"><label for="vehicle">Véhicule</label><input name="vehicle" id="vehicle" maxlength="100" placeholder="Ex. Chevrolet Equinox EV" /></div>
  ${!demo?`<div class="field"><label for="signupEmail">Adresse courriel *</label><input name="email" type="email" id="signupEmail" required autocomplete="email" /></div><div class="field"><label for="signupPassword">Mot de passe (6 caractères min.) *</label><input name="password" type="password" id="signupPassword" minlength="6" required autocomplete="new-password" /></div>`:''}
  <button class="btn btn-dark btn-full" type="submit">Créer mon compte ${icon('arrow',17)}</button></form><div class="auth-bottom">Déjà affilié ? <button class="text-button" data-page="login">Me connecter</button></div></div>
  </div></main>${footer()}`;}
function statusBadge(s){return `<span class="status-pill ${escapeHtml(s)}"><span class="status-dot"></span>${statusLabels[s]||'Inconnu'}</span>`;}
function getOwnBookings(){return state.bookings.filter(b=>state.isAdmin || b.driverId===state.me?.uid).sort((a,b)=>{
  const getTime=x=>x?.toDate?.()?.getTime?.()||new Date(x||0).getTime()||0;
  return getTime(b.createdAt)-getTime(a.createdAt);
});}
function getClientRows(rows){
  const map=new Map();
  rows.forEach(b=>{let key=cleanPhone(b.passengerPhone).replace(/^\+?1(?=\d{10}$)/,'');if(!key)key=b.passengerName;
    if(!map.has(key))map.set(key,{name:b.passengerName,phone:b.passengerPhone,count:0,last:b.datetime});
    const obj=map.get(key);obj.count++;if(b.datetime>obj.last)obj.last=b.datetime;
  });return [...map.values()].sort((a,b)=>b.count-a.count);
}
function statusSelect(b){return `<select class="tiny-select" data-status-id="${escapeHtml(b.id)}" aria-label="Changer le statut de ${escapeHtml(b.passengerName)}">
  ${Object.entries(statusLabels).map(([key,label])=>`<option value="${key}" ${b.status===key?'selected':''}>${label}</option>`).join('')}</select>`;}
function bookingTable(rows,admin=false){
  if(!rows.length)return `<div class="empty-state table-empty"><span class="empty-icon">${icon('calendar',31)}</span><h3>Aucune réservation pour ce filtre</h3><p>Les nouvelles demandes apparaîtront ici dès qu'un client utilisera votre page.</p></div>`;
  return `<div class="table-scroll"><table class="data-table"><thead><tr><th>Client</th>${admin?'<th>Chauffeur</th>':''}<th>Trajet</th><th>Date de course</th><th>Statut</th><th>Action</th></tr></thead><tbody>
    ${rows.map(b=>`<tr><td><div class="table-person"><span class="small-avatar">${escapeHtml((b.passengerName||'C').substring(0,1).toUpperCase())}</span><span><strong>${escapeHtml(b.passengerName)}</strong><small><a href="tel:${cleanPhone(b.passengerPhone)}">${escapeHtml(b.passengerPhone)}</a></small></span></div></td>
    ${admin?`<td>${escapeHtml(state.drivers.find(d=>d.id===b.driverId)?.displayName||b.driverId)}</td>`:''}
    <td><div class="route-cell"><b>${escapeHtml(b.pickup)}</b><small>↓ ${escapeHtml(b.dropoff)}</small>${b.note?`<small class="note-small" title="${escapeHtml(b.note)}">${icon('note',13)} ${escapeHtml(b.note)}</small>`:''}</div></td>
    <td><div class="date-cell">${icon('calendar',15)} ${escapeHtml(formatDate(b.datetime))}<small>${escapeHtml(b.passengers||1)} passager(s)</small></div></td>
    <td>${statusBadge(b.status)}</td><td>${statusSelect(b)}</td></tr>`).join('')}
  </tbody></table></div>`;
}
function filteredBookings(rows){return state.filter==='all'?rows:rows.filter(b=>b.status===state.filter);}
function driverTabs(){return `<div class="dashboard-tabs" role="tablist" aria-label="Sections chauffeur">
 ${[['reservations','Réservations','calendar'],['clients','Mes clients','users'],['carte','Ma carte & QR','qr'],['profil','Mon profil','settings']].map(([k,l,ico])=>`<button role="tab" aria-selected="${state.tab===k}" class="tab ${state.tab===k?'selected':''}" data-tab="${k}">${icon(ico,18)} ${l}</button>`).join('')}
 </div>`;}
function renderDashboard(){
 if(!state.me)return renderLogin();
 if(state.isAdmin)return renderAdmin();
 watchData();const p=state.profile;
 if(!p)return `${rolesHeader()}<main class="shell dashboard"><div class="panel"><h2>Profil en cours de création</h2><p>Le compte est connecté, mais la fiche du chauffeur n'a pas encore été trouvée. Si l'inscription vient d'être créée, actualisez la page.</p><button class="btn btn-outline" data-action="refresh-profile">Actualiser</button></div></main>`;
 const mine=getOwnBookings(),clients=getClientRows(mine);
 return `${rolesHeader()}<main class="dashboard"><div class="shell">
  <div class="dash-head"><div><span class="kicker">TABLEAU DE BORD CHAUFFEUR</span><h1>Bonjour, ${escapeHtml(p.displayName.split(' ')[0])} <span class="wave">✳</span></h1><p>Gérez votre activité et restez proche de vos clients.</p></div>
  ${p.active?`<button class="btn btn-lime" data-action="copy-link">${icon('copy',17)} Copier mon lien de réservation</button>`:''}</div>
  ${!p.active?`<div class="warning-panel"><div>${icon('shield',23)}</div><div><strong>Compte en attente d'approbation</strong><p>Ton profil est créé. L'administrateur doit l'activer avant que les clients puissent réserver et utiliser ton code QR.</p></div></div>`:''}
  <div class="stats-grid"><div class="stat-card"><span class="stat-icon">${icon('calendar',22)}</span><small>Total des réservations</small><strong>${formatMoney(mine.length)}</strong><span>Uniquement votre clientèle</span></div>
  <div class="stat-card"><span class="stat-icon">${icon('clock',22)}</span><small>À confirmer</small><strong>${formatMoney(mine.filter(b=>b.status==='pending').length)}</strong><span>Demandes en attente</span></div>
  <div class="stat-card"><span class="stat-icon">${icon('check',22)}</span><small>Confirmées</small><strong>${formatMoney(mine.filter(b=>b.status==='confirmed').length)}</strong><span>Courses planifiées</span></div>
  <div class="stat-card"><span class="stat-icon">${icon('users',22)}</span><small>Clients personnels</small><strong>${formatMoney(clients.length)}</strong><span>Identifiés par téléphone</span></div></div>
  ${driverTabs()}
  ${state.tab==='reservations'?`<section class="panel"><div class="panel-heading"><div><h2>Mes réservations <span class="count">${mine.length}</span></h2><p>Confirmez les demandes et suivez chaque course.</p></div><select id="booking-filter" class="filter-select" aria-label="Filtrer par statut">${[['all','Tous les statuts'],...Object.entries(statusLabels)].map(([k,v])=>`<option value="${k}" ${state.filter===k?'selected':''}>${v}</option>`).join('')}</select></div>${bookingTable(filteredBookings(mine))}</section>`:''}
  ${state.tab==='clients'?`<section class="panel"><div class="panel-heading"><div><h2>Mon carnet clients <span class="count">${clients.length}</span></h2><p>Liste issue uniquement de vos propres demandes de courses.</p></div></div>
    ${clients.length?`<div class="client-grid">${clients.map(c=>`<div class="client-card"><span class="client-icon">${escapeHtml(c.name[0]?.toUpperCase()||'?')}</span><div><strong>${escapeHtml(c.name)}</strong><a href="tel:${cleanPhone(c.phone)}">${icon('phone',15)} ${escapeHtml(c.phone)}</a><small>${c.count} réservation(s) · Dernière course : ${escapeHtml(formatDate(c.last))}</small></div></div>`).join('')}</div>`:`<div class="empty-state"><h3>Aucun client pour le moment</h3><p>Vos clients s'ajouteront ici dès leur première réservation.</p></div>`}</section>`:''}
  ${state.tab==='carte'?renderDriverCard(p):''}
  ${state.tab==='profil'?renderProfileForm(p):''}
 </div></main>${footer()}`;
}
function renderDriverCard(p){
 const link=taxiUrl(p.id);
 return `<section class="panel"><div class="panel-heading"><div><h2>Mon code QR & ma carte</h2><p>Votre identité professionnelle, prête à partager.</p></div></div>
  <div class="card-layout"><div class="card-showcase"><span class="card-side-caption">APERÇU DE LA CARTE DE VISITE</span><div class="business-card" style="--driver-accent:${safeColor(p.accent)}">
  <div class="business-card-left"><div class="business-logo"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MCA4MCIgcm9sZT0iaW1nIiBhcmlhLWxhYmVsPSJNb25UYXhpRGlyZWN0Ij4KICA8cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iODAiIHJ4PSIxOSIgZmlsbD0iIzE0MjEzOCIvPgogIDxyZWN0IHg9IjkiIHk9IjkiIHdpZHRoPSI2MiIgaGVpZ2h0PSI2MiIgcng9IjE1IiBmaWxsPSIjZmZjMjQ3Ii8+CiAgPHBhdGggZD0iTTIyIDU0VjI3bDEzIDE4IDEzLTE4djI3IiBmaWxsPSJub25lIiBzdHJva2U9IiMxNDIxMzgiIHN0cm9rZS13aWR0aD0iNi41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KICA8cGF0aCBkPSJNNDggNDFoMTNtLTctNyA3IDctNyA3IiBmaWxsPSJub25lIiBzdHJva2U9IiMxNDIxMzgiIHN0cm9rZS13aWR0aD0iNS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cg==" alt="" width="24" height="24" /> MonTaxi<span>Direct</span></div><div class="business-card-main"><small>CHAUFFEUR PRIVÉ</small><strong>${escapeHtml(p.displayName)}</strong><span>${escapeHtml(p.taxiName||'Taxi indépendant')}</span></div><div class="business-meta">${icon('phone',15)} ${escapeHtml(p.phone||'Téléphone non renseigné')}<small>${escapeHtml(p.city||'Québec')}</small></div></div>
  <div class="business-card-right">${qrMarkup(link)}<strong>SCANNEZ POUR</strong><span>RÉSERVER</span></div></div>
  <div class="card-buttons"><button class="btn btn-dark" data-action="download-card" ${!p.active?'disabled':''}>${icon('download',17)} Télécharger la carte PNG</button><button class="btn btn-outline" data-action="print-card" ${!p.active?'disabled':''}>${icon('share',17)} Imprimer / PDF</button></div>
  </div><div class="qr-share"><span class="card-side-caption">VOTRE CODE QR UNIQUE</span><div class="qr-panel">${qrMarkup(link,'qr-large')}</div><p>Scannez ce code pour accéder directement au formulaire de réservation de <b>${escapeHtml(p.displayName)}</b>.</p>
  <label class="link-label" for="personal-link">LIEN PERSONNEL</label><div class="copy-row"><input id="personal-link" readonly value="${escapeHtml(link)}"/><button class="btn btn-icon" data-action="copy-link" aria-label="Copier le lien">${icon('copy',19)}</button></div>
  ${demo?'<small class="demo-qr-warning">En démo locale, le lien QR ne sera accessible depuis un autre téléphone qu’après publication sur un hébergement web.</small>':''}
  ${!p.active?'<small class="demo-qr-warning">Ton QR sera utilisable après activation du compte par l’administrateur.</small>':''}
  </div></div></section>`;
}
function renderProfileForm(p){return `<section class="panel profile-panel"><div class="panel-heading"><div><h2>Mon profil public</h2><p>Ces informations apparaissent sur votre page et sur votre carte.</p></div></div>
  <form id="profile-form" class="form-stack"><div class="field two-col"><div><label for="pfName">Nom public</label><input id="pfName" name="displayName" required minlength="2" maxlength="80" value="${escapeHtml(p.displayName)}"/></div><div><label for="pfTaxi">Nom commercial</label><input id="pfTaxi" name="taxiName" required maxlength="80" value="${escapeHtml(p.taxiName)}"/></div></div>
  <div class="field two-col"><div><label for="pfPhone">Téléphone professionnel</label><input id="pfPhone" name="phone" type="tel" required maxlength="30" value="${escapeHtml(p.phone)}"/></div><div><label for="pfCity">Ville</label><input id="pfCity" name="city" required maxlength="70" value="${escapeHtml(p.city)}"/></div></div>
  <div class="field"><label for="pfVehicle">Véhicule</label><input id="pfVehicle" name="vehicle" maxlength="100" value="${escapeHtml(p.vehicle)}"/></div>
  <div class="field"><label>Couleur de la carte</label><div class="color-picker">${colors.map(c=>`<label style="--swatch:${c}"><input type="radio" name="accent" value="${c}" ${safeColor(p.accent)===c?'checked':''}/><span>${icon('check',17)}</span></label>`).join('')}</div></div>
  <button type="submit" class="btn btn-dark profile-save">${icon('check',18)} Enregistrer les changements</button></form></section>`;}
function renderAdmin(){
 if(!state.me)return renderLogin();
 if(!state.isAdmin)return `<main class="shell"><div class="panel"><h2>Accès refusé</h2><p>Ce compte n'est pas administrateur.</p><button data-page="dashboard" class="btn btn-dark">Mon espace</button></div></main>`;
 watchData();const drivers=state.drivers.slice().sort((a,b)=>Number(a.active)-Number(b.active)),bookings=getOwnBookings();
 const pending=drivers.filter(d=>d.status==='pending');
 return `${rolesHeader()}<main class="dashboard"><div class="shell"><div class="dash-head"><div><span class="kicker">ADMINISTRATION DU RÉSEAU</span><h1>Pilotez votre réseau <span class="wave">✳</span></h1><p>Approuvez les chauffeurs et supervisez les demandes.</p></div><span class="admin-badge">${icon('shield',17)} ADMINISTRATEUR</span></div>
 <div class="stats-grid"><div class="stat-card"><span class="stat-icon">${icon('users',22)}</span><small>Chauffeurs affiliés</small><strong>${drivers.length}</strong><span>Tous statuts confondus</span></div>
 <div class="stat-card"><span class="stat-icon">${icon('check',22)}</span><small>Chauffeurs actifs</small><strong>${drivers.filter(d=>d.active).length}</strong><span>Pages de réservation ouvertes</span></div>
 <div class="stat-card"><span class="stat-icon">${icon('clock',22)}</span><small>Comptes à valider</small><strong>${pending.length}</strong><span>En attente d'approbation</span></div>
 <div class="stat-card"><span class="stat-icon">${icon('calendar',22)}</span><small>Réservations du réseau</small><strong>${bookings.length}</strong><span>Vue de supervision</span></div></div>
 <div class="dashboard-tabs">${[['drivers','Chauffeurs affiliés','users'],['all-bookings','Toutes les réservations','calendar']].map(([k,t,i])=>`<button class="tab ${state.tab===k?'selected':''}" data-tab="${k}">${icon(i,18)} ${t}</button>`).join('')}</div>
 ${state.tab==='all-bookings'?`<section class="panel"><div class="panel-heading"><div><h2>Réservations du réseau</h2><p>Accès administratif réservé à la gestion.</p></div><select id="booking-filter" class="filter-select"><option value="all" ${state.filter==='all'?'selected':''}>Tous les statuts</option>${Object.entries(statusLabels).map(([v,l])=>`<option value="${v}" ${state.filter===v?'selected':''}>${l}</option>`).join('')}</select></div>${bookingTable(filteredBookings(bookings),true)}</section>`:
 `<section class="panel"><div class="panel-heading"><div><h2>Chauffeurs affiliés <span class="count">${drivers.length}</span></h2><p>Un chauffeur = une page unique, un code QR, sa propre clientèle.</p></div></div>
 ${drivers.length?`<div class="admin-driver-grid">${drivers.map(d=>`<div class="admin-driver-card"><div class="driver-card-top"><div class="small-driver-avatar" style="background:${safeColor(d.accent)}">${icon('car',22)}</div><span class="admin-driver-status ${d.active?'active':'pending'}">${d.active?'● Actif':d.status==='pending'?'● En attente':'● Désactivé'}</span></div><h3>${escapeHtml(d.displayName)}</h3><p>${escapeHtml(d.taxiName||'Taxi indépendant')} · ${escapeHtml(d.city||'Québec')}</p><a href="tel:${cleanPhone(d.phone)}" class="driver-phone">${icon('phone',15)} ${escapeHtml(d.phone)}</a>
 <div class="admin-driver-stats"><span>${bookings.filter(b=>b.driverId===d.id).length} réservation(s)</span><span>${getClientRows(bookings.filter(b=>b.driverId===d.id)).length} client(s)</span></div>
 <div class="admin-driver-actions">${d.active?`<button class="btn btn-outline btn-small" data-action="disable-driver" data-id="${escapeHtml(d.id)}">Désactiver</button>`:`<button class="btn btn-dark btn-small" data-action="approve-driver" data-id="${escapeHtml(d.id)}">${icon('check',15)} Activer</button>`}
 <button class="btn btn-outline btn-small" data-action="view-driver" data-id="${escapeHtml(d.id)}">${icon('arrow',15)} Page</button></div></div>`).join('')}</div>`:`<div class="empty-state"><h3>Pas encore de chauffeurs</h3><p>Invitez un chauffeur à créer son compte.</p></div>`}</section>`}
 </div></main>${footer()}`;
}
function renderLoading(){return `${rolesHeader()}<main class="loading-page"><div class="loader"></div><p>Chargement des informations…</p></main>`;}
function renderNotFound(){return `${rolesHeader()}<main class="complete-page"><div class="complete-card"><h1>Chauffeur introuvable</h1><p>Ce lien de réservation n'est pas valide. Vérifiez le code QR ou demandez un nouveau lien au chauffeur.</p><button class="btn btn-dark" data-page="home">Retour à l'accueil</button></div></main>${footer()}`;}
async function loadBookingDriver(taxiId){
 try{const p=await findPublicDriver(taxiId);if(state.page==='booking'&&state.taxiId===taxiId){state.publicDriver=p;render();}}
 catch(e){console.error(e);toast('Impossible de charger cette page.',true);if(state.page==='booking'&&state.taxiId===taxiId){state.publicDriver=false;render()}}
}
function render(){
 if(!state.ready)return;
 let html='';
 if(state.page==='home')html=renderHome();
 else if(state.page==='login')html=renderLogin();
 else if(state.page==='signup')html=renderSignup();
 else if(state.page==='dashboard')html=renderDashboard();
 else if(state.page==='admin')html=renderAdmin();
 else if(state.page==='booking'){
   if(state.publicDriver===null){html=renderLoading();loadBookingDriver(state.taxiId)}
   else html=state.publicDriver?reservationForm(state.publicDriver):renderNotFound();
 }else html=renderHome();
 app.innerHTML=topBanner()+html;
 if(state.page==='home'){$('#hero-qr')?.insertAdjacentHTML('afterbegin',qrMarkup(demo?taxiUrl('chauffeur-amine'):urlBase()));}
 document.title=`${state.page==='booking'&&state.publicDriver?`Réserver avec ${state.publicDriver.displayName}`:'MonTaxiDirect'} — Réservations`;
}
function drawQr(ctx,url,x,y,size){
  const QR=window.TaxiQRCode;const qr=new QR(0,window.TaxiQRErrorLevel.M);qr.addData(url);qr.make();
  const count=qr.getModuleCount(),quiet=4,cell=size/(count+quiet*2);
  ctx.fillStyle='#ffffff';ctx.fillRect(x,y,size,size);ctx.fillStyle='#142138';
  for(let row=0;row<count;row++)for(let col=0;col<count;col++)if(qr.isDark(row,col))ctx.fillRect(x+(col+quiet)*cell-.08,y+(row+quiet)*cell-.08,cell+.16,cell+.16);
}
function makeCardCanvas(p){
  const c=document.createElement('canvas');c.width=1200;c.height=757;const g=c.getContext('2d');
  const accent=safeColor(p.accent),name=p.displayName||'Chauffeur';
  g.fillStyle='#142138';g.fillRect(0,0,1200,757);
  g.fillStyle='#1b2e4b';g.beginPath();g.arc(40,770,430,0,Math.PI*2);g.fill();
  g.fillStyle='#213d56';g.beginPath();g.arc(730,-20,250,0,Math.PI*2);g.fill();
  g.fillStyle='#f9fafc';g.fillRect(790,0,410,757);
  g.fillStyle=accent;g.fillRect(0,0,22,757);
  // MonTaxiDirect mark: an M that becomes a forward arrow.
  g.fillStyle=accent;g.beginPath();g.roundRect(74,54,58,58,14);g.fill();
  g.strokeStyle='#142138';g.lineWidth=6;g.lineJoin='round';g.lineCap='round';
  g.beginPath();g.moveTo(87,94);g.lineTo(87,72);g.lineTo(96,83);g.lineTo(105,72);g.lineTo(105,94);g.stroke();
  g.beginPath();g.moveTo(109,84);g.lineTo(122,84);g.lineTo(117,79);g.moveTo(122,84);g.lineTo(117,89);g.stroke();
  g.font='bold 38px Arial';g.fillStyle='#fff';g.fillText('MonTaxi',148,95);
  const w=g.measureText('MonTaxi').width;g.fillStyle=accent;g.fillText('Direct',148+w,95);
  g.fillStyle='#a7bab8';g.font='19px Arial';g.fillText('CHAUFFEUR INDÉPENDANT',78,235);
  g.fillStyle='#fff';let fontSize=55;while(fontSize>27){g.font=`bold ${fontSize}px Arial`;if(g.measureText(name).width<675)break;fontSize--;}g.fillText(name,75,310);
  g.fillStyle=accent;g.font='30px Arial';g.fillText(p.taxiName||'Taxi indépendant',78,357);
  g.strokeStyle='#455571';g.lineWidth=2;g.beginPath();g.moveTo(76,405);g.lineTo(680,405);g.stroke();
  g.fillStyle='#fff';g.font='27px Arial';g.fillText(p.phone||'Téléphone non renseigné',78,477);
  g.fillStyle='#b1bfbe';g.font='25px Arial';g.fillText(p.city||'Québec',78,522);
  g.fillStyle='#a7bab8';g.font='18px Arial';g.fillText('VOTRE CHAUFFEUR. VOTRE RÉSERVATION.',78,624);
  drawQr(g,taxiUrl(p.id),856,169,275);
  g.fillStyle='#142138';g.textAlign='center';g.font='bold 25px Arial';g.fillText('SCANNEZ POUR',990,510);
  g.font='bold 27px Arial';g.fillText('RÉSERVER',990,546);
  g.fillStyle='#516467';g.font='19px Arial';g.fillText('Réservation directe',990,594);
  g.textAlign='start';return c;
}
function downloadCard(){
  if(!state.profile?.active){toast('La carte sera disponible après activation.',true);return}
  const c=makeCardCanvas(state.profile),a=document.createElement('a');
  a.download=`carte-mon-taxi-direct-${state.profile.displayName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-')}.png`;
  a.href=c.toDataURL('image/png');document.body.appendChild(a);a.click();a.remove();toast('Carte PNG créée.');
}
function printCard(){
  if(!state.profile?.active){toast('La carte sera disponible après activation.',true);return}
  const c=makeCardCanvas(state.profile);$('#print-preview').innerHTML=`<img src="${c.toDataURL('image/png')}" alt="Carte de visite" />`;
  document.body.classList.add('printing');window.print();
  setTimeout(()=>document.body.classList.remove('printing'),1500);
}
async function copyPersonalLink(){
  if(!state.profile?.active){toast('Le lien sera actif après approbation.',true);return}
  const text=taxiUrl(state.profile.id);
  try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(text);else{
    const textarea=document.createElement('textarea');textarea.value=text;document.body.append(textarea);textarea.select();document.execCommand('copy');textarea.remove();}
    toast('Lien personnel copié !');
  }catch{toast('Copie impossible : sélectionnez le lien dans votre carte.',true)}
}
async function refreshProfile(){
  if(demo){state.profile=demoData.drivers.find(d=>d.id===state.me?.uid)||null;render();return}
  const {db,f}=firebase;const s=await f.getDoc(f.doc(db,'driversPublic',state.me.uid));state.profile=s.exists()?{id:s.id,...s.data()}:null;render();
}
const submitBusy = new Set();
async function withBusy(key,button,fn){
 if(submitBusy.has(key))return;submitBusy.add(key);
 if(button){button.disabled=true;button.classList.add('is-loading')}
 try{await fn()}
 catch(e){console.error(e);let message=e?.message||'Une erreur est survenue.';
   if(message.includes('auth/invalid-credential'))message='Courriel ou mot de passe invalide.';
   if(message.includes('auth/email-already-in-use'))message='Cette adresse courriel est déjà utilisée.';
   if(message.includes('permission-denied'))message='Accès refusé : vérifiez les règles Firebase et l’activation du chauffeur.';
   toast(message,true);
 }finally{submitBusy.delete(key);if(button?.isConnected){button.disabled=false;button.classList.remove('is-loading')}}
}
async function handleForm(e){
 const f=e.target;if(!f.matches('form'))return;e.preventDefault();
 const submit=f.querySelector('button[type="submit"]');const data=Object.fromEntries(new FormData(f).entries());
 if(f.id==='booking-form'){
   if(data.website)return;
   if(!isValidName(data.passengerName)||cleanPhone(data.passengerPhone).length<7){toast('Vérifiez votre nom et votre téléphone.',true);return}
   if(new Date(data.datetime)<new Date()){toast('Choisissez une date et une heure futures.',true);return}
   if(!state.publicDriver?.active){toast('Ce chauffeur n’accepte pas de réservations.',true);return}
   await withBusy('booking',submit,async()=>{
     const driver=state.publicDriver;
     const booking={driverId:driver.id,passengerName:data.passengerName.trim(),passengerPhone:data.passengerPhone.trim(),
       pickup:data.pickup.trim(),dropoff:data.dropoff.trim(),datetime:data.datetime,passengers:Number(data.passengers),note:(data.note||'').trim(),status:'pending'};
     const id=await createBooking(booking);state.complete={driver,bookingId:id};state.page='complete';app.innerHTML=topBanner()+bookingComplete(driver,id);window.scrollTo(0,0);
   });
 }
 else if(f.id==='login-form')await withBusy('login',submit,async()=>{await firebase.a.signInWithEmailAndPassword(firebase.auth,data.email.trim(),data.password)});
 else if(f.id==='signup-form'){
   if(!isValidName(data.displayName)||cleanPhone(data.phone).length<7){toast('Vérifiez le nom et le téléphone.',true);return}
   const fields={displayName:data.displayName.trim(),taxiName:data.taxiName.trim(),phone:data.phone.trim(),city:data.city.trim(),vehicle:(data.vehicle||'').trim(),accent:'#ffc247'};
   await withBusy('signup',submit,async()=>{await registerDriver(fields,data.email?.trim()||'',data.password||'');toast('Inscription créée : approbation nécessaire.')});
 }
 else if(f.id==='profile-form'){
   const fields=pick(data,['displayName','taxiName','phone','city','vehicle','accent']);
   if(!isValidName(fields.displayName)||cleanPhone(fields.phone).length<7){toast('Vérifiez le nom et le téléphone.',true);return}
   Object.keys(fields).forEach(k=>fields[k]=fields[k].trim());
   await withBusy('profile',submit,async()=>{await changeProfile(state.me.uid,fields);toast('Profil mis à jour.');render()});
 }
}
document.addEventListener('submit',handleForm);
document.addEventListener('change',async e=>{
 const el=e.target;
 if(el.id==='booking-filter'){state.filter=el.value;render();}
 if(el.matches('[data-status-id]')){
   const id=el.dataset.statusId,newStatus=el.value;
   await withBusy(`status:${id}`,el,async()=>{await changeStatus(id,newStatus);toast('Statut mis à jour.');render()});
 }
});
document.addEventListener('click',async e=>{
 const pageTarget=e.target.closest('[data-page]');
 if(pageTarget){e.preventDefault();navigate(pageTarget.dataset.page);return}
 const tabTarget=e.target.closest('[data-tab]');if(tabTarget){state.tab=tabTarget.dataset.tab;state.filter='all';render();return}
 const demoTarget=e.target.closest('[data-demo-user]');if(demoTarget&&demo){loginDemo(demoTarget.dataset.demoUser);return}
 const btn=e.target.closest('[data-action]');if(!btn)return;
 const {action,id}=btn.dataset;
 if(action==='logout'){await withBusy('logout',btn,logOut);return}
 if(action==='demo-booking'){navigate('booking','chauffeur-amine');return}
 if(action==='same-driver'){navigate('booking',id);return}
 if(action==='copy-link'){await copyPersonalLink();return}
 if(action==='download-card'){downloadCard();return}
 if(action==='print-card'){printCard();return}
 if(action==='refresh-profile'){await withBusy('refresh',btn,refreshProfile);return}
 if(action==='view-driver'){navigate('booking',id);return}
 if(action==='approve-driver'||action==='disable-driver'){
   if(!state.isAdmin)return;
   await withBusy(`driver:${id}`,btn,async()=>{
     await changeProfile(id,action==='approve-driver'?{active:true,status:'approved'}:{active:false,status:'disabled'});
     toast(action==='approve-driver'?'Chauffeur activé !':'Chauffeur désactivé.');render();
   });
 }
});
window.addEventListener('popstate',()=>{stopWatching();readRoute();state.publicDriver=null;render()});
window.addEventListener('afterprint',()=>document.body.classList.remove('printing'));
(async function boot(){
 readRoute();
 try{await initFirebase();state.ready=true;render()}
 catch(e){console.error(e);app.innerHTML=`<div class="boot-error"><h2>Connexion indisponible</h2><p>La connexion à Firebase a échoué. Vérifiez la configuration et votre connexion internet.</p><small>${escapeHtml(e.message)}</small></div>`}
})();
