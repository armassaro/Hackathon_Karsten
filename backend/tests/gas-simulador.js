// Simulador mínimo do runtime do Google Apps Script, para executar apps-script/Code.gs
// localmente (sem conta Google) e testar a integração backend ⇄ Apps Script de ponta a ponta.
// Uso nos testes:  const gas = await iniciarSimuladorGAS({ segredo, admin }); gas.url ...
// Uso manual:      node tests/gas-simulador.js   (sobe em http://localhost:8787)
import fs from 'node:fs';
import http from 'node:http';
import vm from 'node:vm';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));

function criarPlanilha() {
  const abas = new Map();
  const aba = (nome) => {
    const linhas = [];
    const sh = {
      getName: () => nome,
      appendRow: (v) => { linhas.push([...v]); },
      getLastRow: () => linhas.length,
      getLastColumn: () => Math.max(0, ...linhas.map((l) => l.length)),
      getMaxRows: () => 1000,
      setFrozenRows: () => {},
      deleteRow: (n) => { linhas.splice(n - 1, 1); },
      getDataRange: () => sh.getRange(1, 1, linhas.length, sh.getLastColumn()),
      getRange: (r, c, nr = 1, nc = 1) => ({
        getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => linhas[r - 1 + i]?.[c - 1 + j] ?? '')),
        setValues: (vals) => vals.forEach((l, i) => {
          linhas[r - 1 + i] ??= [];
          l.forEach((v, j) => { linhas[r - 1 + i][c - 1 + j] = v; });
        }),
        clearContent: () => { for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) if (linhas[r - 1 + i]) linhas[r - 1 + i][c - 1 + j] = ''; },
        setFontWeight() { return this; }, setBackground() { return this; }, setNumberFormat() { return this; },
      }),
    };
    return sh;
  };
  return {
    abas,
    getSheetByName: (n) => abas.get(n) ?? null,
    insertSheet: (n) => { const s = aba(n); abas.set(n, s); return s; },
  };
}

export function carregarGAS({ segredo, admin }) {
  const planilha = criarPlanilha();
  const cache = new Map();
  const emails = [];
  const props = { GAS_SECRET: segredo, ADMIN_EMAIL: admin };
  const bytes = (buf) => Array.from(buf, (b) => (b > 127 ? b - 256 : b)); // GAS devolve Byte[] com sinal

  const contexto = {
    console,
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] ?? null }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => planilha, openById: () => planilha },
    CacheService: { getScriptCache: () => ({ get: (k) => cache.get(k) ?? null, put: (k, v) => cache.set(k, v) }) },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    Utilities: {
      Charset: { UTF_8: 'utf8' },
      computeHmacSha256Signature: (valor, chave) => bytes(crypto.createHmac('sha256', chave).update(valor, 'utf8').digest()),
      base64Encode: (b) => Buffer.from(b.map((x) => (x + 256) % 256)).toString('base64'),
      base64Decode: (s) => bytes(Buffer.from(s, 'base64')),
      newBlob: (dados, tipo, nome) => ({ dados, tipo, nome }),
    },
    MailApp: { sendEmail: (m) => emails.push(m), getRemainingDailyQuota: () => 100 },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: (t) => ({ setMimeType: () => ({ texto: t }) }),
    },
    Session: { getActiveUser: () => ({ getEmail: () => admin }) },
    Logger: { log: () => {} },
    Date, JSON, Math, Number, String, Object, Array, Error,
  };
  vm.createContext(contexto);
  vm.runInContext(fs.readFileSync(path.join(dir, '../../apps-script/Code.gs'), 'utf8'), contexto, { filename: 'Code.gs' });
  contexto.setup();
  return { contexto, planilha, emails };
}

export function iniciarSimuladorGAS({ segredo, admin, porta = 0 }) {
  const gas = carregarGAS({ segredo, admin });
  return new Promise((ok) => {
    const servidor = http.createServer((req, res) => {
      let corpo = '';
      req.on('data', (c) => { corpo += c; });
      req.on('end', () => {
        const saida = gas.contexto.doPost({ postData: { contents: corpo } });
        res.setHeader('Content-Type', 'application/json');
        res.end(saida.texto);
      });
    });
    servidor.listen(porta, () => ok({ ...gas, servidor, url: `http://127.0.0.1:${servidor.address().port}/exec` }));
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const segredo = process.env.GAS_SECRET || 'simulador-'.padEnd(40, 'x');
  const admin = process.env.ADMIN_EMAIL || 'admin@karsten.test';
  const s = await iniciarSimuladorGAS({ segredo, admin, porta: 8787 });
  console.log(`Simulador do Apps Script em ${s.url}  (admin: ${admin})`);
  setInterval(() => {
    while (s.emails.length) {
      const m = s.emails.shift();
      console.log(`\n[e-mail simulado] para ${m.to}: ${m.subject}${m.attachments ? `  (anexo: ${m.attachments[0].nome})` : ''}`);
    }
  }, 300);
}
