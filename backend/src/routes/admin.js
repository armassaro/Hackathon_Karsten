// Administração: usuários, tokens de API e auditoria.
import crypto from 'node:crypto';
import { Router } from 'express';
import { exigir, hashToken } from '../auth/middleware.js';
import { usuarioSchema, tokenSchema } from '../schemas.js';

export function rotasAdmin(store) {
  const r = Router();
  r.use(exigir('admin', store));
  const log = (req, acao, det) => store.registrarLog(req.user.email, acao, det).catch(() => {});

  r.get('/usuarios', async (req, res) => res.json(await store.listarUsuarios()));

  r.post('/usuarios', async (req, res) => {
    const u = usuarioSchema.parse(req.body);
    if (u.email === req.user.email && (u.papel !== 'admin' || !u.ativo)) {
      return res.status(400).json({ erro: 'Você não pode rebaixar ou desativar a si mesmo.' });
    }
    res.json(await store.salvarUsuario(u, req.user.email));
    log(req, 'USUARIO_SALVO', { email: u.email, papel: u.papel, ativo: u.ativo });
  });

  // Tokens: o valor completo aparece UMA vez, na criação. Guardamos só o hash SHA-256.
  r.get('/tokens', async (req, res) => {
    res.json((await store.listarTokens()).map(({ hash, ...t }) => t));
  });

  r.post('/tokens', async (req, res) => {
    const { nome, papel } = tokenSchema.parse(req.body);
    const valor = `tm_live_${crypto.randomBytes(24).toString('base64url')}`;
    const t = {
      id: crypto.randomUUID(),
      nome,
      papel,
      email: req.user.email,
      hash: hashToken(valor),
      prefixo: valor.slice(0, 12),
      criado_em: new Date().toISOString(),
      revogado: false,
    };
    await store.criarToken(t, req.user.email);
    log(req, 'TOKEN_CRIADO', { id: t.id, nome, papel });
    const { hash, ...publico } = t;
    res.status(201).json({ ...publico, token: valor });
  });

  r.delete('/tokens/:id', async (req, res) => {
    await store.revogarToken(req.params.id, req.user.email);
    log(req, 'TOKEN_REVOGADO', { id: req.params.id });
    res.json({ ok: true });
  });

  r.get('/log', async (req, res) => res.json(await store.listarLog(Number(req.query.limite) || 100)));

  return r;
}
