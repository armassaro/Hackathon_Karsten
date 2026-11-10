// Códigos de acesso de 6 dígitos (login sem senha).
// Guardamos apenas o HMAC do código, com validade de 10 minutos e no máximo 5 tentativas.
import crypto from 'node:crypto';
import { config } from '../config.js';

const VALIDADE_MS = 10 * 60_000;
const MAX_TENTATIVAS = 5;
const INTERVALO_REENVIO_MS = 30_000;

const pendentes = new Map(); // email -> { hash, expira, tentativas, criadoEm }

const hash = (email, codigo) => crypto.createHmac('sha256', config.jwtSecret).update(`${email}:${codigo}`).digest('hex');

export function gerarCodigo(email) {
  const atual = pendentes.get(email);
  if (atual && Date.now() - atual.criadoEm < INTERVALO_REENVIO_MS) {
    const espera = Math.ceil((INTERVALO_REENVIO_MS - (Date.now() - atual.criadoEm)) / 1000);
    const e = new Error(`Aguarde ${espera} s para pedir um novo código.`);
    e.status = 429;
    throw e;
  }
  const codigo = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  pendentes.set(email, { hash: hash(email, codigo), expira: Date.now() + VALIDADE_MS, tentativas: 0, criadoEm: Date.now() });
  return codigo;
}

/** Retorna true se o código confere. Consome o código em caso de sucesso, expiração ou excesso de tentativas. */
export function verificarCodigo(email, codigo) {
  const p = pendentes.get(email);
  if (!p) return false;
  if (Date.now() > p.expira || p.tentativas >= MAX_TENTATIVAS) { pendentes.delete(email); return false; }
  p.tentativas++;
  const ok = crypto.timingSafeEqual(Buffer.from(p.hash), Buffer.from(hash(email, String(codigo).trim())));
  if (ok) pendentes.delete(email);
  return ok;
}

// Limpeza periódica de códigos vencidos.
setInterval(() => {
  const agora = Date.now();
  for (const [email, p] of pendentes) if (agora > p.expira) pendentes.delete(email);
}, 60_000).unref();
