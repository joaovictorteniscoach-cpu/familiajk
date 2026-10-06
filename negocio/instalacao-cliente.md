# Instalação do sistema em uma nova academia

Atualizado em 06/10/2026. Uso interno. Este guia substitui a orientação antiga
de banco aberto: cada academia usa um projeto Firebase próprio, autenticação e
regras que autorizam somente seus usuários.

## 1. Projeto separado e acesso do responsável
- Crie o projeto na conta da academia ou combine a titularidade e os acessos.
- Crie o Realtime Database em modo bloqueado. Não publique regras de leitura
  e escrita públicas, nem use modo de teste para atender alunos.
- Registre um app Web e copie sua configuração pública.
- Em Authentication, configure o provedor usado pelo administrador e o login
  anônimo dos alunos. Cadastre os domínios efetivamente usados.
- Entre com a conta do administrador para obter o UID dele. Esse UID deve
  substituir o do João no código e nas condições das regras da nova academia.

A configuração Web e a URL do banco não são senhas. Quem controla o acesso é
a autenticação combinada com as regras do servidor.

## 2. Preparar os apps e as regras
- Use uma cópia atual de Gestão e Aluno, com o mesmo projeto Firebase.
- Ajuste `firebaseConfig`, `UID_DONO`, nome, contatos e endereços oficiais.
- Revise todos os UIDs de administrador nas regras; não copie a autorização
  da academia JV Tênis para um cliente.
- Confira o isolamento dos professores e dos dados de cada aluno com dados
  fictícios, usando o emulador.
- A referência atual da migração é
  [FIREBASE.md](../ferramentas/FIREBASE.md) e
  [SEGURANCA-P0.md](../ferramentas/SEGURANCA-P0.md).
- Não publique uma etapa antiga para contornar uma falha de permissão.
  O arquivo no Git não comprova a regra publicada no console.
- Instale a regra revisada para o projeto novo antes de inserir dados reais.

## 3. Publicar e aprovar os aparelhos
- Publique Gestão e Aluno por PR validado, com carimbo de versão igual.
- Confira HTTPS, arquivos dos apps, instalação na Tela de Início e acesso
  offline depois da primeira abertura.
- Cadastre os alunos e informe a mensalidade contratada.
- Cada aparelho do aluno solicita vínculo com seu UID anônimo. Confirme a
  identidade por canal externo e aprove individualmente na Gestão.
- O código de quatro números localiza o cadastro; sozinho não autoriza
  acesso. Não distribua login do administrador aos alunos.
- Para plano família, mantenha o total no pagador e vincule os dependentes;
  aulas, créditos e reposições continuam individuais.

## 4. App Check e regra final
O App Check complementa as regras e a aprovação do aparelho; não os substitui.

Siga [APP-CHECK.md](../ferramentas/APP-CHECK.md): registre a chave reCAPTCHA v3
para os domínios da academia, configure o provedor no Firebase e publique
somente a chave pública nos apps. A chave secreta fica no console.
Comece no monitoramento. A exigência depende da adaptação de todos os
clientes do banco, incluindo o site que faz leitura REST.

A etapa 4 das regras depende da migração dos aparelhos, da conferência no
painel e de autorização do responsável. Não confunda etapa 4 com exigir App Check.

## 5. Entrega e recuperação
- Teste cadastro, agenda, pagamento parcial, plano família e fechamento.
- Confira backup confirmado na nuvem e exporte uma cópia para o responsável.
- Faça o ensaio de recuperação com dados fictícios em ambiente separado.
  Não restaure versões no banco de produção para testar.
- Entregue um guia curto, os contatos de suporte e o canal para solicitações
  sobre dados pessoais.
- Atualize a política de privacidade com o controlador, os contatos, os
  serviços realmente usados e a retenção da nova academia.
- Combine manutenção, atualizações e acompanhamento dos avisos de publicação.

## Conferência antes de atender alunos
- Projeto e UIDs pertencem à academia correta.
- Regras revisadas, autenticação e isolamento testados no emulador.
- Apps com a mesma versão, publicados e instaláveis.
- Aparelhos aprovados individualmente.
- Backup, recuperação e fluxo financeiro conferidos.
- App Check com estado real documentado: desligado, monitorando ou exigido.
- Contatos, privacidade, suporte e responsabilidade pelo banco definidos.
