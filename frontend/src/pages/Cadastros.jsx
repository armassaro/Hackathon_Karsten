// Telas de cadastro: Máquinas (TEMPO-CM) e Matriz de Elementos (MTM).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { dec, inteiro, min4, numeroDe } from '../fmt.js';
import { Alternador, FiltroIntervalo, FiltroLista, ehTudo, recortar } from '../components/filtros.jsx';
import { Botao, Campo, Cartao, Entrada, Modal, Selo, Tabela, Vazio, useAvisar, useConfirmar, useErroApi } from '../components/ui.jsx';

function useLista(rota) {
  const [itens, setItens] = useState(null);
  const erroApi = useErroApi();
  const recarregar = useCallback(() => api.get(rota).then(setItens).catch(erroApi), [rota, erroApi]);
  useEffect(() => { recarregar(); }, [recarregar]);
  return [itens, recarregar];
}

function Ordenavel({ rotulo, campo, ordem, setOrdem, className }) {
  const ativo = ordem.campo === campo;
  return (
    <button className={`inline-flex items-center gap-1 uppercase ${className ?? ''}`} onClick={() => setOrdem({ campo, asc: ativo ? !ordem.asc : true })}>
      {rotulo}<span className={ativo ? 'text-accent' : 'opacity-30'}>{ativo && !ordem.asc ? '↓' : '↑'}</span>
    </button>
  );
}

function ordenar(lista, { campo, asc }) {
  return [...lista].sort((a, b) => {
    const x = a[campo], y = b[campo];
    const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'pt-BR', { numeric: true });
    return asc ? r : -r;
  });
}

// ======================================================================
// Filtros avançados de máquinas
// ======================================================================
const FILTROS_VAZIOS = { codigo: null, tipos: [], rpmModo: 'valores', rpms: [], rpmIntervalo: null, tempo: null };
const CONSULTA_VAZIA = { busca: '', filtros: FILTROS_VAZIOS, verInativas: false };
const codigoNum = (m) => Number.parseFloat(String(m.codigo).replace(',', '.'));
const faixa = (nums) => (nums.length ? [Math.min(...nums), Math.max(...nums)] : [0, 0]);
const unicos = (lista) => [...new Set(lista)];
const inteiroBR = (n) => String(Math.round(n));
const tempoBR = (n) => dec(n, 4);

function limitesDe(itens) {
  const ok = (n) => Number.isFinite(n);
  return {
    codigo: faixa(itens.map(codigoNum).filter(ok)),
    rpm: faixa(itens.map((m) => m.rpm).filter(ok)),
    tempo: faixa(itens.map((m) => m.tempo_por_metro).filter(ok)),
    tipos: unicos(itens.map((m) => m.tipo).filter(Boolean)).sort((x, y) => x.localeCompare(y, 'pt-BR')).map((t) => ({ valor: t, rotulo: t })),
    rpms: unicos(itens.map((m) => m.rpm).filter(ok)).sort((x, y) => x - y).map((v) => ({ valor: v, rotulo: inteiro(v) })),
  };
}

/**
 * Converte a consulta aplicada em um único predicado, montado UMA vez por busca:
 * o texto é normalizado e as listas viram Set antes de percorrer as máquinas.
 * Também devolve quantos filtros estão ativos (para o contador do botão).
 */
function montarConsulta({ busca, filtros: f, verInativas }, lim) {
  const testes = [];
  const q = busca.trim().toLowerCase();
  if (q) testes.push((m) => `${m.codigo} ${m.tipo} ${m.descricao}`.toLowerCase().includes(q));
  if (!verInativas) testes.push((m) => m.ativo !== false);

  let n = verInativas ? 1 : 0;
  const dentro = (campo, v, limites, ler) => {
    if (!v) return;
    const [lo, hi] = recortar(v, limites);
    if (ehTudo([lo, hi], limites)) return;
    n++; testes.push((m) => { const x = ler(m); return Number.isFinite(x) && x >= lo && x <= hi; });
  };
  const naLista = (valores, ler) => {
    if (!valores.length) return;
    const set = new Set(valores);
    n++; testes.push((m) => set.has(ler(m)));
  };
  dentro('codigo', f.codigo, lim.codigo, codigoNum);
  naLista(f.tipos, (m) => m.tipo);
  if (f.rpmModo === 'valores') naLista(f.rpms, (m) => m.rpm);
  else dentro('rpm', f.rpmIntervalo, lim.rpm, (m) => m.rpm);
  dentro('tempo', f.tempo, lim.tempo, (m) => m.tempo_por_metro);

  return { passa: (m) => testes.every((t) => t(m)), nAtivos: n };
}

function PainelFiltros({ id, aberto, consulta, setConsulta, lim, admin, aoLimpar, nAtivos }) {
  const { filtros } = consulta;
  const set = (campo) => (v) => setConsulta((c) => ({ ...c, filtros: { ...c.filtros, [campo]: v } }));
  return (
    <div id={id} inert={!aberto} className={`grid transition-[grid-template-rows] duration-200 ease-out ${aberto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
      <div className="min-h-0 overflow-hidden">
        <div className="grid gap-x-6 gap-y-5 border-b border-line bg-paper/60 p-4 sm:grid-cols-2">
          <FiltroIntervalo titulo="Código" limites={lim.codigo} valor={filtros.codigo} aoMudar={set('codigo')}
            formatar={inteiroBR} lerTexto={numeroDe} />
          <FiltroIntervalo titulo="Tempo/metro (min/m)" limites={lim.tempo} valor={filtros.tempo} aoMudar={set('tempo')}
            passo={0.0001} formatar={tempoBR} lerTexto={numeroDe} />
          <FiltroLista titulo="Tipo" opcoes={lim.tipos} selecionados={filtros.tipos} aoMudar={set('tipos')} placeholder="Todos os tipos" />
          {filtros.rpmModo === 'valores'
            ? <FiltroLista titulo="RPM padrão" opcoes={lim.rpms} selecionados={filtros.rpms} aoMudar={set('rpms')} placeholder="Todos os RPMs"
                acao={<Alternador rotulo="Modo do filtro de RPM" opcoes={MODOS_RPM} valor="valores" aoMudar={set('rpmModo')} />} />
            : <FiltroIntervalo titulo="RPM padrão" limites={lim.rpm} valor={filtros.rpmIntervalo} aoMudar={set('rpmIntervalo')}
                formatar={inteiroBR} lerTexto={numeroDe}
                acao={<Alternador rotulo="Modo do filtro de RPM" opcoes={MODOS_RPM} valor="intervalo" aoMudar={set('rpmModo')} />} />}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3 sm:col-span-2">
            {admin
              ? <label className="flex items-center gap-2 text-sm text-ink-2"><input type="checkbox" className="accent-accent" checked={consulta.verInativas}
                  onChange={(e) => setConsulta((c) => ({ ...c, verInativas: e.target.checked }))} /> Mostrar desativadas</label>
              : <span />}
            <div className="flex gap-2">
              <Botao type="button" tamanho="sm" variante="fantasma" onClick={aoLimpar}>Limpar filtros</Botao>
              <Botao type="submit" tamanho="sm">Buscar máquinas</Botao>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
const MODOS_RPM = [['valores', 'Valores'], ['intervalo', 'Intervalo']];

// ======================================================================
export function Maquinas({ usuario }) {
  const admin = usuario.papel === 'admin';
  // Admin sempre recebe também as desativadas; "Mostrar desativadas" vira um filtro local (sem nova requisição).
  const [itens, recarregar] = useLista(`/maquinas${admin ? '?inativas=1' : ''}`);
  // rascunho = o que está nos campos; aplicada = o que filtra a tabela. A filtragem só roda ao buscar.
  const [rascunho, setRascunho] = useState(CONSULTA_VAZIA);
  const [aplicada, setAplicada] = useState(CONSULTA_VAZIA);
  const [ordem, setOrdem] = useState({ campo: 'codigo', asc: true });
  const [editando, setEditando] = useState(null);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const avisar = useAvisar();
  const erroApi = useErroApi();
  const confirmar = useConfirmar();

  const lim = useMemo(() => limitesDe(itens ?? []), [itens]);
  const consulta = useMemo(() => montarConsulta(aplicada, lim), [aplicada, lim]);
  const filtradas = useMemo(() => (itens ?? []).filter(consulta.passa), [itens, consulta]);
  const visiveis = useMemo(() => ordenar(filtradas, ordem), [filtradas, ordem]); // reordenar não refiltra
  const nAtivos = consulta.nAtivos;
  const pendente = rascunho !== aplicada && JSON.stringify(rascunho) !== JSON.stringify(aplicada);
  const totalBase = (itens ?? []).filter((m) => aplicada.verInativas || m.ativo !== false).length;

  const buscar = (e) => { e?.preventDefault(); setAplicada(rascunho); };
  const limparFiltros = () => {
    const c = { ...rascunho, filtros: FILTROS_VAZIOS, verInativas: false };
    setRascunho(c); setAplicada(c);
  };

  async function desativar(m) {
    const ok = await confirmar({ titulo: `Desativar máquina ${m.codigo}?`, perigo: true, confirmar: 'Desativar',
      mensagem: `${m.tipo} ${m.descricao} deixará de aparecer para novas POs. É uma exclusão lógica: o registro continua no cadastro e pode ser reativado.` });
    if (!ok) return;
    try { await api.del(`/maquinas/${encodeURIComponent(m.codigo)}`); avisar(`Máquina ${m.codigo} desativada.`); recarregar(); } catch (e) { erroApi(e); }
  }
  async function reativar(m) {
    try { await api.post(`/maquinas/${encodeURIComponent(m.codigo)}/reativar`); avisar(`Máquina ${m.codigo} reativada.`); recarregar(); } catch (e) { erroApi(e); }
  }

  const sp = { ordem, setOrdem };
  return (
    <div className="flex flex-col gap-5">
      <Cabecalho titulo="Máquinas" sub="Cadastro TEMPO-CM: o tempo/metro de cada máquina define o elemento FIXO da ficha."
        acao={admin && <Botao onClick={() => setEditando({})}>+ Nova máquina</Botao>} />
      <Cartao corpoClassName="p-0">
        <form onSubmit={buscar} role="search" aria-label="Buscar máquinas">
          <div className="flex flex-wrap items-center gap-3 border-b border-line p-3">
            <Entrada value={rascunho.busca} onChange={(e) => setRascunho((c) => ({ ...c, busca: e.target.value }))}
              placeholder="Buscar por código, tipo ou modelo…" aria-label="Texto da busca" className="max-w-xs" />
            <Botao type="submit" tamanho="sm" variante={pendente ? 'primario' : 'secundario'}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              Buscar máquinas
            </Botao>
            <Botao type="button" variante={filtrosAbertos ? 'secundario' : 'fantasma'} tamanho="sm" aria-expanded={filtrosAbertos} aria-controls="filtros-maquinas"
              onClick={() => setFiltrosAbertos((v) => !v)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M4 6h16M7 12h10M10 18h4" /></svg>
              Filtros avançados
              {nAtivos > 0 && <span className="num rounded-full bg-accent px-1.5 text-[11px] leading-[18px] text-white">{nAtivos}</span>}
              <span className={`text-[10px] transition-transform ${filtrosAbertos ? 'rotate-180' : ''}`} aria-hidden>▼</span>
            </Botao>
            {pendente && <Selo tom="warn">alterações não aplicadas</Selo>}
            {!admin && <Selo>Somente leitura</Selo>}
          </div>
          <PainelFiltros id="filtros-maquinas" aberto={filtrosAbertos} consulta={rascunho} setConsulta={setRascunho} lim={lim}
            admin={admin} aoLimpar={limparFiltros} nAtivos={nAtivos} />
        </form>
        {itens === null ? <p className="p-6 text-sm text-ink-3">Carregando…</p> : !visiveis.length ? <div className="p-4"><Vazio>Nenhuma máquina encontrada.{nAtivos > 0 && <> <button className="text-accent hover:underline" onClick={limparFiltros}>Limpar filtros</button></>}</Vazio></div> : (
          <Tabela colunas={[
            { rotulo: <Ordenavel rotulo="Código" campo="codigo" {...sp} /> }, { rotulo: <Ordenavel rotulo="Tipo" campo="tipo" {...sp} /> },
            { rotulo: <Ordenavel rotulo="Descrição / modelo" campo="descricao" {...sp} /> },
            { rotulo: <Ordenavel rotulo="RPM padrão" campo="rpm" {...sp} />, className: 'text-right' },
            { rotulo: <Ordenavel rotulo="Tempo/metro (min/m)" campo="tempo_por_metro" {...sp} />, className: 'text-right' },
            ...(admin ? [{ rotulo: '', className: 'w-1' }] : []),
          ]}>
            {visiveis.map((m) => (
              <tr key={m.codigo} className={m.ativo === false ? 'text-ink-3' : ''}>
                <td className="num px-3 py-2.5 font-semibold">{m.codigo}</td>
                <td className="px-3 py-2.5">{m.tipo} {m.ativo === false && <Selo tom="warn">desativada</Selo>}</td>
                <td className="px-3 py-2.5">{m.descricao}</td>
                <td className="num px-3 py-2.5 text-right">{inteiro(m.rpm)}</td>
                <td className="num px-3 py-2.5 text-right">{dec(m.tempo_por_metro, 4)}</td>
                {admin && (
                  <td className="px-3 py-1.5 whitespace-nowrap">
                    {m.ativo === false ? <Botao tamanho="sm" variante="fantasma" onClick={() => reativar(m)}>Reativar</Botao> : <>
                      <Botao tamanho="sm" variante="fantasma" onClick={() => setEditando(m)} aria-label={`Editar máquina ${m.codigo}`}>✏ Editar</Botao>
                      <Botao tamanho="sm" variante="perigoSuave" onClick={() => desativar(m)} aria-label={`Desativar máquina ${m.codigo}`}>🗑</Botao>
                    </>}
                  </td>
                )}
              </tr>
            ))}
          </Tabela>
        )}
      </Cartao>
      <FormRegistro aberto={!!editando} aoFechar={() => setEditando(null)} aoSalvar={recarregar}
        titulo={editando?.codigo ? `Editar máquina ${editando.codigo}` : 'Nova máquina'}
        rota="/maquinas" chave="codigo" inicial={editando ?? {}}
        campos={[
          { nome: 'codigo', rotulo: 'Código', fixoAoEditar: true, placeholder: '4' },
          { nome: 'tipo', rotulo: 'Tipo / equipamento', placeholder: 'Interlock' },
          { nome: 'descricao', rotulo: 'Descrição / modelo', placeholder: 'Jack C4' },
          { nome: 'rpm', rotulo: 'RPM padrão', numero: true, placeholder: '5000' },
          { nome: 'tempo_por_metro', rotulo: 'Tempo por metro (min/m)', numero: true, placeholder: '0,0964' },
        ]} />
    </div>
  );
}

// ======================================================================
export function Elementos({ usuario }) {
  const admin = usuario.papel === 'admin';
  const [itens, recarregar] = useLista('/mtm');
  const [busca, setBusca] = useState('');
  const [editando, setEditando] = useState(null);
  const [importando, setImportando] = useState(false);
  const avisar = useAvisar();
  const erroApi = useErroApi();
  const confirmar = useConfirmar();
  const refArquivo = useRef(null);

  const visiveis = (itens ?? []).filter((e) => `${e.codigo} ${e.descricao}`.toLowerCase().includes(busca.toLowerCase()));
  const grupos = useMemo(() => {
    const g = new Map();
    visiveis.forEach((e) => { const k = e.codigo.split('.')[0]; g.set(k, [...(g.get(k) ?? []), e]); });
    return [...g.entries()];
  }, [visiveis]);

  async function remover(e) {
    const ok = await confirmar({ titulo: `Remover elemento ${e.codigo}?`, perigo: true, confirmar: 'Remover', mensagem: `"${e.descricao}" sairá da matriz MTM. Roteiros que usam ${e.codigo} passarão a acusar erro.` });
    if (!ok) return;
    try { await api.del(`/mtm/${encodeURIComponent(e.codigo)}`); avisar(`Elemento ${e.codigo} removido.`); recarregar(); } catch (err) { erroApi(err); }
  }

  async function importarCatalogo(arquivo) {
    if (!arquivo) return;
    const ok = await confirmar({ titulo: 'Importar planilha de cadastros?', confirmar: 'Importar',
      mensagem: `"${arquivo.name}" substituirá a matriz MTM e atualizará as máquinas (as que não estiverem no arquivo serão desativadas).` });
    if (!ok) return;
    const fd = new FormData(); fd.append('arquivo', arquivo);
    setImportando(true);
    try { const r = await api.post('/catalogo/importar', fd); avisar(`Importado: ${r.elementos} elementos e ${r.maquinas} máquinas.`); recarregar(); }
    catch (e) { erroApi(e); } finally { setImportando(false); }
  }

  return (
    <div className="flex flex-col gap-5">
      <Cabecalho titulo="Elementos MTM" sub="Matriz de elementos: código agrupador.elemento, descrição e tempo unitário em minutos."
        acao={admin && <div className="flex gap-2">
          <Botao variante="secundario" carregando={importando} onClick={() => refArquivo.current?.click()}>Importar Entradas (.ods/.xlsx)</Botao>
          <Botao onClick={() => setEditando({})}>+ Novo elemento</Botao>
          <input ref={refArquivo} type="file" hidden accept=".ods,.xlsx,.xls" onChange={(e) => { importarCatalogo(e.target.files[0]); e.target.value = ''; }} />
        </div>} />
      <Cartao corpoClassName="p-0">
        <div className="flex items-center gap-3 border-b border-line p-3">
          <Entrada value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar…" className="max-w-xs" />
          {!admin && <Selo>Somente leitura</Selo>}
        </div>
        {itens === null ? <p className="p-6 text-sm text-ink-3">Carregando…</p> : !visiveis.length ? <div className="p-4"><Vazio>Nenhum elemento.</Vazio></div> : (
          <Tabela colunas={[{ rotulo: 'Código', className: 'w-24' }, { rotulo: 'Descrição do elemento' }, { rotulo: 'Tempo (min)', className: 'text-right w-32' }, ...(admin ? [{ rotulo: '', className: 'w-1' }] : [])]}>
            {grupos.map(([g, els]) => [
              <tr key={`g${g}`} className="bg-paper"><td colSpan={admin ? 4 : 3} className="px-3 py-1.5 text-[12px] font-semibold tracking-wide text-ink-3 uppercase">Agrupador {g}</td></tr>,
              ...els.map((e) => (
                <tr key={e.codigo}>
                  <td className="num px-3 py-2.5 font-semibold text-accent">{e.codigo}</td>
                  <td className="px-3 py-2.5">{e.descricao}</td>
                  <td className="num px-3 py-2.5 text-right">{min4(e.tempo_min)}</td>
                  {admin && <td className="px-3 py-1.5 whitespace-nowrap">
                    <Botao tamanho="sm" variante="fantasma" onClick={() => setEditando(e)}>✏ Editar</Botao>
                    <Botao tamanho="sm" variante="perigoSuave" onClick={() => remover(e)} aria-label={`Remover ${e.codigo}`}>🗑</Botao>
                  </td>}
                </tr>
              )),
            ])}
          </Tabela>
        )}
      </Cartao>
      <FormRegistro aberto={!!editando} aoFechar={() => setEditando(null)} aoSalvar={recarregar}
        titulo={editando?.codigo ? `Editar elemento ${editando.codigo}` : 'Novo elemento MTM'}
        rota="/mtm" chave="codigo" inicial={editando ?? {}}
        campos={[
          { nome: 'codigo', rotulo: 'Código (agrupador.elemento)', fixoAoEditar: true, placeholder: '2.4' },
          { nome: 'descricao', rotulo: 'Descrição do elemento', placeholder: 'Apanhar peça e posicionar na mesa' },
          { nome: 'tempo_min', rotulo: 'Tempo (min)', numero: true, placeholder: '0,15' },
        ]} />
    </div>
  );
}

// ======================================================================
export function Cabecalho({ titulo, sub, acao }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-xl font-semibold">{titulo}</h1>{sub && <p className="text-sm text-ink-3">{sub}</p>}</div>
      {acao}
    </div>
  );
}

/** Modal genérico de criar/editar, com validação no servidor (Zod) exibida por campo. */
function FormRegistro({ aberto, aoFechar, aoSalvar, titulo, rota, chave, inicial, campos }) {
  const editando = !!inicial[chave];
  const [valores, setValores] = useState({});
  const [erros, setErros] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const avisar = useAvisar();

  useEffect(() => {
    if (!aberto) return;
    setErros([]);
    setValores(Object.fromEntries(campos.map((c) => [c.nome, inicial[c.nome] === undefined ? '' : c.numero ? String(inicial[c.nome]).replace('.', ',') : String(inicial[c.nome])])));
  }, [aberto]); // eslint-disable-line react-hooks/exhaustive-deps

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true); setErros([]);
    try {
      if (editando) await api.put(`${rota}/${encodeURIComponent(inicial[chave])}`, valores);
      else await api.post(rota, valores);
      avisar(editando ? 'Alterações salvas.' : 'Cadastro criado.');
      aoSalvar(); aoFechar();
    } catch (err) {
      setErros(err.erros?.length ? err.erros : [err.message]);
    } finally { setSalvando(false); }
  }

  return (
    <Modal aberto={aberto} titulo={titulo} aoFechar={aoFechar}
      rodape={<><Botao variante="secundario" onClick={aoFechar}>Cancelar</Botao><Botao type="submit" form="form-registro" carregando={salvando}>Salvar</Botao></>}>
      <form id="form-registro" onSubmit={salvar} className="flex flex-col gap-4">
        {campos.map((c) => (
          <Campo key={c.nome} rotulo={c.rotulo}>
            <Entrada value={valores[c.nome] ?? ''} disabled={editando && c.fixoAoEditar} placeholder={c.placeholder}
              inputMode={c.numero ? 'decimal' : undefined} className={c.numero ? 'num' : undefined}
              onChange={(e) => setValores((v) => ({ ...v, [c.nome]: e.target.value }))} />
          </Campo>
        ))}
        {erros.length > 0 && <ul className="rounded-md bg-bad-soft px-3 py-2 text-sm text-bad">{erros.map((x) => <li key={x}>• {x}</li>)}</ul>}
      </form>
    </Modal>
  );
}
