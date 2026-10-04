/* Regressões da calculadora. Dados fictícios; nenhuma chamada à nuvem. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const cfg=fs.readFileSync(path.join(root,'site/js/config.js'),'utf8');
const src=fs.readFileSync(path.join(root,'site/js/site-v2.js'),'utf8');
function fixture(){
  const ids=['calc-modalidade','calc-pessoas','calc-aulas','calc-pessoas-wrap','calc-resultado','calc-detalhe','calc-total','calc-unidade','calc-whatsapp'];
  const e=Object.fromEntries(ids.map(id=>[id,{
    value:'',hidden:false,textContent:'',href:'#',listeners:{},
    addEventListener(n,cb){this.listeners[n]=cb;},
    removeAttribute(n){delete this[n];}
  }]));
  e['calc-modalidade'].value='particular';e['calc-pessoas'].value='2';e['calc-aulas'].value='4';
  const c=vm.createContext({window:{},document:{getElementById:id=>e[id],querySelectorAll:()=>[],querySelector:()=>null}});
  vm.runInContext(cfg,c);vm.runInContext(src,c);
  return e;
}
const e=fixture(),input=e['calc-aulas'],result=e['calc-resultado'],quote=e['calc-whatsapp'];
function set(value,event='input'){input.value=value;input.listeners[event]();}
assert.match(e['calc-total'].textContent,/640/);
set('');assert.equal(input.value,'');assert.equal(result.hidden,true);assert.equal(quote.href,undefined);
set('1');assert.equal(input.value,'1');assert.equal(result.hidden,true);
set('10');assert.equal(input.value,'10');assert.equal(result.hidden,false);assert.match(e['calc-total'].textContent,/1\.600/);
set('2','blur');assert.equal(Number(input.value),3);assert.match(e['calc-total'].textContent,/480/);
set('4.5');assert.equal(result.hidden,true);set('4.5','change');assert.equal(Number(input.value),4);
set('Infinity');assert.equal(result.hidden,true);set('Infinity','blur');assert.equal(Number(input.value),3);
set('9007199254740992');assert.equal(result.hidden,true);
set('4');e['calc-modalidade'].value='grupo';e['calc-modalidade'].listeners.change();
assert.equal(e['calc-pessoas-wrap'].hidden,false);
for(const [people,total] of [['2','380'],['3','360'],['4','340']]){
  e['calc-pessoas'].value=people;e['calc-pessoas'].listeners.change();
  assert.match(e['calc-total'].textContent,new RegExp(total));
  assert.match(e['calc-total'].textContent,/por pessoa/);
  const msg=decodeURIComponent(quote.href.split('?text=')[1]);assert.match(msg,/por pessoa/);
}
e['calc-modalidade'].value='familia';e['calc-modalidade'].listeners.change();
assert.match(e['calc-total'].textContent,/800/);assert.doesNotMatch(e['calc-total'].textContent,/por pessoa/);
e['calc-pessoas'].value='3';e['calc-pessoas'].listeners.change();assert.match(e['calc-total'].textContent,/720/);
e['calc-modalidade'].value='particular';e['calc-modalidade'].listeners.change();assert.equal(e['calc-pessoas-wrap'].hidden,true);
vm.runInNewContext(cfg+'\n'+src,{window:{},document:{getElementById:()=>null,querySelectorAll:()=>[]}});
console.log('✅ Calculadora: edição livre, mínimo ao concluir, entradas inválidas e valores por pessoa');
