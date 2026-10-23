/* Habiterr site — vanilla JS. Each visual only animates while on screen. */
(function(){
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* Reveal on scroll */
const ro=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');ro.unobserve(e.target)}}),{threshold:.15});
$$('[data-reveal]').forEach(el=>ro.observe(el));

/* Run an async loop only while element is visible */
function whenVisible(el,loop){
  let running=false,token=0;
  new IntersectionObserver(([e])=>{
    if(e.isIntersecting&&!running){running=true;const t=++token;(async()=>{while(running&&t===token){await loop(()=>running&&t===token)}})()}
    else if(!e.isIntersecting){running=false}
  },{threshold:.3}).observe(el);
}

/* Seeded random for stable contribution grids */
function rng(seed){return()=>{seed=(seed*16807)%2147483647;return seed/2147483647}}

/* Contribution grids (hero phone) */
$$('.cgrid').forEach(g=>{
  const r=rng(+g.dataset.seed||7),cols=+g.dataset.cols||12,start=+g.dataset.start||6;
  const cells=[];
  for(let c=0;c<cols;c++)for(let d=0;d<7;d++){
    const s=document.createElement('span');
    const recent=c>=start,last=c===cols-1&&d===5;
    if(last)s.className='today';
    s.dataset.o=last?'':(recent&&r()>.3?(.45+r()*.55).toFixed(2):'');
    if(c===cols-1&&d===6)s.style.visibility='hidden';
    g.appendChild(s);cells.push([c,s]);
  }
  setTimeout(()=>cells.forEach(([c,s])=>{if(s.dataset.o)setTimeout(()=>{s.style.setProperty('--o',s.dataset.o);s.classList.add('on')},reduce?0:400+c*70)}),200);
});

/* 01 — Gentle streaks */
const streak=$('#streakViz');
if(streak){
  const days=$('.days',streak),N=30,MISSES=[9,21];
  for(let i=0;i<N;i++)days.appendChild(document.createElement('span'));
  const cells=$$('span',days),num=$('[data-streak]',streak),dots=$('.dots',streak),allow=$('[data-allow]',streak),toast=$('.toast',streak);
  const renderDots=(tol,used)=>{dots.innerHTML='';for(let i=0;i<tol;i++){const d=document.createElement('i');if(i<used)d.className='used';dots.appendChild(d)}allow.textContent=`${used} of ${tol} used`};
  whenVisible(streak,async alive=>{
    cells.forEach(c=>c.className='');num.textContent='0';renderDots(1,0);
    let used=0;
    for(let i=0;i<N&&alive();i++){
      const s=i+1,tol=Math.max(1,Math.floor(s*.1));
      if(MISSES.includes(i)){used++;cells[i].className='miss';toast.classList.add('show');renderDots(tol,used);num.textContent=s;await sleep(1500);toast.classList.remove('show');await sleep(250)}
      else{cells[i].className='on pop';setTimeout(()=>cells[i].classList.remove('pop'),180);num.textContent=s;renderDots(tol,used);await sleep(reduce?0:130)}
    }
    await sleep(2600);
  });
}

/* 02 — Radar */
const radar=$('#radarViz');
if(radar){
  const H=[['menu_book','--habit-sky'],['psychology','--habit-lavender'],['pool','--habit-aqua'],['school','--habit-periwinkle'],['auto_stories','--habit-gold'],['functions','--habit-mint'],['directions_run','--habit-peach'],['sports_gymnastics','--habit-sage']];
  const SETS=[[92,86,18,72,95,14,38,8],[78,72,52,66,82,48,60,44],[86,82,76,80,88,72,78,74]];
  const n=H.length,C=200,R=128,box=$('.radar-wrap',radar),svg=$('svg',box);
  const pt=(i,v)=>{const a=-Math.PI/2+i*2*Math.PI/n,r=R*v/100;return[C+Math.cos(a)*r,C+Math.sin(a)*r]};
  let grid='';for(let k=1;k<=4;k++)grid+=`<circle class="rg" cx="${C}" cy="${C}" r="${R*k/4}"></circle>`;
  for(let i=0;i<n;i++){const[x,y]=pt(i,100);grid+=`<line class="rg" x1="${C}" y1="${C}" x2="${x}" y2="${y}"></line>`}
  svg.innerHTML=`<defs><linearGradient id="rz" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6A2FE6" stop-opacity=".34"></stop><stop offset=".5" stop-color="#3A4DFF" stop-opacity=".26"></stop><stop offset="1" stop-color="#1FB8FF" stop-opacity=".22"></stop></linearGradient><linearGradient id="rzs" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8B5CFF"></stop><stop offset=".5" stop-color="#5C7CFF"></stop><stop offset="1" stop-color="#3CC4FF"></stop></linearGradient></defs>${grid}<path id="rzone" fill="url(#rz)" stroke="url(#rzs)" style="filter:drop-shadow(0 0 6px rgba(58,77,255,.5))" stroke-width="2.5" stroke-linejoin="round"></path>${H.map((h,i)=>`<circle class="rdot" r="6.5" fill="var(${h[1]})" style="color:var(${h[1]})"></circle>`).join('')}<circle cx="${C}" cy="${C}" r="5" fill="#fff" style="filter:drop-shadow(0 0 6px #29C8FF)"></circle>`;
  const labels=H.map((h,i)=>{const[x,y]=pt(i,134);const d=document.createElement('div');d.className='radar-lbl';d.style.cssText=`left:${x/4}%;top:${y/4}%;--c:var(${h[1]})`;d.innerHTML=`<span class="ms">${h[0]}</span><span>0</span>`;box.appendChild(d);return d.lastChild});
  const path=$('#rzone',svg),dots=$$('.rdot',svg);
  const mC=$('[data-cons]',radar),mB=$('[data-bal]',radar);
  const smooth=p=>{let d=`M${p[0]}`;const t=.16;for(let i=0;i<n;i++){const a=p[(i-1+n)%n],b=p[i],c=p[(i+1)%n],e=p[(i+2)%n];d+=`C${b[0]+(c[0]-a[0])*t},${b[1]+(c[1]-a[1])*t} ${c[0]-(e[0]-b[0])*t},${c[1]-(e[1]-b[1])*t} ${c[0]},${c[1]}`}return d+'Z'};
  const tone=v=>v>=80?'var(--metric-excellent)':v>=50?'var(--metric-good)':'var(--metric-needs-work)';
  const setMetric=(el,v)=>{const p=el.closest('.mpanel');p.style.setProperty('--mc',tone(v));el.textContent=Math.round(v)+'%';$('.fg',p).style.strokeDashoffset=113*(1-v/100)};
  const draw=v=>{const p=v.map((x,i)=>pt(i,Math.max(x,6)));path.setAttribute('d',smooth(p));p.forEach(([x,y],i)=>{dots[i].setAttribute('cx',x);dots[i].setAttribute('cy',y)});labels.forEach((l,i)=>l.textContent=Math.round(v[i]))};
  const metrics=v=>{const m=v.reduce((a,b)=>a+b)/n,sd=Math.sqrt(v.reduce((a,b)=>a+(b-m)**2,0)/n);setMetric(mC,m);setMetric(mB,Math.max(0,100*(1-sd/50)))};
  let cur=SETS[0].slice();draw(cur);metrics(cur);
  let idx=0;
  whenVisible(radar,async alive=>{
    await sleep(1800);if(!alive())return;
    const from=cur.slice(),to=SETS[idx=(idx+1)%SETS.length],t0=performance.now(),D=reduce?1:1400;
    metrics(to);
    await new Promise(res=>{const f=now=>{const k=Math.min(1,(now-t0)/D),e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;cur=from.map((a,i)=>a+(to[i]-a)*e);draw(cur);k<1?requestAnimationFrame(f):res()};requestAnimationFrame(f)});
  });
}

/* 03 — Three habit types */
const types=$('#typesViz');
if(types){
  const chk=$('.type-check',types),cnt=$('[data-count]',types),cRing=$('[data-count-ring]',types),tim=$('[data-timer]',types),tRing=$('[data-timer-ring]',types);
  const L=138.2;
  const set=(ring,k)=>ring.style.strokeDashoffset=L*(1-k);
  whenVisible(types,async alive=>{
    chk.classList.remove('on');cnt.textContent='0';set(cRing,0);tim.textContent='0:00';set(tRing,0);
    await sleep(700);if(!alive())return;
    chk.classList.add('on');await sleep(600);
    for(let i=1;i<=8&&alive();i++){cnt.textContent=i;set(cRing,i/8);await sleep(260)}
    const act=tim.closest('.type-act');act.classList.add('live');
    const t0=performance.now(),D=2200;
    await new Promise(res=>{const f=now=>{const k=Math.min(1,(now-t0)/D),e=1-Math.pow(1-k,2),m=e*25;tim.textContent=`${Math.floor(m)}:${String(Math.floor((m%1)*60)).padStart(2,'0')}`;set(tRing,e);k<1&&alive()?requestAnimationFrame(f):res()};requestAnimationFrame(f)});
    tim.textContent='25:00';act.classList.remove('live');
    await sleep(2800);
  });
}

/* 04 — Habit groups */
const groups=$('#groupViz');
if(groups){
  const DATA=[[1,1,1,0,1,1,1],[1,0,1,1,0,1,0],[1,0,1,0,0,1,1]],TODAY=5;
  const rows=$$('.wrow[data-row]',groups),pct=$$('.pct',groups),ci=$('[data-checkins]',groups),gp=$('[data-gpill]',groups),gled=$('[data-gled]',groups);
  rows.forEach(r=>{for(let d=0;d<7;d++){const c=document.createElement('span');c.className='cell'+(d===TODAY?' today':'');if(d>TODAY)c.style.opacity='.06';r.insertBefore(c,r.querySelector('.pct'))}});
  whenVisible(groups,async alive=>{
    const cells=rows.map(r=>$$('.cell',r));
    cells.flat().forEach(c=>c.classList.remove('on'));
    gled.className='led';let total=0;const per=[0,0,0];ci.textContent='0 of 18 check-ins';gp.textContent='0/3';pct.forEach(p=>p.textContent='0');
    for(let d=0;d<=TODAY&&alive();d++){
      for(let r=0;r<3;r++){if(DATA[r][d]){cells[r][d].classList.add('on');total++;per[r]++;pct[r].textContent=Math.round(per[r]/(d+1)*100);ci.textContent=`${total} of 18 check-ins`;const td=cells.filter(c=>c[TODAY].classList.contains('on')).length;gp.textContent=`${td}/3`;gled.className='led'+(td===3?' all':td?' some':'');await sleep(reduce?0:160)}}
      await sleep(reduce?0:200);
    }
    await sleep(3000);
  });
}
/* CTA LED strip: light left to right, then settle into a real week */
const strip=$('[data-ledstrip]');
if(strip){
  const leds=$$('.led',strip),WEEK=['on','on','on','','on','on','today'];
  whenVisible(strip,async alive=>{
    leds.forEach(l=>l.className='led');await sleep(400);
    for(const l of leds){if(!alive())return;l.className='led on';await sleep(reduce?0:60)}
    await sleep(220);leds.forEach((l,i)=>l.className='led '+WEEK[i]);
    await sleep(6000);
  });
}
})();
