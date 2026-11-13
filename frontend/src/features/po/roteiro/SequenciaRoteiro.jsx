import { Botao } from '../../../components/ui/index.js';
import { CabecalhoColuna } from './CabecalhoColuna.jsx';
import { ItemRoteiro } from './ItemRoteiro.jsx';
import { moverPasso, mudarFrequencia, removerPasso } from './roteiro.js';

/**
 * Sequência do roteiro, alvo de arraste. arrastando = { origem: 'mtm' | 'roteiro', valor } | null;
 * alvo = índice onde o item vai cair (ou null). aoSoltar(pos) aplica o arraste.
 */
export function SequenciaRoteiro({ roteiro, setRoteiro, porCodigo, arrastando, setArrastando, alvo, setAlvo, aoSoltar }) {
  const terminar = () => { setArrastando(null); setAlvo(null); };
  const ultimo = roteiro.length - 1;
  return (
    <div className="flex flex-col p-4">
      <CabecalhoColuna titulo={`Sequência (${roteiro.length})`}>
        {roteiro.length > 0 && <Botao tamanho="sm" variante="fantasma" onClick={() => setRoteiro([])}>Limpar</Botao>}
      </CabecalhoColuna>
      <ol className={`flex min-h-[120px] flex-1 flex-col gap-1 rounded-md ${arrastando ? 'bg-accent-soft/40 outline-2 outline-dashed outline-accent/30' : ''}`}
        onDragOver={(e) => { e.preventDefault(); if (alvo === null) setAlvo(roteiro.length); }}
        onDrop={(e) => { e.preventDefault(); aoSoltar(alvo ?? roteiro.length); }}>
        {roteiro.map((p, i) => (
          <ItemRoteiro key={p.id} passo={p} indice={i} elemento={porCodigo[p.codigo]} primeiro={i === 0} ultimo={i === ultimo}
            indicador={!arrastando ? null : alvo === i ? 'acima' : alvo === i + 1 && i === ultimo ? 'abaixo' : null}
            aoIniciarArraste={() => setArrastando({ origem: 'roteiro', valor: p.id })} aoTerminarArraste={terminar}
            aoArrastarSobre={setAlvo} aoSoltar={() => aoSoltar(alvo ?? i)}
            aoMudarFrequencia={(v) => setRoteiro((r) => mudarFrequencia(r, p.id, v))}
            aoSubir={() => setRoteiro((r) => moverPasso(r, i, i - 1))}
            aoDescer={() => setRoteiro((r) => moverPasso(r, i, i + 1))}
            aoRemover={() => setRoteiro((r) => removerPasso(r, p.id))} />
        ))}
        {!roteiro.length && <li className="flex flex-1 items-center justify-center rounded-md border border-dashed border-line-2 px-4 py-8 text-center text-sm text-ink-3">Arraste elementos para cá, ou clique em ＋.</li>}
      </ol>
    </div>
  );
}
