# Skills do Claude neste repositório

São instruções que o Claude Code carrega quando a tarefa pede. **Não alteram os apps**: a pasta `.claude/` não é publicada no GitHub Pages. Para remover uma skill, basta apagar a pasta dela.

| Skill | Para que serve | Origem (licença) |
|---|---|---|
| `prototype` | Protótipos descartáveis de lógica ou de tela para decidir antes de mexer no app | [mattpocock/skills](https://github.com/mattpocock/skills) `skills/engineering/prototype` @ d81f3a1 (MIT) |
| `frontend-design` | Direção visual e textos de interface com escolhas deliberadas | [anthropics/skills](https://github.com/anthropics/skills) `skills/frontend-design` @ 8a1541c (Apache 2.0) |
| `broken-access-control` | Revisão de controle de acesso: regras do Firebase, dono dos dados, papéis | [thejefflarson/soundcheck](https://github.com/thejefflarson/soundcheck) @ 4fc07c9 (MIT) |
| `insecure-local-storage` | Dados sensíveis no localStorage/cache do navegador | idem (MIT) |
| `publicar-versao` | Rotina de publicação do projeto: versão, demo, checagens, teste de fumaça no navegador, PR | feita para este repositório |
| `hardcoded-secrets` | Chaves, senhas e tokens dentro do código | idem (MIT) |

Os arquivos foram copiados sem alterações. A única exceção é a seção "Neste projeto (JV Tênis)" no fim de `prototype/SKILL.md`, que adapta a skill a apps de arquivo único sem build, sem dados reais e sem branches extras. Nenhuma skill traz scripts, hooks ou chamadas de rede.
