const express=require('express'),http=require('http'),path=require('path'),{Server}=require('socket.io');
const {createClient}=require('@supabase/supabase-js');
const app=express(),srv=http.createServer(app),io=new Server(srv);
<<<<<<< HEAD
app.get('/',(q,r)=>r.sendFile(path.join(__dirname,'index.html')));app.get('/health',(q,r)=>r.send('ok'));
const ADMIN=process.env.ADMIN_PASS||'admin';
=======
app.get('/',(q,r)=>r.sendFile(require('path').join(__dirname,'index.html')));app.get('/health',(q,r)=>r.send('ok'));const ADMIN=process.env.ADMIN_PASS||'admin';
>>>>>>> f3e227921ce3d5628444a4e6afc94b3324f87b0e
const sb=process.env.SUPABASE_URL?createClient(process.env.SUPABASE_URL,process.env.SUPABASE_KEY):null;
let S={teams:{},items:[],sug:[],round:null,bids:{},results:{},last:null,min:0,n:1};
const seed=()=>{S.items=['React','Vue','Angular','Next.js','Tailwind CSS','Bootstrap','Node.js','Express','MongoDB','Firebase','GitHub','Figma','Vercel','Vite','TypeScript'].map(name=>({id:S.n++,name}))};
let tm;const save=()=>{clearTimeout(tm);tm=setTimeout(()=>sb&&sb.from('auction_state').upsert({id:1,data:S}).then(r=>r.error&&console.log(r.error.message)),500)};
const isOpen=()=>S.round&&Date.now()<S.round.endsAt;
const nm=id=>(S.items.find(i=>i.id===+id)||{}).name||'?';
const won=t=>Object.values(S.results).filter(r=>r.w.includes(t)).reduce((a,r)=>a+r.a,0);
const held=t=>Object.entries(S.bids[t]||{}).filter(([id])=>!S.results[id]).reduce((a,[,v])=>a+v,0);
const left=t=>S.teams[t].budget-won(t)-held(t);
const roundInfo=()=>isOpen()?{name:nm(S.round.id),endsAt:S.round.endsAt}:null;
const resList=()=>Object.entries(S.results).map(([id,r])=>({name:nm(id),w:r.w,a:r.a}));
const teamView=t=>({left:left(t),min:S.min,last:S.last,round:roundInfo(),res:resList(),
 mine:Object.entries(S.bids[t]||{}).map(([id,a])=>({name:nm(id),a,st:S.results[id]?(S.results[id].w.includes(t)?'Won':'Lost'):'Pending'}))});
const adminView=()=>{const cnt={};for(const t in S.bids)for(const id in S.bids[t])cnt[id]=(cnt[id]||0)+1;
 return {teams:S.teams,items:S.items,sug:S.sug,round:roundInfo(),cnt,res:resList(),bids:S.bids,min:S.min,last:S.last,sold:Object.keys(S.results)}};
function bc(){for(const [,s] of io.sockets.sockets){let v;
 if(s.data.admin)v=adminView();else if(s.data.team&&S.teams[s.data.team])v=teamView(S.teams[s.data.team]&&s.data.team);else continue;
 const k=JSON.stringify(v);if(k!==s.data.k){s.data.k=k;s.emit('state',{...v,now:Date.now()})}}}
/* round ends: pick the winner of this tool, winner pays, other bids on it are freed */
function finish(){if(!S.round)return;const id=S.round.id;let m=0,w=[];
 for(const t in S.bids){const a=S.bids[t][id]||0;if(a>m){m=a;w=[t]}else if(a&&a===m)w.push(t)}
 if(m){S.results[id]={w,a:m};S.last={name:nm(id),w,a:m}}else S.last={name:nm(id),none:1};
 S.round=null;save();bc()}
function arm(){const r=S.round;if(r)setTimeout(()=>{if(S.round===r)finish()},Math.max(0,r.endsAt-Date.now())+100)}
io.on('connection',sock=>{
 const A=f=>(...a)=>{if(sock.data.admin){f(...a);save();bc()}};
 sock.on('join',({name,code},cb)=>{name=String(name||'').trim();const t=S.teams[name];
  if(!t||t.code!==String(code||'').trim())return cb(false);sock.data={team:name};cb(true);bc()});
 sock.on('admin',(p,cb)=>{if(p!==ADMIN)return cb(false);sock.data={admin:true};cb(true);bc()});
 sock.on('bid',({amount},cb)=>{const t=sock.data.team;amount=Math.floor(+amount);
  if(!t)return cb('Not logged in');if(!isOpen())return cb('No round is open');
  if(!(amount>0))return cb('Enter a valid amount');
  if(amount<S.min)return cb('Minimum bid is '+S.min);
  const id=S.round.id,b=S.bids[t]=S.bids[t]||{};
  const others=won(t)+Object.entries(b).filter(([k])=>+k!==+id&&!S.results[k]).reduce((a,[,v])=>a+v,0);
  if(others+amount>S.teams[t].budget)return cb('Over budget. Max for this tool: '+(S.teams[t].budget-others));
  b[id]=amount;save();cb('Bid saved: '+amount);bc()});
 sock.on('suggest',x=>{if(sock.data.team&&S.sug.length<50){S.sug.push(String(x).trim().slice(0,40));save();bc()}});
 sock.on('addTeam',A(({name,code,budget})=>{name=String(name).trim();if(name&&code)S.teams[name]={code:String(code).trim(),budget:Math.floor(+budget)||100000}}));
 sock.on('delTeam',A(n=>{delete S.teams[n];delete S.bids[n]}));
 sock.on('addItem',A(n=>{n=String(n).trim();if(n)S.items.push({id:S.n++,name:n})}));
 sock.on('delItem',A(id=>{S.items=S.items.filter(i=>i.id!==id);for(const t in S.bids)delete S.bids[t][id];delete S.results[id]}));
 sock.on('addSug',A(i=>{const n=S.sug.splice(i,1)[0];if(n)S.items.push({id:S.n++,name:n})}));
 sock.on('delSug',A(i=>{S.sug.splice(i,1)}));
 sock.on('setMin',A(m=>{S.min=Math.max(0,Math.floor(+m)||0)}));
 sock.on('open',A(({id,secs})=>{if(isOpen()||S.results[id])return;secs=Math.max(5,+secs||60);S.round={id,endsAt:Date.now()+secs*1000};arm()}));
 sock.on('close',A(()=>{if(S.round){S.round.endsAt=Date.now();finish()}}));
 sock.on('reset',A(()=>{S.bids={};S.results={};S.round=null;S.last=null}));
});
(async()=>{let ok=false;try{if(sb){const {data}=await sb.from('auction_state').select('data').eq('id',1).maybeSingle();if(data){S=data.data;ok=true}}}catch(x){console.log(x.message)}
 if(!ok)seed();S.results=S.results||{};S.min=S.min||0;S.last=S.last||null;arm();
 srv.listen(process.env.PORT||3000,()=>console.log('up'))})();
