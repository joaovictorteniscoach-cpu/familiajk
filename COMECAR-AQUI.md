# Começar aqui

Estado do sistema e o que fazer no dia a dia. O detalhe de cada assunto está em
[`PUBLICAR.md`](PUBLICAR.md) (endereços) e
[`ferramentas/FIREBASE.md`](ferramentas/FIREBASE.md) (banco de dados).

## Como está hoje

| | |
|---|---|
| **Endereço oficial** | `https://joaovictorteniscoach-cpu.github.io/familiajk/app-gestao/` |
| App do aluno | `.../familiajk/app-aluno/` · Site: `.../familiajk/site/` |
| Reserva | Netlify, publica sozinho no mesmo envio que o Pages |
| Banco | transição P0 informada pelo responsável; confirmar a regra vigente no console antes de alterar |
| Login | Gestão usa conta autorizada; aparelhos de aluno recebem UID anônimo e aprovação individual |
| Testes | `checar-tudo.sh` valida arquivos locais; não comprova regras ou dados atualmente no Firebase |

## O que fazer quando

### Mexeu nas regras do Firebase
Confira a regra vigente no console do projeto **academia-jv-tenis** e guarde uma
cópia antes de qualquer alteração autorizada. **Não use a etapa 1 como recuperação:**
ela libera leitura e escrita em caminhos sensíveis. O teste de conexão do app
faz gravações temporárias; não é uma inspeção somente de leitura.
Siga [`ferramentas/FIREBASE.md`](ferramentas/FIREBASE.md).

### Apareceu barra vermelha no topo
Os dois endereços publicam sozinhos, então isso deixou de ser rotina e virou
**sinal de que algo não publicou**. Use o endereço que a barra indica — ele está
certo — e, quando puder, veja no painel do Netlify se o último deploy falhou.
Para forçar: *Deploys → Trigger deploy → Deploy site*.

### O app abriu vazio
**Não apague dados locais nem reinstale.** Uma tela vazia pode indicar falha de
conexão, login ou permissão; não comprova perda dos dados do Firebase.
Existe uma trava (`CARREGADO`) que impede gravar por cima do dado bom nessa
situação. Exporte o backup se o app permitir, confirme a conexão e a conta
autorizada e anote a mensagem de erro antes de tentar corrigir.

### Algum número parece errado
1. *Financeiro → **🔎 Conferir números*** — aponta o que não fecha, sem corrigir
   nada sozinho;
2. *Financeiro → **🕘 Ver versões salvas*** — volta para uma versão anterior; a
   atual é guardada antes, então dá para desfazer a volta;
3. *Financeiro → **⬇ Exportar backup*** — cópia que não depende de nuvem nenhuma.

### O app começou a ficar lento
*Financeiro → **📊 Ver espaço usado*** mostra quanto já foi e, com uma semana de
histórico, em quanto tempo o limite chega. Se apertar,
*📦 Ver o que dá para arquivar* tira o que tem mais de 14 meses.

### Entrou aluno novo
Mande o link do app do aluno e peça para **adicionar à Tela de Início** — site
aberto só pelo navegador no Safari tem os dados locais apagados pelo sistema
depois de semanas sem uso.

## De vez em quando

- **Exportar backup** e guardar o arquivo (uma vez por mês já basta);
- **🔎 Conferir números**, se ficar na dúvida sobre algum saldo;
- **📊 Ver espaço usado**, para saber a folga antes de ela apertar.
