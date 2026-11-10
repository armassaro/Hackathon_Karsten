// Store LOCAL: mesmos métodos do store Google, persistidos em data/db.local.json.
// Na primeira execução, semeia MTM e máquinas a partir de data/Entradas.ods
// e cria o administrador definido em ADMIN_EMAIL.
import fs from 'node:fs';
import { config } from '../config.js';
import { lerCatalogoArquivo } from '../ingest/catalogo.js';

function carregar() {
  if (fs.existsSync(config.caminhos.bancoLocal)) return JSON.parse(fs.readFileSync(config.caminhos.bancoLocal, 'utf8'));
  const { elementos, maquinas } = lerCatalogoArquivo(config.caminhos.entradasPadrao);
  return {
    mtm: elementos,
    maquinas: maquinas.map((m) => ({ ...m, ativo: true })),
    usuarios: [{ email: config.adminEmail, nome: 'Administrador', papel: 'admin', ativo: true }],
    tokens: [],
    log: [],
  };
}

export function criarStoreLocal() {
  let db = carregar();
  const salvar = () => {
    const tmp = config.caminhos.bancoLocal + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
    fs.renameSync(tmp, config.caminhos.bancoLocal); // escrita atômica
  };
  salvar();

  const exigir = (item, msg) => { if (!item) throw new Error(msg); return item; };

  return {
    nome: 'local',

    // ---------- Máquinas (TEMPO-CM) ----------
    async listarMaquinas() { return structuredClone(db.maquinas); },
    async criarMaquina(m) {
      if (db.maquinas.some((x) => x.codigo === m.codigo)) throw new Error(`Já existe máquina com código ${m.codigo}.`);
      db.maquinas.push({ ...m, ativo: true }); salvar(); return m;
    },
    async atualizarMaquina(codigo, m) {
      const atual = exigir(db.maquinas.find((x) => x.codigo === codigo), `Máquina ${codigo} não encontrada.`);
      Object.assign(atual, m, { codigo }); salvar(); return atual;
    },
    async desativarMaquina(codigo) {
      const atual = exigir(db.maquinas.find((x) => x.codigo === codigo), `Máquina ${codigo} não encontrada.`);
      atual.ativo = false; salvar(); return atual;
    },
    async reativarMaquina(codigo) {
      const atual = exigir(db.maquinas.find((x) => x.codigo === codigo), `Máquina ${codigo} não encontrada.`);
      atual.ativo = true; salvar(); return atual;
    },

    // ---------- Matriz de elementos (MTM) ----------
    async listarMTM() { return structuredClone(db.mtm); },
    async criarMTM(e) {
      if (db.mtm.some((x) => x.codigo === e.codigo)) throw new Error(`Já existe elemento ${e.codigo}.`);
      db.mtm.push(e); salvar(); return e;
    },
    async atualizarMTM(codigo, e) {
      const atual = exigir(db.mtm.find((x) => x.codigo === codigo), `Elemento ${codigo} não encontrado.`);
      Object.assign(atual, e, { codigo }); salvar(); return atual;
    },
    async removerMTM(codigo) {
      const antes = db.mtm.length;
      db.mtm = db.mtm.filter((x) => x.codigo !== codigo);
      if (db.mtm.length === antes) throw new Error(`Elemento ${codigo} não encontrado.`);
      salvar();
    },

    // Substitui a matriz MTM e faz upsert das máquinas (as ausentes no arquivo são desativadas).
    async importarCatalogo({ elementos, maquinas }) {
      db.mtm = elementos;
      const codigos = new Set(maquinas.map((m) => m.codigo));
      db.maquinas.forEach((m) => { if (!codigos.has(m.codigo)) m.ativo = false; });
      for (const m of maquinas) {
        const atual = db.maquinas.find((x) => x.codigo === m.codigo);
        if (atual) Object.assign(atual, m, { ativo: true }); else db.maquinas.push({ ...m, ativo: true });
      }
      salvar();
      return { elementos: elementos.length, maquinas: maquinas.length };
    },

    // ---------- Usuários ----------
    async listarUsuarios() { return structuredClone(db.usuarios); },
    async salvarUsuario(u) {
      const atual = db.usuarios.find((x) => x.email === u.email);
      if (atual) Object.assign(atual, u); else db.usuarios.push(u);
      salvar(); return u;
    },

    // ---------- Tokens de API (só o hash é guardado) ----------
    async listarTokens() { return structuredClone(db.tokens); },
    async criarToken(t) { db.tokens.push(t); salvar(); return t; },
    async revogarToken(id) {
      const t = exigir(db.tokens.find((x) => x.id === id), 'Token não encontrado.');
      t.revogado = true; salvar(); return t;
    },

    // ---------- Auditoria ----------
    async registrarLog(email, acao, detalhes) {
      db.log.push({ data: new Date().toISOString(), email, acao, detalhes: JSON.stringify(detalhes ?? {}).slice(0, 500) });
      if (db.log.length > 2000) db.log = db.log.slice(-2000);
      salvar();
    },
    async listarLog(limite = 100) { return db.log.slice(-limite).reverse(); },

    // ---------- E-mail (simulado no console) ----------
    async enviarCodigo(email, codigo) {
      console.log(`\n[modo local] Código de acesso para ${email}: ${codigo}  (válido por 10 min)\n`);
    },
    async enviarPO(actor, anexo) {
      const destino = `${config.caminhos.dados}/enviados`;
      fs.mkdirSync(destino, { recursive: true });
      fs.writeFileSync(`${destino}/${Date.now()}-${anexo.nomeArquivo}`, Buffer.from(anexo.base64, 'base64'));
      console.log(`[modo local] PO "${anexo.nomeArquivo}" que iria para ${actor} salva em data/enviados/`);
      return { enviadoPara: actor, simulado: true };
    },
  };
}
