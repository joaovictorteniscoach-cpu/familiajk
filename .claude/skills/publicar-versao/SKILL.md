---
name: publicar-versao
description: Rotina para publicar qualquer mudança nos apps da academia (gestão, aluno, site, demo) — subir a versão, regenerar o demo, rodar checadores e teste de fumaça no navegador, abrir PR, esperar validar-pr, fazer merge. Use sempre que for commitar/publicar mudança em app-gestao, app-aluno, site ou site-pro.
---

# Publicar uma versão

Regra do João: **só publica se tudo estiver ok.** Nada de push "para ver se passa".

## 1. Branch limpo
Se o PR anterior do branch designado já foi mergeado, recomece do main:
`git fetch origin main && git checkout -B <branch-designado> origin/main` (antes de editar).

## 2. Versão — só quando mudou app-gestao ou app-aluno
`sh .claude/skills/publicar-versao/subir-versao.sh`
Sobe `AAAA-MM-DD-N` nos 5 arquivos que precisam andar juntos (app-aluno/index.html,
sw-aluno.js, app-gestao/index.html, sw-gestao.js, lib/app-gestao.js). Mudança só em
docs, `.claude/` ou `ferramentas/` não sobe versão.

## 2b. Tema Saibro — quando mudou o CSS da Gestão ou do Aluno
`python3 ferramentas/tema-saibro.py` (regera `app-gestao/lib/estilo-saibro.css` e `app-aluno/lib/tema-saibro.css`; commitar junto).

## 3. Demo — quando mudou app-gestao
`python3 site-pro/tools/build_demo.py` (regenera `site-pro/demo/`; commitar junto).

## 4. Conferir
1. `sh ferramentas/checar-tudo.sh` → tem de terminar com **0 falhas**.
2. `node .claude/skills/publicar-versao/fumaca.cjs [pasta-prints]` → abre todas as abas,
   ficha, Renovar o mês e as ferramentas do Financeiro com dados fictícios; tem de dar `✅ fumaça OK`.
3. Teste específico da mudança: script Playwright próprio (base: `fumaca.cjs` — servidor
   embutido, `p.evaluate` para montar `DB` fictício, `persist=()=>{}`, esconder `#ov-entrar`).
   Prove o comportamento novo **e** um caso negativo. Prints: leia-os antes de afirmar que a tela está boa.
4. Releia o próprio diff procurando o que quebraria: valor mascarado (`fmt` vs `fmtRs`),
   texto sem `esc()`, data em UTC, classe CSS colidindo, correção automática de saldo.

## 5. Commit, PR, merge
- Mensagem em português, dizendo o que muda para o João. Rodapé de atribuição da sessão.
- `git push -u origin <branch>`; PR para `main` (corpo curto: o que muda, como foi testado).
- Esperar o check `validar` ficar verde (checks do Netlify são neutros). Merge com
  `merge_method: merge` e `expectedHeadSha` de 40 caracteres.
- O Pages publica sozinho após o merge; o Netlify também.

## 6. Responder ao João
Em português simples: o que mudou na tela dele, o que foi testado, e o que ele precisa
fazer (ex.: "feche e abra o app"). Sem jargão, sem listar arquivos.
