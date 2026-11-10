import { Router } from 'express';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { config } from '../config.js';
import { gerarCodigo, verificarCodigo } from '../auth/codigos.js';
import { autenticar, emitirSessao, COOKIE } from '../auth/middleware.js';
import { emailSchema, codigoSchema } from '../schemas.js';

// Limites por IP + e-mail, em janelas de 15 minutos:
//  - pedir código: 5 vezes (além do intervalo de 30 s entre reenvios);
//  - verificar código: 5 ERROS (acertos não contam).
const chave = (req) => `${ipKeyGenerator(req.ip)}|${String(req.body?.email ?? '').toLowerCase()}`;
const opcoes = { windowMs: 15 * 60_000, limit: 5, keyGenerator: chave, standardHeaders: true, legacyHeaders: false,
  message: { erro: 'Muitas tentativas. Tente de novo em 15 minutos.' } };
const limiteSolicitar = rateLimit(opcoes);
const limiteVerificar = rateLimit({ ...opcoes, skipSuccessfulRequests: true });

const MSG_GENERICA = 'Se o e-mail estiver autorizado, você receberá um código em instantes.';

export function rotasAuth(store) {
  const r = Router();

  r.post('/solicitar-codigo', limiteSolicitar, async (req, res) => {
    const { email } = emailSchema.parse(req.body);
    const u = (await store.listarUsuarios()).find((x) => x.email === email && x.ativo !== false);
    // Mesma resposta para e-mail cadastrado ou não: não revela quem tem acesso.
    if (!u) return res.json({ mensagem: MSG_GENERICA });
    const codigo = gerarCodigo(email);
    await store.enviarCodigo(email, codigo);
    res.json({ mensagem: MSG_GENERICA, ...(config.exibirCodigoNaTela && { codigoDev: codigo }) });
  });

  r.post('/verificar-codigo', limiteVerificar, async (req, res) => {
    const { email, codigo } = codigoSchema.parse(req.body);
    if (!verificarCodigo(email, codigo)) return res.status(401).json({ erro: 'Código inválido ou expirado.' });
    const u = (await store.listarUsuarios()).find((x) => x.email === email && x.ativo !== false);
    if (!u) return res.status(401).json({ erro: 'Usuário inativo.' });
    emitirSessao(res, u);
    store.registrarLog(email, 'LOGIN', { via: 'codigo_email' }).catch(() => {});
    res.json({ usuario: { email: u.email, nome: u.nome, papel: u.papel } });
  });

  r.post('/logout', (req, res) => {
    res.clearCookie(COOKIE, { path: '/' });
    res.json({ ok: true });
  });

  r.get('/eu', autenticar(store), (req, res) => {
    res.json({ usuario: req.user, modo: store.nome });
  });

  return r;
}
