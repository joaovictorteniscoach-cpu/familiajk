/* Inicialização do App Check com SDK simulado; não emite tokens reais. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');let checks=0;
function contexto(src,key,preexistente=false,semSDK=false){
 const inicio=src.indexOf("const APPCHECK_SITE_KEY=");
 const fim=src.indexOf('/* ===== ',src.indexOf('function iniciarFirebase(){',inicio));
 assert.ok(inicio>=0&&fim>inicio);
 let codigo=src.slice(inicio,fim).replace(/const APPCHECK_SITE_KEY='[^']*';/,"const APPCHECK_SITE_KEY="+JSON.stringify(key)+";");
 const calls=[],defaultApp={name:'[DEFAULT]'},firebase={
  apps:preexistente?[defaultApp]:[],
  initializeApp(){this.apps.push(defaultApp);return defaultApp;},
  app(){return defaultApp;},
  database(){return {};},
  appCheck(app){return {activate(key,refresh){calls.push({app,key,refresh});}}}
 };
 if(semSDK)delete firebase.appCheck;
 const ctx=vm.createContext({firebase,firebaseConfig:{apiKey:'chave-ficticia'},window:{},console:{warn(){}},
  cintoDeSeguranca:x=>x,iniciarAuth:()=>{}});
 vm.runInContext(codigo,ctx);
 return {ctx,calls,defaultApp};
}
for(const file of ['app-gestao/index.html','app-aluno/index.html']){
 const src=fs.readFileSync(path.join(root,file),'utf8');
 let t=contexto(src,'');assert.equal(t.ctx.iniciarFirebase(),true);assert.equal(t.calls.length,0);checks++;
 t=contexto(src,'site-key-ficticia');assert.equal(t.ctx.iniciarFirebase(),true);
 assert.equal(t.calls.length,1);assert.equal(t.calls[0].app,t.defaultApp);assert.equal(t.calls[0].refresh,true);
 assert.equal(t.ctx.iniciarFirebase(),true);assert.equal(t.calls.length,1);checks++;
 t=contexto(src,'site-key-ficticia',true);assert.equal(t.ctx.iniciarFirebase(),true);assert.equal(t.calls.length,1);checks++;
 const outro={name:'teste'};assert.equal(t.ctx.ligarAppCheck(outro),true);
 assert.equal(t.calls.length,2);assert.equal(t.calls[1].app,outro);
 assert.equal(t.ctx.ligarAppCheck(outro),true);assert.equal(t.calls.length,2);checks++;
 t=contexto(src,'site-key-ficticia',false,true);assert.equal(t.ctx.ligarAppCheck(),false);checks++;
 t=contexto(src,'site-key-ficticia');
 t.ctx.firebase.appCheck=()=>({activate(){throw Error('configuração inválida');}});
 assert.equal(t.ctx.ligarAppCheck(t.defaultApp),false);
 t.ctx.firebase.appCheck=app=>({activate(key,refresh){t.calls.push({app,key,refresh});}});
 assert.equal(t.ctx.ligarAppCheck(t.defaultApp),true);assert.equal(t.calls.length,1);checks++;
}
const g=fs.readFileSync(path.join(root,'app-gestao/lib/app-gestao.js'),'utf8');
const k=g.indexOf("app2=firebase.apps.filter(a=>a.name==='teste')");
const trecho=g.slice(k,k+650);assert.ok(k>=0);
assert.ok(trecho.indexOf('ligarAppCheck(app2)')<trecho.indexOf('app2.auth().signInAnonymously()'));checks++;
console.log('✅ '+checks+' verificações de inicialização do App Check; console e tokens reais dependem da configuração');
