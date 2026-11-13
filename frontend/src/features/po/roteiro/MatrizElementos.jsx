import { useMemo, useState } from 'react';
import { Botao, Entrada } from '../../../components/ui/index.js';
import { filtrarElementos } from '../../mtm/elementos.js';
import { CabecalhoColuna } from './CabecalhoColuna.jsx';
import { ItemMatriz } from './ItemMatriz.jsx';
import { useSelecaoMatriz } from './useSelecaoMatriz.js';

/**
 * Catálogo de elementos com busca e seleção múltipla.
 * aoAdicionar(codigos) acrescenta ao fim; aoArrastar(codigos | null) informa o que está sendo arrastado.
 */
export function MatrizElementos({ mtm, aoAdicionar, aoArrastar }) {
  const [busca, setBusca] = useState('');
  const filtrados = filtrarElementos(mtm, busca);
  const visiveis = filtrados.map((x) => x.codigo);
  const todos = useMemo(() => mtm.map((x) => x.codigo), [mtm]);
  const sel = useSelecaoMatriz(visiveis, todos);

  const aoTeclar = (ev) => {
    if (ev.key === 'Escape') sel.limpar();
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'a') { ev.preventDefault(); sel.selecionarVisiveis(); }
  };

  return (
    <div className="border-b border-line p-4 md:border-r md:border-b-0">
      <CabecalhoColuna titulo="Matriz de elementos">
        {sel.selecao.size > 0 && (
          <span className="flex items-center gap-1">
            <Botao tamanho="sm" onClick={() => { aoAdicionar(sel.emOrdem); sel.limpar(); }}>Adicionar {sel.selecao.size}</Botao>
            <Botao tamanho="sm" variante="fantasma" onClick={sel.limpar}>Limpar</Botao>
          </span>
        )}
      </CabecalhoColuna>
      <Entrada value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar código ou descrição…" className="mb-2" />
      <ul className="flex max-h-[340px] flex-col gap-1 overflow-y-auto pr-1" tabIndex={-1} aria-multiselectable="true" role="listbox" onKeyDown={aoTeclar}>
        {filtrados.map((e) => {
          const selecionado = sel.selecao.has(e.codigo);
          return (
            <ItemMatriz key={e.codigo} elemento={e} selecionado={selecionado}
              aoClicar={(ev) => sel.clicar(ev, e.codigo)}
              // Arrastar um item selecionado leva toda a seleção; arrastar um não selecionado leva só ele.
              aoIniciarArraste={() => aoArrastar(selecionado ? sel.emOrdem : [e.codigo])}
              aoTerminarArraste={() => aoArrastar(null)}
              aoAdicionar={() => aoAdicionar([e.codigo])} />
          );
        })}
        {!filtrados.length && <li className="py-4 text-center text-sm text-ink-3">Nenhum elemento.</li>}
      </ul>
    </div>
  );
}
