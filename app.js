
// ==================== DATA ====================
const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

const CURRENCIES = {
  IQD: { label: 'د.ع', name: 'دينار عراقي' },
  USD: { label: '$', name: 'دولار أمريكي' },
  SAR: { label: 'ر.س', name: 'ريال سعودي' },
  AED: { label: 'د.إ', name: 'درهم إماراتي' },
  KWD: { label: 'د.ك', name: 'دينار كويتي' },
  EGP: { label: 'ج.م', name: 'جنيه مصري' },
  TRY: { label: '₺', name: 'ليرة تركية' },
};
let currentCurrency = 'IQD';
function getCurrencyLabel() { return CURRENCIES[currentCurrency]?.label || 'د.ع'; }

const DEFAULT_CATS = [
  {id:'meat',    name:'اللحوم',           icon:'🥩', ess:true,  custom:false},
  {id:'chicken', name:'الدجاج',           icon:'🍗', ess:true,  custom:false},
  {id:'gas',     name:'الغاز',            icon:'🔥', ess:true,  custom:false},
  {id:'fuel',    name:'الوقود',           icon:'⛽', ess:true,  custom:false},
  {id:'school',  name:'الأقساط الدراسية', icon:'🎓', ess:true,  custom:false},
  {id:'veg',     name:'الخضار والفواكه',  icon:'🥦', ess:true,  custom:false},
  {id:'grocery', name:'الغذائية',         icon:'🛒', ess:true,  custom:false},
  {id:'electric',name:'الكهرباء',         icon:'⚡', ess:true,  custom:false},
  {id:'water',   name:'الماء',            icon:'💧', ess:true,  custom:false},
  {id:'repair',  name:'الصيانة والتصليح', icon:'🛠️', ess:true,  custom:false},
  {id:'furniture',name:'الأجهزة والأثاث',icon:'🛋️', ess:false, custom:false},
  {id:'fun',     name:'ترفيه العائلة',    icon:'🎡', ess:false, custom:false},
  {id:'internet',name:'الانترنيت',        icon:'📡', ess:false, custom:false},
  {id:'mobile',  name:'رصيد الموبايل',   icon:'📱', ess:false, custom:false},
  {id:'other',   name:'مصاريف متنوعة',   icon:'📦', ess:false, custom:false},
];

const DEFAULT_LIMITS = {
  meat:250000, chicken:150000, gas:50000, fuel:150000,
  school:200000, veg:150000, grocery:300000, electric:80000,
  water:30000, repair:50000, furniture:100000, fun:75000,
  internet:45000, mobile:30000, other:50000
};

let CATS = [];
let currentLimits = {};
let hasUnsavedChanges = false;

const now = new Date();
let curY = now.getFullYear(), curM = now.getMonth();
let curYS = curY, curMS = curM;

// ==================== STORAGE ====================
function mKey(y,m){ return y+'-'+String(m+1).padStart(2,'0'); }
function mLabel(y,m){ return MONTHS[m]+' '+y; }
function loadAll(){ try{ return JSON.parse(localStorage.getItem('home_exp')||'{}'); }catch(e){ return {}; } }
function saveAll(d){ localStorage.setItem('home_exp', JSON.stringify(d)); }
function loadM(y,m){ return loadAll()[mKey(y,m)]||{}; }
function fmt(n){ return Math.round(n||0).toLocaleString('ar-IQ'); }

function loadCats(){
  const saved = localStorage.getItem('home_cats');
  if(saved){ try{ CATS = JSON.parse(saved); return; }catch(e){} }
  CATS = DEFAULT_CATS.map(c=>({...c}));
}
function saveCats(){
  localStorage.setItem('home_cats', JSON.stringify(CATS));
  if(!_applyingCloudData){ setLocalUpdated(); scheduleCloudSync(); }
}

function loadLimits(){
  const saved = localStorage.getItem('category_limits');
  if(saved){ try{ currentLimits = JSON.parse(saved); return; }catch(e){} }
  currentLimits = {...DEFAULT_LIMITS};
}
function saveLimitsToStorage(){
  localStorage.setItem('category_limits', JSON.stringify(currentLimits));
  if(!_applyingCloudData){ setLocalUpdated(); scheduleCloudSync(); }
}
function getLimitForCategory(catId){ return currentLimits[catId] || 0; }

// Currency pref
function loadCurrencyPref(){
  const saved = localStorage.getItem('preferred_currency');
  if(saved && CURRENCIES[saved]) {
    currentCurrency = saved;
    const sel = document.getElementById('currency-sel');
    if(sel) sel.value = saved;
  }
  updateCurrencyLabels();
}
function saveCurrencyPref(){
  const sel = document.getElementById('currency-sel');
  currentCurrency = sel.value;
  localStorage.setItem('preferred_currency', currentCurrency);
  updateCurrencyLabels();
  renderEntry();
  showToast('✓ تم تغيير العملة إلى ' + CURRENCIES[currentCurrency].name);
}
function updateCurrencyLabels(){
  const lbl = getCurrencyLabel();
  ['currency-lbl','currency-lbl-em','currency-lbl-sg'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.textContent = lbl;
  });
}

// Carry income pref
function loadCarryIncomePref(){
  const val = localStorage.getItem('carry_income');
  const cb = document.getElementById('carry-income-cb');
  if(cb) cb.checked = val === 'true';
}
function saveCarryIncomePref(){
  const cb = document.getElementById('carry-income-cb');
  localStorage.setItem('carry_income', cb.checked ? 'true' : 'false');
  showToast(cb.checked ? '✓ سيتم نقل الدخل تلقائياً' : '✓ تم إلغاء النقل التلقائي');
}
function shouldCarryIncome(){ return localStorage.getItem('carry_income') === 'true'; }

// Dark mode
function loadDarkMode(){
  if(localStorage.getItem('dark_mode') === 'true'){
    document.body.classList.add('dark');
    const btn = document.getElementById('dark-toggle');
    if(btn) btn.textContent = '☀️';
  }
}
function toggleUserMenu(e){
  e.stopPropagation();
  document.getElementById('user-dropdown').classList.toggle('open');
}
function closeUserMenu(){
  const d = document.getElementById('user-dropdown');
  if(d) d.classList.remove('open');
}
document.addEventListener('click', function(e){
  if(!e.target.closest('.user-menu')) closeUserMenu();
});

function toggleDark(){
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('dark_mode', isDark);
  const btn = document.getElementById('dark-toggle');
  if(btn) btn.textContent = isDark ? '☀️' : '🌙';
  showToast(isDark ? '🌙 الوضع الليلي' : '☀️ الوضع النهاري');
}

// ==================== TABS STICKY OFFSET ====================
function updateTabsTop(){
  const header = document.querySelector('.header');
  const tabs = document.getElementById('main-tabs');
  if(header && tabs){
    tabs.style.top = header.offsetHeight + 'px';
  }
}

// ==================== SAFE CALC ====================
function safeCalc(expr){
  const clean = expr.replace(/[^\d+\-*/().\s]/g,'').trim();
  if(!clean) return null;
  if(/^[\d\s+\-*/().]+$/.test(clean)){
    try{
      const result = parseExpr(clean);
      if(isFinite(result) && result >= 0) return Math.round(result);
    }catch(e){}
  }
  const num = parseFloat(clean);
  return isNaN(num) ? null : Math.round(num);
}

function parseExpr(expr){
  expr = expr.replace(/\s/g,'');
  let pos = 0;
  function peek(){ return expr[pos]; }
  function consume(){ return expr[pos++]; }
  function parseNumber(){
    let s='';
    if(peek()==='-'){ s+=consume(); }
    while(pos<expr.length && (expr[pos].match(/[\d.]/))){s+=consume();}
    return parseFloat(s);
  }
  function parsePrimary(){
    if(peek()==='('){
      consume();
      const v = parseAddSub();
      consume();
      return v;
    }
    return parseNumber();
  }
  function parseMulDiv(){
    let left = parsePrimary();
    while(pos<expr.length && (peek()==='*'||peek()==='/')){
      const op = consume();
      const right = parsePrimary();
      left = op==='*' ? left*right : left/right;
    }
    return left;
  }
  function parseAddSub(){
    let left = parseMulDiv();
    while(pos<expr.length && (peek()==='+'||peek()==='-')){
      const op = consume();
      const right = parseMulDiv();
      left = op==='+' ? left+right : left-right;
    }
    return left;
  }
  return parseAddSub();
}

function calcInput(el){
  if(!el || el.value === '') return;
  const result = safeCalc(el.value);
  if(result !== null) el.value = result;
}

// ==================== INPUT COLORS ====================
function getInputColorClass(value, limit){
  if(!limit||limit===0) return '';
  const pct = (value/limit)*100;
  if(pct>=100) return 'danger';
  if(pct>=85)  return 'warning';
  if(value>0)  return 'good';
  return '';
}

// ==================== UNSAVED CHANGES ====================
function markUnsaved(){
  hasUnsavedChanges = true;
  document.getElementById('unsaved-indicator').classList.add('show');
}
function markSaved(){
  hasUnsavedChanges = false;
  document.getElementById('unsaved-indicator').classList.remove('show');
}

// ==================== AUTO-SAVE ====================
let autoSaveTimer = null;
function scheduleAutoSave(){
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(()=>{
    if(hasUnsavedChanges) {
      doSaveMonth(true);
    }
  }, 3000);
}

// ==================== HEADER STATS ====================
function updateHeaderStats(){
  const s = loadM(curY,curM);
  const total = CATS.reduce((a,c)=>a+(s[c.id]||0),0);
  const income = s.income||0;
  const em = s.emergency||0;
  const remaining = income - total - em;
  const savPct = income>0 ? Math.max(0,Math.round((remaining/income)*100)) : 0;
}

// ==================== RENDER ENTRY ====================
function renderEntry(){
  document.getElementById('month-label').textContent = mLabel(curY,curM);
  const saved = loadM(curY,curM);
  const list = document.getElementById('cat-list');

  // Build all HTML at once — not += per iteration
  let html = '';
  CATS.forEach(c=>{
    const v = saved[c.id]||0;
    const limit = getLimitForCategory(c.id);
    const percent = limit>0 ? Math.round((v/limit)*100) : 0;
    let fillColor = '#22c55e';
    if(percent>=100) fillColor='#dc2626';
    else if(percent>=85) fillColor='#f59e0b';
    const limitText = limit>0 ? `الحد: ${fmt(limit)} | ${percent}%` : 'بدون حد';
    const colorClass = getInputColorClass(v,limit);
    const rowClass = percent>=100?'over-limit':percent>=85?'near-limit':'';
    const lbl = getCurrencyLabel();
    const txns = loadTxns(curY,curM,c.id);
    const txnCount = txns.length;
    const txnCountText = txnCount>0 ? `${txnCount} عملية` : 'اضغط للإضافة';
    const progressBar = limit>0 ? '<div class="limit-progress"><div class="limit-progress-fill" style="width:'+Math.min(percent,100)+'%;background:'+fillColor+'"></div></div>' : '';
    html += `<div class="cat-row ${rowClass}" onclick="openTxnModal('${c.id}')" style="cursor:pointer">
      <div class="cat-icon">${c.icon}</div>
      <div class="cat-info">
        <div class="cat-name">${c.name}</div>
        <span class="badge ${c.ess?'b-ess':'b-opt'}">${c.ess?'أساسي':'اختياري'}</span>
        <div class="limit-info">📊 ${limitText}</div>
        ${progressBar}
        <div class="cat-txn-count" id="txncount-${c.id}">${txnCountText}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0">
        <div style="font-size:18px;font-weight:900;color:${v>0?'var(--accent)':'#94a3b8'}">${v>0?fmt(v):'—'}</div>
        <div style="font-size:11px;color:#94a3b8;font-weight:600">${v>0?getCurrencyLabel():''}</div>
      </div>
    </div>`;
  });
  list.innerHTML = html;

  document.getElementById('inp-income').value = saved.income||'';
  document.getElementById('inp-income-card').value = saved.incomeCard||'';
  document.getElementById('inp-emergency').value = saved.emergency||'';
  document.getElementById('inp-saving-goal').value = saved.savingGoal||'';
  document.getElementById('save-tag').textContent = '';
  document.getElementById('alert-msg').style.display = 'none';
  const noteEl = document.getElementById('month-note');
  if(noteEl) noteEl.value = loadNote(curY, curM);
  const whatifEl = document.getElementById('whatif-amount');
  if(whatifEl){ whatifEl.value=''; document.getElementById('whatif-result').innerHTML = ''; }
  checkTotalLimitsAgainstIncome(saved.income||0);
  updateHeaderStats();
  updateTabsTop();
  updateStorageInfo();
  renderTransfers();
  renderBalanceSummary();
}

// ==================== CAT INPUT (live) ====================
function onCatInput(el, catId){
  markUnsaved();
  scheduleAutoSave();
  const rawVal = el.value;
  // Only calc if it looks like an expression (has operators)
  if(/[+\-*/]/.test(rawVal)) {
    // don't auto-calc while typing expression, do it on blur
    el.onblur = function(){ calcInput(el); el.onblur = null; };
  }
  const v = parseFloat(el.value)||0;
  const limit = getLimitForCategory(catId);
  el.className = getInputColorClass(v, limit);
  const row = el.closest('.cat-row');
  if(row){
    const pct = limit>0?(v/limit)*100:0;
    row.className = 'cat-row '+(pct>=100?'over-limit':pct>=85?'near-limit':'');
  }
  if(limit>0){
    const fill = el.closest('.cat-row')?.querySelector('.limit-progress-fill');
    if(fill){
      const pct = Math.min((v/limit)*100,100);
      let color = '#22c55e';
      if(pct>=100) color='#dc2626';
      else if(pct>=85) color='#f59e0b';
      fill.style.width = pct+'%';
      fill.style.background = color;
    }
  }
  updateHeaderStats();
}

function onSpecialInput(el){
  markUnsaved();
  scheduleAutoSave();
}

// ==================== SAVE MONTH ====================
function saveMonth(){ doSaveMonth(false); }

function doSaveMonth(isAuto){
  // Preserve any existing values then overwrite with current state
  const existing = loadM(curY, curM);
  const data = { ...existing };

  // Categories: pull totals from per-cat transactions (UI no longer has direct cat inputs)
  CATS.forEach(c=>{
    const txnTotal = getTxnTotal(curY, curM, c.id);
    if(txnTotal > 0) data[c.id] = txnTotal;
    else if(!(c.id in data)) data[c.id] = 0;
  });

  const incEl = document.getElementById('inp-income');
  const emEl  = document.getElementById('inp-emergency');
  const sgEl  = document.getElementById('inp-saving-goal');
  calcInput(incEl); calcInput(emEl); calcInput(sgEl);
  data.income     = parseFloat(incEl.value)||0;
  data.incomeCard = parseFloat(document.getElementById('inp-income-card')?.value)||0;
  data.emergency  = parseFloat(emEl.value)||0;
  data.savingGoal = parseFloat(sgEl.value)||0;

  const all = loadAll();
  all[mKey(curY,curM)] = data;
  saveAll(all);
  if(!_applyingCloudData){ setLocalUpdated(); scheduleCloudSync(); }
  markSaved();

  const total = CATS.reduce((s,c)=>s+(data[c.id]||0),0);
  const overBudget = data.income>0 && total>data.income;
  document.getElementById('alert-msg').style.display = overBudget?'block':'none';

  let warns = [];
  CATS.forEach(c=>{
    const limit = getLimitForCategory(c.id);
    if(limit>0 && data[c.id]>limit) warns.push(c.name);
  });

  const remaining = data.income - total - data.emergency;
  const goalMet = data.savingGoal>0 && remaining >= data.savingGoal;
  const goalMissed = data.savingGoal>0 && remaining < data.savingGoal;

  if(!isAuto){
    let msg = '✓ تم الحفظ بنجاح';
    if(warns.length) msg += ` | ⚠️ تجاوز: ${warns.slice(0,2).join(', ')}${warns.length>2?'...':''}`;
    if(goalMet) msg = '🎯 تم الحفظ - أنت في المسار الصحيح للتوفير!';
    if(goalMissed && !warns.length) msg = `⚠️ تم الحفظ - لم تبلغ هدف التوفير (${fmt(data.savingGoal)} ${getCurrencyLabel()})`;
    document.getElementById('save-tag').textContent = msg;
    showToast('💾 تم حفظ بيانات '+mLabel(curY,curM));
  } else {
    // Show autosave badge briefly
    const badge = document.getElementById('autosave-badge');
    badge.classList.add('show');
    setTimeout(()=>badge.classList.remove('show'), 1800);
  }

  populatePickers();
  renderSummaryContent();
  updateHeaderStats();
  updateStorageInfo();
}

// ==================== MONTH NAV (with unsaved check) ====================
async function tryChangeMonth(d){
  if(hasUnsavedChanges){
    const ok = await customConfirm({
      icon: '✏️',
      title: 'تغييرات غير محفوظة',
      message: 'يوجد تغييرات لم تُحفظ بعد. هل تريد حفظها قبل الانتقال للشهر الآخر؟',
      okText: '💾 حفظ والانتقال',
      cancelText: 'انتقال بدون حفظ'
    });
    if(!ok){
      hasUnsavedChanges = false;
      document.getElementById('unsaved-indicator').classList.remove('show');
      changeMonth(d);
      return;
    }
    doSaveMonth(false);
  }
  changeMonth(d);
}

function changeMonth(d){
  curM+=d; if(curM<0){curM=11;curY--;} if(curM>11){curM=0;curY++;}
  // Sync any txn totals for the new month into main data
  CATS.forEach(c=>{ if(getTxnTotal(curY,curM,c.id)>0) syncTxnTotal(curY,curM,c.id); });
  // Apply carry income if enabled
  if(shouldCarryIncome()){
    const prevM = curM - d;
    const prevY = curY;
    // Load previous month's income
    const adjustedPrevM = d > 0 ? curM - 1 : curM + 1;
    const prevData = loadM(curY, adjustedPrevM < 0 ? 11 : adjustedPrevM > 11 ? 0 : adjustedPrevM);
    const currentData = loadM(curY, curM);
    // Only carry if current month has no income set
    if(!currentData.income && prevData.income){
      const all = loadAll();
      const key = mKey(curY, curM);
      if(!all[key]) all[key] = {};
      all[key].income = prevData.income;
      saveAll(all);
    }
  }
  hasUnsavedChanges = false;
  renderEntry();
}

function changeMonthS(d){
  curMS+=d; if(curMS<0){curMS=11;curYS--;} if(curMS>11){curMS=0;curYS++;}
  renderSummaryContent();
}

// ==================== LIMITS MODAL ====================
function openLimitsModal(){
  const modal = document.getElementById('limits-modal');
  const container = document.getElementById('limits-list');

  // Build HTML at once
  let html = '';
  CATS.forEach(cat=>{
    const v = currentLimits[cat.id]||0;
    html += `<div class="limit-row">
      <span class="lr-name">${cat.icon} ${cat.name}</span>
      <input type="text" id="limit-${cat.id}" value="${v||''}" placeholder="بدون حد"
        oninput="calcInput(this);updateTotalLimitsDisplay()" inputmode="numeric">
    </div>`;
  });
  container.innerHTML = html;

  updateTotalLimitsDisplay();
  modal.classList.add('active');
}

function updateTotalLimitsDisplay(){
  let total = 0;
  CATS.forEach(cat=>{
    const inp = document.getElementById(`limit-${cat.id}`);
    if(inp) total += parseFloat(inp.value)||0;
  });
  document.getElementById('total-limits-info').innerHTML = `مجموع الحدود: ${fmt(total)} ${getCurrencyLabel()}`;
}

function saveLimits(){
  CATS.forEach(cat=>{
    const inp = document.getElementById(`limit-${cat.id}`);
    if(inp) currentLimits[cat.id] = parseFloat(inp.value)||0;
  });
  saveLimitsToStorage();
  closeLimitsModal();
  renderEntry();
  renderSummaryContent();
  const incVal = parseFloat(document.getElementById('inp-income').value)||0;
  if(incVal) checkTotalLimitsAgainstIncome(incVal);
  showToast('✓ تم حفظ الحدود');
}

function closeLimitsModal(){
  document.getElementById('limits-modal').classList.remove('active');
}

// ==================== INCOME CHECK ====================
function checkTotalLimitsAgainstIncome(income){
  const totalLimits = CATS.reduce((s,c)=>s+(currentLimits[c.id]||0),0);
  const alertDiv = document.getElementById('alert-budget');
  if(income>0 && totalLimits>income){
    alertDiv.style.display = 'block';
    alertDiv.innerHTML = `⚠️ تحذير: مجموع الحدود (${fmt(totalLimits)}) أكبر من الدخل (${fmt(income)})!`;
    return false;
  } else {
    alertDiv.style.display = 'none';
    return true;
  }
}

function updateIncomeAndCheckLimits(el){
  calcInput(el);
  const income = parseFloat(el.value)||0;
  checkTotalLimitsAgainstIncome(income);
  const v = el.value;
  renderEntry();
  document.getElementById('inp-income').value = v;
}

// ==================== STORAGE INFO ====================
function updateStorageInfo(){
  try {
    let total = 0;
    for(let key in localStorage){
      if(localStorage.hasOwnProperty(key)){
        total += (localStorage[key].length + key.length) * 2; // bytes
      }
    }
    const kb = (total / 1024).toFixed(1);
    const mb = total / (1024 * 1024);
    const pct = Math.min(mb / 5 * 100, 100);
    document.getElementById('storage-size-text').textContent = kb + ' KB';
    const bar = document.getElementById('storage-bar');
    if(bar){
      bar.style.width = pct + '%';
      bar.className = 'storage-bar-fill' + (pct > 80 ? ' danger' : pct > 50 ? ' warn' : '');
    }
    // Show warning if > 3MB
    const warn = document.getElementById('storage-warning');
    if(warn){
      if(currentUser){
        // Logged in → data is on the cloud, no need to nag about backups
        warn.style.display = 'none';
      } else if(mb > 3){
        warn.style.display = 'flex';
        document.getElementById('storage-warning-text').textContent =
          `⚠️ حجم البيانات كبير (${kb} KB). يُنصح بتصدير نسخة احتياطية!`;
      } else {
        // Always show the reminder once per session
        if(!sessionStorage.getItem('warn_shown')){
          warn.style.display = 'flex';
          document.getElementById('storage-warning-text').textContent =
            '💡 البيانات محفوظة في المتصفح فقط. صدّر نسخة احتياطية بانتظام!';
          sessionStorage.setItem('warn_shown','1');
          setTimeout(()=>{ warn.style.display='none'; }, 6000);
        }
      }
    }
  } catch(e){}
}

// ==================== SUMMARY ====================
function renderSummaryContent(){
  document.getElementById('month-label-s').textContent = mLabel(curYS,curMS);
  const s = loadM(curYS,curMS);
  const total = CATS.reduce((a,c)=>a+(s[c.id]||0),0);
  const ess   = CATS.filter(c=>c.ess).reduce((a,c)=>a+(s[c.id]||0),0);
  const opt   = CATS.filter(c=>!c.ess).reduce((a,c)=>a+(s[c.id]||0),0);
  const income = s.income||0, em = s.emergency||0, savGoal = s.savingGoal||0;
  const remaining = income - total - em;
  const out = document.getElementById('summary-content');
  const lbl = getCurrencyLabel();

  if(!total && !income){
    out.innerHTML = '<div class="no-data">📭 لا توجد بيانات لهذا الشهر<br><small>أدخل البيانات من تبويب الإدخال</small></div>';
    return;
  }

  let savingHTML = '';
  if(savGoal>0){
    const actualSaving = Math.max(0, remaining);
    const savPct = Math.min(Math.round((actualSaving/savGoal)*100),100);
    savingHTML = `<div class="saving-progress-box">
      <div class="sp-header">
        <span class="sp-title">🎯 هدف التوفير</span>
        <span class="sp-pct">${savPct}%</span>
      </div>
      <div class="sp-bar-bg"><div class="sp-bar-fill" style="width:${savPct}%"></div></div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:#64748b;margin-top:6px;font-weight:700">
        <span>متوفر: ${fmt(actualSaving)} ${lbl}</span>
        <span>الهدف: ${fmt(savGoal)} ${lbl}</span>
      </div>
    </div>`;
  }

  let bars = '';
  CATS.forEach(c=>{
    const v = s[c.id]||0;
    if(!v) return;
    const pct = total>0 ? Math.round(v/total*100) : 0;
    const limit = getLimitForCategory(c.id);
    let limitBadge = '';
    if(limit>0){
      if(v>limit) limitBadge = `<span style="color:#dc2626;font-size:9px;font-weight:800"> ⚠️تجاوز</span>`;
      else if(v>=limit*0.85) limitBadge = `<span style="color:#f59e0b;font-size:9px;font-weight:800"> ⚡قارب</span>`;
    }
    bars += `<div class="dist-row">
      <div class="dist-header">
        <span>${c.icon} ${c.name}${limitBadge}</span>
        <span>${fmt(v)} (${pct}%)</span>
      </div>
      <div class="dist-bar-bg"><div class="dist-bar" style="width:${pct}%;background:${c.ess?'#3b82f6':'#f59e0b'}"></div></div>
    </div>`;
  });

  const trendHTML = renderTrendChart();

  out.innerHTML = `
  <div class="sum-grid">
    <div class="sum-card"><div class="lbl">💰 إجمالي المصاريف</div><div class="val ${total>income&&income>0?'red':''}">${fmt(total)}</div><div class="sub">${lbl}</div></div>
    <div class="sum-card"><div class="lbl">💵 الدخل الشهري</div><div class="val">${fmt(income)}</div><div class="sub">${lbl}</div></div>
    <div class="sum-card"><div class="lbl">📌 الأساسيات</div><div class="val">${fmt(ess)}</div><div class="sub">ضرورية</div></div>
    <div class="sum-card"><div class="lbl">🎯 الكماليات</div><div class="val">${fmt(opt)}</div><div class="sub">اختيارية</div></div>
    <div class="sum-card"><div class="lbl">🛡️ الطوارئ</div><div class="val">${fmt(em)}</div><div class="sub">محجوز</div></div>
    <div class="sum-card"><div class="lbl">📉 المتبقي</div><div class="val ${remaining<0?'red':'green'}">${fmt(remaining)}</div><div class="sub">${remaining<0?'عجز 📉':'فائض 📈'}</div></div>
  </div>
  ${savingHTML}
  ${trendHTML}
  ${total>0?`<div style="background:var(--card);border-radius:18px;padding:16px;box-shadow:var(--shadow)">
    <div class="dist-title">📊 توزيع المصاريف</div>
    ${bars}
    <div class="legend-box">
      <span><span class="leg-dot" style="background:#3b82f6"></span>أساسي</span>
      <span><span class="leg-dot" style="background:#f59e0b"></span>اختياري</span>
      <span><span class="leg-dot" style="background:#dc2626"></span>تجاوز</span>
    </div>
  </div>`:''}`;
}

// ==================== TREND CHART ====================
function renderTrendChart(){
  const all = loadAll();
  const keys = Object.keys(all).sort();
  if(keys.length < 1) return '<div class="trend-box" style="text-align:center;color:#94a3b8;font-size:13px;font-weight:700;padding:20px">📊 أدخل بيانات شهرين أو أكثر لعرض الاتجاه</div>';
  if(keys.length < 2) return '<div class="trend-box" style="text-align:center;color:#94a3b8;font-size:13px;font-weight:700;padding:20px">📊 أدخل بيانات شهر آخر لعرض الاتجاه</div>';

  const points = keys.slice(-6).map(k=>{
    const d = all[k]||{};
    const [y,m] = k.split('-');
    return {
      label: MONTHS[parseInt(m)-1].substring(0,3),
      total: CATS.reduce((s,c)=>s+(d[c.id]||0),0),
      income: d.income||0
    };
  });

  const maxVal = Math.max(...points.map(p=>Math.max(p.total,p.income)),1);
  const W = 300, H = 100, PAD = 10;
  const xStep = (W-PAD*2)/(points.length-1||1);
  const toY = v => PAD + (H-PAD*2)*(1 - v/maxVal);

  const totalPath = points.map((p,i)=>`${i===0?'M':'L'} ${PAD+i*xStep} ${toY(p.total)}`).join(' ');
  const incomePath = points.map((p,i)=>`${i===0?'M':'L'} ${PAD+i*xStep} ${toY(p.income)}`).join(' ');

  const dots = points.map((p,i)=>`
    <circle cx="${PAD+i*xStep}" cy="${toY(p.total)}" r="3" fill="#e94560"/>
    <text x="${PAD+i*xStep}" y="${H+2}" text-anchor="middle" font-size="8" fill="#94a3b8" font-family="Cairo">${p.label}</text>
  `).join('');

  return `<div class="trend-box">
    <div class="trend-title">📈 اتجاه المصاريف (آخر 6 أشهر)</div>
    <div class="chart-area">
      <svg class="chart-svg" viewBox="0 0 ${W} ${H+14}" preserveAspectRatio="xMidYMid meet">
        <path d="${incomePath}" fill="none" stroke="#10b981" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.6"/>
        <path d="${totalPath}" fill="none" stroke="#e94560" stroke-width="2"/>
        ${dots}
      </svg>
    </div>
    <div class="legend-box">
      <span><span class="leg-dot" style="background:#e94560"></span>المصاريف</span>
      <span><span class="leg-dot" style="background:#10b981"></span>الدخل</span>
    </div>
  </div>`;
}

// ==================== COMPARE ====================
function getAvailMonths(){
  const all = loadAll();
  return Object.keys(all).filter(k=>Object.keys(all[k]).length>0).sort().reverse();
}

function populatePickers(){
  const months = getAvailMonths();
  ['m1-sel','m2-sel'].forEach((id,i)=>{
    const sel = document.getElementById(id);
    const cur = sel.value;
    sel.innerHTML = `<option value="">${i===0?'📅 الشهر الأول':'📅 الشهر الثاني'}</option>`;
    months.forEach(k=>{
      const [y,m] = k.split('-');
      sel.innerHTML += `<option value="${k}" ${cur===k?'selected':''}>${MONTHS[parseInt(m)-1]+' '+y}</option>`;
    });
  });
}

function renderCompare(){
  const m1 = document.getElementById('m1-sel').value;
  const m2 = document.getElementById('m2-sel').value;
  const out = document.getElementById('compare-content');
  if(!m1||!m2){ out.innerHTML='<div class="no-data">📅 اختر شهرين للمقارنة</div>'; return; }
  const all = loadAll(), d1 = all[m1]||{}, d2 = all[m2]||{};
  const [y1,mo1] = m1.split('-'), [y2,mo2] = m2.split('-');
  const l1 = MONTHS[parseInt(mo1)-1]+' '+y1, l2 = MONTHS[parseInt(mo2)-1]+' '+y2;
  const lbl = getCurrencyLabel();

  let html = '';
  CATS.forEach(c=>{
    const v1 = d1[c.id]||0, v2 = d2[c.id]||0;
    if(!v1&&!v2) return;
    const mx = Math.max(v1,v2,1);
    const diff = v2-v1;
    const dc = diff>0?'#dc2626':diff<0?'#16a34a':'#64748b';
    const dt = diff===0?'لا تغيير':(diff>0?'+':'')+fmt(diff)+' '+lbl;
    html += `<div class="compare-card">
      <div class="cmp-header">
        <span style="font-size:24px">${c.icon}</span>
        <span class="cmp-name">${c.name}</span>
        <span class="cmp-diff" style="color:${dc}">${dt}</span>
      </div>
      <div class="bar-row">
        <div class="bar-val">${fmt(v1)}</div>
        <div class="bar-track"><div class="bar-fill b1" style="width:${Math.round(v1/mx*100)}%"></div></div>
      </div>
      <div class="bar-row">
        <div class="bar-val">${fmt(v2)}</div>
        <div class="bar-track"><div class="bar-fill b2" style="width:${Math.round(v2/mx*100)}%"></div></div>
      </div>
      <div class="legend">
        <span><span class="leg-dot" style="background:#3b82f6"></span>${l1}</span>
        <span><span class="leg-dot" style="background:#10b981"></span>${l2}</span>
      </div>
    </div>`;
  });

  const t1 = CATS.reduce((s,c)=>s+(d1[c.id]||0),0);
  const t2 = CATS.reduce((s,c)=>s+(d2[c.id]||0),0);
  const td = t2-t1;
  html += `<div class="total-compare">
    <div>
      <div style="font-size:14px;font-weight:800;color:var(--dark)">📊 الإجمالي</div>
      <div style="font-size:12px;color:#64748b;margin-top:4px">${l1}: ${fmt(t1)}</div>
      <div style="font-size:12px;color:#64748b">${l2}: ${fmt(t2)}</div>
    </div>
    <div style="font-size:22px;font-weight:900;color:${td>0?'#dc2626':td<0?'#16a34a':'#64748b'}">${td>=0?'+':''}${fmt(td)}</div>
  </div>`;
  out.innerHTML = html;
}

// ==================== CUSTOM CATS ====================
function syncCatFormState(){
  CATS.forEach((cat,i)=>{
    const nameInp = document.getElementById(`ccat-name-${i}`);
    const emojiBtn = document.querySelector(`#ccat-${i} .emoji-pick`);
    if(nameInp && nameInp.value.trim()) cat.name = nameInp.value.trim();
    if(emojiBtn) cat.icon = emojiBtn.textContent.trim();
  });
}

function renderCustomCatsList(){
  const container = document.getElementById('custom-cats-list');
  let html = '';
  CATS.forEach((cat,i)=>{
    html += `<div class="custom-cat-row" id="ccat-${i}">
      <div class="ccat-top">
        <button class="drag-handle" title="اسحب لإعادة الترتيب">⠿</button>
        <button class="emoji-pick" onclick="pickEmoji(${i})" title="اختر رمز">${cat.icon}</button>
        <input type="text" value="${cat.name}" id="ccat-name-${i}" placeholder="اسم الفئة"
          onblur="onCatNameBlur(${i})" onkeydown="if(event.key==='Enter')this.blur()">
        <button class="del-cat-btn" onclick="deleteCat(${i})" title="حذف الفئة">✕</button>
      </div>
      <div class="cat-type-toggle">
        <button class="cat-type-btn ${cat.ess?'active-ess':''}" onclick="setCatType(${i},true)">أساسي</button>
        <button class="cat-type-btn ${!cat.ess?'active-opt':''}" onclick="setCatType(${i},false)">اختياري</button>
      </div>
    </div>`;
  });
  container.innerHTML = html;
}

function onCatNameBlur(i){
  const nameInp = document.getElementById(`ccat-name-${i}`);
  if(!nameInp) return;
  const val = nameInp.value.trim();
  if(val && val !== CATS[i].name){
    CATS[i].name = val;
    saveCats();
    renderEntry();
  }
}

function setCatType(i, isEss){
  syncCatFormState();
  CATS[i].ess = isEss;
  const row = document.getElementById(`ccat-${i}`);
  if(row){
    const btns = row.querySelectorAll('.cat-type-btn');
    if(btns[0]) btns[0].className = `cat-type-btn ${isEss?'active-ess':''}`;
    if(btns[1]) btns[1].className = `cat-type-btn ${!isEss?'active-opt':''}`;
  }
  saveCats();
}

async function deleteCat(i){
  if(CATS.length<=3){ showToast('⚠️ يجب الإبقاء على 3 فئات على الأقل'); return; }
  const all = loadAll();
  const catId = CATS[i].id;
  let hasData = false;
  for(let key in all){
    if(all[key][catId]) { hasData = true; break; }
  }
  const ok = await customConfirm({
    icon: hasData ? '⚠️' : '🗑️',
    title: hasData ? 'تنبيه: تحتوي على بيانات' : 'حذف الفئة',
    message: hasData
      ? `فئة "${CATS[i].name}" تحتوي على بيانات محفوظة. حذفها سيخفيها من التقارير لكن البيانات ستبقى في الذاكرة.`
      : `هل تريد حذف فئة "${CATS[i].name}"؟`,
    okText: '🗑️ حذف',
    danger: true
  });
  if(!ok) return;
  syncCatFormState();
  CATS.splice(i,1);
  saveCats();
  renderEntry();
  renderCustomCatsList();
  showToast('✓ تم حذف الفئة');
}

function addCustomCat(){
  syncCatFormState();
  const newCat = {
    id: 'custom_'+Date.now(),
    name: 'فئة جديدة',
    icon: '📌',
    ess: false,
    custom: true
  };
  CATS.push(newCat);
  saveCats();
  renderEntry();
  renderCustomCatsList();
  setTimeout(()=>{
    const inp = document.getElementById(`ccat-name-${CATS.length-1}`);
    if(inp){ inp.focus(); inp.select(); }
  }, 50);
}

function saveCustomCats(){
  syncCatFormState();
  saveCats();
  renderEntry();
  renderCustomCatsList();
  showToast('✓ تم حفظ الفئات');
}

// ===== EMOJI PICKER =====
const EMOJIS = ['🛒','🥩','🍗','🥦','🔥','⛽','🎓','⚡','💧','🛠️','🛋️','🎡','📡','📱','📦','🍔','☕','🧹','💊','🏥','🏫','✈️','🎮','👔','🧺','🏗️','🐾','🎁','💄','🧸','📚','🎵'];
let pickerTarget = null;

function pickEmoji(catIdx){
  closeEmojiPicker();
  pickerTarget = catIdx;
  const btn = document.querySelector(`#ccat-${catIdx} .emoji-pick`);
  const rect = btn.getBoundingClientRect();
  const picker = document.createElement('div');
  picker.className = 'emoji-picker-popup';
  picker.id = 'emoji-popup';
  picker.style.top = (rect.bottom + window.scrollY + 4)+'px';
  picker.style.right = '12px';
  picker.style.left = 'auto';
  EMOJIS.forEach(e=>{
    const sp = document.createElement('span');
    sp.textContent = e;
    sp.onclick = () => {
      btn.textContent = e;
      syncCatFormState();
      saveCats();
      closeEmojiPicker();
    };
    picker.appendChild(sp);
  });
  document.body.appendChild(picker);
  setTimeout(()=>document.addEventListener('click', closeEmojiPickerOutside), 0);
}

function closeEmojiPicker(){
  const p = document.getElementById('emoji-popup');
  if(p) p.remove();
  document.removeEventListener('click', closeEmojiPickerOutside);
}

function closeEmojiPickerOutside(e){
  if(!e.target.closest('.emoji-picker-popup')&&!e.target.closest('.emoji-pick')) closeEmojiPicker();
}

// ==================== EXPORT / IMPORT ====================
function exportAllData(){
  // Collect all txn keys
  const txns = {};
  for(let k in localStorage){
    if(k.startsWith('txn_')) txns[k] = localStorage[k];
  }
  const data = {
    version: 3,
    exported: new Date().toISOString(),
    cats: CATS,
    limits: currentLimits,
    currency: currentCurrency,
    expenses: loadAll(),
    bills: loadBills(),
    notes: getAllNotes(),
    txns
  };
  const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `مصاريف-البيت-${new Date().toLocaleDateString('ar')}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📤 تم تصدير البيانات');
}

function exportMonth(){
  const s = loadM(curY,curM);
  const data = {
    month: mLabel(curY,curM),
    exported: new Date().toISOString(),
    currency: currentCurrency,
    data: s,
    cats: CATS,
    limits: currentLimits
  };
  const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `مصاريف-${mLabel(curY,curM)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`📤 تم تصدير ${mLabel(curY,curM)}`);
}

// ===== CSV EXPORT =====
function exportCSV(){
  const all = loadAll();
  const keys = Object.keys(all).sort();
  if(!keys.length){ showToast('⚠️ لا توجد بيانات للتصدير'); return; }

  const lbl = getCurrencyLabel();
  let csv = '\uFEFF'; // BOM for Arabic Excel
  // Header
  const headers = ['الشهر', ...CATS.map(c=>c.name), 'الدخل', 'احتياطي الطوارئ', 'هدف التوفير', 'المجموع', 'المتبقي'];
  csv += headers.join(',') + '\n';

  keys.forEach(k=>{
    const d = all[k]||{};
    const [y,m] = k.split('-');
    const monthName = MONTHS[parseInt(m)-1]+' '+y;
    const total = CATS.reduce((s,c)=>s+(d[c.id]||0),0);
    const income = d.income||0;
    const em = d.emergency||0;
    const remaining = income - total - em;
    const row = [
      monthName,
      ...CATS.map(c=>d[c.id]||0),
      income, em, d.savingGoal||0, total, remaining
    ];
    csv += row.join(',') + '\n';
  });

  const blob = new Blob([csv],{type:'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `مصاريف-البيت-${new Date().toLocaleDateString('ar')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📊 تم تصدير CSV بنجاح');
}

function importData(event){
  const file = event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e=>{
    try{
      const data = JSON.parse(e.target.result);
      if(data.version >= 2){
        if(data.cats){ CATS = data.cats; saveCats(); }
        if(data.limits){ currentLimits = data.limits; saveLimitsToStorage(); }
        if(data.expenses){ saveAll(data.expenses); }
        if(data.bills){ saveBills(data.bills); }
        if(data.notes){ restoreAllNotes(data.notes); }
        if(data.txns){
          for(let k in data.txns){
            if(k.startsWith('txn_')) localStorage.setItem(k, data.txns[k]);
          }
        }
        if(data.currency){
          currentCurrency = data.currency;
          localStorage.setItem('preferred_currency', currentCurrency);
          const sel = document.getElementById('currency-sel');
          if(sel) sel.value = currentCurrency;
        }
      } else if(data.expenses){
        saveAll(data.expenses);
      } else {
        showToast('⚠️ ملف غير صالح');
        return;
      }
      renderEntry();
      renderCustomCatsList();
      populatePickers();
      updateCurrencyLabels();
      renderDashboard();
      showToast('✓ تم استيراد البيانات بنجاح');
    }catch(err){
      showToast('❌ خطأ في قراءة الملف');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

async function clearAllData(){
  const ok = await customConfirm({
    icon: '🗑️',
    title: 'حذف جميع البيانات',
    message: 'سيتم حذف كل المصاريف والفئات والحدود والفواتير والملاحظات نهائياً. لا يمكن التراجع!',
    okText: '🗑️ نعم، احذف الكل',
    danger: true
  });
  if(!ok) return;
  // Remove all app keys
  const keysToRemove = [];
  for(let k in localStorage){
    if(k === 'home_exp' || k === 'category_limits' || k === 'home_cats' ||
       k === 'bills' || k.startsWith('txn_') || k.startsWith('note_') ||
       k.startsWith('recurring_dismiss_')) {
      keysToRemove.push(k);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
  localStorage.removeItem('home_exp');
  localStorage.removeItem('category_limits');
  localStorage.removeItem('home_cats');
  CATS = DEFAULT_CATS.map(c=>({...c}));
  currentLimits = {...DEFAULT_LIMITS};
  saveCats(); saveLimitsToStorage();
  renderEntry(); renderCustomCatsList(); populatePickers();
  showToast('🗑️ تم حذف كل البيانات');
}

function copyLimitsToMonth(){
  showToast('✓ الحدود مطبقة على الشهر الحالي');
}

// ==================== TABS ====================
function switchTab(t){
  const tabNames = ['dashboard','entry','transfer','compare','settings'];
  document.querySelectorAll('.tab').forEach((el,i)=>{
    el.classList.toggle('active', tabNames[i]===t);
  });
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.getElementById('tab-'+t).classList.add('active');
  if(t==='dashboard'){ renderDashboard(); }
  if(t==='transfer'){ renderTransferTab(); }
  if(t==='compare'){ populatePickers(); renderCompare(); }
  if(t==='settings'){ renderCustomCatsList(); updateStorageInfo(); }
  // If leaving entry tab with unsaved changes, trigger auto-save
  if(t !== 'entry' && hasUnsavedChanges){
    doSaveMonth(true);
  }
}

// ==================== SETTINGS COLLAPSIBLE ====================
function toggleSettingsGroup(headerEl){
  const group = headerEl.parentElement;
  group.classList.toggle('open');
}

// ==================== MONTHLY NOTE ====================
function noteKey(y,m){ return `note_${mKey(y,m)}`; }
function loadNote(y,m){ return localStorage.getItem(noteKey(y,m)) || ''; }
function saveNote(y,m,txt){
  if(txt) localStorage.setItem(noteKey(y,m), txt);
  else localStorage.removeItem(noteKey(y,m));
  if(!_applyingCloudData){ setLocalUpdated(); scheduleCloudSync(); }
}
let _noteTimer = null;
function onNoteInput(){
  clearTimeout(_noteTimer);
  const el = document.getElementById('month-note');
  _noteTimer = setTimeout(()=>{
    saveNote(curY, curM, el.value.trim());
  }, 800);
}
function getAllNotes(){
  const result = {};
  for(let k in localStorage){
    if(k.startsWith('note_')) result[k] = localStorage[k];
  }
  return result;
}
function restoreAllNotes(notes){
  for(let k in notes){
    if(k.startsWith('note_')) localStorage.setItem(k, notes[k]);
  }
}

// ==================== WHAT-IF CALCULATOR ====================
function updateWhatIf(){
  const amtRaw = document.getElementById('whatif-amount').value;
  const amt = safeCalc(amtRaw) || 0;
  const s = loadM(curY, curM);
  const total = CATS.reduce((a,c)=>a+(s[c.id]||0),0);
  const income = s.income||0;
  const em = s.emergency||0;
  const remainingNow = income - total - em;
  const remainingAfter = remainingNow - amt;
  const lbl = getCurrencyLabel();
  const out = document.getElementById('whatif-result');
  if(!out) return;
  if(!amt){ out.innerHTML = ''; return; }
  if(income <= 0){
    out.innerHTML = '⚠️ أدخل دخلك الشهري أولاً';
    return;
  }
  const color = remainingAfter < 0 ? '#dc2626' : remainingAfter < (s.savingGoal||0) ? '#f59e0b' : '#16a34a';
  const status = remainingAfter < 0 ? 'عجز ⚠️' : remainingAfter < (s.savingGoal||0) ? 'تحت الهدف' : 'ضمن الميزانية ✅';
  out.innerHTML = `
    <div>المتبقي الحالي: <b>${fmt(remainingNow)} ${lbl}</b></div>
    <div>بعد إضافة ${fmt(amt)}: <b style="color:${color}">${fmt(remainingAfter)} ${lbl}</b></div>
    <div style="margin-top:4px;color:${color}">${status}</div>
  `;
}

// ==================== UPCOMING BILLS ====================
// Stored under 'bills' key in localStorage
function loadBills(){
  try { return JSON.parse(localStorage.getItem('bills') || '[]'); }
  catch(e){ return []; }
}
function saveBills(arr){
  localStorage.setItem('bills', JSON.stringify(arr));
  if(!_applyingCloudData){ setLocalUpdated(); scheduleCloudSync(); }
}
function addBill(bill){
  const bills = loadBills();
  bills.push({ id: Date.now(), ...bill });
  saveBills(bills);
}
function deleteBill(id){
  saveBills(loadBills().filter(b => b.id !== id));
}
function upcomingBills(daysAhead = 7){
  const today = new Date();
  const todayStr = today.toISOString().slice(0,10);
  return loadBills().map(b => {
    // dueDay = day of month (1-31) when bill recurs
    const dueDate = new Date(today.getFullYear(), today.getMonth(), b.dueDay);
    if(dueDate < today) dueDate.setMonth(dueDate.getMonth()+1);
    const daysLeft = Math.ceil((dueDate - today) / (1000*60*60*24));
    return { ...b, daysLeft, dueDate: dueDate.toISOString().slice(0,10) };
  }).filter(b => b.daysLeft <= daysAhead && b.daysLeft >= 0)
    .sort((a,b) => a.daysLeft - b.daysLeft);
}
function renderUpcomingBills(){
  const upcoming = upcomingBills(7);
  if(!upcoming.length) return '';
  const lbl = getCurrencyLabel();
  const items = upcoming.map(b => {
    const cat = CATS.find(c => c.id === b.catId);
    const urgency = b.daysLeft === 0 ? 'اليوم!' : b.daysLeft === 1 ? 'غداً' : `بعد ${b.daysLeft} أيام`;
    const color = b.daysLeft <= 1 ? '#dc2626' : b.daysLeft <= 3 ? '#f59e0b' : '#3b82f6';
    return `<div style="display:flex;align-items:center;gap:8px;padding:8px;background:#fff;border-radius:10px;border:1px solid var(--border);margin-bottom:6px">
      <span style="font-size:22px">${cat?.icon || '💰'}</span>
      <div style="flex:1">
        <div style="font-size:12px;font-weight:800;color:var(--dark)">${b.name}</div>
        <div style="font-size:10px;color:#94a3b8;font-weight:600">${cat?.name || ''} • ${b.amount ? fmt(b.amount) + ' ' + lbl : 'بدون مبلغ محدد'}</div>
      </div>
      <span style="font-size:11px;font-weight:800;color:${color}">${urgency}</span>
      <button onclick="markBillPaid(${b.id})" title="تسجيل الدفع" style="background:#dcfce7;color:#15803d;border:none;border-radius:8px;width:28px;height:28px;font-size:14px;cursor:pointer;font-family:'Cairo',sans-serif">✓</button>
    </div>`;
  }).join('');
  return `<div class="recent-box" style="margin-bottom:14px">
    <div class="recent-title">📅 فواتير قادمة (${upcoming.length})</div>
    ${items}
  </div>`;
}
function openBillsModal(){
  const sel = document.getElementById('bill-cat');
  sel.innerHTML = CATS.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
  document.getElementById('bill-name').value = '';
  document.getElementById('bill-day').value = '';
  document.getElementById('bill-amount').value = '';
  renderBillsList();
  document.getElementById('bills-modal').classList.add('active');
}
function closeBillsModal(){
  document.getElementById('bills-modal').classList.remove('active');
}
function submitNewBill(){
  const name = document.getElementById('bill-name').value.trim();
  const catId = document.getElementById('bill-cat').value;
  const dueDay = parseInt(document.getElementById('bill-day').value);
  const amount = safeCalc(document.getElementById('bill-amount').value) || 0;
  if(!name){ showToast('⚠️ أدخل اسم الفاتورة'); return; }
  if(!dueDay || dueDay < 1 || dueDay > 31){ showToast('⚠️ يوم الاستحقاق بين 1 و 31'); return; }
  addBill({ name, catId, dueDay, amount });
  document.getElementById('bill-name').value = '';
  document.getElementById('bill-day').value = '';
  document.getElementById('bill-amount').value = '';
  renderBillsList();
  showToast('✅ تمت إضافة الفاتورة');
  renderDashboard();
}
function renderBillsList(){
  const bills = loadBills();
  const list = document.getElementById('bills-list');
  if(!bills.length){
    list.innerHTML = '<div class="txn-empty">📭 لم تسجّل أي فواتير بعد</div>';
    return;
  }
  const lbl = getCurrencyLabel();
  list.innerHTML = bills.map(b => {
    const cat = CATS.find(c => c.id === b.catId);
    return `<div class="txn-item">
      <span style="font-size:22px">${cat?.icon || '💰'}</span>
      <div class="txn-item-info">
        <div class="txn-item-desc">${b.name}</div>
        <div class="txn-item-date">يوم ${b.dueDay} • ${cat?.name || ''} • ${b.amount ? fmt(b.amount) + ' ' + lbl : 'بدون مبلغ'}</div>
      </div>
      <button class="txn-del-btn" onclick="confirmDeleteBill(${b.id})" title="حذف">✕</button>
    </div>`;
  }).join('');
}
async function confirmDeleteBill(id){
  const ok = await customConfirm({
    icon: '🗑️',
    title: 'حذف الفاتورة',
    message: 'هل تريد حذف هذه الفاتورة من قائمة التذكيرات؟',
    okText: 'حذف',
    danger: true
  });
  if(!ok) return;
  deleteBill(id);
  renderBillsList();
  renderDashboard();
}

function markBillPaid(id){
  const bills = loadBills();
  const b = bills.find(x => x.id === id);
  if(!b) return;
  if(b.amount && b.catId){
    const today = new Date();
    const dateStr = today.toISOString().slice(0,10);
    const txns = loadTxns(curY, curM, b.catId);
    txns.push({ amount: b.amount, desc: b.name, date: dateStr, id: Date.now() });
    saveTxns(curY, curM, b.catId, txns);
    syncTxnTotal(curY, curM, b.catId);
    doSaveMonth(true);
    showToast(`✅ تم تسجيل دفعة ${fmt(b.amount)} ${getCurrencyLabel()}`);
    renderDashboard();
  } else {
    showToast(`✅ تم تسجيل دفعة ${b.name}`);
  }
}

// ==================== CUSTOM CONFIRM ====================
function customConfirm(opts){
  return new Promise(resolve => {
    const modal = document.getElementById('confirm-modal');
    document.getElementById('confirm-icon').textContent = opts.icon || '⚠️';
    document.getElementById('confirm-title').textContent = opts.title || 'تأكيد';
    document.getElementById('confirm-message').textContent = opts.message || '';
    const okBtn = document.getElementById('confirm-ok-btn');
    const cancelBtn = document.getElementById('confirm-cancel-btn');
    okBtn.textContent = opts.okText || 'تأكيد';
    cancelBtn.textContent = opts.cancelText || 'إلغاء';
    okBtn.style.background = opts.danger ? '#dc2626' : 'var(--accent)';
    const close = (val) => {
      modal.classList.remove('active');
      okBtn.onclick = null; cancelBtn.onclick = null;
      modal.onclick = null;
      resolve(val);
    };
    okBtn.onclick = () => close(true);
    cancelBtn.onclick = () => close(false);
    modal.onclick = (e) => { if(e.target === modal) close(false); };
    modal.classList.add('active');
  });
}

// ==================== TOAST ====================
let toastTimer = null;
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 2500);
}

// ==================== TRANSACTIONS SYSTEM ====================
let txnCatId = null; // current open category
let selectedPayMethod = 'cash';

function setPayMethod(m){
  selectedPayMethod = m;
  const cashBtn = document.getElementById('pmb-cash');
  const cardBtn = document.getElementById('pmb-card');
  if(cashBtn) cashBtn.className = 'pay-btn' + (m === 'cash' ? ' pay-cash-active' : '');
  if(cardBtn) cardBtn.className = 'pay-btn' + (m === 'card' ? ' pay-card-active' : '');
}

// Storage key for transactions: txn_YYYY-MM_catId
function txnKey(y, m, catId){ return `txn_${mKey(y,m)}_${catId}`; }

function loadTxns(y, m, catId){
  try{ return JSON.parse(localStorage.getItem(txnKey(y,m,catId)) || '[]'); }
  catch(e){ return []; }
}

function saveTxns(y, m, catId, arr){
  localStorage.setItem(txnKey(y,m,catId), JSON.stringify(arr));
}

function getTxnTotal(y, m, catId){
  return loadTxns(y,m,catId).reduce((s,t)=>s+(t.amount||0), 0);
}

// Sync txn total → main data store (called after any txn change)
function syncTxnTotal(y, m, catId){
  const total = getTxnTotal(y,m,catId);
  const all = loadAll();
  const key = mKey(y,m);
  if(!all[key]) all[key] = {};
  all[key][catId] = total;
  saveAll(all);
  // Update the display in the cat-row
  const row = document.getElementById('txncount-'+catId)?.closest('.cat-row');
  if(row){
    const amountEl = row.querySelector('div[style*="font-size:18px"]');
    const lblEl = row.querySelector('div[style*="font-size:11px"]');
    if(amountEl) amountEl.textContent = total>0 ? fmt(total) : '—';
    if(amountEl) amountEl.style.color = total>0 ? 'var(--accent)' : '#94a3b8';
    if(lblEl) lblEl.textContent = total>0 ? getCurrencyLabel() : '';
    // Update limit progress bar
    const limit = getLimitForCategory(catId);
    const pct = limit>0 ? Math.min((total/limit)*100,100) : 0;
    const fill = row.querySelector('.limit-progress-fill');
    if(fill){
      let color = '#22c55e';
      if(pct>=100) color='#dc2626'; else if(pct>=85) color='#f59e0b';
      fill.style.width = pct+'%'; fill.style.background = color;
    }
    const rowPct = limit>0?(total/limit)*100:0;
    row.className = 'cat-row '+(rowPct>=100?'over-limit':rowPct>=85?'near-limit':'');
    row.style.cursor = 'pointer';
    // Update count
    const countEl = row.querySelector('.cat-txn-count');
    if(countEl){
      const txns = loadTxns(y,m,catId);
      countEl.textContent = txns.length>0 ? `${txns.length} عملية` : 'اضغط للإضافة';
    }
  }
  updateHeaderStats();
}

function renderCatHistoryChart(catId){
  const all = loadAll();
  const keys = Object.keys(all).sort().slice(-6);
  if(keys.length < 2) return '';
  const points = keys.map(k => {
    const [y,m] = k.split('-');
    return {
      label: MONTHS[parseInt(m)-1].substring(0,3),
      val: (all[k] || {})[catId] || 0
    };
  });
  const max = Math.max(...points.map(p => p.val), 1);
  const lbl = getCurrencyLabel();
  const W = 280, H = 70, PAD = 6;
  const xStep = (W - PAD*2) / (points.length - 1 || 1);
  const toY = v => PAD + (H - PAD*2) * (1 - v/max);
  const path = points.map((p,i) => `${i===0?'M':'L'} ${PAD + i*xStep} ${toY(p.val)}`).join(' ');
  const dots = points.map((p,i) => `
    <circle cx="${PAD + i*xStep}" cy="${toY(p.val)}" r="2.5" fill="#e94560"/>
    <text x="${PAD + i*xStep}" y="${H+8}" text-anchor="middle" font-size="8" fill="#94a3b8" font-family="Cairo">${p.label}</text>
  `).join('');
  const avg = Math.round(points.reduce((s,p)=>s+p.val,0)/points.length);
  return `<div style="background:#f8fafc;border-radius:14px;padding:10px 12px;margin-bottom:12px;border:1px solid var(--border)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <span style="font-size:11px;font-weight:800;color:var(--dark)">📈 آخر ${points.length} أشهر</span>
      <span style="font-size:10px;color:#64748b;font-weight:700">المتوسط: ${fmt(avg)} ${lbl}</span>
    </div>
    <svg viewBox="0 0 ${W} ${H+12}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:auto">
      <path d="${path}" fill="none" stroke="#e94560" stroke-width="1.8"/>
      ${dots}
    </svg>
  </div>`;
}

function openTxnModal(catId){
  txnCatId = catId;
  txnEditIdx = null;
  const cat = CATS.find(c=>c.id===catId);
  document.getElementById('txn-modal-title').textContent = `${cat?.icon||'📋'} ${cat?.name||''}`;
  document.getElementById('txn-modal-lbl').textContent = getCurrencyLabel();
  // Inject history chart at top of list
  const histContainer = document.getElementById('txn-history-chart');
  if(histContainer) histContainer.innerHTML = renderCatHistoryChart(catId);

  // Reset form into "add" mode
  const today = new Date();
  const dd = String(today.getDate()).padStart(2,'0');
  const mm = String(today.getMonth()+1).padStart(2,'0');
  document.getElementById('txn-date').value = `${today.getFullYear()}-${mm}-${dd}`;
  document.getElementById('txn-desc').value = '';
  document.getElementById('txn-amount').value = '';
  const searchEl = document.getElementById('txn-search');
  if(searchEl) searchEl.value = '';
  document.querySelector('.txn-add-form .form-title').innerHTML = '➕ إضافة شراء جديد';
  document.querySelector('.txn-add-btn').innerHTML = '✅ إضافة';

  renderTxnList();
  document.getElementById('txn-modal').classList.add('active');
  setTimeout(()=>document.getElementById('txn-amount').focus(), 200);
}

function closeTxnModal(){
  document.getElementById('txn-modal').classList.remove('active');
  txnCatId = null;
  txnEditIdx = null;
}

function renderTxnList(){
  if(!txnCatId) return;
  const txns = loadTxns(curY, curM, txnCatId);
  const total    = txns.reduce((s,t)=>s+(t.amount||0),0);
  const cashTot  = txns.reduce((s,t)=>t.method!=='card'?s+(t.amount||0):s,0);
  const cardTot  = txns.reduce((s,t)=>t.method==='card'?s+(t.amount||0):s,0);
  const lbl      = getCurrencyLabel();
  document.getElementById('txn-modal-total').textContent = fmt(total);

  const summary = document.getElementById('txn-method-summary');
  if(summary){
    if(cashTot > 0 && cardTot > 0)
      summary.innerHTML = `<span class="msum-cash">💵 ${fmt(cashTot)}</span><span class="msum-sep">·</span><span class="msum-card">💳 ${fmt(cardTot)}</span>`;
    else if(cardTot > 0)
      summary.innerHTML = `<span class="msum-card">💳 ${fmt(cardTot)} ${lbl}</span>`;
    else
      summary.innerHTML = '';
  }

  const badge = document.getElementById('txn-count-badge');
  if(badge) badge.textContent = txns.length ? `${txns.length} عملية` : '';

  const list = document.getElementById('txn-list');
  const searchEl = document.getElementById('txn-search');
  const q = (searchEl?.value || '').trim().toLowerCase();
  const filtered = q
    ? txns.filter(t => (t.desc||'').toLowerCase().includes(q) || String(t.amount).includes(q))
    : txns;

  if(!txns.length){
    list.innerHTML = '<div class="txn-empty">📭 لا توجد مشتريات مسجلة بعد</div>';
    return;
  }
  if(!filtered.length){
    list.innerHTML = '<div class="txn-empty">🔍 لا توجد نتائج تطابق البحث</div>';
    return;
  }
  list.innerHTML = [...filtered].reverse().map(t=>{
    const i = txns.indexOf(t);
    const dateDisplay = t.date ? formatArabicDate(t.date) : '';
    const isEditing = txnEditIdx === i;
    const isCard = t.method === 'card';
    const methodBadge = isCard
      ? `<span class="txn-method-badge txn-method-card">💳 بطاقة</span>`
      : `<span class="txn-method-badge txn-method-cash">💵 كاش</span>`;
    return `<div class="txn-item${isEditing?' txn-item-editing':''}">
      <div class="txn-item-info">
        <div class="txn-item-desc">${t.desc || '—'}</div>
        <div class="txn-item-meta">${methodBadge}<span class="txn-item-date">📅 ${dateDisplay}</span></div>
      </div>
      <div class="txn-item-amount">${fmt(t.amount)} ${lbl}</div>
      <button class="txn-del-btn" style="background:#dbeafe;color:#1d4ed8;margin-left:4px" onclick="editTransaction(${i})" title="تعديل">✎</button>
      <button class="txn-del-btn" onclick="deleteTransaction(${i})" title="حذف">✕</button>
    </div>`;
  }).join('');
}

let txnEditIdx = null;
function editTransaction(idx){
  const txns = loadTxns(curY, curM, txnCatId);
  const t = txns[idx];
  if(!t) return;
  txnEditIdx = idx;
  document.getElementById('txn-desc').value = t.desc || '';
  document.getElementById('txn-amount').value = t.amount || '';
  if(t.date) document.getElementById('txn-date').value = t.date;
  setPayMethod(t.method || 'cash');
  document.querySelector('.txn-add-form .form-title').innerHTML = '✏️ تعديل العملية';
  document.querySelector('.txn-add-btn').innerHTML = '💾 حفظ التعديل';
  document.getElementById('txn-amount').focus();
  renderTxnList();
}

function cancelEditTxn(){
  txnEditIdx = null;
  document.getElementById('txn-desc').value = '';
  document.getElementById('txn-amount').value = '';
  setPayMethod('cash');
  document.querySelector('.txn-add-form .form-title').innerHTML = '➕ إضافة شراء جديد';
  document.querySelector('.txn-add-btn').innerHTML = '✅ إضافة';
  renderTxnList();
}

function formatArabicDate(dateStr){
  if(!dateStr) return '';
  try{
    const [y,m,d] = dateStr.split('-');
    const names = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    return `${parseInt(d)} ${names[parseInt(m)-1]} ${y}`;
  }catch(e){ return dateStr; }
}

function addTransaction(){
  if(!txnCatId) return;
  const amountRaw = document.getElementById('txn-amount').value;
  const amount = safeCalc(amountRaw);
  if(!amount || amount <= 0){ showToast('⚠️ أدخل مبلغاً صحيحاً'); return; }
  const desc = document.getElementById('txn-desc').value.trim();
  const date = document.getElementById('txn-date').value;

  const txns = loadTxns(curY, curM, txnCatId);
  const method = selectedPayMethod || 'cash';
  if(txnEditIdx !== null && txns[txnEditIdx]){
    txns[txnEditIdx] = { ...txns[txnEditIdx], amount, desc, date, method };
    saveTxns(curY, curM, txnCatId, txns);
    syncTxnTotal(curY, curM, txnCatId);
    doSaveMonth(true);
    cancelEditTxn();
    showToast(`✅ تم تعديل العملية`);
    return;
  }
  txns.push({ amount, desc, date, id: Date.now(), method });
  saveTxns(curY, curM, txnCatId, txns);
  syncTxnTotal(curY, curM, txnCatId);
  markUnsaved();
  doSaveMonth(true);

  document.getElementById('txn-amount').value = '';
  document.getElementById('txn-desc').value = '';

  renderTxnList();
  renderEntry();
  showToast(`✅ تمت إضافة ${fmt(amount)} ${getCurrencyLabel()}`);
}

async function deleteTransaction(idx){
  if(!txnCatId) return;
  const ok = await customConfirm({
    icon: '🗑️',
    title: 'حذف العملية',
    message: 'هل تريد حذف هذه العملية نهائياً؟',
    okText: 'حذف',
    danger: true
  });
  if(!ok) return;
  const txns = loadTxns(curY, curM, txnCatId);
  txns.splice(idx, 1);
  saveTxns(curY, curM, txnCatId, txns);
  syncTxnTotal(curY, curM, txnCatId);
  doSaveMonth(true);
  renderTxnList();
  renderEntry();
  showToast('🗑️ تم الحذف');
}

// Get transaction count for a category in current month
function getTxnCount(catId){
  return loadTxns(curY, curM, catId).length;
}

// ==================== DASHBOARD ====================
let curYD = now.getFullYear(), curMD = now.getMonth();

function tryChangeMonthD(d){
  curMD += d;
  if(curMD < 0){ curMD = 11; curYD--; }
  if(curMD > 11){ curMD = 0; curYD++; }
  renderDashboard();
}

function renderDashboard(){
  document.getElementById('month-label-d').textContent = mLabel(curYD, curMD);
  const s = loadM(curYD, curMD);
  const total = CATS.reduce((a,c)=>a+(s[c.id]||0),0);
  const income = s.income||0;
  const emergency = s.emergency||0;
  const savGoal = s.savingGoal||0;
  const remaining = income - total - emergency;
  const lbl = getCurrencyLabel();
  const out = document.getElementById('dashboard-content');
  if(!out) return;

  // --- Previous month data for comparisons ---
  let prevM = curMD - 1, prevY = curYD;
  if(prevM < 0){ prevM = 11; prevY--; }
  const sPrev = loadM(prevY, prevM);
  const totalPrev = CATS.reduce((a,c)=>a+(sPrev[c.id]||0),0);
  const incomePrev = sPrev.income||0;
  const emergencyPrev = sPrev.emergency||0;
  const remainingPrev = incomePrev - totalPrev - emergencyPrev;
  const savPctPrev = incomePrev > 0 ? Math.max(0, Math.round((remainingPrev/incomePrev)*100)) : 0;

  const savPct = income > 0 ? Math.max(0, Math.round((remaining/income)*100)) : 0;
  const spentPct = income > 0 ? Math.min(Math.round((total/income)*100), 100) : 0;

  // --- Helpers ---
  const pctChange = (cur, prev) => {
    if(prev === 0) return cur === 0 ? 0 : null;
    return Math.round(((cur - prev) / Math.abs(prev)) * 100);
  };
  const trendBadge = (cur, prev, goodWhenLower) => {
    if(prev === 0 && cur === 0) return '';
    const ch = pctChange(cur, prev);
    if(ch === null) return `<div class="dc-trend flat">جديد</div>`;
    if(ch === 0) return `<div class="dc-trend flat">— ثابت</div>`;
    const up = ch > 0;
    const cls = goodWhenLower
      ? (up ? 'up' : 'down')
      : (up ? 'up-good' : 'down-bad');
    const arrow = up ? '▲' : '▼';
    return `<div class="dc-trend ${cls}">${arrow} ${Math.abs(ch)}%</div>`;
  };

  // --- Daily transactions for current month (used by chart + projection + health) ---
  const dailyTotals = {};
  let transactionsThisMonth = 0;
  CATS.forEach(c=>{
    const txns = loadTxns(curYD, curMD, c.id);
    transactionsThisMonth += txns.length;
    txns.forEach(t=>{
      const d = t.date || '';
      const day = d ? parseInt(d.slice(8,10)) : 0;
      if(day >= 1 && day <= 31){
        dailyTotals[day] = (dailyTotals[day]||0) + (t.amount||0);
      }
    });
  });
  const daysInMonth = new Date(curYD, curMD+1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === curYD && today.getMonth() === curMD;
  const todayDay = isCurrentMonth ? today.getDate() : daysInMonth;
  const daysElapsed = Math.min(todayDay, daysInMonth);
  const daysLeft = Math.max(0, daysInMonth - daysElapsed);
  let cumulativeSoFar = 0;
  for(let d=1; d<=daysElapsed; d++) cumulativeSoFar += (dailyTotals[d]||0);
  const trackedTotal = cumulativeSoFar > 0 ? cumulativeSoFar : total;
  const avgPerDay = daysElapsed > 0 ? trackedTotal/daysElapsed : 0;
  const projection = isCurrentMonth ? Math.round(avgPerDay * daysInMonth) : total;
  const dailyAllowance = (income > 0 && daysLeft > 0)
    ? Math.max(0, (income - total - emergency) / daysLeft)
    : 0;

  // --- Health Score ---
  let healthScore = 0;
  const factors = [];
  if(income > 0){
    // Saving %: up to 35 points
    const sp = savPct;
    if(sp >= 20){ healthScore += 35; factors.push({txt:`💎 توفير ${sp}%`, cls:'good'}); }
    else if(sp >= 10){ healthScore += 22; factors.push({txt:`💰 توفير ${sp}%`, cls:'warn'}); }
    else if(sp > 0){ healthScore += 10; factors.push({txt:`⚠️ توفير ${sp}%`, cls:'warn'}); }
    else { factors.push({txt:'🔴 لا توفير', cls:'bad'}); }

    // Within budget: up to 25 points
    if(total <= income){ healthScore += 25; factors.push({txt:'✅ ضمن الدخل', cls:'good'}); }
    else { factors.push({txt:'🚨 تجاوز الدخل', cls:'bad'}); }

    // Projection: up to 20 points
    if(isCurrentMonth && projection > 0){
      if(projection <= income){ healthScore += 20; factors.push({txt:'📈 توقع ضمن الميزانية', cls:'good'}); }
      else if(projection <= income * 1.1){ healthScore += 10; factors.push({txt:'📈 توقع قريب من الحد', cls:'warn'}); }
      else { factors.push({txt:'📉 توقع تجاوز', cls:'bad'}); }
    } else if(!isCurrentMonth){
      healthScore += 20;
    }
  } else {
    factors.push({txt:'💼 لم تحدد دخلاً', cls:'warn'});
  }
  // Emergency fund: up to 10 points
  if(emergency > 0){ healthScore += 10; factors.push({txt:'🛡️ احتياطي مفعّل', cls:'good'}); }

  // Limits compliance: up to 10 points
  const overLimitCats = CATS.filter(c=>{
    const v = s[c.id]||0; const lim = getLimitForCategory(c.id);
    return lim > 0 && v > lim;
  }).length;
  if(overLimitCats === 0){ healthScore += 10; }
  else if(overLimitCats <= 2){ healthScore += 5; factors.push({txt:`⚠️ ${overLimitCats} فئة تجاوزت الحد`, cls:'warn'}); }
  else { factors.push({txt:`🔴 ${overLimitCats} فئات تجاوزت`, cls:'bad'}); }

  if(income === 0 && total === 0) healthScore = 0;
  healthScore = Math.min(100, healthScore);

  let healthLabel, healthEmoji, healthColor, healthDesc;
  if(healthScore >= 80){ healthLabel='ممتازة'; healthEmoji='🌟'; healthColor='#10b981'; healthDesc='وضعك المالي ممتاز — حافظ على هذا الأداء'; }
  else if(healthScore >= 60){ healthLabel='جيدة'; healthEmoji='✅'; healthColor='#3b82f6'; healthDesc='أداء جيد — في مجال للتحسين'; }
  else if(healthScore >= 40){ healthLabel='متوسطة'; healthEmoji='⚠️'; healthColor='#f59e0b'; healthDesc='انتبه — راجع المصاريف الكبيرة'; }
  else if(healthScore > 0){ healthLabel='ضعيفة'; healthEmoji='🚨'; healthColor='#ef4444'; healthDesc='وضع حرج — قلل الإنفاق فوراً'; }
  else { healthLabel='ابدأ التتبع'; healthEmoji='📝'; healthColor='#94a3b8'; healthDesc='أدخل دخلك ومصاريفك لرؤية صحتك المالية'; }

  const hCirc = 2 * Math.PI * 36;
  const hDash = (healthScore/100) * hCirc;
  const factorsHTML = factors.slice(0,4).map(f=>`<div class="hh-factor ${f.cls}">${f.txt}</div>`).join('');
  const healthHTML = `<div class="health-hero">
    <div class="hh-row">
      <div class="hh-score-wrap">
        <svg viewBox="0 0 84 84">
          <circle cx="42" cy="42" r="36" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="8"/>
          <circle cx="42" cy="42" r="36" fill="none" stroke="${healthColor}" stroke-width="8"
            stroke-dasharray="${hDash} ${hCirc}" stroke-linecap="round" style="transition:all 0.6s"/>
        </svg>
        <div class="hh-score-num">${healthScore}</div>
      </div>
      <div class="hh-info">
        <div class="hh-status">${healthLabel} <span class="hh-emoji">${healthEmoji}</span></div>
        <div class="hh-desc">${healthDesc}</div>
      </div>
    </div>
    ${factorsHTML ? `<div class="hh-factors">${factorsHTML}</div>` : ''}
  </div>`;

  // --- Smart KPI Cards with trend vs prev month ---
  const kpiHTML = `<div class="dash-grid">
    <div class="dash-card">
      <div class="dc-lbl">💸 إجمالي المصاريف</div>
      <div class="dc-val ${total > income && income > 0 ? 'red' : ''}">${fmt(total)}</div>
      <div class="dc-sub">${lbl}</div>
      ${trendBadge(total, totalPrev, true)}
    </div>
    <div class="dash-card">
      <div class="dc-lbl">💰 الدخل</div>
      <div class="dc-val">${income > 0 ? fmt(income) : '—'}</div>
      <div class="dc-sub">${lbl}</div>
      ${trendBadge(income, incomePrev, false)}
    </div>
    <div class="dash-card">
      <div class="dc-lbl">📉 المتبقي</div>
      <div class="dc-val ${remaining < 0 ? 'red' : 'green'}">${income > 0 ? fmt(remaining) : '—'}</div>
      <div class="dc-sub">${remaining < 0 ? 'عجز' : 'فائض'}</div>
      ${income > 0 ? trendBadge(remaining, remainingPrev, false) : ''}
    </div>
    <div class="dash-card">
      <div class="dc-lbl">🎯 نسبة التوفير</div>
      <div class="dc-val ${savPct >= 20 ? 'green' : savPct > 0 ? 'blue' : 'red'}">${savPct}%</div>
      <div class="dc-sub">من الدخل</div>
      ${income > 0 && incomePrev > 0 ? trendBadge(savPct, savPctPrev, false) : ''}
    </div>
  </div>`;

  // --- Days left + daily allowance bar (only when current month) ---
  let daysHTML = '';
  if(isCurrentMonth && income > 0){
    const allowanceRed = dailyAllowance < (avgPerDay * 0.8);
    daysHTML = `<div class="days-bar">
      <div class="db-icon">📅</div>
      <div class="db-info">
        <div class="db-title">متبقي بالشهر</div>
        <div class="db-main">${daysLeft} يوم من ${daysInMonth}</div>
      </div>
      <div class="db-allow">
        <div class="db-allow-lbl">المتاح يومياً</div>
        <div class="db-allow-val ${allowanceRed ? 'red' : ''}">${fmt(dailyAllowance)} ${lbl}</div>
      </div>
    </div>`;
  }

  // --- Daily spending line chart ---
  let dailyChartHTML = '';
  const hasDailyData = Object.keys(dailyTotals).length > 0;
  if(hasDailyData){
    const W = 320, H = 140, padL = 8, padR = 8, padT = 14, padB = 22;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;
    let cumulative = 0;
    const points = [];
    for(let d=1; d<=daysElapsed; d++){
      cumulative += (dailyTotals[d]||0);
      points.push({d, cum:cumulative, daily:dailyTotals[d]||0});
    }
    const maxVal = Math.max(projection, cumulative, 1);
    const xOf = day => padL + ((day-1)/(daysInMonth-1)) * innerW;
    const yOf = val => padT + innerH - (val/maxVal) * innerH;

    // Cumulative path
    const linePath = points.map((p,i)=>`${i===0?'M':'L'} ${xOf(p.d).toFixed(1)} ${yOf(p.cum).toFixed(1)}`).join(' ');
    const areaPath = points.length > 0
      ? `${linePath} L ${xOf(points[points.length-1].d).toFixed(1)} ${(padT+innerH).toFixed(1)} L ${xOf(points[0].d).toFixed(1)} ${(padT+innerH).toFixed(1)} Z`
      : '';

    // Projection dashed line from today to month end
    let projPath = '';
    if(isCurrentMonth && daysLeft > 0 && points.length > 0){
      const last = points[points.length-1];
      projPath = `M ${xOf(last.d).toFixed(1)} ${yOf(last.cum).toFixed(1)} L ${xOf(daysInMonth).toFixed(1)} ${yOf(projection).toFixed(1)}`;
    }

    // Income reference line
    const incomeLine = income > 0 && income <= maxVal
      ? `<line x1="${padL}" y1="${yOf(income).toFixed(1)}" x2="${padL+innerW}" y2="${yOf(income).toFixed(1)}" stroke="#10b981" stroke-width="1" stroke-dasharray="3 3" opacity="0.5"/>`
      : '';

    // X-axis labels (1, ~10, ~20, last)
    const xLabels = [1, Math.round(daysInMonth*0.33), Math.round(daysInMonth*0.66), daysInMonth]
      .filter((v,i,a)=>a.indexOf(v)===i);
    const xLabelsSVG = xLabels.map(d=>`<text x="${xOf(d).toFixed(1)}" y="${(H-6).toFixed(1)}" text-anchor="middle" font-size="9" fill="#94a3b8" font-weight="700">${d}</text>`).join('');

    const projOverIncome = isCurrentMonth && income > 0 && projection > income;
    const tagClass = projOverIncome ? 'red' : (projection <= income ? 'green' : '');
    const tagText = isCurrentMonth
      ? `توقع: ${fmt(projection)} ${lbl}`
      : `إجمالي: ${fmt(total)} ${lbl}`;

    dailyChartHTML = `<div class="daily-chart-box">
      <div class="dcb-header">
        <div class="dcb-title">📈 الصرف اليومي التراكمي</div>
        <div class="dcb-tag ${tagClass}">${tagText}</div>
      </div>
      <svg class="dcb-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="dchart-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.02"/>
          </linearGradient>
        </defs>
        ${incomeLine}
        ${areaPath ? `<path d="${areaPath}" fill="url(#dchart-grad)"/>` : ''}
        ${linePath ? `<path d="${linePath}" fill="none" stroke="#3b82f6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
        ${projPath ? `<path d="${projPath}" fill="none" stroke="${projOverIncome?'#dc2626':'#94a3b8'}" stroke-width="2" stroke-dasharray="4 4" stroke-linecap="round"/>` : ''}
        ${points.length > 0 ? `<circle cx="${xOf(points[points.length-1].d).toFixed(1)}" cy="${yOf(points[points.length-1].cum).toFixed(1)}" r="3.5" fill="#3b82f6"/>` : ''}
        ${xLabelsSVG}
      </svg>
      <div class="dcb-stats">
        <div class="dcb-stat">
          <div class="dcb-stat-lbl">معدل الصرف اليومي</div>
          <div class="dcb-stat-val">${fmt(avgPerDay)} ${lbl}</div>
        </div>
        <div class="dcb-stat">
          <div class="dcb-stat-lbl">${isCurrentMonth ? 'توقع نهاية الشهر' : 'إجمالي الشهر'}</div>
          <div class="dcb-stat-val ${projOverIncome ? 'red' : (income > 0 && projection <= income ? 'green' : '')}">${fmt(projection)} ${lbl}</div>
        </div>
      </div>
    </div>`;
  } else if(transactionsThisMonth === 0 && total > 0){
    dailyChartHTML = `<div class="daily-chart-box">
      <div class="dcb-header"><div class="dcb-title">📈 الصرف اليومي</div></div>
      <div class="dcb-empty">📋 أضف معاملات بتواريخ من تبويب الإدخال لرؤية الرسم اليومي</div>
    </div>`;
  }

  // --- Goals card (saving goal + emergency fund) ---
  let goalsHTML = '';
  if(savGoal > 0 || emergency > 0){
    const savActual = Math.max(0, remaining);
    const savPctG = savGoal > 0 ? Math.min(100, Math.round((savActual/savGoal)*100)) : 0;
    // Emergency is a monthly reserved amount; show it as a portion of income
    const emerPctOfIncome = income > 0 ? Math.min(100, Math.round((emergency/income)*100)) : 0;

    let inner = '';
    if(savGoal > 0){
      inner += `<div class="goal-item">
        <div class="gi-head">
          <span class="gi-icon">🎯</span>
          <span class="gi-name">هدف التوفير</span>
          <span class="gi-pct" style="color:${savPctG>=100?'#10b981':'var(--dark)'}">${savPctG}%</span>
        </div>
        <div class="gi-bar-bg"><div class="gi-bar-fill saving" style="width:${savPctG}%"></div></div>
        <div class="gi-foot">
          <span>${fmt(savActual)} من ${fmt(savGoal)} ${lbl}</span>
          <span>${savPctG>=100?'✅ تحقق':`متبقي ${fmt(Math.max(0,savGoal-savActual))} ${lbl}`}</span>
        </div>
      </div>`;
    }
    if(emergency > 0){
      const emerFootRight = income > 0
        ? `<span>${emerPctOfIncome}% من الدخل</span>`
        : `<span>محجوز</span>`;
      inner += `<div class="goal-item">
        <div class="gi-head">
          <span class="gi-icon">🚨</span>
          <span class="gi-name">احتياطي الطوارئ</span>
          <span class="gi-pct">${fmt(emergency)} ${lbl}</span>
        </div>
        <div class="gi-bar-bg"><div class="gi-bar-fill emergency" style="width:${income > 0 ? emerPctOfIncome : 100}%"></div></div>
        <div class="gi-foot">
          <span>محجوز هذا الشهر</span>
          ${emerFootRight}
        </div>
      </div>`;
    }
    goalsHTML = `<div class="goals-box">
      <div class="goals-title">🎯 الأهداف والاحتياطي</div>
      ${inner}
    </div>`;
  }

  // --- 6-month income vs expenses bar chart ---
  let bars6HTML = '';
  {
    const months6 = [];
    let yy = curYD, mm = curMD;
    for(let i=0; i<6; i++){
      months6.unshift({y:yy, m:mm});
      mm--; if(mm<0){ mm=11; yy--; }
    }
    const monthData = months6.map(({y,m})=>{
      const md = loadM(y, m);
      const t = CATS.reduce((a,c)=>a+(md[c.id]||0),0);
      return {y, m, total:t, income:md.income||0};
    });
    const hasAny = monthData.some(d=>d.total > 0 || d.income > 0);
    if(hasAny){
      const W = 320, H = 160, padL = 8, padR = 8, padT = 18, padB = 28;
      const innerW = W - padL - padR;
      const innerH = H - padT - padB;
      const maxV = Math.max(1, ...monthData.map(d=>Math.max(d.total, d.income)));
      const groupW = innerW / monthData.length;
      const barW = Math.min(18, (groupW - 6) / 2);
      const gap = 3;

      let bars = '';
      let labels = '';
      monthData.forEach((d,i)=>{
        const cx = padL + groupW * i + groupW/2;
        const incH = (d.income/maxV) * innerH;
        const expH = (d.total/maxV) * innerH;
        const incY = padT + innerH - incH;
        const expY = padT + innerH - expH;
        const incX = cx - barW - gap/2;
        const expX = cx + gap/2;
        bars += `<rect x="${incX.toFixed(1)}" y="${incY.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(0,incH).toFixed(1)}" rx="3" fill="#10b981"/>`;
        bars += `<rect x="${expX.toFixed(1)}" y="${expY.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(0,expH).toFixed(1)}" rx="3" fill="#e94560"/>`;
        const isCur = (d.y === curYD && d.m === curMD);
        labels += `<text x="${cx.toFixed(1)}" y="${(H-12).toFixed(1)}" text-anchor="middle" font-size="10" fill="${isCur?'#0d1b2a':'#94a3b8'}" font-weight="${isCur?'900':'700'}">${MONTHS[d.m].slice(0,3)}</text>`;
        if(isCur){
          labels += `<text x="${cx.toFixed(1)}" y="${(H-2).toFixed(1)}" text-anchor="middle" font-size="9" fill="#3b82f6" font-weight="700">●</text>`;
        }
      });

      // baseline
      const baseY = padT + innerH;

      bars6HTML = `<div class="bars6-box">
        <div class="b6-title">📊 آخر 6 أشهر</div>
        <div class="b6-sub">مقارنة الدخل والمصاريف الشهرية</div>
        <svg class="b6-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
          <line x1="${padL}" y1="${baseY.toFixed(1)}" x2="${(padL+innerW).toFixed(1)}" y2="${baseY.toFixed(1)}" stroke="var(--border)" stroke-width="1"/>
          ${bars}
          ${labels}
        </svg>
        <div class="b6-legend">
          <div class="b6-legend-item"><span class="b6-legend-dot" style="background:#10b981"></span><span>الدخل</span></div>
          <div class="b6-legend-item"><span class="b6-legend-dot" style="background:#e94560"></span><span>المصاريف</span></div>
        </div>
      </div>`;
    }
  }

  // --- Biggest movers (categories changed most vs previous month) ---
  let moversHTML = '';
  if(totalPrev > 0 || total > 0){
    const movers = CATS.map(c=>{
      const cur = s[c.id]||0;
      const prv = sPrev[c.id]||0;
      if(cur === 0 && prv === 0) return null;
      const change = cur - prv;
      const ch = pctChange(cur, prv);
      return {cat:c, cur, prv, change, pct:ch};
    }).filter(Boolean);

    const ups = movers.filter(m=>m.change > 0)
      .sort((a,b)=>b.change - a.change).slice(0,3);
    const downs = movers.filter(m=>m.change < 0)
      .sort((a,b)=>a.change - b.change).slice(0,3);

    const renderMv = (m, dir) => {
      const pctTxt = m.pct === null ? 'جديد' : `${m.pct > 0 ? '+' : ''}${m.pct}%`;
      const amtTxt = (m.change > 0 ? '+' : '') + fmt(m.change) + ' ' + lbl;
      return `<div class="mv-item ${dir}">
        <span class="mv-icon">${m.cat.icon}</span>
        <span class="mv-name">${m.cat.name}</span>
        <span class="mv-amt">${amtTxt}</span>
        <span class="mv-pct ${dir}">${pctTxt}</span>
      </div>`;
    };

    let inner = '';
    if(ups.length > 0){
      inner += `<div class="mv-section">
        <div class="mv-section-lbl up">▲ ارتفعت</div>
        ${ups.map(m=>renderMv(m,'up')).join('')}
      </div>`;
    }
    if(downs.length > 0){
      inner += `<div class="mv-section">
        <div class="mv-section-lbl down">▼ انخفضت</div>
        ${downs.map(m=>renderMv(m,'down')).join('')}
      </div>`;
    }
    if(inner){
      moversHTML = `<div class="movers-box">
        <div class="mv-title">🔄 أكبر التغيرات (مقابل ${MONTHS[prevM]})</div>
        ${inner}
      </div>`;
    }
  }

  // --- Donut Chart ---
  const catColors = ['#e94560','#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#84cc16','#f97316','#6366f1','#14b8a6','#a78bfa','#fb923c','#22d3ee','#a3e635'];
  const activeCats = CATS.filter(c=>(s[c.id]||0)>0);
  let donutHTML = '';
  if(total > 0){
    const cx=70,cy=70,r=52,stroke=20;
    const circum = 2 * Math.PI * r;
    let offset = 0;
    let segs = '';
    activeCats.forEach((c,i)=>{
      const v = s[c.id]||0;
      const pct = v/total;
      const dash = pct * circum;
      segs += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${catColors[i%catColors.length]}" stroke-width="${stroke}" stroke-dasharray="${dash} ${circum}" stroke-dashoffset="${-offset}" style="transition:all 0.5s"/>`;
      offset += dash;
    });
    const legendItems = activeCats.slice(0,5).map((c,i)=>`
      <div class="dl-item">
        <span class="dl-dot" style="background:${catColors[i%catColors.length]}"></span>
        <span class="dl-name">${c.icon} ${c.name}</span>
        <span class="dl-val">${Math.round((s[c.id]||0)/total*100)}%</span>
      </div>`).join('');
    donutHTML = `<div class="donut-box">
      <div class="donut-wrap">
        <svg class="donut-svg" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="${stroke}"/>
          ${segs}
        </svg>
        <div class="donut-center">
          <span class="dc-pct">${spentPct}%</span>
          <span class="dc-txt">مُنفق</span>
        </div>
      </div>
      <div class="donut-legend">
        <div class="donut-legend-title">توزيع المصاريف</div>
        ${legendItems}
        ${activeCats.length > 5 ? `<div style="font-size:11px;color:#94a3b8;font-weight:700;margin-top:4px">+${activeCats.length-5} فئة أخرى</div>` : ''}
      </div>
    </div>`;
  } else {
    donutHTML = `<div class="donut-box" style="justify-content:center">
      <div style="text-align:center;color:#94a3b8;font-size:13px;font-weight:700;padding:10px">
        📭 لا توجد مصاريف مسجلة لهذا الشهر
      </div>
    </div>`;
  }

  // --- Near Limit alerts ---
  const nearItems = CATS.filter(c=>{
    const v = s[c.id]||0;
    const lim = getLimitForCategory(c.id);
    return lim > 0 && v >= lim * 0.75;
  }).sort((a,b)=>{
    const pa = (s[a.id]||0)/getLimitForCategory(a.id);
    const pb = (s[b.id]||0)/getLimitForCategory(b.id);
    return pb - pa;
  });

  let nearHTML = '';
  if(nearItems.length > 0){
    const items = nearItems.map(c=>{
      const v = s[c.id]||0;
      const lim = getLimitForCategory(c.id);
      const pct = Math.min(Math.round(v/lim*100),100);
      const danger = pct >= 100;
      const fillColor = danger ? '#dc2626' : pct >= 85 ? '#f59e0b' : '#3b82f6';
      return `<div class="nl-item ${danger?'danger':''}">
        <span style="font-size:20px">${c.icon}</span>
        <span style="flex:1;font-size:12px;font-weight:800;color:${danger?'#dc2626':'#92400e'}">${c.name}</span>
        <span style="font-size:11px;font-weight:700;color:${danger?'#dc2626':'#b45309'}">${pct}%</span>
        <div class="nl-bar-bg" style="width:70px">
          <div class="nl-bar-fill" style="width:${pct}%;background:${fillColor}"></div>
        </div>
      </div>`;
    }).join('');
    nearHTML = `<div class="near-limit-box">
      <div class="nlb-title">⚠️ فئات اقتربت من الحد (${nearItems.length})</div>
      ${items}
    </div>`;
  }

  // --- Recent 3 transactions ---
  let recentAll = [];
  CATS.forEach(c=>{
    const txns = loadTxns(curYD, curMD, c.id);
    txns.forEach(t=>recentAll.push({...t, catIcon:c.icon, catName:c.name}));
  });
  recentAll.sort((a,b)=>{
    const da = a.date || '0000-00-00';
    const db = b.date || '0000-00-00';
    return db.localeCompare(da) || b.id - a.id;
  });
  const recent3 = recentAll.slice(0, 3);
  let recentHTML = '';
  if(recent3.length > 0){
    const items = recent3.map(t=>`<div class="recent-item">
      <span class="ri-icon">${t.catIcon}</span>
      <div class="ri-info">
        <div class="ri-name">${t.desc || t.catName}</div>
        <div class="ri-date">${t.catName} • ${t.date ? formatArabicDate(t.date) : '—'}</div>
      </div>
      <span class="ri-amount">${fmt(t.amount)} ${lbl}</span>
    </div>`).join('');
    recentHTML = `<div class="recent-box">
      <div class="recent-title">🕒 آخر المشتريات</div>
      ${items}
    </div>`;
  }

  // --- Saving comparison vs avg ---
  let savingCompareHTML = '';
  if(income > 0){
    const all = loadAll();
    const keys = Object.keys(all).sort();
    const prevKeys = keys.filter(k=>k !== mKey(curYD,curMD)).slice(-3);
    if(prevKeys.length >= 1){
      const avgSaving = prevKeys.reduce((s,k)=>{
        const d = all[k]||{};
        const t2 = CATS.reduce((a,c)=>a+(d[c.id]||0),0);
        const inc2 = d.income||0;
        const em2 = d.emergency||0;
        const rem2 = inc2 > 0 ? Math.max(0, inc2 - t2 - em2) : 0;
        const pct2 = inc2 > 0 ? rem2/inc2*100 : 0;
        return s + pct2;
      }, 0) / prevKeys.length;
      const diff = savPct - avgSaving;
      const diffText = diff > 0 ? `▲ أفضل بـ ${Math.abs(Math.round(diff))}% من المتوسط` : diff < 0 ? `▼ أقل بـ ${Math.abs(Math.round(diff))}% من المتوسط` : 'مساوٍ للمتوسط';
      const barPct = Math.min(savPct, 100);
      savingCompareHTML = `<div class="saving-compare-box">
        <div class="scb-title">📊 نسبة التوفير مقارنة بالمتوسط</div>
        <div class="scb-row">
          <span class="scb-lbl">هذا الشهر</span>
          <span class="scb-val">${savPct}%</span>
        </div>
        <div class="scb-row">
          <span class="scb-lbl">متوسط ${prevKeys.length} أشهر سابقة</span>
          <span class="scb-val" style="opacity:0.7">${Math.round(avgSaving)}%</span>
        </div>
        <div class="scb-bar-bg">
          <div class="scb-bar-fill" style="width:${barPct}%"></div>
        </div>
        <span class="scb-badge ${diff >= 0 ? 'up' : 'down'}">${diffText}</span>
      </div>`;
    }
  }

  const billsHTML = renderUpcomingBills();
  out.innerHTML =
    healthHTML +
    kpiHTML +
    daysHTML +
    billsHTML +
    dailyChartHTML +
    goalsHTML +
    donutHTML +
    moversHTML +
    bars6HTML +
    nearHTML +
    recentHTML +
    savingCompareHTML;
}

// ==================== RECURRING SUGGESTIONS ====================
// Categories considered "recurring" (utility/fixed costs)
const RECURRING_CAT_IDS = ['electric','internet','mobile','gas','school','water'];

function checkRecurringSuggestions(){
  // Only show at start of month (day 1-5) or if dismissed this month
  const dismissKey = 'recurring_dismiss_' + mKey(curY,curM);
  if(localStorage.getItem(dismissKey)) return;
  const today = new Date();
  if(today.getDate() > 7) return; // Only first week of month

  // Get previous month's values for recurring categories
  let prevM = curM - 1, prevY = curY;
  if(prevM < 0){ prevM = 11; prevY--; }
  const prevData = loadM(prevY, prevM);
  const currentData = loadM(curY, curM);

  const suggestions = CATS.filter(c=>{
    const isRecurring = RECURRING_CAT_IDS.includes(c.id) || (c.recurring === true);
    const prevVal = prevData[c.id]||0;
    const curVal = currentData[c.id]||0;
    return isRecurring && prevVal > 0 && curVal === 0;
  }).map(c=>({...c, suggestedAmount: prevData[c.id]}));

  if(suggestions.length === 0) return;

  // Show suggestions box in entry tab
  const entryGrid = document.querySelector('#tab-entry .eg-full');
  if(!entryGrid) return;
  const existing = document.getElementById('recurring-suggest-box');
  if(existing) existing.remove();

  const lbl = getCurrencyLabel();
  const items = suggestions.map(c=>`
    <div class="rsb-item" id="rsb-${c.id}">
      <span class="rsb-icon">${c.icon}</span>
      <div class="rsb-info">
        <div class="rsb-name">${c.name}</div>
        <div class="rsb-amount">${fmt(c.suggestedAmount)} ${lbl} (الشهر الماضي)</div>
      </div>
      <button class="rsb-apply-btn" onclick="applyRecurring('${c.id}',${c.suggestedAmount})">تطبيق</button>
    </div>`).join('');

  const box = document.createElement('div');
  box.id = 'recurring-suggest-box';
  box.className = 'recurring-suggest-box';
  box.innerHTML = `
    <div class="rsb-title">🔄 مصاريف متكررة مقترحة (${suggestions.length})</div>
    ${items}
    <button class="rsb-apply-all" onclick="applyAllRecurring(${JSON.stringify(suggestions.map(c=>c.id))},${JSON.stringify(suggestions.map(c=>c.suggestedAmount))})">✅ تطبيق الكل</button>
    <button class="rsb-dismiss" onclick="dismissRecurring()">تجاهل للشهر الحالي</button>
  `;
  entryGrid.insertAdjacentElement('afterend', box);
}

function applyRecurring(catId, amount){
  const all = loadAll();
  const key = mKey(curY, curM);
  if(!all[key]) all[key] = {};
  all[key][catId] = amount;
  saveAll(all);
  renderEntry();
  renderDashboard();
  document.getElementById(`rsb-${catId}`)?.remove();
  showToast(`✅ تم تطبيق ${fmt(amount)} ${getCurrencyLabel()}`);
  if(!document.querySelector('.rsb-item')){
    document.getElementById('recurring-suggest-box')?.remove();
  }
}

function applyAllRecurring(ids, amounts){
  const all = loadAll();
  const key = mKey(curY, curM);
  if(!all[key]) all[key] = {};
  ids.forEach((id,i) => { all[key][id] = amounts[i]; });
  saveAll(all);
  renderEntry();
  renderDashboard();
  document.getElementById('recurring-suggest-box')?.remove();
  showToast(`✅ تم تطبيق ${ids.length} مصاريف متكررة`);
}

function dismissRecurring(){
  localStorage.setItem('recurring_dismiss_' + mKey(curY, curM), '1');
  document.getElementById('recurring-suggest-box')?.remove();
  showToast('تم التجاهل للشهر الحالي');
}

// Mark a category as recurring from settings
function toggleCatRecurring(catId){
  const cat = CATS.find(c=>c.id===catId);
  if(cat){ cat.recurring = !cat.recurring; saveCats(); }
}

// ==================== SMART BUDGET ====================
function showSmartBudget(){
  const all = loadAll();
  const keys = Object.keys(all).sort();
  const last3 = keys.filter(k=>k !== mKey(curY,curM)).slice(-3);
  if(last3.length < 3){
    showToast(`⚠️ نحتاج بيانات 3 أشهر كاملة (لديك ${last3.length})`);
    return;
  }
  const lbl = getCurrencyLabel();
  // Calculate avg per category
  const avgs = {};
  CATS.forEach(c=>{
    const vals = last3.map(k=>(all[k]||{})[c.id]||0).filter(v=>v>0);
    if(vals.length > 0) avgs[c.id] = Math.round(vals.reduce((s,v)=>s+v,0)/vals.length);
  });

  // Build suggestions
  const suggestions = CATS.filter(c=>avgs[c.id]>0).map(c=>({
    ...c,
    avg: avgs[c.id],
    suggested: Math.round(avgs[c.id] * 1.1) // 10% buffer
  }));

  if(suggestions.length === 0){ showToast('⚠️ لا توجد بيانات كافية'); return; }

  // Remove existing
  document.getElementById('smart-budget-box')?.remove();

  const items = suggestions.map(c=>`
    <div class="sbb-item">
      <span class="sbb-icon">${c.icon}</span>
      <span class="sbb-name">${c.name}</span>
      <span class="sbb-avg">متوسط: ${fmt(c.avg)}</span>
      <span class="sbb-suggest"> → ${fmt(c.suggested)} ${lbl}</span>
      <button class="sbb-apply-btn" onclick="applySmartLimit('${c.id}',${c.suggested})">تطبيق</button>
    </div>`).join('');

  // Show in settings tab limits section
  const limitsBox = document.querySelector('#tab-settings .data-mgmt-box:last-of-type');
  const box = document.createElement('div');
  box.id = 'smart-budget-box';
  box.className = 'smart-budget-box';
  box.innerHTML = `
    <div class="sbb-title">
      🧠 ميزانية ذكية مقترحة
      <button onclick="document.getElementById('smart-budget-box').remove()" style="background:none;border:none;cursor:pointer;color:#64748b;font-size:16px">✕</button>
    </div>
    <div style="font-size:11px;color:#64748b;font-weight:600;margin-bottom:8px">بناءً على متوسط آخر 3 أشهر + هامش 10%</div>
    ${items}
    <button class="sbb-apply-all" onclick="applyAllSmartLimits(${JSON.stringify(suggestions.map(c=>c.id))},${JSON.stringify(suggestions.map(c=>c.suggested))})">✅ تطبيق جميع الحدود المقترحة</button>
  `;
  if(limitsBox) limitsBox.after(box);
  else document.getElementById('tab-settings').appendChild(box);
  showToast('🧠 تم توليد الميزانية الذكية');
}

function applySmartLimit(catId, amount){
  currentLimits[catId] = amount;
  saveLimitsToStorage();
  renderEntry();
  showToast(`✅ حد ${getCurrencyLabel()} ${fmt(amount)} لـ ${CATS.find(c=>c.id===catId)?.name}`);
}

function applyAllSmartLimits(ids, amounts){
  ids.forEach((id,i)=>{ currentLimits[id] = amounts[i]; });
  saveLimitsToStorage();
  renderEntry();
  renderDashboard();
  document.getElementById('smart-budget-box')?.remove();
  showToast(`✅ تم تطبيق ${ids.length} حد ذكي`);
}

// ==================== QUICK ADD ====================
let qaSelectedCat = null;

function openQuickAdd(){
  const container = document.getElementById('qa-cats');
  qaSelectedCat = null;
  container.innerHTML = CATS.map(c=>`
    <div class="qa-cat-btn" id="qa-cat-${c.id}" onclick="selectQACat('${c.id}')">
      <span class="qcb-icon">${c.icon}</span>
      <span class="qcb-name">${c.name}</span>
    </div>`).join('');
  document.getElementById('qa-amount').value = '';
  document.getElementById('qa-currency-lbl').textContent = getCurrencyLabel();
  document.getElementById('qa-modal').classList.add('active');
  setTimeout(()=>document.getElementById('qa-amount').focus(), 300);
}

function selectQACat(catId){
  qaSelectedCat = catId;
  document.querySelectorAll('.qa-cat-btn').forEach(el=>el.classList.remove('selected'));
  document.getElementById('qa-cat-'+catId)?.classList.add('selected');
}

function closeQuickAdd(){
  document.getElementById('qa-modal').classList.remove('active');
  qaSelectedCat = null;
}

function doQuickAdd(){
  if(!qaSelectedCat){ showToast('⚠️ اختر الفئة أولاً'); return; }
  const amountRaw = document.getElementById('qa-amount').value;
  const amount = safeCalc(amountRaw);
  if(!amount || amount <= 0){ showToast('⚠️ أدخل مبلغاً صحيحاً'); return; }

  const cat = CATS.find(c=>c.id===qaSelectedCat);
  const today = new Date();
  const dd = String(today.getDate()).padStart(2,'0');
  const mm = String(today.getMonth()+1).padStart(2,'0');
  const dateStr = `${today.getFullYear()}-${mm}-${dd}`;

  const txns = loadTxns(curY, curM, qaSelectedCat);
  txns.push({ amount, desc: '', date: dateStr, id: Date.now() });
  saveTxns(curY, curM, qaSelectedCat, txns);
  syncTxnTotal(curY, curM, qaSelectedCat);
  doSaveMonth(true);

  closeQuickAdd();
  renderDashboard();
  showToast(`✅ ${cat?.icon||''} ${fmt(amount)} ${getCurrencyLabel()} أُضيف لـ ${cat?.name||''}`);
}

document.getElementById('qa-modal')?.addEventListener('click', function(e){
  if(e.target === this) closeQuickAdd();
});
document.getElementById('qa-amount')?.addEventListener('keydown', function(e){
  if(e.key === 'Enter') doQuickAdd();
});

// ==================== SUPABASE AUTH & CLOUD SYNC ====================
const SUPABASE_URL = 'https://vanuwxbrlpofwcykvmbj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zhya-8ce87SNAyvaBSK6hw_lFy0D1w6';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let authMode = 'login';
let realtimeChannel = null;
let syncRetryTimer = null;
let cloudSyncDebounceTimer = null;
let _applyingCloudData = false;

// ---- Local timestamp helpers ----
function getLocalUpdated(){ return localStorage.getItem('local_updated') || null; }
function setLocalUpdated(){ localStorage.setItem('local_updated', new Date().toISOString()); }
function getLocalSynced(){ return localStorage.getItem('local_synced') || null; }
function setLocalSynced(ts){ localStorage.setItem('local_synced', ts); }

// ---- Debounced cloud sync (called after every local save) ----
function scheduleCloudSync(){
  if(!currentUser) return;
  clearTimeout(cloudSyncDebounceTimer);
  cloudSyncDebounceTimer = setTimeout(()=> cloudSync(true), 5000);
}

// ---- Retry failed sync after 30 seconds ----
function scheduleSyncRetry(){
  clearTimeout(syncRetryTimer);
  syncRetryTimer = setTimeout(()=>{ if(currentUser) cloudSync(true); }, 30000);
}

function toggleAuthMode(){
  authMode = authMode === 'login' ? 'register' : 'login';
  const isReg = authMode === 'register';
  document.getElementById('auth-subtitle').textContent = isReg ? 'أنشئ حساباً جديداً' : 'سجّل دخولك لحفظ بياناتك على السحابة';
  document.getElementById('auth-main-btn').textContent = isReg ? '✅ إنشاء حساب' : '🔑 تسجيل الدخول';
  document.getElementById('auth-switch').innerHTML = isReg
    ? 'لديك حساب؟ <span onclick="toggleAuthMode()">تسجيل الدخول</span>'
    : 'ليس لديك حساب؟ <span onclick="toggleAuthMode()">إنشاء حساب جديد</span>';
  document.getElementById('auth-password2').style.display = isReg ? 'block' : 'none';
  document.getElementById('auth-error').style.display = 'none';
}

function showAuthError(msg){
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.style.display = 'block';
}

async function authAction(){
  const email = document.getElementById('auth-email').value.trim();
  const pass  = document.getElementById('auth-password').value;
  const pass2 = document.getElementById('auth-password2').value;
  document.getElementById('auth-error').style.display = 'none';

  if(!email || !pass){ showAuthError('يرجى إدخال الإيميل وكلمة المرور'); return; }

  const btn = document.getElementById('auth-main-btn');
  btn.disabled = true;
  btn.textContent = '⏳ جارٍ التحميل...';

  try {
    if(authMode === 'register'){
      if(pass !== pass2){ showAuthError('كلمتا المرور غير متطابقتين'); btn.disabled=false; btn.textContent='✅ إنشاء حساب'; return; }
      if(pass.length < 6){ showAuthError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); btn.disabled=false; btn.textContent='✅ إنشاء حساب'; return; }
      const { data, error } = await db.auth.signUp({ email, password: pass });
      if(error) throw error;
      if(data.session){
        currentUser = data.user;
        await onLogin();
        return;
      }
      showAuthError('✅ تم إنشاء الحساب! تحقق من بريدك الإلكتروني لتفعيل الحساب، ثم سجّل الدخول.');
      document.getElementById('auth-error').style.background = '#dcfce7';
      document.getElementById('auth-error').style.color = '#166534';
      document.getElementById('auth-error').style.borderColor = '#bbf7d0';
      btn.disabled=false; btn.textContent='✅ إنشاء حساب';
      return;
    } else {
      const { data, error } = await db.auth.signInWithPassword({ email, password: pass });
      if(error) throw error;
      currentUser = data.user;
      await onLogin();
    }
  } catch(err) {
    const msg = (err.message || '').toLowerCase();
    let arabicMsg;
    if(msg.includes('email rate limit') || msg.includes('over_email_send_rate')){
      arabicMsg = '⏳ تجاوزت عدد المحاولات المسموح. انتظر ساعة، أو استخدم "📱 بدون حساب" للبدء فوراً.';
    } else if(msg.includes('invalid login credentials')){
      arabicMsg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
    } else if(msg.includes('email not confirmed')){
      arabicMsg = '⚠️ يرجى تأكيد بريدك من الرسالة المرسلة إليك أولاً';
    } else if(msg.includes('user already registered')){
      arabicMsg = 'هذا البريد مسجّل مسبقاً — جرّب تسجيل الدخول';
    } else if(msg.includes('rate limit')){
      arabicMsg = '⏳ كثرة محاولات. انتظر قليلاً ثم أعد المحاولة.';
    } else if(msg.includes('network') || msg.includes('failed to fetch')){
      arabicMsg = '❌ مشكلة اتصال بالشبكة. تحقق من الإنترنت.';
    } else {
      arabicMsg = err.message;
    }
    showAuthError(arabicMsg);
    btn.disabled=false;
    btn.textContent = authMode === 'login' ? '🔑 تسجيل الدخول' : '✅ إنشاء حساب';
  }
}

function useOffline(){
  document.getElementById('auth-screen').style.display = 'none';
  initApp();
}

async function forgotPassword(){
  const email = document.getElementById('auth-email').value.trim();
  if(!email){
    showAuthError('أدخل بريدك الإلكتروني أولاً ثم اضغط "نسيت كلمة المرور"');
    return;
  }
  try {
    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname
    });
    if(error) throw error;
    const errEl = document.getElementById('auth-error');
    errEl.style.background = '#dcfce7';
    errEl.style.color = '#166534';
    errEl.style.borderColor = '#bbf7d0';
    errEl.textContent = '✅ أرسلنا رابط إعادة التعيين إلى بريدك الإلكتروني';
    errEl.style.display = 'block';
  } catch(err) {
    showAuthError('فشل إرسال الرابط: ' + err.message);
  }
}

// Wipe app data from localStorage (used on logout / account switch)
function wipeLocalAppData(){
  const keysToRemove = [];
  for(let k in localStorage){
    if(!localStorage.hasOwnProperty(k)) continue;
    if(k === 'home_exp' || k === 'category_limits' || k === 'home_cats' ||
       k === 'bills' || k === 'local_updated' || k === 'local_synced' ||
       k.startsWith('txn_') || k.startsWith('note_') ||
       k.startsWith('recurring_dismiss_')){
      keysToRemove.push(k);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
  CATS = DEFAULT_CATS.map(c=>({...c}));
  currentLimits = {...DEFAULT_LIMITS};
}

async function onLogin(){
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('cloud-bar').style.display = 'block';
  document.getElementById('cb-email-text').textContent = currentUser.email;
  document.getElementById('user-avatar-letter').textContent = currentUser.email[0].toUpperCase();
  document.getElementById('cloud-settings-box').style.display = 'block';

  // Detect account switch: if local data belongs to a different user, wipe it
  // before merging so we don't leak the previous account's data into this one.
  const lastUserId = localStorage.getItem('last_user_id');
  if(lastUserId && lastUserId !== currentUser.id){
    wipeLocalAppData();
  }
  localStorage.setItem('last_user_id', currentUser.id);

  // Smart merge: compare local vs cloud before overwriting
  await smartMergeOnLogin();
  subscribeToRealtime();
  initApp();
}

async function cloudLogout(){
  const ok = await customConfirm({
    icon: '👋',
    title: 'تسجيل الخروج',
    message: 'سيتم رفع بياناتك للسحابة، ثم تُمسح من هذا الجهاز لحماية خصوصيتك.',
    okText: 'خروج',
    cancelText: 'البقاء'
  });
  if(!ok) return;
  await cloudSync(true);
  if(realtimeChannel){ db.removeChannel(realtimeChannel); realtimeChannel = null; }
  await db.auth.signOut();
  currentUser = null;
  // Clear local data so the next user (or "بدون حساب" mode) doesn't see it
  wipeLocalAppData();
  localStorage.removeItem('last_user_id');
  document.getElementById('cloud-bar').style.display = 'none';
  document.getElementById('cloud-settings-box').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('auth-password').value = '';
  showToast('👋 تم تسجيل الخروج');
}

// Smart merge on login: auto-sync when possible, only ask on true conflict
async function smartMergeOnLogin(){
  try {
    const { data, error } = await db.from('expenses').select('data').eq('user_id', currentUser.id).single();
    if(error && error.code !== 'PGRST116') throw error;
    const localUpdated = getLocalUpdated();
    const localSynced  = getLocalSynced();
    const cloudData    = data?.data;
    const cloudUpdated = cloudData?.updated || null;

    if(!cloudData){
      // No cloud data yet → upload local if it exists
      if(localUpdated) await cloudSync(true);
      return;
    }
    if(!localUpdated){
      // No local data at all → download from cloud silently
      applyCloudData(cloudData);
      renderEntry(); renderDashboard(); renderSummaryContent();
      return;
    }

    const cloudIsNewer = cloudUpdated && cloudUpdated > localUpdated;
    const localIsNewer = localUpdated > (cloudUpdated || '');
    // True conflict: local was modified AFTER last sync AND cloud is also newer
    const hasUnsyncedLocal = localSynced ? localUpdated > localSynced : false;

    if(cloudIsNewer){
      if(hasUnsyncedLocal){
        // Both devices changed data → ask user
        const useCloud = await customConfirm({
          icon: '☁️',
          title: 'تعارض في البيانات',
          message:
            'يوجد تغييرات على هذا الجهاز لم تُرفع، وتوجد أيضاً بيانات أحدث على السحابة.\n\n' +
            'أيّها تريد الاحتفاظ به؟',
          okText: '☁️ السحابة',
          cancelText: '📱 هذا الجهاز',
          danger: false
        });
        if(useCloud) { applyCloudData(cloudData); renderEntry(); renderDashboard(); renderSummaryContent(); }
        else await cloudSync(true);
      } else {
        // No local changes since last sync → apply cloud automatically
        applyCloudData(cloudData);
        renderEntry(); renderDashboard(); renderSummaryContent();
        showToast('🔄 تم تحديث البيانات من السحابة');
      }
    } else if(localIsNewer){
      // Local is newer → upload silently
      await cloudSync(true);
    }
    // else: timestamps equal → nothing to do
  } catch(err) {
    console.error('smartMergeOnLogin:', err);
  }
}

// Apply cloud data to local storage without triggering another sync
function applyCloudData(d){
  _applyingCloudData = true;
  try {
    if(d.expenses) saveAll(d.expenses);
    if(d.cats){ CATS = d.cats; saveCats(); }
    if(d.limits){ currentLimits = d.limits; saveLimitsToStorage(); }
    if(d.currency){ currentCurrency = d.currency; localStorage.setItem('preferred_currency', d.currency); }
    if(d.txns) restoreAllTxns(d.txns);
    if(d.bills) saveBills(d.bills);
    if(d.notes) restoreAllNotes(d.notes);
    if(d.updated){
      localStorage.setItem('local_updated', d.updated);
      setLocalSynced(d.updated);
    }
  } finally {
    _applyingCloudData = false;
  }
}

async function cloudSync(silent = false){
  if(!currentUser){ if(!silent) showToast('⚠️ لا يوجد اتصال بالحساب'); return; }
  const badge = document.getElementById('cloud-sync-badge');
  badge.textContent = '☁️ جارٍ الرفع...';
  badge.classList.add('show');
  try {
    const now = new Date().toISOString();
    const payload = {
      user_id: currentUser.id,
      data: {
        expenses: loadAll(),
        cats: CATS,
        limits: currentLimits,
        currency: currentCurrency,
        txns: getAllTxns(),
        bills: loadBills(),
        notes: getAllNotes(),
        updated: now
      }
    };
    const { error } = await db.from('expenses').upsert(payload, { onConflict: 'user_id' });
    if(error) throw error;
    // Keep local timestamp in sync with what we just uploaded
    localStorage.setItem('local_updated', now);
    setLocalSynced(now);
    clearTimeout(syncRetryTimer);
    badge.textContent = '✅ تمت المزامنة!';
    setTimeout(()=>badge.classList.remove('show'), 2500);
    if(!silent) showToast('☁️ تم رفع البيانات للسحابة بنجاح');
  } catch(err) {
    badge.classList.remove('show');
    if(!silent) showToast('❌ فشلت المزامنة: ' + err.message);
    scheduleSyncRetry();
  }
}

async function cloudDownload(silent = false){
  if(!currentUser) return;
  const badge = document.getElementById('cloud-sync-badge');
  badge.textContent = '☁️ جارٍ التحميل...';
  badge.classList.add('show');
  try {
    const { data, error } = await db.from('expenses').select('data').eq('user_id', currentUser.id).single();
    if(error && error.code !== 'PGRST116') throw error;
    if(data && data.data){
      const localUpdated  = getLocalUpdated();
      const cloudUpdated  = data.data.updated || null;
      // Only overwrite local if cloud is newer (or local has no timestamp)
      if(!localUpdated || !cloudUpdated || cloudUpdated >= localUpdated){
        applyCloudData(data.data);
        badge.textContent = '✅ تم التحميل!';
        setTimeout(()=>badge.classList.remove('show'), 2000);
        if(!silent) showToast('⬇️ تم تحميل البيانات من السحابة');
      } else {
        badge.classList.remove('show');
        if(!silent) showToast('ℹ️ بياناتك المحلية أحدث — لم يتم التحميل');
      }
    } else {
      badge.classList.remove('show');
      if(!silent) showToast('☁️ لا توجد بيانات محفوظة على السحابة بعد');
    }
  } catch(err) {
    badge.classList.remove('show');
    if(!silent) showToast('❌ فشل التحميل: ' + err.message);
  }
}

// Supabase Realtime: instantly receive changes from other devices
function subscribeToRealtime(){
  if(!currentUser || realtimeChannel) return;
  realtimeChannel = db.channel('expenses-' + currentUser.id)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'expenses',
      filter: 'user_id=eq.' + currentUser.id
    }, (payload) => {
      const cloudUpdated = payload.new?.data?.updated;
      const localUpdated = getLocalUpdated();
      if(!localUpdated || (cloudUpdated && cloudUpdated > localUpdated)){
        applyCloudData(payload.new.data);
        renderEntry(); renderDashboard(); renderSummaryContent();
        showToast('🔄 تم تحديث البيانات من جهاز آخر');
      }
    })
    .subscribe();
}

// Helper: collect all txn data from localStorage
function getAllTxns(){
  const result = {};
  for(let k in localStorage){
    if(k.startsWith('txn_')) result[k] = localStorage[k];
  }
  return result;
}

// Helper: restore txns from cloud
function restoreAllTxns(txns){
  for(let k in txns){
    if(k.startsWith('txn_')) localStorage.setItem(k, txns[k]);
  }
}

// Auto-sync every 3 minutes when logged in
setInterval(()=>{ if(currentUser) cloudSync(true); }, 3 * 60 * 1000);

// ==================== BALANCE SUMMARY ====================
function renderBalanceSummary(){
  const container = document.getElementById('balance-summary');
  if(!container) return;

  const saved    = loadM(curY, curM);
  const income   = parseFloat(document.getElementById('inp-income')?.value) || saved.income || 0;
  const incCard  = parseFloat(document.getElementById('inp-income-card')?.value) || saved.incomeCard || 0;
  const emergency= parseFloat(document.getElementById('inp-emergency')?.value) || saved.emergency || 0;
  const incCash  = income - incCard;

  if(income === 0){ container.innerHTML = ''; return; }

  // Sum cash/card spending from all category transactions
  let cashExp = 0, cardExp = 0;
  CATS.forEach(cat => {
    loadTxns(curY, curM, cat.id).forEach(t => {
      if(t.method === 'card') cardExp += (t.amount || 0);
      else                    cashExp += (t.amount || 0);
    });
  });

  // Transfers impact
  const trs      = loadTransfers(curY, curM);
  const c2c      = trs.filter(t=>t.dir==='card2cash').reduce((s,t)=>s+t.amount,0); // card→cash
  const cash2c   = trs.filter(t=>t.dir==='cash2card').reduce((s,t)=>s+t.amount,0); // cash→card

  const cashBal  = incCash  - cashExp - emergency + c2c - cash2c;
  const cardBal  = incCard  - cardExp - c2c + cash2c;
  const lbl      = getCurrencyLabel();

  function balRow(icon, label, val){
    const neg   = val < 0;
    const color = neg ? '#dc2626' : '#15803d';
    const sign  = neg ? '−' : '';
    return `<div class="bsb-row">
      <span class="bsb-label">${icon} ${label}</span>
      <span class="bsb-val" style="color:${color}">${sign}${fmt(Math.abs(val))} ${lbl}</span>
    </div>`;
  }

  container.innerHTML = `<div class="balance-summary-box">
    <div class="bsb-title">💰 الرصيد المتبقي</div>
    ${balRow('💵','كاش', cashBal)}
    ${incCard > 0 ? balRow('💳','بطاقة', cardBal) : ''}
  </div>`;
}

// ==================== CASH/CARD TRANSFERS ====================
function trKey(y, m){ return `transfers_${mKey(y,m)}`; }
function loadTransfers(y, m){
  try{ return JSON.parse(localStorage.getItem(trKey(y,m))) || []; }catch(e){ return []; }
}
function saveTransfers(y, m, arr){
  localStorage.setItem(trKey(y,m), JSON.stringify(arr));
}

let selectedTransferDir = 'card2cash';

function setTransferDir(dir){
  selectedTransferDir = dir;
  document.getElementById('trd-card2cash').className = 'tr-dir-btn' + (dir==='card2cash'?' tr-dir-active':'');
  document.getElementById('trd-cash2card').className = 'tr-dir-btn' + (dir==='cash2card'?' tr-dir-active':'');
}

function openTransferModal(){
  selectedTransferDir = 'card2cash';
  setTransferDir('card2cash');
  document.getElementById('tr-amount').value = '';
  document.getElementById('tr-note').value = '';
  document.getElementById('tr-date').value = new Date().toISOString().slice(0,10);
  document.getElementById('transfer-modal').classList.add('active');
  setTimeout(()=>document.getElementById('tr-amount').focus(), 150);
}
function closeTransferModal(){
  document.getElementById('transfer-modal').classList.remove('active');
}

function addTransfer(){
  const amount = safeCalc(document.getElementById('tr-amount').value);
  if(!amount || amount <= 0){ showToast('⚠️ أدخل مبلغاً صحيحاً'); return; }
  const note = document.getElementById('tr-note').value.trim();
  const date = document.getElementById('tr-date').value;
  const transfers = loadTransfers(curY, curM);
  transfers.push({ id: Date.now(), dir: selectedTransferDir, amount, note, date });
  saveTransfers(curY, curM, transfers);
  closeTransferModal();
  renderTransfers();
  renderBalanceSummary();
  if(!_applyingCloudData){ setLocalUpdated(); scheduleCloudSync(); }
  const dirLabel = selectedTransferDir === 'card2cash' ? '💳→💵' : '💵→💳';
  showToast(`✅ تم تسجيل التحويل ${dirLabel} ${fmt(amount)} ${getCurrencyLabel()}`);
}

async function deleteTransfer(idx){
  const ok = await customConfirm({
    icon:'🗑️', title:'حذف التحويل', okText:'حذف', danger:true,
    message:'هل تريد حذف هذا التحويل؟'
  });
  if(!ok) return;
  const transfers = loadTransfers(curY, curM);
  transfers.splice(idx, 1);
  saveTransfers(curY, curM, transfers);
  renderTransfers();
  renderBalanceSummary();
}

function renderTransfers(){
  const container = document.getElementById('transfers-list');
  if(!container) return;
  const transfers = loadTransfers(curY, curM);
  if(!transfers.length){
    container.innerHTML = '<div class="transfers-empty">لا توجد تحويلات هذا الشهر</div>';
    return;
  }
  const lbl = getCurrencyLabel();
  container.innerHTML = [...transfers].reverse().map((tr, ri) => {
    const i = transfers.length - 1 - ri;
    const isCard2Cash = tr.dir === 'card2cash';
    const dirArrow = `<bdi dir="ltr">${isCard2Cash ? '💳 → 💵' : '💵 → 💳'}</bdi>`;
    const dirDesc  = isCard2Cash ? 'سحب كاش من البطاقة' : 'إيداع كاش في البطاقة';
    const dirClass = isCard2Cash ? 'tr-card2cash' : 'tr-cash2card';
    const dateStr  = tr.date ? formatArabicDate(tr.date) : '';
    return `<div class="transfer-item ${dirClass}">
      <div class="tr-icon">${isCard2Cash ? '🏧' : '🏦'}</div>
      <div class="tr-info">
        <div class="tr-dir-label">${dirArrow} <span class="tr-dir-desc">${dirDesc}</span></div>
        <div class="tr-meta">${tr.note ? tr.note+' · ' : ''}${dateStr}</div>
      </div>
      <div class="tr-amount">${fmt(tr.amount)} ${lbl}</div>
      <button class="txn-del-btn" onclick="deleteTransfer(${i})" title="حذف">✕</button>
    </div>`;
  }).join('');
}

// ==================== TRANSFER TAB ====================
let curYT = now.getFullYear(), curMT = now.getMonth();
let selectedTransferDirTab = 'card2cash';

function changeMonthT(d){
  curMT += d;
  if(curMT < 0){ curMT = 11; curYT--; }
  if(curMT > 11){ curMT = 0; curYT++; }
  renderTransferTab();
}

function setTransferDirTab(dir){
  selectedTransferDirTab = dir;
  document.getElementById('ttd-card2cash').className = 'tr-dir-btn' + (dir==='card2cash'?' tr-dir-active':'');
  document.getElementById('ttd-cash2card').className = 'tr-dir-btn' + (dir==='cash2card'?' tr-dir-active':'');
}

function renderTransferTab(){
  document.getElementById('month-label-t').textContent = mLabel(curYT, curMT);
  renderTransferTabBalance();
  renderTransferTabList();
  document.getElementById('tt-amount').value = '';
  document.getElementById('tt-note').value = '';
  document.getElementById('tt-date').value = new Date().toISOString().slice(0,10);
  setTransferDirTab('card2cash');
}

function renderTransferTabBalance(){
  const container = document.getElementById('transfer-tab-balance');
  if(!container) return;
  const saved    = loadM(curYT, curMT);
  const income   = saved.income   || 0;
  const incCard  = saved.incomeCard || 0;
  const emergency= saved.emergency || 0;
  const incCash  = income - incCard;
  if(income === 0){ container.innerHTML = ''; return; }
  let cashExp = 0, cardExp = 0;
  CATS.forEach(cat => {
    loadTxns(curYT, curMT, cat.id).forEach(t => {
      if(t.method === 'card') cardExp += (t.amount || 0);
      else                    cashExp += (t.amount || 0);
    });
  });
  const trs    = loadTransfers(curYT, curMT);
  const c2c    = trs.filter(t=>t.dir==='card2cash').reduce((s,t)=>s+t.amount, 0);
  const cash2c = trs.filter(t=>t.dir==='cash2card').reduce((s,t)=>s+t.amount, 0);
  const cashBal = incCash  - cashExp - emergency + c2c - cash2c;
  const cardBal = incCard  - cardExp - c2c + cash2c;
  const lbl     = getCurrencyLabel();
  function balRow(icon, label, val){
    const neg = val < 0, color = neg ? '#dc2626' : '#15803d', sign = neg ? '−' : '';
    return `<div class="bsb-row"><span class="bsb-label">${icon} ${label}</span><span class="bsb-val" style="color:${color}">${sign}${fmt(Math.abs(val))} ${lbl}</span></div>`;
  }
  container.innerHTML = `<div class="balance-summary-box" style="margin-bottom:12px">
    <div class="bsb-title">💰 الرصيد المتبقي</div>
    ${balRow('💵','كاش', cashBal)}
    ${incCard > 0 ? balRow('💳','بطاقة', cardBal) : ''}
  </div>`;
}

function renderTransferTabList(){
  const container = document.getElementById('transfer-tab-list');
  if(!container) return;
  const transfers = loadTransfers(curYT, curMT);
  if(!transfers.length){
    container.innerHTML = '<div class="transfers-empty">لا توجد تحويلات هذا الشهر</div>';
    return;
  }
  const lbl = getCurrencyLabel();
  container.innerHTML = [...transfers].reverse().map((tr, ri) => {
    const i = transfers.length - 1 - ri;
    const isCard2Cash = tr.dir === 'card2cash';
    const dirArrow = `<bdi dir="ltr">${isCard2Cash ? '💳 → 💵' : '💵 → 💳'}</bdi>`;
    const dirDesc  = isCard2Cash ? 'سحب كاش من البطاقة' : 'إيداع كاش في البطاقة';
    const dirClass = isCard2Cash ? 'tr-card2cash' : 'tr-cash2card';
    const dateStr  = tr.date ? formatArabicDate(tr.date) : '';
    return `<div class="transfer-item ${dirClass}">
      <div class="tr-icon">${isCard2Cash ? '🏧' : '🏦'}</div>
      <div class="tr-info">
        <div class="tr-dir-label">${dirArrow} <span class="tr-dir-desc">${dirDesc}</span></div>
        <div class="tr-meta">${tr.note ? tr.note+' · ' : ''}${dateStr}</div>
      </div>
      <div class="tr-amount">${fmt(tr.amount)} ${lbl}</div>
      <button class="txn-del-btn" onclick="deleteTransferTab(${i})" title="حذف">✕</button>
    </div>`;
  }).join('');
}

function addTransferTab(){
  const amount = safeCalc(document.getElementById('tt-amount').value);
  if(!amount || amount <= 0){ showToast('⚠️ أدخل مبلغاً صحيحاً'); return; }
  const note = document.getElementById('tt-note').value.trim();
  const date = document.getElementById('tt-date').value;
  const transfers = loadTransfers(curYT, curMT);
  transfers.push({ id: Date.now(), dir: selectedTransferDirTab, amount, note, date });
  saveTransfers(curYT, curMT, transfers);
  document.getElementById('tt-amount').value = '';
  document.getElementById('tt-note').value = '';
  renderTransferTabList();
  renderTransferTabBalance();
  if(!_applyingCloudData){ setLocalUpdated(); scheduleCloudSync(); }
  const dirLabel = selectedTransferDirTab === 'card2cash' ? '💳→💵' : '💵→💳';
  showToast(`✅ تم تسجيل التحويل ${dirLabel} ${fmt(amount)} ${getCurrencyLabel()}`);
}

async function deleteTransferTab(idx){
  const ok = await customConfirm({ icon:'🗑️', title:'حذف التحويل', okText:'حذف', danger:true, message:'هل تريد حذف هذا التحويل؟' });
  if(!ok) return;
  const transfers = loadTransfers(curYT, curMT);
  transfers.splice(idx, 1);
  saveTransfers(curYT, curMT, transfers);
  renderTransferTabList();
  renderTransferTabBalance();
}

// ==================== PULL TO REFRESH ====================
function initPullToRefresh(){
  const indicator = document.getElementById('ptr-indicator');
  const ptrText   = document.getElementById('ptr-text');
  if(!indicator) return;

  const THRESHOLD = 80;
  let startY = 0, pulling = false, pulled = false, active = false;

  document.addEventListener('touchstart', e => {
    if(window.scrollY > 0) return;
    if(document.querySelector('.modal.active')) return;
    startY  = e.touches[0].clientY;
    pulling = true;
    pulled  = false;
    active  = false;
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    if(!pulling) return;
    const dy = e.touches[0].clientY - startY;
    if(dy <= 2) return;

    // block native scroll & browser PTR
    e.preventDefault();
    active = true;

    const h = Math.min(dy * 0.5, 60);
    indicator.style.transition = 'none';
    indicator.style.height     = h + 'px';
    indicator.style.opacity    = Math.min(dy / THRESHOLD, 1).toFixed(2);
    pulled = dy >= THRESHOLD;
    indicator.classList.toggle('ptr-ready', pulled);
    ptrText.textContent = pulled ? 'حرر للتحديث ↑' : 'اسحب للتحديث ↓';
  }, { passive: false });

  const onRelease = () => {
    if(!pulling) return;
    pulling = false;
    if(!active){ pulled = false; return; }
    if(pulled){
      indicator.style.transition = '';
      indicator.classList.add('ptr-refreshing');
      indicator.classList.remove('ptr-ready');
      ptrText.textContent = 'جاري التحديث...';
      setTimeout(() => { doRefresh(); resetPTR(); }, 700);
    } else {
      indicator.style.transition = 'height 0.2s ease, opacity 0.2s ease';
      resetPTR();
    }
  };
  document.addEventListener('touchend',    onRelease);
  document.addEventListener('touchcancel', onRelease);

  function resetPTR(){
    indicator.style.height  = '0';
    indicator.style.opacity = '0';
    indicator.classList.remove('ptr-ready', 'ptr-refreshing');
    ptrText.textContent = 'اسحب للتحديث ↓';
  }

  function doRefresh(){
    const sec = document.querySelector('.section.active');
    const tab = sec ? sec.id.replace('tab-', '') : 'entry';
    if(tab === 'entry')     renderEntry();
    if(tab === 'dashboard') renderDashboard();
    if(tab === 'summary')   renderSummaryContent();
    if(tab === 'compare')   renderCompare();
    updateHeaderStats();
    showToast('✓ تم التحديث');
  }
}

// ==================== CATEGORY DRAG SORT ====================
function initCatDragSort(){
  const container = document.getElementById('custom-cats-list');
  if(!container) return;

  let dragIdx = -1, overIdx = -1, dragRow = null, ghost = null, originY = 0;

  function getRows(){ return [...container.querySelectorAll('.custom-cat-row')]; }

  function idxAt(clientY){
    const rows = getRows();
    for(let i = 0; i < rows.length; i++){
      const b = rows[i].getBoundingClientRect();
      if(clientY < b.top + b.height / 2) return i;
    }
    return Math.max(0, rows.length - 1);
  }

  function clearHL(){
    getRows().forEach(r => r.classList.remove('drag-over-top','drag-over-bottom'));
  }

  container.addEventListener('touchstart', e => {
    if(!e.target.closest('.drag-handle')) return;
    e.preventDefault();
    syncCatFormState();

    dragRow = e.target.closest('.custom-cat-row');
    const rows = getRows();
    dragIdx = overIdx = rows.indexOf(dragRow);

    const rect = dragRow.getBoundingClientRect();
    originY = e.touches[0].clientY - rect.top;

    ghost = dragRow.cloneNode(true);
    ghost.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;
      width:${rect.width}px;opacity:0.93;pointer-events:none;z-index:9999;
      box-shadow:0 8px 32px rgba(0,0,0,0.22);border-radius:14px;
      background:var(--card);transform:scale(1.02)`;
    document.body.appendChild(ghost);
    dragRow.style.opacity = '0.25';

  }, { passive: false });

  container.addEventListener('touchmove', e => {
    if(dragIdx < 0 || !ghost) return;
    e.preventDefault();

    const y = e.touches[0].clientY;
    ghost.style.top = (y - originY) + 'px';

    const idx = idxAt(y);
    if(idx !== overIdx){
      clearHL();
      overIdx = idx;
      if(overIdx !== dragIdx){
        const rows = getRows();
        rows[overIdx]?.classList.add(overIdx < dragIdx ? 'drag-over-top' : 'drag-over-bottom');
      }
    }
  }, { passive: false });

  const done = () => {
    if(dragIdx < 0) return;
    clearHL();
    if(dragRow) dragRow.style.opacity = '';
    if(ghost){ ghost.remove(); ghost = null; }

    if(overIdx >= 0 && overIdx !== dragIdx){
      const [moved] = CATS.splice(dragIdx, 1);
      CATS.splice(overIdx, 0, moved);
      saveCats();
      renderEntry();
      renderCustomCatsList();
      showToast('✓ تم حفظ الترتيب');
    }

    dragIdx = overIdx = -1;
    dragRow = null;
  };

  container.addEventListener('touchend',    done);
  container.addEventListener('touchcancel', done);
}

// ==================== INIT ====================
function initApp(){
  loadCats();
  loadLimits();
  loadDarkMode();
  initPullToRefresh();
  renderEntry();
  renderDashboard();
  renderSummaryContent();
  populatePickers();
  loadCurrencyPref();
  loadCarryIncomePref();
  updateStorageInfo();
  updateTabsTop();
  checkRecurringSuggestions();
  renderCustomCatsList();
  initCatDragSort();
  showWelcomeIfNew();
  // Open the most relevant settings group by default
  document.querySelector('#tab-settings .settings-group:nth-of-type(2)')?.classList.add('open');
}

// ==================== WELCOME SCREEN ====================
function showWelcomeIfNew(){
  const all = loadAll();
  const isNew = Object.keys(all).length === 0 && !localStorage.getItem('welcome_shown');
  if(!isNew) return;
  const dash = document.getElementById('dashboard-content');
  if(!dash) return;
  const welcomeHTML = `
    <div class="empty-welcome">
      <div class="ew-icon">👋</div>
      <div class="ew-title">أهلاً بك في مصاريف البيت الذكي</div>
      <div class="ew-text">
        تتبّع مصاريفك الشهرية بسهولة، احصل على تحليلات ذكية،<br>
        وثبّت التطبيق على هاتفك للوصول السريع.
      </div>
      <button class="ew-cta" onclick="closeWelcome();switchTab('entry')">📝 ابدأ بإدخال الدخل والمصاريف</button>
    </div>`;
  // Prepend welcome to dashboard
  dash.insertAdjacentHTML('afterbegin', welcomeHTML);
}
function closeWelcome(){
  localStorage.setItem('welcome_shown', '1');
  document.querySelector('.empty-welcome')?.remove();
}

// ==================== KEYBOARD SHORTCUTS ====================
document.addEventListener('keydown', (e) => {
  // Don't intercept while typing in form inputs (except for Esc)
  const isTyping = ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName);
  if(e.key === 'Escape'){
    // Close any open modal
    document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
    document.getElementById('qa-modal')?.classList.remove('active');
    return;
  }
  if(isTyping && !e.ctrlKey) return;
  if(e.ctrlKey && e.key.toLowerCase() === 'n'){
    e.preventDefault(); openQuickAdd();
  } else if(e.ctrlKey && e.key.toLowerCase() === 's'){
    e.preventDefault(); doSaveMonth(false);
  } else if(e.ctrlKey && e.key.toLowerCase() === 'd'){
    e.preventDefault(); toggleDark();
  } else if(e.ctrlKey && e.key === 'ArrowLeft'){
    e.preventDefault();
    const active = document.querySelector('.section.active')?.id;
    if(active === 'tab-entry') tryChangeMonth(-1);
    else if(active === 'tab-dashboard') tryChangeMonthD(-1);
    else if(active === 'tab-transfer') changeMonthT(-1);
  } else if(e.ctrlKey && e.key === 'ArrowRight'){
    e.preventDefault();
    const active = document.querySelector('.section.active')?.id;
    if(active === 'tab-entry') tryChangeMonth(1);
    else if(active === 'tab-dashboard') tryChangeMonthD(1);
    else if(active === 'tab-transfer') changeMonthT(1);
  }
});

// Check for existing session on page load
(async () => {
  const { data: { session } } = await db.auth.getSession();
  if(session && session.user){
    currentUser = session.user;
    await onLogin();
  }
  // else: auth screen stays visible
})();

// Close txn modal on backdrop click
document.getElementById('txn-modal').addEventListener('click', function(e){
  if(e.target === this) closeTxnModal();
});

// Enter key on txn amount → add
document.getElementById('txn-amount').addEventListener('keydown', function(e){
  if(e.key === 'Enter') addTransaction();
});

// Enter on auth inputs
document.getElementById('auth-password').addEventListener('keydown', function(e){
  if(e.key === 'Enter') authAction();
});
document.getElementById('auth-email').addEventListener('keydown', function(e){
  if(e.key === 'Enter') document.getElementById('auth-password').focus();
});

// Update tabs sticky position on resize
window.addEventListener('resize', updateTabsTop);

// Warn before leaving page if unsaved changes
window.addEventListener('beforeunload', function(e){
  if(hasUnsavedChanges){
    e.preventDefault();
    e.returnValue = '';
  }
});

// ==================== PWA: SERVICE WORKER + INSTALL ====================
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  if(localStorage.getItem('install_dismissed') === 'true') return;
  if(window.matchMedia('(display-mode: standalone)').matches) return;
  setTimeout(()=>{
    const el = document.getElementById('install-prompt');
    if(el) el.style.display = 'block';
  }, 3000);
});
async function installPWA(){
  if(!deferredInstallPrompt) {
    showToast('💡 افتح قائمة المتصفح ← "إضافة إلى الشاشة الرئيسية"');
    return;
  }
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  document.getElementById('install-prompt').style.display = 'none';
  if(outcome === 'accepted') showToast('✅ تم تثبيت التطبيق');
}
function dismissInstallPrompt(){
  document.getElementById('install-prompt').style.display = 'none';
  localStorage.setItem('install_dismissed','true');
}
window.addEventListener('appinstalled', ()=>{
  document.getElementById('install-prompt').style.display = 'none';
  showToast('🎉 تم تثبيت التطبيق بنجاح');
});

// Service worker — registered from a Blob so we stay single-file
if('serviceWorker' in navigator){
  const swCode = `
    const CACHE = 'home-exp-v1';
    self.addEventListener('install', e => { self.skipWaiting(); });
    self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
    self.addEventListener('fetch', e => {
      const req = e.request;
      if(req.method !== 'GET') return;
      e.respondWith((async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE);
          cache.put(req, fresh.clone()).catch(()=>{});
          return fresh;
        } catch(err) {
          const cached = await caches.match(req);
          if(cached) return cached;
          if(req.mode === 'navigate'){
            const homepage = await caches.match('./');
            if(homepage) return homepage;
          }
          throw err;
        }
      })());
    });
  `;
  try {
    const blob = new Blob([swCode], {type:'application/javascript'});
    const swUrl = URL.createObjectURL(blob);
    navigator.serviceWorker.register(swUrl).catch(err => {
      console.log('SW registration skipped:', err.message);
    });
  } catch(e) {}
}
