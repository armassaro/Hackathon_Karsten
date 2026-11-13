/**
 * Auto-T&M Karsten — Apps Script do Google Drive (guarda as Fichas PO em PDF).
 *
 * Projeto SEPARADO do apps-script/Code.gs, com o menor privilégio possível:
 *  - Único escopo: drive.file (appsscript.json). O script só enxerga as pastas e arquivos que ELE criou;
 *    o resto do Drive da conta fica invisível para ele.
 *  - Só aceita requisições assinadas pelo backend com HMAC-SHA256 (chave simétrica GAS_DRIVE_SECRET,
 *    a mesma do backend/.env), com timestamp de no máximo 60 s e nonce de uso único (anti-replay).
 *  - O PDF vem preso à assinatura pelo SHA-256 e pelo tamanho: qualquer byte alterado invalida a requisição.
 *  - Arquivos e pastas são criados sem compartilhamento (privados à conta dona da implantação).
 *
 * Organização: Fichas PO / <ano> / <mês> / <arquivo>.pdf  (fuso America/Sao_Paulo)
 *
 * Configuração (Projeto > Configurações > Propriedades do script):
 *   GAS_DRIVE_SECRET   mesmo valor do backend/.env (mínimo 32 caracteres; diferente do GAS_SECRET)
 * Depois rode configurar() uma vez pelo editor (autoriza o escopo e cria a pasta raiz) e implante como
 * App da Web: "Executar como: eu" e "Quem pode acessar: qualquer pessoa".
 */

const PROPS = PropertiesService.getScriptProperties();
const JANELA_MS = 60 * 1000;
const MAX_BYTES = 1024 * 1024; // 1 MB
const FUSO = 'America/Sao_Paulo';
const PASTA_RAIZ = 'Fichas PO';
const TIPO_PASTA = 'application/vnd.google-apps.folder';
const MESES = ['01 - Janeiro', '02 - Fevereiro', '03 - Março', '04 - Abril', '05 - Maio', '06 - Junho',
  '07 - Julho', '08 - Agosto', '09 - Setembro', '10 - Outubro', '11 - Novembro', '12 - Dezembro'];

// ============================================================ Entrada

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) throw publico_('Requisição vazia.');
    if (e.postData.contents.length > MAX_BYTES * 1.4 + 4096) throw publico_('Requisição grande demais.');
    const corpo = JSON.parse(e.postData.contents);
    const req = verificarAssinatura_(corpo.base, corpo.sig);
    if (req.action !== 'guardarFichaPdf') throw publico_('Ação inválida.');
    const bytes = validarPdf_(corpo.pdf, req.data || {});

    const lock = LockService.getScriptLock(); // evita pastas duplicadas em envios simultâneos
    lock.waitLock(20000);
    try {
      return out_({ ok: true, resultado: guardarFicha_(bytes, req.data, req.actor) });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    // Detalhes internos (ex.: falhas da API do Drive) ficam só no log do projeto, visível ao dono.
    if (!err.publico) console.error(err && err.stack ? err.stack : err);
    return out_({ erro: err.publico ? err.message : 'Falha ao guardar o arquivo no Google Drive.' });
  }
}

/** Não revela nada sobre o serviço. */
function doGet() {
  return out_({ erro: 'Método não suportado.' });
}

/** Rode uma vez pelo editor: pede a autorização (drive.file) e cria a pasta raiz. */
function configurar() {
  if (String(PROPS.getProperty('GAS_DRIVE_SECRET') || '').length < 32) {
    throw new Error('Defina GAS_DRIVE_SECRET (mínimo 32 caracteres) nas Propriedades do script.');
  }
  Logger.log('Pasta raiz pronta: ' + pastaRaiz_());
}

// ============================================================ Segurança

function verificarAssinatura_(base, sig) {
  const segredo = PROPS.getProperty('GAS_DRIVE_SECRET');
  if (!segredo || segredo.length < 32) throw publico_('Apps Script sem GAS_DRIVE_SECRET configurado.');
  if (typeof base !== 'string' || typeof sig !== 'string') throw publico_('Requisição sem assinatura.');
  const esperado = Utilities.base64Encode(Utilities.computeHmacSha256Signature(base, segredo, Utilities.Charset.UTF_8));
  if (!igualConstante_(esperado, sig)) throw publico_('Assinatura inválida.');

  const req = JSON.parse(base);
  if (!(Math.abs(Date.now() - Number(req.ts)) <= JANELA_MS)) throw publico_('Requisição expirada.');
  if (typeof req.nonce !== 'string' || req.nonce.length < 16) throw publico_('Requisição inválida.');
  const cache = CacheService.getScriptCache();
  if (cache.get('n_' + req.nonce)) throw publico_('Replay detectado.');
  cache.put('n_' + req.nonce, '1', 120);
  return req;
}

/** Confere tamanho, assinatura do formato (%PDF-) e SHA-256 assinado pelo backend. */
function validarPdf_(pdfBase64, data) {
  if (typeof pdfBase64 !== 'string' || !pdfBase64) throw publico_('PDF ausente.');
  const bytes = Utilities.base64Decode(pdfBase64);
  if (bytes.length > MAX_BYTES) throw publico_('PDF maior que 1 MB.');
  if (bytes.length !== Number(data.tamanho)) throw publico_('PDF não confere com a assinatura.');
  const hash = hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes));
  if (!igualConstante_(hash, String(data.sha256 || ''))) throw publico_('PDF não confere com a assinatura.');
  const MAGICO = [37, 80, 68, 70, 45]; // "%PDF-"
  if (MAGICO.some(function (b, i) { return bytes[i] !== b; })) throw publico_('O arquivo não é um PDF.');
  return bytes;
}

function igualConstante_(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// ============================================================ Drive (API avançada v3, escopo drive.file)

function guardarFicha_(bytes, data, actor) {
  const agora = new Date();
  const ano = Utilities.formatDate(agora, FUSO, 'yyyy');
  const mes = MESES[Number(Utilities.formatDate(agora, FUSO, 'M')) - 1];

  const pastaAno = obterOuCriarPasta_(ano, pastaRaiz_());   // 3.1 pasta do ano
  const pastaMes = obterOuCriarPasta_(mes, pastaAno);       // 3.2 pasta do mês
  const nome = nomeSeguro_(data.nome);

  const arquivo = Drive.Files.create({                      // 3.3 o PDF
    name: nome,
    mimeType: 'application/pdf',
    parents: [pastaMes],
    description: String(data.descricao || '').slice(0, 500) + '\nGuardado por: ' + String(actor || '').slice(0, 200),
    appProperties: { origem: 'auto-tm', sha256: String(data.sha256).slice(0, 64) },
  }, Utilities.newBlob(bytes, 'application/pdf', nome), { fields: 'id,name,webViewLink' });

  return { id: arquivo.id, nome: arquivo.name, caminho: [PASTA_RAIZ, ano, mes].join(' / '), link: arquivo.webViewLink };
}

/** Pasta raiz criada pelo próprio script; o ID fica nas propriedades (recriada se for para a lixeira). */
function pastaRaiz_() {
  const id = PROPS.getProperty('PASTA_RAIZ_ID');
  if (id) {
    try {
      const p = Drive.Files.get(id, { fields: 'id,trashed' });
      if (p && !p.trashed) return p.id;
    } catch (e) { /* removida ou inacessível: recria abaixo */ }
  }
  const nova = obterOuCriarPasta_(PASTA_RAIZ, 'root');
  PROPS.setProperty('PASTA_RAIZ_ID', nova);
  return nova;
}

/** Procura a pasta `nome` dentro de `paiId` (só entre as criadas pelo script) e cria se não existir. */
function obterOuCriarPasta_(nome, paiId) {
  const q = "mimeType = '" + TIPO_PASTA + "' and trashed = false and name = '" + aspas_(nome) + "' and '" + aspas_(paiId) + "' in parents";
  const achadas = Drive.Files.list({ q: q, fields: 'files(id)', pageSize: 1, spaces: 'drive' });
  if (achadas.files && achadas.files.length) return achadas.files[0].id;
  return Drive.Files.create({ name: nome, mimeType: TIPO_PASTA, parents: [paiId] }, null, { fields: 'id' }).id;
}

// ============================================================ Utilitários

/** Nome de arquivo sem caracteres de controle/separadores, terminado em .pdf, até 120 caracteres. */
function nomeSeguro_(nome) {
  let n = String(nome || 'Ficha_PO').replace(/[^0-9A-Za-zÀ-ÖØ-öø-ÿ._ -]+/g, '_').replace(/^[.\s]+/, '').slice(0, 116);
  if (!/\.pdf$/i.test(n)) n += '.pdf';
  return n;
}

function aspas_(s) { return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }

function hex_(bytes) {
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

function publico_(msg) {
  const e = new Error(msg);
  e.publico = true;
  return e;
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
