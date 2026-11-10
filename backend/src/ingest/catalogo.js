// Leitura dos Cadastros de Apoio: MATRIZ DE ELEMENTOS (MTM) e TEMPO-CM (Máquinas).
// Não depende do nome das abas nem da posição exata das colunas: localiza a linha
// de cabeçalho pelo conteúdo, então tolera planilhas reordenadas ou renomeadas.
import fs from 'node:fs';
import { lerAbas } from './planilha.js';
import { normalizar, paraNumero, codigoMTM } from '../core/util.js';

const COLUNAS_MTM = {
  descricao: (h) => h.startsWith('descricao'),
  agrupador: (h) => h.includes('agrupador') && !h.includes('+'),
  elemento: (h) => h === 'codigo do elemento' || h === 'elemento',
  codigo: (h) => h.includes('+') || h === 'codigo' || h === 'codigo mtm',
  tempo: (h) => h.startsWith('tempo'),
};

const COLUNAS_MAQ = {
  codigo: (h) => h.startsWith('codigo') || h.startsWith('cod'),
  tipo: (h) => h.startsWith('tipo') || h === 'equipamento',
  descricao: (h) => h.startsWith('descricao') || h.startsWith('modelo'),
  rpm: (h) => h.startsWith('rpm'),
  tempo_por_metro: (h) => h.startsWith('tempo'),
};

function mapearCabecalho(linha, regras) {
  const mapa = {};
  linha.forEach((cel, i) => {
    const h = normalizar(cel);
    if (!h) return;
    for (const [campo, regra] of Object.entries(regras)) {
      if (mapa[campo] === undefined && regra(h)) { mapa[campo] = i; break; }
    }
  });
  return mapa;
}

function localizar(linhas, regras, obrigatorios) {
  for (let i = 0; i < Math.min(linhas.length, 15); i++) {
    const mapa = mapearCabecalho(linhas[i], regras);
    if (obrigatorios.every((c) => mapa[c] !== undefined)) return { indice: i, mapa };
  }
  return null;
}

export function lerCatalogo(buffer) {
  const abas = lerAbas(buffer);
  const elementos = [];
  const maquinas = [];

  for (const aba of abas) {
    const mtm = localizar(aba.linhas, COLUNAS_MTM, ['descricao', 'tempo']);
    const ehMaquinas = /cm|maq/i.test(normalizar(aba.nome)) || aba.linhas.slice(0, 15).some((l) => l.some((c) => normalizar(c).startsWith('rpm')));
    const maq = ehMaquinas ? localizar(aba.linhas, COLUNAS_MAQ, ['codigo', 'rpm', 'tempo_por_metro']) : null;

    if (maq) {
      for (const l of aba.linhas.slice(maq.indice + 1)) {
        const codigo = l[maq.mapa.codigo];
        if (codigo === null || codigo === undefined || String(codigo).trim() === '') continue;
        maquinas.push({
          codigo: String(codigo).trim(),
          tipo: String(l[maq.mapa.tipo] ?? '').trim(),
          descricao: String(l[maq.mapa.descricao] ?? '').trim(),
          rpm: paraNumero(l[maq.mapa.rpm]),
          tempo_por_metro: paraNumero(l[maq.mapa.tempo_por_metro]),
        });
      }
    } else if (mtm && (mtm.mapa.codigo !== undefined || (mtm.mapa.agrupador !== undefined && mtm.mapa.elemento !== undefined))) {
      for (const l of aba.linhas.slice(mtm.indice + 1)) {
        const desc = l[mtm.mapa.descricao];
        if (!desc) continue;
        // O código é "agrupador.elemento". Montamos a partir das colunas base quando
        // existirem, para não depender do resultado em cache da fórmula CONCAT.
        const codigo = mtm.mapa.agrupador !== undefined && mtm.mapa.elemento !== undefined
          ? `${l[mtm.mapa.agrupador]}.${l[mtm.mapa.elemento]}`
          : codigoMTM(l[mtm.mapa.codigo]);
        elementos.push({ codigo, descricao: String(desc).trim(), tempo_min: paraNumero(l[mtm.mapa.tempo]) });
      }
    }
  }

  const erros = [];
  if (!elementos.length) erros.push('Nenhum elemento MTM encontrado (esperado: Descrição, Código do agrupador, Código do elemento, Tempo).');
  if (!maquinas.length) erros.push('Nenhuma máquina encontrada (esperado: Código de máquina, Tipo, Descrição, RPM, Tempo/metro).');
  elementos.forEach((e) => Number.isFinite(e.tempo_min) || erros.push(`Tempo inválido no elemento ${e.codigo}.`));
  maquinas.forEach((m) => Number.isFinite(m.tempo_por_metro) || erros.push(`Tempo/metro inválido na máquina ${m.codigo}.`));
  if (erros.length) throw new Error(erros.join(' '));

  return { elementos, maquinas };
}

export function lerCatalogoArquivo(caminho) {
  return lerCatalogo(fs.readFileSync(caminho));
}
