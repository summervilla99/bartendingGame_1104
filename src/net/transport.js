/* Transport = the only piece that knows how bytes reach other players.
   Interface: {kind, join(code), send(msg), on(handler)->unsubscribe, leave(), intervals?, status?, onStatus?(h)}.
   - Local: BroadcastChannel, works between tabs of the same browser (development / offline, no server).
   - Supabase: Realtime broadcast channel per room, works across devices. Needs VITE_SUPABASE_URL + VITE_SUPABASE_KEY
     (the publishable/anon key only; never a secret key). */
export function createLocalTransport(){
  let ch=null;
  const handlers=new Set();
  return {
    kind:'local',
    join(code){
      this.leave();
      ch=new BroadcastChannel('courte-room-'+code);
      ch.onmessage=e=>handlers.forEach(h=>h(e.data));
    },
    send(msg){if(ch)ch.postMessage(msg);},
    on(h){handlers.add(h);return()=>handlers.delete(h);},
    leave(){if(ch){ch.close();ch=null;}}
  };
}

export function createSupabaseTransport({url,key}){
  let client=null,channel=null,gen=0,ready=false,status='idle';
  const queue=[],handlers=new Set(),statusHandlers=new Set();
  const setStatus=s=>{status=s;statusHandlers.forEach(h=>h(s));};
  const wire=msg=>({type:'broadcast',event:'m',payload:msg});
  return {
    kind:'supabase',
    /* gentler send rates: Realtime counts every message against the project's quota */
    intervals:{moving:125,idle:1000},
    get status(){return status;},
    onStatus(h){statusHandlers.add(h);return()=>statusHandlers.delete(h);},
    join(code){
      this.leave();
      const my=++gen;
      setStatus('connecting');
      import('@supabase/supabase-js').then(({createClient})=>{
        if(my!==gen)return;
        client=client||createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},realtime:{params:{eventsPerSecond:30}}});
        const ch=client.channel('courte-'+code,{config:{broadcast:{self:false,ack:false}}});
        ch.on('broadcast',{event:'m'},({payload})=>handlers.forEach(h=>h(payload)));
        ch.subscribe(st=>{
          if(my!==gen)return;
          if(st==='SUBSCRIBED'){ready=true;setStatus('connected');while(queue.length)ch.send(wire(queue.shift()));}
          else if(st==='CHANNEL_ERROR'||st==='TIMED_OUT')setStatus('error');
          else if(st==='CLOSED')setStatus('closed');
        });
        channel=ch;
      }).catch(()=>{if(my===gen)setStatus('error');});
    },
    send(msg){
      if(ready&&channel){channel.send(wire(msg));return;}
      if(msg&&msg.t==='pos'){const i=queue.findIndex(q=>q.t==='pos');if(i>=0)queue.splice(i,1);}
      if(queue.length<20)queue.push(msg);
    },
    on(h){handlers.add(h);return()=>handlers.delete(h);},
    leave(){
      gen++;ready=false;queue.length=0;
      const ch=channel,c=client;channel=null;
      /* let a final "bye" flush before the channel goes away */
      if(ch&&c)setTimeout(()=>{c.removeChannel(ch);},300);
      setStatus('idle');
    }
  };
}

export function createTransport(){
  const env=(typeof import.meta!=='undefined'&&import.meta.env)||{};
  const forceLocal=typeof location!=='undefined'&&new URLSearchParams(location.search).get('net')==='local';
  if(!forceLocal&&env.VITE_SUPABASE_URL&&env.VITE_SUPABASE_KEY)return createSupabaseTransport({url:env.VITE_SUPABASE_URL,key:env.VITE_SUPABASE_KEY});
  return createLocalTransport();
}
