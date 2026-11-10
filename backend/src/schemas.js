// Validação de entrada com Zod. Números aceitam vírgula decimal ("0,0964").
import { z } from 'zod';
import { paraNumero } from './core/util.js';

const numero = (msg) => z.preprocess((v) => (v === '' || v === null ? undefined : paraNumero(v)), z.number({ error: msg }));
const texto = (max = 200) => z.string().trim().max(max);

export const maquinaSchema = z.object({
  codigo: z.preprocess((v) => String(v ?? '').trim(), z.string().min(1, 'Código obrigatório.').max(20)),
  tipo: texto(60).min(1, 'Tipo obrigatório (ex.: Interlock, Reta).'),
  descricao: texto(120).default(''),
  rpm: numero('RPM deve ser numérico.').pipe(z.number().positive('RPM deve ser maior que zero.')),
  tempo_por_metro: numero('Tempo/metro deve ser numérico.').pipe(z.number().positive('Tempo/metro deve ser maior que zero.')),
});

export const mtmSchema = z.object({
  codigo: z.preprocess((v) => String(v ?? '').trim().replace(',', '.'), z.string().regex(/^\d+\.\d+$/, 'Código MTM no formato agrupador.elemento (ex.: 2.1).')),
  descricao: texto(200).min(1, 'Descrição obrigatória.'),
  tempo_min: numero('Tempo deve ser numérico.').pipe(z.number().min(0, 'Tempo não pode ser negativo.')),
});

export const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
});

export const codigoSchema = emailSchema.extend({
  codigo: z.string().trim().regex(/^\d{6}$/, 'O código tem 6 dígitos.'),
});

export const usuarioSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
  nome: texto(120).min(1, 'Nome obrigatório.'),
  papel: z.enum(['leitor', 'engenheiro', 'admin'], { error: 'Papel deve ser leitor, engenheiro ou admin.' }),
  ativo: z.boolean().default(true),
});

export const tokenSchema = z.object({
  nome: texto(60).min(1, 'Dê um nome ao token (ex.: "Script de lote da Engenharia").'),
  papel: z.enum(['leitor', 'engenheiro'], { error: 'Tokens podem ter papel leitor ou engenheiro.' }),
});
