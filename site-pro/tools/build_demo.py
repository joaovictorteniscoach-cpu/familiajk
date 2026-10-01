# -*- coding: utf-8 -*-
"""Gera site-pro/demo/: a Gestão ATUAL em modo demonstração, sem Firebase e com dados fictícios.

Rode de novo sempre que a Gestão mudar (a demo é uma cópia transformada, não
puxa nada em tempo real). A partir da raiz do repositório:

    python3 site-pro/tools/build_demo.py

A demo é AUTOSSUFICIENTE: o estilo, os ícones e as imagens são copiados para
dentro de site-pro/demo/. Antes ela buscava em ../../app-gestao/, caminho que só
existe no GitHub Pages — no Netlify do site-pro (cursoecapacitacao) a pasta
app-gestao não existe, e a demonstração abria sem estilo e quebrada.

O bloco offline (banco local + dados fictícios) fica em tools/bloco_demo.html.
"""
import os, re, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.abspath(os.path.join(HERE, "..", ".."))
GEST = os.path.join(RAIZ, "app-gestao")
DST = os.path.join(RAIZ, "site-pro", "demo")

def ler(p): return open(p, encoding="utf-8").read()
def troca(txt, a, b, n=1):
    assert txt.count(a) >= 1, "nao achei: " + a[:70]
    return txt.replace(a, b) if n == 0 else txt.replace(a, b, n)

# ---------- index.html ----------
h = ler(os.path.join(GEST, "index.html"))
h = troca(h, "<title>JV Tênis · Gestão</title>", "<title>JV Tênis · Gestão — Demonstração</title>")
h = re.sub(r'<link rel="manifest" href="manifest-gestao\.webmanifest">\s*', "", h)
h = re.sub(r'<link rel="apple-touch-startup-image"[^>]*>\s*', "", h)

# troca o bloco do Firebase (bibliotecas + configuração + login) pelo bloco offline
ini = h.index("<!-- ================= FIREBASE")
fim = h.index("</script>", h.index("aguardarFirebase", ini)) + len("</script>")
h = h[:ini] + ler(os.path.join(HERE, "bloco_demo.html")) + h[fim:]

h = troca(h, "<body>\n", "<body>\n" + '<div id="demo-fita" style="position:relative;z-index:400;background:#D4AF58;color:#10261E;padding:8px 12px;text-align:center;font:800 11px/1.3 \'DM Sans\',system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase">Demonstração · dados fictícios · nenhuma alteração vai para a nuvem</div>\n')
h = re.sub(r'<span class="save-state[^"]*" id="save-state">[^<]*</span>', '<span class="save-state ok" id="save-state">Demo local</span>', h, count=1)
h = re.sub(r'<script src="lib/app-gestao\.js\?v=([^"]+)"></script>', r'<script src="app-demo.js?v=\1"></script>', h, count=1)
h = troca(h, "LOGKEY:'jvtenis_hist_log'", "LOGKEY:'jvtenis_demo_hist_log'")
h = re.sub(r"if\('serviceWorker' in navigator\)\{[^\n]*\}", "/* DEMO: sem service worker próprio; evita cache/instalação confundirem com o app real. */", h, count=1)

# marca da demonstração (a demo é vitrine do sistema para outras academias)
h = h.replace("Academia João Victor Tênis · Curitiba", "Sistema de Gestão · Demonstração")
h = h.replace("Academia <b>João Victor Tênis</b>", "Academia <b>Demonstração</b>")
h = h.replace("Bem-vindo, João 🎾", "Dados fictícios — explore à vontade 🎾")
h = h.replace(">Entrar 🎾</button>", ">Entrar na demonstração 🎾</button>")

# ---------- app-demo.js (o app inteiro, sem tocar a nuvem) ----------
j = ler(os.path.join(GEST, "lib", "app-gestao.js"))
j = troca(j, "const AVATAR_GESTAO_KEY='jvt-avatar-gestao-v1';", "const AVATAR_GESTAO_KEY='jvt-demo-avatar-gestao-v1';")
j = troca(j, "function hasCloud(){return !!(window.fbDB);}", "function hasCloud(){return false;} // DEMO: nunca toca a nuvem real")
j = re.sub(r"const ENDERECO_ATUAL='[^']*';", "const ENDERECO_ATUAL='https://cursoecapacitacao.netlify.app/demo/';", j, count=1)
j = troca(j, "if(window.fbDB||t>=40){load();return;}", "if(window.JV_DEMO||window.fbDB||t>=40){load();return;}")
# na demo os valores já aparecem: esconder era proteção do caixa real
j = troca(j, "let hideVals=true;", "let hideVals=false;")
j = j.replace("(dono?', João':'')", "''")
# a demo roda em dois endereços (Netlify do site-pro e GitHub Pages): o aviso de
# "endereço reserva" e o de versão não fazem sentido numa demonstração
j = troca(j, "function conferirEndereco(){", "function conferirEndereco(){return; /* DEMO */")
j = troca(j, "function mostrarBarraVersao(naNuvem){", "function mostrarBarraVersao(naNuvem){return; /* DEMO */")

# ---------- grava e copia o que a página usa ----------
if os.path.isdir(DST):
    for n in os.listdir(DST):
        if n != "netlify.toml":
            p = os.path.join(DST, n)
            shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)
os.makedirs(os.path.join(DST, "lib"), exist_ok=True)
open(os.path.join(DST, "index.html"), "w", encoding="utf-8").write(h)
open(os.path.join(DST, "app-demo.js"), "w", encoding="utf-8").write(j)
for f in ("estilo.css", "icones.js"):
    shutil.copy(os.path.join(GEST, "lib", f), os.path.join(DST, "lib", f))
shutil.copytree(os.path.join(GEST, "assets"), os.path.join(DST, "assets"))
for f in os.listdir(GEST):
    if f.startswith("jv-icone-gestao") and f.endswith(".png"):
        shutil.copy(os.path.join(GEST, f), os.path.join(DST, f))

# ---------- conferências: nada da academia real pode sobrar ----------
tudo = h + j
proibido = ["firebaseio.com", "apiKey", "firebase-app-compat", "gstatic.com/firebasejs", "../../app-gestao"]
sobras = [p for p in proibido if p in tudo]
assert not sobras, "sobrou na demo: %s" % sobras
print("demo gerada em site-pro/demo/ — sem Firebase, sem caminho para app-gestao")
