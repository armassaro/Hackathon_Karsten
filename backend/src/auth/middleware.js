// Autenticação (cookie JWT ou token de API) e autorização por papel.
// As três formas de entrada convergem para req.user = { email, nome, papel, via }.
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export const PAPEIS = ['leitor', 'engenheiro', 'admin']; // ordem crescente de permissão
export const COOKIE = 'sessao';

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export function emitirSessao(res, usuario) {
  const token = jwt.sign({ email: usuario.email }, config.jwtSecret, { expiresIn: `${config.sessaoHoras}h` });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    secure: config.producao,
    sameSite: 'strict',
    maxAge: config.sessaoHoras * 3600_000,
    path: '/',
  });
}

export function autenticar(store) {
  return async (req, res, next) => {
    try {
      const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, '');

      if (bearer?.startsWith('tm_live_')) {
        const h = hashToken(bearer);
        const tok = (await store.listarTokens()).find((t) => t.hash === h && !t.revogado);
        if (!tok) return res.status(401).json({ erro: 'Token de API inválido ou revogado.' });
        req.user = { email: tok.email, nome: `Token: ${tok.nome}`, papel: tok.papel, via: 'token' };
        return next();
      }

      const token = req.cookies?.[COOKIE] || bearer;
      if (!token) return res.status(401).json({ erro: 'Não autenticado.' });
      const { email } = jwt.verify(token, config.jwtSecret);

      // O papel vem SEMPRE do cadastro atual (não do JWT): desativar ou rebaixar
      // um usuário vale em até 30 s, sem esperar a sessão expirar.
      const u = (await store.listarUsuarios()).find((x) => x.email === email);
      if (!u || u.ativo === false) return res.status(401).json({ erro: 'Usuário inativo.' });
      req.user = { email: u.email, nome: u.nome, papel: u.papel, via: 'sessao' };
      next();
    } catch (e) {
      if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') return res.status(401).json({ erro: 'Sessão expirada. Entre novamente.' });
      next(e);
    }
  };
}

/** exigir('engenheiro') libera engenheiro e admin. */
export function exigir(papelMinimo, store) {
  return (req, res, next) => {
    if (PAPEIS.indexOf(req.user?.papel) >= PAPEIS.indexOf(papelMinimo)) return next();
    store?.registrarLog(req.user?.email ?? 'anônimo', 'ACESSO_NEGADO', { rota: `${req.method} ${req.originalUrl}`, papel: req.user?.papel })
      .catch(() => {});
    res.status(403).json({ erro: `Sem permissão: esta ação exige papel "${papelMinimo}" ou superior.` });
  };
}
