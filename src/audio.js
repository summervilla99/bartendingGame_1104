import {rand,pick} from './util.js';

/* Procedural SFX (pour / clink / shake) and a small swing-jazz generator. No audio files. */
export const Snd=(function(){
  let ctx=null,master=null,noise=null,pourG=null,musicG=null,musicOn=false,timer=null,next=0,step=0;
  const mtof=n=>440*Math.pow(2,(n-69)/12);
  function init(){
    if(ctx){if(ctx.state==='suspended')ctx.resume();return;}
    try{
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
      ctx=new AC();master=ctx.createGain();master.gain.value=.85;master.connect(ctx.destination);
      const len=ctx.sampleRate*2;noise=ctx.createBuffer(1,len,ctx.sampleRate);
      const d=noise.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
      const src=ctx.createBufferSource();src.buffer=noise;src.loop=true;
      const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=2300;bp.Q.value=.8;
      pourG=ctx.createGain();pourG.gain.value=0;src.connect(bp);bp.connect(pourG);pourG.connect(master);src.start();
      musicG=ctx.createGain();musicG.gain.value=0;musicG.connect(master);
      const hiss=ctx.createBufferSource();hiss.buffer=noise;hiss.loop=true;
      const hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=3500;
      const hg=ctx.createGain();hg.gain.value=.006;hiss.connect(hp);hp.connect(hg);hg.connect(musicG);hiss.start();
    }catch(e){ctx=null;}
  }
  function tone(f,t,dur,type,vol,dest,lp){
    const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    if(lp){const fl=ctx.createBiquadFilter();fl.type='lowpass';fl.frequency.value=lp;o.connect(fl);fl.connect(g);}else o.connect(g);
    g.connect(dest||master);o.start(t);o.stop(t+dur+.05);
  }
  function hit(t,dur,hpf,vol,dest){
    const s=ctx.createBufferSource();s.buffer=noise;const f=ctx.createBiquadFilter();f.type='highpass';f.frequency.value=hpf;
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
    if(slot%3===0)tone(mtof(c.bass[slot/3]),t,SL*3*.95,'triangle',.24,musicG,520);
    if(slot===0||slot===5||(slot===11&&bar%2===1)){
      c.notes.forEach((n,i)=>{tone(mtof(n),t+i*.012,SL*3.2,'triangle',.05,musicG,1800);tone(mtof(n+12),t+i*.012,SL*2,'sine',.016,musicG);});
    }
    if((slot%3===0||slot===5||slot===11)&&Math.random()<.3){
      const pc=pick(c.scale),n=66+((pc-6+12)%12);tone(mtof(n),t,SL*2.6,'sine',.07,musicG,2600);
    }
    if(Math.random()<.03)hit(t,.012,1000,.08,musicG);
  }
  const HOUSE_SL=60/122/4,HB=[45,45,48,43];
  function playHouse(s,t){
    const slot=s%16,bar=Math.floor(s/16)%4;
    if(slot%4===0)kick(t);
    if(slot===4||slot===12)hit(t,.12,1800,.09,musicG);
    if(slot%4===2)hit(t,.08,7000,.06,musicG);else if(slot%2===1)hit(t,.025,8500,.022,musicG);
    if(slot%4===2)tone(mtof(HB[bar]),t,HOUSE_SL*3.4,'sawtooth',.14,musicG,420);
    if(slot===3||slot===11)[57,60,64,67].forEach(n=>tone(mtof(n),t,HOUSE_SL*2.4,'square',.018,musicG,1700));
  }
  const CLASSIC_SL=60/66/2,CP=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]];
  function playClassical(s,t){
    const slot=s%8,bar=Math.floor(s/8)%4,c=CP[bar],pat=[0,1,2,1,0,1,2,1],n=c[pat[slot]]+(slot>=4?12:0);
    tone(mtof(n),t,CLASSIC_SL*3.4,'triangle',.085,musicG,3200);tone(mtof(n+12),t,CLASSIC_SL*1.6,'sine',.018,musicG);
    if(slot===0)tone(mtof(c[0]-12),t,CLASSIC_SL*7,'sine',.16,musicG,600);
    if(slot===6&&Math.random()<.5)tone(mtof(c[2]+19),t,CLASSIC_SL*2.5,'sine',.045,musicG,2800);
  }
  const GEN={jazz:{sl:JAZZ_SL,play:playJazz},house:{sl:HOUSE_SL,play:playHouse},classical:{sl:CLASSIC_SL,play:playClassical}};
  let genre='jazz';
  function sched(){if(!ctx)return;const g=GEN[genre];while(next<ctx.currentTime+.4){g.play(step,next);next+=g.sl;step++;}}
  return {
    init,
    get on(){return musicOn;},
    get genre(){return genre;},
    setGenre(g){if(!GEN[g])return;genre=g;step=0;if(ctx)next=ctx.currentTime+.1;},
    music(on){
      init();if(!ctx)return false;musicOn=on;
      if(on){next=ctx.currentTime+.1;step=0;musicG.gain.setTargetAtTime(.55,ctx.currentTime,.4);clearInterval(timer);timer=setInterval(sched,100);}
      else{musicG.gain.setTargetAtTime(0,ctx.currentTime,.3);clearInterval(timer);}
      return true;
    },
    pour(on){if(!ctx)return;pourG.gain.setTargetAtTime(on?.1:0,ctx.currentTime,.05);},
    clink(v){if(!ctx)return;const t=ctx.currentTime;tone(2500+rand(0,500),t,.55,'sine',.1*(v||1));tone(3900+rand(0,500),t+.01,.4,'sine',.06*(v||1));},
    shake(){if(!ctx)return;const t=ctx.currentTime;hit(t,.1,1400,.12);if(Math.random()<.5)tone(3000+rand(0,800),t,.15,'sine',.03);},
    stir(){if(!ctx)return;tone(3200+rand(0,900),ctx.currentTime,.25,'sine',.04);},
    pause(){if(ctx&&ctx.state==='running')ctx.suspend();},
    resume(){if(ctx&&ctx.state==='suspended')ctx.resume();}
  };
})();
