// Leitura dos Dados de Entrada da Operação, em qualquer formato:
//   .txt  — "Chave: valor" por linha (formato do demanda_000.txt oficial)
//   .json — objeto único ou lista de objetos (chaves livres, ex.: "Pontos/cm" ou "pontos_cm")
//   .csv  — chave;valor por linha  OU  cabeçalho + 1 linha por demanda (lote)
//   .xlsx/.ods — mesmas duas disposições do CSV, em qualquer aba
// Todos convergem para o mesmo objeto canônico consumido pelo motor.
import { lerAbas, lerCSV } from './planilha.js';
import { normalizar, paraNumero, codigoMTM, semAspas } from '../core/util.js';

// Sinônimos aceitos para cada campo (comparados após normalizar()).
const CAMPOS = {
  titulo: ['titulo', 'codigo po', 'po', 'title'],
  revisao: ['rev', 'revisao', 'rev.'],
  operacao: ['operacao', 'descricao da operacao'],
  familia: ['agrupamento familia', 'familia', 'agrupamento'],
  tamanho: ['tamanho'],
  medidas: ['medidas da peca (em m)', 'medidas da peca', 'medidas'],
  pontos_cm: ['pontos/cm', 'pontos por cm', 'densidade de pontos', 'pontos_cm', 'densidade'],
  perimetro_m: ['perimetro costura (em m)', 'perimetro costura', 'perimetro de costura', 'perimetro', 'perimetro_m', 'comprimento de costura'],
  cod_eqp: ['cod. eqp', 'cod. eqp.', 'cod eqp', 'codigo equipamento', 'codigo da maquina', 'maquina', 'equipamento', 'cod_eqp'],
  roteiro: ['elementos', 'roteiro', 'roteiro de operacoes', 'sequencia', 'codigos mtm'],
};

const chaveNorm = (s) => normalizar(s).replace(/_/g, ' ').replace(/\.$/, '');

export function campoCanonico(chave) {
  const k = chaveNorm(chave);
  if (!k) return null;
  for (const [campo, sinonimos] of Object.entries(CAMPOS)) {
    if (sinonimos.some((s) => chaveNorm(s) === k)) return campo;
  }
  // Tolerância: começa com um sinônimo (ex.: "Perímetro costura (em metros)")
  for (const [campo, sinonimos] of Object.entries(CAMPOS)) {
    if (sinonimos.some((s) => s.length > 3 && k.startsWith(chaveNorm(s)))) return campo;
  }
  return null;
}

/**
 * Converte o roteiro em [{ codigo, frequencia }].
 * Aceita "2.1, 1.1, 3.1", "2.1; 1.1; 3.1", lista JSON, e frequência opcional: "2.1x2", "2.1*2" ou "2.1(2)".
 */
export function lerRoteiro(valor) {
  if (Array.isArray(valor)) {
    return valor.map((v) => (typeof v === 'object' && v !== null
      ? { codigo: codigoMTM(v.codigo), frequencia: paraNumero(v.frequencia ?? 1) }
      : lerRoteiro(String(v))[0])).filter(Boolean);
  }
  const s = String(valor ?? '').replace(/\s*([x*×])\s*/gi, '$1').replace(/\s*\(\s*/g, '(');
  // Com ";" ou "|" a vírgula pode ser decimal ("2,1; 1,1"); sem eles, vírgula/espaço separam.
  const separador = /[;|\n]/.test(s) ? /[;|\n]+/ : /[,\s]+/;
  return s
    .split(separador)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => {
      const m = t.match(/^(\d+[.,]\d+)\s*(?:[x*×]\s*(\d+(?:[.,]\d+)?)|\((\d+(?:[.,]\d+)?)\))?$/i);
      if (!m) return { codigo: codigoMTM(t), frequencia: 1 };
      return { codigo: codigoMTM(m[1]), frequencia: paraNumero(m[2] ?? m[3] ?? 1) };
    });
}

/** Monta a demanda canônica a partir de pares chave/valor quaisquer. */
export function montarDemanda(pares) {
  const d = {};
  for (const [chave, valor] of pares) {
    const campo = campoCanonico(chave);
    if (!campo || valor === null || valor === undefined || String(valor).trim() === '') continue;
    d[campo] = valor;
  }
  return {
    titulo: semAspas(d.titulo ?? ''),
    revisao: semAspas(d.revisao ?? '00').padStart(2, '0'),
    operacao: semAspas(d.operacao ?? ''),
    familia: semAspas(d.familia ?? ''),
    tamanho: semAspas(d.tamanho ?? ''),
    medidas: semAspas(d.medidas ?? ''),
    pontos_cm: d.pontos_cm === undefined ? undefined : paraNumero(d.pontos_cm),
    perimetro_m: paraNumero(d.perimetro_m),
    cod_eqp: d.cod_eqp === undefined ? undefined : String(semAspas(d.cod_eqp)).replace(/\.0+$/, ''),
    roteiro: lerRoteiro(d.roteiro),
  };
}

export function lerTXT(texto) {
  const pares = texto
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .map((l) => l.match(/^\s*([^:=]+?)\s*[:=]\s*(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]);
  return [montarDemanda(pares)];
}

export function lerJSON(texto) {
  const dado = JSON.parse(texto);
  const lista = Array.isArray(dado) ? dado : dado.demandas ?? [dado];
  return lista.map((obj) => montarDemanda(Object.entries(obj)));
}

/** Decide entre disposição chave/valor (vertical) e tabela (1 demanda por linha). */
export function lerTabela(linhas) {
  linhas = linhas.filter((l) => l.some((c) => c !== null && String(c).trim() !== ''));
  if (!linhas.length) return [];
  const camposNoCabecalho = linhas[0].filter((c) => campoCanonico(c)).length;
  if (camposNoCabecalho >= 3) {
    const cab = linhas[0];
    return linhas.slice(1).map((l) => montarDemanda(cab.map((h, i) => [h, l[i]])));
  }
  return [montarDemanda(linhas.map((l) => [l[0], l[1]]))];
}

/** Ponto de entrada único: detecta o formato pela extensão (ou pelo conteúdo). */
export function lerDemandas(nomeArquivo, buffer) {
  const ext = (nomeArquivo.split('.').pop() || '').toLowerCase();
  const texto = () => buffer.toString('utf8');
  let demandas;
  if (ext === 'json') demandas = lerJSON(texto());
  else if (ext === 'csv') demandas = lerTabela(lerCSV(texto()));
  else if (['xlsx', 'xls', 'ods'].includes(ext)) {
    demandas = lerAbas(buffer).flatMap((aba) => lerTabela(aba.linhas)).filter((d) => d.roteiro.length || d.perimetro_m);
  } else {
    const t = texto().trim();
    demandas = t.startsWith('{') || t.startsWith('[') ? lerJSON(t) : lerTXT(t);
  }
  return demandas.map((d) => ({ ...d, origem: nomeArquivo }));
}
