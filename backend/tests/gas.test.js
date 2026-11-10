// Segurança do Apps Script (Code.gs executado no simulador).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { carregarGAS } from './gas-simulador.js';
import { assinar } from '../src/services/googleClient.js';

const segredo = 's'.repeat(40);
const admin = 'admin@karsten.test';

function chamar(gas, { action, data = {}, actor = admin, ts = Date.now(), nonce = crypto.randomUUID(), chave = segredo }) {
  const base = JSON.stringify({ action, data, actor, ts, nonce });
  const saida = gas.contexto.doPost({ postData: { contents: JSON.stringify({ base, sig: assinar(base, chave) }) } });
  return JSON.parse(saida.texto);
}

test('assinatura do backend (Node) é aceita pelo Apps Script', () => {
  const gas = carregarGAS({ segredo, admin });
  const r = chamar(gas, { action: 'listMachines' });
  assert.equal(r.resultado.length, 3);
  assert.equal(r.resultado[0].tempo_por_metro, 0.0964);
});

test('assinatura com segredo errado é rejeitada', () => {
  const gas = carregarGAS({ segredo, admin });
  assert.equal(chamar(gas, { action: 'listMachines', chave: 'outro'.repeat(10) }).erro, 'Assinatura inválida.');
});

test('requisição com mais de 60 s é rejeitada', () => {
  const gas = carregarGAS({ segredo, admin });
  assert.equal(chamar(gas, { action: 'listMachines', ts: Date.now() - 61_000 }).erro, 'Requisição expirada.');
});

test('replay (mesmo nonce) é rejeitado', () => {
  const gas = carregarGAS({ segredo, admin });
  const nonce = crypto.randomUUID();
  assert.ok(chamar(gas, { action: 'listMTM', nonce }).ok);
  assert.equal(chamar(gas, { action: 'listMTM', nonce }).erro, 'Replay detectado.');
});

test('defesa em profundidade: actor sem papel admin não altera máquinas nem com assinatura válida', () => {
  const gas = carregarGAS({ segredo, admin });
  chamar(gas, { action: 'saveUser', data: { email: 'leitor@k.test', nome: 'L', papel: 'leitor', ativo: true } });
  const r = chamar(gas, { action: 'deleteMachine', data: { codigo: '1' }, actor: 'leitor@k.test' });
  assert.equal(r.erro, 'Sem permissão no Apps Script.');
});

test('código de login não é enviado para e-mail fora do cadastro', () => {
  const gas = carregarGAS({ segredo, admin });
  assert.equal(chamar(gas, { action: 'sendLoginCode', data: { codigo: '123456' }, actor: 'estranho@x.com' }).erro, 'Usuário não autorizado.');
  assert.equal(gas.emails.length, 0);
});

test('escritas ficam registradas na aba LOG', () => {
  const gas = carregarGAS({ segredo, admin });
  chamar(gas, { action: 'createMachine', data: { codigo: '9', tipo: 'Reta', descricao: 'Teste', rpm: 4000, tempo_por_metro: 0.1 } });
  const log = chamar(gas, { action: 'listLog' }).resultado;
  assert.equal(log[0].acao, 'createMachine');
  assert.equal(log[0].email, admin);
});
