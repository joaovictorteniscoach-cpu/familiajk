# Revisão das telas pela lista da Vercel (27/10/2026) — só lista

Pedido do João: "aproveite alguma coisa" das skills testadas. Esta é a revisão
com a lista **Web Interface Guidelines** da Vercel (a mesma da skill
`web-design-guidelines`), aplicada aos dois apps. **Nada foi alterado.**
Corrigir só com o OK dele.

Como foi feito:
- App do Aluno: 5 abas e a janela de escolher horário.
- Gestão: 10 telas (Início, Agenda, Alunos, Avaliações, Caixa, Financeiro,
  Segurança, Fechamento, Gráficos, Torneio).
- Celular de 390 px, dados fictícios, versão publicada 2026-10-27-1.
- Leitura do código com `grep`, mais uma varredura no navegador (Playwright)
  que procura botão sem nome, campo sem rótulo, toque em `div`, área de toque
  pequena e rolagem para o lado.

## O que já está bom

- **Botões:** nenhum botão sem nome, nas duas telas.
- **Imagens:** nenhuma imagem sem descrição no aluno.
- **Zoom:** o zoom do celular é permitido (`maximum-scale=5`).
- **Campos:** de 16 px, então o iPhone não dá zoom sozinho.
- **Barra de baixo:** toque de 44 px (tem teste).
- **iPhone:** o entalhe é respeitado (`safe-area-inset`).
- **Largura:** nada passa da largura da tela.
- **Leitura e letras:** contraste e letra mínima já têm testes próprios, mais
  rigorosos que a lista.
- **Ações que apagam:** pedem confirmação ou têm "desfazer". É regra da casa.

## Achados

### A. Aparecem para quem usa (mudam um pouco a tela; só com OK)

1. **"Fechado" partido ao meio na grade da semana do aluno.**
   - Na coluna estreita aparece "Fechad / o", e o mesmo com "Locaçã / o".
   - Onde: `app-aluno/index.html`, grade `.wc` (`renderAgenda`, `agView==='semana'`).
   - Já acontecia antes; não veio das últimas mudanças.
   - Correção sugerida: escrever "Fech." quando não couber, ou impedir a quebra no
     meio da palavra. Não muda cor nem tamanho.
2. **Áreas de toque menores que 44 px na Gestão**, onde o João toca muito:
   - Agenda, visão Semana: células de 49×28 px (82 na tela);
   - Gráficos: linhas "Ver mês em detalhe" com 28 px de altura (46 linhas);
   - Caixa: setas ‹ › do dia com 30×30 px, e "Editar atalhos" com 23 px de altura;
   - Torneio: "Tocar para editar o número" da etapa com 22 px de altura.
   - Risco: errar o toque.
   - Corrigir deixa essas linhas um pouco mais altas, o que mexe no visual.
     Só com pedido do João.

### B. Invisíveis: não mudam nada na tela, ajudam leitor de tela e teclado

3. **O aviso rápido (toast) não é anunciado pelo leitor de tela.** Falta
   `role="status"` ou `aria-live="polite"`.
   - `app-gestao/index.html:1787`
   - `app-aluno/index.html:2387`
4. **Campo do código de acesso do aluno** sem rótulo (só o "••••") e sem
   `autocomplete="one-time-code"`.
   - `app-aluno/index.html:1804`
5. **Campos sem rótulo ligado a eles:**
   - Gestão, buscas: Alunos (`#search`), Avaliações (`#aval-search`), Caixa (`#cx-busca`);
   - Gestão, Financeiro: 17 campos, como a meta (`app-gestao/index.html:704`) e o
     texto do aviso;
   - Gestão, listas de escolha: Fechamento (`#fc-aluno`, `#fc-mes`) e Torneio (`#tor-sel`).
   - Na tela há um texto perto, mas ele não está "ligado" ao campo.
6. **Toque em `div`/`span` em vez de botão.**
   - Gestão: Início 2, Alunos 5, Caixa 2, Financeiro 4, Gráficos 46, Torneio 1.
   - Aluno: 13 no código.
   - No celular funcionam normalmente; só não são alcançados pelo teclado.
7. **Contorno de foco removido sem substituto**, então quem usa teclado não vê
   onde está:
   - aluno: `.code-input` (`app-aluno/index.html:99`), `.field select` (`:375`);
   - Gestão: `.toolbar input` (`app-gestao/lib/estilo.css:407`).

### C. Não se aplicam aqui

- **Texto em inglês:** títulos em "Title Case" e regras de redação.
- **React/Next.js:** "hydration", `useState` e URL com filtros (é PWA sem rotas).
- **Formatos de data e dinheiro:** `Intl.*`; o app é só em português e usa
  `fmt()`/`fmtRs()` de propósito.
- **Listas enormes:** virtualização; as listas são pequenas.
- **Toque duplo:** atraso no toque duplo (iPhone atual não tem com
  `width=device-width`).
- **`transition: all`:** aparece só no toast (`estilo.css:639`,
  `app-aluno/index.html:380`); é inofensivo.
- **Animação reduzida:** existe em parte (2 lugares na Gestão, 1 no aluno). As
  animações são poucas e curtas.

## Recomendação

- **B (3, 4 e 5):** não mudam nada na tela, custam pouco e deixam o app mais
  correto. Dá para fazer junto com a próxima publicação.
- **A1 ("Fechado" partido):** é defeito de texto e vale corrigir.
- **A2 (toques pequenos):** só se o João sentir que erra o toque nessas telas.
- **B6 e B7:** baixo valor para um app usado no celular. Ficam anotados.

Para refazer esta revisão: a lista atual fica em
`https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`
(baixada a cada uso; pode mudar sem aviso).
