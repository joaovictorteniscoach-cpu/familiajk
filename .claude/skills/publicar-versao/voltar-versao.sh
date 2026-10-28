#!/bin/sh
# Volta ao que estava no ar antes de um merge (pedido do João, 28/10: "se der
# alguma divergência ou erro, que seja possível retornar a versão anterior").
# Desfaz o merge com "git revert" (o histórico fica, nada se apaga) e dá um
# carimbo de versão NOVO: com o carimbo antigo, o celular que já pegou a
# versão nova poderia não trocar o cache. Mantém a máquina do validar-pr da
# versão publicada (ex.: ubuntu-24.04), senão a conferência do PR de volta falha.
# Não mexe em dados (alunos, créditos, caixa): só no código publicado.
# Uso (da raiz, no branch designado recomeçado do main atual):
#   sh .claude/skills/publicar-versao/voltar-versao.sh <sha do merge a desfazer>
# Depois: checar-tudo + fumaça → commit já feito → push → PR → validar → merge.
set -e
SHA="$1"
[ -n "$SHA" ] || { echo "Uso: voltar-versao.sh <sha do merge a desfazer>"; exit 1; }
RAIZ=$(git rev-parse --show-toplevel); cd "$RAIZ"
[ -z "$(git status --porcelain)" ] || { echo "❌ Há mudanças não salvas; commit ou descarte antes."; exit 1; }
git cat-file -e "$SHA^2" 2>/dev/null || { echo "❌ $SHA não é um merge (precisa de 2 pais)."; exit 1; }
ARQS="app-aluno/index.html app-aluno/sw-aluno.js app-gestao/index.html app-gestao/sw-gestao.js app-gestao/lib/app-gestao.js"
versao(){ sed -n "s/^const VERSAO='\([0-9-]*\)'.*/\1/p" app-gestao/lib/app-gestao.js; }
NO_AR=$(versao); TOPO=$(git rev-parse HEAD)
MAQUINA=$(sed -n 's/^    runs-on: //p' .github/workflows/validar-pr.yml | head -1)
git revert -m 1 --no-edit "$SHA"
ANTES=$(versao)
HOJE=$(TZ=America/Sao_Paulo date +%Y-%m-%d)
case "$NO_AR" in
  "$HOJE"-*) NOVA="$HOJE-$(( ${NO_AR##*-} + 1 ))" ;;
  *) NOVA="$HOJE-1" ;;
esac
[ "$NOVA" != "$ANTES" ] && [ "$NOVA" != "$NO_AR" ] || { echo "❌ carimbo novo ($NOVA) repetiria um antigo"; exit 1; }
if [ "$ANTES" != "$NOVA" ]; then
  for f in $ARQS; do sed -i "s/$ANTES/$NOVA/g" "$f"; done
fi
[ -n "$MAQUINA" ] && sed -i "0,/^    runs-on: .*/s//    runs-on: $MAQUINA/" .github/workflows/validar-pr.yml
python3 ferramentas/tema-saibro.py >/dev/null
python3 site-pro/tools/build_demo.py >/dev/null
git add -A
git commit -q -m "Volta ao que estava no ar antes do merge ${SHA%"${SHA#???????}"} (conteúdo $ANTES, carimbo $NOVA)

Desfeito com git revert (histórico preservado). Versão que estava no ar: $NO_AR ($TOPO).
Dados de alunos, créditos e caixa não foram tocados."
echo "✅ Pronto: conteúdo de antes do merge ($ANTES) com carimbo novo $NOVA; estava no ar $NO_AR."
echo "   Agora: sh ferramentas/checar-tudo.sh && node .claude/skills/publicar-versao/fumaca.cjs → push → PR → validar → merge."
