let scene='normal', tick=0, blProg=0, blReady=false;
const bHR={mean:74,std:4}, bSP={mean:97.5,std:0.8};
let evtCnt=0, fTmr=null;
const hist={hr:[],sp:[],tp:[]}, MH=40;

// Clock
setInterval(()=>{ document.getElementById('clk').textContent=new Date().toLocaleTimeString('en-IN',{hour12:false}); },1000);

function data(){
  const n=()=>(Math.random()-0.5)*2, t=tick;
  const m={
    normal:      {hr:Math.round(72+4*Math.sin(t/15)+n()),  sp:+((97.5+0.4*Math.sin(t/20)+n()*0.2).toFixed(1)), tp:+((36.6+n()*0.08).toFixed(1)), act:'Resting',       rt:+((27+n()*0.3).toFixed(1)), hm:Math.round(58+n()*2), aq:Math.round(38+n()*3)},
    borderline:  {hr:Math.round(88+n()*3),                 sp:+((94.5+n()*0.3).toFixed(1)),                    tp:+((36.8+n()*0.1).toFixed(1)),  act:'Inactive',      rt:+((29+n()*0.3).toFixed(1)), hm:Math.round(65+n()*2), aq:Math.round(63+n()*4)},
    intervention:{hr:Math.round(82+n()*3),                 sp:+((94+(tick%20)*0.08+n()*0.2).toFixed(1)),        tp:+((36.9+n()*0.1).toFixed(1)),  act:'Resting',       rt:+((29+n()*0.3).toFixed(1)), hm:Math.round(63+n()*2), aq:Math.round(58+n()*3)},
    fall:        {hr:Math.round(118+n()*5),                sp:+((95+n()*0.4).toFixed(1)),                       tp:+((36.7+n()*0.1).toFixed(1)),  act:'FALL DETECTED', rt:+((27+n()*0.3).toFixed(1)), hm:Math.round(60+n()*2), aq:Math.round(42+n()*3)},
    recovery:    {hr:Math.round(76+n()*3),                 sp:+((97.2+n()*0.2).toFixed(1)),                     tp:+((36.6+n()*0.08).toFixed(1)), act:'Resting',       rt:+((27+n()*0.3).toFixed(1)), hm:Math.round(58+n()*2), aq:Math.round(36+n()*3)}
  };
  return m[scene]||m.normal;
}

function calcScore(d){
  let s=100;
  if(d.sp<95)s-=(95-d.sp)*8;if(d.hr>100)s-=(d.hr-100)*1.5;if(d.hr<55)s-=(55-d.hr)*2;
  if(d.tp>37.5)s-=(d.tp-37.5)*15;if(d.aq>60)s-=(d.aq-60)*0.5;
  if(d.act==='Inactive')s-=8;if(d.act==='FALL DETECTED')s-=40;
  return Math.max(0,Math.min(100,Math.round(s)));
}

function z(v,b){return Math.abs((v-b.mean)/b.std);}

function bezier(arr,mn,mx,W,H){
  if(arr.length<2)return'';
  const p=arr.map((v,i)=>({x:(i/(MH-1))*W,y:H-Math.max(1,Math.min(H-1,((v-mn)/(mx-mn))*H))}));
  let d=`M ${p[0].x} ${p[0].y}`;
  for(let i=1;i<p.length;i++){const cx=(p[i-1].x+p[i].x)/2;d+=` C ${cx} ${p[i-1].y}, ${cx} ${p[i].y}, ${p[i].x} ${p[i].y}`;}
  return d;
}

function addEvt(type,msg){
  evtCnt++;
  document.getElementById('aCnt').textContent=evtCnt;
  const log=document.getElementById('aLog');
  const now=new Date().toLocaleTimeString('en-IN',{hour12:false});
  const el=document.createElement('div');el.className='aitem';
  el.innerHTML=`<div class="adot ${type}"></div><div><div class="atext">${msg}</div><div class="atime">${now}</div></div>`;
  if(log.firstChild?.textContent?.includes('No events'))log.innerHTML='';
  log.insertBefore(el,log.firstChild);
}

function setMode(m){
  ['mp','ma','mr'].forEach(id=>document.getElementById(id).classList.remove('active'));
  document.getElementById({passive:'mp',active:'ma',ritual:'mr'}[m])?.classList.add('active');
}

function setScene(s){
  scene=s;
  document.getElementById('intvB').classList.remove('show');
  document.getElementById('fOver').classList.remove('show');
  document.getElementById('fBanner').classList.remove('show');
  if(fTmr){clearTimeout(fTmr);fTmr=null;}
  if(s==='borderline')addEvt('warn','SpO₂ borderline (94%). Monitoring activity context.');
  if(s==='intervention'){document.getElementById('intvB').classList.add('show');setMode('active');addEvt('warn','Active Assistance initiated. Guided breathing started.');}
  if(s==='fall'){document.getElementById('fOver').classList.add('show');document.getElementById('fBanner').classList.add('show');addEvt('emergency','⚠ FALL DETECTED — Alert sent via WhatsApp.');fTmr=setTimeout(()=>{document.getElementById('fOver').classList.remove('show');document.getElementById('fBanner').classList.remove('show');},6000);}
  if(s==='recovery'){setMode('passive');addEvt('ok','SpO₂ recovered to 97%. Alert suppressed.');}
  if(s==='normal')setMode('passive');
}

function aiInsights(d){
  const b=document.getElementById('aiBox');
  if(d.act==='FALL DETECTED'){b.innerHTML=`<div class="insight d">Fall confirmed by MPU6050. Sudden acceleration spike, no movement after. Emergency triggered.<small>Fall Detection · High Confidence</small></div>`;return;}
  if(d.sp<95&&scene==='intervention'){b.innerHTML=`<div class="insight w">SpO₂ ${d.sp}%. Z-score: ${z(d.sp,bSP).toFixed(2)}σ from baseline. Breathing assistance active.<small>Baseline Active · Sensor Fusion</small></div>`;return;}
  if(d.sp<95){b.innerHTML=`<div class="insight w">SpO₂ ${d.sp}% borderline. Activity: ${d.act}. Z: ${z(d.sp,bSP).toFixed(2)}σ. Monitoring before alert.<small>Context-Aware Analysis</small></div>`;return;}
  if(scene==='recovery'){b.innerHTML=`<div class="insight g">SpO₂ recovered to ${d.sp}% post-intervention. False alert avoided. Closed-loop complete.<small>Closed-Loop Verified</small></div>`;return;}
  b.innerHTML=`<div class="insight g">Vitals normal. HR: ${z(d.hr,bHR).toFixed(2)}σ · SpO₂: ${z(d.sp,bSP).toFixed(2)}σ from baseline. No anomaly.<small>Z-Score Detection Active</small></div>`;
}

function actDots(act){
  const states=['Resting','Inactive','Walking','FALL DETECTED'];
  const cols={'Resting':'var(--primary)','Inactive':'var(--amber)','Walking':'var(--green)','FALL DETECTED':'var(--red)'};
  document.getElementById('actDots').innerHTML=states.map(s=>`<div class="astate" style="background:${s===act?cols[s]+'12':'var(--bg)'};border-color:${s===act?cols[s]:'var(--border)'};color:${s===act?cols[s]:'var(--muted)'};">${s}</div>`).join('');
}

function update(){
  tick++;
  if(!blReady){
    blProg=Math.min(100,blProg+1.5);
    document.getElementById('blFill').style.width=blProg+'%';
    document.getElementById('blLbl').textContent=blProg<100?`Calibrating… ${Math.round(blProg)}%`:'Baseline Ready ✓';
    if(blProg>=100){blReady=true;addEvt('info','Personalized baseline ready. AI anomaly detection active.');}
  }

  const d=data();
  hist.hr.push(d.hr);hist.sp.push(d.sp);hist.tp.push(d.tp);
  if(hist.hr.length>MH){hist.hr.shift();hist.sp.shift();hist.tp.shift();}

  // Score
  const sc=calcScore(d);
  document.getElementById('hScore').textContent=sc;
  const C=314;
  document.getElementById('rFill').style.strokeDashoffset=C-(sc/100)*C;
  const scol=sc>=80?'var(--green)':sc>=60?'var(--amber)':'var(--red)';
  document.getElementById('rFill').style.stroke=scol;
  document.getElementById('sStatus').textContent=sc>=80?'● Good Health':sc>=60?'● Needs Attention':'● Critical';
  document.getElementById('sStatus').style.color=scol;

  // HR
  const hc=d.hr>100?'var(--red)':d.hr>90?'var(--amber)':'var(--primary)';
  document.getElementById('vHr').textContent=d.hr;
  document.getElementById('vHr').style.color=hc;
  document.getElementById('cHr').className='vcard '+(d.hr>100?'danger':d.hr>90?'warn':'normal');
  const th=document.getElementById('tHr');
  th.textContent=d.hr>100?'High':d.hr>90?'Elevated':'Normal';
  th.className='vtag '+(d.hr>100?'td':d.hr>90?'tw':'tn');

  // SpO2
  const sc2=d.sp<93?'var(--red)':d.sp<95?'var(--amber)':'var(--green)';
  document.getElementById('vSp').textContent=d.sp.toFixed(1);
  document.getElementById('vSp').style.color=sc2;
  document.getElementById('cSp').className='vcard '+(d.sp<93?'danger':d.sp<95?'warn':'normal');
  const ts=document.getElementById('tSp');
  ts.textContent=d.sp<93?'Critical':d.sp<95?'Low':'Normal';
  ts.className='vtag '+(d.sp<93?'td':d.sp<95?'tw':'tn');

  // Temp
  const tc=d.tp>37.5?'var(--red)':d.tp>37.2?'var(--amber)':'#B8874A';
  document.getElementById('vTp').textContent=d.tp.toFixed(1);
  document.getElementById('vTp').style.color=tc;
  document.getElementById('cTp').className='vcard '+(d.tp>37.5?'danger':d.tp>37.2?'warn':'normal');
  const tt=document.getElementById('tTp');
  tt.textContent=d.tp>37.5?'Fever':d.tp>37.2?'Elevated':'Normal';
  tt.className='vtag '+(d.tp>37.5?'td':d.tp>37.2?'tw':'tn');

  // Activity
  const ac=d.act==='FALL DETECTED'?'var(--red)':d.act==='Inactive'?'var(--amber)':d.act==='Walking'?'var(--green)':'#7870B0';
  document.getElementById('vAct').textContent=d.act;
  document.getElementById('vAct').style.color=ac;
  actDots(d.act);

  // Env
  document.getElementById('eTemp').textContent=d.rt+'°C';
  document.getElementById('eHum').textContent=d.hm+'%';
  document.getElementById('eAir').textContent=d.aq;
  const aqS=d.aq<50?'Good':d.aq<70?'Moderate':'Poor';
  const aqC=d.aq<50?'var(--green)':d.aq<70?'var(--amber)':'var(--red)';
  document.getElementById('eAqi').textContent=aqS;
  document.getElementById('eAqi').style.color=aqC;

  // Sparklines
  document.getElementById('pHr').setAttribute('d',bezier(hist.hr,50,130,200,30));
  document.getElementById('pSp').setAttribute('d',bezier(hist.sp,88,100,200,30));
  document.getElementById('pTp').setAttribute('d',bezier(hist.tp,35.5,38.5,200,30));

  // Z chips
  if(blReady){
    const zHR=z(d.hr,bHR), zSP=z(d.sp,bSP);
    const ch=document.getElementById('cHR');
    ch.textContent=`HR: ${zHR>2?'⚠ anomaly':'normal'} (${zHR.toFixed(1)}σ)`;
    ch.className='zchip'+(zHR>2?' flagged':'');
    const cs=document.getElementById('cSP');
    cs.textContent=`SpO₂: ${zSP>2?'⚠ anomaly':'normal'} (${zSP.toFixed(1)}σ)`;
    cs.className='zchip'+(zSP>2?' flagged':'');
    const ca=document.getElementById('cAC');
    ca.textContent=`Activity: ${d.act.toLowerCase()}`;
    ca.className='zchip'+(['FALL DETECTED','Inactive'].includes(d.act)?' flagged':'');
    aiInsights(d);
  }
}

setInterval(update,1000); update();
addEvt('info','System online. Baseline calibration started.');