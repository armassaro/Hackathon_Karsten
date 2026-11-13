// Fichas PO no Google Drive: segurança do apps-script-drive/Code.gs e a rota POST /api/po/drive.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { carregarGASDrive, iniciarSimuladorDrive } from './gas-drive-simulador.js';

// O config do backend lê o ambiente ao ser importado: tudo do backend entra por import dinâmico depois disto.
const segredo = 'd'.repeat(40);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'autotm-drive-'));
const sim = await iniciarSimuladorDrive({ segredo });
Object.assign(process.env, {
  STORE: 'local', JWT_SECRET: 'x'.repeat(40), ADMIN_EMAIL: 'admin@karsten.test', DEV_EXIBIR_CODIGO: 'true',
  DB_LOCAL: path.join(tmp, 'db.json'), GAS_DRIVE_URL: sim.url, GAS_DRIVE_SECRET: segredo,
});
const { assinar } = await import('../src/services/googleClient.js');

const PDF = Buffer.from('%PDF-1.4\n% ficha de teste\n%%EOF\n');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

function chamar(gas, { pdf = PDF, data, action = 'guardarFichaPdf', ts = Date.now(), nonce = crypto.randomUUID(), chave = segredo, pdfEnviado }) {
  const d = data ?? { nome: 'PO-1_rev00.pdf', descricao: 'teste', tamanho: pdf.length, sha256: sha(pdf) };
  const base = JSON.stringify({ action, data: d, actor: 'eng@k.test', ts, nonce });
  const corpo = JSON.stringify({ base, sig: assinar(base, chave), pdf: (pdfEnviado ?? pdf).toString('base64') });
  return JSON.parse(gas.contexto.doPost({ postData: { contents: corpo } }).texto);
}

const pastas = (gas) => [...gas.drive.arquivos.values()].filter((f) => f.mimeType === 'application/vnd.google-apps.folder');

test('guarda o PDF em Fichas PO / ano / mês, criando as pastas só na primeira vez', () => {
  const gas = carregarGASDrive({ segredo });
  const r1 = chamar(gas, {});
  assert.ok(r1.ok, JSON.stringify(r1));
  const agora = new Date();
  const ano = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', year: 'numeric' }).format(agora);
  assert.match(gas.drive.caminho(r1.resultado.id), new RegExp(`^Fichas PO/${ano}/\\d\\d - \\S+/PO-1_rev00\\.pdf$`));
  assert.equal(r1.resultado.caminho, gas.drive.caminho(r1.resultado.id).split('/').slice(0, 3).join(' / '));
  assert.deepEqual(gas.drive.arquivos.get(r1.resultado.id).conteudo, PDF);

  const r2 = chamar(gas, {});
  assert.ok(r2.ok);
  assert.equal(pastas(gas).length, 3, 'reutiliza raiz, ano e mês');
  assert.match(gas.drive.arquivos.get(r2.resultado.id).description, /Guardado por: eng@k.test/);
});

test('recria a pasta raiz se ela foi para a lixeira', () => {
  const gas = carregarGASDrive({ segredo });
  chamar(gas, {});
  const raizAntiga = gas.props.PASTA_RAIZ_ID;
  gas.drive.arquivos.forEach((f) => { f.trashed = true; }); // como no Drive: a lixeira leva a árvore toda
  const r = chamar(gas, {});
  assert.ok(r.ok);
  assert.notEqual(gas.props.PASTA_RAIZ_ID, raizAntiga);
  assert.equal(pastas(gas).filter((p) => !p.trashed).length, 3);
  assert.match(gas.drive.caminho(r.resultado.id), /^Fichas PO\//);
});

test('rejeita assinatura com outra chave, requisição vencida e replay', () => {
  const gas = carregarGASDrive({ segredo });
  assert.equal(chamar(gas, { chave: 'outra'.repeat(10) }).erro, 'Assinatura inválida.');
  assert.equal(chamar(gas, { ts: Date.now() - 61_000 }).erro, 'Requisição expirada.');
  const nonce = crypto.randomUUID();
  assert.ok(chamar(gas, { nonce }).ok);
  assert.equal(chamar(gas, { nonce }).erro, 'Replay detectado.');
  assert.equal(gas.drive.arquivos.size, 4, 'só a chamada válida gravou (3 pastas + 1 arquivo)');
});

test('rejeita PDF trocado depois da assinatura, arquivo que não é PDF e ação desconhecida', () => {
  const gas = carregarGASDrive({ segredo });
  assert.equal(chamar(gas, { pdfEnviado: Buffer.from('%PDF-1.4 adulterado...') }).erro, 'PDF não confere com a assinatura.');
  assert.equal(chamar(gas, { pdf: Buffer.from('<html>não é pdf</html>') }).erro, 'O arquivo não é um PDF.');
  assert.equal(chamar(gas, { action: 'listMachines' }).erro, 'Ação inválida.');
  const semCorpo = JSON.parse(gas.contexto.doPost({ postData: { contents: '' } }).texto);
  assert.equal(semCorpo.erro, 'Requisição vazia.');
  assert.equal(gas.drive.arquivos.size, 0);
});

test('Apps Script rejeita PDF acima de 1 MB', () => {
  const gas = carregarGASDrive({ segredo });
  const grande = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(1024 * 1024)]);
  assert.equal(chamar(gas, { pdf: grande }).erro, 'PDF maior que 1 MB.');
});

test('nome de arquivo malicioso é saneado e erros internos do Drive não vazam', () => {
  const gas = carregarGASDrive({ segredo });
  const r = chamar(gas, { data: { nome: '../../x/<script>.exe', tamanho: PDF.length, sha256: sha(PDF) } });
  assert.ok(r.ok);
  assert.doesNotMatch(r.resultado.nome, /[/<>]/);
  assert.match(r.resultado.nome, /\.pdf$/);

  gas.contexto.Drive.Files.create = () => { throw new Error('quota interna xyz'); };
  assert.equal(chamar(gas, {}).erro, 'Falha ao guardar o arquivo no Google Drive.');
});

// ---------------------------------------------------------------- Rota do backend, de ponta a ponta

let servidor, base, cookieEng, cookieLeitor;

const DEMANDA = { titulo: 'PO-SL-001', revisao: '00', operacao: 'Bainhar', perimetro_m: 6.96, cod_eqp: '1', roteiro: [{ codigo: '2.1', frequencia: 1 }] };

async function api(rota, { form, cookie, corpo } = {}) {
  const headers = cookie ? { Cookie: cookie } : {};
  if (corpo) headers['Content-Type'] = 'application/json';
  const r = await fetch(base + rota, { method: 'POST', headers, body: form ?? JSON.stringify(corpo) });
  return { status: r.status, corpo: await r.json() };
}

async function entrar(email) {
  const s = await api('/auth/solicitar-codigo', { corpo: { email } });
  const r = await fetch(base + '/auth/verificar-codigo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, codigo: s.corpo.codigoDev }) });
  return r.headers.get('set-cookie').split(';')[0];
}

function formulario(pdf = PDF, demanda = DEMANDA) {
  const fd = new FormData();
  fd.append('demanda', JSON.stringify(demanda));
  fd.append('pdf', new Blob([pdf], { type: 'application/pdf' }), 'ficha.pdf');
  return fd;
}

before(async () => {
  const { criarStore } = await import('../src/store/index.js');
  const { criarApp } = await import('../src/app.js');
  const store = criarStore();
  await new Promise((ok) => { servidor = criarApp(store).listen(0, () => { base = `http://127.0.0.1:${servidor.address().port}/api`; ok(); }); });
  const admin = await entrar('admin@karsten.test');
  const r = await fetch(base + '/admin/usuarios', { method: 'POST', headers: { Cookie: admin, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'leitor@karsten.test', nome: 'Leitor', papel: 'leitor', ativo: true }) });
  assert.ok(r.ok, `cria leitor (${r.status})`);
  cookieEng = admin;
  cookieLeitor = await entrar('leitor@karsten.test');
});
after(() => { servidor?.close(); sim?.servidor.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

test('POST /po/drive guarda a ficha com nome e TP calculados pelo servidor', async () => {
  const r = await api('/po/drive', { form: formulario(), cookie: cookieEng });
  assert.equal(r.status, 200, JSON.stringify(r.corpo));
  assert.match(r.corpo.nome, /^PO-SL-001_rev00_\d{4}-\d\d-\d\d_\d\dh\d\dm\d\ds\.pdf$/);
  assert.match(r.corpo.caminho, /^Fichas PO \/ \d{4} \/ \d\d - /);
  const arquivo = sim.drive.arquivos.get(r.corpo.id);
  assert.deepEqual(arquivo.conteudo, PDF);
  assert.match(arquivo.description, /TP \d+,\d{4} min \(calculado pelo servidor\)/);
  assert.match(arquivo.description, /Guardado por: admin@karsten.test/);
});

test('POST /po/drive exige login, papel de engenheiro, PDF de verdade (tipo e até 1 MB) e ficha válida', async () => {
  assert.equal((await api('/po/drive', { form: formulario() })).status, 401);
  assert.equal((await api('/po/drive', { form: formulario(), cookie: cookieLeitor })).status, 403);
  assert.equal((await api('/po/drive', { form: formulario(Buffer.from('não sou pdf')), cookie: cookieEng })).status, 400);
  const grande = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(1024 * 1024)]);
  const r413 = await api('/po/drive', { form: formulario(grande), cookie: cookieEng });
  assert.equal(r413.status, 413);
  assert.equal(r413.corpo.erro, 'A ficha em PDF passa de 1 MB.');
  const fdTexto = new FormData();
  fdTexto.append('demanda', JSON.stringify(DEMANDA));
  fdTexto.append('pdf', new Blob([PDF], { type: 'text/plain' }), 'ficha.txt');
  assert.equal((await api('/po/drive', { form: fdTexto, cookie: cookieEng })).status, 400, 'MIME/extensão errados');
  const invalida = await api('/po/drive', { form: formulario(PDF, { ...DEMANDA, cod_eqp: '' }), cookie: cookieEng });
  assert.equal(invalida.status, 422);
});
