/* 3D still cuts for the tale: a fixed camera (and, where needed, posed characters) in the real bar, shown behind the dialogue with letterbox bars.
   Pure data. `at` picks an anchor: 'g0'..'g3' (that counter seat, x only), 'piano' (the bench, with its facing), or nothing (world coordinates).
   cam: {at, pos:[x,y,z], look:[x,y,z], fov}; figs: temporary characters {who, at, pos, yaw (relative), pose:'sit'|'stand', arms:'keys'|'face'|'lap', face, head:[yaw,pitch]};
   props: {type:'paper'|'stool'|'notebook', at, pos, yaw}; alone: hide the real guests while the cut is shown; tone: ''|'sepia'|'cool'. */
const C=(ko,en)=>({ko,en});
export const STILLS={
  /* night 6 */
  letter:{cap:C('도착한 편지','The letter'),alone:true,cam:{pos:[0,2.0,.1],look:[0,1.15,.55],fov:40},props:[{type:'paper',pos:[0,1.16,.55],yaw:.2}]},
  regulars:{cap:C('단골들이 모였다','The regulars gather'),cam:{pos:[0,1.95,-1.15],look:[0,1.15,1.5],fov:60}},
  offer:{cap:C('돈으로 막지 않기','Not just with money'),cam:{at:'g3',pos:[-.7,1.62,-.35],look:[.1,1.4,1.2],fov:34}},
  helmet:{cap:C('헬멧으로 대화?','Talking with a helmet?'),cam:{at:'g1',pos:[-.25,1.5,-.25],look:[-.35,1.2,.6],fov:34}},
  drawer:{cap:C('피아노 의자의 서랍','The drawer in the bench'),cam:{at:'piano',pos:[1.1,1.55,-1.5],look:[0,.95,.1],fov:44}},
  soju:{cap:C('22년 만에 열린 병','Opened after twenty-two years'),cam:{at:'g0',pos:[-.2,1.4,-.2],look:[-.42,1.22,.6],fov:32}},
  title:{cap:C('“첫 번째 안부”','“First Regards”'),cam:{at:'g2',pos:[-.35,1.55,-.35],look:[-.3,1.3,1.0],fov:34}},
  playing:{cap:C('이제 제목이 있는 곡','A piece with a title'),cam:{pos:[6.2,2.8,9.4],look:[7.05,1.7,7.7],fov:34}},
  /* night 7 */
  door:{cap:C('돌아온 사람','He is back'),alone:true,cam:{pos:[0,1.55,6.3],look:[0,1.45,11.6],fov:46},
    figs:[{who:'master',pos:[0,0,10.7],yaw:Math.PI,pose:'stand',face:'smile'}]},
  lastglass:{cap:C('마지막 한 잔','One last glass'),cam:{at:'g1',pos:[-.55,1.6,-.4],look:[0,1.35,1.1],fov:34}},
  flashback:{cap:C('3년 전 겨울밤','A winter night, three years ago'),tone:'sepia',alone:true,cam:{at:'piano',pos:[-4.6,2.0,4.6],look:[-1.5,.8,.6],fov:46},
    figs:[{who:'yunha',at:'piano',pos:[0,-.335,0],yaw:0,pose:'sit',arms:'keys',face:'sad'},
          {who:'seoyun',at:'piano',pos:[-2.6,-.405,1.5],yaw:-.5,pose:'sit',arms:'face',face:'sad',head:[0,.5]}],
    props:[{type:'stool',at:'piano',pos:[-2.6,-.04,1.5]}]},
  reunion:{cap:C('그 곡의 주인','The one it was for'),alone:true,cam:{at:'piano',pos:[-1.9,1.5,2.4],look:[-.1,1.1,.4],fov:42},
    figs:[{who:'yunha',at:'piano',pos:[0,-.335,0],yaw:0,pose:'sit',arms:'keys',face:'surprised',head:[-.7,0]},
          {who:'seoyun',at:'piano',pos:[-.85,-.04,.55],yaw:2.6,pose:'stand',face:'surprised'}]},
  end_love:{cap:C('이어짐','Together'),alone:true,cam:{at:'piano',pos:[-2.3,1.75,1.7],look:[-.05,1.12,.1],fov:48},
    figs:[{who:'yunha',at:'piano',pos:[.22,-.335,0],yaw:0,pose:'sit',arms:'keys',face:'smile',head:[-.35,0]},
          {who:'seoyun',at:'piano',pos:[-.22,-.335,0],yaw:0,pose:'sit',arms:'keys',face:'smile',head:[.35,0]}]},
  end_friend:{cap:C('좋은 친구','Dear friends'),alone:true,cam:{at:'piano',pos:[-2.0,1.5,1.9],look:[-.5,1.0,.3],fov:44},
    figs:[{who:'yunha',at:'piano',pos:[0,-.335,0],yaw:0,pose:'sit',arms:'keys',face:'smile',head:[-.5,0]},
          {who:'seoyun',at:'piano',pos:[-1.1,-.405,.45],yaw:.9,pose:'sit',arms:'lap',face:'smile'}],
    props:[{type:'stool',at:'piano',pos:[-1.1,-.04,.45]}]},
  end_apart:{cap:C('엇갈림','Apart, yet connected'),alone:true,cam:{at:'piano',pos:[-2.0,1.5,1.9],look:[-.5,1.0,.3],fov:44},
    figs:[{who:'yunha',at:'piano',pos:[0,-.335,0],yaw:0,pose:'sit',arms:'keys',face:'sad',head:[-.2,.2]}],
    props:[{type:'stool',at:'piano',pos:[-1.1,-.04,.45]},{type:'notebook',at:'piano',pos:[-1.1,.43,.45],yaw:.5}]},
  key:{cap:C('열쇠','The key'),cam:{at:'g1',pos:[-.2,1.45,-.25],look:[-.4,1.2,.6],fov:32}}
};
