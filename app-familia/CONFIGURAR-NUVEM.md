# Nuvem da família

## Jeito simples (padrão): só o link

1. Abra o app → **Nuvem**.
2. Em **Link da família**, cole o mesmo link que vocês já usavam (começa com `https://` e termina com `.json`).
3. Ligue **Sincronizar na nuvem**.
4. Faça o mesmo no outro celular, com o mesmo link.

Na primeira vez o app compara o aparelho com a nuvem e, se forem diferentes, pergunta qual versão usar (baixe os dois backups antes de escolher, se tiver dúvida). Depois disso, cada alteração sobe sozinha e o outro aparelho recebe em até 15 segundos.

Sem login, quem tiver o link consegue ler e alterar os dados. Guarde o link só entre vocês dois e não publique.

## Opcional: login com e-mail e senha

Só se quiserem proteger a nuvem com contas. O link continua funcionando para quem não entrar; o login é só uma opção a mais.


O código está incluído no pacote. A configuração abaixo precisa ser realizada no projeto Firebase da família antes de usar a nuvem. Nenhuma conta foi criada e nenhuma regra foi publicada automaticamente.

O aplicativo continua funcionando localmente sem login. O login restringe a nuvem, não bloqueia os dados já salvos no navegador. Use apenas aparelhos de confiança. Não envie senhas, tokens, chaves privadas ou arquivos de conta de serviço pelo chat.

## 1. Preparar as contas

1. Faça um backup dos dados atuais nos dois aparelhos. Preserve também uma exportação da base remota antiga, se existir.
2. No Firebase Console, abra o projeto da família. Em Authentication, habilite o provedor E-mail/senha.
3. Crie os dois usuários autorizados, cada um com seu e-mail e sua senha. Não use senha compartilhada. A criação pode ser feita na área administrativa; o app não oferece cadastro público.
4. Anote o UID de cada usuário. Em Configurações do projeto, localize a Web API Key. Essa chave é configuração pública do cliente, não uma chave administrativa.

## 2. Restringir o banco

O arquivo `firebase-rules.exemplo.json` é um modelo para o caminho `/familias/jk/dados`.

- Substitua `SUBSTITUA_UID_JOAO` e `SUBSTITUA_UID_KASSIANA` pelos UIDs corretos.
- Confira se o projeto/banco é exclusivo da família. Se ele tiver outros aplicativos, integre somente a regra do caminho da família às regras existentes. Não substitua regras de outros sistemas.
- Publique as regras no Realtime Database somente depois dessa conferência. Não habilite `.read: true` ou `.write: true` globalmente.
- Se mantiver outro caminho, ajuste tanto a regra quanto a URL do app. Não deixe o caminho antigo público. Sua configuração antiga não foi alterada por esta entrega.

O modelo permite acesso apenas aos dois UIDs especificados e exige a identificação do usuário que gravou. Não é uma autorização para qualquer pessoa que consiga se cadastrar no mesmo projeto. O modelo não foi executado contra o seu banco: valide as permissões antes de inserir dados reais.

## 3. Configurar o app

Na tela Nuvem, abra Configurar conexão e preencha:

- URL: `https://SEU-PROJETO-default-rtdb.firebaseio.com/familias/jk/dados.json` (use o domínio real do seu banco, que também pode terminar em `.firebasedatabase.app`).
- Chave pública: a Web API Key do mesmo projeto.

Entre com e-mail e senha. A senha é removida do campo após a tentativa. Os tokens ficam somente na memória desta página; recarregar ou fechar exige novo login. O gerenciador de senhas do navegador pode lembrar o preenchimento, conforme a escolha do usuário.

No primeiro aparelho, confira seus dados locais. Se o novo caminho estiver vazio, use Enviar agora. No segundo, faça backup local, entre e confira as versões antes de escolher Usar a nuvem. A migração do caminho antigo não é automática.

## 4. Como resolver diferenças

Todo envio inclui a versão previamente lida do banco. Se outro aparelho tiver alterado essa versão, o envio é recusado e a sincronização automática pausa.

- Baixe os backups do aparelho e da nuvem para conferir o que mudou.
- **Enviar este aparelho** substitui a versão remota pela local, após confirmação e somente se a versão remota conferida continuar a mesma.
- **Usar a nuvem** salva uma versão local recuperável antes de substituir os dados do aparelho.
- Se a nuvem mudar novamente durante a conferência, o app pede nova escolha.

Não há mesclagem automática de lançamentos. A referência da última sincronização é guardada apenas neste navegador para detectar alterações locais feitas offline. Se essa referência estiver ausente e as bases diferirem, o app pede conferência em vez de adivinhar qual é a correta.

## 5. Conferência antes do uso diário

Use dados de teste e confirme: acesso com cada usuário autorizado; negação para usuário não autorizado; logout; novo login após recarregar; edição em um aparelho chegando ao outro; duas edições simultâneas mostrando conflito; funcionamento local sem internet. Não use esta etapa para testar sobre a única cópia dos dados financeiros.

Documentação técnica consultada:

- https://firebase.google.com/docs/reference/rest/auth
- https://firebase.google.com/docs/database/rest/save-data
- https://firebase.google.com/docs/database/security/rules-conditions
