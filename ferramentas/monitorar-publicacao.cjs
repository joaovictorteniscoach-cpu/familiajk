/* Monitoramento somente dos arquivos públicos. Não consulta Firebase nem dados de alunos. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const GESTAO='https://joaovictorteniscoach-cpu.github.io/familiajk/app-gestao/';
const ALUNO='https://joaovictorteniscoach-cpu.github.io/familiajk/app-aluno/';
const RESERVA_ALUNO='https://appalunos.netlify.app/';
const SITE='https://informacoesjvtenis.netlify.app/';
const ALVOS=[{nome:'Gestão Pages',url:GESTAO,tipo:'gestao'},
 {nome:'Aluno Pages',url:ALUNO,tipo:'aluno'},
 {nome:'Aluno Netlify',url:RESERVA_ALUNO,tipo:'aluno'},
 {nome:'Site Netlify',url:SITE,tipo:'site'}];
function versao(txt){
 const m=txt.match(/\b(?:const|var)\s+(?:VERSAO|ESPERADA|V)\s*=\s*['"](\d{4}-\d{2}-\d{2}-\d+)['"]/);
 if(!m)throw Error('carimbo de versão ausente');return m[1];
}
function mesmaVersao(txt,esperada){const v=versao(txt);if(v!==esperada)throw Error('versão publicada '+v+'; esperada '+esperada);return v;}
function sintaxeInline(html){
 const scripts=html.matchAll(/<script\b((?:"[^"]*"|'[^']*'|[^'">])*)>([\s\S]*?)<\/script>/gi);
 for(const m of scripts){
  if(/\bsrc\s*=/.test(m[1]))continue;
  const tipo=m[1].match(/\btype\s*=\s*["']([^"']+)["']/i);
  if(tipo&&/json/i.test(tipo[1])){JSON.parse(m[2]);continue;}
  if(tipo&&!/javascript|ecmascript/.test(tipo[1]))continue;
  if(m[2].trim())new Function(m[2]);
 }
}
async function baixar(url,tipo,request=fetch){
 const r=await request(url,{signal:AbortSignal.timeout(12000),redirect:'follow'});
 if(!r.ok)throw Error('HTTP '+r.status+' em '+url);
 const mime=(r.headers.get('content-type')||'').toLowerCase();
 if(tipo==='html'&&!mime.includes('text/html'))throw Error('HTML ausente em '+url);
 if(tipo==='js'&&!/javascript|ecmascript/.test(mime))throw Error('JavaScript ausente em '+url);
 if(tipo==='css'&&!mime.includes('text/css'))throw Error('CSS ausente em '+url);
 const txt=await r.text();if(!txt.trim())throw Error('arquivo vazio em '+url);return txt;
}
async function conferir(alvo,esperada,request=fetch){
 const html=await baixar(alvo.url,'html',request);sintaxeInline(html);
 if(alvo.tipo==='site'){
  await baixar(new URL('js/config.js',alvo.url).href,'js',request).then(s=>new Function(s));
  await baixar(new URL('js/site-v2.js',alvo.url).href,'js',request).then(s=>new Function(s));
  return {nome:alvo.nome,estado:'arquivos públicos acessíveis'};
 }
 mesmaVersao(html,esperada);
 const sw=await baixar(new URL('sw-'+alvo.tipo+'.js',alvo.url).href,'js',request);
 mesmaVersao(sw,esperada);new Function(sw);
 if(alvo.tipo==='gestao'){
  const js=await baixar(new URL('lib/app-gestao.js?v='+esperada,alvo.url).href,'js',request);
  mesmaVersao(js,esperada);new Function(js);
  await baixar(new URL('lib/estilo.css?v='+esperada,alvo.url).href,'css',request);
  await baixar(new URL('lib/estilo-saibro.css?v='+esperada,alvo.url).href,'css',request);
 }else{
  await baixar(new URL('lib/visual-premium.css?v='+esperada,alvo.url).href,'css',request);
  await baixar(new URL('lib/tema-saibro.css?v='+esperada,alvo.url).href,'css',request);
 }
 return {nome:alvo.nome,estado:'versão '+esperada+' e arquivos acessíveis'};
}
async function rodada(esperada,request=fetch,alvos=ALVOS){
 const rs=await Promise.allSettled(alvos.map(a=>conferir(a,esperada,request)));
 return rs.map((r,i)=>r.status==='fulfilled'?{ok:true,...r.value}:{ok:false,nome:alvos[i].nome,erro:String(r.reason.message||r.reason)});
}
async function main(){
 const esperada=versao(fs.readFileSync(path.join(root,'app-gestao/lib/app-gestao.js'),'utf8'));
 let resultados;
 for(let n=0;n<5;n++){
  resultados=await rodada(esperada);
  if(resultados.every(r=>r.ok))break;
  if(n<4)await new Promise(r=>setTimeout(r,15000));
 }
 for(const r of resultados)console.log((r.ok?'✅ ':'❌ ')+r.nome+': '+(r.estado||r.erro));
 if(resultados.some(r=>!r.ok))process.exitCode=1;
}
module.exports={ALVOS,versao,mesmaVersao,sintaxeInline,baixar,conferir,rodada};
if(require.main===module)main().catch(e=>{console.error('❌ Monitoramento: '+e.message);process.exitCode=1;});
