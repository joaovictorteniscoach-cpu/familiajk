/* Servidor de avisos — Academia João Victor Tênis
   Roda na Cloudflare (Workers, plano grátis) a cada 2 minutos. Não muda
   agenda, créditos nem valores: só entrega avisos no celular.

   O que faz em cada rodada:
   1. Entra no Firebase como o USUÁRIO ROBÔ (segredos AVISOS_EMAIL e
      AVISOS_SENHA). Escolha do João em 15/10: o robô é um usuário comum, que
      a regra deixa ler só o necessário e mexer só nos avisos; se a senha
      vazar, o estrago fica nos avisos. (A chave de serviço mandaria em tudo
      e é um arquivo difícil de copiar no celular.)
   2. Lê os avisos que a Gestão preparou (jvtenis/avisos_saida): aula amanhã,
      vencimento da mensalidade e vaga liberada da lista de espera.
   3. Manda cada aviso cuja hora chegou para os aparelhos daquele aluno
      (jvtenis/avisos_tokens/<uid>/aluno, só uid aprovado em aluno_vinculos).
   4. Avisa o João (avisos_tokens/<uid do João>/gestao) quando chega pedido
      novo em fila_pedidos, como o "Já paguei".
   5. Anota o que foi entregue em jvtenis/avisos_enviados, para não repetir.
   6. Grava jvtenis/avisos_estado: hora da rodada e a chave PÚBLICA de push.
      Os apps leem a chave dali; a Gestão só prepara avisos com o servidor vivo.

   O aviso vai pelo padrão Web Push (o mesmo do Chrome, Safari e Firefox),
   cifrado para o aparelho (RFC 8291) e assinado com a chave VAPID do servidor
   (segredo VAPID_JWK, criado uma vez pela Action). Sem biblioteca de fora.
   Limites do plano grátis: 10 ms de processamento e 50 acessos externos por
   rodada. Por isso no máximo MAX_ENVIOS por rodada (roda a cada 2 minutos);
   o resto sai na seguinte. Para não gastar a cota de leitura do Firebase,
   baixa só os avisos que já chegaram na hora e guarda os vínculos por 30 min. */

export const MAX_ENVIOS = 6;
const DIA = 86400000;
const PEDIDO_VALE_MS = 6 * 3600000;      // pedido mais velho que isso não vira aviso
const GUARDA_ENVIADOS_MS = 4 * DIA;      // a Gestão prepara 3 dias; depois disso a anotação é apagada
const VINCULOS_MS = 30 * 60000;
// Só serviços de push conhecidos: o endereço vem do aparelho e não pode virar
// um jeito de fazer o servidor chamar qualquer site.
const HOSTS_PUSH = [/^fcm\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /(^|\.)push\.apple\.com$/, /\.notify\.windows\.com$/];

const enc = new TextEncoder();
const txt = s => enc.encode(s);
function junta(...partes) {
  const out = new Uint8Array(partes.reduce((n, p) => n + p.length, 0));
  let i = 0; for (const p of partes) { out.set(p, i); i += p.length; }
  return out;
}
export function b64uEnc(bytes) {
  let s = ''; for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function b64uDec(str) {
  const s = String(str).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s + '='.repeat((4 - s.length % 4) % 4));
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

/* ---------- Firebase (REST com o login do usuário robô) ---------- */
let SESSAO = null;      // {tok, ate, email}: o mesmo processo pode atender várias rodadas
let VINC_CACHE = null;  // {v, ate}
export function limparCache() { SESSAO = null; VINC_CACHE = null; }
async function entrarRobo(env, agora, f) {
  if (SESSAO && SESSAO.ate > agora + 60000 && SESSAO.email === env.AVISOS_EMAIL) return SESSAO.tok;
  // A chave de API do Firebase é pública (está no código dos apps). O Referer
  // é o do site: se um dia a chave for restrita a esse endereço, segue valendo.
  const r = await f('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + encodeURIComponent(env.API_KEY), {
    method: 'POST', headers: { 'content-type': 'application/json', referer: String(env.CONTATO || '').replace(/\/*$/, '/') },
    body: JSON.stringify({ email: env.AVISOS_EMAIL, password: env.AVISOS_SENHA, returnSecureToken: true })
  });
  if (!r.ok) {
    let motivo = '';
    try { motivo = String(((await r.json()).error || {}).message || '').replace(/[^A-Z_ :]/g, '').slice(0, 60); } catch (_) {}
    throw new Error('login do robô recusado (' + r.status + (motivo ? ' ' + motivo : '') + ')');
  }
  const j = await r.json();
  SESSAO = { tok: j.idToken, ate: agora + (Number(j.expiresIn) || 3600) * 1000, email: env.AVISOS_EMAIL };
  return j.idToken;
}
function urlBanco(env, caminho, tok, consulta) {
  return String(env.DB_URL).replace(/\/+$/, '') + '/jvtenis' + (caminho ? '/' + caminho : '') + '.json?auth=' + encodeURIComponent(tok) + (consulta || '');
}
async function ler(env, caminho, tok, f, consulta) {
  const r = await f(urlBanco(env, caminho, tok, consulta));
  if (!r.ok) { const e = new Error('leitura ' + caminho + ' recusada (' + r.status + ')'); e.status = r.status; throw e; }
  return (await r.json()) || {};
}
/* Só os avisos cuja hora chegou (precisa de ".indexOn": "quando" na regra).
   Se a regra ainda não tem o índice, lê tudo, como antes. */
async function lerVencidos(env, tok, f, agora) {
  try { return await ler(env, 'avisos_saida', tok, f, '&orderBy=%22quando%22&endAt=' + agora); }
  catch (e) { if (e.status === 400) return ler(env, 'avisos_saida', tok, f); throw e; }
}
async function lerVinculos(env, tok, f, agora) {
  if (VINC_CACHE && VINC_CACHE.ate > agora) return VINC_CACHE.v;
  const v = await ler(env, 'aluno_vinculos', tok, f);
  VINC_CACHE = { v, ate: agora + VINCULOS_MS };
  return v;
}

/* ---------- Web Push: cifra (RFC 8291) e assinatura VAPID (RFC 8292) ---------- */
async function hkdf(salt, ikm, info, n) {
  const k = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, k, n * 8));
}
export async function cifrar(sub, claro) {
  const uaPub = b64uDec(sub.p), auth = b64uDec(sub.a);
  const uaKey = await crypto.subtle.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const as = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPub = new Uint8Array(await crypto.subtle.exportKey('raw', as.publicKey));
  const segredo = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, as.privateKey, 256));
  const ikm = await hkdf(auth, segredo, junta(txt('WebPush: info\0'), uaPub, asPub), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, txt('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, txt('Content-Encoding: nonce\0'), 12);
  const chave = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const cifrado = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, chave, junta(claro, new Uint8Array([2]))));
  const cab = new Uint8Array(21 + asPub.length);
  cab.set(salt, 0); new DataView(cab.buffer).setUint32(16, 4096); cab[20] = asPub.length; cab.set(asPub, 21);
  return junta(cab, cifrado);
}
export async function carregarVapid(jwkTexto, contato) {
  const jwk = JSON.parse(jwkTexto);
  const chave = await crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', d: jwk.d, x: jwk.x, y: jwk.y, ext: true },
    { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const pub = b64uEnc(junta(new Uint8Array([4]), b64uDec(jwk.x), b64uDec(jwk.y)));
  return { chave, pub, sub: contato, jwts: {} };
}
async function jwtVapid(v, aud, agora) {
  if (v.jwts[aud]) return v.jwts[aud];
  const cab = b64uEnc(txt(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const corpo = b64uEnc(txt(JSON.stringify({ aud, exp: Math.floor(agora / 1000) + 12 * 3600, sub: v.sub })));
  const ass = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, v.chave, txt(cab + '.' + corpo)));
  return (v.jwts[aud] = cab + '.' + corpo + '.' + b64uEnc(ass));
}
export function enderecoValido(e) {
  try { const u = new URL(e); return u.protocol === 'https:' && HOSTS_PUSH.some(r => r.test(u.hostname)); } catch (_) { return false; }
}
async function enviarPush(sub, dados, v, agora, f) {
  if (!sub || !enderecoValido(sub.e) || !sub.p || !sub.a) return { status: 0, invalida: true };
  const corpo = await cifrar(sub, txt(JSON.stringify(dados)));
  const jwt = await jwtVapid(v, new URL(sub.e).origin, agora);
  const r = await f(sub.e, {
    method: 'POST', body: corpo,
    headers: { 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: '43200', Urgency: 'high', Authorization: 'vapid t=' + jwt + ', k=' + v.pub }
  });
  return { status: r.status, invalida: r.status === 404 || r.status === 410 };
}

/* ---------- Quem recebe o quê ---------- */
const primeiroNome = n => String(n || '').trim().split(/\s+/)[0] || 'Aluno';
export function avisoDoPedido(p) {
  const quem = primeiroNome(p && p.nome);
  if (p && p.kind === 'mensalidade') return { t: '💰 ' + quem + ' avisou pagamento da mensalidade', c: (p.metodo ? 'Forma: ' + String(p.metodo).slice(0, 40) + '. ' : '') + 'Toque para conferir e aceitar.' };
  if (p && p.kind === 'plano') return { t: '📋 ' + quem + ' pediu mudança de plano', c: 'Toque para ver o pedido.' };
  if (p && p.kind === 'compra') return { t: '🛒 ' + quem + ' quer comprar: ' + String(p.item || 'item').slice(0, 40), c: 'Toque para ver o pedido.' };
  if (p && p.kind === 'renovacao') return { t: '🗓️ ' + quem + ' quer manter os treinos', c: 'Toque para ver o pedido.' };
  return { t: '📨 Pedido novo de ' + quem, c: 'Toque para ver na Gestão.' };
}
function itemVale(it, agora, cancelados) {
  if (!it || typeof it !== 'object' || !it.t) return false;
  if (Number(it.quando) > agora) return false;
  if (it.ate && agora > Number(it.ate)) return false;
  // alvo: de quem é a aula (o aviso pode ir para o responsável da família)
  if (it.tipo === 'aula' && cancelados.has(String(it.alvo || it.cod) + '|' + it.data + '|' + it.hora)) return false;
  return true;
}

export async function rodar(env, opcoes = {}) {
  const agora = opcoes.agora || Date.now(), f = opcoes.fetch || fetch;
  if (!env.AVISOS_EMAIL || !env.AVISOS_SENHA || !env.VAPID_JWK || !env.DB_URL || !env.API_KEY) return { ok: false, motivo: 'segredos ou endereço do banco ausentes' };
  const vapid = await carregarVapid(env.VAPID_JWK, env.CONTATO || 'https://joaovictorteniscoach-cpu.github.io');
  const tok = await entrarRobo(env, agora, f);
  const [saida, vinculos, tokens, enviados, pedidos, fila] = await Promise.all([lerVencidos(env, tok, f, agora), lerVinculos(env, tok, f, agora)].concat(
    ['avisos_tokens', 'avisos_enviados', 'fila_pedidos', 'fila_agendamentos'].map(c => ler(env, c, tok, f))));

  const porCodigo = {};
  for (const [uid, v] of Object.entries(vinculos)) {
    if (v && v.ativo === true && v.codigo != null) (porCodigo[String(v.codigo)] = porCodigo[String(v.codigo)] || []).push(uid);
  }
  const cancelados = new Set(Object.values(fila).filter(p => p && p.acao === 'cancelar').map(p => String(p.codigo) + '|' + p.data + '|' + p.hora));
  const destinos = it => it.para === 'joao'
    ? [[env.ADMIN_UID, 'gestao']]
    : (porCodigo[String(it.cod)] || []).map(uid => [uid, 'aluno']);

  const fila_envio = [];
  for (const [id, it] of Object.entries(saida)) {
    if (!enviados[id] && itemVale(it, agora, cancelados)) fila_envio.push({ id, it });
  }
  for (const [key, p] of Object.entries(pedidos)) {
    const id = 'p_' + key;
    if (enviados[id] || !p || !(agora - Number(p.ts) <= PEDIDO_VALE_MS)) continue;
    fila_envio.push({ id, it: Object.assign({ para: 'joao', quando: Number(p.ts), g: 'pedido' }, avisoDoPedido(p)) });
  }
  fila_envio.sort((x, y) => (Number(x.it.quando) || 0) - (Number(y.it.quando) || 0));

  const upd = {}, res = { ok: true, entregues: 0, semAparelho: 0, removidos: 0, adiados: 0, falhas: 0 };
  let envios = 0;
  const saiu = new Set(); // aparelho que o serviço de push disse que não existe mais
  /* A entrega é anotada por APARELHO (avisos_enviados/<aviso>~<uid>~<app>):
     se um recebe e o outro dá erro passageiro (429, serviço fora), só o que
     falhou tenta de novo na rodada seguinte. O aviso inteiro só fecha
     (avisos_enviados/<aviso>) quando não sobra aparelho por entregar. */
  const chaveAparelho = (id, a) => id + '~' + a.uid + '~' + a.app;
  for (const { id, it } of fila_envio) {
    const todos = destinos(it).map(([uid, app]) => ({ uid, app, sub: tokens[uid] && tokens[uid][app] })).filter(x => x.sub && !saiu.has(x.uid + '/' + x.app));
    if (!todos.length) { upd['avisos_enviados/' + id] = agora; res.semAparelho++; continue; }
    const alvos = todos.filter(a => !enviados[chaveAparelho(id, a)]);
    if (!alvos.length) { upd['avisos_enviados/' + id] = agora; continue; }   // todos já tinham recebido
    // Limite por aparelho, não por aviso: um aviso com 7 aparelhos manda 6
    // agora e o 7º na próxima rodada.
    const vez = alvos.slice(0, Math.max(0, MAX_ENVIOS - envios));
    if (!vez.length) { res.adiados++; continue; }
    const dados = { t: String(it.t).slice(0, 120), c: String(it.c || '').slice(0, 300), g: String(it.g || it.tipo || 'jvtenis').slice(0, 60) };
    let algum = false, pendente = vez.length < alvos.length;
    for (const a of vez) {
      envios++;
      let r;
      try { r = await enviarPush(a.sub, dados, vapid, agora, f); } catch (_) { r = { status: -1 }; }
      if (r.status >= 200 && r.status < 300) { algum = true; upd['avisos_enviados/' + chaveAparelho(id, a)] = agora; }
      else if (r.invalida) { upd['avisos_tokens/' + a.uid + '/' + a.app] = null; saiu.add(a.uid + '/' + a.app); res.removidos++; }
      else { pendente = true; res.falhas++; }   // passageira: só este aparelho tenta de novo
    }
    if (algum) res.entregues++;
    if (pendente) { if (vez.length < alvos.length) res.adiados++; }
    else upd['avisos_enviados/' + id] = agora;
  }
  for (const [id, ts] of Object.entries(enviados)) if (agora - Number(ts) > GUARDA_ENVIADOS_MS) upd['avisos_enviados/' + id] = null;
  upd.avisos_estado = { ts: agora, chave: vapid.pub, entregues: res.entregues, adiados: res.adiados, falhas: res.falhas };
  const r = await f(urlBanco(env, '', tok), { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(upd) });
  if (!r.ok) throw new Error('gravação recusada (' + r.status + ')');
  return res;
}

export default {
  async scheduled(_ev, env, ctx) {
    ctx.waitUntil(rodar(env).then(r => console.log(JSON.stringify(r)), e => console.error('avisos: ' + (e && e.message))));
  },
  // Sem endereço público (workers_dev = false); se um dia tiver, só diz que está no ar.
  async fetch() {
    return new Response('{"ok":true,"servico":"avisos JV Tenis"}', { headers: { 'content-type': 'application/json' } });
  }
};
