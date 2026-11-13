// Configuração única, lida das variáveis de ambiente (.env). Nenhum segredo no código.
import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = process.env;

export const config = {
  porta: Number(env.PORT || 3000),
  producao: env.NODE_ENV === 'production',

  // "google" = Apps Script + Google Sheets + e-mail (arquitetura alvo)
  // "local"  = arquivo JSON + código de login no console (contingência / desenvolvimento)
  modo: (env.STORE || 'local').toLowerCase(),

  jwtSecret: env.JWT_SECRET || '',
  sessaoHoras: Number(env.SESSAO_HORAS || 8),

  gasUrl: env.GAS_URL || '',
  gasSecret: env.GAS_SECRET || '',

  // Apps Script dedicado a guardar as fichas em PDF no Google Drive (funciona em qualquer STORE).
  gasDriveUrl: env.GAS_DRIVE_URL || '',
  gasDriveSecret: env.GAS_DRIVE_SECRET || '',

  adminEmail: (env.ADMIN_EMAIL || '').toLowerCase(),
  origemFrontend: env.ORIGEM_FRONTEND || '',
  // Só para ensaio local: mostra o código de login na própria tela. NUNCA em produção.
  exibirCodigoNaTela: env.DEV_EXIBIR_CODIGO === 'true' && (env.STORE || 'local') === 'local',

  caminhos: {
    raiz,
    dados: path.join(raiz, 'data'),
    entradasPadrao: path.join(raiz, 'data', 'Entradas.ods'),
    bancoLocal: env.DB_LOCAL ? path.resolve(env.DB_LOCAL) : path.join(raiz, 'data', 'db.local.json'),
    frontend: path.resolve(raiz, '..', 'frontend', 'dist'),
  },
};

export function validarConfig() {
  const erros = [];
  if (config.jwtSecret.length < 32) erros.push('JWT_SECRET ausente ou curto (mínimo 32 caracteres).');
  if (!['local', 'google'].includes(config.modo)) erros.push('STORE deve ser "local" ou "google".');
  if (config.modo === 'google' && (!config.gasUrl || config.gasSecret.length < 32)) {
    erros.push('Modo google exige GAS_URL e GAS_SECRET (mínimo 32 caracteres).');
  }
  if (config.gasDriveUrl || config.gasDriveSecret) {
    if (!config.gasDriveUrl || config.gasDriveSecret.length < 32) erros.push('Google Drive exige GAS_DRIVE_URL e GAS_DRIVE_SECRET (mínimo 32 caracteres).');
    else if (!/^https:\/\//.test(config.gasDriveUrl) && !/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(config.gasDriveUrl)) erros.push('GAS_DRIVE_URL deve usar https://.');
    if (config.gasDriveSecret && config.gasDriveSecret === config.gasSecret) erros.push('GAS_DRIVE_SECRET deve ser diferente de GAS_SECRET.');
  }
  if (config.modo === 'local' && !config.adminEmail) erros.push('Modo local exige ADMIN_EMAIL (primeiro administrador).');
  if (erros.length) throw new Error('Configuração inválida:\n - ' + erros.join('\n - '));
}
