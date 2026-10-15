/* Servidor de avisos (servidor-avisos/avisos.js) sem rede e sem segredo real.
   Banco, login Google e serviços de push são simulados. A cifra é conferida
   com uma implementação independente (node:crypto + HKDF feito à mão): se o
   aparelho não conseguir abrir o aviso, o teste falha. Só dados fictícios. */
import assert from 'node:assert/strict';
import nodeCrypto from 'node:crypto';
import { rodar, limparCache, MAX_ENVIOS, avisoDoPedido, enderecoValido, b64uEnc, b64uDec } from '../servidor-avisos/avisos.js';

let checks = 0;
async function check(nome, fn) { await fn(); checks++; console.log('✅ ' + nome); }

const AGORA = Date.parse('2026-10-15T22:00:00Z'); // 19:00 em Curitiba
const H = 3600000;
const ADMIN = 'uid-joao-teste';
const ROBO = { email: 'avisos@projeto-ficticio.firebaseapp.com', senha: 'senha-ficticia-de-teste-123' };
const LOGIN = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=chave-publica-ficticia';
const vapidPar = nodeCrypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
const VAPID_JWK = vapidPar.privateKey.export({ format: 'jwk' });

function aparelho(endpoint) {
  const ecdh = nodeCrypto.createECDH('prime256v1'); ecdh.generateKeys();
  const auth = nodeCrypto.randomBytes(16);
  return { ecdh, auth, sub: { e: endpoint, p: b64uEnc(ecdh.getPublicKey()), a: b64uEnc(auth), ts: AGORA - 5 * H } };
}
const hmac = (k, d) => nodeCrypto.createHmac('sha256', k).update(d).digest();
function decifrar(corpo, ap) {
  const b = Buffer.from(corpo);
  const salt = b.subarray(0, 16), idlen = b[20], asPub = b.subarray(21, 21 + idlen), ct = b.subarray(21 + idlen);
  assert.equal(b.readUInt32BE(16), 4096); assert.equal(idlen, 65);
  const uaPub = ap.ecdh.getPublicKey();
  const segredo = ap.ecdh.computeSecret(asPub);
  const ikm = hmac(hmac(ap.auth, segredo), Buffer.concat([Buffer.from('WebPush: info\0'), uaPub, asPub, Buffer.from([1])]));
  const prk = hmac(salt, ikm);
  const cek = hmac(prk, Buffer.concat([Buffer.from('Content-Encoding: aes128gcm\0'), Buffer.from([1])])).subarray(0, 16);
  const nonce = hmac(prk, Buffer.concat([Buffer.from('Content-Encoding: nonce\0'), Buffer.from([1])])).subarray(0, 12);
  const d = nodeCrypto.createDecipheriv('aes-128-gcm', cek, nonce);
  d.setAuthTag(ct.subarray(ct.length - 16));
  const claro = Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]);
  assert.equal(claro[claro.length - 1], 2, 'delimitador do último registro');
  return JSON.parse(claro.subarray(0, claro.length - 1).toString('utf8'));
}
function verificarJwt(jwt, chavePublica, alg) {
  const [c, p, s] = jwt.split('.');
  const ok = nodeCrypto.verify('sha256', Buffer.from(c + '.' + p), alg === 'ES256' ? { key: chavePublica, dsaEncoding: 'ieee-p1363' } : chavePublica, b64uDec(s));
  assert.ok(ok, 'assinatura ' + alg + ' confere');
  return { cab: JSON.parse(Buffer.from(b64uDec(c)).toString()), corpo: JSON.parse(Buffer.from(b64uDec(p)).toString()) };
}

function cenario(extra = {}) {
  const ana = aparelho('https://fcm.googleapis.com/fcm/send/ana-1');
  const anaIphone = aparelho('https://web.push.apple.com/ana-2');
  const beto = aparelho('https://updates.push.services.mozilla.com/wpush/v2/beto');
  const joao = aparelho('https://fcm.googleapis.com/fcm/send/joao');
  const intruso = aparelho('https://fcm.googleapis.com/fcm/send/intruso');
  const banco = {
    avisos_saida: {
      a_6601_20261016_1800: { cod: '6601', tipo: 'aula', data: '2026-10-16', hora: '18:00', quando: AGORA - 10 * 60000, ate: AGORA + 22 * H, t: '🎾 Aula amanhã às 18:00', c: 'Se não puder ir, cancele pelo app até 4 horas antes.', g: 'aula' },
      a_6601_20261017_0900: { cod: '6601', tipo: 'aula', data: '2026-10-17', hora: '09:00', quando: AGORA + 24 * H, ate: AGORA + 37 * H, t: 'futuro', c: '' },
      a_6602_20261016_0700: { cod: '6602', tipo: 'aula', data: '2026-10-16', hora: '07:00', quando: AGORA - H, ate: AGORA + 11 * H, t: '🎾 Aula amanhã às 07:00', c: 'x' },
      a_6602_20261016_1100: { cod: '6602', tipo: 'aula', data: '2026-10-16', hora: '11:00', quando: AGORA - H, ate: AGORA + 15 * H, t: 'cancelada no app', c: 'x' },
      a_6601_6602_20261016_1100: { cod: '6601', alvo: '6602', tipo: 'aula', data: '2026-10-16', hora: '11:00', quando: AGORA - H, ate: AGORA + 15 * H, t: 'aula do dependente cancelada', c: 'x' },
      v_6603_202610_3: { cod: '6603', tipo: 'venc', quando: AGORA - 2 * H, ate: AGORA + 2 * DIA(), t: 'Mensalidade vence em 3 dias', c: '' },
      sem_hora: { cod: '6601', tipo: 'venc', t: 'item sem hora vai já', c: '' },
      e_6601_20261015_2100: { cod: '6601', tipo: 'espera', quando: 0, ate: AGORA - 60000, t: 'vaga que já passou', c: '' },
      ja_foi: { cod: '6601', tipo: 'aula', quando: AGORA - H, t: 'já enviado', c: '' }
    },
    avisos_tokens: {
      'uid-ana': { aluno: ana.sub }, 'uid-ana-iphone': { aluno: anaIphone.sub }, 'uid-beto': { aluno: beto.sub },
      [ADMIN]: { gestao: joao.sub }, 'uid-intruso': { aluno: intruso.sub }
    },
    aluno_vinculos: {
      'uid-ana': { codigo: '6601', ativo: true, nome: 'Aluna Fictícia' }, 'uid-ana-iphone': { codigo: 6601, ativo: true },
      'uid-beto': { codigo: '6602', ativo: true }, 'uid-intruso': { codigo: '6601', ativo: false }
    },
    avisos_enviados: { ja_foi: AGORA - 2 * H, velho: AGORA - 5 * DIA() },
    fila_pedidos: {
      '-Np1': { kind: 'mensalidade', metodo: 'Pix', valor: 640, nome: 'Carla Fictícia Souza', codigo: '6603', ts: AGORA - 20 * 60000 },
      '-Np0': { kind: 'mensalidade', metodo: 'Pix', valor: 640, nome: 'Antigo', codigo: '6604', ts: AGORA - 7 * H }
    },
    fila_agendamentos: { '-Nc1': { acao: 'cancelar', codigo: '6602', data: '2026-10-16', hora: '11:00' } }
  };
  Object.assign(banco, extra.banco || {});
  return { ana, anaIphone, beto, joao, intruso, banco };
}
function DIA() { return 24 * H; }

function simular(banco, respostaPush = () => 201, semIndice = false, loginRecusado = false) {
  const chamadas = [], pushes = [], patches = [], consultas = [];
  const f = async (url, op = {}) => {
    chamadas.push(url);
    if (url === LOGIN) {
      chamadas.login = { corpo: JSON.parse(op.body), cab: op.headers };
      if (loginRecusado) return new Response(JSON.stringify({ error: { message: 'INVALID_LOGIN_CREDENTIALS' } }), { status: 400 });
      return new Response(JSON.stringify({ idToken: 'tok-teste', expiresIn: '3600', localId: 'uid-robo' }), { status: 200 });
    }
    const u = new URL(url);
    if (u.hostname.endsWith('firebaseio.com')) {
      assert.equal(u.searchParams.get('auth'), 'tok-teste');
      assert.equal(u.searchParams.get('access_token'), null);
      const cam = u.pathname.replace(/^\/jvtenis\/?/, '').replace(/\.json$/, '');
      if (op.method === 'PATCH') { patches.push(JSON.parse(op.body)); return new Response('{}', { status: 200 }); }
      let val = banco[cam] === undefined ? null : banco[cam];
      if (u.searchParams.get('orderBy')) {
        consultas.push(cam);
        if (semIndice) return new Response('{"error":"Index not defined"}', { status: 400 });
        assert.equal(u.searchParams.get('orderBy'), '"quando"');
        const ate = Number(u.searchParams.get('endAt'));
        val = Object.fromEntries(Object.entries(val || {}).filter(([, it]) => it.quando == null || Number(it.quando) <= ate)); // sem o campo vem primeiro, como no Firebase
      }
      return new Response(JSON.stringify(val), { status: 200 });
    }
    pushes.push({ url, op });
    return new Response('', { status: respostaPush(url) });
  };
  return { f, chamadas, pushes, patches, consultas };
}
const ENV = { AVISOS_EMAIL: ROBO.email, AVISOS_SENHA: ROBO.senha, API_KEY: 'chave-publica-ficticia', VAPID_JWK: JSON.stringify(VAPID_JWK), DB_URL: 'https://projeto-ficticio-default-rtdb.firebaseio.com', ADMIN_UID: ADMIN, CONTATO: 'https://exemplo.invalid' };

await check('sem segredos não acessa nada e diz o motivo', async () => {
  const fonte = (await import('node:fs')).readFileSync(new URL('../servidor-avisos/avisos.js', import.meta.url), 'utf8');
  assert.doesNotMatch(fonte, /\bimport\b|require\(/, 'servidor sem biblioteca de fora');
  const s = simular({});
  const r = await rodar({ DB_URL: ENV.DB_URL }, { agora: AGORA, fetch: s.f });
  assert.equal(r.ok, false); assert.equal(s.chamadas.length, 0);
});

let rodada;
await check('entra no Firebase como usuário robô (e-mail e senha) e usa o login dele em toda leitura e gravação', async () => {
  limparCache();
  const c = cenario(), s = simular(c.banco);
  const r = await rodar(ENV, { agora: AGORA, fetch: s.f });
  rodada = { c, s, r };
  assert.deepEqual(s.chamadas.login.corpo, { email: ROBO.email, password: ROBO.senha, returnSecureToken: true });
  assert.equal(s.chamadas.login.cab.referer, 'https://exemplo.invalid/');
  assert.equal(s.chamadas.filter(u => u === LOGIN).length, 1, 'um login por rodada');
  assert.ok(!s.chamadas.some(u => /oauth2|googleapis\.com\/token/.test(u)), 'sem conta de serviço');
});

await check('login recusado: para sem gravar nada e sem mostrar a senha no erro', async () => {
  limparCache();
  const c = cenario(), s = simular(c.banco, () => 201, false, true);
  await assert.rejects(rodar(ENV, { agora: AGORA, fetch: s.f }), e => {
    assert.match(e.message, /login do robô recusado \(400 INVALID_LOGIN_CREDENTIALS\)/);
    assert.ok(!e.message.includes(ROBO.senha) && !e.message.includes(ROBO.email));
    return true;
  });
  assert.equal(s.pushes.length + s.patches.length, 0);
});

await check('aula amanhã chega aos dois aparelhos aprovados da aluna e a nenhum outro', async () => {
  const { c, s } = rodada;
  const urls = s.pushes.map(p => p.url);
  const daAna = [];
  for (const p of s.pushes.filter(p => [c.ana, c.anaIphone].some(ap => ap.sub.e === p.url))) {
    const ap = [c.ana, c.anaIphone].find(x => x.sub.e === p.url);
    daAna.push(Object.assign({ url: p.url }, decifrar(new Uint8Array(await new Response(p.op.body).arrayBuffer()), ap)));
  }
  const daAula = daAna.filter(d => d.t === '🎾 Aula amanhã às 18:00');
  assert.equal(daAula.length, 2); assert.ok(daAula.every(d => d.g === 'aula'));
  assert.equal(new Set(daAula.map(d => d.url)).size, 2, 'um em cada aparelho');
  assert.ok(!urls.includes(c.intruso.sub.e), 'aparelho com vínculo desligado não recebe');
});

await check('cabeçalhos Web Push: aes128gcm, TTL, e VAPID ES256 com o destino certo e a chave pública', async () => {
  const { c, s } = rodada;
  const p = s.pushes.find(x => x.url === c.anaIphone.sub.e);
  assert.equal(p.op.headers['Content-Encoding'], 'aes128gcm'); assert.equal(p.op.headers.TTL, '43200');
  const m = /^vapid t=([^,]+), k=(.+)$/.exec(p.op.headers.Authorization);
  assert.ok(m, 'formato vapid t=…, k=…');
  const pubEsperada = b64uEnc(Buffer.concat([Buffer.from([4]), b64uDec(VAPID_JWK.x), b64uDec(VAPID_JWK.y)]));
  assert.equal(m[2], pubEsperada);
  const { cab, corpo } = verificarJwt(m[1], vapidPar.publicKey, 'ES256');
  assert.equal(cab.alg, 'ES256'); assert.equal(corpo.aud, 'https://web.push.apple.com');
  assert.equal(corpo.sub, 'https://exemplo.invalid');
  assert.ok(corpo.exp * 1000 - AGORA <= 24 * H, 'validade de no máximo 24 h (exigência da Apple)');
});

await check('não manda: aviso do futuro, aviso vencido, aula com cancelamento na fila, já enviado', async () => {
  const { c, s } = rodada;
  const textos = [];
  for (const p of s.pushes) {
    const ap = [c.ana, c.anaIphone, c.beto, c.joao].find(x => x.sub.e === p.url);
    textos.push(decifrar(new Uint8Array(await new Response(p.op.body).arrayBuffer()), ap).t);
  }
  for (const t of ['futuro', 'vaga que já passou', 'cancelada no app', 'aula do dependente cancelada', 'já enviado']) assert.ok(!textos.includes(t), t);
  assert.ok(textos.includes('🎾 Aula amanhã às 07:00'), 'a aula não cancelada do mesmo aluno vai');
});

await check('João recebe o "Já paguei" recente, sem valor, e não o pedido antigo', async () => {
  const { c, s } = rodada;
  const doJoao = s.pushes.filter(p => p.url === c.joao.sub.e);
  assert.equal(doJoao.length, 1);
  const d = decifrar(new Uint8Array(await new Response(doJoao[0].op.body).arrayBuffer()), c.joao);
  assert.equal(d.t, '💰 Carla avisou pagamento da mensalidade');
  assert.doesNotMatch(JSON.stringify(d), /640|R\$/);
});

await check('anota o que foi entregue, o que não tem aparelho e apaga anotação velha, numa gravação só', async () => {
  const { s, r } = rodada;
  assert.equal(s.patches.length, 1);
  const u = s.patches[0];
  assert.equal(u['avisos_enviados/a_6601_20261016_1800'], AGORA);
  assert.equal(u['avisos_enviados/a_6602_20261016_0700'], AGORA);
  assert.equal(u['avisos_enviados/v_6603_202610_3'], AGORA, 'sem aparelho: anota para não tentar sempre');
  assert.equal(u['avisos_enviados/p_-Np1'], AGORA);
  assert.equal(u['avisos_enviados/velho'], null);
  assert.ok(!('avisos_enviados/a_6601_20261017_0900' in u));
  assert.ok(!('avisos_enviados/a_6602_20261016_1100' in u), 'cancelada na fila fica para a Gestão decidir');
  assert.ok(Object.keys(u).every(k => /^avisos_(enviados|tokens)\/|^avisos_estado$/.test(k)), 'só mexe nos caminhos de avisos');
  const pubEsperada = b64uEnc(Buffer.concat([Buffer.from([4]), b64uDec(VAPID_JWK.x), b64uDec(VAPID_JWK.y)]));
  assert.deepEqual(u.avisos_estado, { ts: AGORA, chave: pubEsperada, entregues: 4, adiados: 0, falhas: 0 }, 'estado com a chave pública, sem a privada');
  assert.doesNotMatch(JSON.stringify(u), new RegExp(VAPID_JWK.d), 'a chave privada nunca vai para o banco');
  assert.deepEqual([r.entregues, r.semAparelho], [4, 1]);
  assert.deepEqual(s.consultas, ['avisos_saida'], 'baixa só os avisos que já chegaram na hora');
});

await check('regra ainda sem índice: lê a fila inteira e continua igual', async () => {
  limparCache();
  const c = cenario(), s = simular(c.banco, () => 201, true);
  const r = await rodar(ENV, { agora: AGORA, fetch: s.f });
  assert.equal(r.entregues, 4);
  assert.equal(s.patches[0]['avisos_enviados/a_6601_20261017_0900'], undefined, 'o aviso do futuro continua esperando');
});

await check('vínculos ficam guardados 30 minutos entre rodadas (economiza a cota do Firebase)', async () => {
  limparCache();
  const c = cenario();
  const s1 = simular(c.banco); await rodar(ENV, { agora: AGORA, fetch: s1.f });
  const s2 = simular(c.banco); await rodar(ENV, { agora: AGORA + 2 * 60000, fetch: s2.f });
  const s3 = simular(c.banco); await rodar(ENV, { agora: AGORA + 31 * 60000, fetch: s3.f });
  const leu = s => s.chamadas.filter(u => u.includes('/aluno_vinculos.json')).length;
  assert.deepEqual([leu(s1), leu(s2), leu(s3)], [1, 0, 1]);
  assert.equal(s2.chamadas.filter(u => u === LOGIN).length, 0, 'o login do robô também é reaproveitado');
});

await check('aparelho que saiu (410) é apagado; falha passageira (500) tenta de novo na próxima rodada', async () => {
  limparCache();
  const c = cenario(), s = simular(c.banco, url => url === c.ana.sub.e ? 410 : url === c.beto.sub.e ? 500 : 201);
  const r = await rodar(ENV, { agora: AGORA, fetch: s.f });
  const u = s.patches[0];
  assert.equal(u['avisos_tokens/uid-ana/aluno'], null);
  assert.equal(u['avisos_enviados/a_6601_20261016_1800'], AGORA, 'o iPhone recebeu');
  assert.ok(!('avisos_enviados/a_6602_20261016_0700' in u), 'só falha passageira: não anota');
  assert.equal(r.removidos, 1); assert.equal(r.falhas, 1);
});

await check('endereço fora dos serviços de push não é chamado e é apagado', async () => {
  limparCache();
  const c = cenario();
  c.banco.avisos_tokens['uid-beto'].aluno = Object.assign({}, c.beto.sub, { e: 'https://site-qualquer.example/coletar' });
  const s = simular(c.banco);
  await rodar(ENV, { agora: AGORA, fetch: s.f });
  assert.ok(!s.chamadas.some(u => u.includes('site-qualquer')));
  assert.equal(s.patches[0]['avisos_tokens/uid-beto/aluno'], null);
  assert.equal(enderecoValido('http://fcm.googleapis.com/x'), false);
  assert.equal(enderecoValido('https://fcm.googleapis.com.evil.example/x'), false);
});

await check('no máximo ' + MAX_ENVIOS + ' envios por rodada; o resto fica para a próxima', async () => {
  limparCache();
  const c = cenario();
  for (let i = 0; i < 30; i++) c.banco.avisos_saida['lote_' + i] = { cod: '6602', tipo: 'venc', quando: AGORA - H + i, t: 'Lote ' + i, c: '' };
  const s = simular(c.banco);
  const r = await rodar(ENV, { agora: AGORA, fetch: s.f });
  assert.equal(s.pushes.length, MAX_ENVIOS);
  assert.ok(r.adiados > 0);
  assert.ok(s.chamadas.length <= 50, 'cabe no limite de 50 acessos do plano grátis: ' + s.chamadas.length);
});

await check('processamento cabe no plano grátis (medido aqui; a Cloudflare limita 10 ms)', async () => {
  limparCache();
  const c = cenario();
  for (let i = 0; i < 30; i++) c.banco.avisos_saida['lote_' + i] = { cod: '6602', tipo: 'venc', quando: AGORA - H + i, t: 'Lote ' + i, c: '' };
  const s = simular(c.banco);
  await rodar(ENV, { agora: AGORA, fetch: s.f }); // aquece
  limparCache();
  const s2 = simular(c.banco), t0 = process.cpuUsage();
  await rodar(ENV, { agora: AGORA, fetch: s2.f });
  const ms = (process.cpuUsage(t0).user + process.cpuUsage(t0).system) / 1000;
  console.log('   CPU de uma rodada com ' + MAX_ENVIOS + ' envios, contando o simulador: ' + ms.toFixed(1) + ' ms');
  assert.ok(ms < 60, 'rodada pesada demais: ' + ms + ' ms');
});

await check('aviso de pedido nunca cita valor nem desconto', async () => {
  for (const p of [{ kind: 'mensalidade', metodo: 'cartão', valor: 640, nome: 'X' }, { kind: 'plano', valor: 900, nome: 'Y' }, { kind: 'compra', item: 'Aula avulsa', valor: 170, nome: 'Z' }, { kind: 'descontoRepos', valor: 100, nome: 'W' }]) {
    assert.doesNotMatch(JSON.stringify(avisoDoPedido(p)), /\d{3}|R\$|desconto/i);
  }
});

console.log('\n✅ ' + checks + ' verificações · servidor de avisos');
