// Leitura genérica de planilhas (.xlsx, .xls, .ods, .csv) para matriz de linhas.
import * as XLSX from 'xlsx';

/** Retorna [{ nome, linhas: any[][] }] para cada aba do arquivo. */
export function lerAbas(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer', raw: false, cellDates: false });
  return wb.SheetNames.map((nome) => ({
    nome,
    linhas: XLSX.utils.sheet_to_json(wb.Sheets[nome], { header: 1, raw: true, defval: null, blankrows: false }),
  }));
}

/** Parser de CSV com detecção de separador (, ; ou TAB) e suporte a aspas. */
export function lerCSV(texto) {
  texto = texto.replace(/^﻿/, '');
  const primeira = texto.split(/\r?\n/)[0] ?? '';
  const sep = [';', '\t', ','].sort((a, b) => contar(primeira, b) - contar(primeira, a))[0];

  const linhas = [];
  let linha = [], campo = '', aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === sep) { linha.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      linha.push(campo); campo = '';
      if (linha.some((v) => v.trim() !== '')) linhas.push(linha);
      linha = [];
    } else campo += c;
  }
  linha.push(campo);
  if (linha.some((v) => v.trim() !== '')) linhas.push(linha);
  return linhas;
}

function contar(s, ch) {
  return s.split(ch).length - 1;
}
