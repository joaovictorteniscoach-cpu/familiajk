/* Casos positivos e negativos sem rede externa. */
'use strict';
const assert=require('node:assert/strict');
const {ALVOS,rodada,versao,mesmaVersao,sintaxeInline}=require('./monitorar-publicacao.cjs');
const v='2026-10-06-3',carimbo="const VERSAO='"+v+"';";
const html='<html><script>'+carimbo+'</script></html>';
function resposta(body,tipo='text/javascript',status=200){return {ok:status===200,status,headers:{get:()=>tipo},text:async()=>body};}
async function mock(url){
 const u=new URL(url);
 if(u.pathname.endsWith('.css'))return resposta('body{color:#222}','text/css');
 if(u.pathname.endsWith('.js'))return resposta(carimbo);
 return resposta(html,'text/html');
}
(async()=>{
 assert.equal(versao(carimbo),v);assert.equal(versao("const V='"+v+"';"),v);
 assert.throws(()=>mesmaVersao("const VERSAO='2026-10-06-2';",v),/versão publicada/);
 assert.throws(()=>sintaxeInline('<script>const = ;</script>'),SyntaxError);
 sintaxeInline('<script src="lib/a.js" onerror="document.write(\'<script src=x>\')"></script>');
 assert.equal((await rodada(v,mock)).every(r=>r.ok),true);
 const gestao=[ALVOS[0]];
 let rs=await rodada(v,async u=>u.includes('app-gestao.js')?resposta('indisponível','text/html',503):mock(u),gestao);
 assert.equal(rs[0].ok,false);assert.match(rs[0].erro,/HTTP 503/);
 rs=await rodada(v,async u=>u.includes('sw-gestao.js')?resposta("const VERSAO='2026-10-06-2';"):mock(u),gestao);
 assert.equal(rs[0].ok,false);assert.match(rs[0].erro,/versão publicada/);
 rs=await rodada(v,async u=>u.includes('app-gestao.js')?resposta('<html>erro</html>','text/html'):mock(u),gestao);
 assert.equal(rs[0].ok,false);assert.match(rs[0].erro,/JavaScript ausente/);
 rs=await rodada(v,async u=>u.includes('app-gestao.js')?resposta(carimbo+' const =;'):mock(u),gestao);
 assert.equal(rs[0].ok,false);assert.match(rs[0].erro,/Unexpected token/);
 rs=await rodada(v,async()=>{throw Error('rede indisponível');},gestao);
 assert.equal(rs[0].ok,false);assert.match(rs[0].erro,/rede indisponível/);
 console.log('✅ Monitoramento: sucesso, versão antiga, HTTP, tipo de arquivo, sintaxe e falha de rede');
})().catch(e=>{console.error(e);process.exitCode=1;});
