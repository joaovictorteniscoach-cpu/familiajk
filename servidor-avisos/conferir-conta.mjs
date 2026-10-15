/* Confere o segredo FIREBASE_SERVICE_ACCOUNT antes de publicar, sem mostrar o
   conteúdo. Se o João colar o arquivo errado, a Action para aqui e diz o que
   está errado, em vez de publicar um servidor que não consegue entrar. */
const texto = process.env.FIREBASE_SERVICE_ACCOUNT || '';
let j = null;
try { j = JSON.parse(texto); } catch (_) { j = null; }
const erro = !j || typeof j !== 'object' ? 'não é o conteúdo do arquivo .json da conta de serviço (copie o arquivo inteiro, das chaves { até })'
  : j.type !== 'service_account' ? 'o arquivo não é de conta de serviço'
  : j.project_id !== 'academia-jv-tenis' ? 'a conta de serviço é de outro projeto do Firebase'
  : !/@.+\.iam\.gserviceaccount\.com$/.test(String(j.client_email || '')) ? 'falta o e-mail da conta de serviço'
  : !/BEGIN PRIVATE KEY/.test(String(j.private_key || '')) ? 'falta a chave privada' : '';
if (erro) { console.error('::error::FIREBASE_SERVICE_ACCOUNT: ' + erro); process.exit(1); }
console.log('Conta de serviço do projeto academia-jv-tenis: ok');
