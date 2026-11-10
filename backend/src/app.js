// Montagem do app Express (separado do server.js para facilitar testes de integração).
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { ZodError } from 'zod';
import { config } from './config.js';
import { ErroValidacao } from './core/motorTM.js';
import { autenticar } from './auth/middleware.js';
import { rotasAuth } from './routes/auth.js';
import { rotasCadastros } from './routes/cadastros.js';
import { rotasPO } from './routes/po.js';
import { rotasAdmin } from './routes/admin.js';

export function criarApp(store) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'same-origin');
    next();
  });
  if (config.origemFrontend) app.use(cors({ origin: config.origemFrontend, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  const api = express.Router();
  api.get('/saude', (req, res) => res.json({ ok: true, modo: store.nome }));
  api.use('/auth', rotasAuth(store));
  api.use(autenticar(store)); // tudo abaixo exige login ou token de API
  api.use('/', rotasCadastros(store));
  api.use('/po', rotasPO(store));
  api.use('/admin', rotasAdmin(store));
  app.use('/api', api);

  // Frontend compilado (npm run build no /frontend) servido pela mesma origem.
  if (fs.existsSync(config.caminhos.frontend)) {
    app.use(express.static(config.caminhos.frontend));
    app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(config.caminhos.frontend, 'index.html')));
  }

  app.use('/api', (req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

  // Tratamento central de erros: mensagens claras para o usuário, detalhes só no log.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof ErroValidacao) return res.status(422).json({ erro: 'Dados inválidos para gerar a PO.', erros: err.erros });
    if (err instanceof ZodError) return res.status(400).json({ erro: 'Dados inválidos.', erros: err.issues.map((i) => i.message) });
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ erro: 'Arquivo maior que 5 MB.' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ erro: 'JSON malformado.' });
    if (err.status) return res.status(err.status).json({ erro: err.message });
    if (/Apps Script/.test(err.message)) return res.status(502).json({ erro: err.message });
    if (/não encontrad|Já existe/.test(err.message)) return res.status(400).json({ erro: err.message });
    console.error(err);
    res.status(500).json({ erro: 'Erro interno. Veja o log do servidor.' });
  });

  return app;
}
