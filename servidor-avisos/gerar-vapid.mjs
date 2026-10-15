/* Cria o par de chaves de push (VAPID) do servidor de avisos. A Action roda
   isto só na primeira publicação e manda a saída direto para os segredos da
   Cloudflare (VAPID_JWK). Nada é gravado em arquivo nem aparece no registro.
   A chave pública o próprio servidor publica em jvtenis/avisos_estado. */
const par = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const j = await crypto.subtle.exportKey('jwk', par.privateKey);
process.stdout.write(JSON.stringify({ kty: 'EC', crv: 'P-256', d: j.d, x: j.x, y: j.y }));
