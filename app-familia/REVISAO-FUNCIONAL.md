# Família JK — revisão funcional

Versão Black & Gold revisada em 25/09/2026, evolução r2.

## Resultado

As funções cobertas pelos testes passaram após as correções abaixo. A revisão não certifica todo o aplicativo em produção: não houve acesso aos dados atuais dos aparelhos, teste visual em navegador real ou conexão com a nuvem da família.

## Correções entregues

| Área | Correção |
|---|---|
| Vencimentos | Atrasos maiores que três dias não são mais empurrados para o futuro. O cálculo considera o mês selecionado, fevereiro e anos bissextos. Dia 31 em mês curto usa o último dia do mês. Textos como “3x” não viram dia de vencimento. |
| Recebidos | Fechamento mensal e anual usam somente recebimentos com data válida do mês e ano escolhidos. A tabela continua mostrando todos os registros e seu total geral. |
| Datas antigas | Registros sem ano ou com data inválida ficam sinalizados, sem exclusão. Quando o identificador antigo preserva o ano, a data completa é recuperada. Novas entradas por texto mantêm o ano. |
| Patrimônio | Cartões marcados como pagos deixam de compor o passivo do mês selecionado. O total da fatura continua disponível em Cartões. |
| Salvamento | Falta de espaço ou bloqueio do armazenamento mostra um aviso visível no celular e computador, com opções para baixar backup e tentar novamente. O app mantém as alterações na memória enquanto estiver aberto. |
| Importar/restaurar | A substituição só ocorre depois de salvar uma cópia anterior e conseguir gravar a nova base. Se faltar espaço, a troca é cancelada e a base atual permanece. |
| Cópias locais | Até dez versões anteriores e quatorze cópias diárias, quando houver espaço. Isso reduz o crescimento ilimitado da memória usada por backups. |
| Nuvem | Conteúdo inválido é rejeitado. Respostas antigas são ignoradas após mudança de conexão ou edição local. Desligar cancela envios agendados. Falhas liberam o próximo salvamento. Ativar busca primeiro, sem envio imediato. |
| Compartilhamento | Links e conteúdo enviado à nuvem excluem a URL/configuração de conexão. Abrir um link mantém a URL local e pausa a sincronização para conferir os dados. O link ainda contém os dados financeiros compartilhados. |
| Proteção contra redução | O bloqueio de substituição por uma base muito menor também considera recebimentos, bens, aportes e ativos da Binance. |
| Lixeira | Últimas 20 ações de exclusão, com botão Desfazer e restauração de itens sem substituir o restante da base. Exclusões são canceladas quando não podem ser gravadas. |
| Importação | Preserva identificador bancário e conta de origem. Não usa mais apenas o começo da descrição. Sem identificação confiável, mostra possíveis duplicidades e permite incluir lançamentos legítimos iguais. |
| Login | Entrada por e-mail/senha com Firebase, renovação de sessão e logout. Senha e tokens não entram nos backups ou na base financeira. Tokens ficam apenas na memória. Requer configuração do projeto e das regras. |
| Conflitos | Envio condicionado à versão lida do servidor. Se outro aparelho alterar a nuvem, não há repetição automática do envio: o app mostra as versões e permite baixar ambas antes da escolha. |

Os avisos e instruções de nuvem deixaram de sugerir regras públicas de leitura/escrita.

## Evidência de verificação

- 11 verificações anteriores de interface, incluindo as 25 telas, atalhos, pagamentos mensais e gráficos com carteira zerada.
- 60 cenários adicionais: os 30 da revisão anterior e 30 novos envolvendo exclusões/recuperação, registros bancários, possíveis duplicidades, paginação, login/logout, renovação de token, URLs permitidas, alterações offline, conflitos de versão e trocas de conexão durante uma busca.
- Sintaxe dos três scripts conferida; todos os identificadores procurados pelo JavaScript estão presentes.
- ZIP conferido quanto à integridade e aos arquivos locais referenciados.

Os testes usam DOM e rede simulados e um substituto para Chart.js. Eles não verificam a aparência, o desenho real dos gráficos, instalação/offline em iPhone, OCR de fotos/PDF, microfone, cotação externa ou sincronização entre dois aparelhos reais.

## Próximas melhorias, por prioridade

1. **Ativar e homologar a nuvem real.** Configurar as duas contas e as regras conforme CONFIGURAR-NUVEM.md; conferir usuários autorizados e não autorizados, além de conflitos entre dois aparelhos. A proteção implementada pede escolha da versão completa, não mescla lançamentos automaticamente.
2. **Ampliar os arquivos bancários de teste.** OFX/CSV com identificadores e conta têm identificação mais confiável. Arquivos sem identificador exigem revisão humana; nenhum algoritmo distingue com certeza duas compras realmente iguais apenas por data, descrição e valor. Use uma origem consistente para cada conta.
3. **Histórico detalhado de edição.** A lixeira já recupera exclusões. Ainda é possível acrescentar um histórico de cada mudança de valor/categoria, com autor e horário, e restauração por campo.
4. **Rotina mais prática.** Busca e filtros mais abrangentes, lembretes de vencimento e separação clara entre cadastro recorrente e valores efetivos de cada mês.

Backups e links completos podem conter a lixeira e seus registros recuperáveis. Compartilhe somente com pessoas de confiança. O login da nuvem não criptografa nem bloqueia os dados locais já acessíveis no aparelho.

## Instalação

Faça um backup no aplicativo atual. Extraia o ZIP e envie todo o conteúdo ao mesmo site do Netlify. Mantenha o endereço para preservar a memória local do navegador. Nenhuma publicação no GitHub ou alteração do site em produção foi feita nesta revisão.
