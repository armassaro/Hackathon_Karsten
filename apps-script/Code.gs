/**
 * Auto-T&M Karsten — Google Apps Script
 * Banco de dados (Planilhas), auditoria e envio de e-mail.
 *
 * Só aceita requisições assinadas pelo backend (HMAC-SHA256 + timestamp + nonce).
 * O destinatário de e-mails é SEMPRE o "actor" assinado, nunca um valor vindo do navegador.
 *
 * Configuração (Projeto > Configurações > Propriedades do script):
 *   GAS_SECRET   mesmo valor do backend/.env (mínimo 32 caracteres)
 *   ADMIN_EMAIL  e-mail do primeiro administrador
 *   SHEET_ID     (opcional) ID da planilha; se vazio, usa a planilha à qual o script está vinculado
 * Depois rode a função setup() uma vez pelo editor.
 */

const PROPS = PropertiesService.getScriptProperties();
const JANELA_MS = 60 * 1000;

const ABAS = {
  TEMPO_CM: ['codigo', 'tipo', 'descricao', 'rpm', 'tempo_por_metro', 'ativo'],
  MATRIZ_MTM: ['codigo', 'descricao', 'tempo_min'],
  USUARIOS: ['email', 'nome', 'papel', 'ativo'],
  TOKENS: ['id', 'nome', 'papel', 'email', 'hash', 'prefixo', 'criado_em', 'revogado'],
  LOG: ['data', 'email', 'acao', 'detalhes'],
};
const COLUNAS_TEXTO = ['codigo', 'email', 'id', 'hash', 'prefixo']; // evita "2.1" virar número
const PAPEIS = ['leitor', 'engenheiro', 'admin'];

function planilha_() {
  const id = PROPS.getProperty('SHEET_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}

// ============================================================ Roteador

const ACOES = {
  // leitura (sem lock)
  listMachines:   { fn: listMachines,  papel: null },
  listMTM:        { fn: listMTM,       papel: null },
  listUsers:      { fn: listUsers,     papel: null },
  listTokens:     { fn: listTokens,    papel: null },
  listLog:        { fn: listLog,       papel: null },
  // escrita (lock + papel conferido de novo aqui: defesa em profundidade)
  createMachine:  { fn: createMachine,  papel: 'admin', escrita: true },
  updateMachine:  { fn: updateMachine,  papel: 'admin', escrita: true },
  deleteMachine:  { fn: deleteMachine,  papel: 'admin', escrita: true },
  restoreMachine: { fn: restoreMachine, papel: 'admin', escrita: true },
  createMTM:      { fn: createMTM,      papel: 'admin', escrita: true },
  updateMTM:      { fn: updateMTM,      papel: 'admin', escrita: true },
  deleteMTM:      { fn: deleteMTM,      papel: 'admin', escrita: true },
  importCatalog:  { fn: importCatalog,  papel: 'admin', escrita: true },
  saveUser:       { fn: saveUser,       papel: 'admin', escrita: true },
  createToken:    { fn: createToken,    papel: 'admin', escrita: true },
  revokeToken:    { fn: revokeToken,    papel: 'admin', escrita: true },
  log:            { fn: logAction,      papel: null,    escrita: true, semLog: true },
  sendLoginCode:  { fn: sendLoginCode,  papel: 'leitor', escrita: true },
  sendPO:         { fn: sendPO,         papel: 'engenheiro', escrita: true },
};

function doPost(e) {
  try {
    const corpo = JSON.parse(e.postData.contents);
    verificarAssinatura_(corpo.base, corpo.sig);
    const req = JSON.parse(corpo.base);
    const acao = ACOES[req.action];
    if (!acao) throw new Error('Ação inválida: ' + req.action);
    if (acao.papel) exigirPapel_(req.actor, acao.papel);

    if (!acao.escrita) return out_({ ok: true, resultado: acao.fn(req.data || {}, req.actor) });

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const resultado = acao.fn(req.data || {}, req.actor);
      if (!acao.semLog) registrar_(req.actor, req.action, req.data);
      return out_({ ok: true, resultado: resultado });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return out_({ erro: err.message });
  }
}

function doGet() {
  return out_({ ok: true, servico: 'Auto-T&M Karsten', aviso: 'Use POST assinado.' });
}

function verificarAssinatura_(base, sig) {
  const segredo = PROPS.getProperty('GAS_SECRET');
  if (!segredo) throw new Error('GAS_SECRET não configurado no Apps Script.');
  if (!base || !sig) throw new Error('Requisição sem assinatura.');
  const esperado = Utilities.base64Encode(Utilities.computeHmacSha256Signature(base, segredo, Utilities.Charset.UTF_8));
  if (!igualConstante_(esperado, sig)) throw new Error('Assinatura inválida.');

  const req = JSON.parse(base);
  if (Math.abs(Date.now() - Number(req.ts)) > JANELA_MS) throw new Error('Requisição expirada.');
  const cache = CacheService.getScriptCache();
  if (cache.get('n_' + req.nonce)) throw new Error('Replay detectado.');
  cache.put('n_' + req.nonce, '1', 120);
}

function igualConstante_(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function exigirPapel_(email, minimo) {
  const u = listUsers().filter(function (x) { return x.email === String(email).toLowerCase() && x.ativo; })[0];
  if (!u) throw new Error('Usuário não autorizado.');
  if (PAPEIS.indexOf(u.papel) < PAPEIS.indexOf(minimo)) throw new Error('Sem permissão no Apps Script.');
  return u;
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================ Acesso genérico às abas

function aba_(nome) {
  const sh = planilha_().getSheetByName(nome);
  if (!sh) throw new Error('Aba ' + nome + ' não existe. Rode setup().');
  return sh;
}

function ler_(nome) {
  const valores = aba_(nome).getDataRange().getValues();
  const cab = valores.shift();
  return valores
    .filter(function (l) { return l.some(function (c) { return c !== ''; }); })
    .map(function (l) {
      const o = {};
      cab.forEach(function (h, i) { o[h] = COLUNAS_TEXTO.indexOf(h) >= 0 ? String(l[i]) : l[i]; });
      return o;
    });
}

function linhaDe_(nome, coluna, valor) {
  const sh = aba_(nome);
  const cab = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const idx = cab.indexOf(coluna);
  const dados = sh.getRange(1, idx + 1, sh.getLastRow(), 1).getValues();
  for (let i = 1; i < dados.length; i++) if (String(dados[i][0]) === String(valor)) return i + 1;
  return -1;
}

function escrever_(nome, linha, obj) {
  const sh = aba_(nome);
  const valores = [ABAS[nome].map(function (h) { return obj[h] === undefined ? '' : obj[h]; })];
  if (linha > 0) sh.getRange(linha, 1, 1, valores[0].length).setValues(valores);
  else sh.appendRow(valores[0]);
}

function atualizar_(nome, coluna, valor, mudancas) {
  const linha = linhaDe_(nome, coluna, valor);
  if (linha < 0) throw new Error('Registro ' + valor + ' não encontrado em ' + nome + '.');
  const sh = aba_(nome);
  const atual = {};
  const linhaValores = sh.getRange(linha, 1, 1, ABAS[nome].length).getValues()[0];
  ABAS[nome].forEach(function (h, i) { atual[h] = linhaValores[i]; });
  Object.keys(mudancas).forEach(function (k) { if (ABAS[nome].indexOf(k) >= 0) atual[k] = mudancas[k]; });
  escrever_(nome, linha, atual);
  return atual;
}

// ============================================================ Máquinas (TEMPO-CM)

function listMachines() {
  return ler_('TEMPO_CM').map(function (m) {
    return { codigo: m.codigo, tipo: m.tipo, descricao: m.descricao, rpm: Number(m.rpm),
             tempo_por_metro: Number(m.tempo_por_metro), ativo: m.ativo !== false && m.ativo !== 'FALSE' };
  });
}
function createMachine(m) {
  if (linhaDe_('TEMPO_CM', 'codigo', m.codigo) > 0) throw new Error('Já existe máquina com código ' + m.codigo + '.');
  m.ativo = true;
  escrever_('TEMPO_CM', -1, m);
  return m;
}
function updateMachine(m) { return atualizar_('TEMPO_CM', 'codigo', m.codigo, m); }
function deleteMachine(d) { return atualizar_('TEMPO_CM', 'codigo', d.codigo, { ativo: false }); }   // soft delete
function restoreMachine(d) { return atualizar_('TEMPO_CM', 'codigo', d.codigo, { ativo: true }); }

// ============================================================ Matriz MTM

function listMTM() {
  return ler_('MATRIZ_MTM').map(function (e) { return { codigo: e.codigo, descricao: e.descricao, tempo_min: Number(e.tempo_min) }; });
}
function createMTM(e) {
  if (linhaDe_('MATRIZ_MTM', 'codigo', e.codigo) > 0) throw new Error('Já existe elemento ' + e.codigo + '.');
  escrever_('MATRIZ_MTM', -1, e);
  return e;
}
function updateMTM(e) { return atualizar_('MATRIZ_MTM', 'codigo', e.codigo, e); }
function deleteMTM(d) {
  const linha = linhaDe_('MATRIZ_MTM', 'codigo', d.codigo);
  if (linha < 0) throw new Error('Elemento ' + d.codigo + ' não encontrado.');
  aba_('MATRIZ_MTM').deleteRow(linha);
  return { ok: true };
}

function importCatalog(cat) {
  const mtm = aba_('MATRIZ_MTM');
  if (mtm.getLastRow() > 1) mtm.getRange(2, 1, mtm.getLastRow() - 1, mtm.getLastColumn()).clearContent();
  if (cat.elementos.length) {
    mtm.getRange(2, 1, cat.elementos.length, 3).setValues(cat.elementos.map(function (e) { return [e.codigo, e.descricao, e.tempo_min]; }));
  }
  const codigos = cat.maquinas.map(function (m) { return String(m.codigo); });
  listMachines().forEach(function (m) { if (codigos.indexOf(m.codigo) < 0) deleteMachine({ codigo: m.codigo }); });
  cat.maquinas.forEach(function (m) {
    m.ativo = true;
    escrever_('TEMPO_CM', linhaDe_('TEMPO_CM', 'codigo', m.codigo), m);
  });
  return { elementos: cat.elementos.length, maquinas: cat.maquinas.length };
}

// ============================================================ Usuários e tokens

function listUsers() {
  return ler_('USUARIOS').map(function (u) {
    return { email: u.email.toLowerCase(), nome: u.nome, papel: u.papel, ativo: u.ativo !== false && u.ativo !== 'FALSE' };
  });
}
function saveUser(u) {
  escrever_('USUARIOS', linhaDe_('USUARIOS', 'email', u.email), u);
  return u;
}
function listTokens() {
  return ler_('TOKENS').map(function (t) {
    t.revogado = t.revogado === true || t.revogado === 'TRUE';
    t.criado_em = t.criado_em instanceof Date ? t.criado_em.toISOString() : String(t.criado_em);
    return t;
  });
}
function createToken(t) { escrever_('TOKENS', -1, t); return { id: t.id }; }   // só o hash chega aqui
function revokeToken(d) { atualizar_('TOKENS', 'id', d.id, { revogado: true }); return { ok: true }; }

// ============================================================ Auditoria

function registrar_(email, acao, dados) {
  const det = JSON.stringify(dados || {});
  aba_('LOG').appendRow([new Date(), email, acao, det.length > 500 ? det.slice(0, 500) + '…' : det]);
}
function logAction(d, actor) { registrar_(actor, d.acao, d.detalhes); return { ok: true }; }
function listLog(d) {
  const linhas = ler_('LOG');
  return linhas.slice(-(d.limite || 100)).reverse().map(function (l) {
    return { data: l.data instanceof Date ? l.data.toISOString() : String(l.data), email: l.email, acao: l.acao, detalhes: l.detalhes };
  });
}

// ============================================================ E-mail

function sendLoginCode(d, actor) {
  // exigirPapel_ já garantiu que "actor" é um usuário ativo: não enviamos para e-mails arbitrários.
  MailApp.sendEmail({
    to: actor,
    subject: 'Auto-T&M Karsten — seu código de acesso: ' + d.codigo,
    htmlBody: '<p>Seu código de acesso é:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">' +
      esc_(d.codigo) + '</p><p>Ele vale por 10 minutos. Se você não pediu, ignore este e-mail.</p>',
  });
  registrar_(actor, 'CODIGO_ENVIADO', {});
  return { ok: true };
}

function sendPO(d, actor) {
  if (MailApp.getRemainingDailyQuota() < 1) throw new Error('Cota diária de e-mails esgotada.');
  const anexo = Utilities.newBlob(
    Utilities.base64Decode(d.base64),
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    d.nomeArquivo
  );
  const linhas = (d.resumo || []).map(function (p) {
    return '<tr><td style="padding:4px 10px">' + esc_(p.titulo) + '</td><td style="padding:4px 10px">' + esc_(p.operacao) +
      '</td><td style="padding:4px 10px;text-align:right"><b>' + Number(p.tp_min).toFixed(4) + ' min</b></td></tr>';
  }).join('');
  MailApp.sendEmail({
    to: actor, // SEMPRE o usuário autenticado e assinado pelo backend
    subject: 'Ficha PO — ' + (d.resumo && d.resumo.length === 1 ? d.resumo[0].titulo : d.resumo.length + ' operações'),
    htmlBody: '<p>Segue a ficha de Processo Operacional gerada pelo Auto-T&M.</p>' +
      '<table border="1" style="border-collapse:collapse;font-family:Arial;font-size:13px">' +
      '<tr style="background:#d9d9d9"><th>PO</th><th>Operação</th><th>TP</th></tr>' + linhas + '</table>',
    attachments: [anexo],
  });
  return { enviadoPara: actor };
}

function esc_(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

// ============================================================ Instalação

/** Rode UMA vez pelo editor: cria as abas, semeia o Kit de Apoio e o primeiro admin. */
function setup() {
  const ss = planilha_();
  Object.keys(ABAS).forEach(function (nome) {
    let sh = ss.getSheetByName(nome);
    if (!sh) sh = ss.insertSheet(nome);
    if (sh.getLastRow() === 0) {
      sh.appendRow(ABAS[nome]);
      sh.getRange(1, 1, 1, ABAS[nome].length).setFontWeight('bold').setBackground('#d9d9d9');
      sh.setFrozenRows(1);
    }
    ABAS[nome].forEach(function (h, i) {
      if (COLUNAS_TEXTO.indexOf(h) >= 0) sh.getRange(1, i + 1, sh.getMaxRows(), 1).setNumberFormat('@');
    });
  });

  if (aba_('MATRIZ_MTM').getLastRow() === 1) {
    importCatalog({
      elementos: [
        { codigo: '1.1', descricao: 'Costurar Elemento (sem tempo)', tempo_min: 0 },
        { codigo: '2.1', descricao: 'Apanhar peça e posicionar na mesa', tempo_min: 0.15 },
        { codigo: '2.2', descricao: 'Apanhar, posicionar e costurar etiqueta', tempo_min: 0.2 },
        { codigo: '2.3', descricao: 'Apanhar a outra extremidade da peça', tempo_min: 0.3 },
        { codigo: '3.1', descricao: 'Ajeitar peça', tempo_min: 0.12 },
        { codigo: '4.1', descricao: 'Dobrar duas vezes para fazer o inicio da bainha', tempo_min: 0.4 },
        { codigo: '5.1', descricao: 'Posicionar no calcador ajustando a peça no aparelho', tempo_min: 0.35 },
        { codigo: '5.2', descricao: 'Posicionar o elástico embutindo na bainha', tempo_min: 0.1 },
        { codigo: '6.1', descricao: 'Cortar para separar', tempo_min: 0.25 },
      ],
      maquinas: [
        { codigo: '1', tipo: 'Interlock', descricao: 'Jack C4', rpm: 5000, tempo_por_metro: 0.0964 },
        { codigo: '2', tipo: 'Interlock', descricao: 'Siruba', rpm: 5000, tempo_por_metro: 0.0835 },
        { codigo: '3', tipo: 'Reta', descricao: 'Jack A5', rpm: 5000, tempo_por_metro: 0.0972 },
      ],
    });
  }

  const admin = (PROPS.getProperty('ADMIN_EMAIL') || '').toLowerCase();
  if (!admin) throw new Error('Defina ADMIN_EMAIL nas Propriedades do script e rode setup() de novo.');
  if (linhaDe_('USUARIOS', 'email', admin) < 0) saveUser({ email: admin, nome: 'Administrador', papel: 'admin', ativo: true });

  Logger.log('Pronto. Agora: Implantar > Nova implantação > App da Web (executar como: você; acesso: qualquer pessoa).');
}

/** Teste rápido pelo editor: confere se o e-mail sai (usa sua própria conta). */
function testarEmail() {
  MailApp.sendEmail(Session.getActiveUser().getEmail(), 'Auto-T&M — teste', 'Apps Script enviando e-mails corretamente.');
}
