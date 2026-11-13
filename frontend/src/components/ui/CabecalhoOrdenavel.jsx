import { alternarOrdem } from '../../lib/ordenacao.js';

/** Cabeçalho de coluna clicável que alterna a ordenação por `campo`. ordem = { campo, asc }. */
export function CabecalhoOrdenavel({ rotulo, campo, ordem, setOrdem, className }) {
  const ativo = ordem.campo === campo;
  return (
    <button className={`inline-flex items-center gap-1 uppercase ${className ?? ''}`} onClick={() => setOrdem(alternarOrdem(ordem, campo))}>
      {rotulo}<span className={ativo ? 'text-accent' : 'opacity-30'}>{ativo && !ordem.asc ? '↓' : '↑'}</span>
    </button>
  );
}

/** Gera colunas de <Tabela> ordenáveis: [{ rotulo, campo, className? }] -> colunas. */
export const colunasOrdenaveis = (defs, ordem, setOrdem) => defs.map(({ rotulo, campo, className }) => ({
  chave: campo, className,
  rotulo: <CabecalhoOrdenavel rotulo={rotulo} campo={campo} ordem={ordem} setOrdem={setOrdem} />,
}));
