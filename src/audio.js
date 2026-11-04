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
  const BPM=76,SL=60/BPM/3;
  const CH=[
    {notes:[53,57,60,64],scale:[2,4,5,7,9,11,0],bass:[38,41,45,44]},
    {notes:[53,59,62,64],scale:[7,9,11,0,2,4,5],bass:[43,47,50,49]},
    {notes:[52,55,59,62],scale:[0,2,4,5,7,9,11],bass:[36,40,43,45]},
    {notes:[55,61,65,67],scale:[9,11,1,2,4,5,7],bass:[45,49,52,51]}
  ];
  function play(s,t){
    const bar=Math.floor(s/12)%4,slot=s%12,c=CH[bar];
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
  function sched(){if(!ctx)return;while(next<ctx.currentTime+.4){play(step,next);next+=SL;step++;}}
  return {
    init,
    get on(){return musicOn;},
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
