// Teste de integração ponta a ponta da API no modo local (sem Google).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';

const dir = path.dirname(fileURLToPath(import.meta.url));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'autotm-'));
const MODO = process.env.TESTE_MODO || 'local';
const SEGREDO_GAS = 'g'.repeat(40);
Object.assign(process.env, {
  STORE: MODO,
  JWT_SECRET: 'x'.repeat(40),
  ADMIN_EMAIL: 'admin@karsten.test',
  DEV_EXIBIR_CODIGO: 'true',
  DB_LOCAL: path.join(tmp, 'db.json'),
  GAS_SECRET: SEGREDO_GAS,
});

// No modo google o código chega por "e-mail" (simulado); capturamos dele.
let gas = null;
if (MODO === 'google') {
  const { iniciarSimuladorGAS } = await import('./gas-simulador.js');
  gas = await iniciarSimuladorGAS({ segredo: SEGREDO_GAS, admin: 'admin@karsten.test' });
  process.env.GAS_URL = gas.url;
}

const { criarStore } = await import('../src/store/index.js');
const { criarApp } = await import('../src/app.js');

let servidor, base;
before(() => new Promise((ok) => {
  servidor = criarApp(criarStore()).listen(0, () => { base = `http://127.0.0.1:${servidor.address().port}/api`; ok(); });
}));
after(() => { servidor.close(); gas?.servidor.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

function codigoRecebido(email, resposta) {
  if (MODO === 'local') return resposta.codigoDev;
  const m = [...gas.emails].reverse().find((e) => e.to === email && /código/.test(e.subject));
  return m?.subject.match(/(\d{6})$/)?.[1];
}

async function api(metodo, rota, { corpo, cookie, bearer, form } = {}) {
  const headers = {};
  if (cookie) headers.Cookie = cookie;
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  if (corpo) headers['Content-Type'] = 'application/json';
  const r = await fetch(base + rota, { method: metodo, headers, body: form ?? (corpo && JSON.stringify(corpo)) });
  const tipo = r.headers.get('content-type') || '';
  return { status: r.status, corpo: tipo.includes('json') ? await r.json() : Buffer.from(await r.arrayBuffer()), headers: r.headers };
}

async function entrar(email) {
  const s = await api('POST', '/auth/solicitar-codigo', { corpo: { email } });
  assert.equal(s.status, 200);
  const v = await api('POST', '/auth/verificar-codigo', { corpo: { email, codigo: codigoRecebido(email, s.corpo) } });
  assert.equal(v.status, 200, JSON.stringify(v.corpo));
  return v.headers.get('set-cookie').split(';')[0];
}

const demanda = {
  titulo: 'PO-SL-001', revisao: '00', operacao: 'Bainhar no corpo do SL - 1 lado', familia: 'Sobre-lençol',
  tamanho: 'Solteiro', medidas: '1,80 x 2,50', pontos_cm: 2.5, perimetro_m: 6.96, cod_eqp: '1',
  roteiro: [{ codigo: '2.1', frequencia: 1 }, { codigo: '1.1', frequencia: 1 }, { codigo: '3.1', frequencia: 1 }],
};

const sessoes = {};

test('sem login, a API responde 401', async () => {
  assert.equal((await api('GET', '/maquinas')).status, 401);
});

test('e-mail não cadastrado recebe a mesma mensagem e nenhum código', async () => {
  const r = await api('POST', '/auth/solicitar-codigo', { corpo: { email: 'intruso@x.com' } });
  assert.equal(r.status, 200);
  assert.equal(r.corpo.codigoDev, undefined);
  if (gas) assert.ok(!gas.emails.some((e) => e.to === 'intruso@x.com'));
});

test('admin entra com código e cadastra engenheiro e leitor', async () => {
  sessoes.admin = await entrar('admin@karsten.test');
  for (const [email, papel] of [['eng@karsten.test', 'engenheiro'], ['leitor@karsten.test', 'leitor']]) {
    const r = await api('POST', '/admin/usuarios', { cookie: sessoes.admin, corpo: { email, nome: papel, papel, ativo: true } });
    assert.equal(r.status, 200, JSON.stringify(r.corpo));
  }
  sessoes.eng = await entrar('eng@karsten.test');
  sessoes.leitor = await entrar('leitor@karsten.test');
});

test('código errado é rejeitado e reenvio imediato é bloqueado (429)', async () => {
  await api('POST', '/admin/usuarios', { cookie: sessoes.admin, corpo: { email: 'x@karsten.test', nome: 'x', papel: 'leitor' } });
  await api('POST', '/auth/solicitar-codigo', { corpo: { email: 'x@karsten.test' } });
  assert.equal((await api('POST', '/auth/verificar-codigo', { corpo: { email: 'x@karsten.test', codigo: '000000' } })).status, 401);
  assert.equal((await api('POST', '/auth/solicitar-codigo', { corpo: { email: 'x@karsten.test' } })).status, 429);
});

test('leitor lista máquinas, mas recebe 403 ao excluir e ao gerar PO', async () => {
  const lista = await api('GET', '/maquinas', { cookie: sessoes.leitor });
  assert.equal(lista.corpo.length, 3);
  assert.equal((await api('DELETE', '/maquinas/1', { cookie: sessoes.leitor })).status, 403);
  assert.equal((await api('POST', '/po/preview', { cookie: sessoes.leitor, corpo: demanda })).status, 403);
  const log = await api('GET', '/admin/log', { cookie: sessoes.admin });
  assert.ok(log.corpo.some((l) => l.acao === 'ACESSO_NEGADO' && l.email === 'leitor@karsten.test'));
});

test('engenheiro gera a PO oficial: FIXO 0,6709 e TP 0,9409', async () => {
  const r = await api('POST', '/po/preview', { cookie: sessoes.eng, corpo: demanda });
  assert.equal(r.status, 200);
  assert.equal(r.corpo.linhas[0].tempo_min, 0.6709);
  assert.equal(r.corpo.tp_min, 0.9409);
});

test('erros de negócio voltam como 422 com a lista de problemas', async () => {
  const r = await api('POST', '/po/preview', { cookie: sessoes.eng, corpo: { ...demanda, roteiro: '2.1, 7.7', cod_eqp: '99' } });
  assert.equal(r.status, 422);
  assert.equal(r.corpo.erros.length, 2);
});

test('upload em lote: txt oficial + csv com 2 demandas, uma inválida', async () => {
  const form = new FormData();
  form.append('arquivos', new Blob([fs.readFileSync(path.join(dir, 'fixtures/demanda_000.txt'))]), 'demanda_000.txt');
  form.append('arquivos', new Blob(['titulo;perimetro_m;cod_eqp;elementos\nPO-A;5;2;4.1, 5.1\nPO-B;5;9;4.1\n']), 'lote.csv');
  const r = await api('POST', '/po/importar', { cookie: sessoes.eng, form });
  assert.equal(r.status, 200);
  assert.equal(r.corpo.resultados.length, 3);
  assert.equal(r.corpo.resultados[0].po.tp_min, 0.9409);
  assert.equal(r.corpo.resultados[1].po.tp_min, 1.1675);
  assert.ok(r.corpo.resultados[2].erros[0].includes('"9"'));
});

test('admin desativa máquina (soft delete): some da lista e a PO passa a falhar', async () => {
  assert.equal((await api('DELETE', '/maquinas/3', { cookie: sessoes.admin })).status, 200);
  assert.equal((await api('GET', '/maquinas', { cookie: sessoes.eng })).corpo.length, 2);
  assert.equal((await api('GET', '/maquinas?inativas=1', { cookie: sessoes.admin })).corpo.length, 3);
  assert.equal((await api('POST', '/po/preview', { cookie: sessoes.eng, corpo: { ...demanda, cod_eqp: '3' } })).status, 422);
  await api('POST', '/maquinas/3/reativar', { cookie: sessoes.admin });
});

test('token de API gera planilha em lote; após revogação recebe 401', async () => {
  const criado = await api('POST', '/admin/tokens', { cookie: sessoes.admin, corpo: { nome: 'Script lote', papel: 'engenheiro' } });
  assert.equal(criado.status, 201);
  assert.ok(criado.corpo.token.startsWith('tm_live_'));
  assert.equal((await api('GET', '/admin/tokens', { cookie: sessoes.admin })).corpo[0].hash, undefined);

  const form = new FormData();
  form.append('arquivos', new Blob([fs.readFileSync(path.join(dir, 'fixtures/demanda_000.txt'))]), 'demanda_000.txt');
  const r = await api('POST', '/po/importar?saida=xlsx', { bearer: criado.corpo.token, form });
  assert.equal(r.status, 200);
  const aba = XLSX.read(r.corpo, { type: 'buffer' }).Sheets.PO;
  assert.equal(aba.E12.v, 0.9409);

  await api('DELETE', `/admin/tokens/${criado.corpo.id}`, { cookie: sessoes.admin });
  assert.equal((await api('GET', '/mtm', { bearer: criado.corpo.token })).status, 401);
});

test('envio por e-mail vai sempre para o usuário autenticado (ignora "para" do cliente)', async () => {
  const r = await api('POST', '/po/enviar', { cookie: sessoes.eng, corpo: { demandas: [demanda], para: 'atacante@evil.com' } });
  assert.equal(r.status, 200);
  assert.equal(r.corpo.enviadoPara, 'eng@karsten.test');
  if (gas) {
    const m = gas.emails.at(-1);
    assert.equal(m.to, 'eng@karsten.test');
    assert.equal(m.attachments[0].nome, 'PO-SL-001.xlsx');
  }
});

test('admin importa planilha de cadastros (Entradas.ods)', async () => {
  const form = new FormData();
  form.append('arquivo', new Blob([fs.readFileSync(path.join(dir, '../data/Entradas.ods'))]), 'Entradas.ods');
  const r = await api('POST', '/catalogo/importar', { cookie: sessoes.admin, form });
  assert.equal(r.status, 200, JSON.stringify(r.corpo));
  assert.deepEqual([r.corpo.elementos, r.corpo.maquinas], [9, 3]);
});
