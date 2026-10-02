#!/bin/sh
# Sobe o carimbo de versão nos 5 arquivos que precisam andar juntos.
# Uso (da raiz do repo): sh .claude/skills/publicar-versao/subir-versao.sh
# Formato AAAA-MM-DD-N: mesmo dia → N+1; outro dia → hoje-1.
set -e
RAIZ=$(git rev-parse --show-toplevel); cd "$RAIZ"
ARQS="app-aluno/index.html app-aluno/sw-aluno.js app-gestao/index.html app-gestao/sw-gestao.js app-gestao/lib/app-gestao.js"
ATUAL=$(sed -n "s/^const VERSAO='\([0-9-]*\)'.*/\1/p" app-gestao/lib/app-gestao.js)
[ -n "$ATUAL" ] || { echo "Não achei VERSAO em app-gestao.js"; exit 1; }
HOJE=$(TZ=America/Sao_Paulo date +%Y-%m-%d)
case "$ATUAL" in
  "$HOJE"-*) NOVA="$HOJE-$(( ${ATUAL##*-} + 1 ))" ;;
  *) NOVA="$HOJE-1" ;;
esac
for f in $ARQS; do
  grep -q "$ATUAL" "$f" || { echo "❌ $f não tem $ATUAL"; exit 1; }
  sed -i "s/$ATUAL/$NOVA/g" "$f"
done
echo "Versão $ATUAL → $NOVA"
grep -c "$NOVA" $ARQS
