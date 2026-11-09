/* Transport = the only piece that knows how bytes reach other players.
   Interface: {kind, join(code), send(msg), on(handler)->unsubscribe, leave()}.
   Local: BroadcastChannel, works between tabs of the same browser (development / testing, no server).
   Supabase Realtime (broadcast channel per room) will be a second implementation of the same interface. */
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
export const createTransport=()=>createLocalTransport();
