// Envio das Fichas PO em PDF ao Apps Script do Google Drive (apps-script-drive/Code.gs).
import crypto from 'node:crypto';
import { config } from '../config.js';
import { chamarAppsScript } from './googleClient.js';

export const driveConfigurado = () => !!(config.gasDriveUrl && config.gasDriveSecret);

/** "%PDF-" no início do arquivo. */
export const parecePdf = (buf) => buf.length > 5 && buf.subarray(0, 5).toString('latin1') === '%PDF-';

/** Data/hora de Brasília para o nome do arquivo: 2026-11-13_14h05m09s. */
function carimbo(data = new Date()) {
  const t = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'medium' }).format(data);
  const [dia, hora] = t.split(' ');
  const [h, m, s] = hora.split(':');
  return `${dia}_${h}h${m}m${s}s`;
}

/** Nome do PDF a partir dos dados recalculados no servidor (sem acentos nem caracteres especiais). */
export function nomePdf(cabecalho, data) {
  const limpo = (t, padrao) => (String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60) || padrao);
  return `${limpo(cabecalho.titulo, 'PO')}_rev${limpo(cabecalho.revisao, '00')}_${carimbo(data)}.pdf`;
}

/**
 * Assina e envia o PDF. A assinatura HMAC cobre nome, tamanho e SHA-256 do arquivo;
 * o Apps Script recalcula o hash e rejeita qualquer PDF que não confira.
 */
export function guardarFichaNoDrive({ pdf, nome, descricao, actor }) {
  return chamarAppsScript({
    url: config.gasDriveUrl,
    segredo: config.gasDriveSecret,
    action: 'guardarFichaPdf',
    data: { nome, descricao, tamanho: pdf.length, sha256: crypto.createHash('sha256').update(pdf).digest('hex') },
    actor,
    extras: { pdf: pdf.toString('base64') },
    timeoutMs: 60_000,
  });
}
