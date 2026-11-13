// Simulador do apps-script-drive/Code.gs com um Google Drive em memória (sem conta Google).
// Uso nos testes:  const s = await iniciarSimuladorDrive({ segredo }); s.url, s.drive.arquivos ...
// Uso manual:      GAS_DRIVE_SECRET=... node tests/gas-drive-simulador.js   (http://localhost:8788/exec)
//                  Os PDFs recebidos são gravados em backend/data/drive-simulado/<ano>/<mês>/.
import fs from 'node:fs';
import http from 'node:http';
import vm from 'node:vm';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const bytes = (buf) => Array.from(buf, (b) => (b > 127 ? b - 256 : b)); // GAS usa Byte[] com sinal
const buffer = (arr) => Buffer.from(arr.map((x) => (x + 256) % 256));

/** Drive v3 mínimo: só o que o Code.gs usa (list por nome/pai/tipo, get, create). */
function criarDrive() {
  const arquivos = new Map();
  let seq = 0;
  const campo = (q, re) => q.match(re)?.[1]?.replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  return {
    arquivos,
    Files: {
      list({ q }) {
        const nome = campo(q, /name = '((?:[^'\\]|\\.)*)'/);
        const pai = campo(q, /'((?:[^'\\]|\\.)*)' in parents/);
        const tipo = campo(q, /mimeType = '([^']*)'/);
        const files = [...arquivos.values()].filter((f) => !f.trashed && f.name === nome && f.parents.includes(pai) && f.mimeType === tipo);
        return { files: files.slice(0, 1).map((f) => ({ id: f.id })) };
      },
      get(id) {
        const f = arquivos.get(id);
        if (!f) throw new Error('File not found: ' + id);
        return { id: f.id, trashed: f.trashed };
      },
      create(recurso, blob) {
        const id = `f${++seq}`;
        const f = { ...recurso, id, trashed: false, conteudo: blob ? buffer(blob.dados) : null, webViewLink: `https://drive.google.com/file/d/${id}/view` };
        arquivos.set(id, f);
        return { id, name: f.name, webViewLink: f.webViewLink };
      },
    },
    /** Caminho "Fichas PO/2026/11 - Novembro" de um arquivo. */
    caminho(id) {
      const partes = [];
      for (let f = arquivos.get(id); f; f = arquivos.get(f.parents[0])) partes.unshift(f.name);
      return partes.join('/');
    },
  };
}

export function carregarGASDrive({ segredo }) {
  const props = { GAS_DRIVE_SECRET: segredo };
  const cache = new Map();
  const drive = criarDrive();
  const contexto = {
    console: { ...console, error: () => {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] ?? null, setProperty: (k, v) => { props[k] = v; } }) },
    CacheService: { getScriptCache: () => ({ get: (k) => cache.get(k) ?? null, put: (k, v) => cache.set(k, v) }) },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    Drive: drive,
    Utilities: {
      Charset: { UTF_8: 'utf8' },
      DigestAlgorithm: { SHA_256: 'sha256' },
      computeHmacSha256Signature: (valor, chave) => bytes(crypto.createHmac('sha256', chave).update(valor, 'utf8').digest()),
      computeDigest: (alg, dados) => bytes(crypto.createHash(alg).update(buffer(dados)).digest()),
      base64Encode: (b) => buffer(b).toString('base64'),
      base64Decode: (s) => bytes(Buffer.from(s, 'base64')),
      newBlob: (dados, tipo, nome) => ({ dados, tipo, nome }),
      formatDate: (d, tz, fmt) => {
        const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric' }).formatToParts(d).map((x) => [x.type, x.value]));
        return fmt === 'yyyy' ? p.year : p.month;
      },
    },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (t) => ({ setMimeType: () => ({ texto: t }) }) },
    Logger: { log: () => {} },
    Date, JSON, Math, Number, String, Object, Array, Error,
  };
  vm.createContext(contexto);
  vm.runInContext(fs.readFileSync(path.join(dir, '../../apps-script-drive/Code.gs'), 'utf8'), contexto, { filename: 'Code.gs' });
  return { contexto, drive, props };
}

export function iniciarSimuladorDrive({ segredo, porta = 0, pastaSaida = null }) {
  const gas = carregarGASDrive({ segredo });
  return new Promise((ok) => {
    const servidor = http.createServer((req, res) => {
      const partes = [];
      req.on('data', (c) => partes.push(c));
      req.on('end', () => {
        const saida = gas.contexto.doPost({ postData: { contents: Buffer.concat(partes).toString('utf8') } });
        const r = JSON.parse(saida.texto);
        if (pastaSaida && r.ok) {
          const destino = path.join(pastaSaida, ...gas.drive.caminho(r.resultado.id).split('/').slice(1));
          fs.mkdirSync(path.dirname(destino), { recursive: true });
          fs.writeFileSync(destino, gas.drive.arquivos.get(r.resultado.id).conteudo);
          console.log(`[drive simulado] ${gas.drive.caminho(r.resultado.id)}`);
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(saida.texto);
      });
    });
    servidor.listen(porta, () => ok({ ...gas, servidor, url: `http://127.0.0.1:${servidor.address().port}/exec` }));
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const segredo = process.env.GAS_DRIVE_SECRET || 'simulador-drive-'.padEnd(40, 'x');
  const s = await iniciarSimuladorDrive({ segredo, porta: 8788, pastaSaida: path.join(dir, '..', 'data', 'drive-simulado') });
  console.log(`Simulador do Apps Script (Drive) em ${s.url}`);
}
