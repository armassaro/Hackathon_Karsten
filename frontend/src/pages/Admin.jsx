// Administração: usuários e papéis, tokens de API e auditoria.
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { dataHora, PAPEL_ROTULO } from '../fmt.js';
import { Botao, Campo, Cartao, Entrada, Modal, Selecao, Selo, Tabela, Vazio, useAvisar, useConfirmar, useErroApi } from '../components/ui.jsx';
import { Cabecalho } from './Cadastros.jsx';

const TOM_PAPEL = { admin: 'accent', engenheiro: 'ok', leitor: 'neutro' };

export default function Admin({ usuario }) {
  const [aba, setAba] = useState('usuarios');
  return (
    <div className="flex flex-col gap-5">
      <Cabecalho titulo="Administração" sub="Quem pode fazer o quê, integrações por token e trilha de auditoria." />
      <div className="flex gap-1 border-b border-line text-sm">
        {[['usuarios', 'Usuários'], ['tokens', 'Tokens de API'], ['log', 'Auditoria']].map(([id, r]) => (
          <button key={id} onClick={() => setAba(id)} className={`-mb-px border-b-2 px-4 py-2 font-medium ${aba === id ? 'border-accent text-accent' : 'border-transparent text-ink-3 hover:text-ink'}`}>{r}</button>
        ))}
      </div>
      {aba === 'usuarios' && <Usuarios eu={usuario} />}
      {aba === 'tokens' && <Tokens />}
      {aba === 'log' && <Log />}
    </div>
  );
}

function Usuarios({ eu }) {
  const [lista, setLista] = useState(null);
  const [form, setForm] = useState(null);
  const [erros, setErros] = useState([]);
  const erroApi = useErroApi();
  const avisar = useAvisar();
  const carregar = useCallback(() => api.get('/admin/usuarios').then(setLista).catch(erroApi), [erroApi]);
  useEffect(() => { carregar(); }, [carregar]);

  async function salvar(e) {
    e.preventDefault(); setErros([]);
    try { await api.post('/admin/usuarios', form); avisar('Usuário salvo. Mudanças de papel valem em até 30 s.'); setForm(null); carregar(); }
    catch (err) { setErros(err.erros?.length ? err.erros : [err.message]); }
  }

  return (
    <Cartao titulo="Usuários autorizados" acao={<Botao tamanho="sm" onClick={() => { setErros([]); setForm({ email: '', nome: '', papel: 'engenheiro', ativo: true, novo: true }); }}>+ Novo usuário</Botao>} corpoClassName="p-0">
      {!lista ? <p className="p-6 text-sm text-ink-3">Carregando…</p> : (
        <Tabela colunas={[{ rotulo: 'Nome' }, { rotulo: 'E-mail' }, { rotulo: 'Papel' }, { rotulo: 'Situação' }, { rotulo: '', className: 'w-1' }]}>
          {lista.map((u) => (
            <tr key={u.email}>
              <td className="px-3 py-2.5 font-medium">{u.nome} {u.email === eu.email && <span className="text-ink-3">(você)</span>}</td>
              <td className="px-3 py-2.5">{u.email}</td>
              <td className="px-3 py-2.5"><Selo tom={TOM_PAPEL[u.papel]}>{PAPEL_ROTULO[u.papel]}</Selo></td>
              <td className="px-3 py-2.5">{u.ativo ? <Selo tom="ok">ativo</Selo> : <Selo tom="warn">inativo</Selo>}</td>
              <td className="px-3 py-1.5"><Botao tamanho="sm" variante="fantasma" onClick={() => { setErros([]); setForm({ ...u }); }}>✏ Editar</Botao></td>
            </tr>
          ))}
        </Tabela>
      )}
      <div className="border-t border-line px-4 py-3 text-[13px] text-ink-3">
        <b>Leitor</b>: consulta máquinas e MTM · <b>Engenheiro</b>: + gera, exporta e recebe POs · <b>Administrador</b>: + cadastros, usuários e tokens.
      </div>
      <Modal aberto={!!form} titulo={form?.novo ? 'Novo usuário' : `Editar ${form?.email}`} aoFechar={() => setForm(null)}
        rodape={<><Botao variante="secundario" onClick={() => setForm(null)}>Cancelar</Botao><Botao type="submit" form="form-usuario">Salvar</Botao></>}>
        {form && (
          <form id="form-usuario" onSubmit={salvar} className="flex flex-col gap-4">
            <Campo rotulo="E-mail corporativo"><Entrada type="email" value={form.email} disabled={!form.novo} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Campo>
            <Campo rotulo="Nome"><Entrada value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></Campo>
            <Campo rotulo="Papel">
              <Selecao value={form.papel} onChange={(e) => setForm({ ...form, papel: e.target.value })}>
                {Object.entries(PAPEL_ROTULO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Selecao>
            </Campo>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} /> Ativo (pode entrar no sistema)</label>
            {erros.length > 0 && <ul className="rounded-md bg-bad-soft px-3 py-2 text-sm text-bad">{erros.map((x) => <li key={x}>• {x}</li>)}</ul>}
          </form>
        )}
      </Modal>
    </Cartao>
  );
}

function Tokens() {
  const [lista, setLista] = useState(null);
  const [form, setForm] = useState(null);
  const [criado, setCriado] = useState(null);
  const erroApi = useErroApi();
  const avisar = useAvisar();
  const confirmar = useConfirmar();
  const carregar = useCallback(() => api.get('/admin/tokens').then(setLista).catch(erroApi), [erroApi]);
  useEffect(() => { carregar(); }, [carregar]);

  async function criar(e) {
    e.preventDefault();
    try { const t = await api.post('/admin/tokens', form); setForm(null); setCriado(t); carregar(); } catch (err) { erroApi(err); }
  }
  async function revogar(t) {
    if (!await confirmar({ titulo: `Revogar "${t.nome}"?`, perigo: true, confirmar: 'Revogar', mensagem: 'Integrações que usam este token param de funcionar imediatamente.' })) return;
    try { await api.del(`/admin/tokens/${t.id}`); avisar('Token revogado.'); carregar(); } catch (err) { erroApi(err); }
  }
  const exemplo = criado && `curl -H "Authorization: Bearer ${criado.token}" \\\n     -F "arquivos=@demanda_000.txt" \\\n     "${location.origin}/api/po/importar?saida=xlsx" -o PO.xlsx`;

  return (
    <Cartao titulo="Tokens de API" acao={<Botao tamanho="sm" onClick={() => setForm({ nome: '', papel: 'engenheiro' })}>+ Novo token</Botao>} corpoClassName="p-0">
      <p className="border-b border-line px-4 py-3 text-[13px] text-ink-3">Para automações (ex.: um script da Engenharia que gera POs em lote). Guardamos só o hash: o valor aparece uma única vez.</p>
      {!lista ? <p className="p-6 text-sm text-ink-3">Carregando…</p> : !lista.length ? <div className="p-4"><Vazio>Nenhum token emitido.</Vazio></div> : (
        <Tabela colunas={[{ rotulo: 'Nome' }, { rotulo: 'Prefixo' }, { rotulo: 'Papel' }, { rotulo: 'Criado em' }, { rotulo: 'Situação' }, { rotulo: '', className: 'w-1' }]}>
          {lista.map((t) => (
            <tr key={t.id} className={t.revogado ? 'text-ink-3' : ''}>
              <td className="px-3 py-2.5 font-medium">{t.nome}</td>
              <td className="num px-3 py-2.5">{t.prefixo}…</td>
              <td className="px-3 py-2.5"><Selo tom={TOM_PAPEL[t.papel]}>{PAPEL_ROTULO[t.papel]}</Selo></td>
              <td className="px-3 py-2.5">{dataHora(t.criado_em)}</td>
              <td className="px-3 py-2.5">{t.revogado ? <Selo tom="bad">revogado</Selo> : <Selo tom="ok">ativo</Selo>}</td>
              <td className="px-3 py-1.5">{!t.revogado && <Botao tamanho="sm" variante="perigoSuave" onClick={() => revogar(t)}>Revogar</Botao>}</td>
            </tr>
          ))}
        </Tabela>
      )}
      <Modal aberto={!!form} titulo="Novo token de API" aoFechar={() => setForm(null)}
        rodape={<><Botao variante="secundario" onClick={() => setForm(null)}>Cancelar</Botao><Botao type="submit" form="form-token">Gerar token</Botao></>}>
        {form && (
          <form id="form-token" onSubmit={criar} className="flex flex-col gap-4">
            <Campo rotulo="Nome / finalidade"><Entrada value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Script de lote da Engenharia" /></Campo>
            <Campo rotulo="Papel"><Selecao value={form.papel} onChange={(e) => setForm({ ...form, papel: e.target.value })}><option value="engenheiro">Engenheiro</option><option value="leitor">Leitor</option></Selecao></Campo>
          </form>
        )}
      </Modal>
      <Modal aberto={!!criado} titulo="Token criado: copie agora" aoFechar={() => setCriado(null)} largura="max-w-2xl"
        rodape={<Botao onClick={() => setCriado(null)}>Já copiei</Botao>}>
        {criado && <div className="flex flex-col gap-3">
          <p className="text-sm text-warn">Este valor não será exibido de novo.</p>
          <div className="flex gap-2">
            <code className="num flex-1 overflow-x-auto rounded-md border border-line bg-paper px-3 py-2 text-[13px]">{criado.token}</code>
            <Botao variante="secundario" onClick={() => { navigator.clipboard?.writeText(criado.token); avisar('Copiado.'); }}>Copiar</Botao>
          </div>
          <p className="text-[13px] text-ink-3">Exemplo de uso:</p>
          <pre className="num overflow-x-auto rounded-md bg-ink px-3 py-2 text-[12px] text-white">{exemplo}</pre>
        </div>}
      </Modal>
    </Cartao>
  );
}

function Log() {
  const [lista, setLista] = useState(null);
  const erroApi = useErroApi();
  const carregar = useCallback(() => api.get('/admin/log?limite=200').then(setLista).catch(erroApi), [erroApi]);
  useEffect(() => { carregar(); }, [carregar]);
  const tom = (a) => (a === 'ACESSO_NEGADO' ? 'bad' : /LOGIN|CODIGO/.test(a) ? 'accent' : /PO_/.test(a) ? 'ok' : 'neutro');
  return (
    <Cartao titulo="Auditoria (últimos 200 eventos)" acao={<Botao tamanho="sm" variante="secundario" onClick={carregar}>Atualizar</Botao>} corpoClassName="p-0">
      {!lista ? <p className="p-6 text-sm text-ink-3">Carregando…</p> : !lista.length ? <div className="p-4"><Vazio>Sem eventos.</Vazio></div> : (
        <Tabela colunas={[{ rotulo: 'Quando', className: 'w-44' }, { rotulo: 'Quem' }, { rotulo: 'Ação' }, { rotulo: 'Detalhes' }]}>
          {lista.map((l, i) => (
            <tr key={i}>
              <td className="px-3 py-2 text-[13px] whitespace-nowrap text-ink-3">{dataHora(l.data)}</td>
              <td className="px-3 py-2 text-[13px]">{l.email}</td>
              <td className="px-3 py-2"><Selo tom={tom(l.acao)}>{l.acao}</Selo></td>
              <td className="num max-w-[420px] truncate px-3 py-2 text-[12px] text-ink-3" title={l.detalhes}>{l.detalhes}</td>
            </tr>
          ))}
        </Tabela>
      )}
    </Cartao>
  );
}
