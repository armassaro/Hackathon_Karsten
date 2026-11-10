import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';

import { calcularPO, ErroValidacao } from '../src/core/motorTM.js';
import { lerCatalogoArquivo } from '../src/ingest/catalogo.js';
import { lerDemandas, lerRoteiro } from '../src/ingest/demanda.js';
import { gerarXlsx } from '../src/export/fichaPO.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const catalogo = lerCatalogoArquivo(path.join(dir, '../data/Entradas.ods'));
const demandaOficial = () => lerDemandas('demanda_000.txt', fs.readFileSync(path.join(dir, 'fixtures/demanda_000.txt')))[0];

test('catálogo: lê 9 elementos MTM e 3 máquinas do Entradas.ods', () => {
  assert.equal(catalogo.elementos.length, 9);
  assert.equal(catalogo.maquinas.length, 3);
  assert.deepEqual(catalogo.maquinas[0], { codigo: '1', tipo: 'Interlock', descricao: 'Jack C4', rpm: 5000, tempo_por_metro: 0.0964 });
  assert.equal(catalogo.elementos.find((e) => e.codigo === '2.1').tempo_min, 0.15);
});

test('demanda_000.txt: lê todos os campos', () => {
  const d = demandaOficial();
  assert.equal(d.titulo, 'PO-SL-001');
  assert.equal(d.operacao, 'Bainhar no corpo do SL - 1 lado');
  assert.equal(d.pontos_cm, 2.5);
  assert.equal(d.perimetro_m, 6.96);
  assert.equal(d.cod_eqp, '1');
  assert.deepEqual(d.roteiro.map((p) => p.codigo), ['2.1', '1.1', '3.1']);
});

test('motor: FIXO = 6,96 × 0,0964 = 0,6709 e TP = 0,9409 (gabarito)', () => {
  const po = calcularPO(demandaOficial(), catalogo);
  assert.equal(po.linhas[0].tempo_min, 0.6709);
  assert.equal(po.tp_min, 0.9409);
  assert.equal(po.equipamento.rpm_min, 4500);
  assert.equal(po.equipamento.rpm_max, 5500);
});

test('motor: frequência multiplica o tempo do elemento', () => {
  const d = { ...demandaOficial(), roteiro: lerRoteiro('2.1x2, 1.1, 3.1') };
  assert.equal(calcularPO(d, catalogo).tp_min, 1.0909);
});

test('motor: rejeita código MTM, máquina e perímetro inválidos com mensagens claras', () => {
  const d = { ...demandaOficial(), perimetro_m: 0, cod_eqp: '9', roteiro: lerRoteiro('2.1, 9.9') };
  assert.throws(() => calcularPO(d, catalogo), (e) => {
    assert.ok(e instanceof ErroValidacao);
    assert.equal(e.erros.length, 3);
    return true;
  });
});

test('roteiro: aceita vírgula, ponto-e-vírgula, decimal com vírgula e frequência', () => {
  assert.deepEqual(lerRoteiro('2.1, 1.1, 3.1').map((p) => p.codigo), ['2.1', '1.1', '3.1']);
  assert.deepEqual(lerRoteiro('2,1; 1,1; 3,1').map((p) => p.codigo), ['2.1', '1.1', '3.1']);
  assert.deepEqual(lerRoteiro('2.1 x 3; 4.1(2)'), [{ codigo: '2.1', frequencia: 3 }, { codigo: '4.1', frequencia: 2 }]);
});

test('ingestão: JSON, CSV chave;valor e CSV em lote produzem a mesma demanda', () => {
  const json = lerDemandas('d.json', Buffer.from(JSON.stringify({ 'Título': 'PO-SL-001', 'Perímetro costura (em m)': '6,96', 'Cód. Eqp': 1, Elementos: ['2.1', '1.1', '3.1'] })))[0];
  const csvKV = lerDemandas('d.csv', Buffer.from('Título;PO-SL-001\nPerímetro costura (em m);6,96\nCód. Eqp;1\nElementos;2.1, 1.1, 3.1\n'))[0];
  const lote = lerDemandas('l.csv', Buffer.from('titulo;perimetro_m;cod_eqp;elementos\nPO-A;6,96;1;2.1, 1.1, 3.1\nPO-B;5;2;4.1, 5.1\n'));
  for (const d of [json, csvKV, lote[0]]) assert.equal(calcularPO(d, catalogo).tp_min, 0.9409);
  assert.equal(lote.length, 2);
  assert.equal(calcularPO(lote[1], catalogo).tp_min, 1.1675); // 5 × 0,0835 = 0,4175 + 0,4 + 0,35
});

test('ficha PO: células A1:E11 idênticas ao gabarito oficial PO-SL-000 + linha TP', async () => {
  const gerado = XLSX.read(await gerarXlsx(calcularPO(demandaOficial(), catalogo)), { type: 'buffer' }).Sheets.PO;
  const gabarito = XLSX.read(fs.readFileSync(path.join(dir, 'fixtures/PO-SL-000-gabarito.xlsx')), { type: 'buffer' }).Sheets.PO;
  const norm = (v) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : v);
  const diferencas = [];
  for (const linha of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
    for (const col of 'ABCDE') {
      const ref = `${col}${linha}`;
      const esperado = norm(gabarito[ref]?.v);
      let obtido = norm(gerado[ref]?.v);
      if (typeof esperado === 'number' && typeof obtido === 'string') obtido = Number(obtido);
      if (esperado !== obtido) diferencas.push(`${ref}: esperado ${JSON.stringify(esperado)}, obtido ${JSON.stringify(obtido)}`);
    }
  }
  assert.deepEqual(diferencas, []);
  assert.equal(gerado.A12.v, 'TP');
  assert.equal(gerado.E12.v, 0.9409);
});
