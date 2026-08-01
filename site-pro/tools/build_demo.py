# -*- coding: utf-8 -*-
"""Gera site-pro/demo/index.html: cópia do app de gestão, sem Firebase, dados fictícios.

Rode de novo sempre que app-gestao/index.html ganhar uma aba/funcionalidade nova
(a demo é uma cópia transformada — não puxa nada em tempo real). Uso:

    python3 site-pro/tools/build_demo.py
"""
import re, os, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SRC = os.path.join(REPO_ROOT, "app-gestao", "index.html")
DSTDIR = os.path.join(REPO_ROOT, "site-pro", "demo")
os.makedirs(DSTDIR, exist_ok=True)
h = open(SRC, encoding="utf-8").read()

# ---------- 1) Remover Firebase (CDN + config) e instalar MOCK offline ----------
demo_fb = '''<script>
/* ====== MODO DEMONSTRAÇÃO — 100% offline, sem conexão com dados reais ====== */
window.__DEMO = true;
(function(){
  var empty={exists:function(){return false;},val:function(){return null;},forEach:function(){}};
  function later(v){return new Promise(function(res){setTimeout(function(){res(v);},0);});}
  function R(){return {
    get:function(){return later(empty);},
    once:function(){return later(empty);},
    on:function(e,cb){setTimeout(function(){try{cb&&cb(empty);}catch(_){}} ,0);return cb;},
    off:function(){},
    set:function(){return later();},update:function(){return later();},remove:function(){return later();},
    push:function(){return {key:'demo-'+Date.now()+'-'+Math.floor(Math.random()*1e6)};},
    child:function(){return R();}
  };}
  function install(){window.fbDB={ref:function(){return R();}};}
  /* só fica disponível depois que a página inteira (todos os <script>) terminou de
     carregar — imita a demora real do SDK do Firebase e evita que o polling
     'esperarESubir' do app dispare load() antes dos scripts finais (histórico
     de mudanças etc.) terem sido definidos. */
  if(document.readyState==='complete'){setTimeout(install,0);}
  else{window.addEventListener('load',function(){setTimeout(install,0);});}
})();
</script>'''
pat_fb = re.compile(r'<script src="https://www\.gstatic\.com/firebasejs/10\.12\.2/firebase-app-compat\.js"></script>.*?\}\)\(0\);\s*</script>', re.S)
assert pat_fb.search(h), "bloco firebase nao encontrado"
h = pat_fb.sub(demo_fb, h, count=1)

# ---------- 2) Chave de armazenamento isolada da demo ----------
assert "const KEY='jvtenis-gestao-v1';" in h
h = h.replace("const KEY='jvtenis-gestao-v1';", "const KEY='jvtenis-DEMO-v1';")

# ---------- 3) seedAgenda com nomes FICTÍCIOS ----------
novo_seed = '''function seedAgenda(){
  const F=[];let i=0;
  const add=(dia,hora,titulo,tipo)=>F.push({id:'f'+(i++),dia,hora,titulo,tipo,alunoId:null});
  [[1,'ANA'],[2,'BRUNO'],[3,'ANA'],[4,'BRUNO'],[5,'ANA']].forEach(([d,n])=>add(d,'06:00',n,'aula'));
  [[1,'CARLA'],[2,'DIEGO'],[3,'CARLA'],[4,'DIEGO'],[5,'CARLA'],[6,'DUPLA MANHÃ']].forEach(([d,n])=>add(d,'07:00',n,'aula'));
  [[1,'EDUARDA'],[2,'FELIPE'],[4,'FELIPE'],[5,'EDUARDA'],[6,'GABRIELA']].forEach(([d,n])=>add(d,'08:00',n,'aula'));
  [[1,'HENRIQUE'],[4,'HENRIQUE']].forEach(([d,n])=>add(d,'09:00',n,'aula'));
  add(6,'09:00','ISABELA','aula');
  add(2,'10:00','LUCAS','aula');add(4,'10:00','MARINA','aula');add(5,'10:00','RAFAEL','aula');add(6,'10:00','ANA','aula');
  add(1,'11:00','RAFAEL','aula');add(5,'11:00','BRUNO','aula');add(6,'11:00','CARLA','aula');
  [1,2,3,4,5,6].forEach(d=>add(d,'12:00','ALMOÇO','bloqueio'));
  [1,2,3,4,5,6].forEach(d=>add(d,'13:00','ALMOÇO','bloqueio'));
  ['14:00','14:30','15:00','15:30'].forEach(h=>[1,2,3,4,5].forEach(d=>add(d,h,'Locação','locacao')));
  add(1,'16:00','DIEGO','aula');add(3,'16:00','EDUARDA','aula');add(4,'16:00','FELIPE','aula');add(5,'16:00','GABRIELA E PAI','aula');
  add(1,'17:00','HENRIQUE','aula');add(2,'17:00','ISABELA','aula');add(3,'17:00','LUCAS','aula');add(4,'17:00','ISABELA','aula');add(5,'17:00','MARINA','aula');
  add(1,'18:00','ANA','aula');add(2,'18:00','BRUNO','aula');add(3,'18:00','CARLA','aula');add(4,'18:00','DIEGO','aula');add(5,'18:00','EDUARDA','aula');
  ['19:00','19:30'].forEach(h=>{add(1,h,'FELIPE','aula');add(2,h,'GABRIELA','aula');add(3,h,'HENRIQUE','aula');add(4,h,'Grupo Escola','grupo');add(5,h,'LUCAS','aula');});
  ['20:00','20:30'].forEach(h=>add(2,h,'Grupo adulto','grupo'));
  return {fixos:F,eventos:[],excecoes:[]};
}'''
pat_seed = re.compile(r'function seedAgenda\(\)\{.*?return \{fixos:F,eventos:\[\],excecoes:\[\]\};\s*\}', re.S)
assert pat_seed.search(h), "seedAgenda nao encontrada"
h = pat_seed.sub(novo_seed, h, count=1)

# ---------- 4) DEMO_SEED (alunos + lancamentos ficticios) + injeção no load ----------
demo_seed_fn = '''function DEMO_SEED(){
  var mk=(typeof monthKey==='function')?monthKey():(new Date().toISOString().slice(0,7));
  var hoje=new Date().toISOString().slice(0,10);
  var A=function(id,nome,tel,tipo,plano,mens,status,cred,rep,venc,val){return {id:id,nome:nome,tel:tel,tipo:tipo,plano:plano,mensalidade:mens,creditos:cred,repos:rep,locCred:0,status:status,diaVenc:venc,codigo:String(1000+(+id.slice(1))),valorAula:val,cardLink:'',mfitLink:''};};
  var alunos=[
    A('a1','Ana Ribeiro','41999990001','Particular',8,1260,'pago',1,0,5,160),
    A('a2','Bruno Almeida','41999990002','Particular',4,640,'pendente',0,1,10,160),
    A('a3','Carla Souza','41999990003','Personal',8,1040,'pago',0,0,5,130),
    A('a4','Diego Martins','41999990004','Dupla',8,720,'parcial',0,0,10,160),
    A('a5','Eduarda Lima','41999990005','Particular',6,960,'pago',2,1,15,160),
    A('a6','Felipe Nunes','41999990006','Personal',4,520,'pendente',0,0,10,130),
    A('a7','Gabriela Rocha','41999990007','Trio',8,680,'pago',0,0,5,160),
    A('a8','Henrique Dias','41999990008','Particular',3,480,'pago',0,0,20,160),
    A('a9','Isabela Cardoso','41999990009','Particular',4,640,'pendente',3,0,10,160),
    A('a10','Lucas Ferreira','41999990010','Particular',10,1600,'pago',0,0,5,160)
  ];
  var L=function(id,desc,valor,cat,modal){return {id:id,mes:mk,desc:desc,valor:valor,cat:cat,modal:modal||'tenis',data:hoje};};
  var lancamentos=[
    L('l1','Mensalidade · Ana Ribeiro',1260,'mensalidade','tenis'),
    L('l2','Mensalidade · Carla Souza',1040,'mensalidade','personal'),
    L('l3','Mensalidade · Eduarda Lima',960,'mensalidade','tenis'),
    L('l4','Mensalidade · Gabriela Rocha',680,'mensalidade','tenis'),
    L('l5','Mensalidade · Henrique Dias',480,'mensalidade','tenis'),
    L('l6','Mensalidade · Lucas Ferreira',1600,'mensalidade','tenis'),
    L('l7','Aula avulsa · visitante',160,'avulsa','tenis'),
    L('l8','Locação de quadra',70,'locacao','tenis'),
    L('l9','Compra de bolas',-320,'despesa','tenis')
  ];
  var profs=[{id:'pr1',nome:'Prof. João'},{id:'pr2',nome:'Profa. Marina'},{id:'pr3',nome:'Prof. Rafael'}];
  alunos.forEach(function(a,i){a.profId=profs[i%3].id;});
  /* liga os horários da grade aos alunos fictícios: sem isso o filtro por
     professor não teria o que filtrar na demonstração */
  var ag=seedAgenda();
  var aulas=ag.fixos.filter(function(f){return f.tipo==='aula'||f.tipo==='grupo'||f.tipo==='personal';});
  aulas.forEach(function(f,i){var a=alunos[i%alunos.length];f.alunoId=a.id;f.titulo=a.nome.split(' ')[0];});
  return {profs:profs,alunos:alunos,lancamentos:lancamentos,meta:12000,agenda:ag,presencas:[],compromissos:[],aviso:'Bem-vindo à demonstração do sistema! Explore à vontade — os dados são fictícios.'};
}
'''
assert "async function load(){" in h
h = h.replace("async function load(){", demo_seed_fn + "async function load(){", 1)
alvo = "if(chosen){try{DB=JSON.parse(chosen);}catch(e){}}"
assert alvo in h
h = h.replace(alvo, alvo + " else if(window.__DEMO){DB=DEMO_SEED();}", 1)

# ---------- 5) Branding genérico / demonstração ----------
# ---------- Recursos exclusivos da versão Pro ----------
# Multi-professor: o app do João tem um professor só, mas a versão vendida para
# academias precisa disso. Mesmo código, só o interruptor muda.
assert "const PRO_MULTI=false;" in h, "flag PRO_MULTI sumiu do app-gestao"
h = h.replace("const PRO_MULTI=false;", "const PRO_MULTI=true;   /* versão Pro */")

h = h.replace("Academia João Victor Tênis · Curitiba", "Sistema de Gestão · Demonstração")
h = h.replace("Bem-vindo, João 🎾", "Dados fictícios — explore à vontade 🎾")
h = h.replace('<div class="top-tag">Academia João Victor Tênis</div>', '<div class="top-tag">Academia Demonstração</div>')
h = h.replace(">Entrar 🎾</button>", ">Entrar na demonstração 🎾</button>")

# ---------- 6) Remover service worker + manifest + splash startup (evita 404) ----------
h = re.sub(r"if\('serviceWorker' in navigator\)\{[^\n]*\}", "/* SW desativado na demo */", h)
h = h.replace('<link rel="manifest" href="manifest-gestao.webmanifest">', '')
h = re.sub(r'<link rel="apple-touch-startup-image"[^>]*>\s*', '', h)

# ---------- 7) Selo fixo DEMONSTRAÇÃO + reiniciar ----------
selo = '''<div id="demo-flag" style="position:fixed;top:10px;left:10px;z-index:500;background:rgba(201,71,43,.95);color:#fff;font:700 11px system-ui,sans-serif;padding:6px 12px;border-radius:999px;box-shadow:0 3px 12px rgba(0,0,0,.35);cursor:pointer" onclick="if(confirm('Reiniciar a demonstração com os dados de exemplo?')){try{localStorage.removeItem(KEY);}catch(e){}location.reload();}">DEMO · reiniciar ↺</div>
'''
h = h.replace("<body>\n", "<body>\n" + selo, 1)

open(os.path.join(DSTDIR, "index.html"), "w", encoding="utf-8").write(h)
# copiar o icone usado no splash (só se ainda não existir/for igual — evita diff à toa)
shutil.copy(os.path.join(REPO_ROOT, "app-gestao", "jv-icone-gestao.png"), os.path.join(DSTDIR, "jv-icone-gestao.png"))
if not os.path.exists(os.path.join(DSTDIR, "netlify.toml")):
    open(os.path.join(DSTDIR, "netlify.toml"), "w", encoding="utf-8").write('[build]\n  publish = "."\n')
print("demo gerada:", os.path.getsize(os.path.join(DSTDIR,"index.html")), "bytes")
# checagens de seguranca
final=open(os.path.join(DSTDIR,"index.html"),encoding="utf-8").read()
print("Firebase CDN presente?", "gstatic.com/firebasejs" in final, "(deve ser False)")
print("databaseURL real presente?", "academia-jv-tenis-default-rtdb" in final, "(deve ser False)")
print("apiKey real presente?", "AIzaSyCs7o" in final, "(deve ser False)")
print("nomes reais (MARIO/KARINE) presentes?", ("MARIO" in final or "KARINE" in final), "(deve ser False)")
