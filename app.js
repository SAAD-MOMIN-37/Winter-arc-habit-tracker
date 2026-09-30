const KEY="arc-habits-v1";
const defaults={
  date:null, prayers:{Fajr:false,Dhuhr:false,Asr:false,Maghrib:false,Isha:false},
  habits:{workout:false,junk:true,healthy:true},
  steps:8420, water:2.4, learning:45, productive:190, sleep:7.67,
  history:{}, goals:[
    {name:"Fitness",desc:"Improve overall fitness",p:78},
    {name:"Career",desc:"Build AI/ML skills & projects",p:85},
    {name:"Personal",desc:"Build a consistent daily routine",p:72}
  ]
};
let state=load(); let analyticsTab="week";

function load(){try{let s=JSON.parse(localStorage.getItem(KEY)); return s||structuredClone(defaults)}catch{return structuredClone(defaults)}}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function dateKey(d=new Date()){return d.toISOString().slice(0,10)}
function today(){return dateKey()}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function toast(msg){let t=document.querySelector("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1500)}
function pct(){let prayer=Object.values(state.prayers).filter(Boolean).length/5;let fixed=[state.habits.workout,state.steps>=10000,state.water>=3,state.habits.junk,state.habits.healthy,state.learning>=60,state.productive>=240,state.sleep>=7].filter(Boolean).length/8;return Math.round((prayer+fixed)/2*100)}
function persistToday(){state.history[today()]={pct:pct(),steps:state.steps,water:state.water,sleep:state.sleep};save()}

function render(){
 document.querySelector("#todayLabel").textContent=new Intl.DateTimeFormat("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"}).format(new Date());
 const h=new Date().getHours();document.querySelector("#greeting").textContent=(h<12?"Good morning":h<18?"Good afternoon":"Good evening")+" 👋";
 renderHome();renderProgress();renderGoals();renderHistory();renderSettings();
}

function renderHome(){
 const p=pct(), prayerDone=Object.values(state.prayers).filter(Boolean).length;
 const prayerNames=Object.keys(state.prayers);
 document.querySelector("#screen-home").innerHTML=`
 <div class="card progress-card"><div class="ring" style="--p:${p}%"><div class="ring-content"><strong>${p}%</strong><span>today</span></div></div>
 <div class="streak"><strong>🔥 7 days</strong><span>current streak</span><div style="height:12px"></div><span>Consistency over intensity.</span></div></div>
 <div class="section-label">DEEN</div>
 <div class="card"><div class="card-title"><h2>Namaaz</h2><span class="sub">${prayerDone}/5</span></div><div class="prayers">
 ${prayerNames.map(n=>`<button class="prayer ${state.prayers[n]?"done":""}" data-prayer="${n}"><span class="check">${state.prayers[n]?"✓":"○"}</span><small>${n}</small></button>`).join("")}</div></div>
 <div class="section-label">QUICK STATS</div>
 <div class="card"><div class="quick-grid"><div class="quick"><b>${(state.steps/1000).toFixed(1)}k</b><small>Steps</small></div><div class="quick"><b>${state.water.toFixed(1)}L</b><small>Water</small></div><div class="quick"><b>${formatHours(state.sleep)}</b><small>Sleep</small></div></div></div>
 <div class="section-label">TODAY'S HABITS</div>
 <div class="card">
 ${metric("🏋️","Workout",state.habits.workout?"Completed":"Not done",state.habits.workout?100:0,"workout")}
 ${metric("👟","Steps",`${state.steps.toLocaleString()} / 10,000`,Math.min(100,state.steps/100),"steps")}
 ${metric("💧","Water",`${state.water.toFixed(1)}L / 3L`,Math.min(100,state.water/3*100),"water")}
 ${metric("🍽️","No Junk Food",state.habits.junk?"On track":"Missed",state.habits.junk?100:0,"junk")}
 ${metric("🥗","Healthy Meals",state.habits.healthy?"On track":"Missed",state.habits.healthy?100:0,"healthy")}
 ${metric("📚","Read / Learn",`${state.learning} / 60 min`,Math.min(100,state.learning/60*100),"learning")}
 ${metric("🎯","Productive Work",`${Math.floor(state.productive/60)}h ${state.productive%60}m / 4h`,Math.min(100,state.productive/240*100),"productive")}
 </div>
 <div class="card"><div class="card-title"><h2>😴 Sleep</h2><button class="action" id="sleepEdit">Edit</button></div><div style="font-size:12px;color:var(--muted)">Last night</div><div style="font-size:24px;font-weight:800;margin:5px 0">${formatHours(state.sleep)}</div><div class="sub">Target 7–9h ✓</div></div>`;
 document.querySelectorAll("[data-prayer]").forEach(b=>b.onclick=()=>{state.prayers[b.dataset.prayer]=!state.prayers[b.dataset.prayer];persistToday();render()});
 document.querySelectorAll("[data-habit]").forEach(b=>b.onclick=()=>{state.habits[b.dataset.habit]=!state.habits[b.dataset.habit];persistToday();render()});
 document.querySelector("#sleepEdit").onclick=()=>openSleep();
}
function metric(icon,name,value,width,key){let clickable=["workout","junk","healthy"].includes(key);return `<div class="metric" ${clickable?`data-habit="${key}" style="cursor:pointer"`:""}><span class="icon">${icon}</span><div><div class="metric-name">${name}</div><div class="metric-value">${value}</div><div class="bar"><i style="--w:${width}%"></i></div></div><span class="metric-check">${width>=100?"✓":"›"}</span></div>`}
function formatHours(x){let h=Math.floor(x),m=Math.round((x-h)*60);return `${h}h ${String(m).padStart(2,"0")}m`}

function renderProgress(){
 let vals=analyticsData(analyticsTab), avg=Math.round(vals.reduce((a,b)=>a+b.p,0)/vals.length);
 document.querySelector("#screen-progress").innerHTML=`
 <div class="card-title"><h2 style="font-size:22px">Progress</h2><span class="sub">Analytics</span></div>
 <div class="tabs">${["day","week","month"].map(x=>`<button class="tab ${analyticsTab===x?"active":""}" data-tab="${x}">${x[0].toUpperCase()+x.slice(1)}</button>`).join("")}</div>
 <div class="card progress-card"><div class="ring" style="--p:${avg}%"><div class="ring-content"><strong>${avg}%</strong><span>completion</span></div></div><div class="streak"><strong>🔥 7 days</strong><span>current streak</span><div style="height:12px"></div><span>Best streak <b style="color:var(--text)">18 days</b></span></div></div>
 <div class="card"><div class="card-title"><h2>${analyticsTab==="day"?"Today's Completion":analyticsTab==="week"?"Weekly Completion":"Monthly Trend"}</h2><span class="sub">${analyticsTab}</span></div><div class="chart">${vals.map(v=>`<div class="bar-col"><i style="height:${Math.max(4,v.p)}%"></i><small>${v.label}</small></div>`).join("")}</div></div>
 <div class="stat-grid"><div class="stat"><strong>${state.steps.toLocaleString()}</strong><small>Avg. steps</small></div><div class="stat"><strong>${state.water.toFixed(1)}L</strong><small>Avg. water</small></div><div class="stat"><strong>${formatHours(state.sleep)}</strong><small>Avg. sleep</small></div><div class="stat"><strong>${state.learning}m</strong><small>Learning today</small></div></div>
 <div class="card"><div class="card-title"><h2>Habit Consistency</h2><span class="sub">30 days</span></div>
 ${["Namaaz","Workout","Steps","Water","Learning","Sleep"].map((n,i)=>{let q=[94,78,76,83,79,88][i];return `<div class="metric"><span class="icon">${["🕌","🏋️","👟","💧","📚","😴"][i]}</span><div><div class="metric-name">${n}</div><div class="bar"><i style="--w:${q}%"></i></div></div><span class="metric-value">${q}%</span></div>`}).join("")}</div>`;
 document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{analyticsTab=b.dataset.tab;renderProgress()});
}
function analyticsData(tab){
 if(tab==="day")return [{label:"Today",p:pct()}];
 if(tab==="week")return ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((l,i)=>({label:l,p:[78,90,72,100,86,80,88][i]}));
 return Array.from({length:30},(_,i)=>({label:String(i+1),p:58+Math.round(Math.sin(i/3)*8+i*.55)}));
}

function renderGoals(){
 document.querySelector("#screen-goals").innerHTML=`<div class="card-title"><h2 style="font-size:22px">Goals</h2><button class="action primary" id="addGoal">+ Add</button></div>
 <div class="card"><div class="card-title"><h2>September 2026</h2><span class="sub">Monthly</span></div>
 ${state.goals.map(g=>`<div class="goal"><div class="goal-head"><b>${esc(g.name)}</b><span>${g.p}%</span></div><p>${esc(g.desc)}</p><div class="bar"><i style="--w:${g.p}%"></i></div></div>`).join("")}</div>
 <div class="card"><div class="card-title"><h2>Goal Habits</h2></div>${["Workout","Steps","Water","Learning","Sleep"].map((x,i)=>`<div class="setting"><span>${["🏋️","👟","💧","📚","😴"][i]} ${x}</span><span class="sub">›</span></div>`).join("")}</div>`;
 document.querySelector("#addGoal").onclick=()=>openGoal();
}
function renderHistory(){
 const now=new Date(), y=now.getFullYear(),m=now.getMonth(), first=new Date(y,m,1), days=new Date(y,m+1,0).getDate(), start=(first.getDay()+6)%7;
 let cells=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(x=>`<div class="dayname">${x}</div>`).join("");
 for(let i=0;i<start;i++)cells+=`<div></div>`;
 for(let d=1;d<=days;d++){let k=dateKey(new Date(y,m,d)),has=state.history[k]?.pct>=70;cells+=`<div class="day ${has?"has":""} ${d===now.getDate()?"today":""}" data-day="${k}">${d}</div>`}
 document.querySelector("#screen-history").innerHTML=`<div class="card-title"><h2 style="font-size:22px">History</h2><span class="sub">September 2026</span></div><div class="card"><div class="calendar">${cells}</div></div><div class="card"><div class="card-title"><h2>Monthly Reflection</h2></div><div class="stat-grid"><div class="stat"><strong>84%</strong><small>Consistency</small></div><div class="stat"><strong>18d</strong><small>Best streak</small></div><div class="stat"><strong>25/30</strong><small>Days completed</small></div><div class="stat"><strong>7h 18m</strong><small>Avg. sleep</small></div></div></div>`;
 document.querySelectorAll("[data-day]").forEach(b=>b.onclick=()=>toast(`${b.dataset.day}: ${state.history[b.dataset.day]?.pct||0}% completion`));
}
function renderSettings(){
 document.querySelector("#screen-settings").innerHTML=`<div class="card-title"><h2 style="font-size:22px">Settings</h2></div>
 <div class="card"><div class="setting"><span>Manage habits</span><span>›</span></div><div class="setting"><span>Add custom habit</span><span>›</span></div><div class="setting"><span>Change targets</span><span>›</span></div><div class="setting"><span>Reorder habits</span><span>›</span></div></div>
 <div class="card"><div class="card-title"><h2>Reminders</h2></div><div class="setting"><span>🕌 Namaaz reminders</span><button class="toggle on"><i></i></button></div><div class="setting"><span>💧 Water reminders</span><button class="toggle on"><i></i></button></div><div class="setting"><span>🏋️ Workout reminder</span><button class="toggle"><i></i></button></div><div class="setting"><span>😴 Sleep reminder</span><button class="toggle on"><i></i></button></div></div>
 <div class="card"><div class="card-title"><h2>Data</h2></div><div class="setting" id="export"><span>Export data</span><span>›</span></div><div class="setting" id="reset"><span>Reset local data</span><span style="color:var(--danger)">›</span></div></div>`;
 document.querySelector("#export").onclick=()=>{let blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});let a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="arc-habit-data.json";a.click();URL.revokeObjectURL(a.href)};
 document.querySelector("#reset").onclick=()=>{if(confirm("Reset all local app data?")){localStorage.removeItem(KEY);state=load();render();toast("Data reset")}};
 document.querySelectorAll(".toggle").forEach(t=>t.onclick=()=>t.classList.toggle("on"));
}
function openSleep(){openSheet(`<h3>Update sleep</h3><p>Set last night's total sleep.</p><input id="sleepInput" class="input" type="number" min="0" max="16" step=".25" value="${state.sleep}"><br><br><button class="action primary" id="saveSleep">Save</button>`);document.querySelector("#saveSleep").onclick=()=>{state.sleep=Number(document.querySelector("#sleepInput").value)||state.sleep;persistToday();closeModal();render()}}
function openGoal(){openSheet(`<h3>Add monthly goal</h3><p>Create a goal for your dashboard.</p><input id="goalName" class="input" placeholder="Goal name"><br><br><input id="goalDesc" class="input" placeholder="Short description"><br><br><button class="action primary" id="saveGoal">Add goal</button>`);document.querySelector("#saveGoal").onclick=()=>{let n=document.querySelector("#goalName").value.trim();if(!n)return;state.goals.push({name:n,desc:document.querySelector("#goalDesc").value.trim(),p:0});save();closeModal();render()}}
function openSheet(html){document.querySelector("#modal").classList.remove("hidden");document.querySelector("#modal").innerHTML=`<div class="sheet">${html}<button class="action" id="closeModal" style="margin-top:8px;width:100%">Cancel</button></div>`;document.querySelector("#closeModal").onclick=closeModal}
function closeModal(){document.querySelector("#modal").classList.add("hidden")}
document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=()=>{document.querySelectorAll(".nav-btn").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));document.querySelector("#screen-"+b.dataset.screen).classList.add("active")});
if(!state.history[today()])persistToday(); render();

if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
