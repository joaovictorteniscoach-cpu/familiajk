# Ativar App Check — Academia JV Tênis

Atualizado em 06/10/2026. Projeto: **academia-jv-tenis**.

O João autorizou preparar a ativação. A chave pública ainda não foi fornecida
nesta etapa; os campos `APPCHECK_SITE_KEY` continuam vazios até a configuração.
Este documento não comprova o estado do console do Firebase.

## 1. Criar ou localizar a chave
1. Abra o [console reCAPTCHA](https://www.google.com/recaptcha/admin/create).
2. Crie uma chave **reCAPTCHA v3**. O projeto usa o provedor v3, não uma chave
   Enterprise de outro provedor.
3. Cadastre os hosts usados, sem protocolo ou caminho:
   - `joaovictorteniscoach-cpu.github.io`
   - `appalunos.netlify.app`
   - `academiatenisjv.netlify.app`
   - `informacoesjvtenis.netlify.app`
4. Inclua também qualquer domínio próprio ou reserva adicional efetivamente
   usado. Confirme as URLs antes de exigir a proteção.
5. Guarde a **chave do site** e a **chave secreta**. Só a chave do site pode
   entrar no código ou ser compartilhada nesta conversa.

## 2. Registrar o provedor no Firebase
1. Abra [Firebase → App Check](https://console.firebase.google.com/project/academia-jv-tenis/appcheck).
2. Selecione o app Web cuja configuração aparece nos dois aplicativos.
3. Registre o provedor **reCAPTCHA v3**, usando a chave secreta somente no console.
4. Confira a configuração recomendada pelo Firebase para o provedor.
5. Deixe o Realtime Database em **monitoramento**, sem exigir tokens ainda.

## 3. Publicar a chave pública
- Preencha a mesma `APPCHECK_SITE_KEY` em `app-gestao/index.html` e
  `app-aluno/index.html`.
- Siga a rotina de publicação: versão nos cinco arquivos, demo regenerado,
  checadores e testes em navegador, PR verde e publicação.
- A inicialização agora também cobre a instância separada usada por
  **Testar conexão**, antes de ela acessar o banco.
- Feche e reabra os apps nos aparelhos. Use somente as URLs cadastradas.
- Confira métricas de requisições válidas e recusadas no console, em Gestão
  e Aluno, nos navegadores e PWAs realmente usados.

Os testes locais simulam a inicialização e não provam a emissão de tokens
reCAPTCHA válidos. Essa confirmação depende do console e dos acessos reais.

## 4. Antes de exigir no Realtime Database
Ainda há um cliente sem App Check: o site público lê
`precos_publicos/status_quadra` por REST em `site/js/site-v2.js`.
A verificação de preços em **Testar conexão** também usa REST sem token.

Não exija App Check enquanto esses caminhos não tiverem sido adaptados e
testados. Com a exigência, eles podem receber recusa e perder atualização.
A ativação dos SDKs em monitoramento permite preparar essa adaptação sem
interromper os aplicativos atuais.

Depois da adaptação:
- valide site, Gestão, Aluno, professores, reservas de hospedagem e teste
  de conexão;
- confira as métricas durante alguns dias de uso real;
- verifique aparelhos antigos, navegação privada e bloqueadores;
- só então habilite a exigência no console e confira novamente todos os fluxos.

## 5. Se algum acesso legítimo falhar
Volte a exigência do App Check para monitoramento e investigue os hosts, a
chave, o provedor e os tokens. Preserve o banco e as regras de acesso.
Não abra as regras, não apague dados locais e não use token de depuração
fixo no código público.

## Desenvolvimento e ensaio
Use emulador e dados fictícios. Tokens de depuração autorizados, quando
necessários para desenvolvimento, ficam em ambiente privado e nunca no Git.
O ensaio de recuperação e o monitoramento de publicação não consultam o
banco de produção.
