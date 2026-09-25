/* Regressões do redesign: roda em Node, sem rede e sem acessar o Firebase. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'app-aluno/index.html'), 'utf8');
let total = 0;
async function check(label, test) { await test(); total++; console.log('✅ ' + label); }
function fn(name) {
  const start = html.indexOf('function ' + name + '(');
  assert.ok(start >= 0, name + ' existe');
  return html.slice(start, html.indexOf('\n}', start) + 2);
}
const now = new Date(2026, 8, 25, 18, 0);
class Clock extends Date {
  constructor(...args) { super(...(args.length ? args : [+now])); }
  static now() { return +now; }
}
const ctx = vm.createContext({Date: Clock, EU:{diaVenc:31,status:'pendente'}, PUB:null,
  MEU:{codigo:'9999',cancelados:[]}, MESES:['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  dtOf:(d,h)=>new Date(d+'T'+h+':00'), dKey:d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'),
  fixoValeEm:(f,d)=>(!f.desde||d>=f.desde)&&(!f.ate||d<=f.ate),
  foiCancelado:(d,h)=>ctx.MEU.cancelados.some(c=>c.data===d&&c.hora===h),
  diaVencEU:()=>ctx.EU.diaVenc
});
vm.runInContext(['proximaAulaPremium','formatoDataPremium','vencimentoPremium'].map(fn).join('\n'),ctx);
function agenda(extra={}) { ctx.MEU.cancelados=[];ctx.PUB={grade:{fixos:[{id:'f1',cod:'9999',dia:5,hora:'16:00'}],eventos:[],excecoes:[],...extra}}; }
function worker(app, atRoot=false) {
  const code=fs.readFileSync(path.join(root,`app-${app}/sw-${app}.js`),'utf8');
  const listeners={},deleted=[],puts=[],matches=new Map();
  const scope=atRoot?'/':`/familiajk/app-${app}/`;
  const cacheName=code.match(/const CACHE = '([^']+)'/)[1];
  const c={addAll:async urls=>{for(const url of urls){const file=url==='./'?'index.html':url.split('?')[0];assert.ok(fs.existsSync(path.join(root,`app-${app}`,file)),file+' existe no deploy independente');}},match:async r=>matches.get(typeof r==='string'?r:r.url),put:async (r,v)=>puts.push(r.url)};
  const sandbox={URL,Response,fetch:async()=>{throw Error('offline');},caches:{open:async n=>{assert.equal(n,cacheName);return c;},keys:async()=>[cacheName,`jvtenis-${app}-v0`,'jvtenis-'+(app==='aluno'?'gestao':'aluno')+'-v999','familia-cache'],delete:async k=>deleted.push(k)},self:{location:{href:'https://test.local'+scope+`sw-${app}.js`},skipWaiting(){},clients:{claim:async()=>{},matchAll:async()=>[]},addEventListener:(n,cb)=>listeners[n]=cb}};
  vm.runInNewContext(code,sandbox);
  return {sandbox,listeners,deleted,puts,matches,scope,c,async lifecycle(name){let p;listeners[name]({waitUntil:v=>p=v});await p;},async request(url,mode='cors',method='GET'){let p;listeners.fetch({request:{url,mode,method},respondWith:v=>p=v});return p?await p:null;}};
}
(async()=>{
  await check('próxima aula recorrente: hoje já passou → semana seguinte',()=>{agenda();assert.equal(ctx.proximaAulaPremium().data,'2026-10-02');});
  await check('próxima aula: exceções e cancelamentos pessoais são respeitados',()=>{agenda({excecoes:[{fixoId:'f1',data:'2026-10-02'}]});ctx.MEU.cancelados=[{data:'2026-10-09',hora:'16:00'}];assert.equal(ctx.proximaAulaPremium().data,'2026-10-16');});
  await check('próxima aula: evento antecipado ganha do fixo e exclui outro aluno',()=>{agenda({eventos:[{cod:'9999',data:'2026-09-26',hora:'09:00'},{cod:'0000',data:'2026-09-25',hora:'19:00'}]});assert.equal(ctx.proximaAulaPremium().data,'2026-09-26');});
  await check('próxima aula: janela do fixo e datas inválidas não criam aula',()=>{agenda({fixos:[{cod:'9999',dia:5,hora:'16:00',ate:'2026-09-25'}],eventos:[{cod:'9999',data:'inválida',hora:'09:00'}]});assert.equal(ctx.proximaAulaPremium(),null);});
  await check('vencimento mantém dia 31 e ajusta somente meses curtos',()=>{ctx.EU={diaVenc:31,status:'pendente'};assert.equal(ctx.vencimentoPremium(new Date(2026,9,1)),'31 OUT 2026');assert.equal(ctx.vencimentoPremium(new Date(2026,1,1)),'28 FEV 2026');assert.equal(ctx.vencimentoPremium(new Date(2028,1,1)),'29 FEV 2028');});
  await check('mensalidade pendente não é deslocada para o próximo mês',()=>{ctx.EU={diaVenc:10,status:'pendente'};assert.equal(ctx.vencimentoPremium(now),'10 SET 2026');ctx.EU.status='pago';assert.equal(ctx.vencimentoPremium(now),'10 OUT 2026');assert.equal(ctx.vencimentoPremium(new Date(2026,11,1)),'10 JAN 2027');});
  await check('avatar separa a preferência de cada aluno no aparelho',()=>{const def=html.match(/function chaveAvatarAluno\(\)\{[^\n]+/)[0];const c=vm.createContext({MEU:{codigo:'9999'},AVATAR_ALUNO_KEY:'jvt-avatar-aluno-v1'});vm.runInContext(def,c);assert.equal(c.chaveAvatarAluno(),'jvt-avatar-aluno-v1-9999');c.MEU.codigo='0000';assert.equal(c.chaveAvatarAluno(),'jvt-avatar-aluno-v1-0000');c.MEU.codigo=null;assert.equal(c.chaveAvatarAluno(),null);});
  for(const app of ['aluno','gestao']) {
    await check(app+': shell existe tanto no Pages quanto em deploy isolado',async()=>{await worker(app).lifecycle('install');await worker(app,true).lifecycle('install');});
    await check(app+': atualização preserva caches de todos os outros apps',async()=>{const w=worker(app);await w.lifecycle('activate');assert.deepEqual(w.deleted,[`jvtenis-${app}-v0`]);});
    await check(app+': não intercepta Firebase, outra pasta ou POST',async()=>{const w=worker(app);assert.equal(await w.request('https://db.firebaseio.com/jvtenis.json'),null);assert.equal(await w.request('https://test.local/familiajk/outro/'),null);assert.equal(await w.request('https://test.local'+w.scope,'cors','POST'),null);});
    await check(app+': offline retorna shell só para navegação, nunca como JS',async()=>{const w=worker(app);w.matches.set('./','HTML');assert.equal(await w.request('https://test.local'+w.scope,'navigate'),'HTML');assert.equal((await w.request('https://test.local'+w.scope+'ausente.js')).type,'error');});
    await check(app+': falha HTTP não sobrescreve cache válido',async()=>{const w=worker(app);w.sandbox.fetch=async()=>({ok:false,status:404});assert.equal((await w.request('https://test.local'+w.scope+'index.html')).status,404);assert.equal(w.puts.length,0);w.sandbox.fetch=async()=>({ok:true,type:'basic',redirected:false,clone:()=>({})});await w.request('https://test.local'+w.scope+'index.html');assert.equal(w.puts.length,1);});
    await check(app+': instalação incompleta falha em vez de ativar sem reserva',async()=>{const w=worker(app);w.c.addAll=async()=>{throw Error('asset ausente');};await assert.rejects(w.lifecycle('install'),/asset ausente/);});
  }
  console.log(`\n${total} regressões verificadas · 0 falhas`);
})().catch(e=>{console.error(e);process.exitCode=1;});
