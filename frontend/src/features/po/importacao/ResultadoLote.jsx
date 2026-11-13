import { min4 } from '../../../lib/fmt.js';
import { Botao, Cartao } from '../../../components/ui/index.js';
import { validasDoLote } from '../useOperacoesPO.js';

/** Lista das demandas lidas, com ações em lote para as válidas. */
export function ResultadoLote({ lote, ocupado, abrir, baixarTodas, enviarTodas, imprimirTodas }) {
  const validas = validasDoLote(lote).length;
  return (
    <Cartao titulo={`Resultado da importação · ${validas}/${lote.length} válidas`}
      acao={<div className="flex gap-2">
        <Botao tamanho="sm" variante="secundario" disabled={!validas} onClick={imprimirTodas}>Imprimir</Botao>
        <Botao tamanho="sm" variante="secundario" disabled={!validas} carregando={ocupado === 'enviar'} onClick={enviarTodas}>Enviar por e-mail</Botao>
        <Botao tamanho="sm" disabled={!validas} carregando={ocupado === 'baixar'} onClick={baixarTodas}>Baixar {validas > 1 ? `${validas} POs` : ''} .xlsx</Botao>
      </div>} corpoClassName="p-0">
      <ul className="divide-y divide-line">
        {lote.map((r, i) => <ItemLote key={i} resultado={r} aoAbrir={() => abrir(r.demanda)} />)}
      </ul>
    </Cartao>
  );
}

/** Uma demanda do lote: válida (resumo + TP) ou com erros (lista). */
function ItemLote({ resultado: r, aoAbrir }) {
  return (
    <li className="flex items-start gap-3 px-4 py-3 text-sm">
      <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${r.po ? 'bg-ok' : 'bg-bad'}`}>{r.po ? '✓' : '!'}</span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{r.demanda.titulo || '(sem título)'} <span className="font-normal text-ink-3">· {r.demanda.origem}</span></p>
        {r.po ? <p className="text-[13px] text-ink-3">{r.po.cabecalho.operacao || '—'} · máquina {r.po.equipamento.codigo} · {r.po.linhas.length - 1} elemento(s)</p>
          : <ul className="mt-0.5 text-[13px] text-bad">{r.erros.map((e) => <li key={e}>{e}</li>)}</ul>}
      </div>
      {r.po && <span className="num shrink-0 font-semibold text-accent">{min4(r.po.tp_min)}</span>}
      {r.demanda.roteiro && <Botao tamanho="sm" variante="fantasma" onClick={aoAbrir}>{r.po ? 'Abrir' : 'Corrigir'}</Botao>}
    </li>
  );
}
