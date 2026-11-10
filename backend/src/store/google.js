// Store GOOGLE: cada método vira uma ação assinada no Apps Script (apps-script/Code.gs).
// O "actor" sempre é o e-mail autenticado no backend; o Apps Script usa esse valor
// (e nunca um e-mail vindo do navegador) como destinatário de códigos e fichas.
import { chamarGoogle } from '../services/googleClient.js';

export function criarStoreGoogle() {
  const chamar = (acao, dados, actor) => chamarGoogle(acao, dados, actor);
  return {
    nome: 'google',
    listarMaquinas: () => chamar('listMachines'),
    criarMaquina: (m, actor) => chamar('createMachine', m, actor),
    atualizarMaquina: (codigo, m, actor) => chamar('updateMachine', { ...m, codigo }, actor),
    desativarMaquina: (codigo, actor) => chamar('deleteMachine', { codigo }, actor),
    reativarMaquina: (codigo, actor) => chamar('restoreMachine', { codigo }, actor),

    listarMTM: () => chamar('listMTM'),
    criarMTM: (e, actor) => chamar('createMTM', e, actor),
    atualizarMTM: (codigo, e, actor) => chamar('updateMTM', { ...e, codigo }, actor),
    removerMTM: (codigo, actor) => chamar('deleteMTM', { codigo }, actor),
    importarCatalogo: (cat, actor) => chamar('importCatalog', cat, actor),

    listarUsuarios: () => chamar('listUsers'),
    salvarUsuario: (u, actor) => chamar('saveUser', u, actor),

    listarTokens: () => chamar('listTokens'),
    criarToken: (t, actor) => chamar('createToken', t, actor),
    revogarToken: (id, actor) => chamar('revokeToken', { id }, actor),

    registrarLog: (email, acao, detalhes) => chamar('log', { acao, detalhes }, email),
    listarLog: (limite = 100) => chamar('listLog', { limite }),

    enviarCodigo: (email, codigo) => chamar('sendLoginCode', { codigo }, email),
    enviarPO: (actor, anexo) => chamar('sendPO', anexo, actor),
  };
}
