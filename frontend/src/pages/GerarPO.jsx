import { useEffect, useMemo, useRef, useState } from 'react';
import { api, salvarArquivo } from '../api.js';
import { dec, min4, numeroDe } from '../fmt.js';
import FichaPO from '../components/FichaPO.jsx';
import { Botao, Campo, Cartao, Entrada, Selecao, Selo, Vazio, useAvisar, useErroApi } from '../components/ui.jsx';

const novoId = () => Math.random().toString(36).slice(2);
const FORM_VAZIO = { titulo: '', revisao: '00', operacao: '', familia: '', tamanho: '', medidas: '', pontos_cm: '', perimetro_m: '', cod_eqp: '', roteiro: [] };
const EXEMPLO_OFICIAL = {
  titulo: 'PO-SL-001', revisao: '00', operacao: 'Bainhar no corpo do SL - 1 lado', familia: 'Sobre-lençol', tamanho: 'Solteiro',
  medidas: '1,80 x 2,50', pontos_cm: '2,50', perimetro_m: '6,96', cod_eqp: '1',
  roteiro: ['2.1', '1.1', '3.1'].map((codigo) => ({ id: novoId(), codigo, frequencia: 1 })),
};

/** Converte a demanda vinda da API (números) para o estado do formulário (texto). */
function demandaParaForm(d) {
  const txt = (n) => (n === undefined || n === null || Number.isNaN(n) ? '' : String(n).replace('.', ','));
  return {
    ...FORM_VAZIO, ...d,
    pontos_cm: txt(d.pontos_cm), perimetro_m: txt(d.perimetro_m), cod_eqp: d.cod_eqp ?? '',
    roteiro: (d.roteiro || []).map((p) => ({ id: novoId(), codigo: p.codigo, frequencia: p.frequencia ?? 1 })),
  };
}

function formParaDemanda(f) {
  return {
    titulo: f.titulo.trim(), revisao: f.revisao.trim() || '00', operacao: f.operacao.trim(), familia: f.familia.trim(),
    tamanho: f.tamanho.trim(), medidas: f.medidas.trim(),
    pontos_cm: f.pontos_cm === '' ? undefined : numeroDe(f.pontos_cm),
    perimetro_m: numeroDe(f.perimetro_m), cod_eqp: f.cod_eqp,
    roteiro: f.roteiro.map((p) => ({ codigo: p.codigo, frequencia: numeroDe(p.frequencia) || 1 })),
  };
}

/** "2.1, 1.1x2; 3.1" -> [{codigo, frequencia}] (mesma regra do backend). */
function lerCodigos(texto) {
  const s = texto.replace(/\s*([x*×])\s*/gi, '$1');
  const sep = /[;|\n]/.test(s) ? /[;|\n]+/ : /[,\s]+/;
  return s.split(sep).map((t) => t.trim()).filter(Boolean).map((t) => {
    const m = t.match(/^(\d+[.,]\d+)(?:[x*×](\d+(?:[.,]\d+)?))?$/i);
    return { id: novoId(), codigo: (m ? m[1] : t).replace(',', '.'), frequencia: m?.[2] ? numeroDe(m[2]) : 1 };
  });
}

export default function GerarPO({ usuario, modo }) {
  const avisar = useAvisar();
  const erroApi = useErroApi();
  const [mtm, setMtm] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [form, setForm] = useState(FORM_VAZIO);
  const [aba, setAba] = useState('form');
  const [preview, setPreview] = useState({ estado: 'vazio' });
  const [lote, setLote] = useState(null);
  const [ocupado, setOcupado] = useState('');
  const [imprimir, setImprimir] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/mtm'), api.get('/maquinas')])
      .then(([m, q]) => { setMtm(m); setMaquinas(q); })
      .catch(erroApi);
  }, [erroApi]);

  // Pré-visualização ao vivo (debounce de 250 ms; respostas antigas são descartadas).
  const seq = useRef(0);
  useEffect(() => {
    const vazio = !form.perimetro_m && !form.cod_eqp && form.roteiro.length === 0;
    if (vazio) { setPreview({ estado: 'vazio' }); return; }
    const n = ++seq.current;
    setPreview((p) => ({ ...p, estado: 'calculando' }));
    const t = setTimeout(async () => {
      try {
        const po = await api.post('/po/preview', formParaDemanda(form));
        if (n === seq.current) setPreview({ estado: 'ok', po });
      } catch (e) {
        if (n === seq.current) setPreview({ estado: 'erro', erros: e.erros?.length ? e.erros : [e.message] });
      }
    }, 250);
    return () => clearTimeout(t);
  }, [form]);

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const maquinaSel = maquinas.find((m) => m.codigo === form.cod_eqp);

  // ---------- Ações sobre a PO atual ----------
  async function baixar(demandas) {
    setOcupado('baixar');
    try { salvarArquivo(await api.baixar('/po/exportar', { demandas })); avisar('Planilha gerada no layout do gabarito.'); }
    catch (e) { erroApi(e); } finally { setOcupado(''); }
  }

  async function enviar(demandas) {
    setOcupado('enviar');
    try {
      const r = await api.post('/po/enviar', { demandas });
      avisar(r.simulado ? `Modo local: ficha salva em backend/data/enviados (iria para ${r.enviadoPara}).` : `Enviado para ${r.enviadoPara}.`);
    } catch (e) { erroApi(e); } finally { setOcupado(''); }
  }

  function imprimirPOs(pos) {
    setImprimir(pos);
    setTimeout(() => { window.print(); setImprimir(null); }, 50);
  }

  // ---------- Importação de arquivos ----------
  async function importar(arquivos) {
    if (!arquivos?.length) return;
    const fd = new FormData();
    [...arquivos].forEach((a) => fd.append('arquivos', a));
    setOcupado('importar');
    try {
      const r = await api.post('/po/importar', fd);
      const todos = [...r.resultados, ...r.falhasLeitura.map((f) => ({ demanda: { origem: f.origem, titulo: '' }, erros: f.erros }))];
      setLote(todos);
      const validas = todos.filter((x) => x.po);
      if (todos.length === 1 && validas.length === 1) {
        setForm(demandaParaForm(todos[0].demanda));
        setAba('form');
        avisar(`"${todos[0].demanda.origem}" carregado no formulário.`);
      } else {
        avisar(`${todos.length} demanda(s) lida(s): ${validas.length} válida(s), ${todos.length - validas.length} com erro.`, validas.length === todos.length ? 'ok' : 'warn');
      }
    } catch (e) { erroApi(e); } finally { setOcupado(''); }
  }

  const demandaAtual = formParaDemanda(form);
  const poValida = preview.estado === 'ok' ? preview.po : null;

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,600px)]">
      {/* ================= ENTRADA ================= */}
      <div className="no-print flex min-w-0 flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Gerar Ficha PO</h1>
            <p className="text-sm text-ink-3">Preencha, monte o roteiro ou importe arquivos. A ficha recalcula enquanto você digita.</p>
          </div>
          <div className="flex gap-2">
            <Botao variante="secundario" tamanho="sm" onClick={() => { setForm(EXEMPLO_OFICIAL); setAba('form'); }}>Carregar exemplo oficial</Botao>
            <Botao variante="fantasma" tamanho="sm" onClick={() => setForm(FORM_VAZIO)}>Limpar</Botao>
          </div>
        </div>

        <div role="tablist" className="flex gap-1 rounded-lg border border-line bg-card p-1 text-sm">
          {[['form', 'Formulário'], ['arquivo', `Importar arquivos${lote ? ` (${lote.length})` : ''}`]].map(([id, rotulo]) => (
            <button key={id} role="tab" aria-selected={aba === id} onClick={() => setAba(id)}
              className={`flex-1 rounded-md px-3 py-2 font-medium transition-colors ${aba === id ? 'bg-accent text-white' : 'text-ink-2 hover:bg-paper'}`}>{rotulo}</button>
          ))}
        </div>

        {aba === 'form' ? (
          <>
            <Cartao titulo="Produto e operação">
              <div className="grid gap-4 sm:grid-cols-6">
                <Campo rotulo="Título da PO" className="sm:col-span-4"><Entrada value={form.titulo} onChange={set('titulo')} placeholder="PO-SL-001" /></Campo>
                <Campo rotulo="Revisão" className="sm:col-span-2"><Entrada value={form.revisao} onChange={set('revisao')} placeholder="00" /></Campo>
                <Campo rotulo="Operação" className="sm:col-span-6"><Entrada value={form.operacao} onChange={set('operacao')} placeholder="Bainhar no corpo do SL - 1 lado" /></Campo>
                <Campo rotulo="Agrupamento família" className="sm:col-span-2"><Entrada value={form.familia} onChange={set('familia')} placeholder="Sobre-lençol" /></Campo>
                <Campo rotulo="Tamanho" className="sm:col-span-2"><Entrada value={form.tamanho} onChange={set('tamanho')} placeholder="Solteiro" /></Campo>
                <Campo rotulo="Medidas da peça (m)" className="sm:col-span-2"><Entrada value={form.medidas} onChange={set('medidas')} placeholder="1,80 x 2,50" /></Campo>
                <Campo rotulo="Pontos/cm" className="sm:col-span-2"><Entrada inputMode="decimal" className="num" value={form.pontos_cm} onChange={set('pontos_cm')} placeholder="2,50" /></Campo>
                <Campo rotulo="Perímetro de costura (m)" className="sm:col-span-2"><Entrada inputMode="decimal" className="num" value={form.perimetro_m} onChange={set('perimetro_m')} placeholder="6,96" /></Campo>
                <Campo rotulo="Máquina" className="sm:col-span-2"
                  dica={maquinaSel ? `${maquinaSel.descricao} · ${dec(maquinaSel.tempo_por_metro, 4)} min/m · ${maquinaSel.rpm} RPM` : 'Cadastro TEMPO-CM'}>
                  <Selecao value={form.cod_eqp} onChange={set('cod_eqp')}>
                    <option value="">Selecione…</option>
                    {maquinas.map((m) => <option key={m.codigo} value={m.codigo}>{m.codigo} · {m.tipo} {m.descricao && `(${m.descricao})`}</option>)}
                  </Selecao>
                </Campo>
              </div>
            </Cartao>
            <MontadorRoteiro mtm={mtm} roteiro={form.roteiro} setRoteiro={(r) => setForm((f) => ({ ...f, roteiro: typeof r === 'function' ? r(f.roteiro) : r }))} />
          </>
        ) : (
          <Importacao ocupado={ocupado} importar={importar} lote={lote}
            abrir={(d) => { setForm(demandaParaForm(d)); setAba('form'); }}
            baixarTodas={() => baixar(lote.filter((x) => x.po).map((x) => x.demanda))}
            enviarTodas={() => enviar(lote.filter((x) => x.po).map((x) => x.demanda))}
            imprimirTodas={() => imprimirPOs(lote.filter((x) => x.po).map((x) => x.po))} />
        )}
      </div>

      {/* ================= PRÉ-VISUALIZAÇÃO ================= */}
      <div className="min-w-0 xl:sticky xl:top-[76px] xl:self-start">
        <Cartao className="print-area no-print"
          titulo={<span className="flex items-center gap-2">Ficha PO
            {preview.estado === 'calculando' && <Selo>calculando…</Selo>}
            {preview.estado === 'ok' && <Selo tom="ok">✓ válida</Selo>}
            {preview.estado === 'erro' && <Selo tom="bad">{preview.erros.length} pendência(s)</Selo>}</span>}
          acao={poValida && <span className="text-right"><span className="block text-[11px] font-semibold tracking-wide text-ink-3 uppercase">TP</span><span className="num text-lg font-semibold text-accent">{min4(poValida.tp_min)} min</span></span>}>
          {preview.estado === 'vazio' && <Vazio>Preencha os dados, monte o roteiro ou clique em <b>Carregar exemplo oficial</b>.</Vazio>}
          {preview.estado === 'erro' && (
            <ul className="mb-4 flex flex-col gap-1.5 rounded-md border border-bad/20 bg-bad-soft px-4 py-3 text-sm text-bad">
              {preview.erros.map((e) => <li key={e}>• {e}</li>)}
            </ul>
          )}
          {preview.po && (
            <div className={preview.estado !== 'ok' ? 'opacity-40 transition-opacity' : 'transition-opacity'}>
              <div className="overflow-x-auto"><div className="min-w-[520px]"><FichaPO po={preview.po} /></div></div>
              <MemoriaCalculo po={preview.po} />
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
            <Botao disabled={!poValida} carregando={ocupado === 'baixar'} onClick={() => baixar([demandaAtual])}>Baixar .xlsx</Botao>
            <Botao variante="secundario" disabled={!poValida} onClick={() => imprimirPOs([poValida])}>Imprimir / PDF</Botao>
            <Botao variante="secundario" disabled={!poValida} carregando={ocupado === 'enviar'} onClick={() => enviar([demandaAtual])}>Enviar para meu e-mail</Botao>
          </div>
          <p className="mt-2 text-xs text-ink-3">O e-mail vai sempre para <b>{usuario.email}</b>{modo === 'local' && ' (modo local: simulado)'}.</p>
        </Cartao>
      </div>

      {/* Área usada só na impressão (uma ou várias fichas) */}
      <div className="print-only">
        {(imprimir || (poValida ? [poValida] : [])).map((po, i) => <div key={i} className="ficha-bloco"><FichaPO po={po} /></div>)}
      </div>
    </div>
  );
}

function MemoriaCalculo({ po }) {
  const fixo = po.linhas[0];
  const mtm = po.linhas.slice(1);
  return (
    <details className="mt-3 rounded-md border border-line bg-paper px-3 py-2 text-[13px] text-ink-2" open>
      <summary className="cursor-pointer font-medium text-ink">Memória de cálculo</summary>
      <div className="num mt-2 flex flex-col gap-1">
        <span>FIXO = {dec(po.cabecalho.perimetro_m)} m × {dec(po.equipamento.tempo_por_metro, 4)} min/m = <b>{min4(fixo.tempo_min)}</b></span>
        <span>MTM  = {mtm.map((l) => (l.frequencia !== 1 ? `${min4(l.tempo_min)}×${l.frequencia}` : min4(l.tempo_min))).join(' + ') || '0'} = <b>{min4(mtm.reduce((s, l) => s + l.tempo_min * l.frequencia, 0))}</b></span>
        <span>TP   = FIXO + MTM = <b className="text-accent">{min4(po.tp_min)} min</b></span>
      </div>
    </details>
  );
}

// ======================================================================
// Montador do roteiro: arrastar da matriz MTM, reordenar, frequência, digitar códigos
// ======================================================================
function MontadorRoteiro({ mtm, roteiro, setRoteiro }) {
  const [busca, setBusca] = useState('');
  const [codigos, setCodigos] = useState('');
  const [arrastando, setArrastando] = useState(null); // { origem: 'mtm'|'roteiro', valor }
  const [alvo, setAlvo] = useState(null);
  const [selecao, setSelecao] = useState(() => new Set()); // códigos selecionados na matriz
  const ancora = useRef(null); // último elemento clicado (base do Shift + clique)
  const porCodigo = useMemo(() => Object.fromEntries(mtm.map((e) => [e.codigo, e])), [mtm]);
  const filtrados = mtm.filter((e) => `${e.codigo} ${e.descricao}`.toLowerCase().includes(busca.toLowerCase()));

  const adicionar = (codigos, pos = roteiro.length) => {
    const lista = (Array.isArray(codigos) ? codigos : [codigos]).map((codigo) => ({ id: novoId(), codigo, frequencia: 1 }));
    setRoteiro((r) => [...r.slice(0, pos), ...lista, ...r.slice(pos)]);
  };

  // Seleção na matriz: clique simples = só ele; Ctrl/⌘ + clique = alterna; Shift + clique = intervalo a partir da âncora.
  const clicarElemento = (e, codigo) => {
    const codigosVisiveis = filtrados.map((x) => x.codigo);
    if (e.shiftKey && ancora.current && codigosVisiveis.includes(ancora.current)) {
      const a = codigosVisiveis.indexOf(ancora.current);
      const b = codigosVisiveis.indexOf(codigo);
      const intervalo = codigosVisiveis.slice(Math.min(a, b), Math.max(a, b) + 1);
      setSelecao((s) => ((e.ctrlKey || e.metaKey) ? new Set([...s, ...intervalo]) : new Set(intervalo)));
      return; // a âncora se mantém, como em gerenciadores de arquivos
    }
    if (e.ctrlKey || e.metaKey) {
      setSelecao((s) => { const n = new Set(s); n.has(codigo) ? n.delete(codigo) : n.add(codigo); return n; });
    } else {
      setSelecao((s) => (s.size === 1 && s.has(codigo) ? new Set() : new Set([codigo])));
    }
    ancora.current = codigo;
  };
  // Mantém a ordem da matriz ao adicionar/arrastar vários.
  const selecionadosEmOrdem = mtm.map((x) => x.codigo).filter((c) => selecao.has(c));
  const limparSelecao = () => { setSelecao(new Set()); ancora.current = null; };
  const mover = (de, para) => setRoteiro((r) => {
    if (para < 0 || para >= r.length) return r;
    const c = [...r]; const [x] = c.splice(de, 1); c.splice(para, 0, x); return c;
  });
  const soltar = (pos) => {
    if (!arrastando) return;
    if (arrastando.origem === 'mtm') adicionar(arrastando.valor, pos);
    else {
      const de = roteiro.findIndex((p) => p.id === arrastando.valor);
      mover(de, pos > de ? pos - 1 : pos);
    }
    setArrastando(null); setAlvo(null);
  };
  const tempoTotalMTM = roteiro.reduce((s, p) => s + (porCodigo[p.codigo]?.tempo_min ?? 0) * (numeroDe(p.frequencia) || 0), 0);

  return (
    <Cartao titulo="Roteiro de operações (elementos MTM)" acao={<span className="num text-[13px] text-ink-3">Σ MTM {min4(tempoTotalMTM)} min</span>} corpoClassName="p-0">
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* Catálogo */}
        <div className="border-b border-line p-4 md:border-r md:border-b-0">
          <div className="mb-2 flex min-h-7 items-center justify-between gap-2">
            <p className="text-[12px] font-semibold tracking-wide text-ink-2 uppercase">Matriz de elementos</p>
            {selecao.size > 0 && (
              <span className="flex items-center gap-1">
                <Botao tamanho="sm" onClick={() => { adicionar(selecionadosEmOrdem); limparSelecao(); }}>Adicionar {selecao.size}</Botao>
                <Botao tamanho="sm" variante="fantasma" onClick={limparSelecao}>Limpar</Botao>
              </span>
            )}
          </div>
          <Entrada value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar código ou descrição…" className="mb-2" />
          <ul className="flex max-h-[340px] flex-col gap-1 overflow-y-auto pr-1" tabIndex={-1} aria-multiselectable="true" role="listbox"
            onKeyDown={(ev) => {
              if (ev.key === 'Escape') limparSelecao();
              if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'a') { ev.preventDefault(); setSelecao(new Set(filtrados.map((x) => x.codigo))); }
            }}>
            {filtrados.map((e) => {
              const sel = selecao.has(e.codigo);
              return (
              <li key={e.codigo} draggable role="option" aria-selected={sel}
                onClick={(ev) => clicarElemento(ev, e.codigo)}
                onDragStart={(ev) => {
                  // Arrastar um item selecionado leva toda a seleção; arrastar um não selecionado leva só ele.
                  const valor = sel ? selecionadosEmOrdem : [e.codigo];
                  ev.dataTransfer.effectAllowed = 'copy';
                  setArrastando({ origem: 'mtm', valor });
                }}
                onDragEnd={() => { setArrastando(null); setAlvo(null); }}
                className={`group flex cursor-grab items-center gap-2 rounded-md border px-2.5 py-2 text-sm select-none active:cursor-grabbing ${sel ? 'border-accent bg-accent-soft' : 'border-line bg-white hover:border-accent/40 hover:bg-accent-soft/50'}`}>
                <span className="num w-9 shrink-0 font-semibold text-accent">{e.codigo}</span>
                <span className="min-w-0 flex-1 truncate" title={e.descricao}>{e.descricao}</span>
                <span className="num shrink-0 text-[12px] text-ink-3">{min4(e.tempo_min)}</span>
                <button onClick={(ev) => { ev.stopPropagation(); adicionar(e.codigo); }} className="shrink-0 rounded px-1.5 text-accent hover:bg-accent hover:text-white" aria-label={`Adicionar ${e.codigo}`}>＋</button>
              </li>
              );
            })}
            {!filtrados.length && <li className="py-4 text-center text-sm text-ink-3">Nenhum elemento.</li>}
          </ul>
          <p className="mt-2 text-[11px] text-ink-3">Ctrl + clique seleciona vários · Shift + clique seleciona um intervalo · arraste a seleção para a sequência.</p>
        </div>

        {/* Roteiro */}
        <div className="flex flex-col p-4">
          <div className="mb-2 flex min-h-7 items-center justify-between gap-2">
            <p className="text-[12px] font-semibold tracking-wide text-ink-2 uppercase">Sequência ({roteiro.length})</p>
            {roteiro.length > 0 && <Botao tamanho="sm" variante="fantasma" onClick={() => setRoteiro([])}>Limpar</Botao>}
          </div>
          <ol className={`flex min-h-[120px] flex-1 flex-col gap-1 rounded-md ${arrastando ? 'bg-accent-soft/40 outline-2 outline-dashed outline-accent/30' : ''}`}
            onDragOver={(e) => { e.preventDefault(); if (alvo === null) setAlvo(roteiro.length); }}
            onDrop={(e) => { e.preventDefault(); soltar(alvo ?? roteiro.length); }}>
            {roteiro.map((p, i) => {
              const el = porCodigo[p.codigo];
              return (
                <li key={p.id} draggable onDragStart={() => setArrastando({ origem: 'roteiro', valor: p.id })} onDragEnd={() => { setArrastando(null); setAlvo(null); }}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setAlvo(e.clientY < r.top + r.height / 2 ? i : i + 1); }}
                  onDrop={(e) => { e.preventDefault(); e.stopPropagation(); soltar(alvo ?? i); }}
                  className={`relative flex items-center gap-2 rounded-md border bg-white px-2 py-1.5 text-sm ${el ? 'border-line' : 'border-bad/40 bg-bad-soft'}`}>
                  {alvo === i && arrastando && <span className="absolute -top-[3px] right-0 left-0 h-[3px] rounded bg-accent" />}
                  {alvo === i + 1 && i === roteiro.length - 1 && arrastando && <span className="absolute right-0 -bottom-[3px] left-0 h-[3px] rounded bg-accent" />}
                  <span className="cursor-grab px-0.5 text-ink-3 select-none" aria-hidden>⋮⋮</span>
                  <span className="num w-5 text-right text-[12px] text-ink-3">{i + 1}</span>
                  <span className="num w-9 shrink-0 font-semibold text-accent">{p.codigo}</span>
                  <span className="line-clamp-2 min-w-0 flex-1 leading-snug" title={el?.descricao}>{el?.descricao ?? 'código não existe na matriz'}</span>
                  <label className="flex items-center gap-1 text-[12px] text-ink-3" title="Frequência">
                    ×<input value={p.frequencia} inputMode="decimal" aria-label={`Frequência do elemento ${p.codigo}`}
                      onChange={(e) => setRoteiro((r) => r.map((x) => (x.id === p.id ? { ...x, frequencia: e.target.value } : x)))}
                      className="num h-7 w-11 rounded border border-line-2 px-1 text-center text-[13px] text-ink focus:border-accent focus:outline-none" />
                  </label>
                  <span className="flex shrink-0">
                    <button onClick={() => mover(i, i - 1)} disabled={i === 0} className="rounded px-1 text-ink-3 hover:bg-paper disabled:opacity-30" aria-label="Subir">↑</button>
                    <button onClick={() => mover(i, i + 1)} disabled={i === roteiro.length - 1} className="rounded px-1 text-ink-3 hover:bg-paper disabled:opacity-30" aria-label="Descer">↓</button>
                    <button onClick={() => setRoteiro((r) => r.filter((x) => x.id !== p.id))} className="rounded px-1 text-ink-3 hover:bg-bad-soft hover:text-bad" aria-label="Remover">✕</button>
                  </span>
                </li>
              );
            })}
            {!roteiro.length && <li className="flex flex-1 items-center justify-center rounded-md border border-dashed border-line-2 px-4 py-8 text-center text-sm text-ink-3">Arraste elementos para cá, clique em ＋ ou digite os códigos abaixo.</li>}
          </ol>
          <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); const r = lerCodigos(codigos); if (r.length) { setRoteiro(r); setCodigos(''); } }}>
            <Entrada value={codigos} onChange={(e) => setCodigos(e.target.value)} placeholder="Digitar códigos: 2.1, 1.1, 3.1 (aceita 2.1x2)" className="num" aria-label="Digitar códigos MTM" />
            <Botao variante="secundario" type="submit" disabled={!codigos.trim()}>Aplicar</Botao>
          </form>
        </div>
      </div>
    </Cartao>
  );
}

// ======================================================================
// Importação: arraste 1..50 arquivos (txt, json, csv, xlsx, ods)
// ======================================================================
const MODELOS = {
  'demanda_exemplo.txt': ['text/plain', 'Título: PO-SL-001\nREV: 00\nOperação: "Bainhar no corpo do SL - 1 lado"\nAgrupamento família: Sobre-lençol\nTamanho: Solteiro\nMedidas da peça (em m): 1,80 x 2,50\nPontos/cm: 2,50\nPerímetro costura (em m): 6,96\nCód. Eqp: 1\nElementos: 2.1, 1.1, 3.1\n'],
  'demanda_exemplo.json': ['application/json', JSON.stringify({ titulo: 'PO-SL-001', revisao: '00', operacao: 'Bainhar no corpo do SL - 1 lado', familia: 'Sobre-lençol', tamanho: 'Solteiro', medidas: '1,80 x 2,50', pontos_cm: 2.5, perimetro_m: 6.96, cod_eqp: 1, roteiro: ['2.1', '1.1', '3.1'] }, null, 2)],
  'lote_exemplo.csv': ['text/csv', 'titulo;revisao;operacao;familia;tamanho;medidas;pontos_cm;perimetro_m;cod_eqp;elementos\nPO-SL-001;00;Bainhar no corpo do SL - 1 lado;Sobre-lençol;Solteiro;1,80 x 2,50;2,50;6,96;1;2.1, 1.1, 3.1\nPO-SL-002;00;Bainhar no corpo do SL - 1 lado;Sobre-lençol;Casal;2,30 x 2,50;2,50;7,96;1;2.1, 1.1, 3.1\nPO-SL-003;00;Costurar elástico;Sobre-lençol;Queen;2,40 x 2,60;2,50;8,20;2;2.1, 5.2x4, 1.1, 3.1\n'],
};

function Importacao({ ocupado, importar, lote, abrir, baixarTodas, enviarTodas, imprimirTodas }) {
  const [sobre, setSobre] = useState(false);
  const ref = useRef(null);
  const validas = lote?.filter((x) => x.po).length ?? 0;
  const baixarModelo = (nome) => {
    const [tipo, conteudo] = MODELOS[nome];
    salvarArquivo({ blob: new Blob([conteudo], { type: tipo }), nome });
  };
  return (
    <>
      <Cartao titulo="Importar demandas">
        <div onDragOver={(e) => { e.preventDefault(); setSobre(true); }} onDragLeave={() => setSobre(false)}
          onDrop={(e) => { e.preventDefault(); setSobre(false); importar(e.dataTransfer.files); }}
          onClick={() => ref.current?.click()} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && ref.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${sobre ? 'border-accent bg-accent-soft' : 'border-line-2 hover:border-accent/50 hover:bg-paper'}`}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-accent" aria-hidden><path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <p className="font-medium">{ocupado === 'importar' ? 'Lendo arquivos…' : 'Arraste arquivos aqui ou clique para escolher'}</p>
          <p className="text-[13px] text-ink-3">.txt (formato oficial) · .json · .csv · .xlsx · .ods — vários de uma vez, várias demandas por arquivo</p>
          <input ref={ref} type="file" multiple hidden accept=".txt,.json,.csv,.xlsx,.xls,.ods" onChange={(e) => { importar(e.target.files); e.target.value = ''; }} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-3">
          Modelos:
          {Object.keys(MODELOS).map((n) => <button key={n} onClick={() => baixarModelo(n)} className="num text-accent hover:underline">{n}</button>)}
        </div>
      </Cartao>

      {lote && (
        <Cartao titulo={`Resultado da importação · ${validas}/${lote.length} válidas`}
          acao={<div className="flex gap-2">
            <Botao tamanho="sm" variante="secundario" disabled={!validas} onClick={imprimirTodas}>Imprimir</Botao>
            <Botao tamanho="sm" variante="secundario" disabled={!validas} carregando={ocupado === 'enviar'} onClick={enviarTodas}>Enviar por e-mail</Botao>
            <Botao tamanho="sm" disabled={!validas} carregando={ocupado === 'baixar'} onClick={baixarTodas}>Baixar {validas > 1 ? `${validas} POs` : ''} .xlsx</Botao>
          </div>} corpoClassName="p-0">
          <ul className="divide-y divide-line">
            {lote.map((r, i) => (
              <li key={i} className="flex items-start gap-3 px-4 py-3 text-sm">
                <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${r.po ? 'bg-ok' : 'bg-bad'}`}>{r.po ? '✓' : '!'}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{r.demanda.titulo || '(sem título)'} <span className="font-normal text-ink-3">· {r.demanda.origem}</span></p>
                  {r.po ? <p className="text-[13px] text-ink-3">{r.po.cabecalho.operacao || '—'} · máquina {r.po.equipamento.codigo} · {r.po.linhas.length - 1} elemento(s)</p>
                    : <ul className="mt-0.5 text-[13px] text-bad">{r.erros.map((e) => <li key={e}>{e}</li>)}</ul>}
                </div>
                {r.po && <span className="num shrink-0 font-semibold text-accent">{min4(r.po.tp_min)}</span>}
                {r.demanda.roteiro && <Botao tamanho="sm" variante="fantasma" onClick={() => abrir(r.demanda)}>{r.po ? 'Abrir' : 'Corrigir'}</Botao>}
              </li>
            ))}
          </ul>
        </Cartao>
      )}
    </>
  );
}
