const fs=require('fs');
const f=process.argv[2];
const html=fs.readFileSync(f,'utf8');
const blocos=[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
let erros=0;
blocos.forEach((code,i)=>{
  try{new Function(code);}
  catch(e){erros++;console.log(`❌ bloco ${i+1}: ${e.message}`);}
});
console.log(`${f}: ${blocos.length} bloco(s) de script inline verificados\n`);
console.log(erros?`❌ ${erros} erro(s) de sintaxe`:'✅ 0 erros de sintaxe');
process.exit(erros?1:0);
