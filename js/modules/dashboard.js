// ==================================================================
// DASHBOARD MODULE — js/modules/dashboard.js
// Extracted from index.html — Dashboard Extraction Stage (Extraction Only)
// ==================================================================
// LOAD ORDER REQUIREMENT:
// This file depends on the shared global `data` object (declared in the
// main inline <script> block of index.html) and on 5 helper functions in
// js/ui-utils.js: pad(), parseLocalDate(), formatTime(), formatDate(),
// urgencyBadge(). It must be loaded AFTER js/ui-utils.js.
// It has NO dependency on cases.js, settings.js, or any other module file
// — no override chain, no populateCaseDropdown-style dependency (see
// DASHBOARD_AUDIT_REPORT.md Section 3, Dependency Graph).
//
// CALL-GRAPH NOTE (the one point requiring care — see
// DASHBOARD_AUDIT_REPORT.md Section 5.2): updateBadges() is called from
// 17 call sites across 9 files project-wide — the DOMContentLoaded
// bootstrap handler (inline), and every already-integrated module's
// save/delete functions: cases.js / print-utils.js's saveCase()+
// deleteCase(), clients.js, documents.js, fees.js, sessions.js, tasks.js
// (×2 each), children.js's saveChild()+deleteChild(), and settings.js's
// handleImport()/clearAllData()/loadFromSheets(). None of those call
// sites reference this file directly — they call the global function
// name `updateBadges`, which this file's declaration continues to
// provide once wired in. renderDashboard() is called from 5 sites:
// navigate() and the DOMContentLoaded handler (both inline), plus
// settings.js's handleImport()/clearAllData()/loadFromSheets()/
// refreshAll(). settings.js currently loads AFTER the inline block that
// (pre-extraction) declares these two functions; this is safe only
// because JS function declarations are hoisted and all actual *calls*
// happen at runtime (user interaction or the deferred DOMContentLoaded
// event), never at settings.js's own parse time — the same pattern
// already relied upon by every prior module extraction (Settings,
// Calendar, Children).
//
// This file is NOT yet wired into index.html (no <script> tag added) —
// integration is deferred to a later phase per instructions.
//
// Functions below are copied byte-for-byte from index.html, in their
// original source order, including the preceding "// DASHBOARD" section
// comment. No renaming, reformatting, or logic changes.
// ==================================================================

// DASHBOARD
function renderDashboard(){
  var now=new Date();now.setHours(0,0,0,0);
  var todayStr=now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate());
  var in7=new Date(now.getTime()+7*864e5);
  var active=data.cases.filter(function(c){return['نشطة','active'].includes(c['الحالة']);}).length;
  var todaySess=data.sessions.filter(function(s){return String(s['التاريخ']).slice(0,10)===todayStr;}).length;
  var weekSess=data.sessions.filter(function(s){var d=parseLocalDate(s['التاريخ']);return d&&d>=now&&d<=in7;}).length;
  var urgent=data.tasks.filter(function(t){return t['الأولوية']==='high'&&t['الحالة']!=='done';}).length;
  document.getElementById('statCases').textContent=data.cases.length;
  document.getElementById('statActive').textContent=active;
  document.getElementById('statToday').textContent=todaySess;
  document.getElementById('statWeek').textContent=weekSess;
  document.getElementById('statClients').textContent=data.clients.length;
  document.getElementById('statTasks').textContent=urgent;
  var alerts=document.getElementById('dashAlerts');alerts.innerHTML='';
  var ts=data.sessions.filter(function(s){return String(s['التاريخ']).slice(0,10)===todayStr;});
  if(ts.length)alerts.innerHTML='<div class="alert-bar">&#9888;&#65039; لديك <strong>'+ts.length+' جلسة</strong> اليوم: '+ts.map(function(s){return(s['عنوان_القضية']||'جلسة')+' الساعة '+formatTime(s['الوقت']);}).join(' | ')+'</div>';
  var up=data.sessions.filter(function(s){var d=parseLocalDate(s['التاريخ']);return d&&d>=now;}).sort(function(a,b){return parseLocalDate(a['التاريخ'])-parseLocalDate(b['التاريخ']);}).slice(0,5);
  var ds=document.getElementById('dashSessions');
  if(!up.length)ds.innerHTML='<div class="empty-state"><div class="icon">&#128197;</div><p>لا توجد جلسات قادمة</p></div>';
  else ds.innerHTML=up.map(function(s){var d=parseLocalDate(s['التاريخ']);if(!d)return'';return'<div class="session-item"><div class="session-date"><div class="day">'+d.getDate()+'</div><div class="month">'+d.toLocaleDateString('ar-EG',{month:'short'})+'</div></div><div class="session-info"><div class="session-title">'+(s['عنوان_القضية']||'جلسة')+' '+urgencyBadge(s['التاريخ'])+'</div><div class="session-meta"><span>&#128336; '+formatTime(s['الوقت'])+'</span><span>&#127963; '+(s['المحكمة']||'—')+'</span></div></div></div>';}).join('');
  var ut=data.tasks.filter(function(t){return t['الأولوية']==='high'&&t['الحالة']!=='done';}).slice(0,5);
  var dt=document.getElementById('dashTasks');
  if(!ut.length)dt.innerHTML='<div class="empty-state"><div class="icon">&#9989;</div><p>لا توجد مهام عاجلة</p></div>';
  // PHASE 13.14 PART 1 — Checkbox removed entirely (the .task-check
  // circle is no longer emitted, matching tasks.js's renderTasks()). In
  // its place, the whole card now opens the same Task Edit Dialog used
  // on the Tasks page (editTask() — no new screen/Modal/View). The index
  // passed to editTask() is resolved the same way tasks.js already does
  // it (resolveTaskIndex() against the data.tasks mirror by identifier,
  // not by array position/reference), so Dashboard always opens the
  // correct task regardless of filtering/order.
  // PHASE 13.15 PART 2 — UI Consistency: same wording/format as tasks.js
  // renderTasks() ("السبب:" never "بسبب", "الساعة" before the time never
  // "•"), plus the case number (رقم_القضية) on its own line when present.
  // Dashboard still intentionally shows ONLY reopen info, never
  // completion info (سبب/تاريخ/وقت الإنجاز) — dt only ever lists
  // non-done tasks, per the existing filter above (unchanged). Task
  // selection/filter/sort/slice(0,5) logic above is untouched.
  else dt.innerHTML=ut.map(function(t){
    var ri=resolveTaskIndex(data.tasks,t);
    var caseSpan = t['رقم_القضية']
      ? '<span class="task-due">&#9878; '+t['رقم_القضية']+'</span>'
      : '';
    var dueSpan = t['الموعد_النهائي']
      ? '<span class="task-due">'+urgencyBadge(t['الموعد_النهائي'])+' '+formatDate(t['الموعد_النهائي'])+'</span>'
      : '';
    var infoRow = (caseSpan||dueSpan)
      ? '<div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:3px;">'+caseSpan+dueSpan+'</div>'
      : '';
    var reopenLine = '';
    if (t['تاريخ_إعادة_الفتح']) {
      reopenLine =
        '<div class="task-due" style="width:100%;margin-top:2px;">أعيد فتحها:<br>'+formatDate(t['تاريخ_إعادة_الفتح'])+
        (t['وقت_إعادة_الفتح']?' الساعة '+formatTime(t['وقت_إعادة_الفتح']):'')+
        (t['سبب_إعادة_الفتح']?'<br>السبب:<br>'+t['سبب_إعادة_الفتح']:'')+
        '</div>';
    }
    return '<div class="task-item high" style="cursor:pointer;" onclick="editTask('+ri+')"><div style="flex:1;min-width:0;"><div class="task-text">'+(TASK_PRIORITY_ICONS['high']||'')+' '+t['العنوان']+'</div>'+infoRow+reopenLine+'</div></div>';
  }).join('');

  // PHASE UX-01: first-use welcome state — shown instead of the (all-zero)
  // stats/dashboard grids only when there are zero cases yet. Purely a
  // display:'' / 'none' toggle on existing elements; no data read/written,
  // no change to any calculation above this block.
  var dw=document.getElementById('dashboardWelcome');
  if(dw){
    var statsGrid=document.querySelector('#page-dashboard .stats-grid');
    var dashGrid=document.querySelector('#page-dashboard .dashboard-grid');
    var sectionTitle=document.querySelector('#page-dashboard .dash-section-title');
    if(!data.cases.length){
      dw.style.display='';
      if(statsGrid)statsGrid.style.display='none';
      if(dashGrid)dashGrid.style.display='none';
      if(sectionTitle)sectionTitle.style.display='none';
      // HOTFIX (workflow correction): a case requires at least one existing
      // client, so guide the user to add a client first when both are empty.
      var stepClient=document.getElementById('welcomeStepClient');
      var stepCase=document.getElementById('welcomeStepCase');
      if(stepClient&&stepCase){
        if(!data.clients.length){stepClient.style.display='';stepCase.style.display='none';}
        else{stepClient.style.display='none';stepCase.style.display='';}
      }
    }else{
      dw.style.display='none';
      if(statsGrid)statsGrid.style.display='';
      if(dashGrid)dashGrid.style.display='';
      if(sectionTitle)sectionTitle.style.display='';
    }
  }
}

function updateBadges(){
  function setBadge(id,val){var el=document.getElementById(id);if(el)el.textContent=val;}
  setBadge('badgeCases',data.cases.length);
  setBadge('badgeSessions',data.sessions.length);
  setBadge('badgeClients',data.clients.length);
  setBadge('badgeChildren',data.children.length);
  setBadge('badgeDocuments',data.documents.length);
  setBadge('badgeTasks',data.tasks.filter(function(t){return t['الحالة']!=='done';}).length);
  setBadge('badgeFees',data.fees.length);
}
