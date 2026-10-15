/* Confere os segredos do usuário robô antes de publicar, sem mostrar nada:
   formato do e-mail, tamanho da senha e se o login no Firebase funciona.
   Se o João digitar a senha errada no GitHub, a Action para aqui e diz o
   motivo, em vez de publicar um servidor que não consegue entrar. */
import fs from 'node:fs';
const email = process.env.AVISOS_EMAIL || '', senha = process.env.AVISOS_SENHA || '';
const toml = fs.readFileSync(new URL('./wrangler.toml', import.meta.url), 'utf8');
const apiKey = (toml.match(/^API_KEY\s*=\s*"([^"]+)"/m) || [])[1] || '';
const site = (toml.match(/^CONTATO\s*=\s*"([^"]+)"/m) || [])[1] || '';
function falha(m) { console.error('::error::' + m); process.exit(1); }
if (email !== email.trim() || senha !== senha.trim()) falha('AVISOS_EMAIL ou AVISOS_SENHA tem espaço no começo ou no fim (comum ao colar no celular).');
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) falha('AVISOS_EMAIL não parece um e-mail.');
if (senha.length < 12) falha('AVISOS_SENHA curta demais: use pelo menos 12 caracteres.');
if (!apiKey) falha('API_KEY ausente em servidor-avisos/wrangler.toml.');
const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + encodeURIComponent(apiKey), {
  method: 'POST', headers: { 'content-type': 'application/json', referer: site.replace(/\/*$/, '/') },
  body: JSON.stringify({ email, password: senha, returnSecureToken: true })
});
if (!r.ok) {
  let m = '';
  try { m = String(((await r.json()).error || {}).message || '').replace(/[^A-Z_ :]/g, '').slice(0, 60); } catch (_) {}
  falha('o Firebase recusou o login do robô (' + r.status + ' ' + m + '). Confira se o usuário foi criado em Authentication e se a senha no GitHub é a mesma.');
}
const j = await r.json();
console.log('Login do usuário robô no Firebase: ok (uid termina em …' + String(j.localId || '').slice(-4) + ')');
