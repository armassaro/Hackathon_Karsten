// Chamadas assinadas ao Google Apps Script.
// Cada requisição leva actor (e-mail autenticado), timestamp e nonce, assinados com HMAC-SHA256.
// O Apps Script rejeita assinatura inválida, requisição com mais de 60 s e nonce repetido.
import crypto from 'node:crypto';
import { config } from '../config.js';

export function assinar(base, segredo = config.gasSecret) {
  return crypto.createHmac('sha256', segredo).update(base, 'utf8').digest('base64');
}

export async function chamarGoogle(action, data = {}, actor = 'sistema') {
  const base = JSON.stringify({ action, data, actor, ts: Date.now(), nonce: crypto.randomUUID() });
  const sig = assinar(base);

  const controle = new AbortController();
  const timeout = setTimeout(() => controle.abort(), 25_000);
  let resposta;
  try {
    resposta = await fetch(config.gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // evita preflight no Apps Script
      body: JSON.stringify({ base, sig }),
      redirect: 'follow',
      signal: controle.signal,
    });
  } catch (e) {
    throw new Error(`Google Apps Script indisponível (${e.name === 'AbortError' ? 'tempo esgotado' : e.message}).`);
  } finally {
    clearTimeout(timeout);
  }

  const texto = await resposta.text();
  let json;
  try {
    json = JSON.parse(texto);
  } catch {
    throw new Error('Resposta inesperada do Apps Script. Confira se a implantação está como "Qualquer pessoa" e a URL termina em /exec.');
  }
  if (json.erro) throw new Error(`Apps Script: ${json.erro}`);
  return json.resultado;
}
