#!/bin/sh
# Monta as figuras da JV a partir das fotos originais, nas tres cores de papel.
#
# Roda tudo de uma vez para as figuras serem sempre feitas do mesmo jeito: se
# cada foto for preparada na mao, uma sai com franja, outra sai com outra
# escala, e o desenho deixa de parecer de uma peca so'.
#
#   uso:  sh ferramentas/montar-figuras-jv.sh PASTA_DAS_FOTOS PASTA_DE_TRABALHO
#
# Espera, dentro da PASTA_DAS_FOTOS, os arquivos com estes nomes:
#   espera.png  prepara.png  saque-frente.png  saque-costas.png  voleio.png
# As saidas vao para app-exercicios/jv-<pose>-<papel>.webp
set -e
ORIG=${1:?pasta das fotos originais}
TRAB=${2:-/tmp/figuras-jv}
APP=app-exercicios
mkdir -p "$TRAB"

# pose:altura-em-px-do-arquivo-final — quem ja' e' grande desce, quem e'
# pequeno sobe so' o necessario. Ampliar alem disso inventa borrao, nao detalhe.
# pinta a camisa nas tres cores de papel e grava os .webp do app
colorir() {
  pose=$1
  # colega fica com a camisa original (azul), que ja' e' a cor dele
  cp "$TRAB/$pose.png" "$TRAB/$pose-colega.png"
  # professor: camisa sem cor
  python3 ferramentas/pintar-camisa.py "$TRAB/$pose.png" "$TRAB/$pose-prof.png" \
      --de 220 --cinza --faixa 45 >/dev/null
  # aluno: matiz para o dourado e depois o realce, senao sai verde-oliva
  python3 ferramentas/pintar-camisa.py "$TRAB/$pose.png" "$TRAB/$pose-ouro.png" \
      --de 220 --para 45 --faixa 45 >/dev/null
  python3 ferramentas/camisa-dourada.py "$TRAB/$pose-ouro.png" "$TRAB/$pose-aluno.png" >/dev/null

  for papel in aluno prof colega; do
    python3 -c "
from PIL import Image
import sys
im = Image.open(sys.argv[1]).convert('RGBA')
im.save(sys.argv[2], 'WEBP', quality=92, method=6)
" "$TRAB/$pose-$papel.png" "$APP/jv-$pose-$papel.webp"
  done
  echo "  $pose -> jv-$pose-{aluno,prof,colega}.webp"
}

# pose:altura-em-px-do-arquivo-final — quem ja' e' grande desce, quem e'
# pequeno sobe so' o necessario. Ampliar alem disso inventa borrao, nao detalhe.
for par in espera:560 prepara:560 saque-frente:560 saque-costas:560 voleio:420; do
  pose=${par%%:*}; alt=${par##*:}
  python3 ferramentas/preparar-recorte.py "$ORIG/$pose.png" "$TRAB/$pose.png" --alt "$alt"
  colorir "$pose"
done

# o jogador do outro lado da rede: a mesma espera, vista de frente
python3 ferramentas/virar-de-frente.py "$TRAB/espera.png" "$TRAB/espera-frente.png"
colorir espera-frente
