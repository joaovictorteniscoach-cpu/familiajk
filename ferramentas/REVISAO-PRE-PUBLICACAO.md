# Revisão antes da publicação

João pediu conferir o trabalho do Claude/GitHub e realizar somente o que faltava.
Main conferida: `893ecca78f5752d88193ab6e736825760e07769e` (2026-10-07-4).
Versão em revisão: 2026-10-07-8, PR #226, incorporando o trabalho do #224.

| Recurso | Situação e ação nesta revisão |
|---|---|
| Renovação sem duplicar, reservas 1/2/3/4, plano família, pagamentos exatos, backup | Já na main; preservados e cobertos pelos testes existentes. |
| Nome abre ficha em Renovar o mês; ocupação/locação abrem agenda do mês | Aproveitado do Claude (#224), sem refazer a implementação. |
| Contraste das letras | Correções mais recentes do Claude (#224, head `36fe078`): Evolução, contato, vazios, cabeçalho da agenda, Registro e etiquetas de vencimento. Reaproveitadas sem refazer. |
| Resumo mensal do aluno | Aproveitado do Claude; contagem usa as mesmas aulas dos cartões, incluindo saldo de grupo. |
| Atalho de Créditos para Aulas | Existia nos dois PRs; mantido apenas um botão. |
| Confirmar/cancelar, realizadas do mês, Google Agenda e arquivo mensal | Implementado no #226; preservado na integração. |
| Inativos fora de Pendentes e quitação manual de R$ 0 | Implementado no #226; preservado na integração. |
| Fala | Apenas protótipo visual; comandos e microfone ainda não implementados. |
| App Check | Falta chave pública e registro do provedor no console. Seguir [APP-CHECK.md](APP-CHECK.md), começando em monitoramento. |

O #224 não deve ser publicado separadamente com V5/V6/V7 após esta integração.
A CI do head final do #226 registra a checagem completa e as capturas.
Esta revisão usa somente código e dados fictícios; não altera cadastros de produção.
Publicação ainda depende da confirmação solicitada ao João.
