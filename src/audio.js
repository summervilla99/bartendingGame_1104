import {rand,pick} from './util.js';

/* Procedural SFX (pour / clink / shake) and a small swing-jazz generator. No audio files. */
export const Snd=(function(){
  /* Music is mixed about 15 dB louder than the raw synth level (it measured -37 dBFS) and a compressor keeps peaks in check. */
  const MUSIC_LEVEL=3.8;
  let media=null,wired=false;
  let ctx=null,master=null,meter=null,noise=null,pourG=null,pourBP=null,pourTimer=null,pourFill=0,musicG=null,musicOn=false,timer=null,next=0,step=0;
  const mtof=n=>440*Math.pow(2,(n-69)/12);
  /* iPhone Safari: Web Audio is silenced by the ringer switch unless the page's audio session is 'playback'.
     A looping silent <audio> element (started from a tap) and navigator.audioSession both move it there. */
  function silentWav(){
    const n=1600,b=new Uint8Array(44+n),v=new DataView(b.buffer),w=(o,s)=>{for(let i=0;i<s.length;i++)b[o+i]=s.charCodeAt(i);};
    w(0,'RIFF');v.setUint32(4,36+n,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,8000,true);v.setUint32(28,16000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n,true);
    let s='';for(let i=0;i<b.length;i++)s+=String.fromCharCode(b[i]);return 'data:audio/wav;base64,'+btoa(s);
  }
  function unlockMedia(){
    try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch(_){}
    if(media)return;
    try{media=new Audio();media.setAttribute('playsinline','');media.src=silentWav();media.loop=true;media.volume=1;const p=media.play();if(p&&p.catch)p.catch(()=>{media=null;});}catch(_){media=null;}
  }
  /* any tap or key brings a suspended / interrupted context back (phone calls, lock screen, tab switches) */
  function wireResume(){
    if(wired)return;wired=true;
    ['pointerdown','touchend','click','keydown'].forEach(e=>window.addEventListener(e,()=>{if(ctx&&ctx.state!=='running')ctx.resume();if(media&&media.paused)media.play().catch(()=>{});},{passive:true,capture:true}));
  }
  function init(){
    unlockMedia();wireResume();
    if(ctx){if(ctx.state!=='running')ctx.resume();return;}
    try{
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
      ctx=new AC();master=ctx.createGain();master.gain.value=.85;
      const comp=ctx.createDynamicsCompressor();comp.threshold.value=-16;comp.knee.value=12;comp.ratio.value=6;comp.attack.value=.004;comp.release.value=.25;
      master.connect(comp);comp.connect(ctx.destination);
      meter=ctx.createAnalyser();meter.fftSize=2048;comp.connect(meter);
      const len=ctx.sampleRate*2;noise=ctx.createBuffer(1,len,ctx.sampleRate);
      const d=noise.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
      /* liquid pour voice: a soft low-passed stream plus a mid 'body' band, both level-controlled by pourG; bubbles are scheduled in pour() */
      const src=ctx.createBufferSource();src.buffer=noise;src.loop=true;
      const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1500;bp.Q.value=.6;pourBP=bp;
      const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3200;lp.Q.value=.3;
      pourG=ctx.createGain();pourG.gain.value=0;src.connect(bp);bp.connect(lp);lp.connect(pourG);pourG.connect(master);src.start();
      /* the music bus has no noise bed and a gentle low-pass: boosted ~15 dB, a hiss or sizzle up top became the 'shhh' people heard */
      musicG=ctx.createGain();musicG.gain.value=0;
      const musicLP=ctx.createBiquadFilter();musicLP.type='lowpass';musicLP.frequency.value=5200;musicLP.Q.value=.5;
      musicG.connect(musicLP);musicLP.connect(master);
    }catch(e){ctx=null;}
  }
  function tone(f,t,dur,type,vol,dest,lp){
    const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    if(lp){const fl=ctx.createBiquadFilter();fl.type='lowpass';fl.frequency.value=lp;o.connect(fl);fl.connect(g);}else o.connect(g);
    g.connect(dest||master);o.start(t);o.stop(t+dur+.05);
  }
  function hit(t,dur,hpf,vol,dest){
    const s=ctx.createBufferSource();s.buffer=noise;const f=ctx.createBiquadFilter();
    if(dest===musicG){f.type='bandpass';f.frequency.value=Math.min(hpf,3600);f.Q.value=.8;vol*=.55;}          // brushes and hats in the music: a soft mid band
    else{f.type='highpass';f.frequency.value=hpf;}
    const g=ctx.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    s.connect(f);f.connect(g);g.connect(dest||master);s.start(t,Math.random()*1.5);s.stop(t+dur+.02);
  }
  /* genres: each has a step length (seconds) and a play(step,time) that schedules one step */
  function kick(t){
    const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';
    o.frequency.setValueAtTime(155,t);o.frequency.exponentialRampToValueAtTime(42,t+.13);
    g.gain.setValueAtTime(.55,t);g.gain.exponentialRampToValueAtTime(.0001,t+.22);o.connect(g);g.connect(musicG);o.start(t);o.stop(t+.25);
  }
  const CH=[
    {notes:[53,57,60,64],scale:[2,4,5,7,9,11,0],bass:[38,41,45,44]},
    {notes:[53,59,62,64],scale:[7,9,11,0,2,4,5],bass:[43,47,50,49]},
    {notes:[52,55,59,62],scale:[0,2,4,5,7,9,11],bass:[36,40,43,45]},
    {notes:[55,61,65,67],scale:[9,11,1,2,4,5,7],bass:[45,49,52,51]}
  ];
  const JAZZ_SL=60/76/3;
  function playJazz(s,t){
    const SL=JAZZ_SL,bar=Math.floor(s/12)%4,slot=s%12,c=CH[bar];
    if([0,3,5,6,9,11].indexOf(slot)>=0)hit(t,slot%3===2?.05:.11,6500,(slot===0||slot===6)?.05:.034,musicG);
    if(slot===3||slot===9)hit(t,.05,3000,.04,musicG);
    if(slot%3===0)tone(mtof(c.bass[slot/3]),t,SL*3*.95,'triangle',.17,musicG,520);
    if(slot===0||slot===5||(slot===11&&bar%2===1)){
      c.notes.forEach((n,i)=>{tone(mtof(n),t+i*.012,SL*3.2,'triangle',.075,musicG,1800);tone(mtof(n+12),t+i*.012,SL*2,'sine',.026,musicG);});
    }
    if((slot%3===0||slot===5||slot===11)&&Math.random()<.3){
      const pc=pick(c.scale),n=66+((pc-6+12)%12);tone(mtof(n),t,SL*2.6,'sine',.1,musicG,2600);
    }
  }
  const HOUSE_SL=60/122/4,HB=[45,45,48,43];
  function playHouse(s,t){
    const slot=s%16,bar=Math.floor(s/16)%4;
    if(slot%4===0)kick(t);
    if(slot===4||slot===12)hit(t,.12,1800,.09,musicG);
    if(slot%4===2)hit(t,.08,7000,.06,musicG);else if(slot%2===1)hit(t,.025,8500,.022,musicG);
    if(slot%4===2)tone(mtof(HB[bar]),t,HOUSE_SL*3.4,'sawtooth',.1,musicG,420);
    if(slot===3||slot===11)[57,60,64,67].forEach(n=>tone(mtof(n),t,HOUSE_SL*2.4,'square',.03,musicG,1700));
  }
  const CLASSIC_SL=60/66/2,CP=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]];
  function playClassical(s,t){
    const slot=s%8,bar=Math.floor(s/8)%4,c=CP[bar],pat=[0,1,2,1,0,1,2,1],n=c[pat[slot]]+(slot>=4?12:0);
    tone(mtof(n),t,CLASSIC_SL*3.4,'triangle',.085,musicG,3200);tone(mtof(n+12),t,CLASSIC_SL*1.6,'sine',.018,musicG);
    if(slot===0)tone(mtof(c[0]-12),t,CLASSIC_SL*7,'sine',.12,musicG,600);
    if(slot===6&&Math.random()<.5)tone(mtof(c[2]+19),t,CLASSIC_SL*2.5,'sine',.045,musicG,2800);
  }
  const GEN={jazz:{sl:JAZZ_SL,play:playJazz},house:{sl:HOUSE_SL,play:playHouse},classical:{sl:CLASSIC_SL,play:playClassical}};
  let genre='jazz';
  function sched(){if(!ctx)return;const g=GEN[genre];while(next<ctx.currentTime+.4){g.play(step,next);next+=g.sl;step++;}}
  return {
    init,
    get on(){return musicOn;},
    get genre(){return genre;},
    rms(){if(!meter)return 0;const d=new Float32Array(meter.fftSize);meter.getFloatTimeDomainData(d);let s=0;for(let i=0;i<d.length;i++)s+=d[i]*d[i];return Math.sqrt(s/d.length);},
    /* share of the output energy per band, for tuning: [<500 Hz, 500-2k, 2k-5k, >5k] */
    spectrum(){
      if(!meter)return null;const d=new Float32Array(meter.frequencyBinCount);meter.getFloatFrequencyData(d);
      const nyq=ctx.sampleRate/2,edges=[500,2000,5000,Infinity],e=[0,0,0,0];
      for(let i=1;i<d.length;i++){const f=i/d.length*nyq,p=Math.pow(10,d[i]/10);let b=0;while(f>=edges[b])b++;e[b]+=p;}
      const t=e.reduce((x,y)=>x+y,0)||1;return e.map(x=>+(x/t*100).toFixed(1));
    },
    debug(){return {on:musicOn,genre,state:ctx?ctx.state:'none',time:ctx?+ctx.currentTime.toFixed(2):0,next:+next.toFixed(2),step,gain:musicG?+musicG.gain.value.toFixed(3):null,master:master?+master.gain.value.toFixed(2):null,timer:!!timer};},
    setGenre(g){if(!GEN[g])return;genre=g;step=0;if(ctx)next=ctx.currentTime+.1;},
    music(on){
      init();if(!ctx)return false;musicOn=on;
      if(on){next=ctx.currentTime+.1;step=0;musicG.gain.setTargetAtTime(MUSIC_LEVEL,ctx.currentTime,.4);clearInterval(timer);timer=setInterval(sched,100);}
      else{musicG.gain.setTargetAtTime(0,ctx.currentTime,.3);clearInterval(timer);}
      return true;
    },
    /* pouring: a gentle stream whose pitch climbs as the glass fills, plus random bubble 'glugs' */
    pour(on,fill){
      if(!ctx)return;
      pourFill=fill||0;
      pourG.gain.setTargetAtTime(on?.07:0,ctx.currentTime,.06);
      if(on)pourBP.frequency.setTargetAtTime(1100+pourFill*1500,ctx.currentTime,.1);
      if(on&&!pourTimer){
        pourTimer=setInterval(()=>{
          if(!ctx)return;const t=ctx.currentTime,f=380+pourFill*700+rand(0,260);
          const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';
          o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*1.9,t+.05);
          g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+.07);
          o.connect(g);g.connect(master);o.start(t);o.stop(t+.09);
        },90);
      }else if(!on&&pourTimer){clearInterval(pourTimer);pourTimer=null;}
    },
    /* glass touching glass: a bright, bell-like cluster of inharmonic partials with a tiny tick */
    clink(v){
      if(!ctx)return;v=v||1;const t=ctx.currentTime,f=2300+rand(0,500);
      [[1,.07,.7],[2.32,.05,.45],[4.17,.03,.3],[6.4,.018,.18]].forEach(([r,vol,d])=>tone(f*r,t,d,'sine',vol*v));
      hit(t,.015,5000,.05*v);
    },
    /* ice rattling inside the shaker: a burst of short cold ticks over a dull metal knock */
    shake(){
      if(!ctx)return;const t=ctx.currentTime;
      for(let i=0;i<7;i++){const tt=t+i*rand(.012,.028);hit(tt,rand(.02,.045),rand(2400,5200),rand(.05,.1));tone(rand(3000,5200),tt,.05,'sine',.012);}
      hit(t,.09,350,.08);tone(rand(180,230),t,.12,'triangle',.05);
    },
    /* spoon swirling ice in a mixing glass: two soft glassy tinks */
    stir(){
      if(!ctx)return;const t=ctx.currentTime,f=rand(2600,3400);
      tone(f,t,.22,'sine',.035);tone(f*2.4,t+.004,.12,'sine',.015);hit(t+.03,.04,3000,.02);
    },
    /* ice cubes dropped into the tin or glass */
    ice(){
      if(!ctx)return;const t=ctx.currentTime;
      for(let i=0;i<3;i++){const tt=t+i*rand(.05,.1);hit(tt,.03,2800,.09);tone(rand(1800,2800),tt,.08,'sine',.03);}
    },
    /* garnish landing on the drink: a soft wet plop */
    plop(){
      if(!ctx)return;const t=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();
      o.type='sine';o.frequency.setValueAtTime(520,t);o.frequency.exponentialRampToValueAtTime(190,t+.09);
      g.gain.setValueAtTime(.08,t);g.gain.exponentialRampToValueAtTime(.0001,t+.12);o.connect(g);g.connect(master);o.start(t);o.stop(t+.14);
      hit(t,.03,2000,.03);
    },
    /* glass slid across the counter: a short low scrape, then a soft set-down */
    slide(){
      if(!ctx)return;const t=ctx.currentTime;
      const s2=ctx.createBufferSource();s2.buffer=noise;const f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=900;f.Q.value=1.2;
      const g=ctx.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.14,t+.08);g.gain.linearRampToValueAtTime(0,t+.32);
      s2.connect(f);f.connect(g);g.connect(master);s2.start(t,Math.random());s2.stop(t+.35);
      tone(150,t+.32,.1,'triangle',.07);
    },
    /* sleigh bells: a handful of bright, quick bell clusters */
    jingle(){
      if(!ctx)return;const t=ctx.currentTime;
      for(let i=0;i<7;i++){const tt=t+i*.075+rand(0,.02),f=3400+rand(0,900);tone(f,tt,.35,'sine',.03);tone(f*1.51,tt,.25,'sine',.02);hit(tt,.05,6000,.025);}
    },
    pause(){if(ctx&&ctx.state==='running')ctx.suspend();if(media&&!media.paused)media.pause();},
    resume(){if(ctx&&ctx.state!=='running')ctx.resume();if(media&&media.paused)media.play().catch(()=>{});}
  };
})();
