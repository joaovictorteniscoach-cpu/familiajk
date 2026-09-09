/* Confere a sintaxe de todo script que o app carrega.

   Antes olhava so o codigo escrito por dentro do HTML. Quando um trecho saiu
   para arquivo separado (lib/icones.js), ele deixaria de ser conferido em
   silencio — portao que para de olhar e pior que portao nenhum. Agora segue
   tambem os <script src="..."> locais do proprio projeto. */
const fs=require('fs');
const path=require('path');

function blocosDe(f){
  const nome=path.basename(f);
  if(f.endsWith('.js')) return [[nome, fs.readFileSync(f,'utf8')]];
  const html=fs.readFileSync(f,'utf8');
  const dir=path.dirname(f);
  const saida=[];
  // 1. codigo escrito por dentro do HTML
  [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
    .forEach((m,i)=>saida.push([`${nome} · bloco ${i+1}`, m[1]]));
  // 2. arquivos locais que o HTML manda carregar (os de fora ficam de fora)
  [...html.matchAll(/<script[^>]*\bsrc="([^"]+)"/g)].forEach(m=>{
    const src=m[1];
    if(/^https?:|^\/\//.test(src)) return;          // CDN: nao e nosso
    if(/firebase-|jspdf|html2canvas/.test(src)) return; // biblioteca de terceiro
    const alvo=path.join(dir,src);
    if(!fs.existsSync(alvo)){ saida.push([`${src} (NAO ENCONTRADO)`, '???'] ); return; }
    saida.push([src, fs.readFileSync(alvo,'utf8')]);
  });
  return saida;
}

let erros=0, total=0;
process.argv.slice(2).forEach(f=>{
  blocosDe(f).forEach(([rotulo,code])=>{
    total++;
    try{ new Function(code); }
    catch(e){ erros++; console.log(`❌ ${rotulo}: ${e.message}`); }
  });
});
console.log(`${total} script(s) verificados`);
console.log(erros?`❌ ${erros} erro(s) de sintaxe`:'✅ 0 erros de sintaxe');
process.exit(erros?1:0);
