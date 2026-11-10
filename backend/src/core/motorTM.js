// Motor de cálculo T&M — funções puras, sem I/O, 100% testáveis.
//
// Regras do regulamento (item 3.3):
//   Tempo FIXO (min) = Perímetro de Costura (m) × Tempo/Metro da Máquina
//   TP (min)         = FIXO + Σ tempos MTM
// A ficha gabarito também tem a coluna "Frequência"; cada linha entra no TP
// como tempo × frequência (com frequência 1 o resultado é a soma simples).

import { arredondar } from './util.js';

export const CASAS_DECIMAIS = 4;     // gabarito: 6,96 × 0,0964 = 0,670944 -> 0,6709
export const FAIXA_RPM = 0.10;       // gabarito: limite inferior = padrão × 0,9; superior = × 1,1

export class ErroValidacao extends Error {
  constructor(erros) {
    super(erros.join(' · '));
    this.name = 'ErroValidacao';
    this.erros = erros;
  }
}

/**
 * Calcula a Ficha PO.
 * @param {object} demanda   saída de qualquer leitor (txt/json/csv/xlsx/formulário)
 * @param {object} catalogo  { elementos: [...], maquinas: [...] }
 */
export function calcularPO(demanda, catalogo) {
  const erros = [];

  const perimetro = Number(demanda.perimetro_m);
  if (!Number.isFinite(perimetro) || perimetro <= 0) erros.push('Perímetro de costura deve ser um número maior que zero.');

  const pontos = demanda.pontos_cm === undefined || demanda.pontos_cm === '' ? null : Number(demanda.pontos_cm);
  if (pontos !== null && (!Number.isFinite(pontos) || pontos <= 0)) erros.push('Pontos/cm deve ser um número maior que zero.');

  const maquina = catalogo.maquinas.find((m) => String(m.codigo) === String(demanda.cod_eqp));
  if (!maquina) erros.push(`Máquina com código "${demanda.cod_eqp ?? ''}" não existe no cadastro TEMPO-CM.`);

  const roteiro = demanda.roteiro ?? [];
  if (roteiro.length === 0) erros.push('O roteiro de operações (elementos MTM) está vazio.');

  const elementos = roteiro.map((passo) => {
    const el = catalogo.elementos.find((e) => e.codigo === passo.codigo);
    if (!el) erros.push(`Código MTM "${passo.codigo}" não existe na Matriz de Elementos.`);
    const freq = Number(passo.frequencia ?? 1);
    if (!Number.isFinite(freq) || freq <= 0) erros.push(`Frequência inválida para o elemento ${passo.codigo}.`);
    return el && { codigo: el.codigo, descricao: el.descricao, frequencia: freq, tempo_min: el.tempo_min };
  });

  if (erros.length) throw new ErroValidacao(erros);

  const fixo = {
    codigo: 'FIXO',
    descricao: 'Tempo de costura',
    frequencia: 1,
    tempo_min: arredondar(perimetro * maquina.tempo_por_metro, CASAS_DECIMAIS),
    memoria: `${perimetro} m × ${maquina.tempo_por_metro} min/m`,
  };

  const linhas = [fixo, ...elementos];
  const tp = arredondar(linhas.reduce((s, l) => s + l.tempo_min * l.frequencia, 0), CASAS_DECIMAIS);

  return {
    cabecalho: {
      titulo: demanda.titulo || '',
      revisao: demanda.revisao ?? '00',
      operacao: demanda.operacao || '',
      familia: demanda.familia || '',
      tamanho: demanda.tamanho || '',
      medidas: demanda.medidas || '',
      pontos_cm: pontos,
      perimetro_m: perimetro,
    },
    equipamento: {
      codigo: maquina.codigo,
      tipo: maquina.tipo,
      modelo: maquina.descricao,
      tempo_por_metro: maquina.tempo_por_metro,
      rpm_padrao: maquina.rpm,
      rpm_min: arredondar(maquina.rpm * (1 - FAIXA_RPM), 2),
      rpm_max: arredondar(maquina.rpm * (1 + FAIXA_RPM), 2),
    },
    linhas,
    tp_min: tp,
  };
}
