#!/bin/sh
set -u
cd "$(dirname "$0")/.." || exit 1
APPS="app-aluno/index.html app-gestao/index.html site/index.html"
falhou=0
echo "### 1. Sintaxe dos scripts (erro aqui quebra o app inteiro)"
for f in $APPS; do node ferramentas/checar-sintaxe.js "$f" || falhou=1; done
echo; echo "### 2. Funcoes chamadas que nao existem no arquivo"
python3 ferramentas/checar-funcoes.py $APPS
echo; echo "### 3. Ids de elemento procurados que nao existem"
python3 ferramentas/checar-ids.py $APPS
echo; echo "### 4. Colisao de nome de classe no CSS (conferir a olho)"
python3 ferramentas/checar-css.py app-aluno/index.html app-gestao/index.html
echo; echo "### 5. Regressao das regras atuais"
python3 ferramentas/checar-regras.py ferramentas/firebase-regras-etapa3.json || falhou=1
echo; echo "### 6. Regressao das regras P0 — transicao"
python3 ferramentas/checar-regras.py ferramentas/firebase-regras-etapa3-transicao.json || falhou=1
echo; echo "### 7. Regressao das regras P0 — final"
python3 ferramentas/checar-regras.py ferramentas/firebase-regras-etapa4-estrita.json || falhou=1
echo; echo "### 8. Segurança P0: identidade, privacidade e modularizacao"
python3 ferramentas/checar-seguranca-p0.py || falhou=1
echo; echo "### 9. Carimbo de versao dos apps"
python3 ferramentas/checar-versao.py || falhou=1
echo
if [ "$falhou" -eq 0 ]; then
  echo "Sintaxe, regras, segurança P0 e versao OK. Leia os avisos dos itens 2 a 4 antes de publicar."
else
  echo "ERRO — nao publique antes de corrigir."
  exit 1
fi
